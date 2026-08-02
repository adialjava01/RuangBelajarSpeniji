const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add functions
code = code.replace(
  "const handleAddSociometry = (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => { addDocument('sociometries', { ...sociometry, id: `soc_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };",
  "const handleAddSociometry = (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => { addDocument('sociometries', { ...sociometry, id: `soc_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };\n  const handleUpdateSociometry = (id: string, updates: Partial<Sociometry>) => { updateDocument('sociometries', { id, ...updates }); };\n  const handleDeleteSociometry = (id: string) => { deleteDocument('sociometries', id); };"
);

// Pass sociometries and functions to StudentPanel
code = code.replace(
  "                onAddNeedsAssessment={handleAddNeedsAssessment}\n                onAddSociometry={handleAddSociometry}\n                careerPlans={careerPlans}",
  "                onAddNeedsAssessment={handleAddNeedsAssessment}\n                sociometries={sociometries}\n                onAddSociometry={handleAddSociometry}\n                onUpdateSociometry={handleUpdateSociometry}\n                onDeleteSociometry={handleDeleteSociometry}\n                careerPlans={careerPlans}"
);

fs.writeFileSync('src/App.tsx', code);
