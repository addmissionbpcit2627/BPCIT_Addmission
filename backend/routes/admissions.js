const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { uploadFile, deleteFile } = require('../services/storage');
const { authenticate, authorizeTeacher } = require('../middleware/auth');

const router = express.Router();

// Ensure admissions and students tables exist and are migrated
const initDb = async () => {
  try {
    // 1. Create admissions table with caste, is_ews, and ews_path support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        guardian_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        dob DATE NOT NULL,
        department VARCHAR(50) NOT NULL,
        aadhar_path VARCHAR(255) NOT NULL,
        allotment_path VARCHAR(255) NOT NULL,
        rank_path VARCHAR(255) NOT NULL,
        domicile_path VARCHAR(255) NOT NULL,
        caste VARCHAR(10) NOT NULL DEFAULT 'Gen',
        caste_path VARCHAR(255) DEFAULT NULL,
        is_ews TINYINT DEFAULT 0,
        ews_path VARCHAR(255) DEFAULT NULL,
        antiragging_path VARCHAR(255) DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Add columns to students table if they don't exist
    const [cols] = await pool.query("SHOW COLUMNS FROM students LIKE 'caste'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE students ADD COLUMN caste VARCHAR(10) DEFAULT 'Gen'");
      console.log('Added caste column to students table.');
    }
    const [ewsCols] = await pool.query("SHOW COLUMNS FROM students LIKE 'is_ews'");
    if (ewsCols.length === 0) {
      await pool.query("ALTER TABLE students ADD COLUMN is_ews TINYINT DEFAULT 0");
      console.log('Added is_ews column to students table.');
    }

    console.log('✅ admissions & students tables verified/updated successfully.');
  } catch (err) {
    console.error('Error creating admissions table or migrating students table:', err);
  }
};
initDb();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR 
      ? path.resolve(process.env.UPLOAD_DIR)
      : (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT)
        ? '/tmp/uploads'
        : path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.pdf`);
  }
});

// Filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter
});

const admissionUpload = upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'allotment', maxCount: 1 },
  { name: 'rank', maxCount: 1 },
  { name: 'domicile', maxCount: 1 },
  { name: 'caste', maxCount: 1 },
  { name: 'antiragging', maxCount: 1 },
  { name: 'ews', maxCount: 1 }
]);

// POST /api/admissions
router.post('/', (req, res) => {
  admissionUpload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { name, guardianName, phone, email, dob, department, caste, isEws } = req.body;

      // Validate textual inputs
      if (!name || !guardianName || !phone || !email || !dob || !department || !caste) {
        return res.status(400).json({ message: 'All text fields (including caste) are required.' });
      }

      const isEwsVal = isEws === 'true' || isEws === 1 || isEws === '1' || isEws === true ? 1 : 0;

      // Validate base required files
      if (!req.files || !req.files.aadhar || !req.files.allotment || !req.files.rank || !req.files.domicile) {
        return res.status(400).json({ message: 'Aadhar, Allotment Letter, Rank Card, and Domicile Certificate are required.' });
      }

      // Conditional validation: Caste certificate required if caste is not Gen
      if (caste !== 'Gen' && (!req.files.caste || req.files.caste.length === 0)) {
        return res.status(400).json({ message: `Caste certificate is required for caste category: ${caste}.` });
      }

      // Conditional validation: EWS certificate required if EWS is selected
      if (isEwsVal === 1 && (!req.files.ews || req.files.ews.length === 0)) {
        return res.status(400).json({ message: 'EWS certificate is required when EWS is checked.' });
      }

      const aadhar_path = req.files.aadhar[0].filename;
      const allotment_path = req.files.allotment[0].filename;
      const rank_path = req.files.rank[0].filename;
      const domicile_path = req.files.domicile[0].filename;
      const caste_path = req.files.caste && req.files.caste.length > 0 ? req.files.caste[0].filename : null;
      const ews_path = req.files.ews && req.files.ews.length > 0 ? req.files.ews[0].filename : null;
      const antiragging_path = req.files.antiragging ? req.files.antiragging[0].filename : null;

      // Check if email or phone is already registered in admissions
      const [existing] = await pool.query('SELECT id FROM admissions WHERE email = ? OR phone = ?', [email, phone]);
      if (existing.length > 0) {
        if (req.files) {
          for (const fieldName of Object.keys(req.files)) {
            const file = req.files[fieldName][0];
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          }
        }
        return res.status(409).json({ message: 'An admission application with this email or mobile number already exists.' });
      }

      // Upload files to Supabase and delete local files
      if (req.files) {
        for (const fieldName of Object.keys(req.files)) {
          const file = req.files[fieldName][0];
          await uploadFile(file.path, file.filename, file.mimetype);
        }
      }

      // Insert record
      const [result] = await pool.query(
        `INSERT INTO admissions (name, guardian_name, phone, email, dob, department, aadhar_path, allotment_path, rank_path, domicile_path, caste, caste_path, is_ews, ews_path, antiragging_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, guardianName, phone, email, dob, department, aadhar_path, allotment_path, rank_path, domicile_path, caste, caste_path, isEwsVal, ews_path, antiragging_path]
      );

      return res.status(201).json({
        message: 'Admission application submitted successfully!',
        applicationId: result.insertId,
        details: {
          name,
          email,
          phone,
          department,
          applicationId: result.insertId
        }
      });
    } catch (dbErr) {
      console.error('Database error in admission submission:', dbErr);
      return res.status(500).json({ message: 'Server error: failed to submit admission application.' });
    }
  });
});

// GET /api/admissions
// Fetch pending applications, filtered by teacher's department if applicable
router.get('/', authenticate, authorizeTeacher, async (req, res) => {
  try {
    const dept = req.user.department;
    let query = 'SELECT * FROM admissions WHERE status = \'Pending\'';
    let params = [];
    if (dept) {
      const alternativeDept = dept.startsWith('D') ? dept.substring(1) : 'D' + dept;
      query += ' AND (department = ? OR department = ?)';
      params.push(dept, alternativeDept);
    }
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching admissions:', err);
    return res.status(500).json({ message: 'Server error: failed to fetch admission applications.' });
  }
});

// POST /api/admissions/:id/verify
// Approve admission and auto-enroll candidate as a student
router.post('/:id/verify', authenticate, authorizeTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get admission detail
    const [rows] = await pool.query('SELECT * FROM admissions WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Admission application not found.' });
    }
    const app = rows[0];

    // Department check
    if (req.user.department) {
      const teacherDept = req.user.department.toUpperCase();
      const appDept = app.department.toUpperCase();
      const alternativeDept = teacherDept.startsWith('D') ? teacherDept.substring(1) : 'D' + teacherDept;
      
      if (appDept !== teacherDept && appDept !== alternativeDept) {
        return res.status(403).json({ message: 'Access denied. Applicant department does not match your department.' });
      }
    }

    if (app.status !== 'Pending') {
      return res.status(400).json({ message: `This application has already been ${app.status.toLowerCase()}.` });
    }

    // 2. Check if student already registered with this email
    const [existingStudent] = await pool.query('SELECT id FROM students WHERE email = ?', [app.email]);
    if (existingStudent.length > 0) {
      return res.status(409).json({ message: 'A student with this email address is already registered.' });
    }

    // Normalize department (DCST -> CST, DCE -> CE, DME -> ME, DEE -> EE)
    let finalDept = app.department;
    if (finalDept === 'DCST') finalDept = 'CST';
    else if (finalDept === 'DCE') finalDept = 'CE';
    else if (finalDept === 'DME') finalDept = 'ME';
    else if (finalDept === 'DEE') finalDept = 'EE';

    // 3. Generate sequential roll number: {deptCode}{3 digit serial}
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM students WHERE department = ?', [finalDept]);
    const rollSerial = String(count + 1).padStart(3, '0');
    const roll_no = `${finalDept}${rollSerial}`;

    // 4. Generate sequential registration number: REG{currentYear}{3-digit serial}
    const currentYear = new Date().getFullYear();
    const [[{ regCount }]] = await pool.query('SELECT COUNT(*) as regCount FROM students WHERE admission_year = ?', [currentYear]);
    const regSerial = String(regCount + 1).padStart(3, '0');
    const registration_no = `REG${currentYear}${regSerial}`;

    // 5. Encrypt default password
    const hashedPassword = await bcrypt.hash('student123', 10);

    // 6. Insert student into database
    await pool.query(
      `INSERT INTO students (name, roll_no, registration_no, department, semester, dob, phone, email, guardian_name, password, admission_year, caste, is_ews)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        app.name,
        roll_no,
        registration_no,
        finalDept,
        app.dob,
        app.phone,
        app.email,
        app.guardian_name,
        hashedPassword,
        currentYear,
        app.caste,
        app.is_ews
      ]
    );

    // 7. Update status to Approved
    await pool.query('UPDATE admissions SET status = \'Approved\' WHERE id = ?', [id]);

    return res.json({
      message: 'Admission application approved. Student auto-enrolled successfully!',
      rollNo: roll_no,
      registrationNo: registration_no
    });
  } catch (err) {
    console.error('Error verifying admission:', err);
    return res.status(500).json({ message: 'Server error: failed to verify admission application.' });
  }
});

// POST /api/admissions/:id/reject
// Reject admission application
router.post('/:id/reject', authenticate, authorizeTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM admissions WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Admission application not found.' });
    }
    const app = rows[0];

    // Department check
    if (req.user.department) {
      const teacherDept = req.user.department.toUpperCase();
      const appDept = app.department.toUpperCase();
      const alternativeDept = teacherDept.startsWith('D') ? teacherDept.substring(1) : 'D' + teacherDept;
      
      if (appDept !== teacherDept && appDept !== alternativeDept) {
        return res.status(403).json({ message: 'Access denied. Applicant department does not match your department.' });
      }
    }

    if (app.status !== 'Pending') {
      return res.status(400).json({ message: `This application has already been ${app.status.toLowerCase()}.` });
    }

    // Update status to Rejected
    await pool.query('UPDATE admissions SET status = \'Rejected\' WHERE id = ?', [id]);

    return res.json({ message: 'Admission application rejected successfully.' });
  } catch (err) {
    console.error('Error rejecting admission:', err);
    return res.status(500).json({ message: 'Server error: failed to reject admission application.' });
  }
});

module.exports = router;
