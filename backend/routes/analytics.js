const express = require('express');
const pool = require('../config/db');
const { authenticate, authorizeTeacher } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/summary — Aggregate student statistics (Teacher only)
router.get('/summary', authenticate, authorizeTeacher, async (req, res) => {
  try {
    console.log('Fetching analytics summary...');
    
    // 1. Total student count
    const [totalRes] = await pool.query('SELECT COUNT(*) as total FROM students');
    const total = totalRes[0]?.total || 0;

    // 2. Department-wise count
    const [deptRows] = await pool.query(
      'SELECT department as name, COUNT(*) as value FROM students GROUP BY department'
    );

    // 3. Semester-wise distribution
    const [semRows] = await pool.query(
      'SELECT CONCAT(\'Semester \', semester) as name, COUNT(*) as value FROM students GROUP BY semester ORDER BY semester ASC'
    );

    // 4. Gender distribution
    const [genderRows] = await pool.query(
      'SELECT COALESCE(gender, \'Unknown\') as name, COUNT(*) as value FROM students GROUP BY gender'
    );

    console.log('Analytics data fetched successfully');
    res.json({
      total,
      departments: deptRows,
      semesters: semRows,
      genders: genderRows
    });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching analytics'
    });
  }
});

module.exports = router;
