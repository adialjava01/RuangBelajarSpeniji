const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  "const [selectedGrade, setSelectedGrade] = useState<string | null>(null);",
  "const [selectedGrade, setSelectedGrade] = useState<string | null>(null);\n  const [selectedCounselorFilter, setSelectedCounselorFilter] = useState<string>('Semua');"
);

const filterUI = `
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-black text-slate-900">Riwayat Sesi Konseling</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Filter Guru BK:</span>
                <select 
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                  value={selectedCounselorFilter}
                  onChange={(e) => setSelectedCounselorFilter(e.target.value)}
                >
                  <option value="Semua">Semua Guru BK</option>
                  {Array.from(new Set(sessions.map(s => s.counselorName))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>`;

code = code.replace(
  '<h2 className="text-xl font-black text-slate-900 mb-6">Riwayat Sesi Konseling</h2>',
  filterUI
);

code = code.replace(
  'sessions.map(session => (',
  'sessions.filter(s => selectedCounselorFilter === "Semua" || s.counselorName === selectedCounselorFilter).map(session => ('
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
