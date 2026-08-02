const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  /\/\/ Plus Icon inline[\s\S]*?<\/svg>\n\);\n/g,
  ""
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
