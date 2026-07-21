/**
 * Seed script — creates 1 teacher + 5 demo students
 * Run: node seed.js
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── Teacher ───────────────────────────────────────────────────────────────
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  await pool.query(
    `INSERT INTO teachers (name, email, password, subject, department)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name`,
    ['Admin Teacher', 'admin@bpc.edu', teacherPassword, 'Computer Science', 'CST']
  );
  console.log('✅ Teacher seeded: admin@bpc.edu / teacher123');

  // ─── Students ──────────────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('student123', 10);

  const students = [
    ['Rahul Das',      'CST001', 'REG2022001', 'CST', 4, 'Male',   '2003-05-12', '9876543210', 'rahul@bpc.edu',   'Kolkata, WB',   'Suresh Das',   '9876000001', 'B+',  2022],
    ['Riya Sen',       'CST002', 'REG2022002', 'CST', 6, 'Female', '2002-08-24', '9876543211', 'riya@bpc.edu',    'Delhi, DL',     'Amit Sen',     '9876000002', 'O+',  2022],
    ['Arjun Mehta',    'CST003', 'REG2023001', 'CST', 2, 'Male',   '2005-01-17', '9876543212', 'arjun@bpc.edu',   'Mumbai, MH',    'Sunil Mehta',  '9876000003', 'A+',  2023],
    ['Priya Sharma',   'ECE001', 'REG2022003', 'ECE', 4, 'Female', '2003-11-09', '9876543213', 'priya@bpc.edu',   'Chennai, TN',   'Rajesh Sharma','9876000004', 'AB+', 2022],
    ['Karan Patel',    'ECE002', 'REG2023002', 'ECE', 2, 'Male',   '2004-07-30', '9876543214', 'karan@bpc.edu',   'Ahmedabad, GJ', 'Mohan Patel',  '9876000005', 'O-',  2023],
  ];

  for (const s of students) {
    await pool.query(
      `INSERT INTO students
         (name, roll_no, registration_no, department, semester, gender, dob, phone, email, address, guardian_name, guardian_phone, blood_group, admission_year, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name`,
      [...s, studentPassword]
    );
    console.log(`✅ Student seeded: ${s[0]} | ${s[1]} / student123`);
  }

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
