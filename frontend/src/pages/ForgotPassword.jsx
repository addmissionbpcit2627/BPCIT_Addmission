import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

// Generates a random math captcha question
function generateCaptcha() {
  const ops = ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const a = Math.floor(Math.random() * 10) + 1;
  const b = op === '-' ? Math.floor(Math.random() * a) + 1 : Math.floor(Math.random() * 10) + 1;
  return { question: `${a} ${op} ${b} = ?`, answer: op === '+' ? a + b : a - b };
}

export default function ForgotPassword({ accountType = 'student' }) {
  const [step, setStep] = useState('verify'); // 'verify' | 'reset' | 'done'
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');        // department (teacher) or DOB (student)
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const navigate = useNavigate();

  // Refresh captcha on mount and on wrong answer
  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  // Step 1 — verify identity
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    // Captcha check (client-side first)
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setCaptchaError('Incorrect answer. Please solve the math problem.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password/verify", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          name: name.trim(),
          extra: extra.trim(),
          accountType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        refreshCaptcha();
        return;
      }
      setResetToken(data.token);
      setStep('reset');
    } catch {
      setError('Network error. Please try again.');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — set new password
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');

    // Password strength check
    const strongEnough = /[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword);
    if (!strongEnough) return setError('Password should include at least one number, uppercase letter, or special character');

    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password/reset", {
        token: resetToken,
        newPassword
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['verify', 'reset', 'done'];
  const currentIdx = STEPS.indexOf(step);
  const inputClass = "block w-full bg-white/90 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner";

  // Password strength indicator
  const strengthScore = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^a-zA-Z0-9]/.test(newPassword),
  ].filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px] -ml-64 -mb-64"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-[2rem] shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)]">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">
            Account Recovery
          </h2>
          <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-[0.3em]">
            BPC Institute Security Protocol
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-10 bg-white/40 backdrop-blur-xl p-4 rounded-3xl border border-white/60 shadow-lg max-w-fit mx-auto px-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                step === s ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110 shadow-indigo-200' : currentIdx > i ? 'bg-emerald-500 text-white' : 'bg-white/50 text-slate-300'
              }`}>
                {currentIdx > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`h-1 w-6 rounded-full transition-colors ${currentIdx > i ? 'bg-emerald-400' : 'bg-slate-200/50'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[3rem] border border-white/60">
          {error && (
            <div className="mb-6 bg-rose-50/80 backdrop-blur-md border border-rose-100 p-4 rounded-2xl text-rose-600 text-[11px] font-black flex items-center gap-3 shadow-sm">
              <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
              {error}
            </div>
          )}

          {/* ── Step 1: Verify Identity ───────────────────── */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  {accountType === 'student' ? 'Student Identity' : 'Staff Identifier'}
                </label>
                <input type="text" required
                  placeholder={accountType === 'student' ? 'Email or Roll ID' : 'Professional Email'}
                  value={identifier} onChange={e => setIdentifier(e.target.value)}
                  className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Legal Name</label>
                <input type="text" required placeholder="As per records"
                  value={name} onChange={e => setName(e.target.value)}
                  className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  {accountType === 'student' ? 'Birth Particulars' : 'Primary Department'}
                </label>
                {accountType === 'student' ? (
                  <input
                    type="date"
                    required
                    value={extra} onChange={e => setExtra(e.target.value)}
                    className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  />
                ) : (
                  <select
                    required
                    value={extra} onChange={e => setExtra(e.target.value)}
                    className="block w-full bg-white/40 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                  >
                    <option value="">Select Department</option>
                    {['CST', 'ETCE', 'ME', 'CE', 'EE'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Math CAPTCHA */}
              <div className="bg-slate-50/50 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-inner">
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 text-center">
                  Verify You Are Human
                </label>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl font-black text-indigo-700 bg-white rounded-2xl px-6 py-4 border border-indigo-100 shadow-sm min-w-[7rem] text-center">
                    {captcha.question}
                  </span>
                  <input type="number" required placeholder="="
                    value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                    className="w-28 bg-white border border-indigo-100 rounded-2xl py-4 px-4 text-2xl font-black text-center text-slate-900 focus:ring-4 focus:ring-indigo-500/10 shadow-sm outline-none"
                  />
                  <button type="button" onClick={refreshCaptcha}
                    className="p-3 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-2xl transition-all border border-indigo-100 hover:border-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
                  </button>
                </div>
                {captchaError && <p className="text-[11px] text-rose-600 mt-3 font-bold text-center">{captchaError}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_12px_25px_-5px_rgba(139,92,246,0.4)] disabled:opacity-60 transition-all transform hover:-translate-y-1 active:scale-[0.98]">
                {loading ? 'PROCESSING...' : 'INITIALIZE RECOVERY'}
              </button>
            </form>
          )}

          {/* ── Step 2: Set New Password ──────────────────── */}
          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Identity verified! This session expires in 10 minutes.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required placeholder="Min. 6 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strengthScore ? strengthColors[strengthScore] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${['','text-red-500','text-yellow-600','text-blue-600','text-green-600'][strengthScore]}`}>
                      {strengthLabels[strengthScore]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" required placeholder="Re-enter new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={`${inputClass} ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:ring-red-400' : ''}`} />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p className="font-medium">Password requirements:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  {[
                    ['At least 6 characters', newPassword.length >= 6],
                    ['One uppercase letter', /[A-Z]/.test(newPassword)],
                    ['One number', /[0-9]/.test(newPassword)],
                    ['One special character', /[^a-zA-Z0-9]/.test(newPassword)],
                  ].map(([label, met]) => (
                    <li key={label} className={met ? 'text-green-600' : 'text-gray-500'}>
                      {met ? '✓' : '○'} {label}
                    </li>
                  ))}
                </ul>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {loading ? 'Saving...' : 'Set New Password'}
              </button>
            </form>
          )}

          {/* ── Step 3: Done ──────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center space-y-6 py-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <div>
                <p className="text-xl font-bold text-slate-800">Mission Accomplished!</p>
                <p className="text-sm text-slate-500 mt-1">Your password has been reset successfully.</p>
              </div>
              <button onClick={() => navigate(accountType === 'student' ? '/' : '/teacher/login')}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] transition-all transform hover:-translate-y-0.5 cursor-pointer">
                Go to Login
              </button>
            </div>
          )}
        </div>

        {step !== 'done' && (
          <div className="mt-4 text-center">
            <Link to={accountType === 'student' ? '/' : '/teacher/login'} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
