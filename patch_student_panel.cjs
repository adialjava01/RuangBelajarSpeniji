const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

// Imports
code = code.replace(
  "NeedsAssessment, Sociometry, ClassItem } from '../types';",
  "NeedsAssessment, Sociometry, ClassItem, CareerPlan } from '../types';"
);

code = code.replace(
  "MessageSquare, Users} from 'lucide-react';",
  "MessageSquare, Users, Briefcase} from 'lucide-react';"
);

// Props
code = code.replace(
  "onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;\n",
  "onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;\n  careerPlans?: CareerPlan[];\n  onAddCareerPlan?: (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => void;\n  onUpdateCareerPlan?: (id: string, updates: Partial<CareerPlan>) => void;\n"
);

// Destructuring
code = code.replace(
  "onAddSociometry,\n",
  "onAddSociometry,\n  careerPlans = [],\n  onAddCareerPlan,\n  onUpdateCareerPlan,\n"
);

// Add state for editing career plan
const careerState = `
  const [showKarirForm, setShowKarirForm] = useState(false);
  const myCareerPlan = careerPlans.find(cp => cp.studentNis === currentStudent.nis);
  const [karirInterests, setKarirInterests] = useState<string>('');
  const [karirStrengths, setKarirStrengths] = useState<string>('');
  const [karirTarget, setKarirTarget] = useState<string>('');

  useEffect(() => {
    if (showKarirForm) {
      setKarirInterests(myCareerPlan?.interests.join(', ') || '');
      setKarirStrengths(myCareerPlan?.strengths.join(', ') || '');
      setKarirTarget(myCareerPlan?.targetCareer || '');
    }
  }, [showKarirForm, myCareerPlan]);
`;

code = code.replace("const [selectedFriends, setSelectedFriends] = useState<string[]>([]);", "const [selectedFriends, setSelectedFriends] = useState<string[]>([]);\n" + careerState);

// Add button in Layanan BK Lainnya
const karirBtnHtml = `
              <button onClick={() => setShowKarirForm(true)} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <Briefcase className="w-8 h-8 text-amber-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Karir & Peminatan</span>
                <span className="text-xs text-slate-500">Rencanakan cita-cita & minatmu</span>
              </button>
`;

code = code.replace(
  /<button onClick=\{\(\) => setShowSosiometriForm\(true\)\} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">[\s\S]*?<\/button>/,
  `$&
${karirBtnHtml}`
);

// Add Karir Form Modal
const modalHtml = `
      {/* Modal Karir & Peminatan */}
      {showKarirForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <h2 className="text-xl font-black text-amber-900 flex items-center gap-2">
                <Briefcase className="w-6 h-6" /> Perencanaan Karir
              </h2>
              <button onClick={() => setShowKarirForm(false)} className="p-2 hover:bg-amber-100 rounded-full text-amber-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cita-cita / Target Karir</label>
                <input type="text" value={karirTarget} onChange={e => setKarirTarget(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Cth: Dokter, Programmer, Pengusaha" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Minat / Hobi (Pisahkan dengan koma)</label>
                <textarea value={karirInterests} onChange={e => setKarirInterests(e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Cth: Membaca, Melukis, Olahraga..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kelebihan / Kekuatan Diri (Pisahkan dengan koma)</label>
                <textarea value={karirStrengths} onChange={e => setKarirStrengths(e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Cth: Teliti, Public Speaking, Matematika..."></textarea>
              </div>
              
              {myCareerPlan?.counselorNotes && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm font-bold text-amber-800 mb-1">Saran / Catatan Guru BK:</p>
                  <p className="text-sm text-amber-900">{myCareerPlan.counselorNotes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto">
              <button onClick={() => setShowKarirForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">
                Batal
              </button>
              <button 
                onClick={() => {
                  const dataToSave = {
                    studentNis: currentStudent.nis,
                    studentName: currentStudent.name,
                    className: currentStudent.className || 'Unknown',
                    targetCareer: karirTarget,
                    interests: karirInterests.split(',').map(s => s.trim()).filter(s => s),
                    strengths: karirStrengths.split(',').map(s => s.trim()).filter(s => s),
                  };
                  if (myCareerPlan && onUpdateCareerPlan) {
                    onUpdateCareerPlan(myCareerPlan.id, dataToSave);
                    toast.success('Rencana Karir Diperbarui!');
                  } else if (onAddCareerPlan) {
                    onAddCareerPlan(dataToSave);
                    toast.success('Rencana Karir Disimpan!');
                  }
                  setShowKarirForm(false);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition"
              >
                Simpan Karir
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("return (", "return (\n    <>");
code = code.replace("    </div>\n  );\n}", "    </div>\n" + modalHtml + "\n    </>\n  );\n}");

fs.writeFileSync('src/components/StudentPanel.tsx', code);
