import React, { useState } from 'react';
import { 
  Users, Calendar, CheckCircle, Clock, AlertTriangle, 
  MessageSquare, UserPlus, Filter, Search, FileText, Home, Heart, X, Briefcase, Download, Map as MapIcon, Plus, Trash2, MapPin, BarChart2
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Legend, Bar } from 'recharts';
import { 
  CounselingReferral, CounselingSession, Student, ClassItem, Teacher, DailyCheckIn, NeedsAssessment, Sociometry, HomeVisit, CareerPlan
} from '../types';

interface CounselorPanelProps {
  activeUser?: any;
  dailyCheckIns?: DailyCheckIn[];
  needsAssessments?: NeedsAssessment[];
  sociometries?: Sociometry[];
  homeVisits?: HomeVisit[];
  careerPlans?: CareerPlan[];
  onAddHomeVisit?: (visit: Omit<HomeVisit, 'id' | 'createdAt'>) => void;
  onUpdateHomeVisit?: (id: string, updates: Partial<HomeVisit>) => void;
  onAddCareerPlan?: (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => void;
  onUpdateCareerPlan?: (id: string, updates: Partial<CareerPlan>) => void;
  referrals: CounselingReferral[];
  sessions: CounselingSession[];
  students: Student[];
  classes: ClassItem[];
  teachers: Teacher[];
  onUpdateReferral: (id: string, status: 'Diproses' | 'Selesai') => void;
  onSaveSession: (session: Omit<CounselingSession, 'id'>) => void;
}

export default function CounselorPanel({
  activeUser,
  dailyCheckIns = [],
  needsAssessments = [],
  sociometries = [],
  homeVisits = [],
  careerPlans = [],
  onAddHomeVisit,
  onUpdateHomeVisit,
  onAddCareerPlan,
  onUpdateCareerPlan,
  referrals,
  sessions,
  students,
  classes,
  teachers,
  onUpdateReferral,
  onSaveSession
}: CounselorPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'tren' | 'rujukan' | 'sesi' | 'abk' | 'homevisit' | 'karir'>('dashboard');
  
  // Sesi Form State
  const [showAddSession, setShowAddSession] = useState(false);
  const [selectedStudentNis, setSelectedStudentNis] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [actionTaken, setActionTaken] = useState('Konseling Individu');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isABK, setIsABK] = useState(false);
  const [abkNotes, setAbkNotes] = useState('');
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  const [showAddHomeVisit, setShowAddHomeVisit] = useState(false);
  const [hvStudentNis, setHvStudentNis] = useState('');
  const [hvDate, setHvDate] = useState('');
  const [hvPurpose, setHvPurpose] = useState('');
  const [hvParentName, setHvParentName] = useState('');
  
  // State for Karir
  const [showKarirForm, setShowKarirForm] = useState(false);
  const [karirStudentNis, setKarirStudentNis] = useState('');
  const [karirNotes, setKarirNotes] = useState('');

  const [selectedCounselorFilter, setSelectedCounselorFilter] = useState<string>('Semua');
  const [showAKPDResults, setShowAKPDResults] = useState(false);
  const [akmFilter, setAkmFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [akmClassFilter, setAkmClassFilter] = useState<string>('all');
  const [selectedAKPD, setSelectedAKPD] = useState<NeedsAssessment | null>(null);
  const [showSociometryResults, setShowSociometryResults] = useState(false);
  const [selectedClassForSociometry, setSelectedClassForSociometry] = useState<string | null>(null);

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentNis || !sessionDate || !actionTaken) return;

    const student = students.find(s => s.nis === selectedStudentNis);
    if (!student) return;
    
    const className = classes.find(c => c.id === student.classId)?.name || 'N/A';

    onSaveSession({
      referralId: selectedReferralId || undefined,
      studentNis: student.nis,
      studentName: student.name,
      className: className,
      date: sessionDate,
      counselorName: activeUser?.name || 'Guru BK',
      notes: sessionNotes,
      actionTaken: actionTaken,
      isABK: isABK,
      abkNotes: isABK ? abkNotes : undefined,
      status: 'Selesai'
    });

    if (selectedReferralId) {
      onUpdateReferral(selectedReferralId, 'Selesai');
    }

    setShowAddSession(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedStudentNis('');
    setSessionDate('');
    setActionTaken('Konseling Individu');
    setSessionNotes('');
    setIsABK(false);
    setAbkNotes('');
    setSelectedReferralId(null);
  };

  const handleProcessReferral = (referral: CounselingReferral) => {
    onUpdateReferral(referral.id, 'Diproses');
    setSelectedStudentNis(referral.studentNis);
    setSelectedReferralId(referral.id);
    setActiveTab('sesi');
    setShowAddSession(true);
  };


  const uniqueGrades = Array.from(new Set(classes.map(c => {
    const parts = c.name.split(/[-\s]/);
    return parts[0];
  }))).sort((a, b) => {
    const gradeOrder: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
    return (gradeOrder[a] || 99) - (gradeOrder[b] || 99);
  });

  const handleDownloadAKMReport = () => {
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

      const escapeCSV = (str) => `"${(str || '').replace(/"/g, '""')}"`;

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

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_AKM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const radarData = [
    { subject: 'Pribadi/Keluarga', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q1||0) + (b.q2||0) + (b.q3||0) + (b.q4||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
    { subject: 'Sosial', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q5||0) + (b.q6||0) + (b.q7||0) + (b.q8||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
    { subject: 'Belajar/Akademik', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q9||0) + (b.q10||0) + (b.q11||0) + (b.q12||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
    { subject: 'Karir', A: needsAssessments.length > 0 ? Number((needsAssessments.reduce((a, b) => a + ((b.q13||0) + (b.q14||0) + (b.q15||0) + (b.q16||0)), 0) / needsAssessments.length).toFixed(2)) : 0, fullMark: 12 },
  ];
  return (
    <>
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
            <Heart className="w-8 h-8 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Ruang Bimbingan & Konseling
            </h1>
            <p className="text-teal-100 font-medium mt-1">Pantau rujukan, sesi konseling, dan pendampingan ABK.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'dashboard' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Home className="w-4 h-4" /> Dashboard Utama
        </button>
        <button
          onClick={() => setActiveTab('asesmen')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'asesmen' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Asesmen & Pemetaan
        </button>
        <button
          onClick={() => setActiveTab('tren')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'tren' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Analisis Tren
        </button>
        <button
          onClick={() => setActiveTab('rujukan')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'rujukan' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Rujukan Guru Mapel
          {referrals.filter(r => r.status === 'Menunggu').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
              {referrals.filter(r => r.status === 'Menunggu').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sesi')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'sesi' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Sesi Konseling & Log
        </button>
        <button
          onClick={() => setActiveTab('abk')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'abk' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Data ABK / Khusus
        </button>
      </div>

      
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Status Murid SMPN 1 BEJI</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Mood Dominan Hari Ini</h3>
                <div className="text-3xl font-black text-teal-600 flex items-center gap-2">
                  <Heart className="w-8 h-8 text-rose-500" /> Senang
                </div>
                <p className="text-xs text-slate-500 mt-2">Berdasarkan {dailyCheckIns.length} entri jurnal</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Rujukan Aktif</h3>
                <div className="text-3xl font-black text-amber-600">
                  {referrals.filter(r => r.status === 'Menunggu' || r.status === 'Diproses').length}
                </div>
                <p className="text-xs text-slate-500 mt-2">Menunggu tindak lanjut</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Peringatan Dini</h3>
                <div className="text-3xl font-black text-rose-600">
                  {referrals.filter(r => r.priority === 'Tinggi').length}
                </div>
                <p className="text-xs text-slate-500 mt-2">Siswa butuh perhatian khusus segera</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Peta Sebaran Kasus Rujukan</h3>
              <div className="space-y-4">
                {(() => {
                  if (referrals.length === 0) return <div className="text-slate-500 text-sm">Belum ada rujukan kasus.</div>;
                  const counts: Record<string, number> = {};
                  referrals.forEach(r => { counts[r.issueCategory] = (counts[r.issueCategory] || 0) + 1; });
                  const total = referrals.length;
                  const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
                  const colors = ['bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-purple-500', 'bg-indigo-500'];
                  
                  return categories.map((cat, i) => {
                    const pct = Math.round((counts[cat] / total) * 100);
                    return (
                      <div key={cat} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-semibold text-slate-600 truncate" title={cat}>{cat}</div>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                          <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="w-12 text-right text-sm font-bold text-slate-700">{pct}%</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'asesmen' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Asesmen Kebutuhan Murid (AKM)</h2>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Status Pengisian AKM</h3>
                <p className="text-sm text-slate-500 mt-1">{needsAssessments.length} dari {students.length} siswa telah mengisi</p>
              </div>
              <button onClick={() => setShowAKPDResults(true)} className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition shadow-sm">
                Lihat Hasil AKM
              </button>
            </div>

            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 mb-6 text-center">Sebaran Rata-rata Skor AKM Siswa</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 12]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Radar name="Skor Rata-rata" dataKey="A" stroke="#0d9488" strokeWidth={2} fill="#14b8a6" fillOpacity={0.4} />
                    <Tooltip 
                      formatter={(value) => [`${value} / 12`, 'Skor']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-black text-slate-900 mb-4">Sosiometri Kelas</h2>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedGrade(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedGrade === null ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Semua Jenjang
                </button>
                {uniqueGrades.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedGrade === grade ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Kelas {grade}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from<ClassItem>(new Map(classes.map(c => [c.name, c])).values())
                  .filter(c => selectedGrade === null || c.name.startsWith(selectedGrade + '-') || c.name.startsWith(selectedGrade + ' '))
                  .sort((a, b) => {
                    const [gradeA, classA] = a.name.split('-');
                    const [gradeB, classB] = b.name.split('-');
                    const gradeOrder: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
                    const orderA = gradeOrder[gradeA] || 99;
                    const orderB = gradeOrder[gradeB] || 99;
                    
                    if (orderA !== orderB) {
                      return orderA - orderB;
                    }
                    
                    if (classA && classB) {
                      return classA.localeCompare(classB);
                    }
                    return a.name.localeCompare(b.name);
                  })
                  .map(c => {
                    const matchingClassIds = classes.filter(cls => cls.name === c.name).map(cls => cls.id);
                    return (
                      <div key={c.name} onClick={() => { setSelectedClassForSociometry(c.name); setShowSociometryResults(true); }} className="border border-slate-200 p-4 rounded-2xl hover:border-teal-300 transition cursor-pointer bg-white group shadow-sm hover:shadow-md">
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-teal-700 transition">{c.name}</h4>
                        <p className="text-sm font-medium text-slate-500 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                          {sociometries.filter(s => matchingClassIds.includes(s.classId)).length} Entri Sosiometri
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tren' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Analisis Tren AKM Antarkelas</h2>
            <p className="text-sm text-slate-500 mb-6">Perbandingan rata-rata skor asesmen kebutuhan murid (Pribadi, Sosial, Belajar, Karir) pada masing-masing kelas.</p>
            
            {needsAssessments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                Belum ada data asesmen murid.
              </div>
            ) : (
              <div className="h-[500px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const classAverages = classes.map(c => {
                        const studentsInClass = students.filter(s => s.classId === c.id);
                        const nisInClass = studentsInClass.map(s => s.nis);
                        const classAkpd = needsAssessments.filter(a => nisInClass.includes(a.studentNis));
                        
                        if (classAkpd.length === 0) {
                          return null;
                        }
                        
                        const avgPribadi = classAkpd.reduce((sum, b) => sum + ((b.q1||0) + (b.q2||0) + (b.q3||0) + (b.q4||0)), 0) / classAkpd.length;
                        const avgSosial = classAkpd.reduce((sum, b) => sum + ((b.q5||0) + (b.q6||0) + (b.q7||0) + (b.q8||0)), 0) / classAkpd.length;
                        const avgBelajar = classAkpd.reduce((sum, b) => sum + ((b.q9||0) + (b.q10||0) + (b.q11||0) + (b.q12||0)), 0) / classAkpd.length;
                        const avgKarir = classAkpd.reduce((sum, b) => sum + ((b.q13||0) + (b.q14||0) + (b.q15||0) + (b.q16||0)), 0) / classAkpd.length;
                        
                        return {
                          name: c.name,
                          Pribadi: Number(avgPribadi.toFixed(2)),
                          Sosial: Number(avgSosial.toFixed(2)),
                          Belajar: Number(avgBelajar.toFixed(2)),
                          Karir: Number(avgKarir.toFixed(2))
                        };
                      }).filter(item => item !== null) as {name: string, Pribadi: number, Sosial: number, Belajar: number, Karir: number}[];
                      
                      return classAverages.sort((a, b) => a.name.localeCompare(b.name));
                    })()}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 12]} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Pribadi" name="Pribadi/Keluarga" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sosial" name="Sosial" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Belajar" name="Belajar/Akademik" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Karir" name="Karir" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'rujukan' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Daftar Rujukan Masalah Siswa</h2>
            
            {referrals.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada rujukan masalah dari guru mata pelajaran.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map((ref) => {
                  const teacherName = teachers.find(t => t.id === ref.teacherId)?.name || 'Guru';
                  return (
                    <div key={ref.id} className="border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition bg-white shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            ref.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700' :
                            ref.priority === 'Sedang' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            Prioritas {ref.priority}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-lg mt-2">{ref.studentName}</h4>
                          <p className="text-xs text-slate-500 font-medium">{ref.studentNis} • Kelas {ref.className}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          ref.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ref.status === 'Diproses' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {ref.status}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">Kategori: {ref.issueCategory}</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{ref.issueDetails}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <UserPlus className="w-3.5 h-3.5" /> Dilaporkan oleh: <strong>{teacherName}</strong>
                        </div>
                        {ref.status === 'Menunggu' && (
                          <button
                            onClick={() => handleProcessReferral(ref)}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition"
                          >
                            Tindak Lanjuti
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sesi' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Log Sesi Konseling</h2>
              <button 
                onClick={() => { resetForm(); setShowAddSession(true); }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2 px-4 rounded-xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Catat Sesi Baru
              </button>
            </div>

            {showAddSession && (
              <form onSubmit={handleSaveSession} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 space-y-4">
                <h3 className="font-bold text-slate-800">Form Catatan Konseling</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Siswa</label>
                    <select
                      value={selectedStudentNis}
                      onChange={(e) => setSelectedStudentNis(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {students.map(s => (
                        <option key={s.nis} value={s.nis}>{s.name} ({s.nis})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Tindakan</label>
                    <select
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    >
                      <option>Konseling Individu</option>
                      <option>Konseling Kelompok</option>
                      <option>Home Visit</option>
                      <option>Pemanggilan Orang Tua</option>
                      <option>Rujukan Ahli</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Catatan / Hasil Konseling</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    placeholder="Hasil pertemuan, komitmen siswa, dll..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isABK"
                    checked={isABK}
                    onChange={(e) => setIsABK(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="isABK" className="text-sm font-semibold text-slate-700">Tandai sebagai Anak Berkebutuhan Khusus / Perhatian Khusus</label>
                </div>

                {isABK && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Catatan Khusus ABK</label>
                    <input
                      type="text"
                      value={abkNotes}
                      onChange={(e) => setAbkNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      placeholder="Diagnosa medis, gaya belajar spesifik..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setShowAddSession(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg transition">Batal</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition">Simpan Sesi</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-500 font-medium">Belum ada sesi konseling yang tercatat.</p>
                </div>
              ) : (
                sessions.filter(s => selectedCounselorFilter === "Semua" || s.counselorName === selectedCounselorFilter).map(session => (
                  <div key={session.id} className="border border-slate-200 rounded-xl p-4 flex gap-4 items-start bg-white hover:border-teal-300 transition shadow-xs">
                    <div className={`p-3 rounded-xl shrink-0 ${session.actionTaken === 'Home Visit' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                      {session.actionTaken === 'Home Visit' ? <Home className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900">{session.studentName} <span className="text-slate-500 font-normal text-sm">({session.className})</span></h4>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(session.date).toLocaleDateString('id-ID')}
                            <span className="mx-2">•</span>
                            <span className="font-bold text-slate-700">{session.actionTaken}</span>
                            <span className="text-slate-400">&bull;</span>
                            <span>Oleh: <span className="font-medium text-slate-600">{session.counselorName}</span></span>
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">{session.notes}</p>
                      {session.isABK && (
                        <div className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded inline-flex border border-rose-100">
                          Catatan ABK: {session.abkNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      
      {/* KARIR & PEMINATAN */}
      {activeTab === 'karir' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-amber-500" /> Peminatan & Perencanaan Karir</h2>
              <button onClick={() => setShowKarirForm(true)} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition flex items-center gap-2 text-sm shadow-sm">
                <Plus className="w-4 h-4" /> Catatan Karir Baru
              </button>
            </div>
            
            {careerPlans.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Briefcase className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada data perencanaan karir siswa.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {careerPlans.map(plan => {
                  const student = students.find(s => s.nis === plan.studentNis);
                  return (
                    <div key={plan.id} className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800">{student?.name || plan.studentName}</h3>
                          <p className="text-sm text-slate-500">{plan.studentNis} • Kelas {student ? classes.find(c => c.id === student.classId)?.name : plan.className}</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">Peminatan</span>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Karir / Cita-cita</p>
                          <p className="text-sm font-medium text-slate-800">{plan.targetCareer || '-'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Minat (Interests)</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.interests && plan.interests.length > 0 ? plan.interests.map(i => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{i}</span>
                              )) : <span className="text-xs text-slate-400">-</span>}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kekuatan (Strengths)</p>
                            <div className="flex flex-wrap gap-1">
                              {plan.strengths && plan.strengths.length > 0 ? plan.strengths.map(s => (
                                <span key={s} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-md">{s}</span>
                              )) : <span className="text-xs text-slate-400">-</span>}
                            </div>
                          </div>
                        </div>
                        {plan.counselorNotes && (
                          <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <p className="text-xs font-bold text-amber-800 mb-1">Catatan Konselor</p>
                            <p className="text-sm text-amber-900">{plan.counselorNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KUNJUNGAN RUMAH */}
      {activeTab === 'homevisit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><MapIcon className="w-6 h-6 text-orange-500" /> Log Kunjungan Rumah (Home Visit)</h2>
              <button onClick={() => setShowAddHomeVisit(true)} className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex items-center gap-2 text-sm shadow-sm">
                <Plus className="w-4 h-4" /> Jadwalkan Kunjungan
              </button>
            </div>
            
            {homeVisits.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <MapIcon className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada riwayat atau rencana kunjungan rumah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeVisits.map(visit => {
                  const student = students.find(s => s.nis === visit.studentNis);
                  return (
                    <div key={visit.id} className="border border-slate-200 rounded-2xl p-5 hover:border-orange-300 transition bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-slate-800">{student?.name || visit.studentName}</h3>
                            <p className="text-sm text-slate-500">{visit.studentNis} • Kelas {student ? classes.find(c => c.id === student.classId)?.name : visit.className}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${visit.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {visit.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex gap-2 text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>{new Date(visit.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="flex gap-2 text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>Bertemu Orang Tua/Wali: <span className="font-medium text-slate-800">{visit.parentName}</span></span>
                          </div>
                          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tujuan</p>
                            <p className="text-slate-700">{visit.purpose}</p>
                          </div>
                          {visit.status === 'Selesai' && visit.visitResult && (
                            <div className="mt-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-800 mb-1">Hasil & Tindak Lanjut</p>
                              <p className="text-emerald-900">{visit.visitResult}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {visit.status === 'Direncanakan' && onUpdateHomeVisit && (
                        <button 
                          onClick={() => {
                            const res = window.prompt('Masukkan hasil kunjungan / kesepakatan dengan orang tua:');
                            if (res) {
                              onUpdateHomeVisit(visit.id, { status: 'Selesai', visitResult: res });
                            }
                          }}
                          className="mt-4 w-full py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl transition text-sm"
                        >
                          Tandai Selesai & Isi Hasil
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'abk' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Pemantauan ABK / Perhatian Khusus</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessions.filter(s => s.isABK).map(abkSession => (
                <div key={abkSession.id} className="border-2 border-rose-100 bg-rose-50/30 rounded-2xl p-5 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-lg">{abkSession.studentName}</h4>
                  <p className="text-xs text-slate-500">{abkSession.className}</p>
                  <div className="mt-3 bg-white p-3 rounded-xl border border-rose-100 text-sm font-medium text-rose-800">
                    {abkSession.abkNotes || "Tanpa catatan spesifik"}
                  </div>
                </div>
              ))}
              {sessions.filter(s => s.isABK).length === 0 && (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  Belum ada siswa yang ditandai sebagai ABK.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Hasil AKPD */}
      
      {/* Modal Hasil Sosiometri */}
      {showSociometryResults && selectedClassForSociometry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h2 className="text-xl font-black text-rose-900">Hasil Pemetaan Sosiometri</h2>
                <p className="text-sm text-rose-700 mt-1">Kelas {selectedClassForSociometry}</p>
              </div>
              <button onClick={() => setShowSociometryResults(false)} className="p-2 hover:bg-rose-100 rounded-full text-rose-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {(() => {
                const matchingClassIds = classes.filter(cls => cls.name === selectedClassForSociometry).map(cls => cls.id);
                const classSociometries = sociometries.filter(s => matchingClassIds.includes(s.classId));
                
                if (classSociometries.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Belum ada entri sosiometri dari siswa di kelas ini.
                    </div>
                  );
                }

                // Calculate most chosen friends
                const choicesCount: Record<string, number> = {};
                classSociometries.forEach(s => {
                  s.friendsWith.forEach(friendNis => {
                    choicesCount[friendNis] = (choicesCount[friendNis] || 0) + 1;
                  });
                });

                const sortedChoices = Object.entries(choicesCount).sort((a, b) => b[1] - a[1]);

                return (
                  <div className="space-y-6">
                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <h3 className="font-bold text-rose-800 mb-2">Siswa Paling Sering Dipilih</h3>
                      <div className="space-y-2 mt-3">
                        {sortedChoices.map(([nis, count], idx) => {
                          const student = students.find(st => st.nis === nis);
                          return (
                            <div key={nis} className="flex justify-between items-center bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-rose-50 text-rose-600'}`}>
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-slate-800">{student?.name || nis}</span>
                              </div>
                              <span className="text-sm font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-md">{count} Pilihan</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-slate-800 mb-3">Daftar Pemilih</h3>
                      <div className="space-y-3">
                        {classSociometries.map(soc => {
                          const student = students.find(st => st.nis === soc.studentNis);
                          const friendsNames = soc.friendsWith.map(fn => students.find(st => st.nis === fn)?.name || fn);
                          return (
                            <div key={soc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <div className="font-medium text-slate-800 mb-1">{student?.name || soc.studentNis}</div>
                              <div className="text-sm text-slate-600">
                                Memilih: <span className="font-medium">{friendsNames.join(', ')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
              <button onClick={() => setShowSociometryResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


      {showAKPDResults && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50">
              <div>
                <h2 className="text-xl font-black text-teal-900">Hasil Pemetaan AKM</h2>
                <p className="text-sm text-teal-700 mt-1">Data Kebutuhan Peserta Didik Berdasarkan Asesmen</p>
              </div>
              <button onClick={() => setShowAKPDResults(false)} className="p-2 hover:bg-teal-100 rounded-full text-teal-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {needsAssessments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                  Belum ada siswa yang mengisi form AKM.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="text-blue-800 text-sm font-bold">Rata-rata Akademik</div>
                      <div className="text-2xl font-black text-blue-600 mt-1">
                        {needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + ((b.q9||0) + (b.q10||0) + (b.q11||0) + (b.q12||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="text-emerald-800 text-sm font-bold">Rata-rata Sosial</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">
                        {needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + ((b.q5||0) + (b.q6||0) + (b.q7||0) + (b.q8||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <div className="text-amber-800 text-sm font-bold">Rata-rata Keluarga</div>
                      <div className="text-2xl font-black text-amber-600 mt-1">
                        {needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + ((b.q1||0) + (b.q2||0) + (b.q3||0) + (b.q4||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <div className="text-purple-800 text-sm font-bold">Rata-rata Karir</div>
                      <div className="text-2xl font-black text-purple-600 mt-1">
                        {needsAssessments.length > 0 ? (needsAssessments.reduce((a, b) => a + ((b.q13||0) + (b.q14||0) + (b.q15||0) + (b.q16||0)), 0) / needsAssessments.length).toFixed(1) : "0.0"} <span className="text-sm font-normal">/ 12</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex gap-2">
                      <select 
                        value={akmClassFilter}
                        onChange={(e) => setAkmClassFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">Semua Kelas</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select 
                        value={akmFilter}
                        onChange={(e) => setAkmFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">Semua Status</option>
                        <option value="done">Sudah Mengisi</option>
                        <option value="pending">Belum Mengisi</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Nama Siswa</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Akademik</th>
                          <th className="px-4 py-3 text-center">Sosial</th>
                          <th className="px-4 py-3 text-center">Keluarga</th>
                          <th className="px-4 py-3 text-center">Karir</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter(s => akmClassFilter === 'all' || s.classId === akmClassFilter)
                          .filter(s => {
                            const hasDone = needsAssessments.some(a => a.studentNis === s.nis);
                            if (akmFilter === 'done') return hasDone;
                            if (akmFilter === 'pending') return !hasDone;
                            return true;
                          })
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(student => {
                            const akpd = needsAssessments.find(a => a.studentNis === student.nis);
                            const className = classes.find(c => c.id === student.classId)?.name || '-';
                            return (
                              <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800">{student.name}</div>
                                  <div className="text-xs text-slate-500">{className}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {akpd ? (
                                    <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 font-bold text-xs inline-flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Sudah
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Belum
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q9||0) + (akpd.q10||0) + (akpd.q11||0) + (akpd.q12||0);
                                    return <span className={`px-2 py-1 rounded ${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q5||0) + (akpd.q6||0) + (akpd.q7||0) + (akpd.q8||0);
                                    return <span className={`px-2 py-1 rounded ${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q1||0) + (akpd.q2||0) + (akpd.q3||0) + (akpd.q4||0);
                                    return <span className={`px-2 py-1 rounded ${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-medium">
                                  {akpd ? (() => {
                                    const score = (akpd.q13||0) + (akpd.q14||0) + (akpd.q15||0) + (akpd.q16||0);
                                    return <span className={`px-2 py-1 rounded ${score >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`} title="Semakin tinggi skor, semakin butuh bantuan">{score}</span>;
                                  })() : <span className="text-slate-300">-</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {akpd ? (
                                    <button onClick={() => setSelectedAKPD(akpd)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">Detail Esai</button>
                                  ) : (
                                    <span className="text-slate-300 text-xs italic">Menunggu...</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={handleDownloadAKMReport} className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> Unduh Laporan (CSV)
              </button>
              <button onClick={() => setShowAKPDResults(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-sm">
                Tutup
              </button>
            </div>

            {selectedAKPD && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <h2 className="text-lg font-black text-indigo-900">Detail Esai AKM</h2>
                    <button onClick={() => setSelectedAKPD(null)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Kondisi Emosi</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essayEmotion || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Hubungan Sosial</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essaySocial || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Target Belajar</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essayAcademic || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Cita-Cita Awal</h4>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {selectedAKPD.essayCareer || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>

      {/* Modal Karir */}
      {showKarirForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <h2 className="text-xl font-black text-amber-900 flex items-center gap-2"><Briefcase className="w-6 h-6" /> Tambah Catatan Karir</h2>
              <button onClick={() => setShowKarirForm(false)} className="p-2 hover:bg-amber-100 rounded-full text-amber-700 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select value={karirStudentNis} onChange={e => setKarirStudentNis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => <option key={s.id} value={s.nis}>{s.name} ({s.nis})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Konselor (Saran Karir, Hasil Tes Psikologi, dll)</label>
                <textarea value={karirNotes} onChange={e => setKarirNotes(e.target.value)} rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Misal: Cocok di bidang teknik atau seni..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowKarirForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">Batal</button>
              <button 
                onClick={() => {
                  if(!karirStudentNis || !onAddCareerPlan) return;
                  const st = students.find(s => s.nis === karirStudentNis);
                  if(!st) return;
                  onAddCareerPlan({
                    studentNis: st.nis,
                    studentName: st.name,
                    className: classes.find(c => c.id === st.classId)?.name || 'Unknown',
                    interests: [],
                    strengths: [],
                    targetCareer: 'Belum ditentukan',
                    counselorNotes: karirNotes
                  });
                  setShowKarirForm(false);
                  setKarirStudentNis('');
                  setKarirNotes('');
                }}
                disabled={!karirStudentNis}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition shadow-md"
              >
                Simpan Catatan Karir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Home Visit */}
      {showAddHomeVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50">
              <h2 className="text-xl font-black text-orange-900 flex items-center gap-2"><MapIcon className="w-6 h-6" /> Jadwalkan Kunjungan Rumah</h2>
              <button onClick={() => setShowAddHomeVisit(false)} className="p-2 hover:bg-orange-100 rounded-full text-orange-700 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select value={hvStudentNis} onChange={e => setHvStudentNis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => <option key={s.id} value={s.nis}>{s.name} ({s.nis})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Kunjungan</label>
                <input type="date" value={hvDate} onChange={e => setHvDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Orang Tua / Wali yang Ditemui</label>
                <input type="text" value={hvParentName} onChange={e => setHvParentName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Cth: Bpk. Budi / Ibu Siti" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tujuan Kunjungan</label>
                <textarea value={hvPurpose} onChange={e => setHvPurpose(e.target.value)} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Cth: Mendiskusikan tingkat kehadiran siswa..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAddHomeVisit(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">Batal</button>
              <button 
                onClick={() => {
                  if(!hvStudentNis || !hvDate || !hvPurpose || !onAddHomeVisit) return;
                  const st = students.find(s => s.nis === hvStudentNis);
                  if(!st) return;
                  onAddHomeVisit({
                    studentNis: st.nis,
                    studentName: st.name,
                    className: classes.find(c => c.id === st.classId)?.name || 'Unknown',
                    date: hvDate,
                    counselorName: activeUser?.name || 'Guru BK',
                    purpose: hvPurpose,
                    parentName: hvParentName,
                    visitResult: '',
                    followUp: '',
                    status: 'Direncanakan'
                  });
                  setShowAddHomeVisit(false);
                  setHvStudentNis('');
                  setHvDate('');
                  setHvPurpose('');
                  setHvParentName('');
                }}
                disabled={!hvStudentNis || !hvDate || !hvPurpose}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition shadow-md"
              >
                Jadwalkan Kunjungan
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

