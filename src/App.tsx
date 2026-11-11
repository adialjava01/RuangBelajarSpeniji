import toast, { Toaster } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { 
  Teacher, Student, ClassItem, SubjectItem, Material, JournalEntry, Exam, CheatLog, ExamSubmission, TeacherAnnouncement, RegistrationRequest, SchoolConfig, QuestionBank, ShareRequest, GlobalAnnouncement, TeacherScheduleNote, TeachingModule, ManualAssessment, CounselingReferral, CounselingSession, StudentCounselingRequest
, DailyCheckIn, NeedsAssessment, Sociometry, HomeVisit, CareerPlan, AssignmentFolder, AssignmentSubmission, LivePresentationSession } from './types';
import AdminPanel from './components/AdminPanel';
import TeacherPanel from './components/TeacherPanel';
import StudentPanel from './components/StudentPanel';
import CounselorPanel from './components/CounselorPanel';
import GasScriptHub from './components/GasScriptHub';
import { syncCollection, addDocument, deleteDocument, updateDocument, syncConfig, saveConfig } from './firebaseSync';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  Database, UserCheck, BookOpen, GraduationCap, ShieldAlert, Award, FileCode, CheckCircle2, ChevronRight, LogIn, UserPlus, Clock, CheckCircle, XCircle
} from 'lucide-react';

const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  logoUrl: 'https://smpn1beji.sch.id/wp-content/uploads/2025/05/favico.png',
  headerAppName: 'E-LEARNING & JURNAL',
  headerSubtitle: 'SMPN 1 BEJI, Kab. Pasuruan',
  landingTopTag: 'Jurnal Mengajar dan E-Learning',
  landingTitle: 'Sistem Manajemen Mengajar & E-Learning SMPN 1 BEJI',
  landingDescription: 'Aplikasi Komprehensif untuk membantu Guru dan Siswa dalam Pembelajaran dan Materi serta Ujian/Tugas & Evaluasi.',
  footerText: '© 2026 E-Learning/E-Jurnal SMPN 1 BEJI, Kab. Pasuruan.',
  adminPassword: 'admin123',
  principalName: 'Yayuk Sudarwati, S.Pd., M.Pd.',
  principalNip: '197002071997032005',
  kopHeader1: 'PEMERINTAH KABUPATEN PASURUAN',
  kopHeader2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  schoolName: 'SMP NEGERI 1 BEJI',
  schoolAddress: 'Jl. Raya Beji No. 123, Pasuruan, Jawa Timur',
  schoolPhone: '(0343) 656123',
  schoolEmail: 'info@smpn1beji.sch.id',
  schoolWebsite: 'smpn1beji.sch.id',
  cityLocation: 'Pasuruan',
  counselorName: 'Dra. Siti Rahmah, M.Pd.',
  counselorNip: '197505122003122001',
  kopModel: 'Standard'
};

// === INITIAL SEED DATA ===
const SEED_CLASSES: ClassItem[] = [
  { id: 'class-1', name: 'VII-A' },
  { id: 'class-2', name: 'VIII-B' },
  { id: 'class-3', name: 'IX-C' }
];

const SEED_SUBJECTS: SubjectItem[] = [
  { id: 'subj-1', name: 'Informatika' },
  { id: 'subj-2', name: 'IPA (Sains)' },
  { id: 'subj-3', name: 'Bahasa Indonesia' },
  { id: 'subj-4', name: 'Bahasa Inggris' },
  { id: 'subj-5', name: 'Matematika' }
];

const SEED_TEACHERS: Teacher[] = [
  { 
    id: 't-1', 
    name: 'Adi Candra Wirawan, S.Kom.', 
    nip: '198211212024211006', 
    email: 'adi.candra@smp.sch.id', 
    subject: 'Informatika', 
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
    password: 'guru123',
    isAdmin: true
  },
  { 
    id: 't-2', 
    name: 'Siti Rahmawati, S.Pd.', 
    nip: '199108152018022003', 
    email: 'siti.rahma@smp.sch.id', 
    subject: 'IPA (Sains)', 
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop' 
  },
  { 
    id: 't-3', 
    name: 'Eko Prasetyo, S.Hum.', 
    nip: '198801242015031001', 
    email: 'eko.prasetyo@smp.sch.id', 
    subject: 'Bahasa Indonesia', 
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop' 
  }
];

const SEED_STUDENTS: Student[] = [
  { id: 's-1', nis: '10241', name: 'Aditya Pratama', email: 'aditya@smp.sch.id', classId: 'class-1' },
  { id: 's-2', nis: '10242', name: 'Budi Santoso', email: 'budi@smp.sch.id', classId: 'class-1' },
  { id: 's-3', nis: '10243', name: 'Citra Lestari', email: 'citra@smp.sch.id', classId: 'class-1' },
  { id: 's-4', nis: '20241', name: 'Dewi Safitri', email: 'dewi@smp.sch.id', classId: 'class-2' },
  { id: 's-5', nis: '20242', name: 'Fajar Nugraha', email: 'fajar@smp.sch.id', classId: 'class-2' },
  { id: 's-6', nis: '20243', name: 'Gita Amanda', email: 'gita@smp.sch.id', classId: 'class-2' },
  { id: 's-7', nis: '30241', name: 'Hendra Wijaya', email: 'hendra@smp.sch.id', classId: 'class-3' },
  { id: 's-8', nis: '30242', name: 'Indah Permata', email: 'indah@smp.sch.id', classId: 'class-3' },
  { id: 's-9', nis: '30243', name: 'Kevin Sanjaya', email: 'kevin@smp.sch.id', classId: 'class-3' }
];

const SEED_MATERIALS: Material[] = [
  {
    id: 'm-1',
    title: 'Pengenalan Perangkat Keras dan Jaringan Komputer - Pertemuan 1',
    classId: 'class-1',
    subjectId: 'subj-1',
    fileType: 'PDF',
    fileUrl: 'https://drive.google.com/file/d/simulated_informatika_pdf/view',
    status: 'Aktif',
    teacherId: 't-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm-2',
    title: 'Video Pembelajaran: Proses Fotosintesis & Klorofil',
    classId: 'class-2',
    subjectId: 'subj-2',
    fileType: 'Video',
    fileUrl: 'https://drive.google.com/file/d/simulated_photosynthesis_video/view',
    status: 'Aktif',
    teacherId: 't-2',
    createdAt: new Date().toISOString()
  }
];

const SEED_EXAMS: Exam[] = [
  {
    id: 'ex-1',
    title: 'Ujian Evaluasi Informatika & Literasi Digital - VII-A',
    classId: 'class-1',
    subjectId: 'subj-1',
    token: 'INFO7',
    durationMinutes: 20,
    createdAt: new Date().toISOString(),
    teacherId: 't-1',
    questions: [
      {
        id: 'q-1',
        questionText: 'Komponen perangkat keras yang berfungsi sebagai otak utama pemroses data dalam sistem komputer adalah...',
        type: 'PilihanGanda',
        options: ['Hard Disk Drive (HDD)', 'Random Access Memory (RAM)', 'Central Processing Unit (CPU)', 'Power Supply Unit (PSU)'],
        correctAnswer: 'C'
      },
      {
        id: 'q-2',
        questionText: 'Manakah dari perangkat berikut yang termasuk dalam kategori perangkat masukan (input device)?',
        type: 'PilihanGandaKompleks',
        options: ['Keyboard', 'Monitor', 'Mouse', 'Speaker'],
        correctAnswers: ['Keyboard', 'Mouse']
      },
      {
        id: 'q-3',
        questionText: 'Perhatikan pernyataan tentang jaringan komputer & internet berikut:\n(1) Local Area Network (LAN) menghubungkan komputer di lingkungan terbatas seperti Lab Sekolah\n(2) RAM berfungsi menyimpan file data secara permanen saat komputer mati\n(3) IP Address merupakan alamat unik untuk mengidentifikasi perangkat di jaringan\n(4) Browser adalah salah satu jenis perangkat keras komputer\n\nManakah pernyataan yang benar?',
        type: 'PilihanAsosiatif',
        statements: [
          '(1) Local Area Network (LAN) menghubungkan komputer di lingkungan terbatas seperti Lab Sekolah',
          '(2) RAM berfungsi menyimpan file data secara permanen saat komputer mati',
          '(3) IP Address merupakan alamat unik untuk mengidentifikasi perangkat di jaringan',
          '(4) Browser adalah salah satu jenis perangkat keras komputer'
        ],
        correctCombination: [1, 3]
      },
      {
        id: 'q-4',
        questionText: 'Penerapan kata sandi yang kuat dan autentikasi multi-faktor sangat penting dalam perlindungan identitas digital.\nSEBAB\nKata sandi yang mudah ditebak sangat berisiko terhadap serangan brute force dan pembobolan akun.',
        type: 'SebabAkibat',
        statement: 'Penerapan kata sandi yang kuat dan autentikasi multi-faktor sangat penting dalam perlindungan identitas digital.',
        reason: 'Kata sandi yang mudah ditebak sangat berisiko terhadap serangan brute force dan pembobolan akun.',
        correctStatementTrue: true,
        correctReasonTrue: true,
        correctCausality: true
      }
    ]
  }
];

const SEED_JOURNALS: JournalEntry[] = [
  {
    id: 'j-1',
    date: new Date().toISOString().split('T')[0],
    classId: 'class-1',
    subjectId: 'subj-1',
    teacherId: 't-1',
    topic: 'Pengenalan Algoritma dan Berpikir Komputasional',
    learningObjectives: 'Siswa dapat memahami konsep berpikir komputasional dan dekomposisi masalah dalam algoritma sederhana.',
    notes: 'Siswa sangat aktif berdiskusi dan antusias dalam mempraktikkan diagram alir (flowchart).',
    startPeriod: 2,
    endPeriod: 4,
    attendance: [
      { studentId: 's-1', status: 'Hadir' },
      { studentId: 's-2', status: 'Hadir' },
      { studentId: 's-3', status: 'Sakit' }
    ]
  },
  {
    id: 'j-2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    classId: 'class-1',
    subjectId: 'subj-1',
    teacherId: 't-1',
    topic: 'Jaringan Komputer Lokal (LAN) dan Penggunaan Internet Sehat',
    learningObjectives: 'Siswa mampu mengidentifikasi topologi jaringan serta menerapkan etika berinternet secara aman.',
    notes: 'Praktik koneksi jaringan lokal berjalan tertib dan kondusif.',
    startPeriod: 5,
    endPeriod: 6,
    attendance: [
      { studentId: 's-1', status: 'Hadir' },
      { studentId: 's-2', status: 'Hadir' },
      { studentId: 's-3', status: 'Hadir' }
    ]
  }
];

const SEED_ANNOUNCEMENTS: TeacherAnnouncement[] = [
  {
    id: 'ann-1',
    teacherId: 't-1',
    teacherName: 'Adi Candra Wirawan, S.Kom.',
    teacherSubject: 'Informatika',
    targetType: 'all',
    title: '📢 Persiapan Praktik Komputer & Evaluasi Materi Informatika',
    content: 'Selamat datang siswa/i semua! Dimohon kepada seluruh siswa untuk mempelajari kembali materi Informatika di menu E-Learning. Evaluasi harian akan dilaksanakan via CBT online!',
    priority: 'penting',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'ann-2',
    teacherId: 't-1',
    teacherName: 'Adi Candra Wirawan, S.Kom.',
    teacherSubject: 'Informatika',
    targetType: 'class',
    targetClassName: 'VII-A',
    title: '💡 Tugas Kelompok Algoritma Pemrograman Kelas VII-A',
    content: 'Khusus siswa kelas VII-A, harap menyelesaikan lembar kerja studi kasus algoritma sebelum jam pelajaran berakhir. Bagi yang mengalami kendala dapat bertanya langsung melalui panel kelas.',
    priority: 'normal',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isActive: true
  },
  {
    id: 'ann-3',
    teacherId: 't-2',
    teacherName: 'Siti Rahmawati, S.Pd.',
    teacherSubject: 'IPA (Sains)',
    targetType: 'all',
    title: '🔬 Praktikum Biologi: Pengamatan Klorofil & Fotosintesis',
    content: 'Diberitahukan kepada seluruh siswa untuk membawa buku catatan praktikum dan jas laboratorium pada pertemuan IPA berikutnya. Jangan lupa menonton video pembelajaran fotosintesis di menu E-Learning!',
    priority: 'penting',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isActive: true
  }
];

const SEED_REGISTRATIONS: RegistrationRequest[] = [
  {
    id: 'reg-1',
    role: 'Teacher',
    name: 'Rina Wulandari, S.Pd.',
    identifier: '199005142018012001',
    passwordOrEmail: 'guru123',
    subjectOrClass: 'Bahasa Indonesia',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'reg-2',
    role: 'Student',
    name: 'Bagus Setyawan',
    identifier: '10255',
    passwordOrEmail: 'bagus@smp.sch.id',
    subjectOrClass: 'VII-B',
    status: 'Pending',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

export default function App() {
  useEffect(() => {
    document.title = 'Ruang Belajar SPENIJI';
  }, []);

  // Navigation State
  const [activeMode, setActiveMode] = useState<'app' | 'gas'>('app');
  
  // Authentication Role State
  const [currentRole, setCurrentRole] = useState<'Guest' | 'Admin' | 'Teacher' | 'Student' | 'Counselor'>('Guest');
  const [activeUser, setActiveUser] = useState<any>(null);

  // Database States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [teachingModules, setTeachingModules] = useState<TeachingModule[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [cheatLogs, setCheatLogs] = useState<CheatLog[]>([]);
  const [counselingReferrals, setCounselingReferrals] = useState<CounselingReferral[]>([]);
  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [studentCounselingRequests, setStudentCounselingRequests] = useState<StudentCounselingRequest[]>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<DailyCheckIn[]>([]);
  const [needsAssessments, setNeedsAssessments] = useState<NeedsAssessment[]>([]);
  const [sociometries, setSociometries] = useState<Sociometry[]>([]);
  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>([]);
  const [careerPlans, setCareerPlans] = useState<CareerPlan[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [manualAssessments, setManualAssessments] = useState<ManualAssessment[]>([]);
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [globalAnnouncements, setGlobalAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(DEFAULT_SCHOOL_CONFIG);
  const [scheduleNotes, setScheduleNotes] = useState<TeacherScheduleNote[]>([]);
  const [assignmentFolders, setAssignmentFolders] = useState<AssignmentFolder[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [livePresentation, setLivePresentation] = useState<LivePresentationSession | undefined>(undefined);
  const [livePresentations, setLivePresentations] = useState<LivePresentationSession[]>([]);

  const sortedClasses = [...classes].sort((a, b) => {
    const getGradeLevel = (name: string) => {
      const cleanName = name.replace(/^Kelas\s+/i, '').trim();
      const match = cleanName.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I|12|11|10|9|8|7|6|5|4|3|2|1)[-_\s]?(.*)$/i);
      if (!match) return { level: 99, rest: cleanName };
      const gradeStr = match[1].toUpperCase();
      let level = 99;
      if (gradeStr === 'VII' || gradeStr === '7') level = 7;
      else if (gradeStr === 'VIII' || gradeStr === '8') level = 8;
      else if (gradeStr === 'IX' || gradeStr === '9') level = 9;
      else if (gradeStr === 'X' || gradeStr === '10') level = 10;
      else if (gradeStr === 'XI' || gradeStr === '11') level = 11;
      else if (gradeStr === 'XII' || gradeStr === '12') level = 12;
      return { level, rest: match[2] || cleanName };
    };

    const gA = getGradeLevel(a.name);
    const gB = getGradeLevel(b.name);

    if (gA.level !== gB.level) return gA.level - gB.level;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Portal Tab & Registration Form states
  const [portalTab, setPortalTab] = useState<'login' | 'register'>('login');
  const [regRole, setRegRole] = useState<'Teacher' | 'Student'>('Teacher');
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSubjectOrClass, setRegSubjectOrClass] = useState('Matematika');

  // Manual Credentials inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Load and seed DB on mount
  useEffect(() => {
    const unsubTeachers = syncCollection('teachers', setTeachers, SEED_TEACHERS);
    const unsubStudents = syncCollection('students', setStudents, SEED_STUDENTS);
    const unsubClasses = syncCollection('classes', setClasses, SEED_CLASSES);
    const unsubSubjects = syncCollection('subjects', setSubjects, SEED_SUBJECTS);
    const unsubMaterials = syncCollection('materials', setMaterials, SEED_MATERIALS);
    const unsubTeachingModules = syncCollection('teachingModules', setTeachingModules, []);
    const unsubExams = syncCollection('exams', setExams, SEED_EXAMS);
    const unsubQuestionBanks = syncCollection('questionBanks', setQuestionBanks, []);
    const unsubJournals = syncCollection('journals', setJournals, SEED_JOURNALS);
    const unsubCheatLogs = syncCollection('cheatLogs', setCheatLogs, []);
    const unsubCounselingReferrals = syncCollection('counselingReferrals', setCounselingReferrals, []);
    const unsubCounselingSessions = syncCollection('counselingSessions', setCounselingSessions, []);
    const unsubStudentCounselingRequests = syncCollection('studentCounselingRequests', setStudentCounselingRequests, []);
    const unsubDailyCheckIns = syncCollection('dailyCheckIns', setDailyCheckIns, []);
    const unsubNeedsAssessments = syncCollection('needsAssessments', setNeedsAssessments, []);
    const unsubSociometries = syncCollection('sociometries', setSociometries, []);
    const unsubHomeVisits = syncCollection('homeVisits', setHomeVisits, []);
    const unsubCareerPlans = syncCollection('careerPlans', setCareerPlans, []);
    const unsubScheduleNotes = syncCollection('scheduleNotes', setScheduleNotes, []);
    const unsubSubmissions = syncCollection('submissions', setSubmissions, []);
    const unsubManualAssessments = syncCollection('manualAssessments', setManualAssessments, []);
    const unsubAnnouncements = syncCollection('announcements', setAnnouncements, SEED_ANNOUNCEMENTS);
    const unsubRegistrations = syncCollection('registrations', setRegistrations, SEED_REGISTRATIONS);
    const unsubShareRequests = syncCollection('shareRequests', setShareRequests, []);
    const unsubGlobalAnnouncements = syncCollection('globalAnnouncements', setGlobalAnnouncements, []);
    const unsubAssignmentFolders = syncCollection('assignmentFolders', setAssignmentFolders, []);
    const unsubAssignmentSubmissions = syncCollection('assignmentSubmissions', setAssignmentSubmissions, []);
    const unsubSchoolConfig = syncConfig('schoolConfig', setSchoolConfig, DEFAULT_SCHOOL_CONFIG);
    const unsubLivePresentation = syncConfig<LivePresentationSession | undefined>('livePresentation', setLivePresentation, undefined);
    const unsubLivePresentations = syncCollection('livePresentations', setLivePresentations, []);

    return () => {
      unsubLivePresentations();
      unsubLivePresentation();
      unsubAssignmentFolders();
      unsubAssignmentSubmissions();
      unsubScheduleNotes();
      unsubTeachers();
      unsubStudents();
      unsubClasses();
      unsubSubjects();
      unsubMaterials();
      unsubTeachingModules();
      unsubExams();
      unsubQuestionBanks();
      unsubJournals();
      unsubCheatLogs();
      unsubCounselingReferrals();
      unsubCounselingSessions();
      unsubStudentCounselingRequests();
      unsubDailyCheckIns();
      unsubNeedsAssessments();
      unsubSociometries();
      unsubHomeVisits();
      unsubCareerPlans();
      if(unsubManualAssessments) unsubManualAssessments();
      unsubSubmissions();
      unsubAnnouncements();
      unsubRegistrations();
      unsubShareRequests();
      unsubGlobalAnnouncements();
      unsubSchoolConfig();
    };
  }, []);

  // Auto-migration & Database consistency for Adi Candra Wirawan, S.Kom. (NIP 198211212024211006 - Informatika)
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      const bambangTeacher = teachers.find(t => 
        (t.name && t.name.toLowerCase().includes('bambang')) || 
        t.nip === '198503122011011002'
      );
      if (bambangTeacher) {
        updateDocument('teachers', {
          id: bambangTeacher.id,
          name: 'Adi Candra Wirawan, S.Kom.',
          nip: '198211212024211006',
          email: 'adi.candra@smp.sch.id',
          subject: 'Informatika',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
          password: 'guru123',
          isAdmin: true
        });
      } else if (!teachers.some(t => t.nip === '198211212024211006')) {
        addDocument('teachers', {
          id: 't-1',
          name: 'Adi Candra Wirawan, S.Kom.',
          nip: '198211212024211006',
          email: 'adi.candra@smp.sch.id',
          subject: 'Informatika',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
          password: 'guru123',
          isAdmin: true
        });
      }
    }

    if (announcements && announcements.length > 0) {
      announcements.forEach(ann => {
        if (ann.teacherName && ann.teacherName.toLowerCase().includes('bambang')) {
          updateDocument('announcements', {
            id: ann.id,
            teacherName: 'Adi Candra Wirawan, S.Kom.',
            teacherSubject: 'Informatika'
          });
        }
      });
    }

    if (subjects && subjects.length > 0 && !subjects.some(s => s.name.toLowerCase() === 'informatika')) {
      addDocument('subjects', {
        id: 'subj-info',
        name: 'Informatika'
      });
    }
  }, [teachers, announcements, subjects]);

  // --- DB OPERATIONAL PERSISTENCE HELPERS ---
  const saveSchoolConfigState = (updated: SchoolConfig) => {
    saveConfig('schoolConfig', updated);
  };

  const handleUpdateLivePresentation = (session: LivePresentationSession) => {
    if (!session) return;
    const teacherId = session.teacherId || 'unknown_teacher';
    const docId = session.id || teacherId;
    const sessionWithId = { ...session, id: docId, teacherId, updatedAt: Date.now() };

    setLivePresentation(sessionWithId);
    saveConfig('livePresentation', sessionWithId);

    if (!session.active) {
      deleteDocument('livePresentations', docId);
    } else {
      updateDocument('livePresentations', sessionWithId);
    }
  };

  const handleRegisterAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regIdentifier.trim() || !regPassword.trim()) return;

    // Check existing
    if (regRole === 'Teacher' && teachers.some(t => t.nip === regIdentifier.trim())) {
      toast('NIP sudah terdaftar di sistem!');
      return;
    }
    if (regRole === 'Student' && students.some(s => s.nis === regIdentifier.trim())) {
      toast('NIS sudah terdaftar di sistem!');
      return;
    }

    const newReg: RegistrationRequest = {
      id: `reg_${Math.random().toString(36).substring(7)}`,
      role: regRole,
      name: regName.trim(),
      identifier: regIdentifier.trim(),
      passwordOrEmail: regPassword.trim(),
      subjectOrClass: regSubjectOrClass,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    addDocument('registrations', newReg);
    toast('Permohonan pendaftaran akun Anda berhasil dikirim! Silakan menunggu persetujuan Admin Sekolah sebelum dapat masuk ke portal.');
    setRegName('');
    setRegIdentifier('');
    setRegPassword('');
    setPortalTab('login');
  };

  const handleApproveRegistration = (id: string, asAdmin: boolean = false) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;
    if (reg.role === 'Teacher') {
      handleAddTeacher({
        name: reg.name,
        nip: reg.identifier,
        email: reg.passwordOrEmail.includes('@') ? reg.passwordOrEmail : `${reg.identifier}@smp.sch.id`,
        password: reg.passwordOrEmail,
        subject: reg.subjectOrClass,
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        isAdmin: asAdmin || reg.isAdmin || false
      });
    } else {
      const classObj = classes.find(c => c.name === reg.subjectOrClass) || classes[0];
      handleAddStudent({
        name: reg.name,
        nis: reg.identifier,
        email: reg.passwordOrEmail.includes('@') ? reg.passwordOrEmail : `${reg.identifier}@siswa.smp.sch.id`,
        password: reg.passwordOrEmail,
        classId: classObj ? classObj.id : 'class-1'
      });
    }
    updateDocument('registrations', { id, status: 'Approved', isAdmin: asAdmin || reg.isAdmin || false } as any);
    toast.success(`Pendaftaran akun ${reg.name} berhasil disetujui!${asAdmin ? ' (Diaktifkan Hak Akses Admin)' : ''}`);
  };

  const handleToggleTeacherAdmin = (teacherId: string) => {
    const t = teachers.find(item => item.id === teacherId);
    if (!t) return;
    const newIsAdmin = !t.isAdmin;
    updateDocument('teachers', { id: teacherId, isAdmin: newIsAdmin } as any);
    toast.success(`Hak Akses Admin untuk ${t.name} berhasil ${newIsAdmin ? 'DIBERIKAN' : 'DICABUT'}.`);
  };

  const handleRejectRegistration = (id: string) => {
    updateDocument('registrations', { id, status: 'Rejected' } as any);
  };

  const handleDeleteRegistration = (id: string) => {
    deleteDocument('registrations', id);
  };

  // --- ACTIONS HANDLERS ---
  const handleAddStudent = (newSiswa: Omit<Student, 'id'>) => {
    const studentNode: Student = {
      ...newSiswa,
      id: `std_${Math.random().toString(36).substring(7)}`
    };
    addDocument('students', studentNode);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    updateDocument('students', updatedStudent);
  };

  const handleBulkAddStudents = (newStudentsList: Omit<Student, 'id'>[]) => {
    newStudentsList.forEach(item => {
      addDocument('students', {
        ...item,
        id: `std_${Math.random().toString(36).substring(7)}_${Math.random().toString(36).substring(7)}`
      });
    });
  };

  const handleDeleteStudent = (id: string) => {
    deleteDocument('students', id);
  };

  const handleAddClass = (className: string) => {
    const trimmed = className.trim();
    if (!trimmed) return;
    const exists = classes.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    const newClassNode: ClassItem = {
      id: `class_${Math.random().toString(36).substring(7)}`,
      name: trimmed
    };
    addDocument('classes', newClassNode);
  };

  const handleDeleteClass = (id: string) => {
    deleteDocument('classes', id);
  };

  const handleUpdateClass = (updatedClass: ClassItem) => {
    updateDocument('classes', updatedClass);
  };


  const handleAddGlobalAnnouncement = (ann: Omit<GlobalAnnouncement, 'id' | 'createdAt'>) => {
    addDocument('globalAnnouncements', {
      ...ann,
      id: `gann_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString()
    });
  };

  const handleDeleteGlobalAnnouncement = (id: string) => {
    deleteDocument('globalAnnouncements', id);
  };

  const handleAddSubject = (subjectName: string) => {
    const trimmed = subjectName.trim();
    if (!trimmed) return;
    const exists = subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    const newSubjectNode: SubjectItem = {
      id: `subj_${Math.random().toString(36).substring(7)}`,
      name: trimmed
    };
    addDocument('subjects', newSubjectNode);
  };

  const handleDeleteSubject = (id: string) => {
    deleteDocument('subjects', id);
  };

  const handleUpdateSubject = (updatedSubject: SubjectItem) => {
    updateDocument('subjects', updatedSubject);
  };

  const handleDeleteTeacher = (id: string) => {
    deleteDocument('teachers', id);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    updateDocument('teachers', updatedTeacher);
  };

  const handleAddTeacher = (newTeacher: Omit<Teacher, 'id'>) => {
    const teacherNode: Teacher = {
      ...newTeacher,
      id: `t_${Math.random().toString(36).substring(7)}`
    };
    addDocument('teachers', teacherNode);
  };

  const handleSaveMaterial = (newMat: Omit<Material, 'id' | 'createdAt'>) => {
    const matNode: Material = {
      ...newMat,
      id: `m_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString()
    };
    addDocument('materials', matNode);
  };

  const handleUpdateMaterial = (updatedMat: Material) => {
    updateDocument('materials', updatedMat);
  };


  const handleToggleMaterial = (id: string, currentStatus: 'Aktif' | 'Draft') => {
    updateDocument('materials', { id, status: currentStatus === 'Aktif' ? 'Draft' : 'Aktif' } as any);
  };

  
  const handleSaveTeachingModule = (newModule: Omit<TeachingModule, 'id'> | TeachingModule) => {
    const moduleNode: TeachingModule = {
      ...newModule,
      id: (newModule as TeachingModule).id || `tm_${Math.random().toString(36).substring(7)}`
    };
    addDocument('teachingModules', moduleNode);
  };

  const handleUpdateTeachingModule = (updatedModule: TeachingModule) => {
    updateDocument('teachingModules', updatedModule);
  };

  const handleDeleteTeachingModule = (moduleId: string) => {
    deleteDocument('teachingModules', moduleId);
  };

  const handleDeleteMaterial = (id: string) => {
    deleteDocument('materials', id);
  };

    const handleSaveSchedule = (newSched: Omit<TeacherScheduleNote, 'id'>) => {
    const schedNode: TeacherScheduleNote = {
      ...newSched,
      id: `sch_${Math.random().toString(36).substring(7)}`
    };
    addDocument('scheduleNotes', schedNode);
  };

  const handleUpdateSchedule = (updatedSched: TeacherScheduleNote) => {
    updateDocument('scheduleNotes', updatedSched);
  };

  const handleDeleteSchedule = (schedId: string) => {
    deleteDocument('scheduleNotes', schedId);
  };

  const handleSaveExam = (newExam: Omit<Exam, 'id' | 'createdAt'>) => {
    const examNode: Exam = {
      ...newExam,
      id: `ex_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString()
    };
    addDocument('exams', examNode);
  };

  const handleUpdateExam = (updatedExam: Exam) => {
    updateDocument('exams', updatedExam);
  };

  const handleDeleteExam = (examId: string) => {
    deleteDocument('exams', examId);
  };

  const handleSaveQuestionBank = (bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'> | QuestionBank) => {
    if ('id' in bank) {
      updateDocument('questionBanks', { ...bank, updatedAt: new Date().toISOString() } as any);
    } else {
      const newNode: QuestionBank = {
        ...bank,
        id: `qb_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addDocument('questionBanks', newNode);
    }
  };

  const handleDeleteQuestionBank = (id: string) => {
    deleteDocument('questionBanks', id);
  };

  const handleSaveManualAssessment = (assessment: Omit<ManualAssessment, 'id' | 'createdAt'>) => {
    const newAss: ManualAssessment = {
      ...assessment,
      id: `ma_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString()
    };
    addDocument('manualAssessments', newAss);
  };

  const handleUpdateManualAssessment = (updated: ManualAssessment) => {
    updateDocument('manualAssessments', updated);
  };

  const handleDeleteManualAssessment = (id: string) => {
    deleteDocument('manualAssessments', id);
  };

  const handleSaveJournal = (newEntry: Omit<JournalEntry, 'id'>) => {
    const entryNode: JournalEntry = {
      ...newEntry,
      id: `j_${Math.random().toString(36).substring(7)}`
    };
    addDocument('journals', entryNode);
  };

  const handleUpdateJournal = (updated: JournalEntry) => {
    updateDocument('journals', updated);
  };

  const handleDeleteJournal = (id: string) => {
    deleteDocument('journals', id);
  };

  const handleAddReferral = (ref: Omit<CounselingReferral, 'id' | 'createdAt'>) => { addDocument('counselingReferrals', { ...ref, id: `cr_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };
  const handleUpdateReferral = (updated: CounselingReferral) => { updateDocument('counselingReferrals', updated); };
  const handleDeleteReferral = (id: string) => { deleteDocument('counselingReferrals', id); };
  const handleSaveSession = (session: Omit<CounselingSession, 'id'>) => {
    const newSession = { ...session, id: `cs_${Math.random().toString(36).substring(7)}` };
    addDocument('counselingSessions', newSession);
    setCounselingSessions(prev => [newSession, ...prev]);
  };
  const handleUpdateSession = (id: string, updates: Partial<CounselingSession>) => {
    updateDocument('counselingSessions', { id, ...updates });
    setCounselingSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const handleDeleteSession = (id: string) => {
    deleteDocument('counselingSessions', id);
    setCounselingSessions(prev => prev.filter(s => s.id !== id));
  };
  const handleAddStudentCounselingRequest = (req: Omit<StudentCounselingRequest, 'id' | 'requestedAt'>) => { addDocument('studentCounselingRequests', { ...req, id: `scr_${Math.random().toString(36).substring(7)}`, requestedAt: Date.now() }); };
  const handleUpdateStudentCounselingRequest = (req: StudentCounselingRequest) => { updateDocument('studentCounselingRequests', req); };
  const handleDeleteStudentCounselingRequest = (id: string) => { deleteDocument('studentCounselingRequests', id); };
  const handleAddDailyCheckIn = (checkIn: Omit<DailyCheckIn, 'id' | 'createdAt'>) => { addDocument('dailyCheckIns', { ...checkIn, id: `dc_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };
  const handleAddNeedsAssessment = (assessment: Omit<NeedsAssessment, 'id' | 'createdAt'>) => { addDocument('needsAssessments', { ...assessment, id: `na_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };
  const handleAddSociometry = (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => { addDocument('sociometries', { ...sociometry, id: `soc_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() }); };
  const handleUpdateSociometry = (id: string, updates: Partial<Sociometry>) => { updateDocument('sociometries', { id, ...updates }); };
  const handleDeleteSociometry = (id: string) => { deleteDocument('sociometries', id); };
  const handleAddHomeVisit = (visit: Omit<HomeVisit, 'id' | 'createdAt'>) => {
    const newHv = { ...visit, id: `hv_${Math.random().toString(36).substring(7)}`, createdAt: new Date().toISOString() };
    addDocument('homeVisits', newHv);
    setHomeVisits(prev => [newHv, ...prev]);
  };
  const handleUpdateHomeVisit = (id: string, updates: Partial<HomeVisit>) => {
    updateDocument('homeVisits', { id, ...updates });
    setHomeVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };
  const handleDeleteHomeVisit = (id: string) => {
    deleteDocument('homeVisits', id);
    setHomeVisits(prev => prev.filter(v => v.id !== id));
  };
  const handleAddCareerPlan = (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => {
    const newCp = { ...plan, id: `cp_${Math.random().toString(36).substring(7)}`, updatedAt: new Date().toISOString() };
    addDocument('careerPlans', newCp);
    setCareerPlans(prev => [newCp, ...prev]);
  };
  const handleUpdateCareerPlan = (id: string, updates: Partial<CareerPlan>) => {
    updateDocument('careerPlans', { id, ...updates, updatedAt: new Date().toISOString() });
    setCareerPlans(prev => prev.map(cp => cp.id === id ? { ...cp, ...updates, updatedAt: new Date().toISOString() } : cp));
  };
  const handleDeleteCareerPlan = (id: string) => {
    deleteDocument('careerPlans', id);
    setCareerPlans(prev => prev.filter(cp => cp.id !== id));
  };

  const handleAddCheatLog = React.useCallback((log: Omit<CheatLog, 'id' | 'timestamp'>) => {
    const logNode: CheatLog = {
      ...log,
      id: `cl_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString()
    };
    addDocument('cheatLogs', logNode);
  }, []);

  const handleDeleteCheatLog = (id: string) => {
    deleteDocument('cheatLogs', id);
    toast.success('Log pelanggaran berhasil dihapus.');
  };

  const handleClearCheatLogsBatch = (ids: string[]) => {
    ids.forEach(id => deleteDocument('cheatLogs', id));
    toast.success(`${ids.length} log pelanggaran berhasil dibersihkan.`);
  };

  const handleSubmitExam = (sub: Omit<ExamSubmission, 'id' | 'submittedAt'>) => {
    const subNode: ExamSubmission = {
      ...sub,
      id: `sub_${Math.random().toString(36).substring(7)}`,
      submittedAt: new Date().toISOString()
    };
    addDocument('submissions', subNode);
  };

  const handleUpdateSubmission = (sub: ExamSubmission) => {
    updateDocument('submissions', sub);
  };

  const handleSaveAssignmentFolder = (folder: Omit<AssignmentFolder, 'id' | 'createdAt'>) => {
    const newFolder: AssignmentFolder = {
      ...folder,
      id: `af_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString()
    };
    addDocument('assignmentFolders', newFolder);
  };

  const handleUpdateAssignmentFolder = (folder: AssignmentFolder) => {
    updateDocument('assignmentFolders', folder);
  };

  const handleDeleteAssignmentFolder = (id: string) => {
    deleteDocument('assignmentFolders', id);
  };

  const handleSaveAssignmentSubmission = (sub: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) => {
    const newSub: AssignmentSubmission = {
      ...sub,
      id: `asub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      submittedAt: new Date().toISOString()
    };
    addDocument('assignmentSubmissions', newSub);
  };

  const handleUpdateAssignmentSubmission = (sub: AssignmentSubmission) => {
    updateDocument('assignmentSubmissions', sub);
  };

  const handleDeleteAssignmentSubmission = (id: string) => {
    deleteDocument('assignmentSubmissions', id);
  };

  const handleShareToTeacher = (request: Omit<ShareRequest, 'id' | 'createdAt'>) => {
    const newReq: ShareRequest = {
      ...request,
      id: `sr_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    addDocument('shareRequests', newReq);
  };

  const handleRespondShare = (requestId: string, response: 'Accepted' | 'Rejected') => {
    const req = shareRequests.find(r => r.id === requestId);
    if (req && req.status === 'Pending') {
      if (response === 'Accepted') {
        if (req.itemType === 'Material') {
          const mat = materials.find(m => m.id === req.itemId);
          if (mat) {
            const newMat = { ...mat, teacherId: req.receiverId, classId: [] };
            delete (newMat as any).id;
            delete (newMat as any).createdAt;
            handleSaveMaterial(newMat as any);
          }
        } else if (req.itemType === 'QuestionBank') {
          const qb = questionBanks.find(q => q.id === req.itemId);
          if (qb) {
            const newQb = { ...qb, teacherId: req.receiverId, updatedAt: new Date().toISOString() };
            delete (newQb as any).id;
            delete (newQb as any).createdAt;
            handleSaveQuestionBank(newQb as any);
          }
        } else if (req.itemType === 'TeachingModule') {
          const tm = teachingModules.find(t => t.id === req.itemId);
          if (tm) {
            // Function to deeply copy a folder and its contents
            const copyModule = (moduleId, parentId) => {
              const moduleToCopy = teachingModules.find(m => m.id === moduleId);
              if (!moduleToCopy) return;
              
              const newModuleId = `tm_${Math.random().toString(36).substring(7)}`;
              const newModule = { 
                ...moduleToCopy, 
                id: newModuleId,
                teacherId: req.receiverId, 
                parentId: parentId,
                createdAt: new Date().toISOString() 
              };
              addDocument('teachingModules', newModule);

              // If it's a folder, also copy all its children
              if (moduleToCopy.type === 'folder') {
                const children = teachingModules.filter(m => m.parentId === moduleId);
                children.forEach(child => {
                  copyModule(child.id, newModuleId);
                });
              }
            };
            
            copyModule(tm.id, null);
          }
        }
      }
      updateDocument('shareRequests', { id: requestId, status: response } as any);
    }
  };

  const handleDeleteShare = (requestId: string) => {
    deleteDocument('shareRequests', requestId);
  };

  const handleClearAllShares = (receiverId: string) => {
    const toDelete = shareRequests.filter(r => r.receiverId === receiverId);
    toDelete.forEach(r => deleteDocument('shareRequests', r.id));
  };

  const handleSaveAnnouncement = (newAnn: Omit<TeacherAnnouncement, 'id' | 'createdAt'>) => {
    const annNode: TeacherAnnouncement = {
      ...newAnn,
      id: `ann_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    addDocument('announcements', annNode);
  };

  const handleDeleteAnnouncement = (id: string) => {
    deleteDocument('announcements', id);
  };

  const handleToggleAnnouncement = (id: string) => {
    const ann = announcements.find(a => a.id === id);
    if (ann) {
      updateDocument('announcements', { id, isActive: !ann.isActive } as any);
    }
  };


  // --- USER AUTHENTICATION HANDLERS ---
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const identifier = usernameInput.trim();
    const pass = passwordInput.trim();

    if (!identifier || !pass) {
      setLoginError('Silakan masukkan Username / NIP / NIS dan Password.');
      return;
    }

    // 1. Admin Bypass (Local check)
    const expectedAdminPass = schoolConfig?.adminPassword || 'admin123';
    if ((identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@sekolah.id') && (pass === expectedAdminPass || pass === 'admin123')) {
      setCurrentRole('Admin');
      const adminTeacher = teachers.find(t => t.nip === '198211212024211006') || {
        id: 't-1',
        name: 'Adi Candra Wirawan, S.Kom.',
        username: 'admin',
        nip: '198211212024211006',
        email: 'adi.candra@smp.sch.id',
        subject: 'Informatika',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
        role: 'Admin',
        isAdmin: true
      };
      setActiveUser({ ...adminTeacher, isAdmin: true, role: 'Admin' });
      return;
    }

    // 2. Guru BK Default Bypass
    if ((identifier.toLowerCase() === 'guru_bk' || identifier.toLowerCase() === 'bk') && (pass === 'bk123' || pass === 'guru123')) {
      setCurrentRole('Counselor');
      setActiveUser({ name: 'Guru BK (Bimbingan Konseling)', username: 'guru_bk', role: 'Counselor' });
      return;
    }

    // 3. Local Teacher Database Check
    const matchedTeacher = teachers.find(t => 
      t.nip === identifier || 
      t.email.toLowerCase() === identifier.toLowerCase() || 
      t.name.toLowerCase() === identifier.toLowerCase()
    );
    if (matchedTeacher) {
      const expectedPass = matchedTeacher.password || 'guru123';
      if (pass === expectedPass || pass === matchedTeacher.nip || pass === matchedTeacher.email || pass === 'guru123' || pass === 'bk123' || pass === 'admin123') {
        const lowerSubject = (matchedTeacher.subject || '').toLowerCase();
        if (matchedTeacher.isAdmin) {
          setCurrentRole('Admin');
          setActiveUser(matchedTeacher);
          toast.success(`Selamat datang ${matchedTeacher.name}! Anda memiliki Hak Akses Administrator.`);
          return;
        } else if (lowerSubject.includes('bimbingan') || lowerSubject.includes('konseling') || lowerSubject === 'bk') {
          setCurrentRole('Counselor');
        } else {
          setCurrentRole('Teacher');
        }
        setActiveUser(matchedTeacher);
        return;
      }
    }

    // 4. Local Student Database Check
    const matchedStudent = students.find(s => 
      s.nis === identifier || 
      s.email.toLowerCase() === identifier.toLowerCase() || 
      s.name.toLowerCase() === identifier.toLowerCase()
    );
    if (matchedStudent) {
      const expectedPass = matchedStudent.password || matchedStudent.email || matchedStudent.nis;
      if (pass === expectedPass || pass === matchedStudent.nis || pass === '123456' || pass === matchedStudent.email) {
        setCurrentRole('Student');
        const className = classes.find(c => c.id === matchedStudent.classId)?.name || 'N/A';
        setActiveUser({ ...matchedStudent, className });
        return;
      }
    }

    // 5. Firebase Auth Fallback Check (Attempt only if needed, handle errors gracefully)
    try {
      const email = identifier.includes('@') ? identifier : `${identifier}@sekolah.id`;
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;

      if (email === 'admin@sekolah.id') {
        setCurrentRole('Admin');
        const adminTeacher = teachers.find(t => t.nip === '198211212024211006') || {
          id: 't-1',
          name: 'Adi Candra Wirawan, S.Kom.',
          username: 'admin',
          nip: '198211212024211006',
          email: fbUser.email,
          subject: 'Informatika',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
          role: 'Admin',
          isAdmin: true
        };
        setActiveUser({ ...adminTeacher, isAdmin: true, role: 'Admin' });
        return;
      }

      if (matchedTeacher) {
        const lowerSubject = (matchedTeacher.subject || '').toLowerCase();
        if (lowerSubject.includes('bimbingan') || lowerSubject.includes('konseling') || lowerSubject === 'bk') {
          setCurrentRole('Counselor');
        } else {
          setCurrentRole('Teacher');
        }
        setActiveUser(matchedTeacher);
        return;
      }

      if (matchedStudent) {
        setCurrentRole('Student');
        const className = classes.find(c => c.id === matchedStudent.classId)?.name || 'N/A';
        setActiveUser({ ...matchedStudent, className });
        return;
      }
    } catch (authErr: any) {
      // Catch all Firebase auth errors (operation-not-allowed, user-not-found, invalid-credential, etc) without crashing
      console.warn('Firebase Auth login attempt notice:', authErr?.code || authErr?.message);
    }

    setLoginError('Login gagal. Periksa Username / NIP / NIS dan Password Anda.');
  };

  const handleQuickLogin = (role: 'Admin' | 'Teacher' | 'Student', targetObj?: any) => {
    setLoginError('');
    if (role === 'Admin') {
      setCurrentRole('Admin');
      const adminTeacher = teachers.find(t => t.nip === '198211212024211006') || {
        id: 't-1',
        name: 'Adi Candra Wirawan, S.Kom.',
        username: 'admin',
        nip: '198211212024211006',
        email: 'adi.candra@smp.sch.id',
        subject: 'Informatika',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
        role: 'Admin',
        isAdmin: true
      };
      setActiveUser({ ...adminTeacher, isAdmin: true, role: 'Admin' });
    } else if (role === 'Teacher') {
      setCurrentRole('Teacher');
      const defaultTeacher = teachers.find(t => t.nip === '198211212024211006') || teachers[0];
      setActiveUser(targetObj || defaultTeacher);
    } else {
      setCurrentRole('Student');
      const student = targetObj || students[0];
      const className = classes.find(c => c.id === student.classId)?.name || 'N/A';
      setActiveUser({ ...student, className });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
    setCurrentRole('Guest');
    setActiveUser(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-[#fafafa] flex flex-col text-slate-800 antialiased font-sans">
      
      {/* APP HEADER */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center min-h-[4rem] gap-3 py-3">
            {/* Title logo */}
            <div className="flex items-center gap-3">
              {schoolConfig.logoUrl && schoolConfig.logoUrl !== 'https://smpn1beji.sch.id/wp-content/uploads/2025/05/logo_web_trans-1.png' ? (
                <img src={schoolConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <img src="https://smpn1beji.sch.id/wp-content/uploads/2025/05/favico.png" alt="Logo" className="w-10 h-10 object-contain" />
              )}
              <div>
                <h1 className="text-base font-extrabold tracking-tight uppercase">
                  {currentRole === 'Student' ? 'RUMAH BELAJAR SPENIJI' : schoolConfig.headerAppName}
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  {schoolConfig.headerSubtitle}
                </p>
              </div>
            </div>



            {/* User status badge */}
            {currentRole !== 'Guest' && (
              <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50 shadow-lg mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {activeUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block leading-none">
                      {currentRole === 'Teacher' ? 'Pengajar' : currentRole === 'Student' ? 'Siswa' : 'Admin Utama'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-100 block mt-0.5 max-w-[150px] truncate">
                      {activeUser?.name}
                    </span>
                  </div>
                </div>
                {activeUser?.isAdmin && (
                  <button
                    onClick={() => setCurrentRole(currentRole === 'Admin' ? 'Teacher' : 'Admin')}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-[10px] sm:text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    title="Tukar Tampilan Antara Mode Admin & Mode Guru"
                  >
                    <span>{currentRole === 'Admin' ? '🛡️ Admin' : '👨‍🏫 Guru'}</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 font-extrabold text-[10px] sm:text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* IF GAS SCRIPT TAB IS ACTIVE */}
        {activeMode === 'gas' && <GasScriptHub />}

        {/* IF APP SIMULATOR TAB IS ACTIVE */}
        {activeMode === 'app' && (
          <div className="space-y-8">
            
            {/* GUEST LANDING & LOGIN */}
            {currentRole === 'Guest' && (
              <div className="max-w-6xl mx-auto w-full">
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden flex flex-col lg:flex-row border border-slate-100">
                  
                  {/* Visual Intro (Left Side) */}
                  <div className="lg:w-3/5 p-8 lg:p-14 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-900 text-white relative overflow-hidden flex flex-col justify-center">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl"></div>
                    
                    <div className="relative z-10 space-y-8">
                      {/* Logo & Tag */}
                      <div className="flex items-center gap-4 bg-white/10 w-fit px-4 py-2.5 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                        {schoolConfig.logoUrl && schoolConfig.logoUrl !== 'https://smpn1beji.sch.id/wp-content/uploads/2025/05/logo_web_trans-1.png' ? (
                          <img src={schoolConfig.logoUrl} alt="Logo Sekolah" className="w-10 h-10 object-contain drop-shadow-md" />
                        ) : (
                          <img src="https://smpn1beji.sch.id/wp-content/uploads/2025/05/favico.png" alt="Logo Sekolah" className="w-10 h-10 object-contain drop-shadow-md" />
                        )}
                        <span className="font-extrabold tracking-widest text-[10px] sm:text-xs uppercase text-indigo-50">
                          {schoolConfig.landingTopTag}
                        </span>
                      </div>
                      
                      {/* Headlines */}
                      <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                          {schoolConfig.landingTitle}
                        </h2>
                        <p className="text-indigo-100 text-sm lg:text-base leading-relaxed max-w-lg font-medium">
                          {schoolConfig.landingDescription}
                        </p>
                      </div>

                      {/* Feature lists */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8 border-t border-indigo-400/30">
                        <div className="flex items-start gap-3">
                          <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-white font-bold text-sm block mb-0.5">Jurnal Digital Guru</strong>
                            <p className="text-indigo-200 text-xs">Catat kehadiran dan topik KBM secara real-time.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-white font-bold text-sm block mb-0.5">Materi Cloud</strong>
                            <p className="text-indigo-200 text-xs">Akses bahan ajar dan PDF kapan saja, di mana saja.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-white font-bold text-sm block mb-0.5">Ujian & Evaluasi CBT</strong>
                            <p className="text-indigo-200 text-xs">LMS interaktif dengan 4 format soal komprehensif.</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-white font-bold text-sm block mb-0.5">Sistem Anti-Contek</strong>
                            <p className="text-indigo-200 text-xs">Pemantauan fokus layar ujian secara native.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secure Login & Register Form (Right Side) */}
                  <div className="lg:w-2/5 p-8 lg:p-12 bg-white flex flex-col justify-center space-y-6">
                  {/* Tab Selector */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setPortalTab('login')}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        portalTab === 'login'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LogIn className="w-4 h-4" /> Masuk (Login)
                    </button>
                    <button
                      onClick={() => setPortalTab('register')}
                      className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        portalTab === 'register'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" /> Daftar Akun Baru
                    </button>
                  </div>

                  {portalTab === 'login' ? (
                    <>
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <LogIn className="w-5 h-5 text-indigo-600" />
                          Masuk ke Portal Sekolah
                        </h3>
                        <p className="text-slate-400 text-xs">Masukkan kredensial Anda untuk mengakses database sistem.</p>
                      </div>

                      <form onSubmit={handleManualLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Username / NIP / NIS</label>
                          <input
                            type="text"
                            required
                            placeholder="Misal: 19800101... (NIP), 2024001 (NIS), atau Username"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Password / Sandi</label>
                          <input
                            type="password"
                            required
                            placeholder="Masukkan password / sandi Anda"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {loginError && (
                          <p className="text-xs text-red-600 font-bold leading-relaxed">{loginError}</p>
                        )}

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition cursor-pointer text-sm shadow-xs"
                        >
                          Masuk Sistem
                        </button>
                      </form>
                      <p className="text-center text-[10px] text-slate-400 mt-4">
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-indigo-600" />
                          Pendaftaran Akun Baru
                        </h3>
                        <p className="text-slate-400 text-xs">Pendaftaran untuk Guru / Siswa yang belum memiliki akun. Akan disetujui oleh Admin Sekolah.</p>
                      </div>

                      <form onSubmit={handleRegisterAccount} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Daftar Sebagai Peran</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => { setRegRole('Teacher'); setRegSubjectOrClass('Matematika'); }}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                regRole === 'Teacher' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              👨‍🏫 Guru / Pengajar
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRegRole('Student'); setRegSubjectOrClass('VII-A'); }}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                regRole === 'Student' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              👨‍🎓 Siswa / Peserta Didik
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Nama Lengkap beserta Gelar</label>
                          <input
                            type="text"
                            required
                            placeholder={regRole === 'Teacher' ? 'Contoh: Rina Wulandari, S.Pd.' : 'Contoh: Bagus Setyawan'}
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">
                            {regRole === 'Teacher' ? 'Nomor Induk Pegawai (NIP / NUPTK)' : 'Nomor Induk Siswa (NIS / NISN)'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={regRole === 'Teacher' ? 'Contoh: 199005142018012001' : 'Contoh: 10255'}
                            value={regIdentifier}
                            onChange={(e) => setRegIdentifier(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">
                            {regRole === 'Teacher' ? 'Mata Pelajaran yang Diampu' : 'Pilih Kelas Siswa'}
                          </label>
                          {regRole === 'Teacher' ? (
                            <input
                              type="text"
                              required
                              placeholder="Contoh: Matematika, IPA, Bahasa Indonesia"
                              value={regSubjectOrClass}
                              onChange={(e) => setRegSubjectOrClass(e.target.value)}
                              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                          ) : (
                            <select
                              value={regSubjectOrClass}
                              onChange={(e) => setRegSubjectOrClass(e.target.value)}
                              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                              {sortedClasses.map(c => (
                                <option key={c.id} value={c.name}>Kelas {c.name}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold mb-1 text-slate-700">
                            {regRole === 'Teacher' ? 'Email (Atau Password min 6 karakter)' : 'Buat Password / Email Login'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={regRole === 'Teacher' ? 'Contoh: guru123' : 'Contoh: bagus@smp.sch.id'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition cursor-pointer text-sm shadow-xs flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" /> Kirim Permohonan Pendaftaran
                        </button>
                      </form>
                      <p className="text-center text-[10px] text-slate-400 mt-4">
                      </p>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium">
                        ℹ️ <strong>Catatan:</strong> Setelah Anda mendaftar, Admin Sekolah dapat memverifikasi dan menyetujui akun Anda melalui menu persetujuan di halaman Admin.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* ADMIN PANEL MOUNTED */}
            {currentRole === 'Admin' && (
              <AdminPanel
                teachers={teachers}
                students={students}
                classes={sortedClasses}
                subjects={subjects}
                journals={journals}
                questionBanks={questionBanks}
                submissions={submissions}
                cheatLogs={cheatLogs}
                registrations={registrations}
                schoolConfig={schoolConfig}
                onUpdateSchoolConfig={saveSchoolConfigState}
                onAddTeacher={handleAddTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onAddClass={handleAddClass}
                onDeleteClass={handleDeleteClass}
                onUpdateClass={handleUpdateClass}
                onAddSubject={handleAddSubject}
                onDeleteSubject={handleDeleteSubject}
                onUpdateSubject={handleUpdateSubject}
                globalAnnouncements={globalAnnouncements}
                onAddGlobalAnnouncement={handleAddGlobalAnnouncement}
                onDeleteGlobalAnnouncement={handleDeleteGlobalAnnouncement}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onUpdateTeacher={handleUpdateTeacher}
                onShareToTeacher={handleShareToTeacher}
                teachingModules={teachingModules}
                materials={materials}
                exams={exams}
                counselingReferrals={counselingReferrals}
                counselingSessions={counselingSessions}
                studentCounselingRequests={studentCounselingRequests}
                dailyCheckIns={dailyCheckIns}
                needsAssessments={needsAssessments}
                sociometries={sociometries}
                homeVisits={homeVisits}
                careerPlans={careerPlans}
                manualAssessments={manualAssessments}
                assignmentFolders={assignmentFolders}
                assignmentSubmissions={assignmentSubmissions}
                announcements={announcements}
                shareRequests={shareRequests}
                scheduleNotes={scheduleNotes}
                livePresentations={livePresentations}
                onUpdateStudent={handleUpdateStudent}
                onBulkAddStudents={handleBulkAddStudents}
                onApproveRegistration={handleApproveRegistration}
                onToggleTeacherAdmin={handleToggleTeacherAdmin}
                onRejectRegistration={handleRejectRegistration}
                onDeleteRegistration={handleDeleteRegistration}
                onDeleteCheatLog={handleDeleteCheatLog}
                onClearCheatLogsBatch={handleClearCheatLogsBatch}
              />
            )}

            {/* TEACHER PANEL MOUNTED */}
            {currentRole === 'Teacher' && activeUser && (
              <TeacherPanel
                key={activeUser.id}
                currentTeacher={activeUser}
                classes={sortedClasses}
                subjects={subjects}
                students={students}
                materials={materials}
                teachingModules={teachingModules}
                onSaveTeachingModule={handleSaveTeachingModule}
                onUpdateTeachingModule={handleUpdateTeachingModule}
                onDeleteTeachingModule={handleDeleteTeachingModule}
                exams={exams}
                questionBanks={questionBanks}
                journals={journals}
                submissions={submissions}
                onUpdateSubmission={handleUpdateSubmission}
                cheatLogs={cheatLogs}
                onDeleteCheatLog={handleDeleteCheatLog}
                onClearCheatLogsBatch={handleClearCheatLogsBatch}
                manualAssessments={manualAssessments}
                announcements={announcements}
                shareRequests={shareRequests}
                teachers={teachers}
                onShareToTeacher={handleShareToTeacher}
                onRespondShare={handleRespondShare}
                onDeleteShare={handleDeleteShare}
                onClearAllShares={handleClearAllShares}
                onSaveMaterial={handleSaveMaterial}
                onUpdateMaterial={handleUpdateMaterial}
                onToggleMaterial={handleToggleMaterial}
                onDeleteMaterial={handleDeleteMaterial}
                onSaveExam={handleSaveExam}
                onUpdateExam={handleUpdateExam}
                onDeleteExam={handleDeleteExam}
                onSaveQuestionBank={handleSaveQuestionBank}
                onDeleteQuestionBank={handleDeleteQuestionBank}
                onSaveManualAssessment={handleSaveManualAssessment}
                onUpdateManualAssessment={handleUpdateManualAssessment}
                onDeleteManualAssessment={handleDeleteManualAssessment}
                onSaveJournal={handleSaveJournal}
                onUpdateJournal={handleUpdateJournal}
                onDeleteJournal={handleDeleteJournal}
                onUpdateTeacher={handleUpdateTeacher}
                onSaveAnnouncement={handleSaveAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                scheduleNotes={scheduleNotes}
                onSaveSchedule={handleSaveSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onToggleAnnouncement={handleToggleAnnouncement}
                onAddReferral={handleAddReferral}
                assignmentFolders={assignmentFolders}
                assignmentSubmissions={assignmentSubmissions}
                onSaveAssignmentFolder={handleSaveAssignmentFolder}
                onUpdateAssignmentFolder={handleUpdateAssignmentFolder}
                onDeleteAssignmentFolder={handleDeleteAssignmentFolder}
                onSaveAssignmentSubmission={handleSaveAssignmentSubmission}
                onUpdateAssignmentSubmission={handleUpdateAssignmentSubmission}
                onDeleteAssignmentSubmission={handleDeleteAssignmentSubmission}
                livePresentation={livePresentation}
                livePresentations={livePresentations}
                onUpdateLivePresentation={handleUpdateLivePresentation}
                schoolConfig={schoolConfig}
                onUpdateSchoolConfig={saveSchoolConfigState}
              />
            )}

            {/* COUNSELOR PANEL */}
            {currentRole === 'Counselor' && (
              <CounselorPanel
                schoolConfig={schoolConfig}
                onUpdateSchoolConfig={saveSchoolConfigState}
                studentCounselingRequests={studentCounselingRequests}
                onUpdateStudentCounselingRequest={handleUpdateStudentCounselingRequest}
                onDeleteStudentCounselingRequest={handleDeleteStudentCounselingRequest}
                activeUser={activeUser}
                dailyCheckIns={dailyCheckIns}
                needsAssessments={needsAssessments}
                sociometries={sociometries}
                homeVisits={homeVisits}
                careerPlans={careerPlans}
                onAddHomeVisit={handleAddHomeVisit}
                onUpdateHomeVisit={handleUpdateHomeVisit}
                onDeleteHomeVisit={handleDeleteHomeVisit}
                onAddCareerPlan={handleAddCareerPlan}
                onUpdateCareerPlan={handleUpdateCareerPlan}
                onDeleteCareerPlan={handleDeleteCareerPlan}
                referrals={counselingReferrals}
                sessions={counselingSessions}
                students={students}
                classes={sortedClasses}
                teachers={teachers}
                onUpdateReferral={handleUpdateReferral}
                onDeleteReferral={handleDeleteReferral}
                onSaveSession={handleSaveSession}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
              />
            )}
            {/* STUDENT PANEL MOUNTED */}
            {currentRole === 'Student' && activeUser && (
              <StudentPanel
                studentCounselingRequests={studentCounselingRequests}
                onAddStudentCounselingRequest={handleAddStudentCounselingRequest}
                onUpdateStudentCounselingRequest={handleUpdateStudentCounselingRequest}
                dailyCheckIns={dailyCheckIns}
                onAddDailyCheckIn={handleAddDailyCheckIn}
                onAddNeedsAssessment={handleAddNeedsAssessment}
                sociometries={sociometries}
                onAddSociometry={handleAddSociometry}
                onUpdateSociometry={handleUpdateSociometry}
                onDeleteSociometry={handleDeleteSociometry}
                careerPlans={careerPlans}
                onAddCareerPlan={handleAddCareerPlan}
                onUpdateCareerPlan={handleUpdateCareerPlan}
                classes={sortedClasses}
                students={students}
                currentStudent={activeUser}
                materials={materials}
                exams={exams}
                submissions={submissions}
                teachers={teachers}
                subjects={subjects}
                announcements={announcements}
                onAddCheatLog={handleAddCheatLog}
                onSubmitExam={handleSubmitExam}
                assignmentFolders={assignmentFolders}
                assignmentSubmissions={assignmentSubmissions}
                manualAssessments={manualAssessments}
                schoolConfig={schoolConfig}
                onSaveAssignmentSubmission={handleSaveAssignmentSubmission}
                livePresentation={livePresentation}
                livePresentations={livePresentations}
                onUpdateLivePresentation={handleUpdateLivePresentation}
              />
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            {schoolConfig.footerText}
          </p>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold">Vite 6 + React 19 + Tailwind CSS 4</span>
          </div>
        </div>
      </footer>
    </div>
    </>

  );
}
