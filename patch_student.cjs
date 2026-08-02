const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

code = code.replace(
  'Student, Material, Exam, CheatLog, ExamSubmission, Teacher, SubjectItem, TeacherAnnouncement',
  'Student, Material, Exam, CheatLog, ExamSubmission, Teacher, SubjectItem, TeacherAnnouncement, DailyCheckIn, NeedsAssessment, Sociometry, ClassItem'
);

code = code.replace(
  'interface StudentPanelProps {',
  `interface StudentPanelProps {
  dailyCheckIns?: DailyCheckIn[];
  onAddDailyCheckIn?: (checkIn: Omit<DailyCheckIn, 'id' | 'createdAt'>) => void;
  onAddNeedsAssessment?: (assessment: Omit<NeedsAssessment, 'id' | 'createdAt'>) => void;
  onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;
  classes?: ClassItem[];
  students?: Student[];`
);

code = code.replace(
  'export default function StudentPanel({',
  `export default function StudentPanel({
  dailyCheckIns = [],
  onAddDailyCheckIn,
  onAddNeedsAssessment,
  onAddSociometry,
  classes = [],
  students = [],`
);

code = code.replace(
  "const [activeTab, setActiveTab] = useState<'beranda' | 'materi' | 'ujian' | 'history'>('beranda');",
  "const [activeTab, setActiveTab] = useState<'beranda' | 'materi' | 'ujian' | 'history' | 'bk'>('beranda');\n  const [dailyMood, setDailyMood] = useState<'Senang' | 'Biasa' | 'Sedih' | 'Marah' | 'Takut' | 'Lelah'>('Senang');\n  const [dailyNote, setDailyNote] = useState('');\n  const [hasCheckedIn, setHasCheckedIn] = useState(false);\n  \n  const handleCheckIn = () => {\n    if (onAddDailyCheckIn) {\n      onAddDailyCheckIn({ studentNis: currentStudent.nis, date: new Date().toISOString(), mood: dailyMood, note: dailyNote });\n      setHasCheckedIn(true);\n    }\n  };"
);

code = code.replace(
  '<button\n          onClick={() => setActiveTab(\'materi\')}',
  `<button
          onClick={() => setActiveTab('bk')}
          className={\`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap \${
            activeTab === 'bk' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }\`}
        >
          <Heart className="w-5 h-5" /> Ruang BK
        </button>
        <button
          onClick={() => setActiveTab('materi')}`
);

const bkContent = `
      {activeTab === 'bk' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Heart className="w-6 h-6 text-rose-500" /> Jurnal Emosional Harian</h2>
            {hasCheckedIn ? (
              <div className="bg-teal-50 text-teal-800 p-6 rounded-2xl border border-teal-100 text-center">
                <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">Terima Kasih!</h3>
                <p className="text-sm">Kamu sudah mengisi jurnal emosional hari ini. Semoga harimu menyenangkan!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-medium">Bagaimana perasaanmu hari ini? Ceritakan sedikit jika kamu mau.</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {['Senang', 'Biasa', 'Sedih', 'Marah', 'Takut', 'Lelah'].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setDailyMood(mood as any)}
                      className={\`py-3 px-2 rounded-xl border-2 transition font-bold text-sm \${dailyMood === mood ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}\`}
                    >
                      {mood === 'Senang' ? '😊' : mood === 'Biasa' ? '😐' : mood === 'Sedih' ? '😢' : mood === 'Marah' ? '😠' : mood === 'Takut' ? '😨' : '😫'}<br/>
                      <span className="mt-1 block">{mood}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <textarea
                    value={dailyNote}
                    onChange={e => setDailyNote(e.target.value)}
                    placeholder="Ada hal yang ingin kamu ceritakan? (Opsional, rahasia dijamin)"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  onClick={handleCheckIn}
                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-md w-full"
                >
                  Kirim Jurnal Harian
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Layanan BK Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <FileText className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Isi Asesmen Kebutuhan (AKPD)</span>
                <span className="text-xs text-slate-500">Bantu kami memahami kebutuhanmu di sekolah</span>
              </button>
              <button className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <MessageSquare className="w-8 h-8 text-rose-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Jadwalkan Konseling</span>
                <span className="text-xs text-slate-500">Temui Guru BK untuk curhat atau diskusi</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{activeTab === 'beranda' && (",
  bkContent + "\n      {activeTab === 'beranda' && ("
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
