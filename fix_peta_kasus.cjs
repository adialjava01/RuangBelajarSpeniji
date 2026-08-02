const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

const target = `<div className="mt-8 border-t border-slate-200 pt-6">
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
            </div>`;

const replacement = `<div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Peta Sebaran Kasus Rujukan</h3>
              <div className="space-y-4">
                {(() => {
                  if (referrals.length === 0) return <div className="text-slate-500 text-sm">Belum ada rujukan kasus.</div>;
                  const counts: Record<string, number> = {};
                  referrals.forEach(r => { counts[r.issueCategory] = (counts[r.issueCategory] || 0) + 1; });
                  const total = referrals.length;
                  const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
                  const colors = ['bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-purple-500', 'bg-indigo-500'];
                  
                  return categories.map((cat, i) => {
                    const pct = Math.round((counts[cat] / total) * 100);
                    return (
                      <div key={cat} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-semibold text-slate-600 truncate" title={cat}>{cat}</div>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                          <div className={\`h-full \${colors[i % colors.length]} rounded-full\`} style={{ width: \`\${pct}%\` }}></div>
                        </div>
                        <div className="w-12 text-right text-sm font-bold text-slate-700">{pct}%</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/CounselorPanel.tsx', code);
