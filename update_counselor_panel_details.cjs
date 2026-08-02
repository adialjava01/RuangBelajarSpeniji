const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// 1. Add state for viewing AKPD details
code = code.replace(
  'const [showAKPDResults, setShowAKPDResults] = useState(false);',
  'const [showAKPDResults, setShowAKPDResults] = useState(false);\n  const [selectedAKPD, setSelectedAKPD] = useState<NeedsAssessment | null>(null);'
);

// 2. Add an extra column header for "Detail"
code = code.replace(
  '<th className="px-4 py-3 text-center text-sm font-bold text-slate-600">Karir</th>',
  '<th className="px-4 py-3 text-center text-sm font-bold text-slate-600">Karir</th>\n                        <th className="px-4 py-3 text-center text-sm font-bold text-slate-600">Aksi</th>'
);

// 3. Add the detail button in the row
const rowEndTarget = `                              <td className="px-4 py-3 text-center font-medium">
                                {(() => {
                                  const score = (akpd.q13||0) + (akpd.q14||0) + (akpd.q15||0) + (akpd.q16||0);
                                  return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                })()}
                              </td>
                            </tr>`;
const rowEndReplacement = `                              <td className="px-4 py-3 text-center font-medium">
                                {(() => {
                                  const score = (akpd.q13||0) + (akpd.q14||0) + (akpd.q15||0) + (akpd.q16||0);
                                  return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => setSelectedAKPD(akpd)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">Detail Esai</button>
                              </td>
                            </tr>`;
code = code.replace(rowEndTarget, rowEndReplacement);

// 4. Add the modal for details
const closeButtonTarget = `<div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button onClick={() => setShowAKPDResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>`;
const closeButtonReplacement = `<div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button onClick={() => setShowAKPDResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>

            {selectedAKPD && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <h2 className="text-lg font-black text-indigo-900">Detail Esai AKM</h2>
                    <button onClick={() => setSelectedAKPD(null)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Kondisi Emosi</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essayEmotion || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Hubungan Sosial</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essaySocial || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Target Belajar</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essayAcademic || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Cita-Cita Awal</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essayCareer || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
`;
code = code.replace(closeButtonTarget, closeButtonReplacement);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
