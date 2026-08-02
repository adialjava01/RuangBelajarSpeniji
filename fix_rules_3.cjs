const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "    match /sociometries/{sociometryId} {\n      allow read: if isSignedIn();\n      allow write: if isSignedIn();\n    }",
  "    match /sociometries/{sociometryId} {\n      allow read: if isSignedIn();\n      allow write: if isSignedIn();\n    }\n\n    match /homeVisits/{visitId} {\n      allow read: if isSignedIn();\n      allow write: if isSignedIn();\n    }\n\n    match /careerPlans/{planId} {\n      allow read: if isSignedIn();\n      allow write: if isSignedIn();\n    }"
);

fs.writeFileSync('firestore.rules', code);
