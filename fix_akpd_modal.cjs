const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

// Replace state
code = code.replace(
  'const [akpdScores, setAkpdScores] = useState({ academic: 3, social: 3, family: 3, career: 3 });',
  `const [akpdAnswers, setAkpdAnswers] = useState({
    q1: 0, q2: 0, q3: 0, q4: 0,
    q5: 0, q6: 0, q7: 0, q8: 0,
    q9: 0, q10: 0, q11: 0, q12: 0,
    q13: 0, q14: 0, q15: 0, q16: 0,
    essayEmotion: '',
    essaySocial: '',
    essayAcademic: '',
    essayCareer: ''
  });`
);

// We need to replace the entire modal.
const modalStart = '{showAKPDForm && (';
const modalEnd = '{/* Modal Sosiometri */}';

const modalStartIndex = code.indexOf(modalStart);
const modalEndIndex = code.indexOf(modalEnd);

if (modalStartIndex > -1 && modalEndIndex > -1) {
  const newModal = `{showAKPDForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                  <div>
                    <h2 className="text-xl font-black text-indigo-900">Formulir AKM</h2>
                    <p className="text-sm text-indigo-700 mt-1">Asesmen Kebutuhan Murid - Skala Likert & Esai</p>
                  </div>
                  <button onClick={() => setShowAKPDForm(false)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8">
                  <div className="bg-indigo-50/50 p-4 rounded-xl text-sm text-indigo-800 border border-indigo-100">
                    <p className="font-bold mb-2">Silahkan beri tanda pada pilihan yang paling sesuai dengan kondisimu:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-bold">TP</span> : Tidak Pernah</li>
                      <li><span className="font-bold">KD</span> : Kadang-Kadang</li>
                      <li><span className="font-bold">SR</span> : Sering</li>
                    </ul>
                  </div>

                  {/* Likert Scale Questions */}
                  <div className="space-y-6">
                    {/* Pribadi */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">A. BIDANG PRIBADI (Kematangan Emosi & Kemandirian)</h3>
                      {[
                        { id: 'q1', text: 'Saya merasa sulit mengendalikan emosi saat marah atau kecewa.' },
                        { id: 'q2', text: 'Saya merasa kurang percaya diri dengan bentuk tubuh/penampilan saya.' },
                        { id: 'q3', text: 'Saya sering merasa cemas atau stres tanpa alasan yang jelas.' },
                        { id: 'q4', text: 'Saya merasa sulit untuk menolak ajakan teman yang berdampak buruk.' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+1}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={\`px-4 py-2 rounded-lg text-sm font-bold border transition \${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}\`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sosial */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">B. BIDANG SOSIAL (Hubungan Remaja & Adaptasi)</h3>
                      {[
                        { id: 'q5', text: 'Saya merasa canggung atau sulit beradaptasi di lingkungan sekolah baru.' },
                        { id: 'q6', text: 'Saya pernah/sedang mengalami ejekan, kucilan, atau bullying dari teman.' },
                        { id: 'q7', text: 'Saya merasa suasana atau komunikasi di dalam rumah kurang harmonis.' },
                        { id: 'q8', text: 'Saya merasa kesulitan dalam mencari teman akrab di kelas.' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+5}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={\`px-4 py-2 rounded-lg text-sm font-bold border transition \${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}\`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Belajar */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">C. BIDANG BELAJAR (Metode & Hambatan Akademik SMP)</h3>
                      {[
                        { id: 'q9', text: 'Saya sering menunda-nunda mengerjakan tugas sekolah sampai menumpuk.' },
                        { id: 'q10', text: 'Belajar di rumah sering terganggu karena kecanduan game atau media sosial.' },
                        { id: 'q11', text: 'Saya merasa grogi, pusing, atau takut yang berlebihan saat menghadapi ujian.' },
                        { id: 'q12', text: 'Saya belum tahu gaya belajar yang cocok untuk saya (Visual/Auditori/Kinestetik).' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+9}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={\`px-4 py-2 rounded-lg text-sm font-bold border transition \${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}\`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Karier */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">D. BIDANG KARIER (Pengenalan Potensi & Masa Depan)</h3>
                      {[
                        { id: 'q13', text: 'Saya belum mengetahui bakat, minat, atau potensi utama dalam diri saya.' },
                        { id: 'q14', text: 'Saya bingung menentukan pilihan antara masuk SMA atau SMK setelah lulus SMP.' },
                        { id: 'q15', text: 'Pilihan sekolah lanjutan saya berbeda dengan keinginan orang tua.' },
                        { id: 'q16', text: 'Saya membutuhkan informasi mengenai jenis-jenis pekerjaan di masa depan.' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+13}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={\`px-4 py-2 rounded-lg text-sm font-bold border transition \${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}\`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Essay Section */}
                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <div className="bg-indigo-50/50 p-4 rounded-xl text-sm text-indigo-800 border border-indigo-100">
                      <p className="font-bold mb-1">BAGIAN B: PERTANYAAN ESAY TERBUKA (Eksplorasi Mendalam)</p>
                      <p>Jawablah pertanyaan di bawah ini dengan singkat dan jujur.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Kondisi Emosi</label>
                        <p className="text-sm text-slate-600 mb-2">Apa hal yang paling sering membuatmu merasa sedih, kecewa, atau tertekan dalam 3 bulan terakhir ini?</p>
                        <textarea
                          value={akpdAnswers.essayEmotion}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essayEmotion: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Hubungan Sosial</label>
                        <p className="text-sm text-slate-600 mb-2">Jika kamu memiliki masalah (baik di rumah maupun di sekolah), siapakah orang pertama yang biasanya kamu ajak bercerita atau meminta bantuan?</p>
                        <textarea
                          value={akpdAnswers.essaySocial}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essaySocial: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Target Belajar</label>
                        <p className="text-sm text-slate-600 mb-2">Apa kesulitan terbesar yang kamu hadapi pada mata pelajaran tertentu di SMP saat ini?</p>
                        <textarea
                          value={akpdAnswers.essayAcademic}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essayAcademic: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Cita-Cita Awal</label>
                        <p className="text-sm text-slate-600 mb-2">Sebutkan 2 profesi atau pekerjaan yang paling kamu impikan saat ini!</p>
                        <textarea
                          value={akpdAnswers.essayCareer}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essayCareer: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                    </div>
                  </div>

                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button onClick={() => setShowAKPDForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      // Check if all Likert questions are answered
                      const allAnswered = Object.keys(akpdAnswers).filter(k => k.startsWith('q')).every(k => (akpdAnswers as any)[k] > 0);
                      if (!allAnswered) {
                        toast.error('Mohon isi semua pertanyaan pilihan ganda terlebih dahulu.');
                        return;
                      }

                      if (onAddNeedsAssessment) {
                        onAddNeedsAssessment({
                          studentNis: currentStudent.nis,
                          ...akpdAnswers
                        } as any);
                      }
                      setShowAKPDForm(false);
                      toast.success('AKM Berhasil Disimpan!');
                    }} 
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
                  >
                    Kirim Asesmen
                  </button>
                </div>
              </div>
            </div>
          )}

                    `;

  code = code.substring(0, modalStartIndex) + newModal + code.substring(modalEndIndex);
}

fs.writeFileSync('src/components/StudentPanel.tsx', code);
