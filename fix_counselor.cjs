const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  'Status Kesejahteraan Sekolah',
  'Status Murid SMPN 1 BEJI'
);

code = code.replace(
  "counselorName: 'Guru BK',",
  "counselorName: activeUser?.name || 'Guru BK',"
);

code = code.replace(
  '<span className="font-bold text-slate-700">{session.actionTaken}</span>',
  '<span className="font-bold text-slate-700">{session.actionTaken}</span>\n                            <span className="text-slate-400">&bull;</span>\n                            <span>Oleh: <span className="font-medium text-slate-600">{session.counselorName}</span></span>'
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
