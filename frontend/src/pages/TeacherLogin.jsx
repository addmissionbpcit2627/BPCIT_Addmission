import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInterface';
import { Lock, Mail, BookOpen, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = ['CST', 'ETCE', 'ME', 'CE', 'EE'];

// ── Secret access code stored here — share only with school staff ────────────
// Change this to any code you want (e.g. your school code / PIN)
const TEACHER_ACCESS_CODE = 'BPCCOLLEGE@2026';

export default function TeacherLogin() {
  // Gate state — must pass before seeing login/register
  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [tab, setTab] = useState('login');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (codeInput === TEACHER_ACCESS_CODE) {
      setUnlocked(true);
      setCodeError('');
    } else {
      setCodeError('Invalid access code. Please contact your school administrator.');
      setCodeInput('');
    }
  };

  // ── Access Code Gate Screen ─────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated Background Decor */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-[120px] -ml-48 -mt-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-[120px] -mr-48 -mb-48"></div>

        <div className="w-full max-w-sm bg-white/70 backdrop-blur-3xl p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)]">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-center text-3xl font-black text-slate-900 mb-2 tracking-tight">Staff Entrance</h1>
          <p className="text-center text-sm text-slate-500 mb-10 font-bold italic">BPC Institute of Technology</p>

          <form onSubmit={handleUnlock} className="space-y-5">
            <div className="relative">
              <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 px-1 text-center">Enter Access Code</label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="off"
                  required
                  className="w-full bg-white/50 text-slate-900 placeholder-slate-300 border border-slate-200 rounded-2xl py-4 px-5 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono tracking-[0.3em] text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {codeError && (
              <div className="bg-rose-50/80 backdrop-blur-md border border-rose-100 rounded-2xl p-4 text-rose-600 text-[11px] font-bold flex items-center gap-3 shadow-sm">
                <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
                {codeError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_12px_25px_-5px_rgba(139,92,246,0.4)] transition-all transform hover:-translate-y-1 active:scale-[0.98] uppercase tracking-widest"
            >
              Verify Identity
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-8 font-black uppercase tracking-tighter opacity-60">
            Secure Portal Restricted Access
          </p>
        </div>
      </div>
    );
  }

  // ── Teacher Login / Register (shown only after code verified) ─────────────
  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-3xl border-b border-white/60 py-5 px-8 flex items-center gap-4 fixed top-0 w-full z-50">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-2.5 shadow-xl shadow-indigo-200">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <span className="font-black text-slate-900 text-xl tracking-tighter block leading-none">Teacher Portal</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">BPC Institute Documentation</span>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-2 text-[10px] text-indigo-600 bg-white/80 border border-white/60 px-4 py-1.5 rounded-full font-black shadow-sm uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Staff
          </span>
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
          {/* Library bokeh moving background */}
          <source src="https://cdn.pixabay.com/video/2021/08/25/86236-592750893_large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10 z-0 backdrop-blur-[2px]"></div>

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter drop-shadow-sm">
              {tab === 'login' ? 'Welcome Back' : 'Create Profile'}
            </h2>
            <p className="text-sm font-black text-indigo-600/60 uppercase tracking-widest">BPC Institute of Technology</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-3xl bg-white/40 backdrop-blur-xl p-1.5 mb-10 border border-white/60 shadow-xl">
            <button onClick={() => setTab('login')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all ${tab === 'login' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}>
              Sign In
            </button>
            <button onClick={() => setTab('register')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all ${tab === 'register' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}>
              Join Staff
            </button>
          </div>

          {tab === 'login' ? <TeacherLoginForm /> : <TeacherRegisterForm />}
        </div>
      </div>
    </div>
  );
}

// ── Teacher Login Form ──────────────────────────────────────────────────────
function TeacherLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { success, message, role } = await login(email, password);
    if (success) {
      if (role === 'teacher') navigate('/teacher/dashboard');
      else { setError('This account is not a teacher account.'); setLoading(false); }
    } else {
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-3xl py-10 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] border border-white/60">
      {error && (
        <div className="mb-6 bg-rose-50/80 backdrop-blur-md border border-rose-100 p-4 rounded-2xl text-rose-600 text-xs font-black flex items-center gap-3 shadow-sm">
          <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Professional Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-indigo-600 transition-colors">
              <Mail className="h-5 w-5 text-slate-300" />
            </div>
            <input type="email" required placeholder="teacher@bpc.edu"
              value={email} onChange={e => setEmail(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white/40 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Secure Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-indigo-600 transition-colors">
              <Lock className="h-5 w-5 text-slate-300" />
            </div>
            <input type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white/40 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_12px_25px_-5px_rgba(139,92,246,0.4)] disabled:opacity-60 transition-all mt-4 transform hover:-translate-y-1 active:scale-[0.98]">
          {loading ? 'AUTHENTICATING...' : 'ACCESS PORTAL'}
        </button>
        <div className="text-center mt-6">
          <Link to="/teacher/forgot-password" alt="Forgot Password" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-700 transition-colors">
            Account Recovery
          </Link>
        </div>
      </form>
    </div>
  );
}

// ── Teacher Register Form ───────────────────────────────────────────────────
function TeacherRegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', subject: '', department: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.department) return setError('Please select your department');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, subject: form.subject, department: form.department }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Registration failed');
      await login(form.email, form.password);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-2xl py-8 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] border border-white/50">
      {error && <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name *</label>
          <input type="text" name="name" required placeholder="Dr. Priya Sharma"
            value={form.name} onChange={handleChange}
            className="block w-full bg-white/90 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Department *</label>
          <select name="department" required value={form.department} onChange={handleChange}
            className="block w-full bg-white/90 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner">
            <option value="">Select your department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <p className="text-[10px] text-slate-500 mt-1 font-medium pl-1 italic">Authorized managed department access only.</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Email *</label>
          <input type="email" name="email" required placeholder="teacher@bpc.edu"
            value={form.email} onChange={handleChange}
            className="block w-full bg-white/90 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject (optional)</label>
          <input type="text" name="subject" placeholder="e.g. Mathematics"
            value={form.subject} onChange={handleChange}
            className="block w-full bg-white/90 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password *</label>
            <input type="password" name="password" required placeholder="6+ chars"
              value={form.password} onChange={handleChange}
              className="block w-full bg-white/90 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm *</label>
            <input type="password" name="confirmPassword" required placeholder="Re-enter"
              value={form.confirmPassword} onChange={handleChange}
              className="block w-full bg-white/90 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full mt-4 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] disabled:opacity-60 transition-all cursor-pointer transform hover:-translate-y-0.5">
          {loading ? 'Creating Account...' : 'Create Teacher Account'}
        </button>
      </form>
    </div>
  );
}
