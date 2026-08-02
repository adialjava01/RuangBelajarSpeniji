const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const handlers = `  const handleAddDailyCheckIn = (checkIn: Omit<DailyCheckIn, 'id' | 'createdAt'>) => { addDocument('dailyCheckIns', { ...checkIn, id: \`dc_\${Math.random().toString(36).substring(7)}\`, createdAt: new Date().toISOString() }); };
  const handleAddNeedsAssessment = (assessment: Omit<NeedsAssessment, 'id' | 'createdAt'>) => { addDocument('needsAssessments', { ...assessment, id: \`na_\${Math.random().toString(36).substring(7)}\`, createdAt: new Date().toISOString() }); };
  const handleAddSociometry = (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => { addDocument('sociometries', { ...sociometry, id: \`soc_\${Math.random().toString(36).substring(7)}\`, createdAt: new Date().toISOString() }); };`;

code = code.replace(
  'const handleSaveSession = (session: Omit<CounselingSession, \'id\'>) => { addDocument(\'counselingSessions\', { ...session, id: `cs_${Math.random().toString(36).substring(7)}` }); };',
  "const handleSaveSession = (session: Omit<CounselingSession, 'id'>) => { addDocument('counselingSessions', { ...session, id: `cs_${Math.random().toString(36).substring(7)}` }); };\n" + handlers
);

code = code.replace(
  '              <CounselorPanel',
  `              <CounselorPanel
                dailyCheckIns={dailyCheckIns}
                needsAssessments={needsAssessments}
                sociometries={sociometries}`
);

code = code.replace(
  '              <StudentPanel',
  `              <StudentPanel
                dailyCheckIns={dailyCheckIns}
                onAddDailyCheckIn={handleAddDailyCheckIn}
                onAddNeedsAssessment={handleAddNeedsAssessment}
                onAddSociometry={handleAddSociometry}
                classes={classes}
                students={students}`
);

fs.writeFileSync('src/App.tsx', code);
