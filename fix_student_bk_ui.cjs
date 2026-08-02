const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

const bkContent = `
      {activeTab === 'bk' && !examStarted && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Heart className="w-6 h-6 text-rose-500" /> Jurnal Emosional Harian</h2>
            {hasCheckedIn ? (
              <div className="bg-teal-50 text-teal-800 p-6 rounded-2xl border border-teal-100 text-center">
                <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">Terima Kasih!</h3>
                <p className="text-sm">Kamu sudah mengisi jurnal emosional hari ini. Semoga harimu menyenangkan!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-medium">Bagaimana perasaanmu hari ini? Ceritakan sedikit jika kamu mau.</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {['Senang', 'Biasa', 'Sedih', 'Marah', 'Takut', 'Lelah'].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setDailyMood(mood as any)}
                      className={\`py-3 px-2 rounded-xl border-2 transition font-bold text-sm \${dailyMood === mood ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}\`}
                    >
                      {mood === 'Senang' ? '😊' : mood === 'Biasa' ? '😐' : mood === 'Sedih' ? '😢' : mood === 'Marah' ? '😠' : mood === 'Takut' ? '😨' : '😫'}<br/>
                      <span className="mt-1 block">{mood}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <textarea
                    value={dailyNote}
                    onChange={e => setDailyNote(e.target.value)}
                    placeholder="Ada hal yang ingin kamu ceritakan? (Opsional, rahasia dijamin)"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleCheckIn}
                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-md w-full"
                >
                  Kirim Jurnal Harian
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Layanan BK Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setShowAKPDForm(true)} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <FileText className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Isi Asesmen Kebutuhan (AKPD)</span>
                <span className="text-xs text-slate-500">Bantu kami memahami kebutuhanmu di sekolah</span>
              </button>
              <button onClick={() => setShowSosiometriForm(true)} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <Users className="w-8 h-8 text-rose-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Isi Sosiometri Kelas</span>
                <span className="text-xs text-slate-500">Pemetaan hubungan pertemanan di kelas</span>
              </button>
            </div>
          </div>

          {/* Modal AKPD */}
          {showAKPDForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                  <div>
                    <h2 className="text-xl font-black text-indigo-900">Formulir AKPD</h2>
                    <p className="text-sm text-indigo-700 mt-1">Asesmen Kebutuhan Peserta Didik</p>
                  </div>
                  <button onClick={() => setShowAKPDForm(false)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                  <div className="bg-indigo-50/50 p-4 rounded-xl text-sm text-indigo-800 border border-indigo-100">
                    Pilih skala (1-5) yang paling sesuai dengan kondisi yang kamu rasakan saat ini. (1 = Sangat Kurang, 5 = Sangat Baik)
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">1. Bidang Akademik / Belajar</label>
                      <p className="text-xs text-slate-500 mb-3">Bagaimana kamu menilai motivasi, prestasi, dan kebiasaan belajarmu?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            onClick={() => setAkpdScores({...akpdScores, academic: score})}
                            className={\`flex-1 py-3 rounded-lg border-2 font-bold transition \${akpdScores.academic === score ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}\`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">2. Bidang Sosial & Pertemanan</label>
                      <p className="text-xs text-slate-500 mb-3">Bagaimana kamu menilai hubunganmu dengan teman-teman di sekolah?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            onClick={() => setAkpdScores({...akpdScores, social: score})}
                            className={\`flex-1 py-3 rounded-lg border-2 font-bold transition \${akpdScores.social === score ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}\`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">3. Bidang Keluarga / Pribadi</label>
                      <p className="text-xs text-slate-500 mb-3">Bagaimana kondisi dukungan keluarga dan kestabilan emosi pribadimu?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            onClick={() => setAkpdScores({...akpdScores, family: score})}
                            className={\`flex-1 py-3 rounded-lg border-2 font-bold transition \${akpdScores.family === score ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}\`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">4. Bidang Karir / Masa Depan</label>
                      <p className="text-xs text-slate-500 mb-3">Seberapa jelas pemahamanmu tentang minat, bakat, dan rencana karir masa depan?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            onClick={() => setAkpdScores({...akpdScores, career: score})}
                            className={\`flex-1 py-3 rounded-lg border-2 font-bold transition \${akpdScores.career === score ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-300'}\`}
                          >
                            {score}
                          </button>
                        ))}
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
                      if (onAddNeedsAssessment) {
                        onAddNeedsAssessment({
                          studentNis: currentStudent.nis,
                          academicScore: akpdScores.academic,
                          socialScore: akpdScores.social,
                          familyScore: akpdScores.family,
                          careerScore: akpdScores.career
                        });
                      }
                      setShowAKPDForm(false);
                      toast.success('AKPD Berhasil Disimpan!');
                    }} 
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
                  >
                    Kirim Asesmen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Sosiometri */}
          {showSosiometriForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                  <div>
                    <h2 className="text-xl font-black text-rose-900">Formulir Sosiometri</h2>
                    <p className="text-sm text-rose-700 mt-1">Pilih teman di kelasmu (Maksimal 3 orang)</p>
                  </div>
                  <button onClick={() => setShowSosiometriForm(false)} className="p-2 hover:bg-rose-100 rounded-full text-rose-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <p className="text-sm text-slate-600 mb-4">Siapa teman di kelas yang paling sering kamu jadikan tempat berdiskusi atau bekerja kelompok?</p>
                  <div className="space-y-2">
                    {students.filter(s => s.classId === currentStudent.classId && s.nis !== currentStudent.nis).map(friend => (
                      <button
                        key={friend.nis}
                        onClick={() => {
                          if (selectedFriends.includes(friend.nis)) {
                            setSelectedFriends(selectedFriends.filter(nis => nis !== friend.nis));
                          } else if (selectedFriends.length < 3) {
                            setSelectedFriends([...selectedFriends, friend.nis]);
                          }
                        }}
                        className={\`w-full text-left p-3 rounded-xl border-2 transition flex items-center justify-between \${selectedFriends.includes(friend.nis) ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-700 hover:border-rose-300'}\`}
                      >
                        <span className="font-bold">{friend.name}</span>
                        {selectedFriends.includes(friend.nis) && <CheckCircle className="w-5 h-5 text-rose-500" />}
                      </button>
                    ))}
                    {students.filter(s => s.classId === currentStudent.classId && s.nis !== currentStudent.nis).length === 0 && (
                      <div className="text-center p-4 text-slate-500 bg-slate-50 rounded-xl">Belum ada data teman di kelas ini.</div>
                    )}
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button onClick={() => setShowSosiometriForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      if (onAddSociometry) {
                        onAddSociometry({
                          studentNis: currentStudent.nis,
                          classId: currentStudent.classId,
                          friendsWith: selectedFriends
                        });
                      }
                      setShowSosiometriForm(false);
                      toast.success('Sosiometri Berhasil Disimpan!');
                    }} 
                    disabled={selectedFriends.length === 0}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-md transition"
                  >
                    Kirim Pilihan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
`;

code = code.replace(
  "{activeTab === 'beranda' && !examStarted && (",
  bkContent + "\n\n      {activeTab === 'beranda' && !examStarted && ("
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
