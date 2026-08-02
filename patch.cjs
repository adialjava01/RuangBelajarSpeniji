const fs = require('fs');
const content = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf-8');

const startStr = `              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">`;
const endStr = `              </div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {/* 3.5. BANK SOAL TAB */}`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find start or end bounds');
  process.exit(1);
}

const replacement = `              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {showManualAssessmentForm ? (
                  <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800">{editingManualAssessment ? 'Edit Penilaian Manual' : 'Input Nilai Manual'}</h4>
                      <button onClick={() => setShowManualAssessmentForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                        <select
                          value={manualSubjectId}
                          onChange={(e) => setManualSubjectId(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Penilaian</label>
                        <select
                          value={manualType}
                          onChange={(e) => setManualType(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Praktikum">Praktikum</option>
                          <option value="Tugas Kelompok">Tugas Kelompok</option>
                          <option value="Presentasi">Presentasi</option>
                          <option value="Sikap / Perilaku">Sikap / Perilaku</option>
                          <option value="Proyek">Proyek</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Keterangan</label>
                        <input
                          type="text"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="Misal: Praktikum Difraksi Cahaya"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                            <th className="px-4 py-3 font-bold">NIS</th>
                            <th className="px-4 py-3 font-bold w-1/3">Nama Siswa</th>
                            <th className="px-4 py-3 font-bold text-center w-32">Nilai (0-100)</th>
                            <th className="px-4 py-3 font-bold text-center">Catatan (Opsional)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {manualGrades.map((g, idx) => (
                            <tr key={g.studentId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 text-center text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{g.studentNis}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-800">{g.studentName}</td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={g.score}
                                  onChange={(e) => handleGradeChange(g.studentId, Number(e.target.value))}
                                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={g.notes || ''}
                                  onChange={(e) => handleGradeNoteChange(g.studentId, e.target.value)}
                                  placeholder="Catatan..."
                                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={handleSaveManual}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> {editingManualAssessment ? 'Simpan Perubahan' : 'Simpan Penilaian'}
                      </button>
                    </div>
                  </div>
                ) : selectedManualAssessment ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setSelectedManualAssessment('')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ← Kembali
                      </button>
                      <div className="h-4 w-px bg-slate-300"></div>
                      <h4 className="font-bold text-slate-800 text-sm">{manualAssessments?.find(m => m.id === selectedManualAssessment)?.title}</h4>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded ml-2">
                        {manualAssessments?.find(m => m.id === selectedManualAssessment)?.type}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                            <th className="px-4 py-3 font-bold">NIS</th>
                            <th className="px-4 py-3 font-bold w-1/3">Nama Siswa</th>
                            <th className="px-4 py-3 font-bold text-center">Nilai</th>
                            <th className="px-4 py-3 font-bold">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {manualAssessments?.find(m => m.id === selectedManualAssessment)?.grades.map((g, idx) => (
                            <tr key={g.studentId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.studentNis}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{g.studentName}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={\`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-extrabold text-sm \${g.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
                                  {g.score}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {g.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : selectedExamForGrades ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setSelectedExamForGrades('')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ← Kembali
                      </button>
                      <div className="h-4 w-px bg-slate-300"></div>
                      <h4 className="font-bold text-slate-800 text-sm">{teacherExams.find(e => e.id === selectedExamForGrades)?.title}</h4>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                            <th className="px-4 py-3 font-bold">NIS</th>
                            <th className="px-4 py-3 font-bold w-1/3">Nama Siswa</th>
                            <th className="px-4 py-3 font-bold text-center">Nilai</th>
                            <th className="px-4 py-3 font-bold text-center">Waktu Pengerjaan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teacherSubmissions.filter(s => s.examId === selectedExamForGrades).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm italic">
                                Belum ada siswa yang mengumpulkan tugas/ujian ini.
                              </td>
                            </tr>
                          ) : (
                            teacherSubmissions
                              .filter(s => s.examId === selectedExamForGrades)
                              .sort(sortSubmissions)
                              .map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.studentNis}</td>
                                  <td className="px-4 py-3 font-bold text-slate-800">{s.studentName}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={\`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-extrabold text-sm \${s.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
                                      {s.score}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                                    {new Date(s.submittedAt).toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedClassForGrades('')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit transition cursor-pointer"
                      >
                        ← Kembali ke Daftar Kelas
                      </button>
                      <button
                        onClick={() => handleOpenManualForm()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Input Nilai Manual
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <FileText className="w-4 h-4 text-indigo-600" /> Ujian & Tugas CBT
                      </h4>
                      {teacherExams.filter(e => Array.isArray(e.classId) ? e.classId.includes(selectedClassForGrades) : e.classId === selectedClassForGrades).length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Belum ada tugas CBT di kelas ini.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teacherExams.filter(e => Array.isArray(e.classId) ? e.classId.includes(selectedClassForGrades) : e.classId === selectedClassForGrades).map(exam => {
                            const submissionCount = teacherSubmissions.filter(s => s.examId === exam.id).length;
                            return (
                              <button
                                key={exam.id}
                                onClick={() => setSelectedExamForGrades(exam.id)}
                                className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition text-left space-y-2 flex flex-col justify-between cursor-pointer"
                              >
                                <div>
                                  <h5 className="font-extrabold text-slate-900">{exam.title}</h5>
                                  <p className="text-xs text-slate-500 mt-1">{getSubjectName(exam.subjectId)}</p>
                                </div>
                                <div className="flex justify-between items-center w-full mt-4 pt-3 border-t border-slate-100">
                                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{submissionCount} Siswa Mengerjakan</span>
                                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">Lihat Nilai <FileText className="w-3.5 h-3.5" /></span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Clipboard className="w-4 h-4 text-emerald-600" /> Penilaian Manual
                      </h4>
                      {manualAssessments?.filter(m => m.classId === selectedClassForGrades).length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Belum ada penilaian manual di kelas ini.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {manualAssessments?.filter(m => m.classId === selectedClassForGrades).map(assessment => (
                            <div
                              key={assessment.id}
                              className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition text-left space-y-2 flex flex-col justify-between group"
                            >
                              <div>
                                <div className="flex justify-between items-start">
                                  <h5 className="font-extrabold text-slate-900">{assessment.title}</h5>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenManualForm(assessment)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer" title="Edit">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { if(window.confirm('Hapus penilaian?')) onDeleteManualAssessment?.(assessment.id); }} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer" title="Hapus">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">{assessment.type}</p>
                                  <p className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{getSubjectName(assessment.subjectId)}</p>
                                  <p className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{assessment.date}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center w-full mt-4 pt-3 border-t border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{assessment.grades.length} Nilai</span>
                                <button 
                                  onClick={() => setSelectedManualAssessment(assessment.id)}
                                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                                >
                                  Lihat Nilai <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}`;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('src/components/TeacherPanel.tsx', newContent, 'utf-8');
console.log('Successfully patched TeacherPanel.tsx');
