const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');
const studentRoutes = require('./routes/students');
const resultsRoutes = require('./routes/results');
const analyticsRoutes = require('./routes/analytics');
const attendanceRoutes = require('./routes/attendance');
const admissionsRoutes = require('./routes/admissions');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = require('./config/uploadDir');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://bpcit-addmission.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) ||
                      origin.endsWith('.vercel.app') ||
                      origin.endsWith('.ngrok-free.app') ||
                      origin.includes('localhost:');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (fallback to local if exists, otherwise redirect to Supabase)
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const localPath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  const supabase = require('./config/supabase');
  const { data } = supabase.storage
    .from('BPCIT_STUDENT')
    .getPublicUrl(filename);

  return res.redirect(data.publicUrl);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admissions', admissionsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads served at http://localhost:${PORT}/uploads`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
