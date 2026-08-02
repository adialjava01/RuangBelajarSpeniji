const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');

code = code.replace(
  "setRefCategory('');\n    setRefClassId('');",
  "setRefCategory('');\n    setRefClassId('');\n    setRefDetails('');"
);

fs.writeFileSync('src/components/TeacherPanel.tsx', code);
