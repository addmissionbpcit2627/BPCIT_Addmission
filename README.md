# Student Database Management System

A comprehensive platform for department-wise student information, reporting, academic results, and attendance tracking.

## 🚀 Features

- **Department Analytics**: Dashboard with visualizations for student distribution by department, semester, and gender.
- **Academic Results**: Teachers can enter marks and calculate grades; students can view their academic performance.
- **Attendance System**: Real-time attendance tracking with statistics for students and marking portal for teachers.
- **Profile Management**: Detailed student profiles with photo uploads and document exports (PDF/Excel).
- **Secure Access**: Role-based authentication for Students and Teachers/Admins.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express, MySQL.
- **Auth**: JWT (JSON Web Tokens).

## 📦 Setup

1. **Backend**:
   - `cd backend`
   - `npm install`
   - Configure `.env` with database credentials.
   - Run `node create_attendance_table.js` to setup tables.
   - `npm run dev`

2. **Frontend**:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
