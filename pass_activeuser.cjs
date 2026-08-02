const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<CounselorPanel',
  '<CounselorPanel activeUser={activeUser}'
);

fs.writeFileSync('src/App.tsx', code);
