const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

const target = `<td className="px-4 py-3 text-center font-medium">
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
                              </td>`;

const replacement = `<td className="px-4 py-3 text-center font-medium">
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
                              </td>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/CounselorPanel.tsx', code);
