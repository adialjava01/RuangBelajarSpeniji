const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

const oldSort = `                  .sort((a, b) => {
                    const [gradeA, classA] = a.name.split('-');
                    const [gradeB, classB] = b.name.split('-');
                    if (gradeA === gradeB && classA && classB) {
                      return classA.localeCompare(classB);
                    }
                    return a.name.localeCompare(b.name);
                  })`;

const newSort = `                  .sort((a, b) => {
                    const [gradeA, classA] = a.name.split('-');
                    const [gradeB, classB] = b.name.split('-');
                    const gradeOrder: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                    const orderA = gradeOrder[gradeA] || 99;
                    const orderB = gradeOrder[gradeB] || 99;
                    
                    if (orderA !== orderB) {
                      return orderA - orderB;
                    }
                    
                    if (classA && classB) {
                      return classA.localeCompare(classB);
                    }
                    return a.name.localeCompare(b.name);
                  })`;

code = code.replace(oldSort, newSort);
fs.writeFileSync('src/components/CounselorPanel.tsx', code);
