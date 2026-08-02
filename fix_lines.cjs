const fs = require('fs');
let lines = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8').split('\n');

const newCode = `              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from(new Map(classes.map(c => [c.name, c])).values())
                  .filter(c => selectedGrade === null || c.name.startsWith(selectedGrade + '-') || c.name.startsWith(selectedGrade + ' '))
                  .sort((a, b) => {
                    const [gradeA, classA] = a.name.split('-');
                    const [gradeB, classB] = b.name.split('-');
                    if (gradeA === gradeB && classA && classB) {
                      return classA.localeCompare(classB);
                    }
                    return a.name.localeCompare(b.name);
                  })
                  .map(c => {
                    const matchingClassIds = classes.filter(cls => cls.name === c.name).map(cls => cls.id);
                    return (
                      <div key={c.name} className="border border-slate-200 p-4 rounded-2xl hover:border-teal-300 transition cursor-pointer bg-white group shadow-sm hover:shadow-md">
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-teal-700 transition">{c.name}</h4>
                        <p className="text-sm font-medium text-slate-500 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                          {sociometries.filter(s => matchingClassIds.includes(s.classId)).length} Entri Sosiometri
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}`;

// We know the exact line numbers from grep/sed output
// 274: 
// 275: <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
// ...
// 304:       )}

lines.splice(274, 31);
lines.splice(274, 0, newCode);

fs.writeFileSync('src/components/CounselorPanel.tsx', lines.join('\n'));
