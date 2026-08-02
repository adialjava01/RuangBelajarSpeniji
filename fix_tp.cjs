const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');
code = code.replace(
  '  onDeleteAnnouncement?: (id: string) => void;\n  onAddReferral,\n  onToggleAnnouncement',
  '  onDeleteAnnouncement?: (id: string) => void;\n  onToggleAnnouncement'
);
fs.writeFileSync('src/components/TeacherPanel.tsx', code);
