/**
 * Seed 100 dummy students for testing
 * Run: node seed_dummy.js
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

const DEPARTMENTS = ['CST', 'ETCE', 'ME', 'CE', 'EE'];
const GENDERS = ['Male', 'Female'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CITIES = [
  'Kolkata, WB', 'Delhi, DL', 'Mumbai, MH', 'Chennai, TN', 'Ahmedabad, GJ',
  'Pune, MH', 'Hyderabad, TS', 'Bangalore, KA', 'Jaipur, RJ', 'Lucknow, UP',
];
const FIRST_NAMES = [
  'Rahul', 'Priya', 'Arjun', 'Ananya', 'Karan', 'Sneha', 'Vikram', 'Pooja',
  'Rohan', 'Neha', 'Amit', 'Kavya', 'Suresh', 'Divya', 'Manish', 'Isha',
  'Deepak', 'Ritu', 'Sanjay', 'Meera', 'Nikhil', 'Tanvi', 'Rajesh', 'Sonia',
];
const LAST_NAMES = [
  'Das', 'Sen', 'Mehta', 'Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar',
  'Roy', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Reddy', 'Nair', 'Iyer',
];

function pick(arr, index) {
  return arr[index % arr.length];
}

function randomDob(admissionYear) {
  const year = admissionYear - 18 - (Math.floor(Math.random() * 2));
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seedDummyStudents() {
  const count = 100;
  const password = await bcrypt.hash('student123', 10);

  console.log(`🌱 Seeding ${count} dummy students...\n`);

  let inserted = 0;
  let updated = 0;

  for (let i = 1; i <= count; i++) {
    const dept = pick(DEPARTMENTS, i);
    const seq = String(i).padStart(3, '0');
    const admissionYear = i % 2 === 0 ? 2023 : 2024;
    const semester = 1 + (i % 8);

    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 7);
    const name = `${firstName} ${lastName} ${seq}`;

    const rollNo = `${dept}D${seq}`;
    const registrationNo = `REG${admissionYear}${String(i).padStart(4, '0')}`;
    const email = `dummy${seq}@test.bpc.edu`;
    const gender = pick(GENDERS, i);
    const dob = randomDob(admissionYear);
    const phone = `98${String(10000000 + i).slice(-8)}`;
    const address = pick(CITIES, i);
    const guardianName = `${pick(FIRST_NAMES, i + 3)} ${lastName}`;
    const guardianPhone = `97${String(10000000 + i).slice(-8)}`;
    const bloodGroup = pick(BLOOD_GROUPS, i);

    const [result] = await pool.query(
      `INSERT INTO students
         (name, roll_no, registration_no, department, semester, gender, dob, phone, email,
          address, guardian_name, guardian_phone, blood_group, admission_year, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET
         name=EXCLUDED.name, department=EXCLUDED.department, semester=EXCLUDED.semester,
         gender=EXCLUDED.gender, dob=EXCLUDED.dob, phone=EXCLUDED.phone,
         address=EXCLUDED.address, guardian_name=EXCLUDED.guardian_name,
         guardian_phone=EXCLUDED.guardian_phone, blood_group=EXCLUDED.blood_group,
         admission_year=EXCLUDED.admission_year, password=EXCLUDED.password`,
      [
        name, rollNo, registrationNo, dept, semester, gender, dob, phone, email,
        address, guardianName, guardianPhone, bloodGroup, admissionYear, password,
      ]
    );

    if (result.affectedRows === 1) inserted += 1;
    else updated += 1;

    if (i % 20 === 0 || i === count) {
      console.log(`  ... ${i}/${count} processed`);
    }
  }

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM students');
  console.log(`\n✅ Done — ${inserted} inserted, ${updated} updated`);
  console.log(`📊 Total students in database: ${total}`);
  console.log('\n🔑 Login any dummy student with password: student123');
  console.log('   Example: dummy001@test.bpc.edu or roll CSTD001');
}

seedDummyStudents()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  });
