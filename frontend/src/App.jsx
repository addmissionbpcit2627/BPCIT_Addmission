import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/AuthContextInterface';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import StudentPortal from './pages/StudentPortal';
import TeacherLogin from './pages/TeacherLogin';
import ForgotPassword from './pages/ForgotPassword';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageStudents from './pages/ManageStudents';
import StudentForm from './pages/StudentForm';
import StudentProfile from './pages/StudentProfile';
import StudentDashboard from './pages/StudentDashboard';
import EnterMarks from './pages/EnterMarks';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import MarkAttendance from './pages/MarkAttendance';
import Admission from './pages/Admission';
import TeacherVerification from './pages/TeacherVerification';

function AppInner() {
  const { token } = useContext(AuthContext);
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {token && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* ── Public Routes ─────────────────────────────────── */}
          {/* Default landing = student portal */}
          <Route path="/" element={<StudentPortal />} />
          <Route path="/login" element={<StudentPortal />} />
          <Route path="/admission" element={<Admission />} />

          {/* Separate teacher portal */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/forgot-password" element={<ForgotPassword accountType="teacher" />} />
          {/* Keep old /register for any old bookmarks → redirect to teacher portal */}
          <Route path="/register" element={<Navigate to="/teacher/login" replace />} />
          {/* Forgot password — student portal */}
          <Route path="/forgot-password" element={<ForgotPassword accountType="student" />} />

          {/* ── Teacher Protected Routes ──────────────────────── */}
          <Route element={<ProtectedRoute allowedRole="teacher" />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<ManageStudents />} />
            <Route path="/teacher/students/add" element={<StudentForm />} />
            <Route path="/teacher/students/edit/:id" element={<StudentForm />} />
            <Route path="/teacher/students/:id" element={<StudentProfile />} />
            <Route path="/teacher/marks" element={<EnterMarks />} />
            <Route path="/teacher/analytics" element={<AnalyticsDashboard />} />
            <Route path="/teacher/attendance" element={<MarkAttendance />} />
            <Route path="/teacher/verification" element={<TeacherVerification />} />
          </Route>

          {/* ── Student Protected Routes ──────────────────────── */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppInner />
      </Router>
    </AuthProvider>
  );
}

export default App;
