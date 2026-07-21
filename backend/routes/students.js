const express = require('express');
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const upload = require('../config/multer');
const { authenticate, authorizeStudent } = require('../middleware/auth');
const { generateStudentPDF } = require('../services/exportPdf');
const { generateStudentExcel } = require('../services/exportExcel');

const router = express.Router();

// GET /api/students/me  — student views only their own profile
router.get('/me', authenticate, authorizeStudent, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, roll_no, registration_no, department, semester, gender, dob, phone, email, address, guardian_name, guardian_phone, blood_group, admission_year, photo FROM students WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/*
// PUT /api/students/me — student updates own profile
router.put('/me', authenticate, authorizeStudent, upload.single('photo'), async (req, res) => {
  try {
    const { phone, address, password } = req.body;
    const studentId = req.user.id;

    const [existing] = await pool.query('SELECT photo, password FROM students WHERE id = ?', [studentId]);
    if (!existing.length) return res.status(404).json({ message: 'Student not found' });

    let photoPath = existing[0].photo;
    if (req.file) {
      if (photoPath) {
        const UPLOAD_DIR = require('../config/uploadDir');
        const oldPath = path.join(UPLOAD_DIR, photoPath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photoPath = req.file.filename;
    }

    let hashedPassword = existing[0].password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await pool.query(
      'UPDATE students SET phone = ?, address = ?, photo = ?, password = ? WHERE id = ?',
      [phone || null, address || null, photoPath, hashedPassword, studentId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
*/

// EXPORT ROUTES
router.get('/me/export/pdf', authenticate, authorizeStudent, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    await generateStudentPDF(rows[0], res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

router.get('/me/export/excel', authenticate, authorizeStudent, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    await generateStudentExcel(rows[0], res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
