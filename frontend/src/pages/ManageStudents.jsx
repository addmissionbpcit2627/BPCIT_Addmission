import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { Search, Download, Edit, Trash2, UserPlus, Eye, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInterface';

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingAll, setExportingAll] = useState(false);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  // Teacher's department from JWT (stored in user object)
  const teacherDept = user?.department || '';

  const fetchStudents = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      let url = '/teachers/students?limit=100';
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await api.get(url);
      setStudents(res.data.students);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Initial fetch
    fetchStudents(false); // loading is already true
  }, []); // Only on mount

  // Debounce search
  useEffect(() => {
    if (!searchQuery) return;
    const timer = setTimeout(() => fetchStudents(true), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchStudents]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.delete(`/teachers/students/${id}`);
        fetchStudents();
      } catch {
        alert('Failed to delete student');
      }
    }
  };

  // Authenticated download helper
  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Export failed. Please try again.');
    }
  };

  // Export a single student as Excel
  const handleExportStudent = (student) => {
    downloadFile(
      `${import.meta.env.VITE_API_URL}/api/teachers/students/${student.id}/export/excel`,
      `student_${student.roll_no}_profile.xlsx`
    );
  };

  // Export a single student as PDF
  const handleExportStudentPdf = (student) => {
    downloadFile(
      `${import.meta.env.VITE_API_URL}/api/teachers/students/${student.id}/export/pdf`,
      `student_${student.roll_no}_profile.pdf`
    );
  };

  // Export ALL students (of teacher's department) to Excel
  const handleExportAll = async (format) => {
    setExportingAll(true);
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    await downloadFile(
      `${import.meta.env.VITE_API_URL}/api/teachers/export/department/${format}`,
      `department_${teacherDept}_all_students.${ext}`
    );
    setExportingAll(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Directory</h1>
          {teacherDept && (
            <p className="flex items-center gap-2 text-sm font-bold text-slate-500 mt-2 italic">
              Managing: <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full not-italic shadow-sm">{teacherDept} Department</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/teacher/students/add')}
            className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Student
          </button>

          {/* Export All buttons */}
          <button
            onClick={() => handleExportAll('excel')}
            disabled={exportingAll}
            className="inline-flex items-center px-4 py-3 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-black rounded-2xl text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all"
            title={`Export all ${teacherDept} students as Excel`}
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600 mr-2" />
            {exportingAll ? '...' : 'EXCEL'}
          </button>
          <button
            onClick={() => handleExportAll('pdf')}
            disabled={exportingAll}
            className="inline-flex items-center px-4 py-3 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-black rounded-2xl text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-all"
            title={`Export all ${teacherDept} students as PDF`}
          >
            <Download className="w-4 h-4 text-red-500 mr-2" />
            {exportingAll ? '...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
            placeholder="Search by student name, roll number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden border border-white/60">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No students found in {teacherDept} department.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Credentials</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Export</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition-all duration-200 group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 relative">
                          {student.photo ? (
                            <img className="h-12 w-12 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-shadow" src={`${import.meta.env.VITE_API_URL}/uploads/${student.photo}`} alt="" />
                          ) : (
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-black text-lg border border-indigo-100">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{student.gender || 'Not Specified'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-700">{student.roll_no}</div>
                      <div className="text-[10px] font-black text-indigo-400 tracking-tighter uppercase">{student.registration_no || 'NO REG'}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-black rounded-lg bg-white border border-slate-100 text-indigo-700 shadow-inner">
                        SEM {student.semester}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800">{student.email}</div>
                      <div className="text-xs font-medium text-slate-400">{student.phone || '—'}</div>
                    </td>
                    {/* Per-student export buttons */}
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleExportStudentPdf(student)}
                          className="bg-white p-2 rounded-xl border border-slate-100 text-red-500 hover:text-red-700 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportStudent(student)}
                          className="bg-white p-2 rounded-xl border border-slate-100 text-green-600 hover:text-green-800 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                          title="Export Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                        <button onClick={() => navigate(`/teacher/students/${student.id}`)} className="p-2 text-indigo-500 hover:bg-white rounded-xl hover:shadow-sm transition-all" title="View Profile">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => navigate(`/teacher/students/edit/${student.id}`)} className="p-2 text-blue-500 hover:bg-white rounded-xl hover:shadow-sm transition-all" title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-500 hover:bg-white rounded-xl hover:shadow-sm transition-all" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default ManageStudents;
