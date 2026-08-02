const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Add state for selected grade
code = code.replace(
  "const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);",
  "const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);\n  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);"
);

// Add unique grades logic just before return
const gradesLogic = `
  const uniqueGrades = Array.from(new Set(classes.map(c => {
    const parts = c.name.split(/[-\\s]/);
    return parts[0];
  }))).sort((a, b) => {
    const gradeOrder: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
    return (gradeOrder[a] || 99) - (gradeOrder[b] || 99);
  });
`;

code = code.replace(
  "  return (",
  gradesLogic + "\n  return ("
);

// Replace Sosiometri section
const oldSosiometri = `              <h2 className="text-xl font-black text-slate-900 mb-4">Sosiometri Kelas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {classes.map(c => (
                  <div key={c.id} className="border border-slate-200 p-4 rounded-2xl hover:border-teal-300 transition cursor-pointer">
                    <h4 className="font-bold text-slate-800">{c.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Data Sosiometri: {sociometries.filter(s => s.classId === c.id).length} Entri</p>
                  </div>
                ))}
              </div>`;

const newSosiometri = `              <h2 className="text-xl font-black text-slate-900 mb-4">Sosiometri Kelas</h2>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedGrade(null)}
                  className={\`px-4 py-2 rounded-xl text-sm font-bold transition \${selectedGrade === null ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  Semua Jenjang
                </button>
                {uniqueGrades.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={\`px-4 py-2 rounded-xl text-sm font-bold transition \${selectedGrade === grade ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                  >
                    Kelas {grade}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {classes
                  .filter(c => selectedGrade === null || c.name.startsWith(selectedGrade + '-') || c.name.startsWith(selectedGrade + ' '))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(c => (
                  <div key={c.id} className="border border-slate-200 p-4 rounded-2xl hover:border-teal-300 transition cursor-pointer bg-white group shadow-sm hover:shadow-md">
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-teal-700 transition">{c.name}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                      {sociometries.filter(s => s.classId === c.id).length} Entri Sosiometri
                    </p>
                  </div>
                ))}
              </div>`;

code = code.replace(oldSosiometri, newSosiometri);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
