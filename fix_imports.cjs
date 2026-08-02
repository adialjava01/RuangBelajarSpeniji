const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  'RegistrationRequest, SchoolConfig, QuestionBank, ShareRequest, GlobalAnnouncement, TeacherScheduleNote, TeachingModule, ManualAssessment, CounselingReferral, CounselingSession } from',
  'RegistrationRequest, SchoolConfig, QuestionBank, ShareRequest, GlobalAnnouncement, TeacherScheduleNote, TeachingModule, ManualAssessment, CounselingReferral, CounselingSession, DailyCheckIn, NeedsAssessment, Sociometry } from'
);
fs.writeFileSync('src/App.tsx', appCode);

let spCode = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');
spCode = spCode.replace(
  'Teacher, SubjectItem, TeacherAnnouncement} from',
  'Teacher, SubjectItem, TeacherAnnouncement, DailyCheckIn, NeedsAssessment, Sociometry, ClassItem} from'
);
fs.writeFileSync('src/components/StudentPanel.tsx', spCode);
