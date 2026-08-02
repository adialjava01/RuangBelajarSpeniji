const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `      const matchedTeacher = teachers.find(t => t.nip === identifier || t.email === email);
      if (matchedTeacher) {
        setCurrentRole('Teacher');
        setActiveUser(matchedTeacher);
        return;
      }`,
  `      const matchedTeacher = teachers.find(t => t.nip === identifier || t.email === email);
      if (matchedTeacher) {
        const lowerSubject = (matchedTeacher.subject || '').toLowerCase();
        if (lowerSubject.includes('bimbingan') || lowerSubject.includes('konseling') || lowerSubject === 'bk') {
          setCurrentRole('Counselor');
        } else {
          setCurrentRole('Teacher');
        }
        setActiveUser(matchedTeacher);
        return;
      }`
);

code = code.replace(
  `      const matchedTeacher = teachers.find(t => t.nip === identifier);
      const expectedTeacherPass = matchedTeacher?.password || 'guru123';
      if (matchedTeacher && pass === expectedTeacherPass) {
        setCurrentRole('Teacher');
        setActiveUser(matchedTeacher);
        return;
      }`,
  `      const matchedTeacher = teachers.find(t => t.nip === identifier);
      const expectedTeacherPass = matchedTeacher?.password || 'guru123';
      if (matchedTeacher && pass === expectedTeacherPass) {
        const lowerSubject = (matchedTeacher.subject || '').toLowerCase();
        if (lowerSubject.includes('bimbingan') || lowerSubject.includes('konseling') || lowerSubject === 'bk') {
          setCurrentRole('Counselor');
        } else {
          setCurrentRole('Teacher');
        }
        setActiveUser(matchedTeacher);
        return;
      }`
);

fs.writeFileSync('src/App.tsx', code);
