const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "} from './types';",
  ", DailyCheckIn, NeedsAssessment, Sociometry } from './types';"
);
fs.writeFileSync('src/App.tsx', appCode);

let spCode = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');
spCode = spCode.replace(
  "} from '../types';",
  ", DailyCheckIn, NeedsAssessment, Sociometry, ClassItem } from '../types';"
);
fs.writeFileSync('src/components/StudentPanel.tsx', spCode);
