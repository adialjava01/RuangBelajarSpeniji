const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');

code = code.replace(/exportManualGrade,\n  CounselingReferralsExcel/g, 'exportManualGradeExcel');
code = code.replace(/exportManualGrade,\r?\n\s+CounselingReferralsExcel/g, 'exportManualGradeExcel');
code = code.replace(/printManualGrade,\n  CounselingReferralsDocument/g, 'printManualGradeDocument');
code = code.replace(/printManualGrade,\r?\n\s+CounselingReferralsDocument/g, 'printManualGradeDocument');
code = code.replace(/setManualGrade,\n  CounselingReferrals/g, 'setManualGrades');
code = code.replace(/setManualGrade,\r?\n\s+CounselingReferrals/g, 'setManualGrades');
code = code.replace(/setManualGrades,\n  CounselingReferrals/g, 'setManualGrades');
code = code.replace(/setManualGrades,\r?\n\s+CounselingReferrals/g, 'setManualGrades');
code = code.replace(/ManualGrades\n  CounselingReferral/g, 'ManualGrade, CounselingReferral');
code = code.replace(/useState<ManualGrades\r?\n\s+CounselingReferral\[\]>/g, 'useState<ManualGrade[]>');
code = code.replace(/ManualGrade,\r?\n\s+CounselingReferral\[\]/g, 'ManualGrade[]');
code = code.replace(/ManualGrade,\r?\n\s+CounselingReferral/g, 'ManualGrade, CounselingReferral');

fs.writeFileSync('src/components/TeacherPanel.tsx', code);
