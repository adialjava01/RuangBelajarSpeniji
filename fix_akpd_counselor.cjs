const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Add state for AKPD results modal
code = code.replace(
  "const [selectedGrade, setSelectedGrade] = useState<string | null>(null);",
  "const [selectedGrade, setSelectedGrade] = useState<string | null>(null);\n  const [showAKPDResults, setShowAKPDResults] = useState(false);"
);

// Add click handler to the button
code = code.replace(
  '<button className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shadow-sm">\n                Buka Form AKPD\n              </button>',
  '<button onClick={() => setShowAKPDResults(true)} className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shadow-sm">\n                Lihat Hasil AKPD\n              </button>'
);

// Add the modal UI before the closing div of the component
const modalUI = `
      {/* Modal Hasil AKPD */}
      {showAKPDResults && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50">
              <div>
                <h2 className="text-xl font-black text-teal-900">Hasil Pemetaan AKPD</h2>
                <p className="text-sm text-teal-700 mt-1">Data Kebutuhan Peserta Didik Berdasarkan Asesmen</p>
              </div>
              <button onClick={() => setShowAKPDResults(false)} className="p-2 hover:bg-teal-100 rounded-full text-teal-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {needsAssessments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                  Belum ada siswa yang mengisi form AKPD.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="text-blue-800 text-sm font-bold">Rata-rata Akademik</div>
                      <div className="text-2xl font-black text-blue-600 mt-1">
                        {(needsAssessments.reduce((a, b) => a + b.academicScore, 0) / needsAssessments.length).toFixed(1)} <span className="text-sm font-normal">/ 5.0</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="text-emerald-800 text-sm font-bold">Rata-rata Sosial</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">
                        {(needsAssessments.reduce((a, b) => a + b.socialScore, 0) / needsAssessments.length).toFixed(1)} <span className="text-sm font-normal">/ 5.0</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <div className="text-amber-800 text-sm font-bold">Rata-rata Keluarga</div>
                      <div className="text-2xl font-black text-amber-600 mt-1">
                        {(needsAssessments.reduce((a, b) => a + b.familyScore, 0) / needsAssessments.length).toFixed(1)} <span className="text-sm font-normal">/ 5.0</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <div className="text-purple-800 text-sm font-bold">Rata-rata Karir</div>
                      <div className="text-2xl font-black text-purple-600 mt-1">
                        {(needsAssessments.reduce((a, b) => a + b.careerScore, 0) / needsAssessments.length).toFixed(1)} <span className="text-sm font-normal">/ 5.0</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Nama Siswa</th>
                          <th className="px-4 py-3 text-center">Akademik</th>
                          <th className="px-4 py-3 text-center">Sosial</th>
                          <th className="px-4 py-3 text-center">Keluarga</th>
                          <th className="px-4 py-3 text-center">Karir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {needsAssessments.map(akpd => {
                          const student = students.find(s => s.nis === akpd.studentNis);
                          const studentName = student ? student.name : akpd.studentNis;
                          const className = student ? classes.find(c => c.id === student.classId)?.name : '-';
                          return (
                            <tr key={akpd.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-800">{studentName}</div>
                                <div className="text-xs text-slate-500">{className}</div>
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                <span className={\`px-2 py-1 rounded \${akpd.academicScore < 3 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`}>{akpd.academicScore}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                <span className={\`px-2 py-1 rounded \${akpd.socialScore < 3 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`}>{akpd.socialScore}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                <span className={\`px-2 py-1 rounded \${akpd.familyScore < 3 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`}>{akpd.familyScore}</span>
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                <span className={\`px-2 py-1 rounded \${akpd.careerScore < 3 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`}>{akpd.careerScore}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button onClick={() => setShowAKPDResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "    </div>\n  );\n}",
  modalUI + "\n    </div>\n  );\n}"
);

// We need to import X if not already imported
if (!code.includes('import { X } from')) {
  code = code.replace(
    "import { \n  Users, Calendar, CheckCircle, Clock, AlertTriangle, \n  MessageSquare, UserPlus, Filter, Search, FileText, Home, Heart\n} from 'lucide-react';",
    "import { \n  Users, Calendar, CheckCircle, Clock, AlertTriangle, \n  MessageSquare, UserPlus, Filter, Search, FileText, Home, Heart, X\n} from 'lucide-react';"
  );
}

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
