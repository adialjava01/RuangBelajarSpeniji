const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');

const oldGrid = `<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Pilih Siswa *</label>
                <select
                  value={refStudentNis}
                  onChange={(e) => setRefStudentNis(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">-- Cari dan Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.nis} value={s.nis}>{s.name} ({s.className || 'Kelas ?'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Kategori Kendala *</label>
                <select
                  value={refCategory}
                  onChange={(e) => setRefCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="Perilaku">Masalah Perilaku (Berbohong, Berkata Kotor, dll)</option>
                  <option value="Akademik">Akademik (Malas, Nilai Turun, Bolos)</option>
                  <option value="Sosial">Sosial (Bullying, Berkelahi, Sulit Bergaul)</option>
                  <option value="Emosional">Emosional (Pemarah, Sedih Berkepanjangan)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>`;

const newGrid = `<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Pilih Kelas</label>
                <select
                  value={refClassId}
                  onChange={(e) => {
                    setRefClassId(e.target.value);
                    setRefStudentNis('');
                  }}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">-- Semua Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Pilih Siswa * (Ketik untuk mencari)</label>
                <input
                  type="text"
                  list="ref-students-list"
                  value={refStudentNis}
                  onChange={(e) => setRefStudentNis(e.target.value)}
                  placeholder="Pilih atau ketik NIS siswa..."
                  required
                  autoComplete="off"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
                <datalist id="ref-students-list">
                  {students
                    .filter(s => refClassId ? s.classId === refClassId : true)
                    .map(s => (
                    <option key={s.nis} value={s.nis}>{s.name} ({classes.find(c => c.id === s.classId)?.name || 'N/A'})</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Kategori Kendala *</label>
                <input
                  type="text"
                  value={refCategory}
                  onChange={(e) => setRefCategory(e.target.value)}
                  placeholder="Ketik Kategori Kendala..."
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>`;

code = code.replace(oldGrid, newGrid);
fs.writeFileSync('src/components/TeacherPanel.tsx', code);
