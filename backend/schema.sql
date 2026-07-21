-- ============================================================
-- Student Database Management System
-- PostgreSQL Schema
-- ============================================================

-- ─── Teachers Table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(100)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  subject      VARCHAR(100),
  department   VARCHAR(50),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Students Table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL,
  roll_no          VARCHAR(50)   NOT NULL UNIQUE,
  registration_no  VARCHAR(50)   NOT NULL UNIQUE,
  department       VARCHAR(50)   NOT NULL,
  semester         INT           NOT NULL,
  gender           VARCHAR(10),
  dob              DATE,
  phone            VARCHAR(20),
  email            VARCHAR(100)  NOT NULL UNIQUE,
  address          TEXT,
  guardian_name    VARCHAR(100),
  guardian_phone   VARCHAR(20),
  blood_group      VARCHAR(10),
  admission_year   INT,
  photo            VARCHAR(255),
  password         VARCHAR(255)  NOT NULL,
  caste            VARCHAR(10)   DEFAULT 'Gen',
  is_ews           SMALLINT      DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Admissions Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admissions (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL,
  guardian_name    VARCHAR(100)  NOT NULL,
  phone            VARCHAR(20)   NOT NULL,
  email            VARCHAR(100)  NOT NULL UNIQUE,
  dob              DATE          NOT NULL,
  department       VARCHAR(50)   NOT NULL,
  aadhar_path      VARCHAR(255)  NOT NULL,
  allotment_path   VARCHAR(255)  NOT NULL,
  rank_path        VARCHAR(255)  NOT NULL,
  domicile_path    VARCHAR(255)  NOT NULL,
  caste            VARCHAR(10)   NOT NULL DEFAULT 'Gen',
  caste_path       VARCHAR(255)  DEFAULT NULL,
  is_ews           SMALLINT      DEFAULT 0,
  ews_path         VARCHAR(255)  DEFAULT NULL,
  antiragging_path VARCHAR(255)  DEFAULT NULL,
  status           VARCHAR(20)   DEFAULT 'Pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Results Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
  id           SERIAL PRIMARY KEY,
  student_id   INT NOT NULL,
  semester     INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  marks        INT NOT NULL,
  total_marks  INT DEFAULT 100,
  grade        VARCHAR(2),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ─── Attendance Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id           SERIAL PRIMARY KEY,
  student_id   INT NOT NULL,
  status       VARCHAR(10) CHECK (status IN ('Present', 'Absent')) NOT NULL,
  date         DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT unique_attendance UNIQUE (student_id, date)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_semester   ON students(semester);
CREATE INDEX IF NOT EXISTS idx_email      ON students(email);
CREATE INDEX IF NOT EXISTS idx_result_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

-- ─── Triggers for Auto-Updating updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
