const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'CounselingReferral, CounselingSession } from',
  'CounselingReferral, CounselingSession, DailyCheckIn, NeedsAssessment, Sociometry } from'
);

const stateInsert = `  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<DailyCheckIn[]>([]);
  const [needsAssessments, setNeedsAssessments] = useState<NeedsAssessment[]>([]);
  const [sociometries, setSociometries] = useState<Sociometry[]>([]);`;
code = code.replace(
  '  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);',
  stateInsert
);

const syncInsert = `    const unsubCounselingSessions = syncCollection('counselingSessions', setCounselingSessions, []);
    const unsubDailyCheckIns = syncCollection('dailyCheckIns', setDailyCheckIns, []);
    const unsubNeedsAssessments = syncCollection('needsAssessments', setNeedsAssessments, []);
    const unsubSociometries = syncCollection('sociometries', setSociometries, []);`;
code = code.replace(
  "    const unsubCounselingSessions = syncCollection('counselingSessions', setCounselingSessions, []);",
  syncInsert
);

const unsubInsert = `      unsubCounselingSessions();
      unsubDailyCheckIns();
      unsubNeedsAssessments();
      unsubSociometries();`;
code = code.replace(
  "      unsubCounselingSessions();",
  unsubInsert
);

fs.writeFileSync('src/App.tsx', code);
