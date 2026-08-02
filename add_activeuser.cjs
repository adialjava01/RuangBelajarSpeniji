const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  'export default function CounselorPanel({',
  `export default function CounselorPanel({
  activeUser,`
);

code = code.replace(
  'interface CounselorPanelProps {',
  `interface CounselorPanelProps {
  activeUser?: any;`
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
