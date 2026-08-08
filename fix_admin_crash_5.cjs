const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /\(sub\.name \|\| ''\)\.toLowerCase/g,
  "String(sub.name || '').toLowerCase"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
