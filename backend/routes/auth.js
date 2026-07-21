const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../config/jwt');
const pool = require('../config/db');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Roll Number and password are required to login' });
    }

    // Teachers (by email)
    const [teachers] = await pool.query('SELECT * FROM teachers WHERE email = ?', [identifier]);
    if (teachers.length > 0) {
      const teacher = teachers[0];
      const match = await bcrypt.compare(password, teacher.password);
      if (!match) return res.status(401).json({ message: 'Invalid Login' });
      const token = generateToken({ id: teacher.id, role: 'teacher', name: teacher.name, email: teacher.email, department: teacher.department });
      return res.json({
        token, role: 'teacher',
        user: { id: teacher.id, name: teacher.name, email: teacher.email, subject: teacher.subject, department: teacher.department },
      });
    }

    // Students (by email OR roll_no)
    const [students] = await pool.query('SELECT * FROM students WHERE email = ? OR roll_no = ?', [identifier, identifier]);
    if (students.length > 0) {
      const student = students[0];
      const match = await bcrypt.compare(password, student.password);
      if (!match) return res.status(401).json({ message: 'Invalid Login' });
      const token = generateToken({ id: student.id, role: 'student', name: student.name, email: student.email });
      return res.json({
        token, role: 'student',
        user: { id: student.id, name: student.name, email: student.email, roll_no: student.roll_no, department: student.department },
      });
    }

    return res.status(401).json({ message: 'Invalid Login' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register  (Teacher self-registration)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, subject, department } = req.body;
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Name, email, department, and password are required' });
    }
    const [existing] = await pool.query('SELECT id FROM teachers WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO teachers (name, email, password, subject, department) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, subject || null, department]
    );
    const token = generateToken({ id: result.insertId, role: 'teacher', name, email, department });
    return res.status(201).json({ token, role: 'teacher', user: { id: result.insertId, name, email, subject: subject || null, department } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register/student  (Student self-registration)
router.post('/register/student', async (req, res) => {
  try {
    const { name, email, roll_no, registration_no, department, semester, password,
            gender, dob, blood_group, admission_year, guardian_name, guardian_phone } = req.body;

    if (!name || !email || !roll_no || !department || !semester || !password) {
      return res.status(400).json({ message: 'Name, email, roll number, department, semester, and password are required' });
    }
    const [existing] = await pool.query('SELECT id FROM students WHERE email = ? OR roll_no = ?', [email, roll_no]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email or Roll Number already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const regNo = registration_no || roll_no;
    const [result] = await pool.query(
      `INSERT INTO students (name, email, roll_no, registration_no, department, semester, password,
        gender, dob, blood_group, admission_year, guardian_name, guardian_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, roll_no, regNo, department, parseInt(semester), hashedPassword,
       gender || null, dob || null, blood_group || null,
       admission_year ? parseInt(admission_year) : null,
       guardian_name || null, guardian_phone || null]
    );
    const token = generateToken({ id: result.insertId, role: 'student', name, email });
    return res.status(201).json({ token, role: 'student', user: { id: result.insertId, name, email, roll_no, department } });
  } catch (err) {
    console.error('Student register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── FORGOT PASSWORD (Hardened) ─────────────────────────────────────────────────
const resetTokens  = new Map(); // token  → { userId, role, expires }
const attemptStore = new Map(); // identifier → { count, lockedUntil }

const MAX_ATTEMPTS  = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const TOKEN_TTL     = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(id) {
  const now = Date.now();
  const rec = attemptStore.get(id) || { count: 0, lockedUntil: 0 };
  if (rec.lockedUntil > now) {
    return { locked: true, minsLeft: Math.ceil((rec.lockedUntil - now) / 60000) };
  }
  return { locked: false };
}

function recordAttempt(id, success) {
  if (success) { attemptStore.delete(id); return; }
  const rec = attemptStore.get(id) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) { rec.lockedUntil = Date.now() + LOCK_DURATION; rec.count = 0; }
  attemptStore.set(id, rec);
}

// Step 1: Verify identity (+ rate-limit + extra field)
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { identifier, name, extra, accountType } = req.body;
    if (!identifier || !name || !accountType) return res.status(400).json({ message: 'All fields are required' });

    const key = `${accountType}:${identifier.trim().toLowerCase()}`;
    const { locked, minsLeft } = checkRateLimit(key);
    if (locked) {
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}.` });
    }

    if (accountType === 'teacher') {
      // Teachers — extra = department
      const [teachers] = await pool.query('SELECT id, name, department FROM teachers WHERE email = ?', [identifier.trim()]);
      if (teachers.length > 0) {
        const t = teachers[0];
        const nameOk = t.name.trim().toLowerCase() === name.trim().toLowerCase();
        
        // extraIn = department
        const dept = (t.department || '').trim().toLowerCase();
        const extraIn = (extra || '').trim().toLowerCase();
        const extraOk = dept && extraIn && (dept === extraIn);

        if (!nameOk || !extraOk) {
          recordAttempt(key, false);
          const rec = attemptStore.get(key) || { count: 0 };
          const left = MAX_ATTEMPTS - rec.count;
          return res.status(401).json({ message: `Details do not match.${left > 0 ? ` ${left} attempt${left !== 1 ? 's' : ''} remaining.` : ''}` });
        }
        recordAttempt(key, true);
        const token = crypto.randomBytes(24).toString('hex');
        resetTokens.set(token, { userId: t.id, role: 'teacher', expires: Date.now() + TOKEN_TTL });
        return res.json({ token });
      }
    } else if (accountType === 'student') {
      // Students — extra = DOB or roll_no
      const [students] = await pool.query(
        'SELECT id, name, dob, roll_no FROM students WHERE email = ? OR roll_no = ?',
        [identifier.trim(), identifier.trim()]
      );
      if (students.length > 0) {
        const s = students[0];
        const nameOk = s.name.trim().toLowerCase() === name.trim().toLowerCase();
        
        let dobStr = '';
        if (s.dob) {
          // Fix timezone shift by extracting the local date string properly
          const d = new Date(s.dob);
          dobStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        
        const extraOk = (extra && dobStr && extra.trim() === dobStr) ||
                        (!dobStr && extra && s.roll_no && extra.trim().toLowerCase() === s.roll_no.toLowerCase());

        if (!nameOk || !extraOk) {
          recordAttempt(key, false);
          const rec = attemptStore.get(key) || { count: 0 };
          const left = MAX_ATTEMPTS - rec.count;
          return res.status(401).json({ message: `Details do not match.${left > 0 ? ` ${left} attempt${left !== 1 ? 's' : ''} remaining.` : ''}` });
        }
        recordAttempt(key, true);
        const token = crypto.randomBytes(24).toString('hex');
        resetTokens.set(token, { userId: s.id, role: 'student', expires: Date.now() + TOKEN_TTL });
        return res.json({ token });
      }
    }

    return res.status(404).json({ message: 'No account found with that Email / Roll Number' });
  } catch (err) {
    console.error('Forgot password verify error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 2: Set new password using one-use token
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Token and a password of at least 6 characters are required' });
    }
    const entry = resetTokens.get(token);
    if (!entry) return res.status(400).json({ message: 'Invalid or expired reset link. Please start again.' });
    if (Date.now() > entry.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Reset session expired (10 min limit). Please start again.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    const table = entry.role === 'teacher' ? 'teachers' : 'students';
    await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashed, entry.userId]);
    resetTokens.delete(token); // one-use only
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Forgot password reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
