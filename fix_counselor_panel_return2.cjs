const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  '  return (\n    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">',
  '  return (\n    <>\n    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">'
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
