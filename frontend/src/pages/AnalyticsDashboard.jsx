import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, GraduationCap, LayoutDashboard, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/summary');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold tracking-tight">Gathering insights...</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <button 
                onClick={() => navigate('/teacher/dashboard')}
                className="hover:bg-indigo-100 p-1 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest">Teacher Portal</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Analytics Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Enrollment</p>
              <h2 className="text-2xl font-black text-slate-900 leading-none">{data.total}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Department-wise Distribution */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Department-wise Students
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departments}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.departments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Semester-wise Distribution */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Semester Distribution
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.semesters}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.semesters.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Gender Distribution and Summary Stats */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 md:col-span-1">
              <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest">Gender Mix</h3>
              <div className="space-y-4">
                {data.genders.map((g, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-600">{g.name}</span>
                    <span className="text-lg font-black text-indigo-600">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2rem] shadow-lg md:col-span-2 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <h3 className="text-xl font-bold mb-4 relative z-10">Data Insights</h3>
                <p className="text-indigo-50 font-medium mb-6 relative z-10 opacity-90 leading-relaxed">
                  The current enrollment shows high engagement in {data.departments[0]?.name || 'various'} departments. 
                  Most students are currently active in {data.semesters[0]?.name || 'initial'} semesters.
                </p>
                <div className="flex flex-wrap gap-4 relative z-10">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-[10px] font-black uppercase opacity-60 block">Departments</span>
                    <span className="text-lg font-black">{data.departments.length}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-[10px] font-black uppercase opacity-60 block">Active Semesters</span>
                    <span className="text-lg font-black">{data.semesters.length}</span>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
