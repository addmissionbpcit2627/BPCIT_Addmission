import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContextInterface';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

function Navbar() {
  const { user, role, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-white/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 py-3">
          <div className="flex items-center">
            <Link to={role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} className="group flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg transform group-hover:rotate-6 transition-transform">
                <div className="w-5 h-5 text-white flex items-center justify-center font-black text-xs italic">B</div>
              </div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                BPC <span className="text-indigo-600 italic">Institute</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden md:flex items-center px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-slate-600 shadow-inner">
                  <User className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                  <span className="text-xs font-bold tracking-wide uppercase">{user.name}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">{role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_4px_12px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
