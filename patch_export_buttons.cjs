const fs = require('fs');
const content = fs.readFileSync('src/components/TeacherPanel.tsx', 'utf-8');

const targetStr = `{selectedExamForGrades && (
              <div className="flex gap-2">
                <button
                  onClick={() => exportGradesExcel(selectedExamForGrades)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Excel
                </button>
                <button
                  onClick={() => printGradesDocument(selectedExamForGrades)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Cetak PDF
                </button>
              </div>
            )}`;

const replaceStr = `{(selectedExamForGrades || selectedManualAssessment) && (
              <div className="flex gap-2">
                <button
                  onClick={() => selectedExamForGrades ? exportGradesExcel(selectedExamForGrades) : exportManualGradesExcel(selectedManualAssessment)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Excel
                </button>
                <button
                  onClick={() => selectedExamForGrades ? printGradesDocument(selectedExamForGrades) : printManualGradesDocument(selectedManualAssessment)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Cetak PDF
                </button>
              </div>
            )}`;

if (!content.includes(targetStr)) {
  console.log("Could not find target string.");
  process.exit(1);
}

const newContent = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/TeacherPanel.tsx', newContent, 'utf-8');
console.log('Successfully patched export buttons');
