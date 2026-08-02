const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Imports
code = code.replace(
  "NeedsAssessment, Sociometry\n} from '../types';",
  "NeedsAssessment, Sociometry, HomeVisit, CareerPlan\n} from '../types';"
);

code = code.replace(
  "import { \n  MapPin, CheckCircle, Clock, ",
  "import { \n  Home, MapPin, CheckCircle, Clock, "
);

// We need an icon for HomeVisit and Career. 'Home' is already used for Dashboard.
// 'Briefcase', 'Map' can be used.
code = code.replace(
  "Heart, X\n} from 'lucide-react';",
  "Heart, X, Briefcase, Map, Plus, Trash2\n} from 'lucide-react';"
);

// Props
code = code.replace(
  "sociometries?: Sociometry[];\n",
  "sociometries?: Sociometry[];\n  homeVisits?: HomeVisit[];\n  careerPlans?: CareerPlan[];\n  onAddHomeVisit?: (visit: Omit<HomeVisit, 'id' | 'createdAt'>) => void;\n  onUpdateHomeVisit?: (id: string, updates: Partial<HomeVisit>) => void;\n  onAddCareerPlan?: (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => void;\n  onUpdateCareerPlan?: (id: string, updates: Partial<CareerPlan>) => void;\n"
);

// Destructuring
code = code.replace(
  "sociometries = [],\n",
  "sociometries = [],\n  homeVisits = [],\n  careerPlans = [],\n  onAddHomeVisit,\n  onUpdateHomeVisit,\n  onAddCareerPlan,\n  onUpdateCareerPlan,\n"
);

// State tab
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'rujukan' | 'sesi' | 'abk'>('dashboard');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'rujukan' | 'sesi' | 'abk' | 'homevisit' | 'karir'>('dashboard');"
);

// Tab buttons
const tabsHtml = `
          <button onClick={() => setActiveTab('dashboard')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'dashboard' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <Home className="w-5 h-5" />
            Beranda BK
          </button>
          <button onClick={() => setActiveTab('asesmen')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'asesmen' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <FileText className="w-5 h-5" />
            Peta Kerawanan & Asesmen
          </button>
          <button onClick={() => setActiveTab('rujukan')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'rujukan' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <UserPlus className="w-5 h-5" />
            Rujukan Guru
          </button>
          <button onClick={() => setActiveTab('sesi')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'sesi' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <MessageSquare className="w-5 h-5" />
            Sesi Konseling (Responsif)
          </button>
          <button onClick={() => setActiveTab('karir')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'karir' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <Briefcase className="w-5 h-5" />
            Karir & Peminatan
          </button>
          <button onClick={() => setActiveTab('homevisit')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'homevisit' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <Map className="w-5 h-5" />
            Kunjungan Rumah
          </button>
          <button onClick={() => setActiveTab('abk')} className={\`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition whitespace-nowrap \${activeTab === 'abk' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}\`}>
            <Heart className="w-5 h-5" />
            Pantauan Inklusif (ABK)
          </button>
`;

code = code.replace(/<div className="flex overflow-x-auto pb-4 hide-scrollbar gap-3">[\s\S]*?<\/div>/, `<div className="flex overflow-x-auto pb-4 hide-scrollbar gap-3">
${tabsHtml}
        </div>`);

// Add state for Kunjungan Rumah Form
const homeVisitState = `
  const [showAddHomeVisit, setShowAddHomeVisit] = useState(false);
  const [hvStudentNis, setHvStudentNis] = useState('');
  const [hvDate, setHvDate] = useState('');
  const [hvPurpose, setHvPurpose] = useState('');
  const [hvParentName, setHvParentName] = useState('');
  
  // State for Karir
  const [showKarirForm, setShowKarirForm] = useState(false);
  const [karirStudentNis, setKarirStudentNis] = useState('');
  const [karirNotes, setKarirNotes] = useState('');
`;
code = code.replace("const [selectedGrade, setSelectedGrade] = useState<string | null>(null);", "const [selectedGrade, setSelectedGrade] = useState<string | null>(null);\n" + homeVisitState);

// Add Tab Contents
const phase3Tabs = `
      {/* KARIR & PEMINATAN */}
      {activeTab === 'karir' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-amber-500" /> Peminatan & Perencanaan Karir</h2>
              <button onClick={() => setShowKarirForm(true)} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition flex items-center gap-2 text-sm shadow-sm">
                <Plus className="w-4 h-4" /> Catatan Karir Baru
              </button>
            </div>
            
            {careerPlans.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Briefcase className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada data perencanaan karir siswa.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {careerPlans.map(plan => {
                  const student = students.find(s => s.nis === plan.studentNis);
                  return (
                    <div key={plan.id} className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800">{student?.name || plan.studentName}</h3>
                          <p className="text-sm text-slate-500">{plan.studentNis} • Kelas {student ? classes.find(c => c.id === student.classId)?.name : plan.className}</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">Peminatan</span>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Karir / Cita-cita</p>
                          <p className="text-sm font-medium text-slate-800">{plan.targetCareer || '-'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Minat (Interests)</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.interests && plan.interests.length > 0 ? plan.interests.map(i => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{i}</span>
                              )) : <span className="text-xs text-slate-400">-</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kekuatan (Strengths)</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.strengths && plan.strengths.length > 0 ? plan.strengths.map(s => (
                                <span key={s} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-md">{s}</span>
                              )) : <span className="text-xs text-slate-400">-</span>}
                            </div>
                          </div>
                        </div>
                        {plan.counselorNotes && (
                          <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <p className="text-xs font-bold text-amber-800 mb-1">Catatan Konselor</p>
                            <p className="text-sm text-amber-900">{plan.counselorNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KUNJUNGAN RUMAH */}
      {activeTab === 'homevisit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Map className="w-6 h-6 text-orange-500" /> Log Kunjungan Rumah (Home Visit)</h2>
              <button onClick={() => setShowAddHomeVisit(true)} className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex items-center gap-2 text-sm shadow-sm">
                <Plus className="w-4 h-4" /> Jadwalkan Kunjungan
              </button>
            </div>
            
            {homeVisits.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Map className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada riwayat atau rencana kunjungan rumah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeVisits.map(visit => {
                  const student = students.find(s => s.nis === visit.studentNis);
                  return (
                    <div key={visit.id} className="border border-slate-200 rounded-2xl p-5 hover:border-orange-300 transition bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-slate-800">{student?.name || visit.studentName}</h3>
                            <p className="text-sm text-slate-500">{visit.studentNis} • Kelas {student ? classes.find(c => c.id === student.classId)?.name : visit.className}</p>
                          </div>
                          <span className={\`px-3 py-1 text-xs font-bold rounded-lg border \${visit.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}\`}>
                            {visit.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex gap-2 text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>{new Date(visit.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="flex gap-2 text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>Bertemu Orang Tua/Wali: <span className="font-medium text-slate-800">{visit.parentName}</span></span>
                          </div>
                          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tujuan</p>
                            <p className="text-slate-700">{visit.purpose}</p>
                          </div>
                          {visit.status === 'Selesai' && visit.visitResult && (
                            <div className="mt-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-800 mb-1">Hasil & Tindak Lanjut</p>
                              <p className="text-emerald-900">{visit.visitResult}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {visit.status === 'Direncanakan' && onUpdateHomeVisit && (
                        <button 
                          onClick={() => {
                            const res = window.prompt('Masukkan hasil kunjungan / kesepakatan dengan orang tua:');
                            if (res) {
                              onUpdateHomeVisit(visit.id, { status: 'Selesai', visitResult: res });
                            }
                          }}
                          className="mt-4 w-full py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl transition text-sm"
                        >
                          Tandai Selesai & Isi Hasil
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
`;

code = code.replace("{activeTab === 'abk' && (", phase3Tabs + "\n      {activeTab === 'abk' && (");

// Add Karir Form and Home Visit Form Modals
const modalFormsHtml = `
      {/* Modal Karir */}
      {showKarirForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <h2 className="text-xl font-black text-amber-900 flex items-center gap-2"><Briefcase className="w-6 h-6" /> Tambah Catatan Karir</h2>
              <button onClick={() => setShowKarirForm(false)} className="p-2 hover:bg-amber-100 rounded-full text-amber-700 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select value={karirStudentNis} onChange={e => setKarirStudentNis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => <option key={s.id} value={s.nis}>{s.name} ({s.nis})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Konselor (Saran Karir, Hasil Tes Psikologi, dll)</label>
                <textarea value={karirNotes} onChange={e => setKarirNotes(e.target.value)} rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Misal: Cocok di bidang teknik atau seni..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowKarirForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">Batal</button>
              <button 
                onClick={() => {
                  if(!karirStudentNis || !onAddCareerPlan) return;
                  const st = students.find(s => s.nis === karirStudentNis);
                  if(!st) return;
                  onAddCareerPlan({
                    studentNis: st.nis,
                    studentName: st.name,
                    className: classes.find(c => c.id === st.classId)?.name || 'Unknown',
                    interests: [],
                    strengths: [],
                    targetCareer: 'Belum ditentukan',
                    counselorNotes: karirNotes
                  });
                  setShowKarirForm(false);
                  setKarirStudentNis('');
                  setKarirNotes('');
                }}
                disabled={!karirStudentNis}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition shadow-md"
              >
                Simpan Catatan Karir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Home Visit */}
      {showAddHomeVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50">
              <h2 className="text-xl font-black text-orange-900 flex items-center gap-2"><Map className="w-6 h-6" /> Jadwalkan Kunjungan Rumah</h2>
              <button onClick={() => setShowAddHomeVisit(false)} className="p-2 hover:bg-orange-100 rounded-full text-orange-700 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select value={hvStudentNis} onChange={e => setHvStudentNis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => <option key={s.id} value={s.nis}>{s.name} ({s.nis})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Kunjungan</label>
                <input type="date" value={hvDate} onChange={e => setHvDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Orang Tua / Wali yang Ditemui</label>
                <input type="text" value={hvParentName} onChange={e => setHvParentName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Cth: Bpk. Budi / Ibu Siti" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tujuan Kunjungan</label>
                <textarea value={hvPurpose} onChange={e => setHvPurpose(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Cth: Mendiskusikan tingkat kehadiran siswa..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAddHomeVisit(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">Batal</button>
              <button 
                onClick={() => {
                  if(!hvStudentNis || !hvDate || !hvPurpose || !onAddHomeVisit) return;
                  const st = students.find(s => s.nis === hvStudentNis);
                  if(!st) return;
                  onAddHomeVisit({
                    studentNis: st.nis,
                    studentName: st.name,
                    className: classes.find(c => c.id === st.classId)?.name || 'Unknown',
                    date: hvDate,
                    counselorName: activeUser?.name || 'Guru BK',
                    purpose: hvPurpose,
                    parentName: hvParentName,
                    visitResult: '',
                    followUp: '',
                    status: 'Direncanakan'
                  });
                  setShowAddHomeVisit(false);
                  setHvStudentNis('');
                  setHvDate('');
                  setHvPurpose('');
                  setHvParentName('');
                }}
                disabled={!hvStudentNis || !hvDate || !hvPurpose}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition shadow-md"
              >
                Jadwalkan Kunjungan
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("return (", "return (\n    <>");
code = code.replace("    </div>\n  );\n}", "    </div>\n" + modalFormsHtml + "\n    </>\n  );\n}");

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
