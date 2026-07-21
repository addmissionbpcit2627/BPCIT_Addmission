import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Download, Edit, ArrowLeft, Mail, Phone, MapPin, User, FileText } from 'lucide-react';
import { AuthContext } from '../context/AuthContextInterface';

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useContext(AuthContext); // Used to determine if Teacher or Student is viewing
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id, role]);

  const fetchProfile = async () => {
    try {
      let res;
      if (role === 'teacher') {
        res = await api.get(`/teachers/students/${id}`);
      } else {
        // Students can only view their own profile via /me
        res = await api.get('/students/me');
      }
      setStudent(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const url = role === 'teacher' 
        ? `${import.meta.env.VITE_API_URL}/api/teachers/students/${student.id}/export/${format}`
        : `${import.meta.env.VITE_API_URL}/api/students/me/export/${format}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = role === 'teacher' ? `student_${student.roll_no}_profile.${ext}` : `my_profile.${ext}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading profile...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!student) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          {role === 'teacher' && (
            <button 
              onClick={() => navigate('/teacher/students')} 
              className="p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all group"
            >
              <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Profile</h1>
            <p className="text-slate-500 font-medium italic text-xs mt-1">Detailed academic and personal registry.</p>
          </div>
        </div>

        {role === 'teacher' && (
          <div className="flex flex-wrap gap-3">
             <button
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center px-5 py-3 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-black rounded-2xl text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Download className="w-4 h-4 text-rose-500 mr-2" />
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="inline-flex items-center px-5 py-3 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-black rounded-2xl text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Download className="w-4 h-4 text-green-500 mr-2" />
                EXCEL
              </button>
              <button
                onClick={() => navigate(`/teacher/students/edit/${student.id}`)}
                className="inline-flex items-center px-6 py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] transition-all transform hover:-translate-y-0.5"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Record
              </button>
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden border border-white/60">
        {/* Profile Header Card */}
        <div className="px-8 py-10 sm:px-10 bg-gradient-to-br from-indigo-600 to-purple-600 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl text-white"></div>
          
          <div className="flex-shrink-0 relative z-10">
             {student.photo ? (
                <img 
                  className="h-36 w-36 rounded-3xl object-cover border-4 border-white/30 shadow-2xl relative transform rotate-3 hover:rotate-0 transition-all" 
                  src={`${import.meta.env.VITE_API_URL}/uploads/${student.photo}`} 
                  alt={student.name} 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
                />
              ) : (
                <div className="h-36 w-36 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl text-white font-black border-2 border-white/40 shadow-xl relative transform -rotate-2 hover:rotate-0 transition-transform tracking-tight">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
          </div>
          <div className="text-center sm:text-left relative z-10 pt-2">
            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">{student.name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mt-3 border border-white/20 shadow-sm">
              {student.department} <span className="opacity-40">•</span> Semester {student.semester}
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-indigo-50">
              <div className="flex items-center bg-black/10 px-3 py-2 rounded-xl border border-white/5">
                <FileText className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span>ROLL: <span className="text-white ml-1">{student.roll_no}</span></span>
              </div>
              <div className="flex items-center bg-black/10 px-3 py-2 rounded-xl border border-white/5">
                <FileText className="w-3.5 h-3.5 mr-2 opacity-70" />
                <span>REG: <span className="text-white ml-1">{student.registration_no}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-10">
          <dl className="grid grid-cols-1 gap-10">
            {/* Contact Information */}
            <div>
              <dt className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Contact Information
              </dt>
              <dd className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email</div>
                  <div className="text-sm font-bold text-slate-800 break-all">{student.email}</div>
                </div>
                {student.phone && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3"/> Phone</div>
                    <div className="text-sm font-bold text-slate-800">{student.phone}</div>
                  </div>
                )}
                {student.address && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner sm:col-span-2 md:col-span-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Address</div>
                    <div className="text-sm font-bold text-slate-800 leading-tight">{student.address}</div>
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
                   <div className="text-sm font-black text-slate-800">{student.gender || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                   <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-red-400">Blood</div>
                   <div className="text-sm font-black text-red-600">{student.blood_group || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                   <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Birth Date</div>
                   <div className="text-sm font-black text-slate-800 truncate">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner text-center">
                   <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-indigo-500">Class</div>
                   <div className="text-sm font-black text-indigo-600 truncate">S{student.semester} / {student.admission_year || 'N/A'}</div>
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
                      <div className="text-sm font-black text-slate-800">{student.guardian_name || 'N/A'}</div>
                    </div>
                 </div>
                 {student.guardian_phone && (
                   <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm"><Phone className="w-5 h-5 text-indigo-600"/></div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Guardian Contact</div>
                        <div className="text-sm font-black text-slate-800">{student.guardian_phone}</div>
                      </div>
                   </div>
                 )}
               </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
  );
}

export default StudentProfile;
