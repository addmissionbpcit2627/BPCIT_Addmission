import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Cpu,
  Building,
  Zap,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';

const DEPARTMENTS = [
  {
    id: 'DCST',
    name: 'Computer Science & Technology',
    short: 'DCST',
    desc: 'Dive into Software Engineering, Web Development, and Algorithms.',
    icon: Cpu,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'DCE',
    name: 'Civil Engineering',
    short: 'DCE',
    desc: 'Design, build, and supervise infrastructures that shape the world.',
    icon: Building,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'DME',
    name: 'Mechanical Engineering',
    short: 'DME',
    desc: 'Explore thermodynamics, design, and manufacturing systems.',
    icon: BookOpen,
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'DEE',
    name: 'Electrical Engineering',
    short: 'DEE',
    desc: 'Power grids, circuitry, and modern energy transmission solutions.',
    icon: Zap,
    color: 'from-violet-500 to-purple-600'
  }
];

const OPTIONAL_DOCS = [
  { key: 'antiragging', name: 'Anti-Ragging Undertaking', desc: 'Notarized or student signed undertaking' }
];

function Admission() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    guardianName: '',
    phone: '',
    email: '',
    dob: '',
    department: '',
    caste: 'Gen',
    isEws: false
  });

  const [files, setFiles] = useState({
    aadhar: null,
    allotment: null,
    rank: null,
    domicile: null,
    caste: null,
    antiragging: null,
    ews: null
  });

  const getRequiredDocs = () => {
    const docs = [
      { key: 'aadhar', name: 'Aadhar Card', desc: 'UIDAI issued Aadhaar ID card' },
      { key: 'allotment', name: 'Allotment Letter', desc: 'Official college allotment slip' },
      { key: 'rank', name: 'Rank Card', desc: 'State/National level exam rank sheet' },
      { key: 'domicile', name: 'Domicile Certificate', desc: 'State residential proof certificate' }
    ];
    if (formData.caste !== 'Gen') {
      docs.push({ key: 'caste', name: 'Caste Certificate', desc: 'Community identity proof (SC/ST/OBC)' });
    }
    if (formData.isEws) {
      docs.push({ key: 'ews', name: 'EWS Certificate', desc: 'Economically Weaker Section certificate' });
    }
    return docs;
  };

  const [uploadProgress, setUploadProgress] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectDepartment = (deptId) => {
    setFormData({ ...formData, department: deptId });
  };

  const validateStep1 = () => {
    const { name, guardianName, phone, email, dob } = formData;
    if (!name.trim()) return 'Name is required';
    if (!guardianName.trim()) return 'Guardian Name is required';
    if (!phone.trim() || phone.length < 10) return 'Valid 10-digit Mobile Number is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Valid Email address is required';
    if (!dob) return 'Date of Birth is required';
    return null;
  };

  const handleNextStep1 = () => {
    const err = validateStep1();
    if (err) {
      alert(err);
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!formData.department) {
      alert('Please select a department to proceed.');
      return;
    }
    setStep(3);
  };

  // Handle document uploads
  const handleFileChange = (key, file) => {
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileErrors(prev => ({ ...prev, [key]: 'File size exceeds maximum limit of 5MB.' }));
      return;
    }

    // Validate mime type (PDF only)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileErrors(prev => ({ ...prev, [key]: 'Only PDF files are supported.' }));
      return;
    }

    // Clear previous error for this key
    setFileErrors(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    setFiles(prev => ({ ...prev, [key]: file }));

    // Simulate modern upload progress
    setUploadProgress(prev => ({ ...prev, [key]: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({ ...prev, [key]: progress }));
    }, 150);
  };

  const removeFile = (key) => {
    setFiles(prev => ({ ...prev, [key]: null }));
    setUploadProgress(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setFileErrors(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all required documents are uploaded
    const missingDocs = getRequiredDocs().filter(doc => !files[doc.key] || uploadProgress[doc.key] < 100);
    if (missingDocs.length > 0) {
      setSubmitError(`Please upload all required documents: ${missingDocs.map(d => d.name).join(', ')}.`);
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('guardianName', formData.guardianName);
    data.append('phone', formData.phone);
    data.append('email', formData.email);
    data.append('dob', formData.dob);
    data.append('department', formData.department);
    data.append('caste', formData.caste);
    data.append('isEws', formData.isEws);

    // Append files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        data.append(key, files[key]);
      }
    });

    try {
      const response = await api.post('/admissions', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccessData(response.data);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Server error occurred during submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-between mb-12 max-w-lg mx-auto">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center relative">
            <button
              onClick={() => {
                if (s < step) setStep(s);
              }}
              disabled={s > step}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all border-2 ${
                step === s
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                  : step > s
                  ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </button>
            <span
              className={`absolute top-12 whitespace-nowrap text-[10px] font-black uppercase tracking-wider ${
                step === s ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {s === 1 ? 'Information' : s === 2 ? 'Department' : 'Documents'}
            </span>
          </div>
          {s < 3 && (
            <div
              className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                step > s ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderUploadTile = (doc, isRequired = true) => {
    const { key, name, desc } = doc;
    const uploadedFile = files[key];
    const progress = uploadProgress[key];
    const error = fileErrors[key];

    return (
      <div key={key} className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between transition-all hover:shadow-md hover:bg-slate-50/80">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-slate-800 text-sm">{name}</span>
            {isRequired ? (
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Required</span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Optional</span>
            )}
          </div>
          <p className="text-slate-400 text-xs mb-4 leading-normal">{desc}</p>
        </div>

        {uploadedFile ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3 relative overflow-hidden">
            {progress < 100 && (
              <div
                className="absolute left-0 bottom-0 h-1 bg-indigo-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              ></div>
            )}
            <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block text-slate-800 text-xs font-bold truncate">{uploadedFile.name}</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            {progress === 100 ? (
              <button
                type="button"
                onClick={() => removeFile(key)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            ) : (
              <span className="text-xs font-black text-indigo-600 tracking-wider shrink-0">{progress}%</span>
            )}
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-white cursor-pointer transition-all block relative">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(key, e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <span className="block text-slate-800 text-xs font-bold mb-0.5">Click or drag PDF</span>
            <span className="text-[10px] text-slate-400">Max size 5MB</span>
          </label>
        )}

        {error && (
          <div className="mt-2.5 flex items-center gap-1.5 text-rose-600 text-[10px] font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl -z-10"></div>

        <div className="bg-white/80 backdrop-blur-3xl border border-white/60 p-10 max-w-xl w-full rounded-[2.5rem] shadow-2xl shadow-slate-200/50 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100 scale-105">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Admission Submitted!</h2>
          <p className="text-slate-500 text-sm font-semibold max-w-sm mx-auto mb-8">
            Your application for online admission has been recorded. Review status below:
          </p>

          <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Application ID</span>
              <span className="text-sm font-black text-indigo-600">#{successData.applicationId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Candidate Name</span>
              <span className="text-sm font-bold text-slate-800">{successData.details.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Email</span>
              <span className="text-sm font-bold text-slate-800">{successData.details.email}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Department Selected</span>
              <span className="text-sm font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                {successData.details.department}
              </span>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100/60 rounded-2xl p-5 mb-8 text-left flex gap-3.5 items-start">
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-1">What Happens Next?</h4>
              <p className="text-xs text-indigo-700/80 leading-normal font-medium">
                The institutional admission committee will verify your uploaded documents. Once approved, details regarding your new Roll Number and Registration details will be sent to your registered email address.
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-100 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            Return to Portal Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl -z-10 animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-30%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl -z-10 animate-pulse duration-10000"></div>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-3xl border-b border-white/60 py-5 px-8 flex items-center justify-between fixed top-0 w-full z-50">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-2.5 shadow-xl shadow-blue-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-slate-900 text-xl tracking-tighter block leading-none">Admission Application</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">BPC Institute of Technology</span>
          </div>
        </div>
        <Link
          to="/"
          className="text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest bg-slate-100/60 hover:bg-slate-100 py-2.5 px-5 rounded-xl border border-slate-200/50 transition-all"
        >
          Cancel
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-32 md:py-40">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/70 p-6 md:p-12 w-full max-w-4xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60">
          
          {renderProgressIndicator()}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">Student Particulars</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Provide candidate's legal information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Candidate Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-300" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleTextChange}
                        placeholder="e.g. Rahul Sharma"
                        className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>

                  {/* Guardian Name */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Legal Guardian Name *</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-300" />
                      <input
                        type="text"
                        name="guardianName"
                        required
                        value={formData.guardianName}
                        onChange={handleTextChange}
                        placeholder="e.g. Vijay Sharma"
                        className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile No */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-300" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        maxLength={10}
                        value={formData.phone}
                        onChange={handleTextChange}
                        placeholder="e.g. 9876543210"
                        className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-300" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleTextChange}
                        placeholder="e.g. rahul@example.com"
                        className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 pl-11 text-slate-900 placeholder-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>

                  {/* DOB */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Date of Birth *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-300" />
                      <input
                        type="date"
                        name="dob"
                        required
                        value={formData.dob}
                        onChange={handleTextChange}
                        className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 pl-11 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>

                  {/* Caste Dropdown */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Caste Category *</label>
                    <select
                      name="caste"
                      required
                      value={formData.caste}
                      onChange={handleTextChange}
                      className="block w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-indigo-500 text-sm font-semibold transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                    >
                      <option value="Gen">General (Gen)</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>

                  {/* EWS Checkbox */}
                  <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-200/50 p-4.5 rounded-2xl md:col-span-1 select-none">
                    <input
                      type="checkbox"
                      id="isEws"
                      name="isEws"
                      checked={formData.isEws}
                      onChange={(e) => setFormData({ ...formData, isEws: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500/50 cursor-pointer"
                    />
                    <label htmlFor="isEws" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Candidate falls under EWS (Economically Weaker Section)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    Select Department <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DEPARTMENT SELECTION */}
            {step === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">Select Department</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Choose your desired engineering stream</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {DEPARTMENTS.map((dept) => {
                    const Icon = dept.icon;
                    const isSelected = formData.department === dept.id;

                    return (
                      <div
                        key={dept.id}
                        onClick={() => selectDepartment(dept.id)}
                        className={`border rounded-[2rem] p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between h-48 relative overflow-hidden group ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/30'
                            : 'border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/40 hover:shadow-lg hover:shadow-slate-100'
                        }`}
                      >
                        <div>
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${dept.color} text-white flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-md`}>
                            <Icon className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">{dept.short}</span>
                          <h4 className="font-black text-slate-800 text-base leading-tight">{dept.name}</h4>
                        </div>
                        <p className="text-slate-400 text-xs leading-normal mt-2 line-clamp-2">{dept.desc}</p>
                        
                        {isSelected && (
                          <div className="absolute top-6 right-6 text-indigo-600">
                            <CheckCircle2 className="w-6 h-6 fill-indigo-50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Go Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    Upload Documents <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENT UPLOAD */}
            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-2">Upload Certificates</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Upload required and optional files in PDF format</p>
                </div>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-600 text-xs font-bold items-center">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Required Documents */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Mandatory Certificates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {getRequiredDocs().map(doc => renderUploadTile(doc, true))}
                    </div>
                  </div>

                  {/* Optional Documents */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2">Optional Certificates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {OPTIONAL_DOCS.map(doc => renderUploadTile(doc, false))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-55"
                  >
                    <ChevronLeft className="w-4 h-4" /> Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-indigo-100 transition-all cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-55"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </form>

        </div>
      </main>

      {/* Screen Loader when submitting */}
      {submitting && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-9999 flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center max-w-xs text-center border border-white">
            <div className="relative w-12 h-12 mb-5">
              <div className="w-full h-full rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight mb-1">Uploading Documents</span>
            <span className="text-xs text-slate-400 leading-normal">Saving candidate profile and checking certificate integrity...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admission;
