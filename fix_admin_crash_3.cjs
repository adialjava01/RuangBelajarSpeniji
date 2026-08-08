const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /t\.name\.toLowerCase/g,
  "String(t.name || '').toLowerCase"
);
code = code.replace(
  /t\.nip\.toLowerCase/g,
  "String(t.nip || '').toLowerCase"
);
code = code.replace(
  /t\.subject\.toLowerCase/g,
  "String(t.subject || '').toLowerCase"
);
code = code.replace(
  /e\.topic\.toLowerCase/g,
  "String(e.topic || '').toLowerCase"
);
code = code.replace(
  /m\.title\.toLowerCase/g,
  "String(m.title || '').toLowerCase"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
