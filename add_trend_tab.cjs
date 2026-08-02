const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// 1. Add BarChart, CartesianGrid, XAxis, YAxis, Legend, Bar to recharts import
if (!code.includes('BarChart')) {
  code = code.replace(
    "RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip",
    "RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Legend, Bar"
  );
}

// 2. Update activeTab type
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'rujukan' | 'sesi' | 'abk' | 'homevisit' | 'karir'>('dashboard');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'tren' | 'rujukan' | 'sesi' | 'abk' | 'homevisit' | 'karir'>('dashboard');"
);

// 3. Add icon import for Tren (BarChartIcon from lucide-react, maybe use BarChart2)
if (!code.includes('BarChart2')) {
  code = code.replace(
    "Briefcase, Download, Map as MapIcon, Plus, Trash2, MapPin",
    "Briefcase, Download, Map as MapIcon, Plus, Trash2, MapPin, BarChart2"
  );
}

// 4. Add the tab button
const tabButton = `        <button
          onClick={() => setActiveTab('tren')}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap \${
            activeTab === 'tren' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }\`}
        >
          <BarChart2 className="w-4 h-4" /> Analisis Tren
        </button>
        <button
          onClick={() => setActiveTab('rujukan')}`;
          
code = code.replace("        <button\n          onClick={() => setActiveTab('rujukan')}", tabButton);

// 5. Add the 'tren' tab content
const trendContent = `
      {activeTab === 'tren' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Analisis Tren AKM Antarkelas</h2>
            <p className="text-sm text-slate-500 mb-6">Perbandingan rata-rata skor asesmen kebutuhan murid (Pribadi, Sosial, Belajar, Karir) pada masing-class kelas.</p>
            
            {needsAssessments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                Belum ada data asesmen murid.
              </div>
            ) : (
              <div className="h-[500px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const classAverages = classes.map(c => {
                        const studentsInClass = students.filter(s => s.classId === c.id);
                        const nisInClass = studentsInClass.map(s => s.nis);
                        const classAkpd = needsAssessments.filter(a => nisInClass.includes(a.studentNis));
                        
                        if (classAkpd.length === 0) {
                          return null;
                        }
                        
                        const avgPribadi = classAkpd.reduce((sum, b) => sum + ((b.q1||0) + (b.q2||0) + (b.q3||0) + (b.q4||0)), 0) / classAkpd.length;
                        const avgSosial = classAkpd.reduce((sum, b) => sum + ((b.q5||0) + (b.q6||0) + (b.q7||0) + (b.q8||0)), 0) / classAkpd.length;
                        const avgBelajar = classAkpd.reduce((sum, b) => sum + ((b.q9||0) + (b.q10||0) + (b.q11||0) + (b.q12||0)), 0) / classAkpd.length;
                        const avgKarir = classAkpd.reduce((sum, b) => sum + ((b.q13||0) + (b.q14||0) + (b.q15||0) + (b.q16||0)), 0) / classAkpd.length;
                        
                        return {
                          name: c.name,
                          Pribadi: Number(avgPribadi.toFixed(2)),
                          Sosial: Number(avgSosial.toFixed(2)),
                          Belajar: Number(avgBelajar.toFixed(2)),
                          Karir: Number(avgKarir.toFixed(2))
                        };
                      }).filter(item => item !== null) as {name: string, Pribadi: number, Sosial: number, Belajar: number, Karir: number}[];
                      
                      return classAverages.sort((a, b) => a.name.localeCompare(b.name));
                    })()}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 12]} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Pribadi" name="Pribadi/Keluarga" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sosial" name="Sosial" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Belajar" name="Belajar/Akademik" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Karir" name="Karir" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'rujukan' && (`;

code = code.replace("      {activeTab === 'rujukan' && (", trendContent);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
