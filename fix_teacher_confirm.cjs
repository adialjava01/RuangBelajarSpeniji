const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');

code = code.replace(
  "if(window.confirm('Hapus penilaian?')) onDeleteManualAssessment?.(assessment.id);",
  "onDeleteManualAssessment?.(assessment.id);"
);

fs.writeFileSync('src/components/TeacherPanel.tsx', code);
