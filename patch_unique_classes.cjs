const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

const classMapCode = `              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from(new Map(classes.map(c => [c.name, c])).values())
                  .filter(c => selectedGrade === null || c.name.startsWith(selectedGrade + '-') || c.name.startsWith(selectedGrade + ' '))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(c => (`;

code = code.replace(
  `              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {classes
                  .filter(c => selectedGrade === null || c.name.startsWith(selectedGrade + '-') || c.name.startsWith(selectedGrade + ' '))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(c => (`,
  classMapCode
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
