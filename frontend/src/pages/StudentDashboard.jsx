import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Mail, Phone, MapPin, User, FileText, Download, Edit2, X, Camera, GraduationCap, UserCheck } from 'lucide-react';

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pRes = await api.get('/students/me');
      setProfile(pRes.data);
      
      // Fetch results and attendance in background, don't block profile
      api.get('/results/me').then(res => setResults(res.data)).catch(err => console.error('Results fetch error:', err));
      api.get('/attendance/me').then(res => setAttendance(res.data)).catch(err => console.error('Attendance fetch error:', err));
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/me/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_profile.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed.');
    }
  };


  if (loading) return <div className="p-8 text-center text-gray-600">Loading your profile...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {profile.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 font-medium italic mt-1">Here is your digital student profile.</p>
          </div>
          <div className="flex gap-3">
            <button
               onClick={() => handleExport('pdf')}
               className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> PDF
            </button>
            <button
               onClick={() => handleExport('excel')}
               className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> EXCEL
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-3xl bg-white/40 backdrop-blur-xl p-1.5 mb-8 border border-white/60 shadow-xl max-w-xs mx-auto sm:mx-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'results' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Results
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Attendance
          </button>
        </div>

      <div className="bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden border border-white/60">
        {/* Profile Header Card */}
        <div className="px-8 py-10 sm:px-10 bg-gradient-to-br from-indigo-600 to-purple-600 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl text-white"></div>
          
          <div className="flex-shrink-0 relative z-10">
             {profile.photo ? (
                <img 
                  className="h-36 w-36 rounded-3xl object-cover border-4 border-white/30 shadow-2xl relative transform rotate-3 hover:rotate-0 transition-transform" 
                  src={`${import.meta.env.VITE_API_URL}/uploads/${profile.photo}`} 
                  alt={profile.name} 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                />
              ) : (
                <div className="h-36 w-36 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl text-white font-black border-2 border-white/40 shadow-xl relative transform -rotate-2 hover:rotate-0 transition-transform tracking-tight">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
          </div>
          <div className="text-center sm:text-left relative z-10 pt-2">
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">{profile.name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mt-3 border border-white/20 shadow-sm">
              {profile.department} <span className="opacity-40">•</span> Semester {profile.semester}
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-indigo-50">
              <div className="flex items-center bg-black/10 px-3 py-2 rounded-xl border border-white/5">
                <FileText className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span>ROLL: <span className="text-white ml-1">{profile.roll_no}</span></span>
              </div>
              <div className="flex items-center bg-black/10 px-3 py-2 rounded-xl border border-white/5">
                <FileText className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span>REG: <span className="text-white ml-1">{profile.registration_no}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {activeTab === 'profile' ? (
            <dl className="space-y-10">
              {/* Contact Information */}
              <div>
                <dt className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  Contact Information
                </dt>
                <dd className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email</div>
                    <div className="text-sm font-bold text-slate-800 break-all">{profile.email}</div>
                  </div>
                  {profile.phone && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3"/> Phone</div>
                      <div className="text-sm font-bold text-slate-800">{profile.phone}</div>
                    </div>
                  )}
                  {profile.address && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner sm:col-span-2 md:col-span-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Address</div>
                      <div className="text-sm font-bold text-slate-800 leading-tight">{profile.address}</div>
                    </div>
                  )}
                </dd>
              </div>
              
              {/* Personal Details */}
              <div>
                <dt className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Personal Particulars
                </dt>
                <dd className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</div>
                    <div className="text-sm font-black text-slate-800">{profile.gender || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-red-400">Blood</div>
                    <div className="text-sm font-black text-red-600">{profile.blood_group || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Birth Date</div>
                    <div className="text-sm font-black text-slate-800 truncate">{profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-indigo-500">Class</div>
                    <div className="text-sm font-black text-indigo-600 truncate">S{profile.semester} / {profile.admission_year || 'N/A'}</div>
                  </div>
                </dd>
              </div>

              {/* Guardian Info */}
              <div>
                <dt className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Emergency & Guardian
                </dt>
                <dd className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm"><User className="w-5 h-5 text-indigo-600"/></div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Guardian Name</div>
                        <div className="text-sm font-black text-slate-800">{profile.guardian_name || 'N/A'}</div>
                      </div>
                  </div>
                  {profile.guardian_phone && (
                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm"><Phone className="w-5 h-5 text-indigo-600"/></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Guardian Contact</div>
                          <div className="text-sm font-black text-slate-800">{profile.guardian_phone}</div>
                        </div>
                    </div>
                  )}
                </dd>
              </div>
            </dl>
          ) : activeTab === 'results' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" /> Academic Performance
              </h3>
              
              {results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {results.map((r, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 font-bold text-slate-900 text-sm">Sem {r.semester}</td>
                          <td className="py-4 font-bold text-slate-600 text-sm">{r.subject_name}</td>
                          <td className="py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                              {r.marks}/{r.total_marks}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-black ${
                              r.grade === 'O' || r.grade === 'E' || r.grade === 'A' ? 'bg-emerald-50 text-emerald-600' :
                              r.grade === 'F' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {r.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="text-sm font-bold text-slate-400">No results found for your profile yet.</div>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> Attendance Overview
              </h3>

              {attendance ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Days</div>
                      <div className="text-2xl font-black text-indigo-600">{attendance.summary.total}</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Present</div>
                      <div className="text-2xl font-black text-emerald-600">{attendance.summary.present}</div>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Absent</div>
                      <div className="text-2xl font-black text-rose-600">{attendance.summary.absent}</div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-slate-500">Percentage</div>
                      <div className="text-2xl font-black text-white">{attendance.summary.percentage}%</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {attendance.history.map((record, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-bold text-slate-900 text-sm">
                              {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </td>
                            <td className="py-4 text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black ${
                                record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 rounded-[2rem] p-12 text-center border border-slate-100">
                  <p className="text-sm font-bold text-slate-400 italic">No attendance records found yet.</p>
                </div>
              )}
            </div>
          )
        }
        </div>
      </div>
    </div>
  </div>
  );
}

export default StudentDashboard;
