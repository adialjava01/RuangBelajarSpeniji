const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Add new state variables
code = code.replace(
  'const [showAKPDResults, setShowAKPDResults] = useState(false);',
  `const [showAKPDResults, setShowAKPDResults] = useState(false);
  const [akmFilter, setAkmFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [akmClassFilter, setAkmClassFilter] = useState<string>('all');`
);

// Replace the table section
const tableTarget = `<div className="overflow-x-auto rounded-xl border border-slate-200">
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
                                {(() => {
                                  const score = (akpd.q9||0) + (akpd.q10||0) + (akpd.q11||0) + (akpd.q12||0);
                                  return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                {(() => {
                                  const score = (akpd.q5||0) + (akpd.q6||0) + (akpd.q7||0) + (akpd.q8||0);
                                  return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                {(() => {
                                  const score = (akpd.q1||0) + (akpd.q2||0) + (akpd.q3||0) + (akpd.q4||0);
                                  return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                {(() => {
                                  const score = (akpd.q13||0) + (akpd.q14||0) + (akpd.q15||0) + (akpd.q16||0);
                                  return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                })()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => setSelectedAKPD(akpd)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">Detail Esai</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>`;

const tableReplacement = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex gap-2">
                      <select 
                        value={akmClassFilter}
                        onChange={(e) => setAkmClassFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">Semua Kelas</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select 
                        value={akmFilter}
                        onChange={(e) => setAkmFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">Semua Status</option>
                        <option value="done">Sudah Mengisi</option>
                        <option value="pending">Belum Mengisi</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Nama Siswa</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Akademik</th>
                          <th className="px-4 py-3 text-center">Sosial</th>
                          <th className="px-4 py-3 text-center">Keluarga</th>
                          <th className="px-4 py-3 text-center">Karir</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter(s => akmClassFilter === 'all' || s.classId === akmClassFilter)
                          .filter(s => {
                            const hasDone = needsAssessments.some(a => a.studentNis === s.nis);
                            if (akmFilter === 'done') return hasDone;
                            if (akmFilter === 'pending') return !hasDone;
                            return true;
                          })
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(student => {
                            const akpd = needsAssessments.find(a => a.studentNis === student.nis);
                            const className = classes.find(c => c.id === student.classId)?.name || '-';
                            return (
                              <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800">{student.name}</div>
                                  <div className="text-xs text-slate-500">{className}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {akpd ? (
                                    <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 font-bold text-xs inline-flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Sudah
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Belum
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q9||0) + (akpd.q10||0) + (akpd.q11||0) + (akpd.q12||0);
                                    return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q5||0) + (akpd.q6||0) + (akpd.q7||0) + (akpd.q8||0);
                                    return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q1||0) + (akpd.q2||0) + (akpd.q3||0) + (akpd.q4||0);
                                    return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q13||0) + (akpd.q14||0) + (akpd.q15||0) + (akpd.q16||0);
                                    return <span className={\`px-2 py-1 rounded \${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}\`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {akpd ? (
                                    <button onClick={() => setSelectedAKPD(akpd)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">Detail Esai</button>
                                  ) : (
                                    <span className="text-slate-300 text-xs italic">Menunggu...</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>`;

code = code.replace(tableTarget, tableReplacement);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
