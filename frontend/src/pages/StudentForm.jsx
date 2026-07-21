import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInterface';

function StudentForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const teacherDept = user?.department || '';

  const [formData, setFormData] = useState({
    name: '',
    roll_no: '',
    registration_no: '',
    department: teacherDept,
    semester: '',
    gender: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    blood_group: '',
    admission_year: '',
    password: '',
  });

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);

  const fetchStudent = useCallback(async () => {
    try {
      const res = await api.get(`/teachers/students/${id}`);
      // Format date
      const student = res.data;
      if (student.dob) {
        student.dob = new Date(student.dob).toISOString().split('T')[0];
      }
      student.password = ''; // Don't populate password
      setFormData(student);
    } catch {
      setError('Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchStudent();
    }
  }, [isEditMode, fetchStudent]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });
    if (photo) {
      data.append('photo', photo);
    }

    try {
      if (isEditMode) {
        await api.put(`/teachers/students/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Student updated successfully');
      } else {
        await api.post('/teachers/students', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Student added successfully');
      }
      navigate('/teacher/students');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading form...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border border-white/60 px-10 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {isEditMode ? 'Update Profile' : 'Enroll Student'}
          </h1>
          <p className="text-slate-500 font-medium italic mt-1">
            {isEditMode ? 'Modify existing student records with accuracy.' : 'Register a new student within your department.'}
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50/50 backdrop-blur-md border border-red-200 p-4 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-3">
            <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2">
            
            {/* Required Account Info */}
            <div className="sm:col-span-2 border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Academic & Access</h3>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Full Name <span className="text-indigo-500">*</span></label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="Student's Legal Name" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Email <span className="text-indigo-500">*</span></label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="personal@example.com" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Roll ID <span className="text-indigo-500">*</span></label>
              <input type="text" name="roll_no" required value={formData.roll_no} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="e.g. 2024CS001" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Registration <span className="text-indigo-500">*</span></label>
              <input type="text" name="registration_no" required value={formData.registration_no} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="Univ Reg Sequence" />
            </div>

            {/* Department — locked to teacher's department */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Department</label>
              <div className="block w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-black text-indigo-700 shadow-inner italic">
                {teacherDept || formData.department || '—'}
              </div>
            </div>


            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Semester <span className="text-indigo-500">*</span></label>
              <select name="semester" required value={formData.semester} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                <option value="">Select Sem</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Admission Year</label>
              <input type="number" name="admission_year" value={formData.admission_year} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="2024" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                {isEditMode ? 'Reset Password' : 'Login Password *'}
              </label>
              <input type="password" name="password" required={!isEditMode} value={formData.password} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-slate-800" placeholder={isEditMode ? "Leave empty to keep current" : "Minimum 6 characters"} />
            </div>

            {/* Personal Info */}
            <div className="sm:col-span-2 border-b border-slate-100 pb-3 mb-2 mt-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-purple-600 rounded-full"></span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Personal Details</h3>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-bold text-slate-800 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-bold text-slate-800" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="+91 00000 00000" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Blood Group</label>
              <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="e.g. O+ve" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Current Address</label>
              <textarea name="address" rows="3" value={formData.address} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="Street, City, Pincode"></textarea>
            </div>

            {/* Guardian Info */}
            <div className="sm:col-span-2 border-b border-slate-100 pb-3 mb-2 mt-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Guardian Information</h3>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Guardian Name</label>
              <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="Parent or Guardian" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Guardian Phone</label>
              <input type="text" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} className="block w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-bold text-slate-800 placeholder-slate-400" placeholder="Emergency Contact No" />
            </div>

             {/* Photo */}
            <div className="sm:col-span-2 border-b border-slate-100 pb-3 mb-2 mt-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-rose-500 rounded-full"></span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Profile Media</h3>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Identity Photo</label>
              <div className="mt-1 flex items-center gap-4 bg-slate-50/80 p-5 rounded-2xl border-2 border-dashed border-slate-200">
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-xs font-bold text-slate-500 file:mr-6 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
              </div>
            </div>

          </div>

          <div className="pt-10 mt-8 border-t border-slate-100 flex justify-end items-center gap-4">
            <button type="button" onClick={() => navigate('/teacher/students')} className="px-8 py-3 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-10 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_8px_20px_-4px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_25px_-4px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all transform hover:-translate-y-0.5">
              {loading ? 'PROCESSING...' : (isEditMode ? 'UPDATE STUDENT' : 'ENROLL STUDENT')}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}

export default StudentForm;
