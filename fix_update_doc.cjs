const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "updateDocument('counselingReferrals', id, { status });",
  "updateDocument('counselingReferrals', { id, status });"
);
fs.writeFileSync('src/App.tsx', code);
