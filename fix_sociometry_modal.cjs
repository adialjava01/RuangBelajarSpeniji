const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

const target = `<p className="text-sm text-slate-600 mb-2">Siapa teman di kelas yang paling sering kamu jadikan tempat berdiskusi atau bekerja kelompok?</p>
                  <p className="text-xs font-medium text-amber-600 mb-4 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    💡 Tips: Klik nama teman yang sudah dicentang untuk membatalkan pilihan.
                  </p>
                  <div className="space-y-2">`;

const replacement = `<p className="text-sm text-slate-600 mb-4">Siapa teman di kelas yang paling sering kamu jadikan tempat berdiskusi atau bekerja kelompok?</p>
                  
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-800 mb-3">Teman Terpilih ({selectedFriends.length}/3)</p>
                    {selectedFriends.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada teman yang dipilih</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedFriends.map(nis => {
                          const f = students.find(s => s.nis === nis);
                          return (
                            <div key={nis} className="flex items-center gap-1.5 bg-rose-100 text-rose-800 px-3 py-1.5 rounded-full text-sm font-bold border border-rose-200 shadow-sm">
                              {f?.name}
                              <button onClick={(e) => { e.stopPropagation(); setSelectedFriends(selectedFriends.filter(n => n !== nis)); }} className="hover:text-rose-950 hover:bg-rose-200 p-0.5 rounded-full transition ml-1" title="Hapus pilihan ini">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-800 mb-3">Daftar Teman Kelas</p>
                  <div className="space-y-2">`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
