const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  '    match /config/{configId} {',
  `    match /dailyCheckIns/{checkInId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /needsAssessments/{assessmentId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /sociometries/{sociometryId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    match /config/{configId} {`
);
fs.writeFileSync('firestore.rules', rules);
