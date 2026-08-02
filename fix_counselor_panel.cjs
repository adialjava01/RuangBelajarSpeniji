const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

// Replace the scoring logic in the table header
code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.academicScore, 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 5.0</span>',
  '(needsAssessments.reduce((a, b) => a + ((b.q9||0) + (b.q10||0) + (b.q11||0) + (b.q12||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>'
);

code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.socialScore, 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 5.0</span>',
  '(needsAssessments.reduce((a, b) => a + ((b.q5||0) + (b.q6||0) + (b.q7||0) + (b.q8||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>'
);

code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.familyScore, 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 5.0</span>',
  '(needsAssessments.reduce((a, b) => a + ((b.q1||0) + (b.q2||0) + (b.q3||0) + (b.q4||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>'
);

code = code.replace(
  '(needsAssessments.reduce((a, b) => a + b.careerScore, 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 5.0</span>',
  '(needsAssessments.reduce((a, b) => a + ((b.q13||0) + (b.q14||0) + (b.q15||0) + (b.q16||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>'
);

// We need to also find where akpd.academicScore is used in the list
// Let's replace the list items as well

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
