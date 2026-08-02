const fs = require('fs');
let code = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');

code = code.replace(
  "const [activeTab, setActiveTab] = useState<'rujukan' | 'sesi' | 'abk'>('rujukan');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'rujukan' | 'sesi' | 'abk'>('dashboard');"
);

code = code.replace(
  "<div className=\"flex overflow-x-auto gap-2 border-b border-slate-200 pb-2\">",
  `<div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap \${
            activeTab === 'dashboard' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }\`}
        >
          <Home className="w-4 h-4" /> Dashboard Utama
        </button>
        <button
          onClick={() => setActiveTab('asesmen')}
          className={\`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap \${
            activeTab === 'asesmen' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }\`}
        >
          <FileText className="w-4 h-4" /> Asesmen & Pemetaan
        </button>`
);

fs.writeFileSync('src/components/CounselorPanel.tsx', code);
