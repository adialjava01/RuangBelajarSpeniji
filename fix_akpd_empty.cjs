const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Fix the NaN issue if there are no assessments
code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.academicScore, 0) / needsAssessments.length).toFixed(1)',
  'needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + b.academicScore, 0) / needsAssessments.length).toFixed(1) : "0.0"'
);
code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.socialScore, 0) / needsAssessments.length).toFixed(1)',
  'needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + b.socialScore, 0) / needsAssessments.length).toFixed(1) : "0.0"'
);
code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.familyScore, 0) / needsAssessments.length).toFixed(1)',
  'needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + b.familyScore, 0) / needsAssessments.length).toFixed(1) : "0.0"'
);
code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.careerScore, 0) / needsAssessments.length).toFixed(1)',
  'needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + b.careerScore, 0) / needsAssessments.length).toFixed(1) : "0.0"'
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
