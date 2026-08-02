const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');

code = code.replace(
  "setRefDetails('');\n    setRefDetails('');",
  "setRefDetails('');"
);

fs.writeFileSync('src/components/TeacherPanel.tsx', code);
