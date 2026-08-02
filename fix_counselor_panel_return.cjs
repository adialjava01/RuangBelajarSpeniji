const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  "return (\n    <>gradeOrder[a] || 99) - (gradeOrder[b] || 99);",
  "return (gradeOrder[a] || 99) - (gradeOrder[b] || 99);"
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
