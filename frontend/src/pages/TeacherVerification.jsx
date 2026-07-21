import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Check,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function TeacherVerification() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal/Drawer state
  const [selectedApp, setSelectedApp] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState(null);
  
  // Success details state (when approved)
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(null);

  const navigate = useNavigate();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admissions');
      setApplications(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch pending admission applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id) => {
    setVerifying(true);
    setActionError(null);
    try {
      const response = await api.post(`/admissions/${id}/verify`);
      setEnrollmentSuccess(response.data);
      // Refresh the application list
      fetchApplications();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to approve application.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this admission application? This action cannot be undone.')) {
      return;
    }
    setRejecting(true);
    setActionError(null);
    try {
      await api.post(`/admissions/${id}/reject`);
      setSelectedApp(null);
      // Refresh the list
      fetchApplications();
      alert('Admission application rejected.');
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to reject application.');
    } finally {
      setRejecting(false);
    }
  };

  const filteredApps = applications.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.phone.includes(searchQuery)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10 animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl -z-10 animate-pulse duration-10000"></div>

      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admissions Verification</h1>
            <p className="text-slate-500 font-medium italic">Review submitted documents and verify registrations.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-300" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-white border-b-2 shadow-sm font-bold text-slate-500">
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
            Loading admission requests...
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-center text-rose-600 font-bold max-w-lg mx-auto shadow-sm">
            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-16 text-center border border-white shadow-sm max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">All Caught Up!</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No pending applications need verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedApp(app);
                  setEnrollmentSuccess(null);
                  setActionError(null);
                }}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 cursor-pointer hover:shadow-xl hover:border-indigo-200 transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-64 relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {app.department}
                    </span>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {app.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {app.name}
                  </h3>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="text-slate-600 truncate">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="text-slate-600">{app.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100/80 pt-4 mt-4 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Applied: {formatDate(app.created_at)}
                  </span>
                  <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Review <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-999 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-white max-w-2xl w-full max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl relative animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200/50 p-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Reviewing Candidate</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{selectedApp.name}</h2>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-grow custom-scrollbar">
              
              {/* Enrollment Success banner */}
              {enrollmentSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-900 leading-tight">Student Verified & Enrolled!</h3>
                    <p className="text-xs text-emerald-700/80 mt-1 font-semibold">The student database record has been created successfully.</p>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-2xl p-4 grid grid-cols-2 gap-4 text-left">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Generated Roll No</span>
                      <span className="text-sm font-black text-indigo-600">{enrollmentSuccess.rollNo}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Registration ID</span>
                      <span className="text-sm font-black text-indigo-600">{enrollmentSuccess.registrationNo}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setEnrollmentSuccess(null);
                    }}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              )}

              {actionError && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-600 text-xs font-bold items-center">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {!enrollmentSuccess && (
                <>
                  {/* Candidate particulars */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Candidate Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <User className="w-4.5 h-4.5 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Guardian Name</span>
                          <span className="text-xs font-bold text-slate-800">{selectedApp.guardian_name}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4.5 h-4.5 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                          <span className="text-xs font-bold text-slate-800">{formatDate(selectedApp.dob)}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Layers className="w-4.5 h-4.5 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Department Code</span>
                          <span className="text-xs font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">{selectedApp.department}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-4.5 h-4.5 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Contact Mobile</span>
                          <span className="text-xs font-bold text-slate-800">{selectedApp.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="w-4.5 h-4.5 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Caste Category</span>
                          <span className="text-xs font-bold text-slate-800">{selectedApp.caste}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-4.5 h-4.5 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">EWS Status</span>
                          <span className="text-xs font-bold text-slate-800">{selectedApp.is_ews === 1 ? 'Yes (Falls under EWS)' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents verification */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Uploaded Certificates (PDF)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Required documents mapping */}
                      {[
                        { label: 'Aadhaar Card', file: selectedApp.aadhar_path },
                        { label: 'Allotment Slip', file: selectedApp.allotment_path },
                        { label: 'Rank Card', file: selectedApp.rank_path },
                        { label: 'Domicile Cert.', file: selectedApp.domicile_path },
                        { label: 'Caste Certificate', file: selectedApp.caste_path, isConditional: selectedApp.caste !== 'Gen' },
                        { label: 'EWS Certificate', file: selectedApp.ews_path, isConditional: selectedApp.is_ews === 1 },
                        { label: 'Anti-Ragging Undertaking', file: selectedApp.antiragging_path, isOptional: true }
                      ].map((doc, index) => {
                        if (doc.isOptional && !doc.file) return null;
                        if (doc.isConditional === false) return null;

                        return (
                          <a
                            key={index}
                            href={`${API_BASE}/uploads/${doc.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-400 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-7 h-7 text-indigo-500 shrink-0" />
                              <div>
                                <span className="block text-xs font-bold text-slate-800 leading-tight">{doc.label}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Click to view/verify</span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            {!enrollmentSuccess && (
              <div className="bg-slate-50 border-t border-slate-200/50 p-6 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={verifying || rejecting}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-100 transition-all cursor-pointer disabled:opacity-55"
                >
                  <X className="w-4.5 h-4.5" /> Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={verifying || rejecting}
                  className="flex-grow inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-100 transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-55"
                >
                  <Check className="w-4.5 h-4.5" /> Verify & Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherVerification;
