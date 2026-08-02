const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

const dashboardContent = `
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Status Kesejahteraan Sekolah</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Mood Dominan Hari Ini</h3>
                <div className="text-3xl font-black text-teal-600 flex items-center gap-2">
                  <Heart className="w-8 h-8 text-rose-500" /> Senang
                </div>
                <p className="text-xs text-slate-500 mt-2">Berdasarkan {dailyCheckIns.length} entri jurnal</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Rujukan Aktif</h3>
                <div className="text-3xl font-black text-amber-600">
                  {referrals.filter(r => r.status === 'Menunggu' || r.status === 'Diproses').length}
                </div>
                <p className="text-xs text-slate-500 mt-2">Menunggu tindak lanjut</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Peringatan Dini</h3>
                <div className="text-3xl font-black text-rose-600">
                  {referrals.filter(r => r.priority === 'Tinggi').length}
                </div>
                <p className="text-xs text-slate-500 mt-2">Siswa butuh perhatian khusus segera</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Peta Sebaran Kasus (Tanpa Label)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Kedisiplinan</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '40%' }}></div>
                  </div>
                  <div className="w-12 text-right text-sm font-bold text-slate-700">40%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Akademis</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: '25%' }}></div>
                  </div>
                  <div className="w-12 text-right text-sm font-bold text-slate-700">25%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-semibold text-slate-600">Sosial/Emosi</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: '35%' }}></div>
                  </div>
                  <div className="w-12 text-right text-sm font-bold text-slate-700">35%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'asesmen' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Asesmen Kebutuhan Peserta Didik (AKPD)</h2>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Status Pengisian AKPD</h3>
                <p className="text-sm text-slate-500 mt-1">{needsAssessments.length} dari {students.length} siswa telah mengisi</p>
              </div>
              <button className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shadow-sm">
                Buka Form AKPD
              </button>
            </div>
            
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-black text-slate-900 mb-4">Sosiometri Kelas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {classes.map(c => (
                  <div key={c.id} className="border border-slate-200 p-4 rounded-2xl hover:border-teal-300 transition cursor-pointer">
                    <h4 className="font-bold text-slate-800">{c.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Data Sosiometri: {sociometries.filter(s => s.classId === c.id).length} Entri</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{activeTab === 'rujukan' && (",
  dashboardContent + "\n      {activeTab === 'rujukan' && ("
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
