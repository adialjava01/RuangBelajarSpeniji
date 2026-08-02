const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  "  const [showKarirForm, setShowKarirForm] = useState(false);",
  "  const mySociometry = sociometries.find(s => s.studentNis === currentStudent.nis);\n  useEffect(() => {\n    if (showSosiometriForm) {\n      setSelectedFriends(mySociometry?.friendsWith || []);\n    }\n  }, [showSosiometriForm, mySociometry]);\n  const [showKarirForm, setShowKarirForm] = useState(false);"
);
fs.writeFileSync('src/components/StudentPanel.tsx', code);
