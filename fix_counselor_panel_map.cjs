const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  "Array.from(new Map<string, ClassItem>(classes.map(c => [c.name, c])).values())",
  "Array.from<ClassItem>(new Map(classes.map(c => [c.name, c])).values())"
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
