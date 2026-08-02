const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  "              <button onClick={() => setShowSosiometriForm(true)} className=\"p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group\">\n                <Users className=\"w-8 h-8 text-rose-500 group-hover:scale-110 transition\" />\n                <span className=\"font-bold text-slate-800\">Isi Sosiometri Kelas</span>\n                <span className=\"text-xs text-slate-500\">Pemetaan hubungan pertemanan di kelas</span>\n              </button>",
  "              <button onClick={() => setShowSosiometriForm(true)} className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center transition gap-2 group ${mySociometry ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>\n                {mySociometry ? (\n                  <CheckCircle className=\"w-8 h-8 text-emerald-500 group-hover:scale-110 transition\" />\n                ) : (\n                  <Users className=\"w-8 h-8 text-rose-500 group-hover:scale-110 transition\" />\n                )}\n                <span className=\"font-bold text-slate-800\">{mySociometry ? 'Edit Sosiometri Kelas' : 'Isi Sosiometri Kelas'}</span>\n                <span className={`text-xs ${mySociometry ? 'text-emerald-600' : 'text-slate-500'}`}>{mySociometry ? 'Sudah Diisi' : 'Pemetaan hubungan pertemanan di kelas'}</span>\n              </button>"
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
