const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Fix teacher filter in AdminPanel tbody (line 1554)
code = code.replace(
  /teachers\.filter\(t => t\.name\.toLowerCase\(\)\.includes\(searchTeacher\.toLowerCase\(\)\) \|\| t\.nip\.toLowerCase\(\)\.includes\(searchTeacher\.toLowerCase\(\)\)\)/g,
  "filteredTeachers"
);

// Fix filteredTeachers definition
code = code.replace(
  /t\.nip\.includes\(searchTeacher\)/g,
  "(t.nip || '').includes(searchTeacher)"
);

// Fix filteredStudents definition
code = code.replace(
  /s\.nis\.includes\(searchStudent\)/g,
  "(s.nis || '').includes(searchStudent)"
);

// Fix sortedClasses logic
code = code.replace(
  /return a\.name\.localeCompare\(b\.name/g,
  "return (a.name || '').localeCompare((b.name || '')"
);

// Fix students sort
code = code.replace(
  /return classA\.localeCompare\(classB\);/g,
  "return (classA || '').localeCompare(classB || '');"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
