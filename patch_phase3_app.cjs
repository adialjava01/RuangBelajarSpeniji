const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update imports
code = code.replace(
  "DailyCheckIn, NeedsAssessment, Sociometry } from './types';",
  "DailyCheckIn, NeedsAssessment, Sociometry, HomeVisit, CareerPlan } from './types';"
);

// Add state variables
code = code.replace(
  "const [sociometries, setSociometries] = useState<Sociometry[]>([]);",
  "const [sociometries, setSociometries] = useState<Sociometry[]>([]);\n  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>([]);\n  const [careerPlans, setCareerPlans] = useState<CareerPlan[]>([]);"
);

// Add sync
code = code.replace(
  "const unsubSociometries = syncCollection('sociometries', setSociometries, []);",
  "const unsubSociometries = syncCollection('sociometries', setSociometries, []);\n    const unsubHomeVisits = syncCollection('homeVisits', setHomeVisits, []);\n    const unsubCareerPlans = syncCollection('careerPlans', setCareerPlans, []);"
);

// Cleanup sync
code = code.replace(
  "unsubSociometries();",
  "unsubSociometries();\n      unsubHomeVisits();\n      unsubCareerPlans();"
);

// Add handlers
code = code.replace(
  "const handleAddSociometry = (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => { addDocument('sociometries', { ...sociometry, id: `soc_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };",
  "const handleAddSociometry = (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => { addDocument('sociometries', { ...sociometry, id: `soc_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };\n  const handleAddHomeVisit = (visit: Omit<HomeVisit, 'id' | 'createdAt'>) => { addDocument('homeVisits', { ...visit, id: `hv_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };\n  const handleUpdateHomeVisit = (id: string, updates: Partial<HomeVisit>) => { updateDocument('homeVisits', { id, ...updates }); };\n  const handleAddCareerPlan = (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => { addDocument('careerPlans', { ...plan, id: `cp_${Math.random().toString(36).substring(7)}`, updatedAt: new Date().toISOString() }); };\n  const handleUpdateCareerPlan = (id: string, updates: Partial<CareerPlan>) => { updateDocument('careerPlans', { id, ...updates, updatedAt: new Date().toISOString() }); };"
);

// Pass down to StudentPanel
code = code.replace(
  "onAddSociometry={handleAddSociometry}",
  "onAddSociometry={handleAddSociometry}\n                careerPlans={careerPlans}\n                onAddCareerPlan={handleAddCareerPlan}\n                onUpdateCareerPlan={handleUpdateCareerPlan}"
);

// Pass down to CounselorPanel
code = code.replace(
  "sociometries={sociometries}",
  "sociometries={sociometries}\n                homeVisits={homeVisits}\n                careerPlans={careerPlans}\n                onAddHomeVisit={handleAddHomeVisit}\n                onUpdateHomeVisit={handleUpdateHomeVisit}\n                onAddCareerPlan={handleAddCareerPlan}\n                onUpdateCareerPlan={handleUpdateCareerPlan}"
);

fs.writeFileSync('src/App.tsx', code);
