import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInterface';
import { GraduationCap } from 'lucide-react';

const DEPARTMENTS = ['CST', 'ME', 'CE', 'EE'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── Student Portal (default landing) ───────────────────────────────────────
function StudentPortal() {
  const [tab, setTab] = useState('login');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-3xl border-b border-white/60 py-5 px-8 flex items-center gap-4 fixed top-0 w-full z-50">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-2.5 shadow-xl shadow-blue-200">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-black text-slate-900 text-xl tracking-tighter block leading-none">Student Portal</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">BPC Institute of Technology</span>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col justify-center py-20 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          {/* Abstract network learning video */}
          <source src="https://cdn.pixabay.com/video/2019/04/10/22684-330058869_large.mp4" type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-indigo-900/10 z-0 backdrop-blur-[2px]"></div>

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter drop-shadow-sm">
              {tab === 'login' ? 'Keep Learning' : 'Start Journey'}
            </h2>
            <p className="text-sm font-black text-blue-600/60 uppercase tracking-widest">BPC Institute Registration Hub</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-3xl bg-white/40 backdrop-blur-xl p-1.5 mb-10 border border-white/60 shadow-xl">
            <button onClick={() => setTab('login')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all ${tab === 'login' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}>
              Sign In
            </button>
            <button onClick={() => setTab('register')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all ${tab === 'register' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}>
              New Student
            </button>
          </div>

          {tab === 'login' ? <StudentLogin /> : <StudentRegister />}

          {/* Admission CTA Banner */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 block mb-1">New Admission Session 2026</span>
              <h3 className="text-lg font-black tracking-tight leading-tight">Apply for Online Admission</h3>
              <p className="text-xs text-blue-100/80 mt-1 font-semibold">Upload certificates and secure your slot today.</p>
            </div>
            <Link to="/admission" className="bg-white text-indigo-600 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-2xl shadow-md shrink-0 transform hover:-translate-y-0.5">
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Login Form ──────────────────────────────────────────────────────
function StudentLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { success, message, role } = await login(identifier, password);
    if (success) {
      navigate(role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
    } else {
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-2xl py-8 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] border border-white/50">
      {error && <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Email or Roll Number</label>
          <input type="text" required placeholder="e.g. rahul@bpc.edu or CST001"
            value={identifier} onChange={e => setIdentifier(e.target.value)}
            className="block w-full bg-white/90 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
          <input type="password" required placeholder="Enter your password"
            value={password} onChange={e => setPassword(e.target.value)}
            className="block w-full bg-white/90 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] disabled:opacity-60 transition-all mt-4 cursor-pointer transform hover:-translate-y-0.5">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="text-center mt-5">
          <Link to="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors">
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
}

// ── Student Register Form ───────────────────────────────────────────────────
function StudentRegister() {
  const [form, setForm] = useState({
    name: '', email: '', roll_no: '', registration_no: '',
    department: '', semester: '', password: '', confirmPassword: '',
    gender: '', dob: '', blood_group: '', admission_year: '',
    guardian_name: '', guardian_phone: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, roll_no: form.roll_no,
          registration_no: form.registration_no, department: form.department,
          semester: form.semester, password: form.password,
          gender: form.gender, dob: form.dob || null,
          blood_group: form.blood_group,
          admission_year: form.admission_year,
          guardian_name: form.guardian_name, guardian_phone: form.guardian_phone,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Registration failed');
      await login(form.email, form.password);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inp = (label, name, type = 'text', required = false, placeholder = '') => (
    <div>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{label}{required && ' *'}</label>
      <input type={type} name={name} required={required} placeholder={placeholder}
        value={form[name]} onChange={handleChange}
        className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all font-bold" />
    </div>
  );

  return (
    <div className="bg-white/70 backdrop-blur-3xl py-8 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] border border-white/60 max-h-[72vh] overflow-y-auto custom-scrollbar">
      {error && (
        <div className="mb-4 bg-rose-50/80 backdrop-blur-md border border-rose-100 p-4 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-3 shadow-sm">
          <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Information */}
        <section>
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 border-b border-blue-100/50 pb-3 flex items-center gap-3">
            <span className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>
            Identity & Academic
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">{inp('Full Name', 'name', 'text', true, 'Legal Name')}</div>
            <div className="col-span-2">{inp('Professional Email', 'email', 'email', true, 'you@bpc.edu')}</div>
            <div>{inp('Roll ID', 'roll_no', 'text', true, 'e.g. CST001')}</div>
            <div>{inp('Registration', 'registration_no', 'text', false, 'Univ Seq')}</div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Department *</label>
              <select name="department" required value={form.department} onChange={handleChange}
                className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Semester *</label>
              <select name="semester" required value={form.semester} onChange={handleChange}
                className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Personal Details */}
        <section>
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 border-b border-indigo-100/50 pb-3 flex items-center gap-3">
            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
            Personal Particulars
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-white text-sm transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Blood Group</label>
              <select name="blood_group" value={form.blood_group} onChange={handleChange}
                className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-white text-sm transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                <option value="">Select</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>{inp('Date of Birth', 'dob', 'date')}</div>
            <div>{inp('Admission', 'admission_year', 'number', false, 'YYYY')}</div>
          </div>
        </section>

        {/* Guardian Information */}
        <section>
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 border-b border-emerald-100/50 pb-3 flex items-center gap-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Guardian & Emergency
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div>{inp("Legal Guardian", 'guardian_name', 'text', false, 'Full Name')}</div>
            <div>{inp("Primary Contact", 'guardian_phone', 'tel', false, 'Phone No')}</div>
          </div>
        </section>

        {/* Set Password */}
        <section>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 border-b border-slate-200 pb-3 flex items-center gap-3">
            <span className="w-2 h-2 bg-slate-900 rounded-full"></span>
            Security
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div>{inp('Password', 'password', 'password', true, 'Min. 6 chars')}</div>
            <div>{inp('Confirm', 'confirmPassword', 'password', true, 'Match')}</div>
          </div>
        </section>

        <button type="submit" disabled={loading}
          className="w-full py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_12_25px_-5px_rgba(79,70,229,0.4)] disabled:opacity-60 transition-all mt-4 transform hover:-translate-y-1 active:scale-[0.98]">
          {loading ? 'INITIALIZING ACCOUNT...' : 'COMPLETE ENROLLMENT'}
        </button>
      </form>
    </div>
  );
}

export default StudentPortal;
