const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

const dupProps = `  dailyCheckIns?: DailyCheckIn[];
  onAddDailyCheckIn?: (checkIn: Omit<DailyCheckIn, 'id' | 'createdAt'>) => void;
  onAddNeedsAssessment?: (assessment: Omit<NeedsAssessment, 'id' | 'createdAt'>) => void;
  onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;
  classes?: ClassItem[];
  students?: Student[];`;

code = code.replace(dupProps + "\n" + dupProps, dupProps);

const dupParams = `  dailyCheckIns = [],
  onAddDailyCheckIn,
  onAddNeedsAssessment,
  onAddSociometry,
  classes = [],
  students = [],`;

code = code.replace(dupParams + "\n" + dupParams, dupParams);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
