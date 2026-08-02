const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  'CounselingReferral, CounselingSession, Student, ClassItem, Teacher',
  'CounselingReferral, CounselingSession, Student, ClassItem, Teacher, DailyCheckIn, NeedsAssessment, Sociometry'
);

code = code.replace(
  'interface CounselorPanelProps {',
  `interface CounselorPanelProps {
  dailyCheckIns?: DailyCheckIn[];
  needsAssessments?: NeedsAssessment[];
  sociometries?: Sociometry[];`
);

code = code.replace(
  'export default function CounselorPanel({',
  `export default function CounselorPanel({
  dailyCheckIns = [],
  needsAssessments = [],
  sociometries = [],`
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
