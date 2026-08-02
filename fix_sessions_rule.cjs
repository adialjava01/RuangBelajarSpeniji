const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  '    match /config/{configId} {',
  '    match /counselingSessions/{sessionId} {\n      allow read: if isSignedIn();\n      allow write: if isSignedIn();\n    }\n    match /config/{configId} {'
);
fs.writeFileSync('firestore.rules', rules);
