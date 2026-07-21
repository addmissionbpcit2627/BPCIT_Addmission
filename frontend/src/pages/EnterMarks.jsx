import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Save, Plus, Trash2, GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function EnterMarks() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [semester, setSemester] = useState('');
  const [marksData, setMarksData] = useState([{ subject_name: '', marks: '' }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvSemester, setCsvSemester] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [lookupRegistration, setLookupRegistration] = useState('');
  const [lookupSemester, setLookupSemester] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState(null);
  const [lookupStudent, setLookupStudent] = useState(null);
  const [lookupResults, setLookupResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.length > 2) {
      const fetchStudents = async () => {
        try {
          const res = await api.get(`/teachers/students?search=${searchTerm}`);
          setStudents(res.data.students);
        } catch (err) {
          console.error(err);
        }
      };
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [searchTerm]);

  const handleAddSubject = () => {
    setMarksData([...marksData, { subject_name: '', marks: '' }]);
  };

  const handleRemoveSubject = (index) => {
    setMarksData(marksData.filter((_, i) => i !== index));
  };

  const handleMarkChange = (index, field, value) => {
    const newMarksData = [...marksData];
    newMarksData[index][field] = value;
    setMarksData(newMarksData);
  };

  const handleCsvFileChange = (e) => {
    setCsvFile(e.target.files[0] || null);
    setUploadMessage(null);
  };

  const handleUploadCsv = async (e) => {
    e.preventDefault();
    setUploadMessage(null);
    if (!csvFile) {
      setUploadMessage({ type: 'error', text: 'Please select a CSV file first.' });
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      if (csvSemester) formData.append('semester', csvSemester);
      const resp = await api.post('/results/upload', formData);
      setUploadMessage({ type: 'success', text: resp.data.message || 'CSV uploaded successfully.' });
      setCsvFile(null);
      setCsvSemester('');
    } catch (err) {
      setUploadMessage({ type: 'error', text: err.response?.data?.message || 'CSV upload failed.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLookupResults = async (e) => {
    e.preventDefault();
    setLookupMessage(null);
    setLookupStudent(null);
    setLookupResults([]);
    if (!lookupRegistration.trim()) {
      setLookupMessage({ type: 'error', text: 'Registration number is required.' });
      return;
    }
    setLookupLoading(true);
    try {
      const params = {};
      if (lookupSemester) params.semester = lookupSemester;
      const resp = await api.get(`/results/registration/${encodeURIComponent(lookupRegistration.trim())}`, { params });
      setLookupStudent(resp.data.student);
      setLookupResults(resp.data.results || []);
      if (!resp.data.results.length) {
        setLookupMessage({ type: 'error', text: 'No results found for this student.' });
      }
    } catch (err) {
      setLookupMessage({ type: 'error', text: err.response?.data?.message || 'Failed to lookup results.' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !semester) {
      setMessage({ type: 'error', text: 'Please select a student and semester' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/results', {
        student_id: selectedStudent.id,
        semester: parseInt(semester),
        marks_data: marksData.map(m => ({ ...m, marks: parseInt(m.marks) }))
      });
      setMessage({ type: 'success', text: 'Marks entered and grades calculated!' });
      setTimeout(() => navigate('/teacher/dashboard'), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit marks' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-indigo-600 font-bold mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Enter Marks</h1>
            <p className="text-slate-500 font-medium italic">Document student academic performance and calculate grades.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Search Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-500" /> Find Student
              </h2>
              <input
                type="text"
                placeholder="Search by Name/Roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${selectedStudent?.id === s.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'}`}
                  >
                    {s.name} ({s.roll_no})
                  </button>
                ))}
              </div>
            </div>

            {selectedStudent && (
              <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black tracking-tight">{selectedStudent.name}</div>
                    <div className="text-[10px] opacity-80 uppercase font-bold">{selectedStudent.department} • ROll: {selectedStudent.roll_no}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Marks Entry Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Semester</label>
                  <select
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>Semester {num}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Marks</label>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {marksData.map((item, index) => (
                  <div key={index} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                    <input
                      type="text"
                      placeholder="Subject Name"
                      value={item.subject_name}
                      onChange={(e) => handleMarkChange(index, 'subject_name', e.target.value)}
                      className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Marks"
                      value={item.marks}
                      onChange={(e) => handleMarkChange(index, 'marks', e.target.value)}
                      className="w-24 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner"
                      required
                      min="0"
                      max="100"
                    />
                    {marksData.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(index)}
                        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  <div className={`w-1 h-5 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_12px_25px_-5px_rgba(139,92,246,0.4)] disabled:opacity-60 transition-all transform hover:-translate-y-1 active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'SUBMITTING...' : 'Submit & Calculate Results'}
              </button>
            </form>

            <div className="mt-8 grid grid-cols-1 gap-6">
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" /> Bulk Upload Results
                </h2>
                <form onSubmit={handleUploadCsv} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="w-full file:px-4 file:py-3 file:border file:border-slate-200 file:rounded-xl file:bg-slate-50 file:text-sm file:font-bold file:text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Semester (optional)</label>
                    <select
                      value={csvSemester}
                      onChange={(e) => setCsvSemester(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                    >
                      <option value="">Use semester from CSV</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>Semester {num}</option>
                      ))}
                    </select>
                  </div>
                  {uploadMessage && (
                    <div className={`p-3 rounded-2xl text-xs font-bold ${uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {uploadMessage.text}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="w-full py-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_12px_25px_-5px_rgba(139,92,246,0.4)] disabled:opacity-60 transition-all uppercase tracking-widest"
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload CSV'}
                  </button>
                </form>
              </div>

              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-500" /> Lookup by Registration
                </h2>
                <form onSubmit={handleLookupResults} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registration No</label>
                    <input
                      type="text"
                      value={lookupRegistration}
                      onChange={(e) => setLookupRegistration(e.target.value)}
                      placeholder="Enter registration number"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Semester (optional)</label>
                    <select
                      value={lookupSemester}
                      onChange={(e) => setLookupSemester(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                    >
                      <option value="">All semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>Semester {num}</option>
                      ))}
                    </select>
                  </div>
                  {lookupMessage && (
                    <div className={`p-3 rounded-2xl text-xs font-bold ${lookupMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {lookupMessage.text}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="w-full py-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-[0_12px_25px_-5px_rgba(139,92,246,0.4)] disabled:opacity-60 transition-all uppercase tracking-widest"
                  >
                    {lookupLoading ? 'Searching...' : 'Fetch Results'}
                  </button>
                </form>
                {lookupStudent && (
                  <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
                    <div className="font-black text-slate-900">{lookupStudent.name}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">{lookupStudent.department} • Semester {lookupStudent.semester}</div>
                    <div className="text-xs text-slate-500">Roll #{lookupStudent.roll_no}</div>
                  </div>
                )}
                {lookupResults.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-slate-400 uppercase tracking-widest text-[10px]"><th className="pb-3">Semester</th><th className="pb-3">Subject</th><th className="pb-3">Marks</th><th className="pb-3">Grade</th></tr>
                      </thead>
                      <tbody>
                        {lookupResults.map((r) => (
                          <tr key={r.id} className="bg-slate-50 rounded-2xl border border-slate-100">
                            <td className="px-3 py-2 font-bold text-slate-700">{r.semester}</td>
                            <td className="px-3 py-2 text-slate-600">{r.subject_name}</td>
                            <td className="px-3 py-2 text-slate-600">{r.marks}/{r.total_marks}</td>
                            <td className="px-3 py-2 text-slate-700 font-black">{r.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnterMarks;
