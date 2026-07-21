const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const { authenticate, authorizeTeacher, authorizeStudent } = require('../middleware/auth');

const router = express.Router();

const calculateGrade = (marks) => {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'E';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 40) return 'D';
  return 'F';
};

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimes = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (ext === '.csv' && allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }
    if (ext === '.csv') {
      return cb(null, true);
    }
    cb(new Error('Only CSV files are allowed.'));
  },
});

const splitCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};

const normalizeCsvKey = (key = '') => key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveCsvField = (row, aliases) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeCsvKey(alias);
    if (Object.prototype.hasOwnProperty.call(row, normalizedAlias)) {
      return row[normalizedAlias];
    }
  }
  return '';
};

const parseCsv = (buffer) => {
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!text) return [];
  const lines = text.split('\n').filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines.shift()).map((header) => normalizeCsvKey(header));
  return lines.map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    return row;
  });
};

// POST /api/results — Enter marks for a student (Teacher only)
router.post('/', authenticate, authorizeTeacher, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { student_id, semester, marks_data } = req.body;
    // marks_data = [{ subject_name: 'Math', marks: 85 }, ...]

    if (!student_id || !semester || !marks_data || !Array.isArray(marks_data)) {
      return res.status(400).json({ message: 'student_id, semester, and marks_data array are required' });
    }

    await connection.beginTransaction();

    // Remove existing marks for this student and semester if any (for update)
    await connection.query('DELETE FROM results WHERE student_id = ? AND semester = ?', [student_id, semester]);

    for (const item of marks_data) {
      const grade = calculateGrade(item.marks);
      await connection.query(
        'INSERT INTO results (student_id, semester, subject_name, marks, total_marks, grade) VALUES (?, ?, ?, ?, ?, ?)',
        [student_id, semester, item.subject_name, item.marks, item.total_marks || 100, grade]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Marks stored and grades calculated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error while storing marks' });
  } finally {
    connection.release();
  }
});

// POST /api/results/upload — Bulk upload marks from CSV file (Teacher only)
router.post('/upload', authenticate, authorizeTeacher, uploadCsv.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const csvRows = parseCsv(req.file.buffer);
    if (!csvRows || !csvRows.length) {
      return res.status(400).json({ message: 'CSV file contains no rows' });
    }

    const semesterOverride = req.body.semester ? parseInt(req.body.semester, 10) : null;
    const departmentFilter = req.user.department;
    const invalidRows = [];
    const validRows = [];

    csvRows.forEach((row, index) => {
      const registration_no = resolveCsvField(row, ['registration_no', 'reg_no', 'registration', 'roll_no', 'rollnumber', 'rollnumber']);
      const subject_name = resolveCsvField(row, ['subject_name', 'subject', 'subjectname', 'course', 'course_name']);
      const marksRaw = resolveCsvField(row, ['marks', 'score', 'mark']);
      const totalMarksRaw = resolveCsvField(row, ['total_marks', 'total', 'full_marks', 'max_marks', 'maximum_marks']);
      const rowSemesterRaw = resolveCsvField(row, ['semester', 'sem', 'term']);
      const rowSemester = rowSemesterRaw ? parseInt(rowSemesterRaw, 10) : null;
      const semesterValue = rowSemester || semesterOverride;
      const marks = marksRaw !== '' ? parseInt(marksRaw, 10) : NaN;
      const total_marks = totalMarksRaw !== '' ? parseInt(totalMarksRaw, 10) : 100;

      if (!registration_no || !subject_name || Number.isNaN(marks) || semesterValue == null) {
        invalidRows.push({ row: index + 2, reason: 'Required fields missing or invalid: registration, subject, marks, semester', raw: row });
        return;
      }

      validRows.push({ registration_no, subject_name, marks, total_marks: total_marks || 100, semester: semesterValue });
    });

    const registrationNumbers = [...new Set(validRows.map((row) => row.registration_no))];
    if (!registrationNumbers.length) {
      return res.status(400).json({ message: 'No valid rows found in CSV', invalidRows });
    }

    const studentSql = `SELECT id, registration_no, roll_no, department, semester FROM students WHERE (registration_no IN (?) OR roll_no IN (?))${departmentFilter ? ' AND department = ?' : ''}`;
    const studentParams = departmentFilter ? [registrationNumbers, registrationNumbers, departmentFilter] : [registrationNumbers, registrationNumbers];
    const [students] = await pool.query(studentSql, studentParams);
    const studentMap = new Map();
    students.forEach((student) => {
      studentMap.set(student.registration_no, student);
      studentMap.set(student.roll_no, student);
    });

    const groupedRows = new Map();
    validRows.forEach((row) => {
      const student = studentMap.get(row.registration_no);
      if (!student) {
        invalidRows.push({ row: 'unknown', reason: 'Student not found or not in your department', raw: row });
        return;
      }
      if (departmentFilter && student.department !== departmentFilter) {
        invalidRows.push({ row: 'unknown', reason: 'Student department mismatch', raw: row });
        return;
      }
      const key = `${student.id}_${row.semester}`;
      if (!groupedRows.has(key)) groupedRows.set(key, { student, rows: [] });
      groupedRows.get(key).rows.push(row);
    });

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    let insertedCount = 0;
    for (const [key, group] of groupedRows) {
      const { student, rows } = group;
      await connection.query('DELETE FROM results WHERE student_id = ? AND semester = ?', [student.id, rows[0].semester]);
      for (const row of rows) {
        const grade = calculateGrade(row.marks);
        await connection.query(
          'INSERT INTO results (student_id, semester, subject_name, marks, total_marks, grade) VALUES (?, ?, ?, ?, ?, ?)',
          [student.id, row.semester, row.subject_name, row.marks, row.total_marks, grade]
        );
        insertedCount += 1;
      }
    }

    await connection.commit();
    connection.release();

    return res.status(200).json({
      message: 'CSV upload completed', insertedCount,
      studentGroups: groupedRows.size,
      invalidRows,
    });
  } catch (err) {
    console.error('CSV upload error:', err);
    return res.status(500).json({ message: err.message || 'Server error while processing CSV upload' });
  }
});

// GET /api/results/registration/:registration_no — Get a student's results by registration number (Teacher only)
router.get('/registration/:registration_no', authenticate, authorizeTeacher, async (req, res) => {
  try {
    const registration_no = req.params.registration_no?.trim();
    if (!registration_no) {
      return res.status(400).json({ message: 'Registration number is required' });
    }

    const semester = req.query.semester ? parseInt(req.query.semester, 10) : null;
    const departmentFilter = req.user.department || req.query.department;
    let studentSql = 'SELECT id, name, roll_no, registration_no, email, department, semester FROM students WHERE (registration_no = ? OR roll_no = ?)';
    const params = [registration_no, registration_no];
    if (departmentFilter) {
      studentSql += ' AND department = ?';
      params.push(departmentFilter);
    }
    const [students] = await pool.query(studentSql, params);
    if (!students.length) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = students[0];
    const resultParams = [student.id];
    let resultSql = 'SELECT id, semester, subject_name, marks, total_marks, grade, created_at FROM results WHERE student_id = ?';
    if (semester) {
      resultSql += ' AND semester = ?';
      resultParams.push(semester);
    }
    resultSql += ' ORDER BY semester DESC, subject_name ASC';

    const [results] = await pool.query(resultSql, resultParams);
    return res.json({ student, results });
  } catch (err) {
    console.error('Lookup by registration error:', err);
    return res.status(500).json({ message: 'Server error fetching student results' });
  }
});

// GET /api/results/me — Get marks for logged-in student
router.get('/me', authenticate, authorizeStudent, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, semester, subject_name, marks, total_marks, grade, created_at FROM results WHERE student_id = ? ORDER BY semester DESC, subject_name ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching results' });
  }
});

// GET /api/results/student/:id — Get marks for a specific student (Teacher only)
router.get('/student/:id', authenticate, authorizeTeacher, async (req, res) => {
  try {
     // Optional: check department access if teacher belongs to a department
    const [rows] = await pool.query(
      'SELECT id, semester, subject_name, marks, total_marks, grade, created_at FROM results WHERE student_id = ? ORDER BY semester DESC, subject_name ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching results' });
  }
});

module.exports = router;
