const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

if (!code.includes('recharts')) {
  code = code.replace(
    "import { \n  CounselingReferral",
    "import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';\nimport { \n  CounselingReferral"
  );
}

const radarDataCode = `
  const radarData = [
    { subject: 'Pribadi/Keluarga', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q1||0) + (b.q2||0) + (b.q3||0) + (b.q4||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
    { subject: 'Sosial', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q5||0) + (b.q6||0) + (b.q7||0) + (b.q8||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
    { subject: 'Belajar/Akademik', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q9||0) + (b.q10||0) + (b.q11||0) + (b.q12||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
    { subject: 'Karir', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q13||0) + (b.q14||0) + (b.q15||0) + (b.q16||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
  ];
`;

const chartUI = `
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 mb-6 text-center">Sebaran Rata-rata Skor AKM Siswa</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 12]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Radar name="Skor Rata-rata" dataKey="A" stroke="#0d9488" strokeWidth={2} fill="#14b8a6" fillOpacity={0.4} />
                    <Tooltip 
                      formatter={(value) => [\`\${value} / 12\`, 'Skor']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
`;

code = code.replace(
  "  return (\n    <>\n    <div",
  radarDataCode + "  return (\n    <>\n    <div"
);

code = code.replace(
  `              <button onClick={() => setShowAKPDResults(true)} className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shadow-sm">
                Lihat Hasil AKM
              </button>
            </div>
            
            <div className="mt-8 border-t border-slate-200 pt-6">`,
  `              <button onClick={() => setShowAKPDResults(true)} className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shadow-sm">
                Lihat Hasil AKM
              </button>
            </div>
${chartUI}
            <div className="mt-8 border-t border-slate-200 pt-6">`
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
