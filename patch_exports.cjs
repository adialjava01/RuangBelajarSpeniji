const fs = require('fs');
const content = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf-8');

const exportEx = `  const exportGradesExcel = (selectedExamId: string) => {`;
const exportExIdx = content.indexOf(exportEx);

const newExports = `
  const exportManualGradesExcel = (assessmentId: string) => {
    const assessment = manualAssessments?.find(m => m.id === assessmentId);
    if (!assessment) return;
    const cls = getClassName(assessment.classId);
    
    const data = assessment.grades.map((g, idx) => ({
      'No': idx + 1,
      'NIS': g.studentNis,
      'Nama Siswa': g.studentName,
      'Nilai': g.score,
      'Catatan': g.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penilaian Manual');
    XLSX.writeFile(workbook, \`Penilaian_\${assessment.title.replace(/\\s+/g, '_')}_\${cls}.xlsx\`);
  };

  const printManualGradesDocument = (assessmentId: string) => {
    const assessment = manualAssessments?.find(m => m.id === assessmentId);
    if (!assessment) return;
    const cls = getClassName(assessment.classId);
    const subj = getSubjectName(assessment.subjectId);

    const htmlDocument = \`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Penilaian Manual - \${assessment.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin: 0; text-transform: uppercase; color: #0f172a; }
          .header p { margin: 4px 0 0; font-size: 12px; color: #475569; }
          .info-table { width: 100%; margin-bottom: 20px; font-size: 12px; }
          .info-table td { padding: 4px 0; }
          .info-table td:nth-child(1) { width: 120px; font-weight: bold; }
          .info-table td:nth-child(2) { width: 10px; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .data-table th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
          .text-center { text-align: center; }
          .footer { margin-top: 40px; text-align: right; font-size: 12px; }
          .footer p { margin: 4px 0; }
          .signature-space { height: 70px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DAFTAR NILAI</h1>
          <p>\${assessment.title}</p>
        </div>
        
        <table class="info-table">
          <tr><td>Mata Pelajaran</td><td>:</td><td>\${subj}</td></tr>
          <tr><td>Kelas</td><td>:</td><td>\${cls}</td></tr>
          <tr><td>Jenis Penilaian</td><td>:</td><td>\${assessment.type}</td></tr>
          <tr><td>Tanggal</td><td>:</td><td>\${assessment.date}</td></tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th class="text-center" style="width: 60px;">Nilai</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            \${assessment.grades.map((g, idx) => \`
              <tr>
                <td class="text-center">\${idx + 1}</td>
                <td>\${g.studentNis}</td>
                <td>\${g.studentName}</td>
                <td class="text-center"><strong>\${g.score}</strong></td>
                <td>\${g.notes || '-'}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>................................., \${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Guru Mata Pelajaran</p>
          <div class="signature-space"></div>
          <p><strong>\${currentTeacher.name}</strong></p>
          <p>NIP. \${currentTeacher.nip || '-'}</p>
        </div>
      </body>
      </html>
    \`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlDocument);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

`;

const newContent = content.substring(0, exportExIdx) + newExports + content.substring(exportExIdx);
fs.writeFileSync('src/components/TeacherPanel.tsx', newContent, 'utf-8');
console.log('Successfully patched exports');
