const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  "  onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;",
  "  sociometries?: Sociometry[];\n  onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;\n  onUpdateSociometry?: (id: string, updates: Partial<Sociometry>) => void;\n  onDeleteSociometry?: (id: string) => void;"
);

// Destructure them
code = code.replace(
  "  onAddNeedsAssessment,\n  onAddSociometry,\n  careerPlans = [],",
  "  onAddNeedsAssessment,\n  sociometries = [],\n  onAddSociometry,\n  onUpdateSociometry,\n  onDeleteSociometry,\n  careerPlans = [],"
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
