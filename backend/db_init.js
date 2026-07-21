const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function initDatabase() {
  console.log('🔄 Initializing PostgreSQL database on Supabase/configured target...');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Error: schema.sql file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('📡 Connecting to database...');
    // We execute the schema. Since Postgres node client doesn't support multiple statements separated by semicolon by default in a single simple query command (unless using a single raw query string with multiple statements), we can just execute the full file content using client.query
    // pg's pool.query executes a multi-statement query string successfully as a single transaction block.
    await pool.query(sql);
    console.log('✅ Database schema initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database schema:', err);
    process.exit(1);
  }
}

initDatabase();
