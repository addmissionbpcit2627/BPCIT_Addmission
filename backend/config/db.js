const { Pool, types } = require('pg');
require('dotenv').config();

// Bypass self-signed SSL/TLS verification for database poolers (e.g. Supabase)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Parse bigint columns (OID 20) as integers to prevent string concatenation bugs.
types.setTypeParser(20, (val) => parseInt(val, 10));

// Helper to convert queries from MySQL style (?) to Postgres style ($1, $2)
// Also handles SHOW COLUMNS mapping to information_schema
// Also automatically appends RETURNING id for INSERT queries if not already present
function translateQuery(sql, params) {
  let finalSql = sql;
  
  // 1. Translate SHOW COLUMNS FROM <table> LIKE '<column>' to PostgreSQL
  if (finalSql.trim().toUpperCase().startsWith('SHOW COLUMNS')) {
    const match = finalSql.match(/SHOW\s+COLUMNS\s+FROM\s+(\w+)\s+LIKE\s+'([\w_]+)'/i);
    if (match) {
      const [, table, column] = match;
      finalSql = `SELECT column_name FROM information_schema.columns WHERE table_name = '${table.toLowerCase()}' AND column_name = '${column.toLowerCase()}'`;
    }
  }

  // 2. Translate CREATE DATABASE / USE - ignore/nop
  if (finalSql.trim().toUpperCase().startsWith('CREATE DATABASE') || finalSql.trim().toUpperCase().startsWith('USE ')) {
    return { sql: 'SELECT 1 AS dummy', params: [] };
  }

  // 3. Auto-convert types in CREATE TABLE/ALTER TABLE statements
  if (finalSql.trim().toUpperCase().startsWith('CREATE TABLE') || finalSql.trim().toUpperCase().startsWith('ALTER TABLE')) {
    finalSql = finalSql
      .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/ig, 'SERIAL PRIMARY KEY')
      .replace(/TINYINT/ig, 'SMALLINT')
      .replace(/ENUM\([^)]+\)/ig, 'VARCHAR(50)')
      .replace(/ON\s+UPDATE\s+CURRENT_TIMESTAMP/ig, '')
      .replace(/UNIQUE\s+KEY\s+([\w_]+)\s*\(([^)]+)\)/ig, 'CONSTRAINT $1 UNIQUE ($2)');
  }

  // 4. Translate placeholders
  if (!params || !Array.isArray(params)) {
    return { sql: finalSql, params: params || [] };
  }

  let pgSql = '';
  const pgParams = [];
  let paramIndex = 1;

  const parts = finalSql.split('?');
  for (let i = 0; i < parts.length - 1; i++) {
    pgSql += parts[i];
    const val = params[i];
    
    if (Array.isArray(val)) {
      if (val.length === 0) {
        pgSql += 'NULL';
      } else {
        const placeholders = [];
        for (const item of val) {
          placeholders.push(`$${paramIndex++}`);
          pgParams.push(item);
        }
        pgSql += placeholders.join(', ');
      }
    } else {
      pgSql += `$${paramIndex++}`;
      pgParams.push(val);
    }
  }
  pgSql += parts[parts.length - 1];

  // 5. Append RETURNING id to INSERT queries
  const trimmed = pgSql.trim().toUpperCase();
  if (trimmed.startsWith('INSERT INTO ') && !trimmed.includes(' RETURNING ')) {
    pgSql += ' RETURNING id';
  }

  return { sql: pgSql, params: pgParams };
}

// Helper to format the PG result to match mysql2 return structure
function formatResult(pgSql, pgResult) {
  const isSelect = pgSql.trim().toUpperCase().startsWith('SELECT') || pgSql.trim().toUpperCase().startsWith('SHOW');
  
  if (isSelect) {
    // MySQL returns array of rows as the first element
    return [pgResult.rows, pgResult.fields];
  } else {
    // Non-SELECT (INSERT, UPDATE, DELETE, CREATE, etc.)
    const insertId = pgResult.rows && pgResult.rows[0] ? pgResult.rows[0].id : null;
    const affectedRows = pgResult.rowCount;
    const okPacket = {
      insertId,
      affectedRows,
      changedRows: affectedRows,
      fieldCount: 0,
      warningCount: 0,
      message: '',
      protocol41: true,
      serverStatus: 2
    };
    return [okPacket, pgResult.fields];
  }
}

class WrappedClient {
  constructor(client) {
    this.client = client;
  }

  async query(sql, params) {
    const { sql: pgSql, params: pgParams } = translateQuery(sql, params);
    try {
      const res = await this.client.query(pgSql, pgParams);
      return formatResult(pgSql, res);
    } catch (err) {
      console.error('Database Error running query (connection):', { originalSql: sql, pgSql, params: pgParams, error: err.message });
      throw err;
    }
  }

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  release() {
    this.client.release();
  }
}

class WrappedPool {
  constructor(pool) {
    this.pool = pool;
  }

  async query(sql, params) {
    const { sql: pgSql, params: pgParams } = translateQuery(sql, params);
    try {
      const res = await this.pool.query(pgSql, pgParams);
      return formatResult(pgSql, res);
    } catch (err) {
      console.error('Database Error running query (pool):', { originalSql: sql, pgSql, params: pgParams, error: err.message });
      throw err;
    }
  }

  async getConnection() {
    const client = await this.pool.connect();
    return new WrappedClient(client);
  }

  async end() {
    await this.pool.end();
  }
}

// Build Pool Configuration
const poolConfig = {};

if (process.env.BPCIT_DATABASE_POSTGRES_URL) {
  poolConfig.connectionString = process.env.BPCIT_DATABASE_POSTGRES_URL;
  poolConfig.ssl = { rejectUnauthorized: false };
} else if (process.env.BPCIT_DATABASE_POSTGRES_URL_NON_POOLING) {
  poolConfig.connectionString = process.env.BPCIT_DATABASE_POSTGRES_URL_NON_POOLING;
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT) || 5432;
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'postgres';
  poolConfig.database = process.env.DB_NAME || 'student_db';
}

poolConfig.max = 10;

const pgPool = new Pool(poolConfig);

module.exports = new WrappedPool(pgPool);
