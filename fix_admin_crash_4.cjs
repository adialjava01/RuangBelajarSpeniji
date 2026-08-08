const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /c\.name\.toLowerCase/g,
  "String(c.name || '').toLowerCase"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
