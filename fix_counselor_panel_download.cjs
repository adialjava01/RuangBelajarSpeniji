const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

const functionCode = `  const handleDownloadAKMReport = () => {
    const headers = [
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Skor Pribadi",
      "Skor Sosial",
      "Skor Belajar",
      "Skor Karir",
      "Esai Emosi",
      "Esai Sosial",
      "Esai Belajar",
      "Esai Cita-Cita"
    ];

    const rows = needsAssessments.map(akpd => {
      const student = students.find(s => s.nis === akpd.studentNis);
      const studentName = student ? student.name : akpd.studentNis;
      const className = student ? classes.find(c => c.id === student.classId)?.name || '-' : '-';

      const scorePribadi = (akpd.q1||0) + (akpd.q2||0) + (akpd.q3||0) + (akpd.q4||0);
      const scoreSosial = (akpd.q5||0) + (akpd.q6||0) + (akpd.q7||0) + (akpd.q8||0);
      const scoreBelajar = (akpd.q9||0) + (akpd.q10||0) + (akpd.q11||0) + (akpd.q12||0);
      const scoreKarir = (akpd.q13||0) + (akpd.q14||0) + (akpd.q15||0) + (akpd.q16||0);

      const escapeCSV = (str) => \`"\${(str || '').replace(/"/g, '""')}"\`;

      return [
        akpd.studentNis,
        escapeCSV(studentName),
        escapeCSV(className),
        scorePribadi,
        scoreSosial,
        scoreBelajar,
        scoreKarir,
        escapeCSV(akpd.essayEmotion),
        escapeCSV(akpd.essaySocial),
        escapeCSV(akpd.essayAcademic),
        escapeCSV(akpd.essayCareer)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`Laporan_AKM_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

`;

code = code.replace('  return (\n    <>\n    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">', functionCode + '  return (\n    <>\n    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">');

const buttonTarget = `<div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button onClick={() => setShowAKPDResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>`;
            
const buttonReplacement = `<div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={handleDownloadAKMReport} className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> Unduh Laporan (CSV)
              </button>
              <button onClick={() => setShowAKPDResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>`;
            
code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
