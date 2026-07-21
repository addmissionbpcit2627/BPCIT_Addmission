const express = require('express');
const pool = require('../config/db');
const { authenticate, authorizeTeacher, authorizeStudent } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance/students — Fetch students for marking attendance (Teacher only)
router.get('/students', authenticate, authorizeTeacher, async (req, res) => {
  try {
    const { department, semester } = req.query;
    if (!department || !semester) {
      return res.status(400).json({ message: 'department and semester are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, roll_no FROM students WHERE department = ? AND semester = ? ORDER BY roll_no ASC',
      [department, semester]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// POST /api/attendance — Save bulk attendance (Teacher only)
router.post('/', authenticate, authorizeTeacher, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { date, attendance_data } = req.body;
    // attendance_data = [{ student_id: 1, status: 'Present' }, ...]

    if (!date || !attendance_data || !Array.isArray(attendance_data)) {
      return res.status(400).json({ message: 'date and attendance_data array are required' });
    }

    await connection.beginTransaction();

    for (const record of attendance_data) {
      await connection.query(
        'INSERT INTO attendance (student_id, status, date) VALUES (?, ?, ?) ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status',
        [record.student_id, record.status, date]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error saving attendance' });
  } finally {
    connection.release();
  }
});

// GET /api/attendance/me — Get attendance summary for logged-in student
router.get('/me', authenticate, authorizeStudent, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT status, date FROM attendance WHERE student_id = ? ORDER BY date DESC',
      [req.user.id]
    );

    const total = rows.length;
    const present = rows.filter(r => r.status === 'Present').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      summary: { total, present, absent: total - present, percentage },
      history: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

module.exports = router;
