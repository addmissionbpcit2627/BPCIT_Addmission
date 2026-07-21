import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { Users, BookOpen, GraduationCap, Download, PieChart, UserCheck, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard() {
  const [stats, setStats] = useState({ total: 0, deptStats: [], semStats: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/teachers/stats');
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-medium italic">Welcome back to your department control center.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/teacher/marks')}
              className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Enter Marks
            </button>
            <button
              onClick={() => navigate('/teacher/analytics')}
              className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <PieChart className="w-4 h-4 mr-2 text-indigo-600" />
              Analytics
            </button>
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <UserCheck className="w-4 h-4 mr-2 text-indigo-600" />
              Attendance
            </button>
            <button
              onClick={() => navigate('/teacher/verification')}
              className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />
              Verify Admissions
            </button>
            <button
              onClick={() => navigate('/teacher/students')}
              className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] transition-all transform hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Directory
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          bgClass="bg-indigo-50"
        />
        <StatCard
          title="Departments"
          value={stats.deptStats.length}
          icon={<BookOpen className="w-6 h-6 text-purple-600" />}
          bgClass="bg-purple-50"
        />
        <StatCard
          title="Semesters"
          value={stats.semStats.length}
          icon={<GraduationCap className="w-6 h-6 text-blue-600" />}
          bgClass="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Department Distribution */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Department Reach
          </h2>
          <div className="space-y-4">
            {stats.deptStats.map((dept, index) => (
              <div key={index} className="flex justify-between items-center group bg-slate-50/50 hover:bg-white p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all hover:shadow-md">
                <span className="font-bold text-slate-700">{dept.department}</span>
                <span className="bg-indigo-600 text-white py-1.5 px-4 rounded-xl text-xs font-black shadow-lg shadow-indigo-200">
                  {dept.count} Students
                </span>
              </div>
            ))}
            {stats.deptStats.length === 0 && (
              <p className="text-slate-400 font-medium italic text-center py-4">No department logs found.</p>
            )}
          </div>
        </div>

        {/* Semester Distribution */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
            Academic Status
          </h2>
          <div className="space-y-4">
            {stats.semStats.map((sem, index) => (
              <div key={index} className="flex justify-between items-center group bg-slate-50/50 hover:bg-white p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all hover:shadow-md">
                <span className="font-bold text-slate-700 px-1">Semester {sem.semester}</span>
                <span className="bg-purple-600 text-white py-1.5 px-4 rounded-xl text-xs font-black shadow-lg shadow-purple-200">
                  {sem.count} Students
                </span>
              </div>
            ))}
             {stats.semStats.length === 0 && (
              <p className="text-slate-400 font-medium italic text-center py-4">No active semester stats.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
