const fs = require('fs');
let code = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');

const useEffectCode = `
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const alreadyCheckedIn = dailyCheckIns.some(c => c.studentNis === currentStudent.nis && c.date.startsWith(today));
    setHasCheckedIn(alreadyCheckedIn);
  }, [dailyCheckIns, currentStudent.nis]);

  const [isSubmitting, setIsSubmitting] = useState(false);
`;

code = code.replace(
  "const [hasCheckedIn, setHasCheckedIn] = useState(false);",
  "const [hasCheckedIn, setHasCheckedIn] = useState(false);\n" + useEffectCode
);

const handleCheckInCode = `
  const handleCheckIn = () => {
    if (dailyNote.trim().length < 10) {
      toast.error('Mohon ceritakan sedikit alasanmu (minimal 10 karakter) agar Guru BK bisa memahamimu dengan baik.');
      return;
    }
    
    if (window.confirm('Apakah kamu yakin ingin mengirim jurnal ini? Data tidak bisa diubah setelah dikirim.')) {
      setIsSubmitting(true);
      if (onAddDailyCheckIn) {
        onAddDailyCheckIn({ studentNis: currentStudent.nis, date: new Date().toISOString(), mood: dailyMood, note: dailyNote.trim() });
        setHasCheckedIn(true);
        toast.success('Jurnal berhasil dikirim!');
      }
      setIsSubmitting(false);
    }
  };
`;

code = code.replace(
  /const handleCheckIn = \(\) => \{[\s\S]*?\};\n/,
  handleCheckInCode + "\n"
);

code = code.replace(
  'placeholder="Ada hal yang ingin kamu ceritakan? (Opsional, rahasia dijamin)"',
  'placeholder="Kenapa kamu merasa demikian hari ini? Ceritakan sedikit alasanmu (wajib, min 10 karakter)..."'
);

code = code.replace(
  '<button\n                  onClick={handleCheckIn}\n                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-md w-full"\n                >\n                  Kirim Jurnal Harian\n                </button>',
  '<button\n                  onClick={handleCheckIn}\n                  disabled={isSubmitting || dailyNote.trim().length < 10}\n                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md w-full"\n                >\n                  Kirim Jurnal Harian\n                </button>'
);

fs.writeFileSync('src/components/StudentPanel.tsx', code);
