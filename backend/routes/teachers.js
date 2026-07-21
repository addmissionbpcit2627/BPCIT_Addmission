const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate, authorizeTeacher } = require('../middleware/auth');
const upload = require('../config/multer');
const { uploadFile, deleteFile } = require('../services/storage');
const { generateStudentPDF, generateDepartmentPDF } = require('../services/exportPdf');
const { generateStudentExcel, generateDepartmentExcel } = require('../services/exportExcel');

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT)
    ? '/tmp/uploads'
    : path.join(__dirname, '..', 'uploads');

// All routes require teacher authentication
router.use(authenticate, authorizeTeacher);

// ─── STATS ────────────────────────────────────────────────────────────────────
// Stats scoped to teacher's own department
router.get('/stats', async (req, res) => {
  try {
    const dept = req.user.department;
    const deptFilter = dept ? 'WHERE department = ?' : '';
    const params = dept ? [dept] : [];

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM students ${deptFilter}`, params);
    const [deptStats] = await pool.query(
      `SELECT department, COUNT(*) as count FROM students ${deptFilter} GROUP BY department ORDER BY count DESC`,
      params
    );
    const [semStats] = await pool.query(
      `SELECT semester, COUNT(*) as count FROM students ${deptFilter} GROUP BY semester ORDER BY semester`,
      params
    );
    res.json({ total, deptStats, semStats, teacherDepartment: dept });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STUDENTS LIST / SEARCH ───────────────────────────────────────────────────
// Teachers can only see students from their own department
router.get('/students', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const teacherDept = req.user.department;

    let whereClause = [];
    let params = [];

    // Enforce department restriction if teacher has a department
    if (teacherDept) {
      whereClause.push('department = ?');
      params.push(teacherDept);
    }

    if (search) {
      whereClause.push('(name LIKE ? OR roll_no LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
    const [students] = await pool.query(
      `SELECT id, name, roll_no, registration_no, department, semester, gender, phone, email, blood_group, admission_year, photo FROM students ${where} ORDER BY name LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM students ${where}`,
      params
    );

    res.json({ students, total, page: parseInt(page), limit: parseInt(limit), teacherDepartment: teacherDept });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/teachers/students/:id  — verify student belongs to teacher's dept
router.get('/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, roll_no, registration_no, department, semester, gender, dob, phone, email, address, guardian_name, guardian_phone, blood_group, admission_year, photo FROM students WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });

    const student = rows[0];
    if (req.user.department && student.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied. Student does not belong to your department.' });
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADD STUDENT ──────────────────────────────────────────────────────────────
// Department auto-set from teacher's department
router.post('/students', upload.single('photo'), async (req, res) => {
  try {
    const {
      name, roll_no, registration_no, semester, gender, dob,
      phone, email, address, guardian_name, guardian_phone, blood_group,
      admission_year, password,
    } = req.body;

    // Use teacher's department; fall back to body if teacher has no department set
    const department = req.user.department || req.body.department;

    if (!name || !roll_no || !registration_no || !department || !semester || !email || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const photoPath = req.file ? req.file.filename : null;

    if (req.file) {
      await uploadFile(req.file.path, req.file.filename, req.file.mimetype);
    }

    const [result] = await pool.query(
      `INSERT INTO students (name, roll_no, registration_no, department, semester, gender, dob, phone, email, address, guardian_name, guardian_phone, blood_group, admission_year, photo, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, roll_no, registration_no, department, parseInt(semester), gender, dob || null,
       phone, email, address, guardian_name, guardian_phone, blood_group,
       admission_year ? parseInt(admission_year) : null, photoPath, hashedPassword]
    );

    res.status(201).json({ message: 'Student added successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Roll number, registration number, or email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── UPDATE STUDENT ───────────────────────────────────────────────────────────
router.put('/students/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, roll_no, registration_no, semester, gender, dob,
      phone, email, address, guardian_name, guardian_phone, blood_group,
      admission_year, password,
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Student not found' });

    // Department access check
    if (req.user.department && existing[0].department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied. Student does not belong to your department.' });
    }

    // Keep student's original department (or teacher's dept)
    const department = req.user.department || existing[0].department;

    let photoPath = existing[0].photo;
    if (req.file) {
      if (photoPath) {
        await deleteFile(photoPath);
      }
      photoPath = req.file.filename;
      await uploadFile(req.file.path, req.file.filename, req.file.mimetype);
    }

    let hashedPassword = existing[0].password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await pool.query(
      `UPDATE students SET name=?, roll_no=?, registration_no=?, department=?, semester=?, gender=?, dob=?, phone=?, email=?, address=?, guardian_name=?, guardian_phone=?, blood_group=?, admission_year=?, photo=?, password=? WHERE id=?`,
      [name, roll_no, registration_no, department, parseInt(semester), gender, dob || null,
       phone, email, address, guardian_name, guardian_phone, blood_group,
       admission_year ? parseInt(admission_year) : null, photoPath, hashedPassword, id]
    );

    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Roll number, registration number, or email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE STUDENT ───────────────────────────────────────────────────────────
router.delete('/students/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT photo, department FROM students WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Student not found' });

    if (req.user.department && existing[0].department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied. Student does not belong to your department.' });
    }

    if (existing[0].photo) {
      await deleteFile(existing[0].photo);
    }

    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET DEPARTMENTS ──────────────────────────────────────────────────────────
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT department FROM students ORDER BY department');
    res.json(rows.map((r) => r.department));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── EXPORT – INDIVIDUAL ──────────────────────────────────────────────────────
router.get('/students/:id/export/pdf', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    if (req.user.department && rows[0].department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    await generateStudentPDF(rows[0], res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

router.get('/students/:id/export/excel', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    if (req.user.department && rows[0].department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    await generateStudentExcel(rows[0], res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

// ─── EXPORT – DEPARTMENT (all students at once) ───────────────────────────────
router.get('/export/department/pdf', async (req, res) => {
  try {
    const department = req.user.department || req.query.department;
    if (!department) return res.status(400).json({ message: 'Department is required' });
    const [students] = await pool.query('SELECT * FROM students WHERE department = ? ORDER BY name', [department]);
    await generateDepartmentPDF(students, department, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

router.get('/export/department/excel', async (req, res) => {
  try {
    const department = req.user.department || req.query.department;
    if (!department) return res.status(400).json({ message: 'Department is required' });
    const [students] = await pool.query('SELECT * FROM students WHERE department = ? ORDER BY name', [department]);
    await generateDepartmentExcel(students, department, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
