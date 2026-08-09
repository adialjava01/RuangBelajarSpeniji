import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, Calendar, CheckCircle, Clock, AlertTriangle, 
  MessageSquare, UserPlus, Filter, Search, FileText, Home, Heart, X, Briefcase, Download, Map as MapIcon, Plus, Trash2, MapPin, BarChart2, Printer, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, Settings, Edit3, Building, ShieldCheck,
  HardDrive, Upload, Database, RefreshCw, FileJson, Eye
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Legend, Bar } from 'recharts';
import { 
  CounselingReferral, CounselingSession, StudentCounselingRequest, Student, ClassItem, Teacher, DailyCheckIn, NeedsAssessment, Sociometry, HomeVisit, CareerPlan, SchoolConfig
} from '../types';
import { SCHOOL_LOGO_BASE64 } from '../assets/schoolLogo';
import { restoreDatabaseBatch } from '../firebaseSync';

interface CounselorPanelProps {
  schoolConfig?: SchoolConfig;
  onUpdateSchoolConfig?: (config: SchoolConfig) => void;
  activeUser?: any;
  dailyCheckIns?: DailyCheckIn[];
  needsAssessments?: NeedsAssessment[];
  sociometries?: Sociometry[];
  homeVisits?: HomeVisit[];
  careerPlans?: CareerPlan[];
  onAddHomeVisit?: (visit: Omit<HomeVisit, 'id' | 'createdAt'>) => void;
  onUpdateHomeVisit?: (id: string, updates: Partial<HomeVisit>) => void;
  onDeleteHomeVisit?: (id: string) => void;
  onAddCareerPlan?: (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => void;
  onUpdateCareerPlan?: (id: string, updates: Partial<CareerPlan>) => void;
  onDeleteCareerPlan?: (id: string) => void;
  referrals: CounselingReferral[];
  sessions: CounselingSession[];
  studentCounselingRequests?: StudentCounselingRequest[];
  onUpdateStudentCounselingRequest?: (req: StudentCounselingRequest) => void;
  onDeleteStudentCounselingRequest?: (id: string) => void;
  students: Student[];
  classes: ClassItem[];
  teachers: Teacher[];
  onUpdateReferral: (updated: CounselingReferral) => void;
  onDeleteReferral?: (id: string) => void;
  onSaveSession: (session: Omit<CounselingSession, 'id'>) => void;
  onUpdateSession?: (id: string, updates: Partial<CounselingSession>) => void;
  onDeleteSession?: (id: string) => void;
}

export default function CounselorPanel({
  schoolConfig,
  onUpdateSchoolConfig,
  activeUser,
  dailyCheckIns = [],
  needsAssessments = [],
  sociometries = [],
  homeVisits = [],
  careerPlans = [],
  onAddHomeVisit,
  onUpdateHomeVisit,
  onDeleteHomeVisit,
  onAddCareerPlan,
  onUpdateCareerPlan,
  onDeleteCareerPlan,
  referrals,
  sessions,
  studentCounselingRequests = [],
  onUpdateStudentCounselingRequest,
  onDeleteStudentCounselingRequest,
  students = [],
  classes,
  teachers,
  onUpdateReferral,
  onDeleteReferral,
  onSaveSession,
  onUpdateSession,
  onDeleteSession
}: CounselorPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'asesmen' | 'tren' | 'rujukan' | 'sesi' | 'abk' | 'homevisit' | 'karir' | 'permintaan' | 'backup'>('dashboard');

  // Backup & Restore BK Database States
  const [bkBackupOptions, setBkBackupOptions] = useState({
    includeCounselingData: true,
    includeAssessmentData: true,
    includeVisitAndCareerData: true,
    includeMasterStudents: true,
    includeSchoolConfig: true
  });
  const [bkRestoreFile, setBkRestoreFile] = useState<File | null>(null);
  const [bkRestorePreview, setBkRestorePreview] = useState<Record<string, any> | null>(null);
  const [bkRestoreMode, setBkRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isBkRestoring, setIsBkRestoring] = useState(false);
  const [bkRestoreProgressText, setBkRestoreProgressText] = useState('');

  const handleDownloadBkBackup = () => {
    const exportPayload: Record<string, any> = {
      appName: schoolConfig?.headerAppName || 'Database Bimbingan & Konseling (BK)',
      schoolName: schoolConfig?.headerSubtitle || 'SMPN 1 BEJI',
      exportDate: new Date().toISOString(),
      version: '1.0',
      exportedBy: activeUser?.name || 'Guru BK'
    };

    if (bkBackupOptions.includeCounselingData) {
      exportPayload.counselingReferrals = referrals;
      exportPayload.counselingSessions = sessions;
      exportPayload.studentCounselingRequests = studentCounselingRequests;
    }

    if (bkBackupOptions.includeAssessmentData) {
      exportPayload.dailyCheckIns = dailyCheckIns;
      exportPayload.needsAssessments = needsAssessments;
      exportPayload.sociometries = sociometries;
    }

    if (bkBackupOptions.includeVisitAndCareerData) {
      exportPayload.homeVisits = homeVisits;
      exportPayload.careerPlans = careerPlans;
    }

    if (bkBackupOptions.includeMasterStudents) {
      exportPayload.students = students;
      exportPayload.classes = classes;
      exportPayload.teachers = teachers;
    }

    if (bkBackupOptions.includeSchoolConfig) {
      exportPayload.schoolConfig = schoolConfig;
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const schoolClean = (schoolConfig?.headerSubtitle || 'SMPN1BEJI').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `BACKUP_DATABASE_BK_${schoolClean}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup Database BK berhasil diunduh dalam format JSON!');
  };

  const handleFileSelectForBkRestore = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Berkas harus berformat .json!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Format JSON tidak valid');
        }
        setBkRestorePreview(parsed);
        setBkRestoreFile(file);
        toast.success('Berkas backup berhasil dibaca. Silakan periksa ringkasan dan konfirmasi restorasi.');
      } catch (err) {
        console.error(err);
        toast.error('Gagal membaca berkas JSON. Format berkas tidak sesuai!');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBkRestore = async () => {
    if (!bkRestorePreview) return;
    
    if (bkRestoreMode === 'overwrite') {
      const confirm = window.confirm('PERINGATAN! Anda memilih mode TIMPA TOTAL. Seluruh data terkait pada database akan diperbarui/ditimpa dengan isi file backup. Apakah Anda yakin ingin melanjutkan?');
      if (!confirm) return;
    }

    setIsBkRestoring(true);
    setBkRestoreProgressText('Sedang memproses restorasi batch ke database Firestore...');

    try {
      const count = await restoreDatabaseBatch(bkRestorePreview, bkRestoreMode);
      toast.success(`Restorasi database BK BERHASIL! ${count} record data berhasil dipulihkan.`);
      setBkRestorePreview(null);
      setBkRestoreFile(null);
    } catch (err) {
      console.error('Error during restore:', err);
      toast.error('Gagal melakukan restorasi database. Silakan coba lagi.');
    } finally {
      setIsBkRestoring(false);
      setBkRestoreProgressText('');
    }
  };

  // Helper resolving real student NIS from studentId or studentName
  const getStudentNis = (studentId?: string, studentName?: string) => {
    if (!studentId && !studentName) return '-';
    const st = (students || []).find(s => 
      (studentId && (s.id === studentId || s.nis === studentId)) || 
      (studentName && s.name && s.name.toLowerCase().trim() === studentName.toLowerCase().trim())
    );
    if (st?.nis) return st.nis;
    if (studentId && !studentId.startsWith('std_') && !studentId.startsWith('usr_')) {
      return studentId;
    }
    return '-';
  };
  
  // Sesi Form State
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddABK, setShowAddABK] = useState(false);
  const [editingAbkId, setEditingAbkId] = useState<string | null>(null);
  const [abkStudentNis, setAbkStudentNis] = useState('');
  const [abkInputNotes, setAbkInputNotes] = useState('');
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
  const [respondingRequest, setRespondingRequest] = useState<StudentCounselingRequest | null>(null);
  const [counselingResponse, setCounselingResponse] = useState('');
  const [counselingSchedule, setCounselingSchedule] = useState('');
  const [counselingStatus, setCounselingStatus] = useState<'Menunggu' | 'Dijadwalkan' | 'Diproses' | 'Selesai' | 'Ditolak'>('Diproses');
  const [respondingReferral, setRespondingReferral] = useState<CounselingReferral | null>(null);
  const [referralStatus, setReferralStatus] = useState<'Menunggu' | 'Dijadwalkan' | 'Diproses' | 'Selesai' | 'Ditolak'>('Diproses');
  const [referralResponse, setReferralResponse] = useState('');
  const [hvParentName, setHvParentName] = useState('');
  
  // Enhanced Home Visit Calendar & Scheduling States
  const [hvCalendarMonth, setHvCalendarMonth] = useState<Date>(new Date());
  const [hvSelectedDateFilter, setHvSelectedDateFilter] = useState<string | null>(null);
  const [hvSearch, setHvSearch] = useState('');
  const [hvStatusFilter, setHvStatusFilter] = useState<'Semua' | 'Direncanakan' | 'Selesai'>('Semua');
  const [hvClassFilter, setHvClassFilter] = useState<string>('Semua');
  const [showFinishHvModal, setShowFinishHvModal] = useState<HomeVisit | null>(null);
  const [finishHvResult, setFinishHvResult] = useState('');
  const [finishHvFollowUp, setFinishHvFollowUp] = useState('');
  const [printingHv, setPrintingHv] = useState<HomeVisit | null>(null);
  const [hvPaperSize, setHvPaperSize] = useState<'A4' | 'F4'>('A4');
  const [hvDocumentNumber, setHvDocumentNumber] = useState('');
  const [editHvDocumentNumber, setEditHvDocumentNumber] = useState('');
  const [printingHvDocNumber, setPrintingHvDocNumber] = useState('');

  const handleOpenPrintPreviewModal = (visit: HomeVisit) => {
    setPrintingHv(visit);
    setPrintingHvDocNumber(visit.documentNumber || `BK/${new Date().getFullYear()}/HV/${visit.id.substring(0, 6).toUpperCase()}`);
  };

  // Kop Surat & Edit Home Visit States
  const [showHvConfigModal, setShowHvConfigModal] = useState(false);
  const [cfgKopHeader1, setCfgKopHeader1] = useState('');
  const [cfgSchoolName, setCfgSchoolName] = useState('');
  const [cfgSchoolAddress, setCfgSchoolAddress] = useState('');
  const [cfgSchoolPhone, setCfgSchoolPhone] = useState('');
  const [cfgSchoolEmail, setCfgSchoolEmail] = useState('');
  const [cfgCounselorName, setCfgCounselorName] = useState('');
  const [cfgCounselorNip, setCfgCounselorNip] = useState('');
  const [cfgPrincipalName, setCfgPrincipalName] = useState('');
  const [cfgPrincipalNip, setCfgPrincipalNip] = useState('');
  const [cfgCityLocation, setCfgCityLocation] = useState('');

  // Editing Home Visit State
  const [editingHv, setEditingHv] = useState<HomeVisit | null>(null);
  const [editHvStudentNis, setEditHvStudentNis] = useState('');
  const [editHvDate, setEditHvDate] = useState('');
  const [editHvPurpose, setEditHvPurpose] = useState('');
  const [editHvParentName, setEditHvParentName] = useState('');
  const [editHvCounselorName, setEditHvCounselorName] = useState('');
  const [editHvStatus, setEditHvStatus] = useState<'Direncanakan' | 'Selesai'>('Direncanakan');
  const [editHvResult, setEditHvResult] = useState('');
  const [editHvFollowUp, setEditHvFollowUp] = useState('');

  const handleOpenHvConfigModal = () => {
    setCfgKopHeader1(schoolConfig?.kopHeader1 || schoolConfig?.headerSubtitle || 'PEMERINTAH KABUPATEN PASURUAN / DINAS PENDIDIKAN');
    setCfgSchoolName(schoolConfig?.schoolName || schoolConfig?.headerAppName || 'SMP NEGERI 1 BEJI');
    setCfgSchoolAddress(schoolConfig?.schoolAddress || 'Jl. Raya Beji No. 123, Kabupaten Pasuruan');
    setCfgSchoolPhone(schoolConfig?.schoolPhone || '(0343) 123456');
    setCfgSchoolEmail(schoolConfig?.schoolEmail || 'bk.smpn1beji@sch.id');
    setCfgCounselorName(schoolConfig?.counselorName || activeUser?.name || 'Guru BK');
    setCfgCounselorNip(schoolConfig?.counselorNip || '19850101 201001 1 002');
    setCfgPrincipalName(schoolConfig?.principalName || 'Drs. H. M. Yasin, M.Pd.');
    setCfgPrincipalNip(schoolConfig?.principalNip || '19680315 199403 1 005');
    setCfgCityLocation(schoolConfig?.cityLocation || 'Pasuruan');
    setShowHvConfigModal(true);
  };

  const handleSaveHvConfig = () => {
    if (!onUpdateSchoolConfig) {
      toast.error('Fungsi update konfigurasi tidak tersedia.');
      return;
    }
    const updated: SchoolConfig = {
      ...(schoolConfig || {
        logoUrl: '',
        headerAppName: cfgSchoolName,
        headerSubtitle: cfgKopHeader1,
        landingTopTag: '',
        landingTitle: '',
        landingDescription: '',
        footerText: ''
      }),
      kopHeader1: cfgKopHeader1,
      schoolName: cfgSchoolName,
      headerAppName: cfgSchoolName,
      schoolAddress: cfgSchoolAddress,
      schoolPhone: cfgSchoolPhone,
      schoolEmail: cfgSchoolEmail,
      counselorName: cfgCounselorName,
      counselorNip: cfgCounselorNip,
      principalName: cfgPrincipalName,
      principalNip: cfgPrincipalNip,
      cityLocation: cfgCityLocation
    };
    onUpdateSchoolConfig(updated);
    toast.success('Pengaturan Kop & Format Surat Kunjungan berhasil disimpan!');
    setShowHvConfigModal(false);
  };

  const handleStartEditHv = (visit: HomeVisit) => {
    setEditingHv(visit);
    setEditHvStudentNis(visit.studentNis);
    setEditHvDate(visit.date ? visit.date.substring(0, 10) : '');
    setEditHvPurpose(visit.purpose || '');
    setEditHvParentName(visit.parentName || '');
    setEditHvCounselorName(visit.counselorName || activeUser?.name || '');
    setEditHvStatus(visit.status || 'Direncanakan');
    setEditHvResult(visit.visitResult || '');
    setEditHvFollowUp(visit.followUp || '');
    setEditHvDocumentNumber(visit.documentNumber || `BK/${new Date().getFullYear()}/HV/${visit.id.substring(0, 6).toUpperCase()}`);
  };

  const handleSaveEditHv = () => {
    if (!editingHv || !onUpdateHomeVisit) return;
    const targetStudent = students.find(s => s.nis === editHvStudentNis);
    const targetClass = targetStudent ? classes.find(c => c.id === targetStudent.classId) : null;

    onUpdateHomeVisit(editingHv.id, {
      studentNis: editHvStudentNis,
      studentName: targetStudent?.name || editingHv.studentName,
      className: targetClass?.name || editingHv.className,
      date: editHvDate,
      purpose: editHvPurpose,
      parentName: editHvParentName,
      counselorName: editHvCounselorName,
      status: editHvStatus,
      visitResult: editHvResult,
      followUp: editHvFollowUp,
      documentNumber: editHvDocumentNumber
    });

    toast.success('Jadwal Kunjungan Rumah berhasil diperbarui!');
    setEditingHv(null);
  };

  const handleDeleteHv = (visit: HomeVisit) => {
    setDeletingHv(visit);
  };

  // --- HOME VISIT CALENDAR & FILTER HELPERS ---
  const monthNamesIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const hvCalYear = hvCalendarMonth.getFullYear();
  const hvCalMonth = hvCalendarMonth.getMonth(); // 0-11

  const hvDaysInMonth = new Date(hvCalYear, hvCalMonth + 1, 0).getDate();
  const hvFirstDayObj = new Date(hvCalYear, hvCalMonth, 1);
  const hvStartDayIndex = (hvFirstDayObj.getDay() + 6) % 7; // Monday = 0
  const hvDaysInPrevMonth = new Date(hvCalYear, hvCalMonth, 0).getDate();

  const formatYmdDate = (year: number, monthZeroBased: number, day: number) => {
    const m = String(monthZeroBased + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayYmd = new Date().toISOString().split('T')[0];

  const visitsByDateMap = React.useMemo(() => {
    const map: Record<string, HomeVisit[]> = {};
    (homeVisits || []).forEach(v => {
      if (v.date) {
        const dateKey = v.date.substring(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(v);
      }
    });
    return map;
  }, [homeVisits]);

  const hvCalendarCells = React.useMemo(() => {
    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      visits: HomeVisit[];
    }> = [];

    // Prev month days
    for (let i = hvStartDayIndex - 1; i >= 0; i--) {
      const prevDay = hvDaysInPrevMonth - i;
      const prevMonthZero = hvCalMonth === 0 ? 11 : hvCalMonth - 1;
      const prevYear = hvCalMonth === 0 ? hvCalYear - 1 : hvCalYear;
      const dateStr = formatYmdDate(prevYear, prevMonthZero, prevDay);
      cells.push({
        dateStr,
        dayNum: prevDay,
        isCurrentMonth: false,
        isToday: dateStr === todayYmd,
        visits: visitsByDateMap[dateStr] || []
      });
    }

    // Current month days
    for (let d = 1; d <= hvDaysInMonth; d++) {
      const dateStr = formatYmdDate(hvCalYear, hvCalMonth, d);
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayYmd,
        visits: visitsByDateMap[dateStr] || []
      });
    }

    // Next month days
    const totalSlots = cells.length > 35 ? 42 : 35;
    const nextMonthNeeded = totalSlots - cells.length;
    for (let d = 1; d <= nextMonthNeeded; d++) {
      const nextMonthZero = hvCalMonth === 11 ? 0 : hvCalMonth + 1;
      const nextYear = hvCalMonth === 11 ? hvCalYear + 1 : hvCalYear;
      const dateStr = formatYmdDate(nextYear, nextMonthZero, d);
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayYmd,
        visits: visitsByDateMap[dateStr] || []
      });
    }

    return cells;
  }, [hvCalYear, hvCalMonth, hvDaysInMonth, hvDaysInPrevMonth, hvStartDayIndex, todayYmd, visitsByDateMap]);

  const filteredHomeVisits = React.useMemo(() => {
    return (homeVisits || []).filter(visit => {
      const visitDateKey = visit.date ? visit.date.substring(0, 10) : '';

      if (hvSelectedDateFilter && visitDateKey !== hvSelectedDateFilter) {
        return false;
      }

      if (hvStatusFilter !== 'Semua' && visit.status !== hvStatusFilter) {
        return false;
      }

      if (hvClassFilter !== 'Semua' && visit.className !== hvClassFilter) {
        return false;
      }

      if (hvSearch.trim()) {
        const q = hvSearch.toLowerCase();
        const student = students.find(s => s.nis === visit.studentNis);
        const stName = (student?.name || visit.studentName || '').toLowerCase();
        const nis = (visit.studentNis || '').toLowerCase();
        const cls = (visit.className || '').toLowerCase();
        const parent = (visit.parentName || '').toLowerCase();
        const purpose = (visit.purpose || '').toLowerCase();

        return (
          stName.includes(q) ||
          nis.includes(q) ||
          cls.includes(q) ||
          parent.includes(q) ||
          purpose.includes(q)
        );
      }

      return true;
    });
  }, [homeVisits, hvSelectedDateFilter, hvStatusFilter, hvClassFilter, hvSearch, students]);
  
  // State for Karir
  const [showKarirForm, setShowKarirForm] = useState(false);
  const [editingKarirId, setEditingKarirId] = useState<string | null>(null);
  const [karirSelectedClass, setKarirSelectedClass] = useState<string>('Semua');
  const [karirSearchQuery, setKarirSearchQuery] = useState('');
  const [karirStudentNis, setKarirStudentNis] = useState('');
  const [karirTargetCareer, setKarirTargetCareer] = useState('');
  const [karirInterests, setKarirInterests] = useState<string[]>([]);
  const [karirStrengths, setKarirStrengths] = useState<string[]>([]);
  const [karirUniversity, setKarirUniversity] = useState('');
  const [karirMajor, setKarirMajor] = useState('');
  const [karirNotes, setKarirNotes] = useState('');

  const PRESET_CAREERS = [
    'Software Engineer / Ahli IT',
    'Dokter / Tenaga Kesehatan',
    'Pengusaha / Entrepreneur',
    'Guru / Akademisi / Dosen',
    'Seniman / UI UX Designer',
    'Arsitek / Teknik Sipil',
    'TNI / POLRI / Kedinasan',
    'Akuntan / Konsultan Keuangan',
    'Pilot / Penerbang',
    'Content Creator / Digital Media'
  ];

  const PRESET_INTERESTS = [
    'Sains & Teknologi',
    'Seni & Desain',
    'Bisnis & Ekonomi',
    'Sosial & Bahasa',
    'Olahraga & Kesehatan',
    'Kreatif & Digital',
    'Kedinasan & Hukum'
  ];

  const PRESET_STRENGTHS = [
    'Komunikasi & Public Speaking',
    'Logika & Matematika',
    'Kreativitas & Inovasi',
    'Kepemimpinan (Leadership)',
    'Kerja Sama Tim',
    'Problem Solving',
    'Ketelitian & Manajemen'
  ];

  const [selectedCounselorFilter, setSelectedCounselorFilter] = useState<string>('Semua');
  const [showAKPDResults, setShowAKPDResults] = useState(false);
  const [akmFilter, setAkmFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [akmClassFilter, setAkmClassFilter] = useState<string>('all');
  const [selectedAKPD, setSelectedAKPD] = useState<NeedsAssessment | null>(null);
  const [showSociometryResults, setShowSociometryResults] = useState(false);
  const [selectedClassForSociometry, setSelectedClassForSociometry] = useState<string | null>(null);

  // States for Laporan Rekap Rujukan Guru Mapel
  const [showReferralReportModal, setShowReferralReportModal] = useState(false);
  const [referralPaperSize, setReferralPaperSize] = useState<'A4' | 'F4'>('A4');
  const [referralOrientation, setReferralOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [referralStatusFilter, setReferralStatusFilter] = useState<string>('Semua');
  const [referralPriorityFilter, setReferralPriorityFilter] = useState<string>('Semua');
  const [referralClassFilter, setReferralClassFilter] = useState<string>('Semua');
  const [referralIncludeSignatures, setReferralIncludeSignatures] = useState<boolean>(true);
  const [referralMonthFilter, setReferralMonthFilter] = useState<string>('Semua');
  const [referralSemesterFilter, setReferralSemesterFilter] = useState<string>('Semua');

  // States for Laporan Rekap Permintaan Konseling Siswa
  const [showRequestReportModal, setShowRequestReportModal] = useState(false);
  const [requestPaperSize, setRequestPaperSize] = useState<'A4' | 'F4'>('A4');
  const [requestOrientation, setRequestOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('Semua');
  const [requestTopicFilter, setRequestTopicFilter] = useState<string>('Semua');
  const [requestClassFilter, setRequestClassFilter] = useState<string>('Semua');
  const [requestIncludeSignatures, setRequestIncludeSignatures] = useState<boolean>(true);
  const [requestMonthFilter, setRequestMonthFilter] = useState<string>('Semua');
  const [requestSemesterFilter, setRequestSemesterFilter] = useState<string>('Semua');

  // States for Student Selector per Class Block in Form Catatan Konseling
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [selectedClassTab, setSelectedClassTab] = useState<string>('Semua');
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});

  // States for ABK Student Selector
  const [abkSearchTerm, setAbkSearchTerm] = useState<string>('');
  const [abkSelectedClassTab, setAbkSelectedClassTab] = useState<string>('Semua');
  const [abkCollapsedBlocks, setAbkCollapsedBlocks] = useState<Record<string, boolean>>({});

  // States for Enhanced Referral Management (Daftar Rujukan Masalah Siswa)
  const [refStatusFilter, setRefStatusFilter] = useState<string>('aktif');
  const [refSearchTerm, setRefSearchTerm] = useState<string>('');
  const [refClassFilter, setRefClassFilter] = useState<string>('Semua');
  const [refPriorityFilter, setRefPriorityFilter] = useState<string>('Semua');
  const [refYearFilter, setRefYearFilter] = useState<string>('Semua');
  const [refMonthFilter, setRefMonthFilter] = useState<string>('Semua');
  const [refViewMode, setRefViewMode] = useState<'group' | 'grid' | 'table'>('group');
  const [refCollapsedGroups, setRefCollapsedGroups] = useState<Record<string, boolean>>({});
  const [refPage, setRefPage] = useState<number>(1);
  const [refResponseFeedback, setRefResponseFeedback] = useState<string>('');
  const [refResponseStatus, setRefResponseStatus] = useState<'Menunggu' | 'Diproses' | 'Dijadwalkan' | 'Selesai' | 'Ditolak'>('Diproses');
  const [deletingReferralId, setDeletingReferralId] = useState<string | null>(null);

  // States for Enhanced Student Requests Management (Permintaan Konseling Siswa)
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('aktif');
  const [reqSearchTerm, setReqSearchTerm] = useState<string>('');
  const [reqTopicFilter, setReqTopicFilter] = useState<string>('Semua');
  const [reqClassFilter, setReqClassFilter] = useState<string>('Semua');
  const [reqYearFilter, setReqYearFilter] = useState<string>('Semua');
  const [reqMonthFilter, setReqMonthFilter] = useState<string>('Semua');
  const [reqViewMode, setReqViewMode] = useState<'group' | 'grid' | 'table'>('group');
  const [reqCollapsedGroups, setReqCollapsedGroups] = useState<Record<string, boolean>>({});
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [deletingHv, setDeletingHv] = useState<HomeVisit | null>(null);
  const [deletingCareerPlan, setDeletingCareerPlan] = useState<CareerPlan | null>(null);
  const [deletingAbk, setDeletingAbk] = useState<CounselingSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<CounselingSession | null>(null);

  // States for Editing Counseling Session
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // States for Laporan Rekap Sesi Konseling & Log
  const [showSessionReportModal, setShowSessionReportModal] = useState(false);
  const [sessionPaperSize, setSessionPaperSize] = useState<'A4' | 'F4'>('A4');
  const [sessionOrientation, setSessionOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [sessionActionFilter, setSessionActionFilter] = useState<string>('Semua');
  const [sessionClassFilter, setSessionClassFilter] = useState<string>('Semua');
  const [sessionIncludeSignatures, setSessionIncludeSignatures] = useState<boolean>(true);
  const [sessionMonthFilter, setSessionMonthFilter] = useState<string>('Semua');
  const [sessionSemesterFilter, setSessionSemesterFilter] = useState<string>('Semua');

  // States for Laporan Rekap Kunjungan Rumah (Home Visit)
  const [showHvReportModal, setShowHvReportModal] = useState(false);
  const [hvReportPaperSize, setHvReportPaperSize] = useState<'A4' | 'F4'>('A4');
  const [hvReportOrientation, setHvReportOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [hvReportStatusFilter, setHvReportStatusFilter] = useState<string>('Semua');
  const [hvReportClassFilter, setHvReportClassFilter] = useState<string>('Semua');
  const [hvReportIncludeSignatures, setHvReportIncludeSignatures] = useState<boolean>(true);
  const [hvReportMonthFilter, setHvReportMonthFilter] = useState<string>('Semua');
  const [hvReportSemesterFilter, setHvReportSemesterFilter] = useState<string>('Semua');

  // States for Laporan Rekap Bimbingan Karir
  const [showCareerReportModal, setShowCareerReportModal] = useState(false);
  const [careerPaperSize, setCareerPaperSize] = useState<'A4' | 'F4'>('A4');
  const [careerOrientation, setCareerOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [careerReportClassFilter, setCareerReportClassFilter] = useState<string>('Semua');
  const [careerIncludeSignatures, setCareerIncludeSignatures] = useState<boolean>(true);
  const [careerMonthFilter, setCareerMonthFilter] = useState<string>('Semua');
  const [careerSemesterFilter, setCareerSemesterFilter] = useState<string>('Semua');

  // States for Laporan Rekap Data ABK/Khusus
  const [showAbkReportModal, setShowAbkReportModal] = useState(false);
  const [abkPaperSize, setAbkPaperSize] = useState<'A4' | 'F4'>('A4');
  const [abkOrientation, setAbkOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [abkReportClassFilter, setAbkReportClassFilter] = useState<string>('Semua');
  const [abkIncludeSignatures, setAbkIncludeSignatures] = useState<boolean>(true);
  const [abkSemesterFilter, setAbkSemesterFilter] = useState<string>('Semua');
  const [abkYearFilter, setAbkYearFilter] = useState<string>('Semua');

  // States for Kop Surat & Legalisasi Configuration
  const [showKopConfigModal, setShowKopConfigModal] = useState(false);
  const [kopForm, setKopForm] = useState({
    logoUrl: schoolConfig?.logoUrl || SCHOOL_LOGO_BASE64,
    kopHeader1: schoolConfig?.kopHeader1 || 'PEMERINTAH KABUPATEN PASURUAN',
    kopHeader2: schoolConfig?.kopHeader2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    schoolName: schoolConfig?.schoolName || schoolConfig?.headerSubtitle || 'SMP NEGERI 1 BEJI',
    schoolAddress: schoolConfig?.schoolAddress || 'Jl. Raya Beji No. 123, Pasuruan, Jawa Timur',
    schoolPhone: schoolConfig?.schoolPhone || '(0343) 656123',
    schoolEmail: schoolConfig?.schoolEmail || 'info@smpn1beji.sch.id',
    schoolWebsite: schoolConfig?.schoolWebsite || 'smpn1beji.sch.id',
    cityLocation: schoolConfig?.cityLocation || 'Pasuruan',
    principalName: schoolConfig?.principalName || 'Yayuk Sudarwati, S.Pd., M.Pd.',
    principalNip: schoolConfig?.principalNip || '197002071997032005',
    counselorName: schoolConfig?.counselorName || activeUser?.name || 'Dra. Siti Rahmah, M.Pd.',
    counselorNip: schoolConfig?.counselorNip || activeUser?.nip || '197505122003122001',
    kopModel: (schoolConfig?.kopModel as 'Standard' | 'Klasik' | 'Modern' | 'Minimalis') || 'Standard'
  });

  // Sync kopForm when schoolConfig changes
  useEffect(() => {
    if (schoolConfig) {
      setKopForm({
        logoUrl: schoolConfig.logoUrl || SCHOOL_LOGO_BASE64,
        kopHeader1: schoolConfig.kopHeader1 || 'PEMERINTAH KABUPATEN PASURUAN',
        kopHeader2: schoolConfig.kopHeader2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
        schoolName: schoolConfig.schoolName || schoolConfig.headerSubtitle || 'SMP NEGERI 1 BEJI',
        schoolAddress: schoolConfig.schoolAddress || 'Jl. Raya Beji No. 123, Pasuruan, Jawa Timur',
        schoolPhone: schoolConfig.schoolPhone || '(0343) 656123',
        schoolEmail: schoolConfig.schoolEmail || 'info@smpn1beji.sch.id',
        schoolWebsite: schoolConfig.schoolWebsite || 'smpn1beji.sch.id',
        cityLocation: schoolConfig.cityLocation || 'Pasuruan',
        principalName: schoolConfig.principalName || 'Yayuk Sudarwati, S.Pd., M.Pd.',
        principalNip: schoolConfig.principalNip || '197002071997032005',
        counselorName: schoolConfig.counselorName || activeUser?.name || 'Dra. Siti Rahmah, M.Pd.',
        counselorNip: schoolConfig.counselorNip || activeUser?.nip || '197505122003122001',
        kopModel: (schoolConfig.kopModel as 'Standard' | 'Klasik' | 'Modern' | 'Minimalis') || 'Standard'
      });
    }
  }, [schoolConfig, activeUser]);

  const handleSaveKopConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSchoolConfig) {
      const updatedConfig: SchoolConfig = {
        ...(schoolConfig || {
          logoUrl: SCHOOL_LOGO_BASE64,
          headerAppName: 'E-LEARNING & JURNAL',
          headerSubtitle: 'SMPN 1 BEJI, Kab. Pasuruan',
          landingTopTag: '',
          landingTitle: '',
          landingDescription: '',
          footerText: ''
        }),
        logoUrl: kopForm.logoUrl,
        headerSubtitle: kopForm.schoolName,
        kopHeader1: kopForm.kopHeader1,
        kopHeader2: kopForm.kopHeader2,
        schoolName: kopForm.schoolName,
        schoolAddress: kopForm.schoolAddress,
        schoolPhone: kopForm.schoolPhone,
        schoolEmail: kopForm.schoolEmail,
        schoolWebsite: kopForm.schoolWebsite,
        cityLocation: kopForm.cityLocation,
        principalName: kopForm.principalName,
        principalNip: kopForm.principalNip,
        counselorName: kopForm.counselorName,
        counselorNip: kopForm.counselorNip,
        kopModel: kopForm.kopModel
      };
      onUpdateSchoolConfig(updatedConfig);
      toast.success('Pengaturan Kop Laporan & Legalisasi berhasil disimpan!');
      setShowKopConfigModal(false);
    } else {
      toast.error('Fungsi update konfigurasi tidak tersedia.');
    }
  };

  // Helper School Identity
  const getSchoolIdentity = () => {
    const rawAddress = schoolConfig?.schoolAddress || 'Jl. Raya Beji No. 123, Pasuruan, Jawa Timur';
    const phoneStr = schoolConfig?.schoolPhone ? `Telp: ${schoolConfig.schoolPhone}` : '(0343) 656123';
    const webStr = schoolConfig?.schoolWebsite ? `Website: ${schoolConfig.schoolWebsite}` : 'smpn1beji.sch.id';
    const emailStr = schoolConfig?.schoolEmail ? `Email: ${schoolConfig.schoolEmail}` : 'info@smpn1beji.sch.id';

    const fullAddress = [rawAddress, phoneStr, emailStr, webStr].filter(Boolean).join(' | ');

    return {
      logoUrl: schoolConfig?.logoUrl || SCHOOL_LOGO_BASE64,
      header1: schoolConfig?.kopHeader1 || 'PEMERINTAH KABUPATEN PASURUAN',
      header2: schoolConfig?.kopHeader2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      schoolName: schoolConfig?.schoolName || schoolConfig?.headerSubtitle || 'SMP NEGERI 1 BEJI',
      address: fullAddress,
      rawAddress,
      phone: schoolConfig?.schoolPhone || '(0343) 656123',
      email: schoolConfig?.schoolEmail || 'info@smpn1beji.sch.id',
      website: schoolConfig?.schoolWebsite || 'smpn1beji.sch.id',
      principalName: schoolConfig?.principalName || 'Yayuk Sudarwati, S.Pd., M.Pd.',
      principalNip: schoolConfig?.principalNip || '197002071997032005',
      counselorName: schoolConfig?.counselorName || activeUser?.name || 'Dra. Siti Rahmah, M.Pd.',
      counselorNip: schoolConfig?.counselorNip || activeUser?.nip || '197505122003122001',
      cityLocation: schoolConfig?.cityLocation || 'Pasuruan',
      kopModel: (schoolConfig?.kopModel as 'Standard' | 'Klasik' | 'Modern' | 'Minimalis') || 'Standard'
    };
  };

  // Filtered Rujukan Data for Report Modal
  const reportFilteredReferrals = React.useMemo(() => {
    return (referrals || []).filter(r => {
      if (referralStatusFilter !== 'Semua' && r.status !== referralStatusFilter) return false;
      if (referralPriorityFilter !== 'Semua' && r.priority !== referralPriorityFilter) return false;
      if (referralClassFilter !== 'Semua' && r.className !== referralClassFilter) return false;
      
      const rDate = new Date(r.createdAt);
      if (!isNaN(rDate.getTime())) {
        const monthVal = rDate.getMonth() + 1;
        if (referralMonthFilter !== 'Semua' && monthVal.toString().padStart(2, '0') !== referralMonthFilter) return false;
        
        if (referralSemesterFilter !== 'Semua') {
          const isGanjil = monthVal >= 7 && monthVal <= 12;
          const isGenap = monthVal >= 1 && monthVal <= 6;
          if (referralSemesterFilter === 'Ganjil' && !isGanjil) return false;
          if (referralSemesterFilter === 'Genap' && !isGenap) return false;
        }
      }
      return true;
    });
  }, [referrals, referralStatusFilter, referralPriorityFilter, referralClassFilter, referralMonthFilter, referralSemesterFilter]);

  // Filtered Permintaan Siswa Data
  const filteredRequests = React.useMemo(() => {
    return (studentCounselingRequests || []).filter(r => {
      if (requestStatusFilter !== 'Semua' && r.status !== requestStatusFilter) return false;
      if (requestTopicFilter !== 'Semua' && r.topic !== requestTopicFilter) return false;
      if (requestClassFilter !== 'Semua' && r.className !== requestClassFilter) return false;
      
      const rDate = new Date(r.requestedAt);
      if (!isNaN(rDate.getTime())) {
        const monthVal = rDate.getMonth() + 1;
        if (requestMonthFilter !== 'Semua' && monthVal.toString().padStart(2, '0') !== requestMonthFilter) return false;
        
        if (requestSemesterFilter !== 'Semua') {
          const isGanjil = monthVal >= 7 && monthVal <= 12;
          const isGenap = monthVal >= 1 && monthVal <= 6;
          if (requestSemesterFilter === 'Ganjil' && !isGanjil) return false;
          if (requestSemesterFilter === 'Genap' && !isGenap) return false;
        }
      }
      return true;
    });
  }, [studentCounselingRequests, requestStatusFilter, requestTopicFilter, requestClassFilter, requestMonthFilter, requestSemesterFilter]);

  // Cetak Dokumen Rujukan Mapel
  const handlePrintReferralReport = () => {
    const school = getSchoolIdentity();
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const monthNamesIndo: Record<string, string> = {
      'Semua': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    const pageSizeStyle = referralPaperSize === 'F4' 
      ? (referralOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm') 
      : `A4 ${referralOrientation}`;

    const counselorName = school.counselorName;
    const counselorNip = school.counselorNip;
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let headerBorderCss = 'border-bottom: 3px double #0f172a;';
    let headerFontFamily = "'Segoe UI', Arial, sans-serif";
    if (school.kopModel === 'Klasik') {
      headerBorderCss = 'border-bottom: 4px solid #000; font-family: "Times New Roman", Times, serif;';
      headerFontFamily = "'Times New Roman', Times, serif";
    } else if (school.kopModel === 'Modern') {
      headerBorderCss = 'border-bottom: 4px solid #0d9488;';
    } else if (school.kopModel === 'Minimalis') {
      headerBorderCss = 'border-bottom: 1.5px solid #64748b;';
    }

    const countMenunggu = reportFilteredReferrals.filter(r => r.status === 'Menunggu').length;
    const countDiproses = reportFilteredReferrals.filter(r => r.status === 'Diproses').length;
    const countDijadwalkan = reportFilteredReferrals.filter(r => r.status === 'Dijadwalkan').length;
    const countSelesai = reportFilteredReferrals.filter(r => r.status === 'Selesai').length;
    const countPrioTinggi = reportFilteredReferrals.filter(r => r.priority === 'Tinggi').length;

    const rowsHtml = reportFilteredReferrals.map((r, idx) => {
      const teacherName = teachers.find(t => t.id === r.teacherId)?.name || 'Guru Mapel';
      const dateFormatted = new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${dateFormatted}</td>
          <td>${r.studentNis}</td>
          <td><b>${r.studentName}</b></td>
          <td style="text-align: center;">${r.className}</td>
          <td>${teacherName}</td>
          <td>${r.issueCategory}</td>
          <td style="text-align: center;">
            <span style="font-weight: bold; color: ${r.priority === 'Tinggi' ? '#dc2626' : r.priority === 'Sedang' ? '#d97706' : '#2563eb'}">
              ${r.priority}
            </span>
          </td>
          <td>${r.issueDetails}</td>
          <td style="text-align: center;"><b>${r.status}</b></td>
          <td>${r.feedback || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekap Rujukan Guru Mapel</title>
        <style>
          @page {
            size: ${pageSizeStyle};
            margin: 10mm;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 10px;
            background: #fff;
            font-size: 11px;
          }
          .header {
            position: relative;
            border-bottom: 3px double #0f172a;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70px;
          }
          .header-logo {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            width: 100%;
            padding-left: 65px;
            padding-right: 65px;
          }
          .header-text h1 {
            font-size: 14px;
            margin: 0;
            text-transform: uppercase;
            color: #0f172a;
            font-weight: bold;
            line-height: 1.2;
          }
          .header-text h2 {
            font-size: 11px;
            margin: 2px 0 0 0;
            color: #334155;
          }
          .doc-title {
            text-align: center;
            margin-bottom: 12px;
          }
          .doc-title h3 {
            margin: 0;
            font-size: 14px;
            text-decoration: underline;
            text-transform: uppercase;
          }
          .doc-title p {
            margin: 3px 0 0 0;
            font-size: 11px;
            color: #475569;
            font-weight: bold;
          }
          .meta-box {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 10px;
            font-weight: bold;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }
          .stat-item {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
            text-align: center;
          }
          .stat-item .num { font-size: 13px; font-weight: bold; color: #0d9488; }
          .stat-item .lbl { font-size: 9px; color: #64748b; font-weight: bold; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid #64748b;
            padding: 5px 6px;
            vertical-align: top;
          }
          th {
            background-color: #e2e8f0;
            color: #0f172a;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
          }
          .footer-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            font-size: 11px;
            page-break-inside: avoid;
          }
          .sign-box {
            text-align: center;
            width: 220px;
          }
          .sign-space { height: 50px; }
          .btn-print {
            background: #0d9488;
            color: white;
            border: none;
            padding: 8px 16px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right; margin-bottom: 12px;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak Dokumen / Simpan PDF (${referralPaperSize} - ${referralOrientation})</button>
        </div>

        <div class="header" style="${headerBorderCss} font-family: ${headerFontFamily};">
          <img src="${school.logoUrl}" alt="Logo Sekolah" class="header-logo" />
          <div class="header-text">
            <h1>${school.header1}</h1>
            <h1>${school.header2}</h1>
            <h1 style="font-size:16px;margin-top:2px;font-weight:bold;color:#0f172a;">${school.schoolName}</h1>
            <h2>${school.address}</h2>
          </div>
        </div>

        <div class="doc-title">
          <h3>LAPORAN REKAPITULASI RUJUKAN GURU MATA PELAJARAN KE GURU BK</h3>
          <p>GURU BK: ${counselorName.toUpperCase()} ${counselorNip !== '-' ? `(NIP: ${counselorNip})` : ''}</p>
          <p style="margin-top: 4px; font-weight: bold; color: #475569;">
            Periode: ${referralMonthFilter !== 'Semua' ? monthNamesIndo[referralMonthFilter] || referralMonthFilter : 'Semua Bulan'} — ${referralSemesterFilter !== 'Semua' ? `Semester ${referralSemesterFilter}` : 'Semua Semester'}
          </p>
        </div>

        <div class="meta-box">
          <div>Periode: <span>${referralMonthFilter !== 'Semua' ? monthNamesIndo[referralMonthFilter] || referralMonthFilter : 'Semua Bulan'} — ${referralSemesterFilter !== 'Semua' ? `Semester ${referralSemesterFilter}` : 'Semua Semester'}</span></div>
          <div>Status Filter: <span>${referralStatusFilter}</span></div>
          <div>Prioritas Filter: <span>${referralPriorityFilter}</span></div>
          <div>Kelas Filter: <span>${referralClassFilter}</span></div>
          <div>Tanggal Cetak: <span>${currentDate}</span></div>
        </div>

        <div class="stats-grid">
          <div class="stat-item"><div class="num">${filteredReferrals.length}</div><div class="lbl">TOTAL RUJUKAN</div></div>
          <div class="stat-item"><div class="num" style="color:#d97706;">${countMenunggu}</div><div class="lbl">MENUNGGU</div></div>
          <div class="stat-item"><div class="num" style="color:#2563eb;">${countDiproses}</div><div class="lbl">DIPROSES</div></div>
          <div class="stat-item"><div class="num" style="color:#4f46e5;">${countDijadwalkan}</div><div class="lbl">DIJADWALKAN</div></div>
          <div class="stat-item"><div class="num" style="color:#16a34a;">${countSelesai}</div><div class="lbl">SELESAI</div></div>
          <div class="stat-item"><div class="num" style="color:#dc2626;">${countPrioTinggi}</div><div class="lbl">PRIORITAS TINGGI</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th style="width: 75px;">Tanggal</th>
              <th style="width: 65px;">NIS</th>
              <th style="width: 120px;">Nama Siswa</th>
              <th style="width: 50px;">Kelas</th>
              <th style="width: 110px;">Guru Pengirim</th>
              <th style="width: 90px;">Kategori</th>
              <th style="width: 60px;">Prioritas</th>
              <th>Detail Permasalahan</th>
              <th style="width: 70px;">Status</th>
              <th>Tindak Lanjut / Catatan BK</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="11" style="text-align:center;padding:12px;">Tidak ada data rujukan yang sesuai filter.</td></tr>'}
          </tbody>
        </table>

        ${referralIncludeSignatures ? `
          <div class="footer-signatures">
            <div class="sign-box">
              <p>Mengetahui,<br/>Kepala ${school.schoolName}</p>
              <div class="sign-space"></div>
              <p><b><u>${school.principalName}</u></b><br/>NIP. ${school.principalNip}</p>
            </div>
            <div class="sign-box">
              <p>${school.cityLocation}, ${currentDate}<br/>Guru Bimbingan Konseling (BK),</p>
              <div class="sign-space"></div>
              <p><b><u>${counselorName}</u></b><br/>NIP. ${counselorNip}</p>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  // Cetak Dokumen / Surat Tugas Home Visit (Kunjungan Rumah)
  const handlePrintHomeVisitDocument = (visit: HomeVisit, selectedPaperSize: 'A4' | 'F4' = hvPaperSize, customDocNumber?: string) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Gagal membuka jendela cetak. Mohon izinkan popup di browser Anda.');
      return;
    }

    const kopHeader1 = schoolConfig?.kopHeader1 || schoolConfig?.headerSubtitle || 'PEMERINTAH KABUPATEN PASURUAN / DINAS PENDIDIKAN';
    const schoolName = schoolConfig?.schoolName || schoolConfig?.headerAppName || 'SMP NEGERI 1 BEJI';
    const schoolAddr = schoolConfig?.schoolAddress || 'Jl. Raya Beji No. 123, Kabupaten Pasuruan';
    const schoolPhone = schoolConfig?.schoolPhone ? ` • Telp: ${schoolConfig.schoolPhone}` : '';
    const schoolEmail = schoolConfig?.schoolEmail ? ` • Email: ${schoolConfig.schoolEmail}` : '';
    const logoUrl = schoolConfig?.logoUrl || SCHOOL_LOGO_BASE64;
    const counselorName = visit.counselorName || schoolConfig?.counselorName || activeUser?.name || 'Guru BK';
    const counselorNip = schoolConfig?.counselorNip || '-';
    const cityLoc = schoolConfig?.cityLocation || 'Pasuruan';
    const formattedDate = new Date(visit.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const docNumber = customDocNumber || (printingHv?.id === visit.id ? printingHvDocNumber : null) || visit.documentNumber || `BK/${new Date().getFullYear()}/HV/${visit.id.substring(0, 6).toUpperCase()}`;

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Surat Tugas Kunjungan Rumah - ${visit.studentName}</title>
        <style id="page-style">
          @page {
            size: ${selectedPaperSize === 'F4' ? '215mm 330mm' : 'A4'} portrait;
            margin: 15mm;
          }
        </style>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif, 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            background: #fff;
            font-size: 13px;
            line-height: 1.6;
          }
          .no-print {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            padding: 12px 18px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            margin-bottom: 20px;
          }
          .paper-selector {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .btn-paper {
            background: #ffffff;
            color: #475569;
            border: 1px solid #cbd5e1;
            padding: 6px 14px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
          }
          .btn-paper.active {
            background: #ea580c;
            color: #ffffff;
            border-color: #c2410c;
            font-weight: bold;
          }
          .btn-print {
            background: #ea580c;
            color: #ffffff;
            border: none;
            padding: 10px 22px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background: #c2410c;
          }
          .kop-surat {
            position: relative;
            border-bottom: 4px double #000000;
            padding-bottom: 12px;
            margin-bottom: 20px;
            min-height: 75px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .kop-text-center {
            text-align: center;
            width: 100%;
            padding-left: 80px;
            padding-right: 10px;
          }
          .kop-header1 {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .kop-school-name {
            font-size: 20px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 4px 0;
          }
          .kop-address {
            font-size: 11px;
            color: #475569;
            margin: 0;
            font-style: italic;
          }
          .header-logo-left {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 72px;
            height: 72px;
            object-fit: contain;
          }
          .doc-title {
            text-align: center;
            margin-bottom: 24px;
          }
          .doc-title h2 {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: underline;
            margin: 0 0 4px 0;
          }
          .doc-title p {
            font-size: 12px;
            margin: 0;
            color: #334155;
          }
          .section-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px 18px;
            margin: 12px 0 18px 0;
          }
          .grid-table {
            width: 100%;
            border-collapse: collapse;
          }
          .grid-table td {
            padding: 5px 0;
            vertical-align: top;
          }
          .label-col {
            width: 220px;
            font-weight: bold;
            color: #334155;
          }
          .value-col {
            color: #0f172a;
          }
          .result-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 14px 18px;
            margin: 16px 0;
          }
          .signatures {
            margin-top: 40px;
            width: 100%;
            border-collapse: collapse;
          }
          .signatures td {
            width: 50%;
            text-align: center;
            vertical-align: top;
          }
          .signature-space {
            height: 75px;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div class="paper-selector">
            <span style="font-weight: bold; font-size: 12px; color: #334155;">📄 Ukuran Kertas:</span>
            <button class="btn-paper ${selectedPaperSize === 'A4' ? 'active' : ''}" onclick="switchPaper('A4', event)">📄 A4 (210 x 297 mm)</button>
            <button class="btn-paper ${selectedPaperSize === 'F4' ? 'active' : ''}" onclick="switchPaper('F4', event)">📜 F4 / Folio (215 x 330 mm)</button>
          </div>
          <button class="btn-print" onclick="window.print()">🖨️ Cetak Dokumen / Simpan PDF</button>
        </div>

        <div class="kop-surat">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo Sekolah" class="header-logo-left" />` : ''}
          <div class="kop-text-center">
            <h3 class="kop-header1">${kopHeader1}</h3>
            <h1 class="kop-school-name">${schoolName}</h1>
            <p class="kop-address">${schoolAddr}${schoolPhone}${schoolEmail}</p>
          </div>
        </div>

        <div class="doc-title">
          <h2>SURAT TUGAS KUNJUNGAN RUMAH (HOME VISIT)</h2>
          <p>Nomor: ${docNumber}</p>
        </div>

        <p>Yang bertanda tangan di bawah ini, Kepala Sekolah / Guru Bimbingan dan Konseling menugaskan:</p>

        <div class="section-box">
          <table class="grid-table">
            <tr>
              <td class="label-col">Nama Petugas / Guru BK</td>
              <td class="value-col">: <b>${counselorName}</b></td>
            </tr>
            <tr>
              <td class="label-col">NIP</td>
              <td class="value-col">: ${counselorNip}</td>
            </tr>
            <tr>
              <td class="label-col">Jabatan</td>
              <td class="value-col">: Guru Bimbingan dan Konseling (BK)</td>
            </tr>
          </table>
        </div>

        <p>Untuk melaksanakan Kunjungan Rumah (Home Visit) kepada siswa di bawah ini:</p>

        <div class="section-box">
          <table class="grid-table">
            <tr>
              <td class="label-col">Nama Siswa</td>
              <td class="value-col">: <b>${visit.studentName}</b></td>
            </tr>
            <tr>
              <td class="label-col">NIS / Kelas</td>
              <td class="value-col">: ${visit.studentNis} / Kelas ${visit.className}</td>
            </tr>
            <tr>
              <td class="label-col">Nama Orang Tua / Wali</td>
              <td class="value-col">: ${visit.parentName || '-'}</td>
            </tr>
            <tr>
              <td class="label-col">Hari / Tanggal Pelaksanaan</td>
              <td class="value-col">: <b>${formattedDate}</b></td>
            </tr>
            <tr>
              <td class="label-col">Tujuan Kunjungan</td>
              <td class="value-col">: ${visit.purpose}</td>
            </tr>
          </table>
        </div>

        ${visit.status === 'Selesai' ? `
          <div class="result-box">
            <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 13px; text-transform: uppercase;">Laporan Hasil Kunjungan Rumah & Kesepakatan:</h4>
            <p style="margin: 0 0 10px 0; color: #14532d;">${visit.visitResult || '-'}</p>
            ${visit.followUp ? `
              <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 10px 0;" />
              <h5 style="margin: 0 0 4px 0; color: #166534; font-size: 12px;">Rencana Tindak Lanjut:</h5>
              <p style="margin: 0; color: #14532d;">${visit.followUp}</p>
            ` : ''}
          </div>
        ` : ''}

        <p style="margin-top: 20px;">Demikian Surat Tugas ini dibuat agar dapat dilaksanakan dengan sebaik-baiknya dan penuh tanggung jawab.</p>

        <table class="signatures">
          <tr>
            <td>
              <p>Mengetahui/Menyetujui,<br/>Orang Tua / Wali Murid</p>
              <div class="signature-space"></div>
              <p><b>( ${visit.parentName || '................................'} )</b></p>
            </td>
            <td>
              <p>${cityLoc}, ${todayFormatted}<br/>Guru Bimbingan dan Konseling</p>
              <div class="signature-space"></div>
              <p><b>( ${counselorName} )</b><br/><span style="font-size: 11px; color: #64748b;">NIP. ${counselorNip}</span></p>
            </td>
          </tr>
        </table>

        <script>
          function switchPaper(size, evt) {
            document.getElementById('page-style').innerHTML = '@page { size: ' + (size === 'F4' ? '215mm 330mm' : 'A4') + ' portrait; margin: 15mm; }';
            document.querySelectorAll('.btn-paper').forEach(btn => btn.classList.remove('active'));
            if (evt && evt.currentTarget) {
              evt.currentTarget.classList.add('active');
            }
          }
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  // Unduh CSV Rujukan Mapel
  const handleExportReferralCSV = () => {
    const headers = [
      "No",
      "Tanggal Rujukan",
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Guru Pengirim",
      "Kategori Masalah",
      "Prioritas",
      "Detail Permasalahan",
      "Status",
      "Catatan BK / Feedback"
    ];

    const escapeCSV = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = reportFilteredReferrals.map((r, idx) => {
      const teacherName = teachers.find(t => t.id === r.teacherId)?.name || 'Guru Mapel';
      const dateFormatted = new Date(r.createdAt).toLocaleDateString('id-ID');
      return [
        idx + 1,
        escapeCSV(dateFormatted),
        escapeCSV(r.studentNis),
        escapeCSV(r.studentName),
        escapeCSV(r.className),
        escapeCSV(teacherName),
        escapeCSV(r.issueCategory),
        escapeCSV(r.priority),
        escapeCSV(r.issueDetails),
        escapeCSV(r.status),
        escapeCSV(r.feedback)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Rujukan_Guru_BK_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak Dokumen Permintaan Siswa
  const handlePrintRequestReport = () => {
    const school = getSchoolIdentity();
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const monthNamesIndo: Record<string, string> = {
      'Semua': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    const pageSizeStyle = requestPaperSize === 'F4' 
      ? (requestOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm') 
      : `A4 ${requestOrientation}`;

    const counselorName = school.counselorName;
    const counselorNip = school.counselorNip;
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let headerBorderCss = 'border-bottom: 3px double #0f172a;';
    let headerFontFamily = "'Segoe UI', Arial, sans-serif";
    if (school.kopModel === 'Klasik') {
      headerBorderCss = 'border-bottom: 4px solid #000; font-family: "Times New Roman", Times, serif;';
      headerFontFamily = "'Times New Roman', Times, serif";
    } else if (school.kopModel === 'Modern') {
      headerBorderCss = 'border-bottom: 4px solid #0d9488;';
    } else if (school.kopModel === 'Minimalis') {
      headerBorderCss = 'border-bottom: 1.5px solid #64748b;';
    }

    const countMenunggu = filteredRequests.filter(r => r.status === 'Menunggu').length;
    const countDijadwalkan = filteredRequests.filter(r => r.status === 'Dijadwalkan').length;
    const countDiproses = filteredRequests.filter(r => r.status === 'Diproses').length;
    const countSelesai = filteredRequests.filter(r => r.status === 'Selesai').length;

    const rowsHtml = filteredRequests.map((r, idx) => {
      const dateFormatted = new Date(r.requestedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      const studentNis = getStudentNis(r.studentId, r.studentName);
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${dateFormatted}</td>
          <td style="text-align: center;">${studentNis}</td>
          <td><b>${r.studentName}</b></td>
          <td style="text-align: center;">${r.className}</td>
          <td><b>${r.topic}</b></td>
          <td>${r.description}</td>
          <td style="text-align: center;"><b>${r.status}</b></td>
          <td>
            ${r.feedback ? `<div><b>BK:</b> ${r.feedback}</div>` : ''}
            ${r.scheduledAt ? `<div style="font-size:9px;color:#2563eb;margin-top:2px;"><b>Jadwal:</b> ${r.scheduledAt}</div>` : ''}
            ${!r.feedback && !r.scheduledAt ? '-' : ''}
          </td>
        </tr>
      `;
    }).join('');

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekap Permintaan Konseling Siswa</title>
        <style>
          @page {
            size: ${pageSizeStyle};
            margin: 10mm;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 10px;
            background: #fff;
            font-size: 11px;
          }
          .header {
            position: relative;
            border-bottom: 3px double #0f172a;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70px;
          }
          .header-logo {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            width: 100%;
            padding-left: 65px;
            padding-right: 65px;
          }
          .header-text h1 {
            font-size: 14px;
            margin: 0;
            text-transform: uppercase;
            color: #0f172a;
            font-weight: bold;
            line-height: 1.2;
          }
          .header-text h2 {
            font-size: 11px;
            margin: 2px 0 0 0;
            color: #334155;
          }
          .doc-title {
            text-align: center;
            margin-bottom: 12px;
          }
          .doc-title h3 {
            margin: 0;
            font-size: 14px;
            text-decoration: underline;
            text-transform: uppercase;
          }
          .doc-title p {
            margin: 3px 0 0 0;
            font-size: 11px;
            color: #475569;
            font-weight: bold;
          }
          .meta-box {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 10px;
            font-weight: bold;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }
          .stat-item {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
            text-align: center;
          }
          .stat-item .num { font-size: 13px; font-weight: bold; color: #4f46e5; }
          .stat-item .lbl { font-size: 9px; color: #64748b; font-weight: bold; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid #64748b;
            padding: 5px 6px;
            vertical-align: top;
          }
          th {
            background-color: #e2e8f0;
            color: #0f172a;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
          }
          .footer-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            font-size: 11px;
            page-break-inside: avoid;
          }
          .sign-box {
            text-align: center;
            width: 220px;
          }
          .sign-space { height: 50px; }
          .btn-print {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 8px 16px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right; margin-bottom: 12px;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak Dokumen / Simpan PDF (${requestPaperSize} - ${requestOrientation})</button>
        </div>

        <div class="header" style="${headerBorderCss} font-family: ${headerFontFamily};">
          <img src="${school.logoUrl}" alt="Logo Sekolah" class="header-logo" />
          <div class="header-text">
            <h1>${school.header1}</h1>
            <h1>${school.header2}</h1>
            <h1 style="font-size:16px;margin-top:2px;font-weight:bold;color:#0f172a;">${school.schoolName}</h1>
            <h2>${school.address}</h2>
          </div>
        </div>

        <div class="doc-title">
          <h3>LAPORAN REKAPITULASI PERMINTAAN KONSELING SISWA</h3>
          <p>GURU BK: ${counselorName.toUpperCase()} ${counselorNip !== '-' ? `(NIP: ${counselorNip})` : ''}</p>
          <p style="margin-top: 4px; font-weight: bold; color: #475569;">
            Periode: ${requestMonthFilter !== 'Semua' ? monthNamesIndo[requestMonthFilter] || requestMonthFilter : 'Semua Bulan'} — ${requestSemesterFilter !== 'Semua' ? `Semester ${requestSemesterFilter}` : 'Semua Semester'}
          </p>
        </div>

        <div class="meta-box">
          <div>Periode: <span>${requestMonthFilter !== 'Semua' ? monthNamesIndo[requestMonthFilter] || requestMonthFilter : 'Semua Bulan'} — ${requestSemesterFilter !== 'Semua' ? `Semester ${requestSemesterFilter}` : 'Semua Semester'}</span></div>
          <div>Status Filter: <span>${requestStatusFilter}</span></div>
          <div>Topik Filter: <span>${requestTopicFilter}</span></div>
          <div>Kelas Filter: <span>${requestClassFilter}</span></div>
          <div>Tanggal Cetak: <span>${currentDate}</span></div>
        </div>

        <div class="stats-grid">
          <div class="stat-item"><div class="num">${filteredRequests.length}</div><div class="lbl">TOTAL PERMINTAAN</div></div>
          <div class="stat-item"><div class="num" style="color:#d97706;">${countMenunggu}</div><div class="lbl">MENUNGGU</div></div>
          <div class="stat-item"><div class="num" style="color:#2563eb;">${countDijadwalkan}</div><div class="lbl">DIJADWALKAN</div></div>
          <div class="stat-item"><div class="num" style="color:#6366f1;">${countDiproses}</div><div class="lbl">DIPROSES</div></div>
          <div class="stat-item"><div class="num" style="color:#16a34a;">${countSelesai}</div><div class="lbl">SELESAI</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th style="width: 110px;">Waktu Permintaan</th>
              <th style="width: 75px;">NIS</th>
              <th style="width: 130px;">Nama Siswa</th>
              <th style="width: 50px;">Kelas</th>
              <th style="width: 100px;">Topik</th>
              <th>Deskripsi / Permasalahan</th>
              <th style="width: 75px;">Status</th>
              <th>Tanggapan BK & Jadwal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align:center;padding:12px;">Tidak ada data permintaan konseling yang sesuai filter.</td></tr>'}
          </tbody>
        </table>

        ${requestIncludeSignatures ? `
          <div class="footer-signatures">
            <div class="sign-box">
              <p>Mengetahui,<br/>Kepala ${school.schoolName}</p>
              <div class="sign-space"></div>
              <p><b><u>${school.principalName}</u></b><br/>NIP. ${school.principalNip}</p>
            </div>
            <div class="sign-box">
              <p>${school.cityLocation}, ${currentDate}<br/>Guru Bimbingan Konseling (BK),</p>
              <div class="sign-space"></div>
              <p><b><u>${counselorName}</u></b><br/>NIP. ${counselorNip}</p>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  // Unduh CSV Permintaan Siswa
  const handleExportRequestCSV = () => {
    const headers = [
      "No",
      "Waktu Permintaan",
      "NIS Siswa",
      "Nama Siswa",
      "Kelas",
      "Topik Konseling",
      "Deskripsi Permintaan",
      "Status",
      "Jadwal Konseling",
      "Tanggapan BK"
    ];

    const escapeCSV = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = filteredRequests.map((r, idx) => {
      const dateFormatted = new Date(r.requestedAt).toLocaleString('id-ID');
      return [
        idx + 1,
        escapeCSV(dateFormatted),
        escapeCSV(getStudentNis(r.studentId, r.studentName)),
        escapeCSV(r.studentName),
        escapeCSV(r.className),
        escapeCSV(r.topic),
        escapeCSV(r.description),
        escapeCSV(r.status),
        escapeCSV(r.scheduledAt),
        escapeCSV(r.feedback)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Permintaan_Konseling_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Home Visit Data for Report Modal
  const reportFilteredHomeVisits = React.useMemo(() => {
    return (homeVisits || []).filter(v => {
      if (hvReportStatusFilter !== 'Semua' && v.status !== hvReportStatusFilter) return false;
      if (hvReportClassFilter !== 'Semua' && v.className !== hvReportClassFilter) return false;
      
      const vDate = new Date(v.date);
      if (!isNaN(vDate.getTime())) {
        const monthVal = vDate.getMonth() + 1;
        if (hvReportMonthFilter !== 'Semua' && monthVal.toString().padStart(2, '0') !== hvReportMonthFilter) return false;
        
        if (hvReportSemesterFilter !== 'Semua') {
          const isGanjil = monthVal >= 7 && monthVal <= 12;
          const isGenap = monthVal >= 1 && monthVal <= 6;
          if (hvReportSemesterFilter === 'Ganjil' && !isGanjil) return false;
          if (hvReportSemesterFilter === 'Genap' && !isGenap) return false;
        }
      }
      return true;
    });
  }, [homeVisits, hvReportStatusFilter, hvReportClassFilter, hvReportMonthFilter, hvReportSemesterFilter]);

  // Unduh CSV Kunjungan Rumah
  const handleExportHvCSV = () => {
    const headers = [
      "No",
      "Tanggal Kunjungan",
      "NIS Siswa",
      "Nama Siswa",
      "Kelas",
      "Nama Orang Tua",
      "Tujuan Kunjungan",
      "Status",
      "Hasil Kunjungan",
      "Tindak Lanjut"
    ];

    const escapeCSV = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = reportFilteredHomeVisits.map((v, idx) => {
      const dateFormatted = new Date(v.date).toLocaleDateString('id-ID');
      return [
        idx + 1,
        escapeCSV(dateFormatted),
        escapeCSV(v.studentNis),
        escapeCSV(v.studentName),
        escapeCSV(v.className),
        escapeCSV(v.parentName),
        escapeCSV(v.purpose),
        escapeCSV(v.status),
        escapeCSV(v.visitResult),
        escapeCSV(v.followUp)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Kunjungan_Rumah_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak Dokumen Rekapitulasi Kunjungan Rumah
  const handlePrintHvReport = () => {
    const school = getSchoolIdentity();
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const monthNamesIndo: Record<string, string> = {
      'Semua': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    const pageSizeStyle = hvReportPaperSize === 'F4' 
      ? (hvReportOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm') 
      : `A4 ${hvReportOrientation}`;

    const counselorName = school.counselorName;
    const counselorNip = school.counselorNip;
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let headerBorderCss = 'border-bottom: 3px double #0f172a;';
    let headerFontFamily = "'Segoe UI', Arial, sans-serif";
    if (school.kopModel === 'Klasik') {
      headerBorderCss = 'border-bottom: 4px solid #000; font-family: "Times New Roman", Times, serif;';
      headerFontFamily = "'Times New Roman', Times, serif";
    } else if (school.kopModel === 'Modern') {
      headerBorderCss = 'border-bottom: 4px solid #0d9488;';
    } else if (school.kopModel === 'Minimalis') {
      headerBorderCss = 'border-bottom: 1.5px solid #64748b;';
    }

    const countDirencanakan = reportFilteredHomeVisits.filter(v => v.status === 'Direncanakan').length;
    const countSelesai = reportFilteredHomeVisits.filter(v => v.status === 'Selesai').length;

    const rowsHtml = reportFilteredHomeVisits.map((v, idx) => {
      const dateFormatted = new Date(v.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${dateFormatted}</td>
          <td>${v.studentNis}</td>
          <td><b>${v.studentName}</b></td>
          <td style="text-align: center;">${v.className}</td>
          <td>${v.parentName || '-'}</td>
          <td>${v.purpose}</td>
          <td style="text-align: center; font-weight: bold; color: ${v.status === 'Selesai' ? '#059669' : '#d97706'}">${v.status}</td>
          <td>${v.visitResult || '-'}</td>
          <td>${v.followUp || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekap Kunjungan Rumah</title>
        <style>
          @page {
            size: ${pageSizeStyle};
            margin: 15mm 20mm;
          }
          body {
            font-family: ${headerFontFamily};
            font-size: 11px;
            line-height: 1.4;
            color: #334155;
            margin: 0;
            padding: 0;
          }
          .header-container {
            position: relative;
            padding-bottom: 10px;
            margin-bottom: 20px;
            ${headerBorderCss}
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-logo {
            position: absolute;
            left: 0;
            top: 0;
            width: 55px;
            height: 55px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            padding: 0 60px;
          }
          .header-text h3 {
            margin: 0;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e293b;
          }
          .header-text h2 {
            margin: 2px 0 0 0;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f172a;
          }
          .header-text p {
            margin: 3px 0 0 0;
            font-size: 9px;
            color: #475569;
          }
          .title {
            text-align: center;
            margin-bottom: 15px;
          }
          .title h1 {
            font-size: 13px;
            font-weight: 900;
            text-decoration: underline;
            text-transform: uppercase;
            margin: 0;
            color: #0f172a;
          }
          .title p {
            margin: 3px 0 0 0;
            font-size: 10px;
            font-weight: bold;
            color: #475569;
          }
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 15px;
            display: flex;
            gap: 20px;
            font-size: 10px;
          }
          .summary-item {
            font-weight: 500;
          }
          .summary-item strong {
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            color: #1e293b;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .signature-col {
            text-align: center;
            width: 200px;
          }
          .signature-space {
            height: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img class="header-logo" src="${school.logoUrl}" alt="Logo" />
          <div class="header-text">
            <h3>${school.header1}</h3>
            <h3>${school.header2}</h3>
            <h2>${school.schoolName}</h2>
            <p>${school.address}</p>
          </div>
        </div>

        <div class="title">
          <h1>Laporan Rekapitulasi Kunjungan Rumah (Home Visit)</h1>
          <p>GURU BIMBINGAN KONSELING: ${counselorName.toUpperCase()}</p>
          <p style="margin-top: 4px; font-weight: bold; color: #475569;">
            Periode: ${hvReportMonthFilter !== 'Semua' ? monthNamesIndo[hvReportMonthFilter] || hvReportMonthFilter : 'Semua Bulan'} — ${hvReportSemesterFilter !== 'Semua' ? `Semester ${hvReportSemesterFilter}` : 'Semua Semester'}
          </p>
        </div>

        <div class="summary-box">
          <div class="summary-item">Total Kunjungan: <strong>${reportFilteredHomeVisits.length}</strong></div>
          <div class="summary-item">Direncanakan: <strong>${countDirencanakan}</strong></div>
          <div class="summary-item">Selesai: <strong>${countSelesai}</strong></div>
          <div class="summary-item">Kertas: <strong>${hvReportPaperSize} (${hvReportOrientation})</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">No</th>
              <th style="width: 10%;">Tanggal</th>
              <th style="width: 8%;">NIS</th>
              <th style="width: 15%;">Nama Siswa</th>
              <th style="width: 6%; text-align: center;">Kelas</th>
              <th style="width: 12%;">Orang Tua</th>
              <th style="width: 15%;">Tujuan Kunjungan</th>
              <th style="width: 8%; text-align: center;">Status</th>
              <th style="width: 13%;">Hasil Kunjungan</th>
              <th style="width: 10%;">Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colSpan="10" style="text-align: center; padding: 15px; color: #64748b;">Tidak ada data kunjungan rumah yang memenuhi kriteria filter.</td></tr>`}
          </tbody>
        </table>

        ${hvReportIncludeSignatures ? `
          <div class="signatures">
            <div class="signature-col">
              <p>Mengetahui,<br/>Kepala ${school.schoolName}</p>
              <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${school.principalName}</p>
              <p>NIP. ${school.principalNip}</p>
            </div>
            <div class="signature-col">
              <p>${school.cityLocation}, ${currentDate}<br/>Guru Bimbingan Konseling,</p>
              <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${counselorName}</p>
              <p>NIP. ${counselorNip}</p>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  // Filtered Counseling Sessions Data for Report Modal
  const reportFilteredSessions = React.useMemo(() => {
    return (sessions || []).filter(s => {
      // Action Filter
      if (sessionActionFilter !== 'Semua' && s.actionTaken !== sessionActionFilter) return false;
      
      // Class Filter
      if (sessionClassFilter !== 'Semua') {
        const student = students.find(stud => stud.nis === s.studentNis);
        const clsName = student ? classes.find(c => c.id === student.classId)?.name : s.className;
        if (clsName !== sessionClassFilter) return false;
      }
      
      // Date constraints
      const sDate = new Date(s.date);
      if (!isNaN(sDate.getTime())) {
        const monthVal = sDate.getMonth() + 1; // 1-12
        
        // Month Filter
        if (sessionMonthFilter !== 'Semua') {
          if (monthVal.toString().padStart(2, '0') !== sessionMonthFilter) return false;
        }
        
        // Semester Filter
        if (sessionSemesterFilter !== 'Semua') {
          const isGanjil = monthVal >= 7 && monthVal <= 12;
          const isGenap = monthVal >= 1 && monthVal <= 6;
          if (sessionSemesterFilter === 'Ganjil' && !isGanjil) return false;
          if (sessionSemesterFilter === 'Genap' && !isGenap) return false;
        }
      }
      
      return true;
    });
  }, [sessions, sessionActionFilter, sessionClassFilter, sessionMonthFilter, sessionSemesterFilter, students, classes]);

  // Unduh CSV Sesi Konseling
  const handleExportSessionCSV = () => {
    const headers = [
      "No",
      "Tanggal",
      "NIS Siswa",
      "Nama Siswa",
      "Kelas",
      "Layanan / Tindakan",
      "Konselor / Guru BK",
      "Catatan / Hasil Sesi",
      "Kategori",
      "Status"
    ];

    const escapeCSV = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = reportFilteredSessions.map((s, idx) => {
      const student = students.find(stud => stud.nis === s.studentNis);
      const clsName = student ? classes.find(c => c.id === student.classId)?.name : s.className;
      const sName = student ? student.name : s.studentName;
      const dateFormatted = new Date(s.date).toLocaleDateString('id-ID');
      return [
        idx + 1,
        escapeCSV(dateFormatted),
        escapeCSV(s.studentNis),
        escapeCSV(sName),
        escapeCSV(clsName),
        escapeCSV(s.actionTaken),
        escapeCSV(s.counselorName),
        escapeCSV(s.notes),
        escapeCSV(s.isABK ? `ABK (${s.abkNotes || 'Ya'})` : 'Reguler'),
        escapeCSV(s.status || 'Selesai')
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Sesi_Konseling_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak Dokumen Rekapitulasi Sesi Konseling
  const handlePrintSessionReport = () => {
    const school = getSchoolIdentity();
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const pageSizeStyle = sessionPaperSize === 'F4' 
      ? (sessionOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm') 
      : `A4 ${sessionOrientation}`;

    const counselorName = school.counselorName;
    const counselorNip = school.counselorNip;
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let headerBorderCss = 'border-bottom: 3px double #0f172a;';
    let headerFontFamily = "'Segoe UI', Arial, sans-serif";
    if (school.kopModel === 'Klasik') {
      headerBorderCss = 'border-bottom: 4px solid #000; font-family: "Times New Roman", Times, serif;';
      headerFontFamily = "'Times New Roman', Times, serif";
    } else if (school.kopModel === 'Modern') {
      headerBorderCss = 'border-bottom: 4px solid #0d9488;';
    } else if (school.kopModel === 'Minimalis') {
      headerBorderCss = 'border-bottom: 1.5px solid #64748b;';
    }

    const rowsHtml = reportFilteredSessions.map((s, idx) => {
      const student = students.find(stud => stud.nis === s.studentNis);
      const clsName = student ? classes.find(c => c.id === student.classId)?.name : s.className;
      const sName = student ? student.name : s.studentName;
      const dateFormatted = new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${dateFormatted}</td>
          <td>${s.studentNis}</td>
          <td><b>${sName}</b></td>
          <td style="text-align: center;">${clsName}</td>
          <td><b>${s.actionTaken}</b></td>
          <td>${s.counselorName}</td>
          <td>${s.notes}</td>
          <td style="text-align: center;">${s.isABK ? `<span style="color: #b91c1c; font-weight: bold;">ABK</span><br/><small>${s.abkNotes || ''}</small>` : '<span style="color: #475569;">Reguler</span>'}</td>
          <td style="text-align: center; font-weight: bold; color: ${s.status === 'Selesai' || !s.status ? '#059669' : '#d97706'}">${s.status || 'Selesai'}</td>
        </tr>
      `;
    }).join('');

    const monthNamesIndo: Record<string, string> = {
      'Semua': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };
    const semesterLabel = sessionSemesterFilter !== 'Semua' ? `Semester ${sessionSemesterFilter}` : 'Semua Semester';
    const monthLabel = monthNamesIndo[sessionMonthFilter] || 'Semua Bulan';
    const periodLabel = `Periode: ${monthLabel} — ${semesterLabel}`;

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekapitulasi Sesi Bimbingan & Konseling</title>
        <style>
          @page {
            size: ${pageSizeStyle};
            margin: 15mm 20mm;
          }
          body {
            font-family: ${headerFontFamily};
            font-size: 11px;
            line-height: 1.4;
            color: #334155;
            margin: 0;
            padding: 0;
          }
          .header-container {
            position: relative;
            padding-bottom: 10px;
            margin-bottom: 20px;
            ${headerBorderCss}
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-logo {
            position: absolute;
            left: 0;
            top: 0;
            width: 55px;
            height: 55px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            padding: 0 60px;
          }
          .header-text h3 {
            margin: 0;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e293b;
          }
          .header-text h2 {
            margin: 2px 0 0 0;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f172a;
          }
          .header-text p {
            margin: 3px 0 0 0;
            font-size: 9px;
            color: #475569;
          }
          .title {
            text-align: center;
            margin-bottom: 15px;
          }
          .title h1 {
            font-size: 13px;
            font-weight: 900;
            text-decoration: underline;
            text-transform: uppercase;
            margin: 0;
            color: #0f172a;
          }
          .title p {
            margin: 3px 0 0 0;
            font-size: 10px;
            font-weight: bold;
            color: #475569;
          }
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 15px;
            display: flex;
            gap: 20px;
            font-size: 10px;
          }
          .summary-item {
            font-weight: 500;
          }
          .summary-item strong {
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            color: #1e293b;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .signature-col {
            text-align: center;
            width: 200px;
          }
          .signature-space {
            height: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img class="header-logo" src="${school.logoUrl}" alt="Logo" />
          <div class="header-text">
            <h3>${school.header1}</h3>
            <h3>${school.header2}</h3>
            <h2>${school.schoolName}</h2>
            <p>${school.address}</p>
          </div>
        </div>

        <div class="title">
          <h1>Laporan Rekapitulasi Sesi Konseling & Log Jurnal BK</h1>
          <p>${periodLabel}</p>
        </div>

        <div class="summary-box">
          <div class="summary-item">Total Sesi: <strong>${reportFilteredSessions.length}</strong></div>
          <div class="summary-item">Layanan: <strong>${sessionActionFilter}</strong></div>
          <div class="summary-item">Kertas: <strong>${sessionPaperSize} (${sessionOrientation})</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">No</th>
              <th style="width: 10%;">Tanggal</th>
              <th style="width: 8%;">NIS</th>
              <th style="width: 15%;">Nama Siswa</th>
              <th style="width: 6%; text-align: center;">Kelas</th>
              <th style="width: 12%;">Tindakan / Sesi</th>
              <th style="width: 12%;">Konselor</th>
              <th style="width: 18%;">Hasil / Catatan Sesi</th>
              <th style="width: 10%; text-align: center;">Kategori</th>
              <th style="width: 6%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colSpan="10" style="text-align: center; padding: 15px; color: #64748b;">Tidak ada data sesi konseling yang memenuhi kriteria filter.</td></tr>`}
          </tbody>
        </table>

        ${sessionIncludeSignatures ? `
          <div class="signatures">
            <div class="signature-col">
              <p>Mengetahui,<br/>Kepala ${school.schoolName}</p>
              <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${school.principalName}</p>
              <p>NIP. ${school.principalNip}</p>
            </div>
            <div class="signature-col">
              <p>${school.cityLocation}, ${currentDate}<br/>Guru Bimbingan Konseling,</p>
              <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${counselorName}</p>
              <p>NIP. ${counselorNip}</p>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  // Filtered Career Plan Data for Report Modal
  const reportFilteredCareerPlans = React.useMemo(() => {
    return (careerPlans || []).filter(p => {
      if (careerReportClassFilter !== 'Semua') {
        const student = students.find(s => s.nis === p.studentNis);
        const clsName = student ? classes.find(c => c.id === student.classId)?.name : p.className;
        if (clsName !== careerReportClassFilter) return false;
      }
      
      const pDate = new Date(p.updatedAt);
      if (!isNaN(pDate.getTime())) {
        const monthVal = pDate.getMonth() + 1;
        if (careerMonthFilter !== 'Semua' && monthVal.toString().padStart(2, '0') !== careerMonthFilter) return false;
        
        if (careerSemesterFilter !== 'Semua') {
          const isGanjil = monthVal >= 7 && monthVal <= 12;
          const isGenap = monthVal >= 1 && monthVal <= 6;
          if (careerSemesterFilter === 'Ganjil' && !isGanjil) return false;
          if (careerSemesterFilter === 'Genap' && !isGenap) return false;
        }
      }
      return true;
    });
  }, [careerPlans, careerReportClassFilter, careerMonthFilter, careerSemesterFilter, students, classes]);

  // Unique years for ABK
  const uniqueAbkYears = React.useMemo(() => {
    const years = (sessions || [])
      .filter(s => s.isABK && s.date)
      .map(s => {
        const d = new Date(s.date);
        return isNaN(d.getTime()) ? '' : d.getFullYear().toString();
      })
      .filter(Boolean);
    return Array.from(new Set(['2026', '2025', '2027', ...years])).sort();
  }, [sessions]);

  // Filtered ABK Data for Report Modal
  const reportFilteredAbk = React.useMemo(() => {
    return (sessions || []).filter(s => s.isABK).filter(s => {
      // Class Filter
      if (abkReportClassFilter !== 'Semua') {
        const student = students.find(stud => stud.nis === s.studentNis);
        const clsName = student ? (classes.find(c => c.id === student.classId)?.name || student.className) : s.className;
        if (clsName !== abkReportClassFilter) return false;
      }
      
      const sDate = new Date(s.date);
      if (!isNaN(sDate.getTime())) {
        const yearVal = sDate.getFullYear().toString();
        const monthVal = sDate.getMonth() + 1;
        
        // Year Filter
        if (abkYearFilter !== 'Semua' && yearVal !== abkYearFilter) return false;
        
        // Semester Filter
        if (abkSemesterFilter !== 'Semua') {
          const isGanjil = monthVal >= 7 && monthVal <= 12;
          const isGenap = monthVal >= 1 && monthVal <= 6;
          if (abkSemesterFilter === 'Ganjil' && !isGanjil) return false;
          if (abkSemesterFilter === 'Genap' && !isGenap) return false;
        }
      }
      return true;
    });
  }, [sessions, abkReportClassFilter, abkYearFilter, abkSemesterFilter, students, classes]);

  // Unduh CSV Bimbingan Karir
  const handleExportCareerCSV = () => {
    const headers = [
      "No",
      "NIS Siswa",
      "Nama Siswa",
      "Kelas",
      "Minat / Karakteristik",
      "Kekuatan / Potensi",
      "Universitas Target",
      "Jurusan Target",
      "Target Karir",
      "Catatan Konselor"
    ];

    const escapeCSV = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = reportFilteredCareerPlans.map((p, idx) => {
      const student = students.find(s => s.nis === p.studentNis);
      const clsName = student ? classes.find(c => c.id === student.classId)?.name : p.className;
      const sName = student ? student.name : p.studentName;
      return [
        idx + 1,
        escapeCSV(p.studentNis),
        escapeCSV(sName),
        escapeCSV(clsName),
        escapeCSV((p.interests || []).join('; ')),
        escapeCSV((p.strengths || []).join('; ')),
        escapeCSV(p.targetUniversity),
        escapeCSV(p.targetMajor),
        escapeCSV(p.targetCareer),
        escapeCSV(p.counselorNotes)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Bimbingan_Karir_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak Dokumen Rekapitulasi Bimbingan Karir
  const handlePrintCareerReport = () => {
    const school = getSchoolIdentity();
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const monthNamesIndo: Record<string, string> = {
      'Semua': 'Semua Bulan',
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    const pageSizeStyle = careerPaperSize === 'F4' 
      ? (careerOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm') 
      : `A4 ${careerOrientation}`;

    const counselorName = school.counselorName;
    const counselorNip = school.counselorNip;
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let headerBorderCss = 'border-bottom: 3px double #0f172a;';
    let headerFontFamily = "'Segoe UI', Arial, sans-serif";
    if (school.kopModel === 'Klasik') {
      headerBorderCss = 'border-bottom: 4px solid #000; font-family: "Times New Roman", Times, serif;';
      headerFontFamily = "'Times New Roman', Times, serif";
    } else if (school.kopModel === 'Modern') {
      headerBorderCss = 'border-bottom: 4px solid #0d9488;';
    } else if (school.kopModel === 'Minimalis') {
      headerBorderCss = 'border-bottom: 1.5px solid #64748b;';
    }

    const rowsHtml = reportFilteredCareerPlans.map((p, idx) => {
      const student = students.find(s => s.nis === p.studentNis);
      const clsName = student ? classes.find(c => c.id === student.classId)?.name : p.className;
      const sName = student ? student.name : p.studentName;
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${p.studentNis}</td>
          <td><b>${sName}</b></td>
          <td style="text-align: center;">${clsName}</td>
          <td>${(p.interests || []).join(', ') || '-'}</td>
          <td>${(p.strengths || []).join(', ') || '-'}</td>
          <td>${p.targetUniversity || '-'}</td>
          <td>${p.targetMajor || '-'}</td>
          <td><b>${p.targetCareer || '-'}</b></td>
          <td>${p.counselorNotes || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekapitulasi Bimbingan Karir & Peminatan</title>
        <style>
          @page {
            size: ${pageSizeStyle};
            margin: 15mm 20mm;
          }
          body {
            font-family: ${headerFontFamily};
            font-size: 11px;
            line-height: 1.4;
            color: #334155;
            margin: 0;
            padding: 0;
          }
          .header-container {
            position: relative;
            padding-bottom: 10px;
            margin-bottom: 20px;
            ${headerBorderCss}
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-logo {
            position: absolute;
            left: 0;
            top: 0;
            width: 55px;
            height: 55px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            padding: 0 60px;
          }
          .header-text h3 {
            margin: 0;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e293b;
          }
          .header-text h2 {
            margin: 2px 0 0 0;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f172a;
          }
          .header-text p {
            margin: 3px 0 0 0;
            font-size: 9px;
            color: #475569;
          }
          .title {
            text-align: center;
            margin-bottom: 15px;
          }
          .title h1 {
            font-size: 13px;
            font-weight: 900;
            text-decoration: underline;
            text-transform: uppercase;
            margin: 0;
            color: #0f172a;
          }
          .title p {
            margin: 3px 0 0 0;
            font-size: 10px;
            font-weight: bold;
            color: #475569;
          }
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 15px;
            display: flex;
            gap: 20px;
            font-size: 10px;
          }
          .summary-item {
            font-weight: 500;
          }
          .summary-item strong {
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            color: #1e293b;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .signature-col {
            text-align: center;
            width: 200px;
          }
          .signature-space {
            height: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img class="header-logo" src="${school.logoUrl}" alt="Logo" />
          <div class="header-text">
            <h3>${school.header1}</h3>
            <h3>${school.header2}</h3>
            <h2>${school.schoolName}</h2>
            <p>${school.address}</p>
          </div>
        </div>

        <div class="title">
          <h1>Laporan Rekapitulasi Perencanaan Karir & Peminatan Siswa</h1>
          <p>GURU BIMBINGAN KONSELING: ${counselorName.toUpperCase()}</p>
          <p style="margin-top: 4px; font-weight: bold; color: #475569;">
            Periode: ${careerMonthFilter !== 'Semua' ? monthNamesIndo[careerMonthFilter] || careerMonthFilter : 'Semua Bulan'} — ${careerSemesterFilter !== 'Semua' ? `Semester ${careerSemesterFilter}` : 'Semua Semester'}
          </p>
        </div>

        <div class="summary-box">
          <div class="summary-item">Total Rekap Karir: <strong>${reportFilteredCareerPlans.length}</strong></div>
          <div class="summary-item">Kertas: <strong>${careerPaperSize} (${careerOrientation})</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 3%; text-align: center;">No</th>
              <th style="width: 8%;">NIS</th>
              <th style="width: 15%;">Nama Siswa</th>
              <th style="width: 6%; text-align: center;">Kelas</th>
              <th style="width: 15%;">Minat / Karakteristik</th>
              <th style="width: 15%;">Kekuatan / Potensi</th>
              <th style="width: 12%;">Univ Target</th>
               <th style="width: 10%;">Prodi Target</th>
              <th style="width: 12%;">Karir Impian</th>
              <th style="width: 14%;">Catatan BK</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colSpan="10" style="text-align: center; padding: 15px; color: #64748b;">Tidak ada data perencanaan karir siswa yang memenuhi kriteria filter.</td></tr>`}
          </tbody>
        </table>

        ${careerIncludeSignatures ? `
          <div class="signatures">
            <div class="signature-col">
              <p>Mengetahui,<br/>Kepala ${school.schoolName}</p>
               <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${school.principalName}</p>
              <p>NIP. ${school.principalNip}</p>
            </div>
            <div class="signature-col">
              <p>${school.cityLocation}, ${currentDate}<br/>Guru Bimbingan Konseling,</p>
               <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${counselorName}</p>
              <p>NIP. ${counselorNip}</p>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

  // Unduh CSV Data ABK
  const handleExportAbkCSV = () => {
    const headers = [
      "No",
      "NIS Siswa",
      "Nama Siswa",
      "Kelas",
      "Catatan Khusus ABK",
      "Tanggal Catat",
      "Status"
    ];

    const escapeCSV = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = reportFilteredAbk.map((s, idx) => {
      const student = students.find(stud => stud.nis === s.studentNis);
      const clsName = student ? (classes.find(c => c.id === student.classId)?.name || student.className) : s.className;
      const sName = student ? student.name : s.studentName;
      const dateFormatted = s.date ? new Date(s.date).toLocaleDateString('id-ID') : '-';
      return [
        idx + 1,
        escapeCSV(s.studentNis),
        escapeCSV(sName),
        escapeCSV(clsName),
        escapeCSV(s.abkNotes),
        escapeCSV(dateFormatted),
        escapeCSV(s.status || 'Pemantauan')
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Siswa_ABK_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cetak Dokumen Rekapitulasi Data ABK / Khusus
  const handlePrintAbkReport = () => {
    const school = getSchoolIdentity();
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const pageSizeStyle = abkPaperSize === 'F4' 
      ? (abkOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm') 
      : `A4 ${abkOrientation}`;

    const counselorName = school.counselorName;
    const counselorNip = school.counselorNip;
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let headerBorderCss = 'border-bottom: 3px double #0f172a;';
    let headerFontFamily = "'Segoe UI', Arial, sans-serif";
    if (school.kopModel === 'Klasik') {
      headerBorderCss = 'border-bottom: 4px solid #000; font-family: "Times New Roman", Times, serif;';
      headerFontFamily = "'Times New Roman', Times, serif";
    } else if (school.kopModel === 'Modern') {
      headerBorderCss = 'border-bottom: 4px solid #0d9488;';
    } else if (school.kopModel === 'Minimalis') {
      headerBorderCss = 'border-bottom: 1.5px solid #64748b;';
    }

    const countSelesai = reportFilteredAbk.filter(s => s.status === 'Selesai').length;
    const countTindakLanjut = reportFilteredAbk.filter(s => s.status === 'Butuh Tindak Lanjut' || s.status === 'Pemantauan' || !s.status).length;

    const rowsHtml = reportFilteredAbk.map((s, idx) => {
      const student = students.find(stud => stud.nis === s.studentNis);
      const clsName = student ? (classes.find(c => c.id === student.classId)?.name || student.className) : s.className;
      const sName = student ? student.name : s.studentName;
      const dateFormatted = s.date ? new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${s.studentNis}</td>
          <td><b>${sName}</b></td>
          <td style="text-align: center;">${clsName}</td>
          <td>${s.abkNotes || '-'}</td>
          <td style="text-align: center;">${dateFormatted}</td>
          <td style="text-align: center;"><b>${s.status || 'Pemantauan'}</b></td>
        </tr>
      `;
    }).join('');

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekapitulasi Data Siswa ABK / Perhatian Khusus</title>
        <style>
          @page {
            size: ${pageSizeStyle};
            margin: 15mm 20mm;
          }
          body {
            font-family: ${headerFontFamily};
            font-size: 11px;
            line-height: 1.4;
            color: #334155;
            margin: 0;
            padding: 0;
          }
          .header-container {
            position: relative;
            padding-bottom: 10px;
            margin-bottom: 20px;
            ${headerBorderCss}
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .header-logo {
            position: absolute;
            left: 0;
            top: 0;
            width: 55px;
            height: 55px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
            padding: 0 60px;
          }
          .header-text h3 {
            margin: 0;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e293b;
          }
          .header-text h2 {
            margin: 2px 0 0 0;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f172a;
          }
          .header-text p {
            margin: 3px 0 0 0;
            font-size: 9px;
            color: #475569;
          }
          .title {
            text-align: center;
            margin-bottom: 15px;
          }
          .title h1 {
            font-size: 13px;
            font-weight: 900;
            text-decoration: underline;
            text-transform: uppercase;
            margin: 0;
            color: #0f172a;
          }
          .title p {
            margin: 3px 0 0 0;
            font-size: 10px;
            font-weight: bold;
            color: #475569;
          }
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 15px;
            display: flex;
            gap: 20px;
            font-size: 10px;
          }
          .summary-item {
            font-weight: 500;
          }
          .summary-item strong {
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            color: #1e293b;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .signature-col {
            text-align: center;
            width: 200px;
          }
          .signature-space {
            height: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img class="header-logo" src="${school.logoUrl}" alt="Logo" />
          <div class="header-text">
            <h3>${school.header1}</h3>
            <h3>${school.header2}</h3>
            <h2>${school.schoolName}</h2>
            <p>${school.address}</p>
          </div>
        </div>

        <div class="title">
          <h1>Laporan Rekapitulasi Data Siswa ABK / Perhatian Khusus</h1>
          <p>GURU BIMBINGAN KONSELING: ${counselorName.toUpperCase()}</p>
          ${abkSemesterFilter !== 'Semua' || abkYearFilter !== 'Semua' ? `
            <p style="margin-top: 4px; font-weight: bold; color: #475569;">
              Periode: ${abkSemesterFilter !== 'Semua' ? `Semester ${abkSemesterFilter}` : ''} ${abkYearFilter !== 'Semua' ? `Tahun ${abkYearFilter}` : ''}
            </p>
          ` : ''}
        </div>

        <div class="summary-box">
          <div class="summary-item">Total ABK: <strong>${reportFilteredAbk.length}</strong></div>
          <div class="summary-item">Selesai: <strong>${countSelesai}</strong></div>
          <div class="summary-item">Pemantauan / Tindak Lanjut: <strong>${countTindakLanjut}</strong></div>
          <div class="summary-item">Kertas: <strong>${abkPaperSize} (${abkOrientation})</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">No</th>
              <th style="width: 12%; text-align: center;">NIS</th>
              <th style="width: 20%;">Nama Siswa</th>
              <th style="width: 10%; text-align: center;">Kelas</th>
              <th style="width: 33%;">Catatan Khusus ABK / Kendala</th>
              <th style="width: 10%; text-align: center;">Tgl Catat</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colSpan="7" style="text-align: center; padding: 15px; color: #64748b;">Tidak ada data siswa ABK / Perhatian Khusus yang memenuhi kriteria filter.</td></tr>`}
          </tbody>
        </table>

        ${abkIncludeSignatures ? `
          <div class="signatures">
            <div class="signature-col">
              <p>Mengetahui,<br/>Kepala ${school.schoolName}</p>
              <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${school.principalName}</p>
              <p>NIP. ${school.principalNip}</p>
            </div>
            <div class="signature-col">
              <p>${school.cityLocation}, ${currentDate}<br/>Guru Bimbingan Konseling,</p>
              <div class="signature-space"></div>
              <p style="font-weight: bold; text-decoration: underline;">${counselorName}</p>
              <p>NIP. ${counselorNip}</p>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
  };

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

  const sortedClasses = [...classes].sort((a, b) => {
    const gA = getGradeLevel(a.name);
    const gB = getGradeLevel(b.name);
    if (gA.level !== gB.level) return gA.level - gB.level;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const getSortedClassNames = (extraClassNames: string[] = []) => {
    const classNamesFromClasses = sortedClasses.map(c => c.name);
    const combined = Array.from(new Set([...classNamesFromClasses, ...extraClassNames.filter(Boolean)]));
    return combined.sort((a, b) => {
      const gA = getGradeLevel(a);
      const gB = getGradeLevel(b);
      if (gA.level !== gB.level) return gA.level - gB.level;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  const sortedStudents = [...students].sort((a, b) => {
    const classA = classes.find(c => c.id === a.classId)?.name || '';
    const classB = classes.find(c => c.id === b.classId)?.name || '';
    
    if (classA !== classB) {
      const gA = getGradeLevel(classA);
      const gB = getGradeLevel(classB);
      if (gA.level !== gB.level) return gA.level - gB.level;
      return classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' });
    }
    
    if (a.noAbsen != null && b.noAbsen != null) return a.noAbsen - b.noAbsen;
    return a.name.localeCompare(b.name);
  });

  const allClassNamesSorted = getSortedClassNames(students.map(s => {
    return classes.find(c => c.id === s.classId)?.name || s.className || '';
  }));

  const groupedStudentsByClass = allClassNamesSorted.map(className => {
    const list = sortedStudents.filter(s => {
      const cls = classes.find(c => c.id === s.classId)?.name || s.className || 'Tanpa Kelas';
      if (cls !== className) return false;
      if (studentSearchTerm.trim()) {
        const query = studentSearchTerm.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(query);
        const matchNis = s.nis.toLowerCase().includes(query);
        const matchClass = cls.toLowerCase().includes(query);
        return matchName || matchNis || matchClass;
      }
      return true;
    });

    return {
      className,
      students: list
    };
  }).filter(group => {
    if (selectedClassTab !== 'Semua' && group.className !== selectedClassTab) return false;
    if (studentSearchTerm.trim() && group.students.length === 0) return false;
    return true;
  });

  const abkGroupedStudentsByClass = allClassNamesSorted.map(className => {
    const list = sortedStudents.filter(s => {
      const cls = classes.find(c => c.id === s.classId)?.name || s.className || 'Tanpa Kelas';
      if (cls !== className) return false;
      if (abkSearchTerm.trim()) {
        const query = abkSearchTerm.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(query);
        const matchNis = s.nis.toLowerCase().includes(query);
        const matchClass = cls.toLowerCase().includes(query);
        return matchName || matchNis || matchClass;
      }
      return true;
    });

    return {
      className,
      students: list
    };
  }).filter(group => {
    if (abkSelectedClassTab !== 'Semua' && group.className !== abkSelectedClassTab) return false;
    if (abkSearchTerm.trim() && group.students.length === 0) return false;
    return true;
  });

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentNis || !sessionDate || !actionTaken) return;

    const student = students.find(s => s.nis === selectedStudentNis);
    if (!student) return;
    
    const className = classes.find(c => c.id === student.classId)?.name || 'N/A';

    if (editingSessionId) {
      if (onUpdateSession) {
        onUpdateSession(editingSessionId, {
          studentNis: student.nis,
          studentName: student.name,
          className: className,
          date: sessionDate,
          notes: sessionNotes,
          actionTaken: actionTaken,
          isABK: isABK,
          abkNotes: isABK ? abkNotes : undefined
        });
        toast.success('Catatan sesi konseling berhasil diperbarui!');
      } else {
        toast.error('Fungsi update sesi tidak tersedia.');
      }
    } else {
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
      toast.success('Sesi konseling berhasil dicatat!');

      if (selectedReferralId) {
        const refToUpdate = referrals.find(r => r.id === selectedReferralId);
        if(refToUpdate) onUpdateReferral({ ...refToUpdate, status: 'Selesai' });
      }
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
    setEditingSessionId(null);
  };

  const handleProcessReferral = (referral: CounselingReferral) => {
    onUpdateReferral({ ...referral, status: 'Diproses' });
    setSelectedStudentNis(referral.studentNis);
    setSelectedReferralId(referral.id);
    setActiveTab('sesi');
    setShowAddSession(true);
  };

  // Derived Data & Helper Functions for Referral Management
  const availableRefYears = Array.from(new Set(referrals.map(r => {
    const d = new Date(r.createdAt);
    return isNaN(d.getTime()) ? new Date().getFullYear().toString() : d.getFullYear().toString();
  }))).sort((a, b) => Number(b) - Number(a));

  const availableRefClasses = getSortedClassNames(referrals.map(r => r.className));

  const filteredReferrals = referrals.filter(ref => {
    // Status Filter
    if (refStatusFilter === 'aktif') {
      if (ref.status === 'Selesai' || ref.status === 'Ditolak') return false;
    } else if (refStatusFilter !== 'semua') {
      if (ref.status !== refStatusFilter) return false;
    }

    // Priority Filter
    if (refPriorityFilter !== 'Semua' && ref.priority !== refPriorityFilter) return false;

    // Class Filter
    if (refClassFilter !== 'Semua' && ref.className !== refClassFilter) return false;

    // Date/Year/Month Filter
    const refDate = new Date(ref.createdAt);
    if (!isNaN(refDate.getTime())) {
      if (refYearFilter !== 'Semua' && refDate.getFullYear().toString() !== refYearFilter) return false;
      if (refMonthFilter !== 'Semua') {
        const monthNum = (refDate.getMonth() + 1).toString().padStart(2, '0');
        if (monthNum !== refMonthFilter) return false;
      }
    }

    // Search Term Filter
    if (refSearchTerm.trim()) {
      const q = refSearchTerm.toLowerCase().trim();
      const teacherName = teachers.find(t => t.id === ref.teacherId)?.name || '';
      const matchName = ref.studentName.toLowerCase().includes(q);
      const matchNis = ref.studentNis.toLowerCase().includes(q);
      const matchClass = ref.className.toLowerCase().includes(q);
      const matchCategory = ref.issueCategory.toLowerCase().includes(q);
      const matchDetails = ref.issueDetails.toLowerCase().includes(q);
      const matchTeacher = teacherName.toLowerCase().includes(q);
      return matchName || matchNis || matchClass || matchCategory || matchDetails || matchTeacher;
    }

    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Grouping referrals by Month-Year for Accordion Group View
  const monthNamesID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const groupedReferralsByMonthYear = filteredReferrals.reduce<Record<string, { label: string; year: number; month: number; items: CounselingReferral[] }>>((acc, ref) => {
    const d = new Date(ref.createdAt);
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const year = validDate.getFullYear();
    const month = validDate.getMonth();
    const key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const label = `${monthNamesID[month]} ${year}`;

    if (!acc[key]) {
      acc[key] = { label, year, month, items: [] };
    }
    acc[key].items.push(ref);
    return acc;
  }, {});

  const groupedReferralKeysSorted = Object.keys(groupedReferralsByMonthYear).sort((a, b) => b.localeCompare(a));

  // Top Statistics
  const totalActiveRef = referrals.filter(r => r.status === 'Menunggu' || r.status === 'Diproses' || r.status === 'Dijadwalkan').length;
  const totalSelesaiRef = referrals.filter(r => r.status === 'Selesai').length;
  const totalHighPriorityRef = referrals.filter(r => r.priority === 'Tinggi' && r.status !== 'Selesai').length;
  const totalAllRef = referrals.length;

  // Derived Data & Helper Functions for Student Requests Management
  const availableReqYears = Array.from(new Set((studentCounselingRequests || []).map(r => {
    const d = new Date(r.requestedAt);
    return isNaN(d.getTime()) ? new Date().getFullYear().toString() : d.getFullYear().toString();
  }))).sort((a, b) => Number(b) - Number(a));

  const availableReqClasses = getSortedClassNames((studentCounselingRequests || []).map(r => r.className));
  const availableReqTopics = Array.from(new Set((studentCounselingRequests || []).map(r => r.topic).filter(Boolean))).sort();

  const filteredStudentRequests = (studentCounselingRequests || []).filter(req => {
    // Status Filter
    if (reqStatusFilter === 'aktif') {
      if (req.status === 'Selesai' || req.status === 'Ditolak') return false;
    } else if (reqStatusFilter !== 'semua') {
      if (req.status !== reqStatusFilter) return false;
    }

    // Topic Filter
    if (reqTopicFilter !== 'Semua' && req.topic !== reqTopicFilter) return false;

    // Class Filter
    if (reqClassFilter !== 'Semua' && req.className !== reqClassFilter) return false;

    // Date/Year/Month Filter
    const reqDate = new Date(req.requestedAt);
    if (!isNaN(reqDate.getTime())) {
      if (reqYearFilter !== 'Semua' && reqDate.getFullYear().toString() !== reqYearFilter) return false;
      if (reqMonthFilter !== 'Semua') {
        const monthNum = (reqDate.getMonth() + 1).toString().padStart(2, '0');
        if (monthNum !== reqMonthFilter) return false;
      }
    }

    // Search Term Filter
    if (reqSearchTerm.trim()) {
      const q = reqSearchTerm.toLowerCase().trim();
      const matchName = (req.studentName || '').toLowerCase().includes(q);
      const matchClass = (req.className || '').toLowerCase().includes(q);
      const matchTopic = (req.topic || '').toLowerCase().includes(q);
      const matchDesc = (req.description || '').toLowerCase().includes(q);
      const matchFeedback = (req.feedback || '').toLowerCase().includes(q);
      const matchSchedule = (req.scheduledAt || '').toLowerCase().includes(q);
      return matchName || matchClass || matchTopic || matchDesc || matchFeedback || matchSchedule;
    }

    return true;
  }).sort((a, b) => b.requestedAt - a.requestedAt);

  // Grouping requests by Month-Year for Accordion Group View
  const groupedRequestsByMonthYear = filteredStudentRequests.reduce<Record<string, { label: string; year: number; month: number; items: StudentCounselingRequest[] }>>((acc, req) => {
    const d = new Date(req.requestedAt);
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const year = validDate.getFullYear();
    const month = validDate.getMonth();
    const key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const label = `${monthNamesID[month]} ${year}`;

    if (!acc[key]) {
      acc[key] = { label, year, month, items: [] };
    }
    acc[key].items.push(req);
    return acc;
  }, {});

  const groupedRequestKeysSorted = Object.keys(groupedRequestsByMonthYear).sort((a, b) => b.localeCompare(a));

  // Top Statistics for Requests
  const totalActiveReq = (studentCounselingRequests || []).filter(r => r.status === 'Menunggu' || r.status === 'Diproses' || r.status === 'Dijadwalkan').length;
  const totalScheduledReq = (studentCounselingRequests || []).filter(r => r.status === 'Dijadwalkan').length;
  const totalSelesaiReq = (studentCounselingRequests || []).filter(r => r.status === 'Selesai').length;
  const totalAllReq = (studentCounselingRequests || []).length;


  const uniqueGrades = Array.from(new Set(sortedClasses.map(c => {
    const clean = c.name.replace(/^Kelas\s+/i, '').trim();
    const match = clean.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I|12|11|10|9|8|7|6|5|4|3|2|1)/i);
    return match ? match[1].toUpperCase() : clean.split(/[-\s]/)[0];
  }))).sort((a, b) => {
    const gradeOrder: Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12, 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
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
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner shrink-0">
            <Heart className="w-8 h-8 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Ruang Bimbingan & Konseling
            </h1>
            <p className="text-teal-100 font-medium mt-1 text-sm">Pantau rujukan, sesi konseling, dan cetak rekap laporan dengan Kop terstandar.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowKopConfigModal(true)}
          className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-2xl backdrop-blur-md border border-white/25 transition flex items-center gap-2 shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Settings className="w-4 h-4 text-emerald-200" />
          <span>Pengaturan Kop & Legalisasi</span>
        </button>
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
          onClick={() => setActiveTab('permintaan')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'permintaan' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Permintaan Siswa
          {studentCounselingRequests && studentCounselingRequests.filter(r => r.status === 'Menunggu').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {studentCounselingRequests.filter(r => r.status === 'Menunggu').length}
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
          onClick={() => setActiveTab('homevisit')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'homevisit' 
              ? 'bg-orange-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MapIcon className="w-4 h-4 text-orange-500" /> Kunjungan Rumah (Home Visit)
          {homeVisits.filter(v => v.status === 'Direncanakan').length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
              {homeVisits.filter(v => v.status === 'Direncanakan').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('karir')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'karir' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Bimbingan Karir
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
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'backup' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <HardDrive className="w-4 h-4" /> Backup & Restorasi DB
        </button>
      </div>

      
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Status Murid SMPN 1 BEJI</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Jadwal Home Visit</h3>
                <div className="text-3xl font-black text-orange-600">
                  {homeVisits.filter(v => v.status === 'Direncanakan').length}
                </div>
                <p className="text-xs text-slate-500 mt-2">Kunjungan rumah direncanakan</p>
                <button onClick={() => setActiveTab('homevisit')} className="mt-3 text-xs font-bold text-white bg-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-700 transition w-full flex items-center justify-center gap-1">
                  <MapIcon className="w-3.5 h-3.5" /> Buka Kalender HV
                </button>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Permintaan Siswa</h3>
                <div className="text-3xl font-black text-blue-600">
                  {studentCounselingRequests?.filter(r => r.status === 'Menunggu').length || 0}
                </div>
                <p className="text-xs text-slate-500 mt-2">Menunggu jadwal konseling</p>
                {(studentCounselingRequests?.filter(r => r.status === 'Menunggu').length || 0) > 0 && (
                  <button onClick={() => setActiveTab('permintaan')} className="mt-3 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition w-full">Lihat Permintaan</button>
                )}
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
                {Array.from<ClassItem>(new Map(sortedClasses.map(c => [c.name, c])).values())
                  .filter(c => selectedGrade === null || c.name.startsWith(selectedGrade + '-') || c.name.startsWith(selectedGrade + ' '))
                  .sort((a, b) => {
                    const gA = getGradeLevel(a.name);
                    const gB = getGradeLevel(b.name);
                    if (gA.level !== gB.level) return gA.level - gB.level;
                    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
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
                      const classAverages = sortedClasses.map(c => {
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
                      
                      return classAverages.sort((a, b) => {
                        const gA = getGradeLevel(a.name);
                        const gB = getGradeLevel(b.name);
                        if (gA.level !== gB.level) return gA.level - gB.level;
                        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                      });
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
      
      {activeTab === 'permintaan' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Summary Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div 
              onClick={() => setReqStatusFilter('aktif')}
              className={`p-4 rounded-3xl border transition cursor-pointer shadow-xs hover:shadow-md ${
                reqStatusFilter === 'aktif' 
                  ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/50' 
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${reqStatusFilter === 'aktif' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Perlu Tindakan
                </span>
                <div className={`p-2 rounded-2xl ${reqStatusFilter === 'aktif' ? 'bg-amber-600/40 text-white' : 'bg-amber-100 text-amber-700'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black">{totalActiveReq}</div>
              <p className={`text-[11px] font-semibold mt-1 ${reqStatusFilter === 'aktif' ? 'text-amber-100' : 'text-slate-500'}`}>
                Permintaan aktif dari siswa
              </p>
            </div>

            <div 
              onClick={() => setReqStatusFilter('Dijadwalkan')}
              className={`p-4 rounded-3xl border transition cursor-pointer shadow-xs hover:shadow-md ${
                reqStatusFilter === 'Dijadwalkan' 
                  ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/50' 
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${reqStatusFilter === 'Dijadwalkan' ? 'text-blue-100' : 'text-blue-700'}`}>
                  Dijadwalkan Sesi
                </span>
                <div className={`p-2 rounded-2xl ${reqStatusFilter === 'Dijadwalkan' ? 'bg-blue-700/40 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black">{totalScheduledReq}</div>
              <p className={`text-[11px] font-semibold mt-1 ${reqStatusFilter === 'Dijadwalkan' ? 'text-blue-100' : 'text-slate-500'}`}>
                Siap untuk konseling
              </p>
            </div>

            <div 
              onClick={() => setReqStatusFilter('Selesai')}
              className={`p-4 rounded-3xl border transition cursor-pointer shadow-xs hover:shadow-md ${
                reqStatusFilter === 'Selesai' 
                  ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400/50' 
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${reqStatusFilter === 'Selesai' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  Selesai Ditangani
                </span>
                <div className={`p-2 rounded-2xl ${reqStatusFilter === 'Selesai' ? 'bg-emerald-700/40 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black">{totalSelesaiReq}</div>
              <p className={`text-[11px] font-semibold mt-1 ${reqStatusFilter === 'Selesai' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Konseling tuntas
              </p>
            </div>

            <div 
              onClick={() => setReqStatusFilter('semua')}
              className={`p-4 rounded-3xl border transition cursor-pointer shadow-xs hover:shadow-md ${
                reqStatusFilter === 'semua' 
                  ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400/50' 
                  : 'bg-white text-slate-800 border-slate-200/80 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${reqStatusFilter === 'semua' ? 'text-indigo-100' : 'text-indigo-700'}`}>
                  Total Permintaan
                </span>
                <div className={`p-2 rounded-2xl ${reqStatusFilter === 'semua' ? 'bg-indigo-700/40 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black">{totalAllReq}</div>
              <p className={`text-[11px] font-semibold mt-1 ${reqStatusFilter === 'semua' ? 'text-indigo-100' : 'text-slate-500'}`}>
                Keseluruhan arsip siswa
              </p>
            </div>
          </div>

          {/* Main Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-5">
            {/* Header Title & Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">Permintaan Konseling Mandiri Siswa</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {filteredStudentRequests.length} Data
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Pengajuan bimbingan & konseling mandiri dari siswa dengan opsi penyaringan, rekapitulasi, dan tindak lanjut.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowRequestReportModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition shadow-xs flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>📊 Cetak Rekap Permintaan Siswa</span>
                </button>
              </div>
            </div>

            {/* Smart Control Bar: Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'aktif', label: '⚡ Perlu Tindakan', count: totalActiveReq, color: 'amber' },
                { id: 'Menunggu', label: '⏳ Menunggu', count: (studentCounselingRequests || []).filter(r => r.status === 'Menunggu').length, color: 'amber' },
                { id: 'Diproses', label: '⚙️ Diproses', count: (studentCounselingRequests || []).filter(r => r.status === 'Diproses').length, color: 'indigo' },
                { id: 'Dijadwalkan', label: '📅 Dijadwalkan', count: totalScheduledReq, color: 'blue' },
                { id: 'Selesai', label: '✅ Selesai', count: totalSelesaiReq, color: 'emerald' },
                { id: 'semua', label: '📁 Semua Arsip', count: totalAllReq, color: 'slate' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReqStatusFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition whitespace-nowrap flex items-center gap-2 border ${
                    reqStatusFilter === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    reqStatusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Smart Control Bar: Filters & View Modes */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
                {/* Search Field */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reqSearchTerm}
                    onChange={e => setReqSearchTerm(e.target.value)}
                    placeholder="Cari nama siswa, kelas, topik, pesan, atau jadwal..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {reqSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setReqSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Topik Filter */}
                  <select
                    value={reqTopicFilter}
                    onChange={e => setReqTopicFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Semua">📌 Semua Topik</option>
                    {availableReqTopics.map(top => (
                      <option key={top} value={top}>{top}</option>
                    ))}
                  </select>

                  {/* Kelas Filter */}
                  <select
                    value={reqClassFilter}
                    onChange={e => setReqClassFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Semua">🏫 Semua Kelas</option>
                    {availableReqClasses.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>

                  {/* Tahun Filter */}
                  <select
                    value={reqYearFilter}
                    onChange={e => setReqYearFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Semua">📅 Semua Tahun</option>
                    {availableReqYears.map(yr => (
                      <option key={yr} value={yr}>Tahun {yr}</option>
                    ))}
                  </select>

                  {/* Bulan Filter */}
                  <select
                    value={reqMonthFilter}
                    onChange={e => setReqMonthFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Semua">🗓️ Semua Bulan</option>
                    {monthNamesID.map((mName, mIdx) => {
                      const val = (mIdx + 1).toString().padStart(2, '0');
                      return <option key={val} value={val}>{mName}</option>;
                    })}
                  </select>

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setReqViewMode('group')}
                      title="Mode Accordion Bulan"
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        reqViewMode === 'group'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Grup Bulan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqViewMode('grid')}
                      title="Mode Kartu Grid"
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        reqViewMode === 'grid'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Kartu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqViewMode('table')}
                      title="Mode Tabel"
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        reqViewMode === 'table'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Tabel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Filter indicator */}
              {(reqStatusFilter !== 'aktif' || reqSearchTerm || reqTopicFilter !== 'Semua' || reqClassFilter !== 'Semua' || reqYearFilter !== 'Semua' || reqMonthFilter !== 'Semua') && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Filter Aktif: {filteredStudentRequests.length} data ditemukan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReqStatusFilter('aktif');
                      setReqSearchTerm('');
                      setReqTopicFilter('Semua');
                      setReqClassFilter('Semua');
                      setReqYearFilter('Semua');
                      setReqMonthFilter('Semua');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredStudentRequests.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">Tidak ada permintaan konseling ditemukan</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba ubah status filter, kata kunci pencarian, atau reset pilihan filter kelas/topik.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReqStatusFilter('semua');
                    setReqSearchTerm('');
                    setReqTopicFilter('Semua');
                    setReqClassFilter('Semua');
                    setReqYearFilter('Semua');
                    setReqMonthFilter('Semua');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Tampilkan Semua Data Arsip
                </button>
              </div>
            ) : (
              <>
                {/* 1. VIEW MODE: GROUP ACCORDION (MONTH - YEAR) */}
                {reqViewMode === 'group' && (
                  <div className="space-y-4">
                    {groupedRequestKeysSorted.map((key, groupIdx) => {
                      const group = groupedRequestsByMonthYear[key];
                      const isCollapsed = reqCollapsedGroups[key] ?? (groupIdx > 0 && reqStatusFilter === 'semua');
                      const activeGroupCount = group.items.filter(i => i.status === 'Menunggu' || i.status === 'Diproses' || i.status === 'Dijadwalkan').length;
                      const doneGroupCount = group.items.filter(i => i.status === 'Selesai').length;

                      return (
                        <div key={key} className="border border-slate-200/80 rounded-3xl overflow-hidden bg-white shadow-2xs">
                          {/* Accordion Group Header */}
                          <div
                            onClick={() => setReqCollapsedGroups(prev => ({ ...prev, [key]: !isCollapsed }))}
                            className="w-full bg-slate-100/70 hover:bg-slate-100 p-4 flex items-center justify-between text-left transition cursor-pointer border-b border-slate-200/60"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-2xs">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                  <span>{group.label}</span>
                                  <span className="text-xs px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-black border border-indigo-200">
                                    {group.items.length} Permintaan
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                  {activeGroupCount} perlu tindakan • {doneGroupCount} tuntas
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-indigo-600 font-bold hidden sm:inline">
                                {isCollapsed ? 'Buka Kelompok' : 'Tutup Kelompok'}
                              </span>
                              <div className="p-1.5 text-slate-500 bg-white rounded-xl border border-slate-200">
                                {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                              </div>
                            </div>
                          </div>

                          {/* Accordion Group Content */}
                          {!isCollapsed && (
                            <div className="p-4 bg-slate-50/50">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                {group.items.map(req => {
                                  const reqDate = new Date(req.requestedAt);
                                  const formattedDate = isNaN(reqDate.getTime())
                                    ? '-'
                                    : reqDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

                                  const topicColors: Record<string, string> = {
                                    'Pribadi': 'bg-amber-100 text-amber-800 border-amber-200',
                                    'Belajar': 'bg-blue-100 text-blue-800 border-blue-200',
                                    'Sosial': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                                    'Karir': 'bg-purple-100 text-purple-800 border-purple-200'
                                  };
                                  const topicBadgeClass = topicColors[req.topic] || 'bg-indigo-100 text-indigo-800 border-indigo-200';

                                  return (
                                    <div
                                      key={req.id}
                                      className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition space-y-3 flex flex-col justify-between"
                                    >
                                      <div className="space-y-2.5">
                                        {/* Card Top Metadata */}
                                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${topicBadgeClass}`}>
                                                {req.topic}
                                              </span>
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                                Kelas {req.className}
                                              </span>
                                            </div>
                                            <h4 className="font-extrabold text-slate-900 text-sm mt-1.5">{req.studentName}</h4>
                                          </div>

                                          <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                                              req.status === 'Menunggu' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                              req.status === 'Diproses' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                                              req.status === 'Dijadwalkan' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                              req.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                              'bg-rose-100 text-rose-800 border-rose-300'
                                            }`}>
                                              {req.status === 'Menunggu' ? '⏳ Menunggu' :
                                               req.status === 'Diproses' ? '⚙️ Diproses' :
                                               req.status === 'Dijadwalkan' ? '📅 Dijadwalkan' :
                                               req.status === 'Selesai' ? '✅ Selesai' : '❌ Ditolak'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                              {formattedDate}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                                          <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                                            "{req.description}"
                                          </p>
                                        </div>

                                        {/* Feedback / Schedule if any */}
                                        {(req.feedback || req.scheduledAt) && (
                                          <div className="bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-xl space-y-1">
                                            {req.scheduledAt && (
                                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>Jadwal: {req.scheduledAt}</span>
                                              </div>
                                            )}
                                            {req.feedback && (
                                              <p className="text-xs text-indigo-800 font-medium">
                                                <span className="font-bold">BK:</span> {req.feedback}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Action Controls */}
                                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setRespondingRequest(req);
                                              setCounselingResponse(req.feedback || '');
                                              setCounselingSchedule(req.scheduledAt || '');
                                              setCounselingStatus(req.status === 'Menunggu' ? 'Diproses' : req.status);
                                            }}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-2xs"
                                          >
                                            Detail & Tanggapi
                                          </button>

                                          {req.status === 'Menunggu' && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (onUpdateStudentCounselingRequest) {
                                                  onUpdateStudentCounselingRequest({
                                                    ...req,
                                                    status: 'Diproses'
                                                  });
                                                }
                                              }}
                                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition"
                                            >
                                              ⚡ Tindak Lanjuti
                                            </button>
                                          )}

                                          {(req.status === 'Dijadwalkan' || req.status === 'Diproses') && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (onUpdateStudentCounselingRequest) {
                                                  onUpdateStudentCounselingRequest({
                                                    ...req,
                                                    status: 'Selesai'
                                                  });
                                                }
                                              }}
                                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                                            >
                                              Tandai Selesai
                                            </button>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setDeletingRequestId(req.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                          title="Hapus record"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. VIEW MODE: GRID VIEW */}
                {reqViewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredStudentRequests.map(req => {
                      const reqDate = new Date(req.requestedAt);
                      const formattedDate = isNaN(reqDate.getTime())
                        ? '-'
                        : reqDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

                      return (
                        <div
                          key={req.id}
                          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                              <div>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg">
                                  {req.topic}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-sm mt-1">{req.studentName}</h4>
                                <p className="text-xs text-slate-500 font-medium">Kelas {req.className}</p>
                              </div>

                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                req.status === 'Menunggu' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                req.status === 'Diproses' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                req.status === 'Dijadwalkan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                req.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                'bg-rose-100 text-rose-800 border-rose-200'
                              }`}>
                                {req.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 italic">
                              "{req.description}"
                            </p>

                            {(req.scheduledAt || req.feedback) && (
                              <div className="bg-indigo-50/70 p-2 rounded-xl text-xs space-y-1 border border-indigo-100">
                                {req.scheduledAt && <p className="font-bold text-indigo-900">📅 {req.scheduledAt}</p>}
                                {req.feedback && <p className="text-indigo-800 font-medium">💬 {req.feedback}</p>}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setRespondingRequest(req);
                                  setCounselingResponse(req.feedback || '');
                                  setCounselingSchedule(req.scheduledAt || '');
                                  setCounselingStatus(req.status === 'Menunggu' ? 'Diproses' : req.status);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                              >
                                Tanggapi
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingRequestId(req.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. VIEW MODE: TABLE VIEW */}
                {reqViewMode === 'table' && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                          <th className="p-3 w-36">Tanggal & Waktu</th>
                          <th className="p-3">Nama & Kelas</th>
                          <th className="p-3 w-32">Topik</th>
                          <th className="p-3">Pesan Siswa & Tanggapan BK</th>
                          <th className="p-3 w-28">Status</th>
                          <th className="p-3 w-32 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredStudentRequests.map(req => {
                          const reqDate = new Date(req.requestedAt);
                          const formattedDate = isNaN(reqDate.getTime())
                            ? '-'
                            : reqDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

                          return (
                            <tr key={req.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 text-slate-500 font-medium">{formattedDate}</td>
                              <td className="p-3">
                                <span className="font-extrabold text-slate-900 block">{req.studentName}</span>
                                <span className="text-[10px] text-slate-500 font-bold">Kelas {req.className}</span>
                              </td>
                              <td className="p-3">
                                <span className="font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded border border-indigo-200">
                                  {req.topic}
                                </span>
                              </td>
                              <td className="p-3 space-y-1">
                                <p className="text-slate-700 italic">"{req.description}"</p>
                                {req.feedback && (
                                  <div className="text-[11px] text-indigo-700 bg-indigo-50 p-1.5 rounded border border-indigo-100">
                                    <span className="font-bold">BK:</span> {req.feedback}
                                    {req.scheduledAt && <span className="font-bold block mt-0.5">📅 Jadwal: {req.scheduledAt}</span>}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  req.status === 'Menunggu' ? 'bg-amber-100 text-amber-800' :
                                  req.status === 'Diproses' ? 'bg-indigo-100 text-indigo-800' :
                                  req.status === 'Dijadwalkan' ? 'bg-blue-100 text-blue-800' :
                                  req.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-3 text-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRespondingRequest(req);
                                    setCounselingResponse(req.feedback || '');
                                    setCounselingSchedule(req.scheduledAt || '');
                                    setCounselingStatus(req.status === 'Menunggu' ? 'Diproses' : req.status);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px]"
                                >
                                  Tanggapi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingRequestId(req.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg inline-block align-middle"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rujukan' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Summary Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div 
              onClick={() => setRefStatusFilter('aktif')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                refStatusFilter === 'aktif' 
                  ? 'bg-amber-500/10 border-amber-400 shadow-xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Perlu Tindakan</span>
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg"><Clock className="w-4 h-4" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalActiveRef}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Menunggu / Diproses</p>
            </div>

            <div 
              onClick={() => setRefStatusFilter('Selesai')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                refStatusFilter === 'Selesai' 
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Selesai Ditangani</span>
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><CheckCircle className="w-4 h-4" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalSelesaiRef}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sudah terselesaikan</p>
            </div>

            <div 
              onClick={() => { setRefPriorityFilter('Tinggi'); setRefStatusFilter('semua'); }}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                refPriorityFilter === 'Tinggi' 
                  ? 'bg-rose-500/10 border-rose-400 shadow-xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">Prioritas Tinggi</span>
                <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalHighPriorityRef}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Butuh atensi cepat</p>
            </div>

            <div 
              onClick={() => setRefStatusFilter('semua')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                refStatusFilter === 'semua' && refPriorityFilter === 'Semua' 
                  ? 'bg-teal-500/10 border-teal-400 shadow-xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wide">Total Arsip Rujukan</span>
                <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg"><FileText className="w-4 h-4" /></span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalAllRef}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Tersimpan dalam database</p>
            </div>
          </div>

          {/* Main Card Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5">
            {/* Header Title & Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">Daftar Rujukan Masalah Siswa</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Sistem pengelolaan & arsip rujukan siswa dari guru mata pelajaran ke Bimbingan Konseling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReferralReportModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>📊 Laporan Rekap Rujukan Mapel</span>
              </button>
            </div>

            {/* Smart Control Bar & Filters */}
            <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {/* Primary Status Tabs Filter */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin max-w-full">
                  {[
                    { id: 'aktif', label: '⚡ Aktif / Perlu Tindakan', count: totalActiveRef },
                    { id: 'Menunggu', label: '⏳ Menunggu', count: referrals.filter(r => r.status === 'Menunggu').length },
                    { id: 'Diproses', label: '⚙️ Diproses', count: referrals.filter(r => r.status === 'Diproses').length },
                    { id: 'Selesai', label: '✅ Selesai', count: totalSelesaiRef },
                    { id: 'semua', label: '📁 Semua / Arsip', count: totalAllRef }
                  ].map(tab => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => {
                        setRefStatusFilter(tab.id);
                        setRefPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                        refStatusFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${
                        refStatusFilter === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRefViewMode('group')}
                    title="Mode Grup Bulan / Tahun"
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      refViewMode === 'group' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grup Bulan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefViewMode('grid')}
                    title="Mode Kartu Grid"
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      refViewMode === 'grid' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefViewMode('table')}
                    title="Mode Tabel Ringkas"
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      refViewMode === 'table' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabel</span>
                  </button>
                </div>
              </div>

              {/* Detailed Filter Dropdowns & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-200/60">
                {/* Search Bar */}
                <div className="relative md:col-span-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={refSearchTerm}
                    onChange={e => { setRefSearchTerm(e.target.value); setRefPage(1); }}
                    placeholder="Cari nama siswa, NIS, kelas, guru, atau kategori..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  {refSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setRefSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Year Filter */}
                <div>
                  <select
                    value={refYearFilter}
                    onChange={e => { setRefYearFilter(e.target.value); setRefPage(1); }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Semua">📅 Semua Tahun</option>
                    {availableRefYears.map(yr => (
                      <option key={yr} value={yr}>Tahun {yr}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div>
                  <select
                    value={refMonthFilter}
                    onChange={e => { setRefMonthFilter(e.target.value); setRefPage(1); }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Semua">🗓️ Semua Bulan</option>
                    {monthNamesID.map((mName, idx) => {
                      const mVal = (idx + 1).toString().padStart(2, '0');
                      return <option key={mVal} value={mVal}>{mName}</option>;
                    })}
                  </select>
                </div>

                {/* Class Filter */}
                <div>
                  <select
                    value={refClassFilter}
                    onChange={e => { setRefClassFilter(e.target.value); setRefPage(1); }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Semua">🏫 Semua Kelas</option>
                    {availableRefClasses.map(cName => (
                      <option key={cName} value={cName}>Kelas {cName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Display Area */}
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50 space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-slate-600 font-bold text-sm">Tidak ada data rujukan ditemukan.</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Semua data rujukan tersimpan dengan aman di database. Coba sesuaikan filter status, tahun, atau kata kunci pencarian Anda.
                </p>
                {(refStatusFilter !== 'aktif' || refSearchTerm || refClassFilter !== 'Semua' || refYearFilter !== 'Semua' || refMonthFilter !== 'Semua') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRefStatusFilter('aktif');
                      setRefSearchTerm('');
                      setRefClassFilter('Semua');
                      setRefPriorityFilter('Semua');
                      setRefYearFilter('Semua');
                      setRefMonthFilter('Semua');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Reset Semua Filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* MODE 1: GROUPED BY MONTH/YEAR (ACCORDION) */}
                {refViewMode === 'group' && (
                  <div className="space-y-4">
                    {groupedReferralKeysSorted.map((key, groupIdx) => {
                      const group = groupedReferralsByMonthYear[key];
                      const isCollapsed = refCollapsedGroups[key] ?? (groupIdx > 0 && refStatusFilter === 'semua');
                      const activeInGroup = group.items.filter(i => i.status !== 'Selesai' && i.status !== 'Ditolak').length;
                      const doneInGroup = group.items.filter(i => i.status === 'Selesai').length;

                      return (
                        <div key={key} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                          {/* Accordion Group Header */}
                          <div 
                            onClick={() => setRefCollapsedGroups(prev => ({ ...prev, [key]: !isCollapsed }))}
                            className="p-4 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">
                                📅
                              </div>
                              <div>
                                <h3 className="font-black text-slate-900 text-sm">{group.label}</h3>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Total {group.items.length} Rujukan 
                                  {activeInGroup > 0 && <span className="text-amber-700 font-bold ml-1.5">• {activeInGroup} Aktif</span>}
                                  {doneInGroup > 0 && <span className="text-emerald-700 font-bold ml-1.5">• {doneInGroup} Selesai</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                                {isCollapsed ? 'Buka Arsip' : 'Tutup'}
                              </span>
                              <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Accordion Group Items */}
                          {!isCollapsed && (
                            <div className="p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {group.items.map(ref => {
                                const teacherName = teachers.find(t => t.id === ref.teacherId)?.name || 'Guru';
                                const formattedDate = new Date(ref.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                });

                                return (
                                  <div key={ref.id} className="border border-slate-200 rounded-2xl p-4 hover:border-teal-300 transition bg-white shadow-xs flex flex-col justify-between space-y-3">
                                    {/* Top Metadata */}
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                            ref.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                            ref.priority === 'Sedang' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                            'bg-blue-100 text-blue-700 border border-blue-200'
                                          }`}>
                                            Prioritas {ref.priority}
                                          </span>
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                            🏫 Kelas {ref.className}
                                          </span>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-base mt-1.5">{ref.studentName}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium">NIS: {ref.studentNis} • {formattedDate}</p>
                                      </div>

                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                                        ref.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        ref.status === 'Diproses' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        ref.status === 'Dijadwalkan' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                        'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}>
                                        {ref.status}
                                      </span>
                                    </div>

                                    {/* Issue Box */}
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                        <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>Kategori: {ref.issueCategory}</span>
                                      </div>
                                      <p className="text-slate-600 leading-relaxed font-medium line-clamp-3">{ref.issueDetails}</p>
                                      {ref.feedback && (
                                        <div className="mt-2 pt-2 border-t border-slate-200/80 text-indigo-900 bg-indigo-50/70 p-2 rounded-lg">
                                          <p className="font-bold text-[10px] uppercase tracking-wide text-indigo-700">Tanggapan BK:</p>
                                          <p className="text-[11px] font-medium text-indigo-950 mt-0.5">{ref.feedback}</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
                                      <div className="text-[11px] text-slate-500 font-medium truncate">
                                        Pengirim: <strong className="text-slate-800">{teacherName}</strong>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setRespondingReferral(ref);
                                            setRefResponseFeedback(ref.feedback || '');
                                            setRefResponseStatus(ref.status);
                                          }}
                                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                          title="Detail & Tanggapi"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Detail</span>
                                        </button>

                                        {ref.status === 'Menunggu' && (
                                          <button
                                            type="button"
                                            onClick={() => handleProcessReferral(ref)}
                                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition shadow-xs"
                                          >
                                            Tindak Lanjuti
                                          </button>
                                        )}

                                        {ref.status !== 'Selesai' && (
                                          <button
                                            type="button"
                                            onClick={() => onUpdateReferral({ ...ref, status: 'Selesai' })}
                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
                                            title="Tandai Selesai"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                        )}

                                        {onDeleteReferral && (
                                          <button
                                            type="button"
                                            onClick={() => setDeletingReferralId(ref.id)}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition"
                                            title="Hapus Record Rujukan"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODE 2: GRID VIEW */}
                {refViewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredReferrals.map(ref => {
                      const teacherName = teachers.find(t => t.id === ref.teacherId)?.name || 'Guru';
                      const formattedDate = new Date(ref.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });

                      return (
                        <div key={ref.id} className="border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition bg-white shadow-xs flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  ref.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                  ref.priority === 'Sedang' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                  'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                  Prioritas {ref.priority}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  Kelas {ref.className}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-slate-900 text-lg mt-2">{ref.studentName}</h4>
                              <p className="text-xs text-slate-500 font-medium">{ref.studentNis} • {formattedDate}</p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                              ref.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              ref.status === 'Diproses' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {ref.status}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Kategori: {ref.issueCategory}</span>
                            </div>
                            <p className="text-slate-600 font-medium">{ref.issueDetails}</p>
                            {ref.feedback && (
                              <div className="mt-2 pt-2 border-t border-slate-200 text-indigo-900 bg-indigo-50 p-2 rounded-lg">
                                <p className="font-bold text-[10px] uppercase text-indigo-700">Tanggapan BK:</p>
                                <p className="text-[11px] font-medium text-indigo-950 mt-0.5">{ref.feedback}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div className="text-[11px] text-slate-500 font-medium">
                              Pengirim: <strong>{teacherName}</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setRespondingReferral(ref);
                                  setRefResponseFeedback(ref.feedback || '');
                                  setRefResponseStatus(ref.status);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                              >
                                Detail / Update
                              </button>
                              {ref.status === 'Menunggu' && (
                                <button
                                  type="button"
                                  onClick={() => handleProcessReferral(ref)}
                                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition"
                                >
                                  Tindak Lanjuti
                                </button>
                              )}
                              {onDeleteReferral && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingReferralId(ref.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODE 3: TABLE VIEW */}
                {refViewMode === 'table' && (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Siswa</th>
                          <th className="p-3">Kelas</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Prioritas</th>
                          <th className="p-3">Pengirim</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredReferrals.map(ref => {
                          const teacherName = teachers.find(t => t.id === ref.teacherId)?.name || 'Guru';
                          const formattedDate = new Date(ref.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          });

                          return (
                            <tr key={ref.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 whitespace-nowrap font-medium text-slate-500">{formattedDate}</td>
                              <td className="p-3">
                                <p className="font-bold text-slate-900">{ref.studentName}</p>
                                <p className="text-[10px] text-slate-400">NIS: {ref.studentNis}</p>
                              </td>
                              <td className="p-3 font-semibold text-slate-700">{ref.className}</td>
                              <td className="p-3 font-medium text-slate-800">{ref.issueCategory}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  ref.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700' :
                                  ref.priority === 'Sedang' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {ref.priority}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{teacherName}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  ref.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                                  ref.status === 'Diproses' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {ref.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRespondingReferral(ref);
                                      setRefResponseFeedback(ref.feedback || '');
                                      setRefResponseStatus(ref.status);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                                    title="Detail / Tanggapi"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  {onDeleteReferral && (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingReferralId(ref.id)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sesi' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Log Sesi Konseling</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSessionReportModal(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-teal-600" /> Rekap Laporan
                </button>
                <button 
                  onClick={() => { resetForm(); setShowAddSession(true); }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2 px-4 rounded-xl transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Catat Sesi Baru
                </button>
              </div>
            </div>

            {showAddSession && (
              <form onSubmit={handleSaveSession} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-extrabold text-slate-800 text-base">
                    {editingSessionId ? '✏️ Edit Catatan Konseling' : 'Form Catatan Konseling'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSession(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Section Siswa Terpilih & Selection per Block Kelas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Pilih Siswa Konseling <span className="text-rose-500">*</span>
                    </label>
                    {selectedStudentNis && (
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-teal-600" /> Siswa Dipilih
                      </span>
                    )}
                  </div>

                  {/* Card Siswa Terpilih */}
                  {selectedStudentNis ? (() => {
                    const selectedStudentObj = students.find(s => s.nis === selectedStudentNis);
                    const selectedStudentClass = classes.find(c => c.id === selectedStudentObj?.classId)?.name || selectedStudentObj?.className || 'N/A';
                    return (
                      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 border-2 border-teal-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                            {selectedStudentObj?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-base">{selectedStudentObj?.name}</h4>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                                Kelas {selectedStudentClass}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-2">
                              <span>NIS: <strong className="text-slate-800">{selectedStudentObj?.nis}</strong></span>
                              {selectedStudentObj?.gender && (
                                <span className="text-slate-400">• Gender: {selectedStudentObj.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentNis('')}
                          className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Ganti Siswa</span>
                        </button>
                      </div>
                    );
                  })() : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-800 text-xs font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Silakan klik dan pilih nama siswa dari blok kelas di bawah ini.</span>
                    </div>
                  )}

                  {/* Visual Block Selector per Class */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Daftar Siswa Per-Blok Kelas</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Klik pada blok kelas untuk memilih siswa di kelas tersebut</p>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={studentSearchTerm}
                          onChange={e => setStudentSearchTerm(e.target.value)}
                          placeholder="Cari nama siswa / NIS..."
                          className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                        {studentSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setStudentSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Class Block Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => setSelectedClassTab('Semua')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                          selectedClassTab === 'Semua' 
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Semua Kelas ({sortedStudents.length})
                      </button>
                      {allClassNamesSorted.map(cn => {
                        const countInClass = sortedStudents.filter(s => (classes.find(c => c.id === s.classId)?.name || s.className) === cn).length;
                        return (
                          <button
                            type="button"
                            key={cn}
                            onClick={() => setSelectedClassTab(cn)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                              selectedClassTab === cn 
                                ? 'bg-teal-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cn} ({countInClass})
                          </button>
                        );
                      })}
                    </div>

                    {/* Class Blocks List */}
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                      {groupedStudentsByClass.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs font-bold text-slate-500">Tidak ada data siswa ditemukan.</p>
                          <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                        </div>
                      ) : (
                        groupedStudentsByClass.map(group => {
                          const isCollapsed = collapsedBlocks[group.className];
                          return (
                            <div 
                              key={group.className} 
                              className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition"
                            >
                              {/* Block Header */}
                              <div 
                                onClick={() => setCollapsedBlocks(prev => ({ ...prev, [group.className]: !prev[group.className] }))}
                                className="px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-200/70 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-xs text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-200">
                                    🏫 Kelas {group.className}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500">
                                    ({group.students.length} Siswa)
                                  </span>
                                </div>
                                <div className="text-slate-500 text-xs font-bold flex items-center gap-1">
                                  <span>{isCollapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
                                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </div>
                              </div>

                              {/* Block Body: Grid of Students */}
                              {!isCollapsed && (
                                <div className="p-3 bg-white">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {group.students.map(s => {
                                      const isSelected = selectedStudentNis === s.nis;
                                      return (
                                        <button
                                          type="button"
                                          key={s.id}
                                          onClick={() => setSelectedStudentNis(s.nis)}
                                          className={`p-2.5 rounded-xl text-left transition flex items-center gap-2.5 border ${
                                            isSelected
                                              ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                                          }`}
                                        >
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                                          }`}>
                                            {s.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                                              {s.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                              NIS: {s.nis}
                                            </p>
                                          </div>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-teal-600 shrink-0" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Secondary Grouped Select Dropdown */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Opsi alternatif (Dropdown Grup Kelas):</span>
                      <select
                        value={selectedStudentNis}
                        onChange={(e) => setSelectedStudentNis(e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 max-w-[240px]"
                      >
                        <option value="">-- Pilih Siswa --</option>
                        {groupedStudentsByClass.map(g => (
                          <optgroup key={g.className} label={`🏫 Kelas ${g.className}`}>
                            {g.students.map(s => (
                              <option key={s.id} value={s.nis}>
                                {s.name} (NIS: {s.nis})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Tanggal <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Tindakan <span className="text-rose-500">*</span></label>
                    <select
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-medium"
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
                  <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition">
                    {editingSessionId ? 'Perbarui Sesi' : 'Simpan Sesi'}
                  </button>
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentNis(session.studentNis);
                              setSessionDate(session.date);
                              setActionTaken(session.actionTaken);
                              setSessionNotes(session.notes);
                              setIsABK(!!session.isABK);
                              setAbkNotes(session.abkNotes || '');
                              setEditingSessionId(session.id);
                              setShowAddSession(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                            title="Edit Sesi Konseling"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={() => setDeletingSession(session)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Sesi Konseling"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-amber-500" /> Peminatan & Perencanaan Karir</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCareerReportModal(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition flex items-center gap-2 text-sm shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" /> Rekap Laporan
                </button>
                <button 
                  onClick={() => {
                    setEditingKarirId(null);
                    setKarirStudentNis('');
                    setKarirSelectedClass('Semua');
                    setKarirSearchQuery('');
                    setKarirTargetCareer('');
                    setKarirInterests([]);
                    setKarirStrengths([]);
                    setKarirUniversity('');
                    setKarirMajor('');
                    setKarirNotes('');
                    setShowKarirForm(true);
                  }} 
                  className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                <Plus className="w-4 h-4" /> Catatan Karir Baru
              </button>
            </div>
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
                  const className = student ? classes.find(c => c.id === student.classId)?.name : plan.className;
                  return (
                    <div key={plan.id} className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-slate-800">{student?.name || plan.studentName}</h3>
                            <p className="text-sm text-slate-500">{plan.studentNis} • Kelas {className}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                              Peminatan
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKarirId(plan.id);
                                setKarirStudentNis(plan.studentNis);
                                setKarirSelectedClass(className || 'Semua');
                                setKarirTargetCareer(plan.targetCareer || '');
                                setKarirInterests(plan.interests || []);
                                setKarirStrengths(plan.strengths || []);
                                setKarirUniversity(plan.targetUniversity || '');
                                setKarirMajor(plan.targetMajor || '');
                                setKarirNotes(plan.counselorNotes || '');
                                setShowKarirForm(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Edit Catatan Karir"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCareerPlan(plan)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Catatan Karir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mt-4">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Karir / Cita-cita</p>
                            <p className="text-sm font-bold text-slate-800">{plan.targetCareer || '-'}</p>
                          </div>

                          {(plan.targetUniversity || plan.targetMajor) && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              {plan.targetUniversity && (
                                <div><span className="text-slate-400 font-medium">Target Kampus:</span> <strong className="text-slate-700">{plan.targetUniversity}</strong></div>
                              )}
                              {plan.targetMajor && (
                                <div><span className="text-slate-400 font-medium">Jurusan:</span> <strong className="text-slate-700">{plan.targetMajor}</strong></div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Minat (Interests)</p>
                              <div className="flex flex-wrap gap-1">
                                {plan.interests && plan.interests.length > 0 ? plan.interests.map(i => (
                                  <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 font-medium text-[11px] rounded-md border border-amber-100">{i}</span>
                                )) : <span className="text-xs text-slate-400">-</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kekuatan (Strengths)</p>
                              <div className="flex flex-wrap gap-1">
                                {plan.strengths && plan.strengths.length > 0 ? plan.strengths.map(s => (
                                  <span key={s} className="px-2 py-0.5 bg-teal-50 text-teal-800 font-medium text-[11px] rounded-md border border-teal-100">{s}</span>
                                )) : <span className="text-xs text-slate-400">-</span>}
                              </div>
                            </div>
                          </div>
                          {plan.counselorNotes && (
                            <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                              <p className="text-xs font-bold text-amber-800 mb-1">Catatan Konselor</p>
                              <p className="text-xs text-amber-900 leading-relaxed">{plan.counselorNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KUNJUNGAN RUMAH (HOME VISIT) TAB */}
      {activeTab === 'homevisit' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <span className="bg-orange-500/30 text-orange-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-orange-400/30">
                  Layanan Bimbingan & Konseling
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-center gap-2">
                  <MapIcon className="w-8 h-8 text-amber-300" /> Penjadwalan & Log Kunjungan Rumah
                </h2>
                <p className="text-orange-100/90 text-sm mt-2 leading-relaxed">
                  Kelola jadwal kunjungan rumah (Home Visit) ke tempat tinggal siswa secara terstruktur. Pilih tanggal pada kalender interaktif untuk menyaring atau menambahkan rencana kunjungan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowHvReportModal(true)}
                  className="px-4 py-3.5 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-2xl border border-orange-500 transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-200" /> Rekap Laporan
                </button>
                <button
                  onClick={handleOpenHvConfigModal}
                  className="px-4 py-3.5 bg-orange-800/60 hover:bg-orange-800/90 text-white font-bold rounded-2xl border border-orange-400/40 transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-amber-200" /> Pengaturan Kop Surat
                </button>
                <button
                  onClick={() => {
                    setHvDate(hvSelectedDateFilter || todayYmd);
                    setShowAddHomeVisit(true);
                  }}
                  className="px-5 py-3.5 bg-white text-orange-700 font-extrabold rounded-2xl hover:bg-orange-50 transition flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <Plus className="w-5 h-5" /> Jadwalkan Kunjungan Baru
                </button>
              </div>
            </div>

            {/* Metrics pills inside banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-orange-500/40 pt-5">
              <div className="bg-black/15 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                <div className="text-2xl font-black">{homeVisits.length}</div>
                <div className="text-xs text-orange-100 font-medium">Total Record Kunjungan</div>
              </div>
              <div className="bg-black/15 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                <div className="text-2xl font-black text-amber-300">
                  {homeVisits.filter(v => v.status === 'Direncanakan').length}
                </div>
                <div className="text-xs text-orange-100 font-medium">Direncanakan (Mendatang)</div>
              </div>
              <div className="bg-black/15 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                <div className="text-2xl font-black text-emerald-300">
                  {homeVisits.filter(v => v.status === 'Selesai').length}
                </div>
                <div className="text-xs text-orange-100 font-medium">Selesai Ditindaklanjuti</div>
              </div>
              <div className="bg-black/15 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                <div className="text-2xl font-black text-white">
                  {homeVisits.filter(v => v.date?.substring(0, 10) === todayYmd).length}
                </div>
                <div className="text-xs text-orange-100 font-medium">Jadwal Hari Ini</div>
              </div>
            </div>

            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <MapPin className="w-64 h-64 text-white" />
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: INTERACTIVE CALENDAR (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <h3 className="font-extrabold text-slate-900 text-base">Kalender Kunjungan</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHvCalendarMonth(new Date(hvCalYear, hvCalMonth - 1, 1))}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-slate-800 px-2 py-1 bg-slate-100 rounded-lg">
                      {monthNamesIndo[hvCalMonth]} {hvCalYear}
                    </span>
                    <button
                      onClick={() => setHvCalendarMonth(new Date(hvCalYear, hvCalMonth + 1, 1))}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setHvCalendarMonth(new Date());
                        setHvSelectedDateFilter(todayYmd);
                      }}
                      className="ml-1 text-[11px] font-extrabold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition"
                    >
                      Hari Ini
                    </button>
                  </div>
                </div>

                {/* Day Headers (Mon - Sun) */}
                <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <div>Sen</div>
                  <div>Sel</div>
                  <div>Rab</div>
                  <div>Kam</div>
                  <div>Jum</div>
                  <div>Sab</div>
                  <div>Min</div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {hvCalendarCells.map((cell, idx) => {
                    const isSelected = hvSelectedDateFilter === cell.dateStr;
                    const countPlanned = cell.visits.filter(v => v.status === 'Direncanakan').length;
                    const countDone = cell.visits.filter(v => v.status === 'Selesai').length;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setHvSelectedDateFilter(prev => prev === cell.dateStr ? null : cell.dateStr);
                        }}
                        className={`min-h-[58px] p-1.5 rounded-2xl flex flex-col justify-between items-center transition relative border text-left ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-400/50'
                            : cell.isToday
                            ? 'bg-orange-50/80 text-orange-900 border-orange-300 font-black'
                            : cell.isCurrentMonth
                            ? 'bg-white text-slate-700 border-slate-100 hover:border-orange-200 hover:bg-orange-50/30'
                            : 'bg-slate-50/50 text-slate-300 border-transparent'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className={`text-xs font-bold ${cell.isToday && !isSelected ? 'text-orange-600 underline' : ''}`}>
                            {cell.dayNum}
                          </span>
                          {cell.isToday && !isSelected && (
                            <span className="text-[9px] font-extrabold text-orange-600 bg-orange-100 px-1 rounded-md">
                              K
                            </span>
                          )}
                        </div>

                        {/* Visit indicators */}
                        {cell.visits.length > 0 && (
                          <div className="w-full flex items-center justify-center gap-1 mt-1">
                            {countPlanned > 0 && (
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                  isSelected
                                    ? 'bg-amber-300 text-slate-900'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                                title={`${countPlanned} Direncanakan`}
                              >
                                {countPlanned}
                              </span>
                            )}
                            {countDone > 0 && (
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                  isSelected
                                    ? 'bg-emerald-300 text-slate-900'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                                title={`${countDone} Selesai`}
                              >
                                {countDone}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Info Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Tanggal Terpilih:
                    </span>
                    {hvSelectedDateFilter ? (
                      <button
                        onClick={() => setHvSelectedDateFilter(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                      >
                        Tampilkan Semua
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">Semua Tanggal</span>
                    )}
                  </div>

                  <div className="text-sm font-black text-slate-800 flex items-center justify-between">
                    <span>
                      {hvSelectedDateFilter
                        ? new Date(hvSelectedDateFilter).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Menampilkan seluruh jadwal'}
                    </span>
                    {hvSelectedDateFilter && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg">
                        {(visitsByDateMap[hvSelectedDateFilter] || []).length} Kunjungan
                      </span>
                    )}
                  </div>

                  {hvSelectedDateFilter && (
                    <button
                      onClick={() => {
                        setHvDate(hvSelectedDateFilter);
                        setShowAddHomeVisit(true);
                      }}
                      className="w-full mt-2 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Jadwalkan di Tanggal Ini ({hvSelectedDateFilter})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DAFTAR SISWA & JADWAL KUNJUNGAN (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hvSearch}
                      onChange={e => setHvSearch(e.target.value)}
                      placeholder="Cari nama siswa, NIS, kelas, atau nama ortu..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    {hvSearch && (
                      <button
                        onClick={() => setHvSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Class Filter */}
                  <div className="w-full sm:w-40">
                    <select
                      value={hvClassFilter}
                      onChange={e => setHvClassFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="Semua">Semua Kelas</option>
                      {sortedClasses.map(c => (
                        <option key={c.id} value={c.name}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Status:
                    </span>
                    {(['Semua', 'Direncanakan', 'Selesai'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setHvStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                          hvStatusFilter === st
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    Menampilkan <strong className="text-slate-900">{filteredHomeVisits.length}</strong> jadwal
                  </span>
                </div>

                {/* Banner if date filter is active */}
                {hvSelectedDateFilter && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-900 p-3 rounded-2xl text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      Menyaring tanggal: <strong>{new Date(hvSelectedDateFilter).toLocaleDateString('id-ID', { dateStyle: 'full' })}</strong>
                    </span>
                    <button
                      onClick={() => setHvSelectedDateFilter(null)}
                      className="text-orange-700 hover:text-orange-900 font-extrabold text-[11px] bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs cursor-pointer"
                    >
                      Hapus Filter Tanggal
                    </button>
                  </div>
                )}

                {/* Scheduled Students Cards */}
                {filteredHomeVisits.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                    <MapIcon className="w-12 h-12 text-orange-400 mx-auto" />
                    <div className="text-slate-700 font-bold text-sm">Tidak ditemukan jadwal kunjungan rumah</div>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Coba ubah kata kunci pencarian, pilihan kelas, atau pilih tanggal lain pada kalender di sebelah kiri.
                    </p>
                    <button
                      onClick={() => {
                        setHvDate(hvSelectedDateFilter || todayYmd);
                        setShowAddHomeVisit(true);
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Jadwalkan Kunjungan Baru
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                    {filteredHomeVisits.map(visit => {
                      const student = students.find(s => s.nis === visit.studentNis);
                      const isTodayVisit = visit.date?.substring(0, 10) === todayYmd;

                      return (
                        <div
                          key={visit.id}
                          className={`border rounded-2xl p-5 transition bg-white shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md ${
                            isTodayVisit ? 'border-orange-400 bg-orange-50/20 ring-1 ring-orange-200' : 'border-slate-200/80'
                          }`}
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-slate-900 text-base">{student?.name || visit.studentName}</h3>
                                  {isTodayVisit && (
                                    <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                      Hari Ini
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  NIS: <strong className="text-slate-700">{visit.studentNis}</strong> • Kelas: <strong className="text-slate-700">{student ? classes.find(c => c.id === student.classId)?.name : visit.className}</strong>
                                </p>
                              </div>

                              <span
                                className={`px-3 py-1 text-xs font-black rounded-xl border flex-shrink-0 ${
                                  visit.status === 'Selesai'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {visit.status}
                              </span>
                            </div>

                            {/* Card Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                              <div className="flex items-start gap-2 text-slate-700">
                                <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Jadwal Tanggal:</span>
                                  <span className="font-bold">
                                    {new Date(visit.date).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2 text-slate-700">
                                <Users className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Wali / Ortu Ditemui:</span>
                                  <span className="font-bold">{visit.parentName || '-'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Purpose */}
                            <div className="mt-3 bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tujuan Kunjungan:</span>
                              <p className="text-slate-700 font-medium leading-relaxed">{visit.purpose}</p>
                            </div>

                            {/* Result if Completed */}
                            {visit.status === 'Selesai' && (visit.visitResult || visit.followUp) && (
                              <div className="mt-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 text-xs space-y-2">
                                {visit.visitResult && (
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Hasil Kunjungan & Kesepakatan:</span>
                                    <p className="text-emerald-950 font-medium">{visit.visitResult}</p>
                                  </div>
                                )}
                                {visit.followUp && (
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Tindak Lanjut Konseling:</span>
                                    <p className="text-emerald-900 font-medium">{visit.followUp}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Card Actions */}
                          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            {visit.status === 'Direncanakan' && (
                              <button
                                onClick={() => {
                                  setShowFinishHvModal(visit);
                                  setFinishHvResult(visit.visitResult || '');
                                  setFinishHvFollowUp(visit.followUp || '');
                                }}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Tandai Selesai
                              </button>
                            )}

                            <button
                              onClick={() => handleStartEditHv(visit)}
                              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer border border-amber-200"
                              title="Edit Jadwal / Data Kunjungan"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" /> Edit
                            </button>

                            <button
                              onClick={() => handleDeleteHv(visit)}
                              className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition text-xs flex items-center gap-1 cursor-pointer border border-rose-200"
                              title="Hapus Jadwal Kunjungan"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>

                            <button
                              onClick={() => handleOpenPrintPreviewModal(visit)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                              title="Pratinjau Surat Tugas / Laporan Kunjungan"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" /> Pratinjau
                            </button>

                            <button
                              onClick={() => handlePrintHomeVisitDocument(visit)}
                              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Cetak Surat Tugas / Laporan Kunjungan Langsung"
                            >
                              <Printer className="w-3.5 h-3.5" /> Cetak PDF
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'abk' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-black text-slate-900">Pemantauan ABK / Perhatian Khusus</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAbkReportModal(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition flex items-center gap-2 text-sm shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-600" /> Rekap Laporan
                </button>
                <button 
                  onClick={() => {
                    setEditingAbkId(null);
                    setAbkStudentNis('');
                    setAbkInputNotes('');
                    setShowAddABK(true);
                  }} 
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                <Plus className="w-4 h-4" /> Tambah Data ABK
              </button>
            </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessions.filter(s => s.isABK).map(abkSession => {
                const student = students.find(s => s.nis === abkSession.studentNis);
                const displayClass = student ? (classes.find(c => c.id === student.classId)?.name || student.className) : abkSession.className;
                return (
                  <div key={abkSession.id} className="border-2 border-rose-100 bg-rose-50/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{student?.name || abkSession.studentName}</h4>
                          <p className="text-xs text-slate-500">{displayClass} • NIS {abkSession.studentNis}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAbkId(abkSession.id);
                              setAbkStudentNis(abkSession.studentNis);
                              setAbkInputNotes(abkSession.abkNotes || '');
                              setShowAddABK(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100/70 rounded-lg transition cursor-pointer"
                            title="Edit Data ABK"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAbk(abkSession)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-200/80 rounded-lg transition cursor-pointer"
                            title="Hapus Data ABK"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 bg-white p-3 rounded-xl border border-rose-100 text-sm font-medium text-rose-900 leading-relaxed shadow-2xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">Catatan Khusus / Kondisi ABK</p>
                        {abkSession.abkNotes || "Tanpa catatan spesifik"}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Tanggal: {abkSession.date ? new Date(abkSession.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                      <span className="font-semibold text-rose-700">Status: {abkSession.status || 'Pemantauan'}</span>
                    </div>
                  </div>
                );
              })}
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
                            <div key={`${nis}_${idx}`} className="flex justify-between items-center bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
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
                        {sortedClasses.map(c => (
                          <option key={c.id} value={c.id}>Kelas {c.name}</option>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">
                    {editingKarirId ? 'Edit Catatan Karir & Peminatan' : 'Tambah Catatan Karir & Peminatan'}
                  </h2>
                  <p className="text-xs text-amber-100 font-medium mt-0.5">Pilih Blok Kelas, tentukan siswa, lalu buat peminatan karir</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKarirForm(false)} 
                className="relative z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
              {/* STEP 1: PILIH BLOK KELAS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">1</span>
                    Pilih Blok Kelas
                  </label>
                  <span className="text-xs text-slate-500 font-bold">Total {sortedStudents.length} Siswa</span>
                </div>

                {/* Class Blocks Slider Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setKarirSelectedClass('Semua')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      karirSelectedClass === 'Semua'
                        ? 'bg-amber-600 border-amber-600 text-white shadow-md scale-[1.02]'
                        : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black">Semua Kelas</span>
                    <span className={`text-[11px] font-bold mt-1 ${karirSelectedClass === 'Semua' ? 'text-amber-100' : 'text-slate-500'}`}>
                      {sortedStudents.length} Siswa
                    </span>
                  </button>

                  {allClassNamesSorted.map(cn => {
                    const classStudentCount = sortedStudents.filter(s => (classes.find(c => c.id === s.classId)?.name || s.className) === cn).length;
                    const isSelected = karirSelectedClass === cn;
                    return (
                      <button
                        type="button"
                        key={cn}
                        onClick={() => setKarirSelectedClass(cn)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 border-amber-600 text-white shadow-md scale-[1.02]'
                            : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black">Kelas {cn}</span>
                        <span className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                          {classStudentCount} Siswa
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: PILIH SISWA */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">2</span>
                    Pilih Siswa ({karirSelectedClass === 'Semua' ? 'Semua Kelas' : `Kelas ${karirSelectedClass}`})
                  </label>

                  {/* Search Box */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={karirSearchQuery}
                      onChange={e => setKarirSearchQuery(e.target.value)}
                      placeholder="Cari nama atau NIS..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Student Selection Grid */}
                {(() => {
                  const filteredForKarir = sortedStudents.filter(s => {
                    const studentClass = classes.find(c => c.id === s.classId)?.name || s.className || '';
                    if (karirSelectedClass !== 'Semua' && studentClass !== karirSelectedClass) return false;
                    if (karirSearchQuery.trim()) {
                      const q = karirSearchQuery.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q);
                    }
                    return true;
                  });

                  if (filteredForKarir.length === 0) {
                    return (
                      <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs font-medium">
                        Tidak ada siswa yang ditemukan di kelas/pencarian ini.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50/50 scrollbar-thin">
                      {filteredForKarir.map(s => {
                        const clsName = classes.find(c => c.id === s.classId)?.name || s.className || '-';
                        const isSelected = karirStudentNis === s.nis;
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => setKarirStudentNis(s.nis)}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                                : 'bg-white hover:bg-amber-50/80 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold truncate">{s.name}</p>
                                <p className={`text-[10px] font-medium ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                                  Kelas {clsName} • NIS {s.nis}
                                </p>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-5 h-5 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* STEP 3: FORM DETAIL KARIR & PEMINATAN */}
              {karirStudentNis ? (() => {
                const selectedStudentObj = students.find(s => s.nis === karirStudentNis);
                const studentClassName = selectedStudentObj ? (classes.find(c => c.id === selectedStudentObj.classId)?.name || selectedStudentObj.className) : '';

                return (
                  <div className="space-y-5 pt-4 border-t border-slate-200 animate-fade-in">
                    {/* Active Student Info Header */}
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {selectedStudentObj?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{selectedStudentObj?.name}</p>
                          <p className="text-[11px] text-slate-600 font-medium">NIS: {selectedStudentObj?.nis} • Kelas {studentClassName}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-xs">
                        Siswa Terpilih
                      </span>
                    </div>

                    {/* Target Karir / Cita-cita */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                        Target Karir / Cita-cita Siswa
                      </label>
                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {PRESET_CAREERS.map(career => {
                          const isPicked = karirTargetCareer === career;
                          return (
                            <button
                              type="button"
                              key={career}
                              onClick={() => setKarirTargetCareer(career)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                                isPicked
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              + {career}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={karirTargetCareer}
                        onChange={e => setKarirTargetCareer(e.target.value)}
                        placeholder="Atau tuliskan cita-cita/karir impian lainnya..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                      />
                    </div>

                    {/* Minat (Interests) Tag Badges */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                        Minat & Bidang Peminatan (Klik untuk memilih)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_INTERESTS.map(interest => {
                          const isSelected = karirInterests.includes(interest);
                          return (
                            <button
                              type="button"
                              key={interest}
                              onClick={() => {
                                if (isSelected) {
                                  setKarirInterests(karirInterests.filter(i => i !== interest));
                                } else {
                                  setKarirInterests([...karirInterests, interest]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '} {interest}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Potensi & Kelebihan (Strengths) Tag Badges */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                        Potensi & Kelebihan Utama (Strengths)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_STRENGTHS.map(strength => {
                          const isSelected = karirStrengths.includes(strength);
                          return (
                            <button
                              type="button"
                              key={strength}
                              onClick={() => {
                                if (isSelected) {
                                  setKarirStrengths(karirStrengths.filter(s => s !== strength));
                                } else {
                                  setKarirStrengths([...karirStrengths, strength]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '} {strength}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rencana Lanjutan (PTN/PTS & Jurusan) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Perguruan Tinggi / Sekolah Lanjutan
                        </label>
                        <input
                          type="text"
                          value={karirUniversity}
                          onChange={e => setKarirUniversity(e.target.value)}
                          placeholder="Cth: UI, ITB, UGM, SMA/SMK Favorit"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Jurusan / Program Studi
                        </label>
                        <input
                          type="text"
                          value={karirMajor}
                          onChange={e => setKarirMajor(e.target.value)}
                          placeholder="Cth: Teknik Informatika, Kedokteran"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Catatan & Rekomendasi Konselor */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Catatan & Rekomendasi Guru BK (Hasil Tes Psikologi, Observasi, Dll)
                      </label>
                      <textarea
                        value={karirNotes}
                        onChange={e => setKarirNotes(e.target.value)}
                        rows={3}
                        placeholder="Misal: Berdasarkan observasi dan minat, siswa sangat menonjol di bidang koding dan memiliki daya analisis yang tinggi..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                );
              })() : (
                <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-center text-xs text-amber-800 font-bold">
                  👈 Silakan pilih salah satu siswa dari daftar di atas untuk melanjutkan mengisi data karir.
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {karirStudentNis ? 'Siswa telah dipilih. Siap disimpan.' : 'Silakan pilih siswa terlebih dahulu.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKarirForm(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!karirStudentNis) return;
                    const st = students.find(s => s.nis === karirStudentNis);
                    if (!st) return;

                    const planPayload = {
                      studentNis: st.nis,
                      studentName: st.name,
                      className: classes.find(c => c.id === st.classId)?.name || st.className || 'Unknown',
                      interests: karirInterests,
                      strengths: karirStrengths,
                      targetCareer: karirTargetCareer.trim() || 'Belum ditentukan',
                      targetUniversity: karirUniversity.trim() || undefined,
                      targetMajor: karirMajor.trim() || undefined,
                      counselorNotes: karirNotes
                    };

                    if (editingKarirId) {
                      if (onUpdateCareerPlan) {
                        onUpdateCareerPlan(editingKarirId, planPayload);
                        toast.success('Catatan Karir & Peminatan berhasil diperbarui!');
                      }
                    } else {
                      if (onAddCareerPlan) {
                        onAddCareerPlan(planPayload);
                        toast.success('Catatan Karir & Peminatan berhasil disimpan!');
                      }
                    }

                    setShowKarirForm(false);
                    setEditingKarirId(null);
                    setKarirStudentNis('');
                    setKarirTargetCareer('');
                    setKarirInterests([]);
                    setKarirStrengths([]);
                    setKarirUniversity('');
                    setKarirMajor('');
                    setKarirNotes('');
                  }}
                  disabled={!karirStudentNis}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition shadow-md text-xs cursor-pointer"
                >
                  {editingKarirId ? 'Perbarui Catatan Karir' : 'Simpan Catatan Karir'}
                </button>
              </div>
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
                  {sortedStudents.map(s => {
                    const clsName = classes.find(c => c.id === s.classId)?.name;
                    return <option key={s.id} value={s.nis}>{s.name} {clsName ? `(Kelas ${clsName})` : ''} - NIS {s.nis}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Kunjungan</label>
                <input type="date" value={hvDate} onChange={e => setHvDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nomor Surat (Opsional)</label>
                <input 
                  type="text" 
                  value={hvDocumentNumber} 
                  onChange={e => setHvDocumentNumber(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                  placeholder="Cth: BK/2026/HV/HV_WYW (Kosongkan untuk nomor otomatis)" 
                />
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
                    status: 'Direncanakan',
                    documentNumber: hvDocumentNumber.trim() || undefined
                  });
                  setShowAddHomeVisit(false);
                  setHvStudentNis('');
                  setHvDate('');
                  setHvPurpose('');
                  setHvParentName('');
                  setHvDocumentNumber('');
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

      {/* Modal Tandai Selesai Home Visit */}
      {showFinishHvModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h2 className="text-lg font-black text-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" /> Hasil Kunjungan Rumah (Home Visit)
              </h2>
              <button onClick={() => setShowFinishHvModal(null)} className="p-2 hover:bg-emerald-100 rounded-full text-emerald-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">{showFinishHvModal.studentName}</div>
                <div className="text-slate-500">NIS: {showFinishHvModal.studentNis} • Kelas: {showFinishHvModal.className}</div>
                <div className="text-slate-500 mt-1">Wali Ditemui: {showFinishHvModal.parentName}</div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Hasil Kunjungan & Kesepakatan dengan Ortu/Wali <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={finishHvResult}
                  onChange={e => setFinishHvResult(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Cth: Orang tua bersedia mendampingi jam belajar siswa di rumah dan memastikan kehadiran..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Rencana Tindak Lanjut Konseling Sekolah
                </label>
                <textarea
                  value={finishHvFollowUp}
                  onChange={e => setFinishHvFollowUp(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Cth: Pemantauan mingguan oleh Wali Kelas dan sesi konseling lanjutan tiap hari Jumat..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowFinishHvModal(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!finishHvResult.trim() || !onUpdateHomeVisit) return;
                  onUpdateHomeVisit(showFinishHvModal.id, {
                    status: 'Selesai',
                    visitResult: finishHvResult,
                    followUp: finishHvFollowUp
                  });
                  toast.success('Hasil Kunjungan Rumah berhasil disimpan!');
                  setShowFinishHvModal(null);
                  setFinishHvResult('');
                  setFinishHvFollowUp('');
                }}
                disabled={!finishHvResult.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-md"
              >
                Simpan & Tandai Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Kop & Format Surat Kunjungan Rumah */}
      {showHvConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-600 to-amber-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl">
                  <Settings className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Pengaturan Kop & Format Surat Kunjungan</h2>
                  <p className="text-xs text-orange-100">Atur Kop Dinas, Nama Sekolah, Alamat, dan Tanda Tangan Guru BK / Kepala Sekolah</p>
                </div>
              </div>
              <button onClick={() => setShowHvConfigModal(false)} className="p-2 hover:bg-white/20 rounded-full text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200 text-orange-900 font-medium">
                <p>Data di bawah ini akan ditampilkan secara otomatis pada Kop Surat Tugas dan Laporan Hasil Kunjungan Rumah (Home Visit) saat dicetak.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Kop Header Atas / Dinas Pendidikan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cfgKopHeader1}
                    onChange={e => setCfgKopHeader1(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Cth: PEMERINTAH KABUPATEN PASURUAN / DINAS PENDIDIKAN"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Nama Sekolah / Lembaga <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cfgSchoolName}
                    onChange={e => setCfgSchoolName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Cth: SMP NEGERI 1 BEJI"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-extrabold text-slate-700 mb-1">Alamat Lengkap Sekolah</label>
                  <input
                    type="text"
                    value={cfgSchoolAddress}
                    onChange={e => setCfgSchoolAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Cth: Jl. Raya Beji No. 123, Kabupaten Pasuruan"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Nomor Telepon Sekolah</label>
                  <input
                    type="text"
                    value={cfgSchoolPhone}
                    onChange={e => setCfgSchoolPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Cth: (0343) 123456"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Email / Website Sekolah</label>
                  <input
                    type="text"
                    value={cfgSchoolEmail}
                    onChange={e => setCfgSchoolEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Cth: bk.smpn1beji@sch.id"
                  />
                </div>

                <div className="border-t border-slate-200 md:col-span-2 pt-3 font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-600" /> Tanda Tangan & Legalitas
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Nama Guru BK (Konselor)</label>
                  <input
                    type="text"
                    value={cfgCounselorName}
                    onChange={e => setCfgCounselorName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Nama Terang & Gelar Guru BK"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">NIP Guru BK</label>
                  <input
                    type="text"
                    value={cfgCounselorNip}
                    onChange={e => setCfgCounselorNip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="NIP Guru BK"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={cfgPrincipalName}
                    onChange={e => setCfgPrincipalName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Nama Kepala Sekolah"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={cfgPrincipalNip}
                    onChange={e => setCfgPrincipalNip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="NIP Kepala Sekolah"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Kota / Kabupaten Surat</label>
                  <input
                    type="text"
                    value={cfgCityLocation}
                    onChange={e => setCfgCityLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Cth: Pasuruan"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowHvConfigModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveHvConfig}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-md flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Simpan Pengaturan Kop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Jadwal Kunjungan Rumah */}
      {editingHv && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <h2 className="text-lg font-black text-amber-900 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-amber-600" /> Edit Jadwal / Data Kunjungan Rumah
              </h2>
              <button onClick={() => setEditingHv(null)} className="p-2 hover:bg-amber-100 rounded-full text-amber-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editHvStudentNis}
                  onChange={e => setEditHvStudentNis(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {sortedStudents.map(s => {
                    const clsName = classes.find(c => c.id === s.classId)?.name;
                    return <option key={s.id} value={s.nis}>{s.name} {clsName ? `(Kelas ${clsName})` : ''} - NIS {s.nis}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Tanggal Kunjungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={editHvDate}
                  onChange={e => setEditHvDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Nomor Surat
                </label>
                <input
                  type="text"
                  value={editHvDocumentNumber}
                  onChange={e => setEditHvDocumentNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                  placeholder="Cth: BK/2026/HV/HV_WYW"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Nama Orang Tua / Wali yang Ditemui
                </label>
                <input
                  type="text"
                  value={editHvParentName}
                  onChange={e => setEditHvParentName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Cth: Bpk. Budi / Ibu Siti"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Petugas / Guru BK
                </label>
                <input
                  type="text"
                  value={editHvCounselorName}
                  onChange={e => setEditHvCounselorName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Nama Guru BK"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Tujuan Kunjungan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={editHvPurpose}
                  onChange={e => setEditHvPurpose(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Tujuan pelaksanaan kunjungan rumah..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Status Kunjungan
                </label>
                <select
                  value={editHvStatus}
                  onChange={e => setEditHvStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                >
                  <option value="Direncanakan">Direncanakan (Belum Dilaksanakan)</option>
                  <option value="Selesai">Selesai (Sudah Dilaksanakan)</option>
                </select>
              </div>

              {editHvStatus === 'Selesai' && (
                <>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Hasil Kunjungan & Kesepakatan
                    </label>
                    <textarea
                      value={editHvResult}
                      onChange={e => setEditHvResult(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Rencana Tindak Lanjut
                    </label>
                    <textarea
                      value={editHvFollowUp}
                      onChange={e => setEditHvFollowUp(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    ></textarea>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setEditingHv(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditHv}
                disabled={!editHvStudentNis || !editHvDate || !editHvPurpose.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition shadow-md"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Surat Tugas Home Visit */}
      {printingHv && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap gap-3 justify-between items-center print:hidden">
              <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-600" /> Pratinjau Surat Tugas & Laporan Home Visit
              </div>

              {/* Paper Size Option Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 hidden sm:inline">Ukuran Kertas:</span>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setHvPaperSize('A4')}
                    className={`px-3 py-1 font-extrabold text-xs rounded-lg transition ${
                      hvPaperSize === 'A4' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📄 A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setHvPaperSize('F4')}
                    className={`px-3 py-1 font-extrabold text-xs rounded-lg transition ${
                      hvPaperSize === 'F4' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📜 F4 / Folio
                  </button>
                </div>

                <button
                  onClick={() => handlePrintHomeVisitDocument(printingHv, hvPaperSize, printingHvDocNumber)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer ml-1"
                >
                  <Printer className="w-4 h-4" /> Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setPrintingHv(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content for Print */}
            <div className="p-8 space-y-6 text-slate-900 font-sans text-xs leading-relaxed bg-white print:p-0">
              {/* Kop Surat Header with Logo on Left Side */}
              <div className="relative border-b-4 border-double border-slate-900 pb-4 min-h-[85px] flex items-center justify-center">
                {(schoolConfig?.logoUrl || SCHOOL_LOGO_BASE64) && (
                  <img
                    src={schoolConfig?.logoUrl || SCHOOL_LOGO_BASE64}
                    alt="Logo Sekolah"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 object-contain"
                  />
                )}
                <div className="text-center pl-16 pr-2 w-full">
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900">
                    {schoolConfig?.kopHeader1 || schoolConfig?.headerSubtitle || 'PEMERINTAH KABUPATEN PASURUAN / DINAS PENDIDIKAN'}
                  </h2>
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 my-0.5">
                    {schoolConfig?.schoolName || schoolConfig?.headerAppName || 'SMP NEGERI 1 BEJI'}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium italic">
                    {schoolConfig?.schoolAddress || 'Jl. Raya Beji No. 123, Kabupaten Pasuruan'}
                    {schoolConfig?.schoolPhone ? ` • Telp: ${schoolConfig.schoolPhone}` : ''}
                    {schoolConfig?.schoolEmail ? ` • Email: ${schoolConfig.schoolEmail}` : ''}
                  </p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black uppercase underline tracking-wide text-slate-900">
                  SURAT TUGAS KUNJUNGAN RUMAH (HOME VISIT)
                </h3>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 pt-1 print:hidden">
                  <span>Nomor:</span>
                  <input
                    type="text"
                    value={printingHvDocNumber}
                    onChange={e => setPrintingHvDocNumber(e.target.value)}
                    className="px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg font-extrabold text-slate-900 text-xs text-center outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white w-64 shadow-xs"
                    placeholder="Cth: BK/2026/HV/HV_WYW"
                  />
                  {onUpdateHomeVisit && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateHomeVisit(printingHv.id, { documentNumber: printingHvDocNumber });
                        toast.success('Nomor Surat berhasil disimpan!');
                      }}
                      className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer"
                      title="Simpan Nomor Surat ke database"
                    >
                      Simpan
                    </button>
                  )}
                </div>
                <p className="hidden print:block text-[11px] font-bold text-slate-700">
                  Nomor: {printingHvDocNumber || printingHv.documentNumber || `BK/${new Date().getFullYear()}/HV/${printingHv.id.substring(0, 6).toUpperCase()}`}
                </p>
              </div>

              {/* Body */}
              <div className="space-y-4 text-xs">
                <p>Yang bertanda tangan di bawah ini, Guru Bimbingan dan Konseling sekolah menugaskan:</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama Petugas / Guru BK</span>
                    <span className="col-span-2 font-black text-slate-900">: {printingHv.counselorName || schoolConfig?.counselorName || activeUser?.name || 'Guru BK'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Jabatan</span>
                    <span className="col-span-2 text-slate-800">: Guru Bimbingan dan Konseling (BK)</span>
                  </div>
                </div>

                <p>Untuk melaksanakan kunjungan rumah (Home Visit) kepada siswa berikut:</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama Siswa</span>
                    <span className="col-span-2 font-black text-slate-900">: {printingHv.studentName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">NIS / Kelas</span>
                    <span className="col-span-2 text-slate-800">: {printingHv.studentNis} / Kelas {printingHv.className}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama Orang Tua / Wali</span>
                    <span className="col-span-2 text-slate-800">: {printingHv.parentName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Tanggal Pelaksanaan</span>
                    <span className="col-span-2 font-bold text-orange-700">
                      : {new Date(printingHv.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Tujuan Kunjungan</span>
                    <span className="col-span-2 text-slate-800">: {printingHv.purpose}</span>
                  </div>
                </div>

                {printingHv.status === 'Selesai' && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <span className="font-black text-emerald-900 uppercase block tracking-wider">Laporan Hasil Kunjungan:</span>
                    <p className="text-emerald-950 leading-relaxed">{printingHv.visitResult || '-'}</p>
                    {printingHv.followUp && (
                      <div className="pt-2 border-t border-emerald-200">
                        <span className="font-bold text-emerald-800 block">Rencana Tindak Lanjut:</span>
                        <p className="text-emerald-900">{printingHv.followUp}</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="pt-2">Demikian Surat Tugas ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-xs pt-8 border-t border-slate-200">
                <div className="text-center space-y-12">
                  <div>
                    <p className="text-slate-500">Orang Tua / Wali Murid</p>
                    <p className="font-bold text-slate-800 mt-1">{printingHv.parentName || '..........................'}</p>
                  </div>
                  <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
                  <p className="text-[11px] text-slate-400">(Tanda Tangan & Nama Terang)</p>
                </div>

                <div className="text-center space-y-12">
                  <div>
                    <p className="text-slate-500">{schoolConfig?.cityLocation || 'Beji'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-slate-500 mt-0.5">Guru Bimbingan dan Konseling</p>
                    <p className="font-bold text-slate-800 mt-1">{printingHv.counselorName || schoolConfig?.counselorName || activeUser?.name || 'Guru BK'}</p>
                  </div>
                  <div className="border-b border-slate-900 w-3/4 mx-auto"></div>
                  <p className="text-[11px] text-slate-400">NIP. {schoolConfig?.counselorNip || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tanggapi Permintaan Siswa */}
      {respondingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <div>
                <h2 className="text-xl font-black text-indigo-900">Tanggapi Permintaan Konseling</h2>
                <p className="text-sm text-indigo-700 mt-1">Siswa: {respondingRequest.studentName} (Kelas {respondingRequest.className})</p>
              </div>
              <button onClick={() => setRespondingRequest(null)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Topik: {respondingRequest.topic}</span>
                <p className="text-sm text-slate-700 mt-1">{respondingRequest.description}</p>
              </div>
              
              <div>
                <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={counselingStatus}
                  onChange={e => setCounselingStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dijadwalkan">Dijadwalkan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Pesan Tanggapan (Wajib)</label>
                <textarea
                  value={counselingResponse}
                  onChange={e => setCounselingResponse(e.target.value)}
                  placeholder="Tulis pesan atau arahan awal untuk siswa..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Jadwal Konseling (Opsional)</label>
                <input
                  type="text"
                  value={counselingSchedule}
                  onChange={e => setCounselingSchedule(e.target.value)}
                  placeholder="Contoh: Senin, 10 Okt 2026 jam 10:00 WIB"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Kosongkan jika hanya membalas pesan / menolak jadwal.</p>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setRespondingRequest(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  disabled={!counselingResponse.trim()}
                  onClick={() => {
                    if (onUpdateStudentCounselingRequest) {
                      onUpdateStudentCounselingRequest({
                        ...respondingRequest,
                        status: counselingStatus,
                        feedback: counselingResponse.trim(),
                        scheduledAt: counselingSchedule.trim() || undefined,
                        counselorName: activeUser?.name
                      });
                    }
                    setRespondingRequest(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Kirim Tanggapan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Tanggapi Rujukan Guru */}
      {respondingReferral && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50">
              <div>
                <h2 className="text-xl font-black text-teal-900">Tanggapi Rujukan Guru</h2>
                <p className="text-sm text-teal-700 mt-1">Siswa: {respondingReferral.studentName} (Kelas {respondingReferral.className})</p>
              </div>
              <button onClick={() => setRespondingReferral(null)} className="p-2 hover:bg-teal-100 rounded-full text-teal-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Kategori: {respondingReferral.issueCategory}</span>
                <p className="text-sm text-slate-700 mt-1">{respondingReferral.issueDetails}</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={referralStatus}
                  onChange={e => setReferralStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none mb-4"
                >
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dijadwalkan">Dijadwalkan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tanggapan / Catatan (Opsional)</label>
                <textarea
                  value={referralResponse}
                  onChange={e => setReferralResponse(e.target.value)}
                  placeholder="Tulis pesan untuk guru atau catatan pribadi terkait rujukan ini..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setRespondingReferral(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (onUpdateReferral) {
                      const updatedReferral = {
                         ...respondingReferral,
                         status: referralStatus,
                         feedback: referralResponse.trim()
                      };
                      // Since onUpdateReferral usually takes (id, status), we might need to modify App.tsx or add an update full object
                      // Let's assume there is onUpdateReferral that takes ID and status. But wait, it doesn't take feedback.
                      // We need to update App.tsx if onUpdateReferral does not accept feedback.
                      // Let's change onUpdateReferral to onUpdateReferralFull if we can, or just call onUpdateReferral.
                      onUpdateReferral(updatedReferral);
                    }
                    setRespondingReferral(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Tambah Data ABK */}
      {showAddABK && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 flex justify-between items-center bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-rose-950">
                    {editingAbkId ? 'Edit Data ABK / Perhatian Khusus' : 'Tambah Data ABK / Khusus'}
                  </h2>
                  <p className="text-xs text-rose-700 font-medium">Pilih siswa berdasarkan blok kelas dan masukkan catatan pemantauan khusus</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddABK(false);
                  setEditingAbkId(null);
                }} 
                className="p-2 hover:bg-rose-200/60 rounded-xl text-rose-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto scrollbar-thin">
              {/* Section Pilih Siswa Berbasis Blok Kelas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Pilih Siswa (ABK / Perhatian Khusus) <span className="text-rose-500">*</span>
                  </label>
                  {abkStudentNis && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-rose-600" /> Siswa Dipilih
                    </span>
                  )}
                </div>

                {/* Card Siswa Terpilih */}
                {abkStudentNis ? (() => {
                  const selectedStudentObj = students.find(s => s.nis === abkStudentNis);
                  const selectedStudentClass = classes.find(c => c.id === selectedStudentObj?.classId)?.name || selectedStudentObj?.className || 'N/A';
                  return (
                    <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border-2 border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                          {selectedStudentObj?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-base">{selectedStudentObj?.name}</h4>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                              Kelas {selectedStudentClass}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-2">
                            <span>NIS: <strong className="text-slate-800">{selectedStudentObj?.nis}</strong></span>
                            {selectedStudentObj?.gender && (
                              <span className="text-slate-400">• Gender: {selectedStudentObj.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAbkStudentNis('')}
                        className="text-xs font-bold px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Ganti Siswa</span>
                      </button>
                    </div>
                  );
                })() : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-800 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Silakan klik dan pilih nama siswa dari blok kelas di bawah ini.</span>
                  </div>
                )}

                {/* Visual Block Selector per Class for ABK */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Daftar Siswa Per-Blok Kelas</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Klik pada blok kelas untuk memilih siswa yang bersangkutan</p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={abkSearchTerm}
                        onChange={e => setAbkSearchTerm(e.target.value)}
                        placeholder="Cari nama siswa / NIS..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 font-medium"
                      />
                      {abkSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setAbkSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Class Block Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setAbkSelectedClassTab('Semua')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        abkSelectedClassTab === 'Semua' 
                          ? 'bg-rose-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Kelas ({sortedStudents.length})
                    </button>
                    {allClassNamesSorted.map(cn => {
                      const countInClass = sortedStudents.filter(s => (classes.find(c => c.id === s.classId)?.name || s.className) === cn).length;
                      return (
                        <button
                          type="button"
                          key={cn}
                          onClick={() => setAbkSelectedClassTab(cn)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                            abkSelectedClassTab === cn 
                              ? 'bg-rose-600 text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cn} ({countInClass})
                        </button>
                      );
                    })}
                  </div>

                  {/* Class Blocks List */}
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {abkGroupedStudentsByClass.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-500">Tidak ada data siswa ditemukan.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                      </div>
                    ) : (
                      abkGroupedStudentsByClass.map(group => {
                        const isCollapsed = abkCollapsedBlocks[group.className];
                        return (
                          <div 
                            key={group.className} 
                            className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition"
                          >
                            {/* Block Header */}
                            <div 
                              onClick={() => setAbkCollapsedBlocks(prev => ({ ...prev, [group.className]: !prev[group.className] }))}
                              className="px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-200/70 transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-rose-900 bg-rose-100 px-2.5 py-0.5 rounded-lg border border-rose-200">
                                  🏫 Kelas {group.className}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">
                                  ({group.students.length} Siswa)
                                </span>
                              </div>
                              <div className="text-slate-500 text-xs font-bold flex items-center gap-1">
                                <span>{isCollapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
                                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                              </div>
                            </div>

                            {/* Block Body: Grid of Students */}
                            {!isCollapsed && (
                              <div className="p-3 bg-white">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {group.students.map(s => {
                                    const isSelected = abkStudentNis === s.nis;
                                    return (
                                      <button
                                        type="button"
                                        key={s.id}
                                        onClick={() => setAbkStudentNis(s.nis)}
                                        className={`p-2.5 rounded-xl text-left transition flex items-center gap-2.5 border ${
                                          isSelected
                                            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                          isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                          {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-rose-950' : 'text-slate-800'}`}>
                                            {s.name}
                                          </p>
                                          <p className="text-[10px] text-slate-500 font-medium">
                                            NIS: {s.nis}
                                          </p>
                                        </div>
                                        {isSelected && (
                                          <Check className="w-4 h-4 text-rose-600 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Secondary Grouped Select Dropdown */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Opsi alternatif (Dropdown Grup Kelas):</span>
                    <select
                      value={abkStudentNis}
                      onChange={(e) => setAbkStudentNis(e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-rose-500 max-w-[240px]"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {abkGroupedStudentsByClass.map(g => (
                        <optgroup key={g.className} label={`🏫 Kelas ${g.className}`}>
                          {g.students.map(s => (
                            <option key={s.id} value={s.nis}>
                              {s.name} (NIS: {s.nis})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Catatan ABK / Kondisi */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Catatan ABK / Kondisi Khusus <span className="text-rose-500">*</span>
                </label>
                
                {/* Preset Quick Tags */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Lambat Belajar (Slow Learner)',
                    'ADHD / Konsentrasi',
                    'Kesulitan Belajar Spesifik',
                    'Gangguan Emosi & Perilaku',
                    'Low Vision / Tunanetra',
                    'Tunarungu',
                    'Tuna Anggota Tubuh / Fisik',
                    'Bakat / Cerdas Istimewa',
                    'Kondisi Medis Khusus'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (abkInputNotes.includes(tag)) return;
                        setAbkInputNotes(prev => prev ? `${prev}, ${tag}` : tag);
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  value={abkInputNotes}
                  onChange={e => setAbkInputNotes(e.target.value)}
                  placeholder="Deskripsikan kondisi, diagnosa, gaya belajar khusus, atau bentuk pendampingan yang diperlukan..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddABK(false);
                  setEditingAbkId(null);
                }}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const st = students.find(s => s.nis === abkStudentNis);
                  if(!st) return;

                  if (editingAbkId) {
                    if (onUpdateSession) {
                      onUpdateSession(editingAbkId, {
                        studentNis: st.nis,
                        studentName: st.name,
                        className: classes.find(c => c.id === st.classId)?.name || st.className || 'Unknown',
                        isABK: true,
                        abkNotes: abkInputNotes,
                      });
                      toast.success('Data ABK / Khusus berhasil diperbarui!');
                    }
                  } else {
                    if (onSaveSession) {
                      onSaveSession({
                        studentNis: st.nis,
                        studentName: st.name,
                        className: classes.find(c => c.id === st.classId)?.name || st.className || 'Unknown',
                        date: new Date().toISOString().split('T')[0],
                        counselorName: activeUser?.name || 'Guru BK',
                        notes: 'Terdaftar sebagai ABK / Perhatian Khusus',
                        actionTaken: 'Pemantauan Khusus',
                        isABK: true,
                        abkNotes: abkInputNotes,
                        status: 'Butuh Tindak Lanjut'
                      });
                      toast.success('Data ABK / Khusus berhasil disimpan!');
                    }
                  }

                  setShowAddABK(false);
                  setEditingAbkId(null);
                  setAbkStudentNis('');
                  setAbkInputNotes('');
                }}
                disabled={!abkStudentNis || !abkInputNotes.trim()}
                className="flex-1 py-2.5 px-4 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingAbkId ? 'Perbarui Data ABK' : 'Simpan Data ABK'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BACKUP & RESTORASI DATABASE TAB */}
      {activeTab === 'backup' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <span className="bg-teal-500/30 text-teal-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-400/30">
                Pusat Integrasi & Keamanan Data
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-center gap-2">
                <HardDrive className="w-8 h-8 text-teal-300" /> Backup & Restorasi Database BK
              </h2>
              <p className="text-teal-100/90 text-sm mt-2 leading-relaxed">
                Kelola cadangan (backup) dan pemulihan (restore) data bimbingan konseling secara aman. Berkas backup yang diunduh terhubung penuh dengan Admin Panel dan dapat digunakan untuk pencadangan rutin atau migrasi data sekolah.
              </p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <Database className="w-64 h-64 text-white" />
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Layanan Konseling</span>
              <div className="text-2xl font-black text-teal-700">
                {referrals.length + sessions.length + (studentCounselingRequests?.length || 0)}
              </div>
              <p className="text-xs text-slate-500">{sessions.length} Sesi • {referrals.length} Rujukan • {studentCounselingRequests?.length || 0} Permintaan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Asesmen & Sosiometri</span>
              <div className="text-2xl font-black text-indigo-700">
                {dailyCheckIns.length + needsAssessments.length + sociometries.length}
              </div>
              <p className="text-xs text-slate-500">{needsAssessments.length} AKPD • {sociometries.length} Sosiometri • {dailyCheckIns.length} Check-in</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Home Visit & Karir</span>
              <div className="text-2xl font-black text-emerald-700">
                {homeVisits.length + careerPlans.length}
              </div>
              <p className="text-xs text-slate-500">{homeVisits.length} Kunjungan • {careerPlans.length} Peta Karir</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Siswa & Kelas Master</span>
              <div className="text-2xl font-black text-blue-700">
                {students.length}
              </div>
              <p className="text-xs text-slate-500">{students.length} Siswa • {classes.length} Kelas Terdaftar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PANEL 1: BACKUP DATABASE */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">1. Unduh Backup Database (.json)</h3>
                  <p className="text-xs text-slate-500">Pilih komponen data BK yang ingin dicadangkan ke berkas JSON.</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    checked={bkBackupOptions.includeCounselingData}
                    onChange={(e) => setBkBackupOptions({ ...bkBackupOptions, includeCounselingData: e.target.checked })}
                  />
                  <div>
                    <div className="font-bold text-slate-900">Layanan Konseling & Rujukan</div>
                    <div className="text-[11px] text-slate-500 font-normal">Rujukan Guru Mapel, Sesi Konseling & Log, Permintaan Siswa</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    checked={bkBackupOptions.includeAssessmentData}
                    onChange={(e) => setBkBackupOptions({ ...bkBackupOptions, includeAssessmentData: e.target.checked })}
                  />
                  <div>
                    <div className="font-bold text-slate-900">Asesmen & Pemetaan Psikologis</div>
                    <div className="text-[11px] text-slate-500 font-normal">Daily Mood Check-in, Asesmen Kebutuhan (AKPD), Sosiometri</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    checked={bkBackupOptions.includeVisitAndCareerData}
                    onChange={(e) => setBkBackupOptions({ ...bkBackupOptions, includeVisitAndCareerData: e.target.checked })}
                  />
                  <div>
                    <div className="font-bold text-slate-900">Kunjungan Rumah & Peta Karir</div>
                    <div className="text-[11px] text-slate-500 font-normal">Laporan Kunjungan Rumah (Home Visit), Perencanaan Karir Siswa</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    checked={bkBackupOptions.includeMasterStudents}
                    onChange={(e) => setBkBackupOptions({ ...bkBackupOptions, includeMasterStudents: e.target.checked })}
                  />
                  <div>
                    <div className="font-bold text-slate-900">Data Master Siswa, Kelas & Guru</div>
                    <div className="text-[11px] text-slate-500 font-normal">Siswa (termasuk status ABK), Kelas, dan Guru pendamping</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    checked={bkBackupOptions.includeSchoolConfig}
                    onChange={(e) => setBkBackupOptions({ ...bkBackupOptions, includeSchoolConfig: e.target.checked })}
                  />
                  <div>
                    <div className="font-bold text-slate-900">Konfigurasi Kop & Legalisasi Sekolah</div>
                    <div className="text-[11px] text-slate-500 font-normal">Pengaturan Kop Laporan, Nama Kepala Sekolah, Guru BK & NIP</div>
                  </div>
                </label>
              </div>

              <button
                type="button"
                onClick={handleDownloadBkBackup}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Unduh Berkas Backup BK (.json)
              </button>
            </div>

            {/* PANEL 2: RESTORASI DATABASE */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">2. Restorasi Database (.json)</h3>
                  <p className="text-xs text-slate-500">Unggah file backup JSON untuk mengembalikan data ke Firestore.</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 hover:bg-teal-50/20 transition cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelectForBkRestore(file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileJson className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">
                  {bkRestoreFile ? bkRestoreFile.name : 'Klik atau Tarik Berkas Backup (.json) ke Sini'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Format file JSON standar hasil unduhan backup dari sistem ini.</p>
              </div>

              {bkRestorePreview && (
                <div className="space-y-4 animate-fade-in border-t border-slate-100 pt-4">
                  <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-teal-600" /> Ringkasan Isi Berkas Backup
                      </span>
                      <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                        {bkRestorePreview.exportDate ? new Date(bkRestorePreview.exportDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium bg-white p-3 rounded-xl border border-teal-100">
                      <div>📋 Rujukan BK: <strong>{(bkRestorePreview.counselingReferrals || []).length}</strong></div>
                      <div>💬 Sesi Konseling: <strong>{(bkRestorePreview.counselingSessions || []).length}</strong></div>
                      <div>📩 Permintaan Siswa: <strong>{(bkRestorePreview.studentCounselingRequests || []).length}</strong></div>
                      <div>😊 Daily Check-in: <strong>{(bkRestorePreview.dailyCheckIns || []).length}</strong></div>
                      <div>📝 Asesmen AKPD: <strong>{(bkRestorePreview.needsAssessments || []).length}</strong></div>
                      <div>🌐 Sosiometri: <strong>{(bkRestorePreview.sociometries || []).length}</strong></div>
                      <div>🏡 Home Visit: <strong>{(bkRestorePreview.homeVisits || []).length}</strong></div>
                      <div>🎯 Peta Karir: <strong>{(bkRestorePreview.careerPlans || []).length}</strong></div>
                      {bkRestorePreview.students && <div>👨‍🎓 Data Siswa: <strong>{(bkRestorePreview.students || []).length}</strong></div>}
                    </div>

                    {/* Mode Restorasi */}
                    <div className="pt-2">
                      <label className="text-xs font-extrabold text-slate-800 block mb-1.5">Metode Restorasi Database:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBkRestoreMode('merge')}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            bkRestoreMode === 'merge' 
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Gabungkan (Merge)
                          </div>
                          <div className={`text-[10px] mt-0.5 ${bkRestoreMode === 'merge' ? 'text-teal-100' : 'text-slate-400'}`}>
                            Aman. Menambah/memperbarui data berdasarkan ID.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBkRestoreMode('overwrite')}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            bkRestoreMode === 'overwrite' 
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Timpa (Overwrite)
                          </div>
                          <div className={`text-[10px] mt-0.5 ${bkRestoreMode === 'overwrite' ? 'text-rose-100' : 'text-slate-400'}`}>
                            Memperbarui record langsung pada Firestore.
                          </div>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBkRestoring}
                      onClick={handleExecuteBkRestore}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isBkRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> {bkRestoreProgressText || 'Sedang Memproses...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Jalankan Restorasi Database Sekarang
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAPORAN REKAP RUJUKAN GURU MAPEL */}
      {showReferralReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-teal-50/80">
              <div>
                <h2 className="text-lg font-black text-teal-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Laporan Rekap Rujukan Guru Mapel
                </h2>
                <p className="text-xs text-teal-700 mt-0.5">Pengaturan cetak dokumen rekapitulasi rujukan siswa dari guru mapel</p>
              </div>
              <button 
                onClick={() => setShowReferralReportModal(false)}
                className="p-2 hover:bg-teal-100/80 rounded-full text-teal-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Settings Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
              {/* Paper Size Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setReferralPaperSize('A4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${referralPaperSize === 'A4' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    A4 (210x297mm)
                  </button>
                  <button
                    onClick={() => setReferralPaperSize('F4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${referralPaperSize === 'F4' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    F4 (Folio)
                  </button>
                </div>
              </div>

              {/* Orientation Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Orientasi Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setReferralOrientation('landscape')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${referralOrientation === 'landscape' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setReferralOrientation('portrait')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${referralOrientation === 'portrait' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Portrait
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Status</label>
                <select
                  value={referralStatusFilter}
                  onChange={e => setReferralStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dijadwalkan">Dijadwalkan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Kelas</label>
                <select
                  value={referralClassFilter}
                  onChange={e => setReferralClassFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {getSortedClassNames(referrals.map(r => r.className)).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={referralPriorityFilter}
                  onChange={e => setReferralPriorityFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Rendah">Rendah</option>
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Bulan</label>
                <select
                  value={referralMonthFilter}
                  onChange={e => setReferralMonthFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Semester</label>
                <select
                  value={referralSemesterFilter}
                  onChange={e => setReferralSemesterFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Semester</option>
                  <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                  <option value="Genap">Semester Genap (Jan - Jun)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Signatures */}
            <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={referralIncludeSignatures} 
                  onChange={e => setReferralIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" 
                />
                Sertakan Kolom Tanda Tangan (Kepala Sekolah & Guru BK)
              </label>
              <span className="text-slate-500 font-medium">Menampilkan {reportFilteredReferrals.length} data rujukan</span>
            </div>

            {/* Document Preview Box */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300 max-w-4xl mx-auto text-slate-900 text-xs">
                {/* Kop Surat Preview */}
                <div className={`relative pb-3 mb-4 flex items-center justify-center ${
                  getSchoolIdentity().kopModel === 'Klasik' ? 'border-b-4 border-black font-serif' :
                  getSchoolIdentity().kopModel === 'Modern' ? 'border-b-4 border-teal-600' :
                  getSchoolIdentity().kopModel === 'Minimalis' ? 'border-b border-slate-400' :
                  'border-b-4 border-double border-slate-900'
                }`}>
                  <img src={getSchoolIdentity().logoUrl} alt="Logo" className="absolute left-0 top-0 w-14 h-14 object-contain" />
                  <div className="text-center px-12">
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header1}</h3>
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header2}</h3>
                    <h2 className="text-sm font-black uppercase text-slate-900 mt-0.5">{getSchoolIdentity().schoolName}</h2>
                    <p className="text-[10px] text-slate-600">{getSchoolIdentity().address}</p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-extrabold text-sm underline uppercase">LAPORAN REKAPITULASI RUJUKAN GURU MAPEL KE GURU BK</h3>
                  <p className="text-[11px] font-bold text-slate-600">GURU BK: {getSchoolIdentity().counselorName.toUpperCase()}</p>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-800">
                        <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-400 p-1.5">Tanggal</th>
                        <th className="border border-slate-400 p-1.5">NIS</th>
                        <th className="border border-slate-400 p-1.5">Nama Siswa</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="border border-slate-400 p-1.5">Guru Pengirim</th>
                        <th className="border border-slate-400 p-1.5">Kategori</th>
                        <th className="border border-slate-400 p-1.5 text-center">Prioritas</th>
                        <th className="border border-slate-400 p-1.5">Detail Masalah</th>
                        <th className="border border-slate-400 p-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportFilteredReferrals.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="border border-slate-400 p-3 text-center text-slate-500">
                            Tidak ada data rujukan yang memenuhi kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        reportFilteredReferrals.map((r, idx) => {
                          const teacherName = teachers.find(t => t.id === r.teacherId)?.name || 'Guru Mapel';
                          return (
                            <tr key={r.id || idx} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                              <td className="border border-slate-300 p-1.5 whitespace-nowrap">
                                {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="border border-slate-300 p-1.5">{r.studentNis}</td>
                              <td className="border border-slate-300 p-1.5 font-bold">{r.studentName}</td>
                              <td className="border border-slate-300 p-1.5 text-center">{r.className}</td>
                              <td className="border border-slate-300 p-1.5">{teacherName}</td>
                              <td className="border border-slate-300 p-1.5">{r.issueCategory}</td>
                              <td className="border border-slate-300 p-1.5 text-center font-bold">
                                <span className={r.priority === 'Tinggi' ? 'text-rose-600' : r.priority === 'Sedang' ? 'text-amber-600' : 'text-blue-600'}>
                                  {r.priority}
                                </span>
                              </td>
                              <td className="border border-slate-300 p-1.5 max-w-[150px] truncate">{r.issueDetails}</td>
                              <td className="border border-slate-300 p-1.5 text-center font-bold">{r.status}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {referralIncludeSignatures && (
                  <div className="flex justify-between items-center mt-8 pt-4 text-[11px]">
                    <div className="text-center w-48">
                      <p>Mengetahui,<br/>Kepala {getSchoolIdentity().schoolName}</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().principalName}</p>
                      <p>NIP. {getSchoolIdentity().principalNip}</p>
                    </div>
                    <div className="text-center w-48">
                      <p>{getSchoolIdentity().cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().counselorName}</p>
                      <p>NIP. {getSchoolIdentity().counselorNip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Format Cetak: <span className="text-teal-700">{referralPaperSize} — {referralOrientation}</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportReferralCSV}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh CSV
                </button>
                <button
                  onClick={handlePrintReferralReport}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAPORAN REKAP PERMINTAAN KONSELING SISWA */}
      {showRequestReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/80">
              <div>
                <h2 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Laporan Rekap Permintaan Konseling Siswa
                </h2>
                <p className="text-xs text-indigo-700 mt-0.5">Pengaturan cetak rekapitulasi permintaan konseling mandiri siswa</p>
              </div>
              <button 
                onClick={() => setShowRequestReportModal(false)}
                className="p-2 hover:bg-indigo-100/80 rounded-full text-indigo-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Settings Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
              {/* Paper Size Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setRequestPaperSize('A4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${requestPaperSize === 'A4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    A4 (210x297mm)
                  </button>
                  <button
                    onClick={() => setRequestPaperSize('F4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${requestPaperSize === 'F4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    F4 (Folio)
                  </button>
                </div>
              </div>

              {/* Orientation Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Orientasi Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setRequestOrientation('landscape')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${requestOrientation === 'landscape' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setRequestOrientation('portrait')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${requestOrientation === 'portrait' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Portrait
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Status</label>
                <select
                  value={requestStatusFilter}
                  onChange={e => setRequestStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Dijadwalkan">Dijadwalkan</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Kelas</label>
                <select
                  value={requestClassFilter}
                  onChange={e => setRequestClassFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {getSortedClassNames((studentCounselingRequests || []).map(r => r.className)).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Topik</label>
                <select
                  value={requestTopicFilter}
                  onChange={e => setRequestTopicFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Topik</option>
                  {Array.from(new Set((studentCounselingRequests || []).map(r => r.topic))).map(top => (
                    <option key={top} value={top}>{top}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Bulan</label>
                <select
                  value={requestMonthFilter}
                  onChange={e => setRequestMonthFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Semester</label>
                <select
                  value={requestSemesterFilter}
                  onChange={e => setRequestSemesterFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Semester</option>
                  <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                  <option value="Genap">Semester Genap (Jan - Jun)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Signatures */}
            <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={requestIncludeSignatures} 
                  onChange={e => setRequestIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                />
                Sertakan Kolom Tanda Tangan (Kepala Sekolah & Guru BK)
              </label>
              <span className="text-slate-500 font-medium">Menampilkan {filteredRequests.length} data permintaan</span>
            </div>

            {/* Document Preview Box */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300 max-w-4xl mx-auto text-slate-900 text-xs">
                {/* Kop Surat Preview */}
                <div className={`relative pb-3 mb-4 flex items-center justify-center ${
                  getSchoolIdentity().kopModel === 'Klasik' ? 'border-b-4 border-black font-serif' :
                  getSchoolIdentity().kopModel === 'Modern' ? 'border-b-4 border-teal-600' :
                  getSchoolIdentity().kopModel === 'Minimalis' ? 'border-b border-slate-400' :
                  'border-b-4 border-double border-slate-900'
                }`}>
                  <img src={getSchoolIdentity().logoUrl} alt="Logo" className="absolute left-0 top-0 w-14 h-14 object-contain" />
                  <div className="text-center px-12">
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header1}</h3>
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header2}</h3>
                    <h2 className="text-sm font-black uppercase text-slate-900 mt-0.5">{getSchoolIdentity().schoolName}</h2>
                    <p className="text-[10px] text-slate-600">{getSchoolIdentity().address}</p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-extrabold text-sm underline uppercase">LAPORAN REKAPITULASI PERMINTAAN KONSELING SISWA</h3>
                  <p className="text-[11px] font-bold text-slate-600">GURU BK: {getSchoolIdentity().counselorName.toUpperCase()}</p>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-800">
                        <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-400 p-1.5">Waktu Permintaan</th>
                        <th className="border border-slate-400 p-1.5 text-center">NIS</th>
                        <th className="border border-slate-400 p-1.5">Nama Siswa</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="border border-slate-400 p-1.5">Topik</th>
                        <th className="border border-slate-400 p-1.5">Deskripsi</th>
                        <th className="border border-slate-400 p-1.5 text-center">Status</th>
                        <th className="border border-slate-400 p-1.5">Tanggapan BK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="border border-slate-400 p-3 text-center text-slate-500">
                            Tidak ada data permintaan konseling yang memenuhi kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 whitespace-nowrap">
                              {new Date(r.requestedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-medium">{getStudentNis(r.studentId, r.studentName)}</td>
                            <td className="border border-slate-300 p-1.5 font-bold">{r.studentName}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{r.className}</td>
                            <td className="border border-slate-300 p-1.5 font-semibold">{r.topic}</td>
                            <td className="border border-slate-300 p-1.5 max-w-[150px] truncate">{r.description}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold">{r.status}</td>
                            <td className="border border-slate-300 p-1.5">
                              {r.feedback || r.scheduledAt ? (
                                <div>
                                  {r.feedback && <p>{r.feedback}</p>}
                                  {r.scheduledAt && <p className="text-blue-600 font-bold">Jadwal: {r.scheduledAt}</p>}
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {requestIncludeSignatures && (
                  <div className="flex justify-between items-center mt-8 pt-4 text-[11px]">
                    <div className="text-center w-48">
                      <p>Mengetahui,<br/>Kepala {getSchoolIdentity().schoolName}</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().principalName}</p>
                      <p>NIP. {getSchoolIdentity().principalNip}</p>
                    </div>
                    <div className="text-center w-48">
                      <p>{getSchoolIdentity().cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().counselorName}</p>
                      <p>NIP. {getSchoolIdentity().counselorNip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Format Cetak: <span className="text-indigo-700">{requestPaperSize} — {requestOrientation}</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportRequestCSV}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh CSV
                </button>
                <button
                  onClick={handlePrintRequestReport}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAPORAN REKAP KUNJUNGAN RUMAH (HOME VISIT) */}
      {showHvReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-orange-50/80">
              <div>
                <h2 className="text-lg font-black text-orange-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Laporan Rekap Kunjungan Rumah (Home Visit)
                </h2>
                <p className="text-xs text-orange-700 mt-0.5">Pengaturan cetak rekapitulasi data kunjungan rumah siswa</p>
              </div>
              <button 
                onClick={() => setShowHvReportModal(false)}
                className="p-2 hover:bg-orange-100/80 rounded-full text-orange-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Settings Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Paper Size Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setHvReportPaperSize('A4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${hvReportPaperSize === 'A4' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    A4 (210x297mm)
                  </button>
                  <button
                    onClick={() => setHvReportPaperSize('F4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${hvReportPaperSize === 'F4' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    F4 (Folio)
                  </button>
                </div>
              </div>

              {/* Orientation Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Orientasi Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setHvReportOrientation('landscape')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${hvReportOrientation === 'landscape' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setHvReportOrientation('portrait')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${hvReportOrientation === 'portrait' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Portrait
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Status</label>
                <select
                  value={hvReportStatusFilter}
                  onChange={e => setHvReportStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Direncanakan">Direncanakan</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Kelas</label>
                <select
                  value={hvReportClassFilter}
                  onChange={e => setHvReportClassFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {getSortedClassNames((homeVisits || []).map(v => v.className)).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Bulan</label>
                <select
                  value={hvReportMonthFilter}
                  onChange={e => setHvReportMonthFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Semester</label>
                <select
                  value={hvReportSemesterFilter}
                  onChange={e => setHvReportSemesterFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Semua">Semua Semester</option>
                  <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                  <option value="Genap">Semester Genap (Jan - Jun)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Signatures */}
            <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={hvReportIncludeSignatures} 
                  onChange={e => setHvReportIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500" 
                />
                Sertakan Kolom Tanda Tangan (Kepala Sekolah & Guru BK)
              </label>
              <span className="text-slate-500 font-medium">Menampilkan {reportFilteredHomeVisits.length} data kunjungan</span>
            </div>

            {/* Document Preview Box */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300 max-w-4xl mx-auto text-slate-900 text-xs">
                {/* Kop Surat Preview */}
                <div className={`relative pb-3 mb-4 flex items-center justify-center ${
                  getSchoolIdentity().kopModel === 'Klasik' ? 'border-b-4 border-black font-serif' :
                  getSchoolIdentity().kopModel === 'Modern' ? 'border-b-4 border-teal-600' :
                  getSchoolIdentity().kopModel === 'Minimalis' ? 'border-b border-slate-400' :
                  'border-b-4 border-double border-slate-900'
                }`}>
                  <img src={getSchoolIdentity().logoUrl} alt="Logo" className="absolute left-0 top-0 w-14 h-14 object-contain" />
                  <div className="text-center px-12">
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header1}</h3>
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header2}</h3>
                    <h2 className="text-sm font-black uppercase text-slate-900 mt-0.5">{getSchoolIdentity().schoolName}</h2>
                    <p className="text-[10px] text-slate-600">{getSchoolIdentity().address}</p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-extrabold text-sm underline uppercase">LAPORAN REKAPITULASI KUNJUNGAN RUMAH (HOME VISIT)</h3>
                  <p className="text-[11px] font-bold text-slate-600">GURU BK: {getSchoolIdentity().counselorName.toUpperCase()}</p>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-800">
                        <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-400 p-1.5">Tanggal</th>
                        <th className="border border-slate-400 p-1.5">NIS</th>
                        <th className="border border-slate-400 p-1.5">Nama Siswa</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="border border-slate-400 p-1.5">Nama Orang Tua</th>
                        <th className="border border-slate-400 p-1.5">Tujuan Kunjungan</th>
                        <th className="border border-slate-400 p-1.5 text-center">Status</th>
                        <th className="border border-slate-400 p-1.5">Hasil Kunjungan</th>
                        <th className="border border-slate-400 p-1.5">Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportFilteredHomeVisits.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="border border-slate-400 p-3 text-center text-slate-500">
                            Tidak ada data kunjungan rumah yang memenuhi kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        reportFilteredHomeVisits.map((v, idx) => (
                          <tr key={v.id || idx} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 whitespace-nowrap">
                              {new Date(v.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-medium">{v.studentNis}</td>
                            <td className="border border-slate-300 p-1.5 font-bold">{v.studentName}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{v.className}</td>
                            <td className="border border-slate-300 p-1.5 font-semibold">{v.parentName || '-'}</td>
                            <td className="border border-slate-300 p-1.5 max-w-[150px] truncate">{v.purpose}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold">
                              <span className={v.status === 'Selesai' ? 'text-emerald-600' : 'text-amber-600'}>
                                {v.status}
                              </span>
                            </td>
                            <td className="border border-slate-300 p-1.5 max-w-[150px] truncate">{v.visitResult || '-'}</td>
                            <td className="border border-slate-300 p-1.5 max-w-[150px] truncate">{v.followUp || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {hvReportIncludeSignatures && (
                  <div className="flex justify-between items-center mt-8 pt-4 text-[11px]">
                    <div className="text-center w-48">
                      <p>Mengetahui,<br/>Kepala {getSchoolIdentity().schoolName}</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().principalName}</p>
                      <p>NIP. {getSchoolIdentity().principalNip}</p>
                    </div>
                    <div className="text-center w-48">
                      <p>{getSchoolIdentity().cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().counselorName}</p>
                      <p>NIP. {getSchoolIdentity().counselorNip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Format Cetak: <span className="text-orange-700">{hvReportPaperSize} — {hvReportOrientation}</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportHvCSV}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh CSV
                </button>
                <button
                  onClick={handlePrintHvReport}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAPORAN REKAP SESI KONSELING & LOG */}
      {showSessionReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-teal-50/80">
              <div>
                <h2 className="text-lg font-black text-teal-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Laporan Rekap Sesi Bimbingan & Konseling
                </h2>
                <p className="text-xs text-teal-700 mt-0.5">Pengaturan cetak rekapitulasi data sesi bimbingan konseling dan log jurnal harian siswa</p>
              </div>
              <button 
                onClick={() => setShowSessionReportModal(false)}
                className="p-2 hover:bg-teal-100/80 rounded-full text-teal-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Settings Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Paper Size Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setSessionPaperSize('A4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${sessionPaperSize === 'A4' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setSessionPaperSize('F4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${sessionPaperSize === 'F4' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    F4 (Folio)
                  </button>
                </div>
              </div>

              {/* Orientation Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Orientasi Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setSessionOrientation('landscape')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${sessionOrientation === 'landscape' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setSessionOrientation('portrait')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${sessionOrientation === 'portrait' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Portrait
                  </button>
                </div>
              </div>

              {/* Service Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Layanan</label>
                <select
                  value={sessionActionFilter}
                  onChange={e => setSessionActionFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Layanan</option>
                  <option value="Konseling Individu">Konseling Individu</option>
                  <option value="Konseling Kelompok">Konseling Kelompok</option>
                  <option value="Home Visit">Home Visit</option>
                  <option value="Pemanggilan Orang Tua">Pemanggilan Orang Tua</option>
                  <option value="Rujukan Ahli">Rujukan Ahli</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Kelas</label>
                <select
                  value={sessionClassFilter}
                  onChange={e => setSessionClassFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {getSortedClassNames((sessions || []).map(s => {
                    const student = students.find(stud => stud.nis === s.studentNis);
                    return student ? classes.find(c => c.id === student.classId)?.name || s.className : s.className;
                  })).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Bulan</label>
                <select
                  value={sessionMonthFilter}
                  onChange={e => setSessionMonthFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Semester</label>
                <select
                  value={sessionSemesterFilter}
                  onChange={e => setSessionSemesterFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Semester</option>
                  <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                  <option value="Genap">Semester Genap (Jan - Jun)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Signatures */}
            <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={sessionIncludeSignatures} 
                  onChange={e => setSessionIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" 
                />
                Sertakan Kolom Tanda Tangan (Kepala Sekolah & Guru BK)
              </label>
              <span className="text-slate-500 font-medium">Menampilkan {reportFilteredSessions.length} data sesi bimbingan</span>
            </div>

            {/* Document Preview Box */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300 max-w-5xl mx-auto text-slate-900 text-xs">
                {/* Kop Surat Preview */}
                <div className={`relative pb-3 mb-4 flex items-center justify-center ${
                  getSchoolIdentity().kopModel === 'Klasik' ? 'border-b-4 border-black font-serif' :
                  getSchoolIdentity().kopModel === 'Modern' ? 'border-b-4 border-teal-600' :
                  getSchoolIdentity().kopModel === 'Minimalis' ? 'border-b border-slate-400' :
                  'border-b-4 border-double border-slate-900'
                }`}>
                  <img src={getSchoolIdentity().logoUrl} alt="Logo" className="absolute left-0 top-0 w-14 h-14 object-contain" />
                  <div className="text-center px-12">
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header1}</h3>
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header2}</h3>
                    <h2 className="text-sm font-black uppercase text-slate-900 mt-0.5">{getSchoolIdentity().schoolName}</h2>
                    <p className="text-[10px] text-slate-600">{getSchoolIdentity().address}</p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-extrabold text-sm underline uppercase">LAPORAN REKAPITULASI SESI BIMBINGAN & KONSELING SISWA</h3>
                  <p className="text-[11px] font-bold text-slate-600">GURU BK: {getSchoolIdentity().counselorName.toUpperCase()}</p>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-800">
                        <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-400 p-1.5">Tanggal</th>
                        <th className="border border-slate-400 p-1.5">NIS</th>
                        <th className="border border-slate-400 p-1.5">Nama Siswa</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="border border-slate-400 p-1.5">Tindakan / Sesi</th>
                        <th className="border border-slate-400 p-1.5">Konselor</th>
                        <th className="border border-slate-400 p-1.5">Catatan & Tindakan</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kategori</th>
                        <th className="border border-slate-400 p-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportFilteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="border border-slate-400 p-3 text-center text-slate-500">
                            Tidak ada data sesi konseling yang memenuhi kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        reportFilteredSessions.map((s, idx) => {
                          const student = students.find(stud => stud.nis === s.studentNis);
                          const clsName = student ? classes.find(c => c.id === student.classId)?.name : s.className;
                          const sName = student ? student.name : s.studentName;
                          return (
                            <tr key={s.id || idx} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                              <td className="border border-slate-300 p-1.5 whitespace-nowrap">
                                {new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="border border-slate-300 p-1.5 text-center font-medium">{s.studentNis}</td>
                              <td className="border border-slate-300 p-1.5 font-bold">{sName}</td>
                              <td className="border border-slate-300 p-1.5 text-center">{clsName}</td>
                              <td className="border border-slate-300 p-1.5 font-semibold text-teal-800">{s.actionTaken}</td>
                              <td className="border border-slate-300 p-1.5">{s.counselorName}</td>
                              <td className="border border-slate-300 p-1.5 max-w-[200px] truncate">{s.notes}</td>
                              <td className="border border-slate-300 p-1.5 text-center">
                                {s.isABK ? (
                                  <span className="text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded border border-red-200 text-[9px]">
                                    ABK
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Reguler</span>
                                )}
                              </td>
                              <td className="border border-slate-300 p-1.5 text-center font-bold">
                                <span className={s.status === 'Selesai' || !s.status ? 'text-emerald-600' : 'text-amber-600'}>
                                  {s.status || 'Selesai'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {sessionIncludeSignatures && (
                  <div className="flex justify-between items-center mt-8 pt-4 text-[11px]">
                    <div className="text-center w-48">
                      <p>Mengetahui,<br/>Kepala {getSchoolIdentity().schoolName}</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().principalName}</p>
                      <p>NIP. {getSchoolIdentity().principalNip}</p>
                    </div>
                    <div className="text-center w-48">
                      <p>{getSchoolIdentity().cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().counselorName}</p>
                      <p>NIP. {getSchoolIdentity().counselorNip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Format Cetak: <span className="text-teal-700">{sessionPaperSize} — {sessionOrientation}</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportSessionCSV}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh CSV
                </button>
                <button
                  onClick={handlePrintSessionReport}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAPORAN REKAP BIMBINGAN KARIR */}
      {showCareerReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-amber-50/80">
              <div>
                <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Laporan Rekap Bimbingan Karir & Peminatan
                </h2>
                <p className="text-xs text-amber-700 mt-0.5">Pengaturan cetak rekapitulasi data bimbingan karir dan peminatan siswa</p>
              </div>
              <button 
                onClick={() => setShowCareerReportModal(false)}
                className="p-2 hover:bg-amber-100/80 rounded-full text-amber-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Settings Controls Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              {/* Paper Size Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ukuran Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setCareerPaperSize('A4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${careerPaperSize === 'A4' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    A4 (210x297mm)
                  </button>
                  <button
                    onClick={() => setCareerPaperSize('F4')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${careerPaperSize === 'F4' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    F4 (Folio)
                  </button>
                </div>
              </div>

              {/* Orientation Option */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Orientasi Kertas</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setCareerOrientation('landscape')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${careerOrientation === 'landscape' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setCareerOrientation('portrait')}
                    className={`flex-1 py-1.5 font-bold rounded-lg transition ${careerOrientation === 'portrait' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Portrait
                  </button>
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Kelas</label>
                <select
                  value={careerReportClassFilter}
                  onChange={e => setCareerReportClassFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Semua">Semua Kelas</option>
                  {getSortedClassNames((careerPlans || []).map(p => {
                    const student = students.find(s => s.nis === p.studentNis);
                    return student ? classes.find(c => c.id === student.classId)?.name || p.className : p.className;
                  })).map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Bulan</label>
                <select
                  value={careerMonthFilter}
                  onChange={e => setCareerMonthFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filter Semester</label>
                <select
                  value={careerSemesterFilter}
                  onChange={e => setCareerSemesterFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Semua">Semua Semester</option>
                  <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                  <option value="Genap">Semester Genap (Jan - Jun)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Signatures */}
            <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={careerIncludeSignatures} 
                  onChange={e => setCareerIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500" 
                />
                Sertakan Kolom Tanda Tangan (Kepala Sekolah & Guru BK)
              </label>
              <span className="text-slate-500 font-medium">Menampilkan {reportFilteredCareerPlans.length} data perencanaan karir</span>
            </div>

            {/* Document Preview Box */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300 max-w-4xl mx-auto text-slate-900 text-xs">
                {/* Kop Surat Preview */}
                <div className={`relative pb-3 mb-4 flex items-center justify-center ${
                  getSchoolIdentity().kopModel === 'Klasik' ? 'border-b-4 border-black font-serif' :
                  getSchoolIdentity().kopModel === 'Modern' ? 'border-b-4 border-teal-600' :
                  getSchoolIdentity().kopModel === 'Minimalis' ? 'border-b border-slate-400' :
                  'border-b-4 border-double border-slate-900'
                }`}>
                  <img src={getSchoolIdentity().logoUrl} alt="Logo" className="absolute left-0 top-0 w-14 h-14 object-contain" />
                  <div className="text-center px-12">
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header1}</h3>
                    <h3 className="text-xs font-bold uppercase leading-tight">{getSchoolIdentity().header2}</h3>
                    <h2 className="text-sm font-black uppercase text-slate-900 mt-0.5">{getSchoolIdentity().schoolName}</h2>
                    <p className="text-[10px] text-slate-600">{getSchoolIdentity().address}</p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-extrabold text-sm underline uppercase">LAPORAN REKAPITULASI BIMBINGAN KARIR & PEMINATAN SISWA</h3>
                  <p className="text-[11px] font-bold text-slate-600">GURU BK: {getSchoolIdentity().counselorName.toUpperCase()}</p>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 uppercase font-bold text-slate-800">
                        <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                        <th className="border border-slate-400 p-1.5">NIS</th>
                        <th className="border border-slate-400 p-1.5">Nama Siswa</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="border border-slate-400 p-1.5">Minat / Karakteristik</th>
                        <th className="border border-slate-400 p-1.5">Kekuatan / Potensi</th>
                        <th className="border border-slate-400 p-1.5">Univ Target</th>
                        <th className="border border-slate-400 p-1.5">Prodi Target</th>
                        <th className="border border-slate-400 p-1.5">Karir Impian</th>
                        <th className="border border-slate-400 p-1.5">Catatan BK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportFilteredCareerPlans.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="border border-slate-400 p-3 text-center text-slate-500">
                            Tidak ada data bimbingan karir siswa yang memenuhi kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        reportFilteredCareerPlans.map((p, idx) => {
                          const student = students.find(s => s.nis === p.studentNis);
                          const clsName = student ? classes.find(c => c.id === student.classId)?.name : p.className;
                          const sName = student ? student.name : p.studentName;
                          return (
                            <tr key={p.id || idx} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                              <td className="border border-slate-300 p-1.5 font-medium">{p.studentNis}</td>
                              <td className="border border-slate-300 p-1.5 font-bold">{sName}</td>
                              <td className="border border-slate-300 p-1.5 text-center">{clsName}</td>
                              <td className="border border-slate-300 p-1.5 max-w-[120px] truncate">{(p.interests || []).join(', ') || '-'}</td>
                              <td className="border border-slate-300 p-1.5 max-w-[120px] truncate">{(p.strengths || []).join(', ') || '-'}</td>
                              <td className="border border-slate-300 p-1.5 font-semibold">{p.targetUniversity || '-'}</td>
                              <td className="border border-slate-300 p-1.5">{p.targetMajor || '-'}</td>
                              <td className="border border-slate-300 p-1.5 font-bold text-amber-800">{p.targetCareer}</td>
                              <td className="border border-slate-300 p-1.5 max-w-[150px] truncate">{p.counselorNotes || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {careerIncludeSignatures && (
                  <div className="flex justify-between items-center mt-8 pt-4 text-[11px]">
                    <div className="text-center w-48">
                      <p>Mengetahui,<br/>Kepala {getSchoolIdentity().schoolName}</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().principalName}</p>
                      <p>NIP. {getSchoolIdentity().principalNip}</p>
                    </div>
                    <div className="text-center w-48">
                      <p>{getSchoolIdentity().cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                      <div className="h-12"></div>
                      <p className="font-bold underline">{getSchoolIdentity().counselorName}</p>
                      <p>NIP. {getSchoolIdentity().counselorNip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Format Cetak: <span className="text-amber-700">{careerPaperSize} — {careerOrientation}</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCareerCSV}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh CSV
                </button>
                <button
                  onClick={handlePrintCareerReport}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Laporan Rekapitulasi Data ABK / Perhatian Khusus */}
      {showAbkReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-100" />
                  Rekap Laporan Data ABK / Khusus
                </h3>
                <p className="text-xs text-rose-100/90 font-medium">Konfigurasi filter dan cetak laporan pemantauan siswa perhatian khusus.</p>
              </div>
              <button
                onClick={() => setShowAbkReportModal(false)}
                className="p-2 hover:bg-white/15 active:bg-white/20 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Config Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Format Settings Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-rose-500" /> Pengaturan Format
                  </h4>

                  {/* Paper Size */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">Ukuran Kertas</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAbkPaperSize('A4')}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          abkPaperSize === 'A4'
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        A4 (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbkPaperSize('F4')}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          abkPaperSize === 'F4'
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        F4 / Folio
                      </button>
                    </div>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">Orientasi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAbkOrientation('portrait')}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          abkOrientation === 'portrait'
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Portrait
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbkOrientation('landscape')}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          abkOrientation === 'landscape'
                            ? 'bg-rose-50 border-rose-500 text-rose-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>

                  {/* Signatures Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={abkIncludeSignatures}
                        onChange={e => setAbkIncludeSignatures(e.target.checked)}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">Sertakan Tanda Tangan</span>
                    </label>
                  </div>
                </div>

                {/* Filters Settings Box */}
                <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-rose-500" /> Filter Laporan
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Class Filter */}
                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">Filter Kelas</label>
                      <select
                        value={abkReportClassFilter}
                        onChange={e => setAbkReportClassFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Semua">Semua Kelas</option>
                        {getSortedClassNames(
                          (sessions || [])
                            .filter(s => s.isABK)
                            .map(s => {
                              const student = students.find(stud => stud.nis === s.studentNis);
                              return student ? (classes.find(c => c.id === student.classId)?.name || student.className) : s.className;
                            })
                        ).map(className => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                      </select>
                    </div>

                    {/* Semester Filter */}
                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">Filter Semester</label>
                      <select
                        value={abkSemesterFilter}
                        onChange={e => setAbkSemesterFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Semua">Semua Semester</option>
                        <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                        <option value="Genap">Semester Genap (Jan - Jun)</option>
                      </select>
                    </div>

                    {/* Year Filter */}
                    <div>
                      <label className="block font-bold text-slate-700 text-xs mb-1">Filter Tahun</label>
                      <select
                        value={abkYearFilter}
                        onChange={e => setAbkYearFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Semua">Semua Tahun</option>
                        {uniqueAbkYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Preview Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-500" /> Pratinjau Dokumen Cetak
                  </h4>
                  <div className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-lg">
                    {reportFilteredAbk.length} Baris Data Terpilih
                  </div>
                </div>

                {/* Print Sheet Mimic Wrapper */}
                <div className="p-4 sm:p-8 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
                  <div className={`mx-auto bg-white shadow-lg border border-slate-300 text-[10px] p-6 text-slate-800 ${
                    abkOrientation === 'landscape' ? 'w-[750px] min-h-[500px]' : 'w-[550px] min-h-[700px]'
                  }`} style={{ fontFamily: 'sans-serif' }}>
                    {/* Kop Surat Mimic */}
                    <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 mb-4 gap-4">
                      <img src={getSchoolIdentity().logoUrl} alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" referrerPolicy="no-referrer" />
                      <div className="text-center flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{getSchoolIdentity().header1}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{getSchoolIdentity().header2}</p>
                        <p className="text-xs font-black uppercase text-slate-900">{getSchoolIdentity().schoolName}</p>
                        <p className="text-[8px] text-slate-500 font-medium">{getSchoolIdentity().address}</p>
                      </div>
                    </div>

                    {/* Report Title */}
                    <div className="text-center mb-4">
                      <h4 className="font-extrabold text-sm underline uppercase text-slate-900">Laporan Rekapitulasi Data Siswa ABK / Perhatian Khusus</h4>
                      <p className="text-[9px] font-bold text-slate-600 mt-1">GURU BK: {getSchoolIdentity().counselorName.toUpperCase()}</p>
                      {(abkSemesterFilter !== 'Semua' || abkYearFilter !== 'Semua') && (
                        <p className="text-[9px] font-semibold text-slate-500 mt-0.5">
                          Periode: {abkSemesterFilter !== 'Semua' ? `Semester ${abkSemesterFilter} ` : ''}{abkYearFilter !== 'Semua' ? `Tahun ${abkYearFilter}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Table Preview */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[9px]">
                        <thead>
                          <tr className="bg-slate-100 uppercase font-bold text-slate-800">
                            <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                            <th className="border border-slate-400 p-1.5 text-center w-20">NIS</th>
                            <th className="border border-slate-400 p-1.5">Nama Siswa</th>
                            <th className="border border-slate-400 p-1.5 text-center w-14">Kelas</th>
                            <th className="border border-slate-400 p-1.5">Catatan Khusus ABK / Kendala</th>
                            <th className="border border-slate-400 p-1.5 text-center w-20">Tgl Catat</th>
                            <th className="border border-slate-400 p-1.5 text-center w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportFilteredAbk.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="border border-slate-400 p-3 text-center text-slate-500">
                                Tidak ada data siswa ABK / perhatian khusus yang memenuhi kriteria filter.
                              </td>
                            </tr>
                          ) : (
                            reportFilteredAbk.map((s, idx) => {
                              const student = students.find(stud => stud.nis === s.studentNis);
                              const clsName = student ? (classes.find(c => c.id === student.classId)?.name || student.className) : s.className;
                              const sName = student ? student.name : s.studentName;
                              const dateFormatted = s.date ? new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                              return (
                                <tr key={s.id || idx} className="hover:bg-slate-50">
                                  <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                                  <td className="border border-slate-300 p-1.5 text-center font-medium">{s.studentNis}</td>
                                  <td className="border border-slate-300 p-1.5 font-bold">{sName}</td>
                                  <td className="border border-slate-300 p-1.5 text-center">{clsName}</td>
                                  <td className="border border-slate-300 p-1.5 max-w-[200px] truncate">{s.abkNotes || '-'}</td>
                                  <td className="border border-slate-300 p-1.5 text-center">{dateFormatted}</td>
                                  <td className="border border-slate-300 p-1.5 text-center">
                                    <span className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] ${
                                      s.status === 'Selesai'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {s.status || 'Pemantauan'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {abkIncludeSignatures && (
                      <div className="flex justify-between items-center mt-8 pt-4 text-[9px]">
                        <div className="text-center w-40">
                          <p>Mengetahui,<br/>Kepala {getSchoolIdentity().schoolName}</p>
                          <div className="h-10"></div>
                          <p className="font-bold underline">{getSchoolIdentity().principalName}</p>
                          <p>NIP. {getSchoolIdentity().principalNip}</p>
                        </div>
                        <div className="text-center w-40">
                          <p>{getSchoolIdentity().cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                          <div className="h-10"></div>
                          <p className="font-bold underline">{getSchoolIdentity().counselorName}</p>
                          <p>NIP. {getSchoolIdentity().counselorNip}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Format Cetak: <span className="text-rose-700">{abkPaperSize} — {abkOrientation}</span>
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportAbkCSV}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Unduh CSV
                </button>
                <button
                  onClick={handlePrintAbkReport}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Dokumen / Simpan PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tanggapi / Update Rujukan Masalah */}
      {respondingReferral && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Detail & Tanggapan Rujukan</h3>
                <p className="text-xs text-slate-500">Update status & catatan tindak lanjut rujukan dari guru.</p>
              </div>
              <button
                type="button"
                onClick={() => setRespondingReferral(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{respondingReferral.studentName}</span>
                  <span className="font-bold px-2 py-0.5 bg-slate-200 rounded text-slate-700 text-[10px]">
                    Kelas {respondingReferral.className}
                  </span>
                </div>
                <p className="text-slate-500 font-medium">NIS: {respondingReferral.studentNis}</p>
                <div className="pt-2 border-t border-slate-200">
                  <p className="font-bold text-slate-700">Laporan Guru ({teachers.find(t => t.id === respondingReferral.teacherId)?.name || 'Guru'}):</p>
                  <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1 italic">
                    "{respondingReferral.issueDetails}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Penanganan BK</label>
                <select
                  value={refResponseStatus}
                  onChange={e => setRefResponseStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Menunggu">⏳ Menunggu</option>
                  <option value="Diproses">⚙️ Diproses / Ditindaklanjuti</option>
                  <option value="Dijadwalkan">📅 Dijadwalkan Konseling</option>
                  <option value="Selesai">✅ Selesai Penanganan</option>
                  <option value="Ditolak">❌ Ditolak / Diarsipkan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tanggapan / Tindak Lanjut Guru BK</label>
                <textarea
                  rows={3}
                  value={refResponseFeedback}
                  onChange={e => setRefResponseFeedback(e.target.value)}
                  placeholder="Tuliskan catatan tindak lanjut, konseling yang dilakukan, atau instruksi untuk guru pengirim..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRespondingReferral(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateReferral({
                    ...respondingReferral,
                    status: refResponseStatus,
                    feedback: refResponseFeedback
                  });
                  setRespondingReferral(null);
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Simpan Tanggapan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Rujukan */}
      {deletingReferralId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Record Rujukan?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Record rujukan ini akan dihapus dari tampilan aktif. Data tetap aman di pencatatan permanen jika dikonfirmasi.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReferralId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteReferral) {
                    onDeleteReferral(deletingReferralId);
                  }
                  setDeletingReferralId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Permintaan Siswa */}
      {deletingRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Record Permintaan?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Record permintaan konseling siswa ini akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRequestId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudentCounselingRequest) {
                    onDeleteStudentCounselingRequest(deletingRequestId);
                  } else if (onUpdateStudentCounselingRequest) {
                    const target = (studentCounselingRequests || []).find(r => r.id === deletingRequestId);
                    if (target) onUpdateStudentCounselingRequest({ ...target, status: 'Ditolak' });
                  }
                  setDeletingRequestId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Home Visit */}
      {deletingHv && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Kunjungan Rumah?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Apakah Anda yakin ingin menghapus jadwal Kunjungan Rumah untuk <strong className="text-slate-800">{deletingHv.studentName}</strong> ({deletingHv.className})? Record ini akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingHv(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteHomeVisit) {
                    onDeleteHomeVisit(deletingHv.id);
                  } else if (onUpdateHomeVisit) {
                    onUpdateHomeVisit(deletingHv.id, { status: 'Ditolak' as any });
                  }
                  toast.success('Jadwal Kunjungan Rumah berhasil dihapus!');
                  setDeletingHv(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Career Plan */}
      {deletingCareerPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Catatan Karir?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan peminatan & perencanaan karir untuk <strong className="text-slate-800">{students.find(s => s.nis === deletingCareerPlan.studentNis)?.name || deletingCareerPlan.studentName}</strong>? Record ini akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCareerPlan(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCareerPlan) {
                    onDeleteCareerPlan(deletingCareerPlan.id);
                    toast.success('Catatan Karir berhasil dihapus!');
                  }
                  setDeletingCareerPlan(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus ABK */}
      {deletingAbk && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Data ABK?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Apakah Anda yakin ingin menghapus data pemantauan ABK / perhatian khusus untuk <strong className="text-slate-800">{students.find(s => s.nis === deletingAbk.studentNis)?.name || deletingAbk.studentName}</strong>? Record ini akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAbk(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSession) {
                    onDeleteSession(deletingAbk.id);
                    toast.success('Data ABK berhasil dihapus!');
                  }
                  setDeletingAbk(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Sesi Konseling */}
      {deletingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Sesi Konseling?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Apakah Anda yakin ingin menghapus record sesi konseling untuk <strong className="text-slate-800">{deletingSession.studentName}</strong>? Record ini akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSession(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSession) {
                    onDeleteSession(deletingSession.id);
                    toast.success('Sesi konseling berhasil dihapus!');
                  }
                  setDeletingSession(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN KOP SURAT & LEGALISASI LAPORAN */}
      {showKopConfigModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-teal-800 to-emerald-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
                  <Building className="w-6 h-6 text-teal-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Pengaturan Kop Laporan & Legalisasi</h2>
                  <p className="text-xs text-teal-200 mt-0.5">Atur model Kop Surat, identitas sekolah, serta penandatangan rekap rujukan & permintaan siswa</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKopConfigModal(false)}
                className="p-2 hover:bg-white/20 rounded-full text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveKopConfig} className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              
              {/* SECTION 1: MODEL KOP SURAT */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Pilih Model Kop Surat Laporan
                  </label>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Model Terpilih: <strong className="text-teal-700">{kopForm.kopModel}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'Standard', name: 'Standard (Kedinasan)', desc: 'Garis ganda tebal-tipis klasik resmi kedinasan', styleClass: 'border-b-4 border-double border-slate-900' },
                    { id: 'Klasik', name: 'Klasik (Serif Formal)', desc: 'Font Times New Roman dengan border hitam tegas', styleClass: 'border-b-4 border-black font-serif' },
                    { id: 'Modern', name: 'Modern (Aksen Teal)', desc: 'Header bersih dengan garis aksen warna Teal', styleClass: 'border-b-4 border-teal-600' },
                    { id: 'Minimalis', name: 'Minimalis (Clean)', desc: 'Garis tipis minimalis dan hemat ruang cetak', styleClass: 'border-b border-slate-400' }
                  ].map(model => (
                    <div
                      key={model.id}
                      onClick={() => setKopForm(prev => ({ ...prev, kopModel: model.id as any }))}
                      className={`p-3.5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        kopForm.kopModel === model.id
                          ? 'border-teal-600 bg-teal-50/50 shadow-sm ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900">{model.name}</span>
                          {kopForm.kopModel === model.id && (
                            <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{model.desc}</p>
                      </div>
                      <div className="mt-3 pt-2">
                        <div className={`text-[9px] text-center font-bold text-slate-700 pb-1 ${model.styleClass}`}>
                          SAMPLE KOP {model.id.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: IDENTITAS KOP SURAT */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  Identitas & Teks Kop Surat
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Header Baris 1 (Pemerintah/Instansi Atas)</label>
                    <input
                      type="text"
                      value={kopForm.kopHeader1}
                      onChange={e => setKopForm(prev => ({ ...prev, kopHeader1: e.target.value }))}
                      placeholder="Contoh: PEMERINTAH KABUPATEN PASURUAN"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Header Baris 2 (Dinas/Penyelenggara)</label>
                    <input
                      type="text"
                      value={kopForm.kopHeader2}
                      onChange={e => setKopForm(prev => ({ ...prev, kopHeader2: e.target.value }))}
                      placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nama Utama Sekolah / Instansi</label>
                    <input
                      type="text"
                      value={kopForm.schoolName}
                      onChange={e => setKopForm(prev => ({ ...prev, schoolName: e.target.value }))}
                      placeholder="Contoh: SMP NEGERI 1 BEJI"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">URL Logo Sekolah</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={kopForm.logoUrl}
                        onChange={e => setKopForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://... atau data:image/png;base64,..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setKopForm(prev => ({ ...prev, logoUrl: SCHOOL_LOGO_BASE64 }))}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition shrink-0"
                      >
                        Reset Logo Default
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Sekolah</label>
                    <input
                      type="text"
                      value={kopForm.schoolAddress}
                      onChange={e => setKopForm(prev => ({ ...prev, schoolAddress: e.target.value }))}
                      placeholder="Jl. Raya Beji No. 123, Pasuruan, Jawa Timur"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Telepon / Fax</label>
                    <input
                      type="text"
                      value={kopForm.schoolPhone}
                      onChange={e => setKopForm(prev => ({ ...prev, schoolPhone: e.target.value }))}
                      placeholder="(0343) 656123"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Website Sekolah</label>
                    <input
                      type="text"
                      value={kopForm.schoolWebsite}
                      onChange={e => setKopForm(prev => ({ ...prev, schoolWebsite: e.target.value }))}
                      placeholder="smpn1beji.sch.id"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Resmi Sekolah</label>
                    <input
                      type="text"
                      value={kopForm.schoolEmail}
                      onChange={e => setKopForm(prev => ({ ...prev, schoolEmail: e.target.value }))}
                      placeholder="info@smpn1beji.sch.id"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten Surat (Tanggal)</label>
                    <input
                      type="text"
                      value={kopForm.cityLocation}
                      onChange={e => setKopForm(prev => ({ ...prev, cityLocation: e.target.value }))}
                      placeholder="Pasuruan (Akan tampil: Pasuruan, 8 Agustus 2026)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: LEGALISASI & TANDA TANGAN */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Data Penandatangan Legalisasi Laporan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Kepala Sekolah */}
                  <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
                    <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                      🎓 Kepala Sekolah (Mengetahui)
                    </h4>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
                      <input
                        type="text"
                        value={kopForm.principalName}
                        onChange={e => setKopForm(prev => ({ ...prev, principalName: e.target.value }))}
                        placeholder="Yayuk Sudarwati, S.Pd., M.Pd."
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                      <input
                        type="text"
                        value={kopForm.principalNip}
                        onChange={e => setKopForm(prev => ({ ...prev, principalNip: e.target.value }))}
                        placeholder="197002071997032005"
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Guru BK / Konselor */}
                  <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/40 space-y-3">
                    <h4 className="font-extrabold text-teal-900 text-xs flex items-center gap-1.5">
                      💚 Guru Bimbingan Konseling (Pembuat Laporan)
                    </h4>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Guru BK & Gelar</label>
                      <input
                        type="text"
                        value={kopForm.counselorName}
                        onChange={e => setKopForm(prev => ({ ...prev, counselorName: e.target.value }))}
                        placeholder="Dra. Siti Rahmah, M.Pd."
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">NIP Guru BK</label>
                      <input
                        type="text"
                        value={kopForm.counselorNip}
                        onChange={e => setKopForm(prev => ({ ...prev, counselorNip: e.target.value }))}
                        placeholder="197505122003122001"
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW BOX INSIDE MODAL */}
              <div className="bg-slate-200/80 p-5 rounded-2xl border border-slate-300 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>👁️ Live Preview Kop & Legalisasi Document ({kopForm.kopModel})</span>
                  <span className="text-[10px] text-slate-500">Tampilan persis pada hasil cetak</span>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md text-slate-900 text-xs max-w-3xl mx-auto">
                  {/* Kop Surat Live Preview */}
                  <div className={`relative pb-3 mb-4 flex items-center justify-center ${
                    kopForm.kopModel === 'Klasik' ? 'border-b-4 border-black font-serif' :
                    kopForm.kopModel === 'Modern' ? 'border-b-4 border-teal-600' :
                    kopForm.kopModel === 'Minimalis' ? 'border-b border-slate-400' :
                    'border-b-4 border-double border-slate-900'
                  }`}>
                    <img src={kopForm.logoUrl} alt="Logo" className="absolute left-0 top-0 w-12 h-12 object-contain" />
                    <div className="text-center px-10">
                      <h3 className="text-[10px] font-bold uppercase leading-tight text-slate-800">{kopForm.kopHeader1}</h3>
                      <h3 className="text-[10px] font-bold uppercase leading-tight text-slate-800">{kopForm.kopHeader2}</h3>
                      <h2 className="text-xs font-black uppercase text-slate-900 mt-0.5">{kopForm.schoolName}</h2>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {[kopForm.schoolAddress, kopForm.schoolPhone ? `Telp: ${kopForm.schoolPhone}` : '', kopForm.schoolWebsite ? `Website: ${kopForm.schoolWebsite}` : ''].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-center my-3">
                    <h3 className="font-extrabold text-xs underline uppercase">LAPORAN REKAPITULASI PEMBINAAN & KONSELING</h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">SAMPEL LAYOUT TAMPILAN CETAK</p>
                  </div>

                  <div className="border border-slate-200 rounded p-2 bg-slate-50 text-[10px] text-center text-slate-400 italic my-3">
                    [Tabel Data Rekap Rujukan atau Permintaan Siswa Akan Dicetak Di Sini]
                  </div>

                  {/* Signatures Live Preview */}
                  <div className="flex justify-between items-center mt-6 pt-2 text-[10px]">
                    <div className="text-center w-44">
                      <p>Mengetahui,<br/>Kepala {kopForm.schoolName}</p>
                      <div className="h-10"></div>
                      <p className="font-bold underline">{kopForm.principalName || 'Nama Kepala Sekolah'}</p>
                      <p>NIP. {kopForm.principalNip || '-'}</p>
                    </div>
                    <div className="text-center w-44">
                      <p>{kopForm.cityLocation || 'Kota'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan Konseling,</p>
                      <div className="h-10"></div>
                      <p className="font-bold underline">{kopForm.counselorName || 'Nama Guru BK'}</p>
                      <p>NIP. {kopForm.counselorNip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowKopConfigModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Simpan Pengaturan Kop & Legalisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}

