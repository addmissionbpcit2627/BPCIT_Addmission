import React from 'react';

function StatCard({ title, value, icon, bgClass }) {
  return (
    <div className="group bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_45px_rgb(139,92,246,0.1)] transition-all transform hover:-translate-y-1 relative overflow-hidden">
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
          <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl ${bgClass} shadow-inner transform group-hover:scale-110 group-hover:rotate-6 transition-all`}>
          {icon}
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-gradient-to-br from-transparent to-indigo-50/30 rounded-full blur-2xl"></div>
    </div>
  );
}

export default StatCard;
