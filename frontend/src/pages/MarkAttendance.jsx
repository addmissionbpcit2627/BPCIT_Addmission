import React, { useState } from 'react';
import api from '../api/axios';
import { UserCheck, Search, Save, Calendar, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function MarkAttendance() {
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleFetchStudents = async (e) => {
    if (e) e.preventDefault();
    if (!department || !semester) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(`/attendance/students?department=${department}&semester=${semester}`);
      setStudents(res.data);
      // Initialize all as Present by default
      const initial = {};
      res.data.forEach(s => initial[s.id] = 'Present');
      setAttendance(initial);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch students' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const attendance_data = Object.keys(attendance).map(id => ({
        student_id: parseInt(id),
        status: attendance[id]
      }));

      await api.post('/attendance', { date, attendance_data });
      setMessage({ type: 'success', text: 'Attendance recorded successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="flex items-center text-indigo-600 font-bold mb-4 hover:gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mark Attendance</h1>
        </div>

        {/* Selection Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <form onSubmit={handleFetchStudents} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Department</label>
              <select 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Dept</option>
                <option value="CST">CST</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Semester</label>
              <select 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)}
                required
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Sem</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white rounded-xl py-3 px-4 font-black text-sm flex items-center justify-center hover:bg-indigo-700 transition-colors gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Fetch Students
            </button>
          </form>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 font-bold flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Student List */}
        {students.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Roll No</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{student.roll_no}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                            attendance[student.id] === 'Present' 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Present
                        </button>
                        <button 
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                            attendance[student.id] === 'Absent' 
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 bg-slate-50 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white rounded-2xl py-3 px-8 font-black text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform hover:-translate-y-0.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Attendance
              </button>
            </div>
          </div>
        )}

        {students.length === 0 && !loading && department && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic">No students found for this selection.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MarkAttendance;
