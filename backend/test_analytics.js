const pool = require('./config/db');

async function testAnalytics() {
  try {
    console.log('Testing Total Count...');
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM students');
    console.log('Total:', total);

    console.log('Testing Department Count...');
    const [deptRows] = await pool.query(
      'SELECT department as name, COUNT(*) as value FROM students GROUP BY department'
    );
    console.log('Departments:', deptRows);

    console.log('Testing Semester Count...');
    const [semRows] = await pool.query(
      'SELECT CONCAT(\'Semester \', semester) as name, COUNT(*) as value FROM students GROUP BY semester ORDER BY semester ASC'
    );
    console.log('Semesters:', semRows);

    console.log('Testing Gender Count...');
    const [genderRows] = await pool.query(
      'SELECT COALESCE(gender, \'Unknown\') as name, COUNT(*) as value FROM students GROUP BY gender'
    );
    console.log('Genders:', genderRows);

    console.log('SUCCESS: All queries executed correctly.');
    process.exit(0);
  } catch (err) {
    console.error('FAILURE: Error executing analytics queries:');
    console.error(err);
    process.exit(1);
  }
}

testAnalytics();
