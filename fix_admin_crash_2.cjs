const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /\(t\.name \|\| ''\)\.toLowerCase\(\)/g,
  "String(t.name || '').toLowerCase()"
);
code = code.replace(
  /\(t\.nip \|\| ''\)\.toLowerCase\(\)/g,
  "String(t.nip || '').toLowerCase()"
);
code = code.replace(
  /\(s\.name \|\| ''\)\.toLowerCase\(\)/g,
  "String(s.name || '').toLowerCase()"
);
code = code.replace(
  /\(s\.nis \|\| ''\)\.toLowerCase\(\)/g,
  "String(s.nis || '').toLowerCase()"
);
code = code.replace(
  /\(t\.subject \|\| ''\)\.toLowerCase\(\)/g,
  "String(t.subject || '').toLowerCase()"
);
code = code.replace(
  /\(classA \|\| ''\)\.localeCompare\(classB \|\| ''\)/g,
  "String(classA || '').localeCompare(String(classB || ''))"
);
code = code.replace(
  /\(a\.name \|\| ''\)\.localeCompare\(\(b\.name \|\| ''\)/g,
  "String(a.name || '').localeCompare(String(b.name || ''))"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
