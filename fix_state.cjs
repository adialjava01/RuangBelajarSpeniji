const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf8');

code = code.replace(
  "const [refStudentNis, setRefStudentNis] = useState('');",
  "const [refClassId, setRefClassId] = useState('');\n  const [refStudentNis, setRefStudentNis] = useState('');"
);
code = code.replace(
  "const [refCategory, setRefCategory] = useState('Perilaku');",
  "const [refCategory, setRefCategory] = useState('');"
);
code = code.replace(
  "setRefCategory('Perilaku');",
  "setRefCategory('');\n    setRefClassId('');"
);

fs.writeFileSync('src/components/TeacherPanel.tsx', code);
