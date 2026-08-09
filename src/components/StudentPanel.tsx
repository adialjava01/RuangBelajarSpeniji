import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Student, Material, Exam, ExamQuestion, ExamSubmission, CheatLog, Teacher, SubjectItem, TeacherAnnouncement
, DailyCheckIn, NeedsAssessment, Sociometry, ClassItem, CareerPlan, AssignmentFolder, AssignmentSubmission, LivePresentationSession, ManualAssessment, SchoolConfig, StudentCounselingRequest } from '../types';
import { 
  BookOpen, FileText, Key, Clock, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Send, User, GraduationCap,
  Bell, Megaphone, CheckCircle2, Info, X, ChevronLeft, ChevronRight, Grid, AlertOctagon
, Heart, MessageSquare, Users, Briefcase, Folder, ExternalLink, Upload, FolderPlus, Tv, Radio, Eye, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, Lock, Unlock, Paperclip, FileCheck, Play, Volume2, Image as ImageIcon, Link as LinkIcon, File, RotateCw, Smartphone, Printer, Filter } from 'lucide-react';
import { analyzeDriveUrl } from '../utils/gdrive';

interface StudentPanelProps {
  dailyCheckIns?: DailyCheckIn[];
  onAddDailyCheckIn?: (checkIn: Omit<DailyCheckIn, 'id' | 'createdAt'>) => void;
  onAddNeedsAssessment?: (assessment: Omit<NeedsAssessment, 'id' | 'createdAt'>) => void;
  sociometries?: Sociometry[];
  onAddSociometry?: (sociometry: Omit<Sociometry, 'id' | 'createdAt'>) => void;
  onUpdateSociometry?: (id: string, updates: Partial<Sociometry>) => void;
  onDeleteSociometry?: (id: string) => void;
  careerPlans?: CareerPlan[];
  onAddCareerPlan?: (plan: Omit<CareerPlan, 'id' | 'updatedAt'>) => void;
  onUpdateCareerPlan?: (id: string, updates: Partial<CareerPlan>) => void;
  classes?: ClassItem[];
  students?: Student[];
  currentStudent: Student;
  studentCounselingRequests?: StudentCounselingRequest[];
  onAddStudentCounselingRequest?: (req: Omit<StudentCounselingRequest, "id" | "requestedAt">) => void;
  onUpdateStudentCounselingRequest?: (req: StudentCounselingRequest) => void;
  materials: Material[];
  exams: Exam[];
  submissions?: ExamSubmission[];
  teachers: Teacher[];
  subjects: SubjectItem[];
  announcements?: TeacherAnnouncement[];
  onAddCheatLog: (log: Omit<CheatLog, 'id' | 'timestamp'>) => void;
  onSubmitExam: (submission: Omit<ExamSubmission, 'id' | 'submittedAt'>) => void;
  assignmentFolders?: AssignmentFolder[];
  assignmentSubmissions?: AssignmentSubmission[];
  manualAssessments?: ManualAssessment[];
  schoolConfig?: SchoolConfig;
  onSaveAssignmentSubmission?: (sub: Omit<AssignmentSubmission, 'id' | 'submittedAt'>) => void;
  livePresentation?: LivePresentationSession;
  livePresentations?: LivePresentationSession[];
  onUpdateLivePresentation?: (session: LivePresentationSession) => void;
}

export function renderFormattedText(text: string, fontPreset?: 'Sans' | 'Serif' | 'Grotesk' | 'Mono') {
  if (!text) return null;

  // Font family determination based on preset
  let fontClass = 'font-sans';
  if (fontPreset === 'Serif') fontClass = 'font-serif tracking-normal font-normal text-slate-800';
  if (fontPreset === 'Grotesk') fontClass = 'font-sans tracking-tight font-extrabold text-slate-900';
  if (fontPreset === 'Mono') fontClass = 'font-mono text-xs text-slate-800 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50';

  // Split text by markdown bold, italic, underline, code, and links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
    <div className={`${fontClass} leading-relaxed whitespace-pre-wrap`}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-extrabold text-slate-950">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index} className="italic text-slate-800">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
          return <span key={index} className="underline decoration-indigo-500 decoration-2">{part.slice(2, -2)}</span>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('[') && part.includes('](')) {
          const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            const [_, linkText, linkUrl] = match;
            return (
              <a
                key={index}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 font-bold underline decoration-indigo-300 hover:decoration-indigo-600 transition"
              >
                {linkText} 🔗
              </a>
            );
          }
        }
        return part;
      })}
    </div>



    </>
  );
}

export default function StudentPanel({
  studentCounselingRequests = [],
  onAddStudentCounselingRequest,
  onUpdateStudentCounselingRequest,
  dailyCheckIns = [],
  onAddDailyCheckIn,
  onAddNeedsAssessment,
  sociometries = [],
  onAddSociometry,
  onUpdateSociometry,
  onDeleteSociometry,
  careerPlans = [],
  onAddCareerPlan,
  onUpdateCareerPlan,
  classes = [],
  students = [],
  currentStudent,
  materials,
  exams,
  submissions = [],
  teachers,
  subjects,
  announcements = [],
  onAddCheatLog,
  onSubmitExam,
  assignmentFolders = [],
  assignmentSubmissions = [],
  manualAssessments = [],
  schoolConfig,
  onSaveAssignmentSubmission,
  livePresentation: rawLivePresentation,
  livePresentations,
  onUpdateLivePresentation
}: StudentPanelProps) {
  const livePresentation = (() => {
    if (livePresentations && livePresentations.length > 0 && currentStudent) {
      const activeSessions = livePresentations.filter(lp => lp.active);
      if (activeSessions.length === 0) return undefined;
      
      // 1. Match by student's classId
      const classMatch = activeSessions.find(lp => {
        if (!lp.classId) return false;
        const classList = lp.classId.split(',').map(c => c.trim());
        return classList.includes(currentStudent.classId) || classList.includes('ALL');
      });
      if (classMatch) return classMatch;

      // 2. Return first active session as fallback
      return activeSessions[0];
    }
    return rawLivePresentation?.active ? rawLivePresentation : undefined;
  })();

  const [activeTab, setActiveTab] = useState<'beranda' | 'materials' | 'assignments' | 'exams' | 'scores' | 'bk' | 'live_presentation'>('beranda');
  const [dailyMood, setDailyMood] = useState<'Senang' | 'Biasa' | 'Sedih' | 'Marah' | 'Takut' | 'Lelah'>('Senang');
  const [dailyNote, setDailyNote] = useState('');
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // Student Assignment State & Direct Upload
  const [currentStudentAssignFolderId, setCurrentStudentAssignFolderId] = useState<string | null>(null);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<AssignmentFolder | null>(null);
  const [submitType, setSubmitType] = useState<'direct_file' | 'gdrive_link'>('direct_file');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [directFileObj, setDirectFileObj] = useState<{ name: string; size: string; type: string; dataUrl: string } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Live Presentation Sync State for Student
  const [showLiveSyncModal, setShowLiveSyncModal] = useState(false);
  const [studentFollowSync, setStudentFollowSync] = useState(true);
  const [studentSlideOverride, setStudentSlideOverride] = useState<number | null>(null);
  const [forceRotate90, setForceRotate90] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const studentLiveScrollRef = useRef<HTMLDivElement | null>(null);
  const studentModalScrollRef = useRef<HTMLDivElement | null>(null);
  const lastSlideRef = useRef<number | null>(null);

  const handleToggleFullscreenLandscape = async () => {
    try {
      if (!isMobileFullscreen && !document.fullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if ((docEl as any).webkitRequestFullscreen) {
          await (docEl as any).webkitRequestFullscreen();
        }
        if (window.screen?.orientation && (window.screen.orientation as any).lock) {
          await (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
        setIsMobileFullscreen(true);
        toast.success('Mode Landscape Fullscreen Diaktifkan. Miringkan HP Anda!');
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen().catch(() => {});
        }
        if (window.screen?.orientation && (window.screen.orientation as any).unlock) {
          (window.screen.orientation as any).unlock();
        }
        setIsMobileFullscreen(false);
        setForceRotate90(false);
        toast.success('Kembali ke tampilan normal.');
      }
    } catch (err) {
      setForceRotate90(prev => !prev);
      toast.success(!forceRotate90 ? 'Layar Diputar 90° (Mode Tidur/Landscape HP)' : 'Layar Normal');
    }
  };

  // Auto-Reset Scroll to Top whenever the teacher changes the current slide
  useEffect(() => {
    if (livePresentation?.currentSlide !== undefined && livePresentation.currentSlide !== lastSlideRef.current) {
      lastSlideRef.current = livePresentation.currentSlide;
      const resetScroll = () => {
        [studentLiveScrollRef.current, studentModalScrollRef.current].forEach(el => {
          if (el) {
            el.scrollTop = 0;
          }
        });
      };
      resetScroll();
      requestAnimationFrame(resetScroll);
      const timer1 = setTimeout(resetScroll, 50);
      const timer2 = setTimeout(resetScroll, 150);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [livePresentation?.currentSlide, showLiveSyncModal]);

  useEffect(() => {
    if (!studentFollowSync || typeof livePresentation?.scrollPosition !== 'number') return;

    const scrollPct = livePresentation.scrollPosition;

    const applyScroll = () => {
      let matchedContainer = false;
      [studentLiveScrollRef.current, studentModalScrollRef.current].forEach(el => {
        if (el) {
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll > 0) {
            matchedContainer = true;
            const targetTop = Math.round((scrollPct / 100) * maxScroll);
            if (Math.abs(el.scrollTop - targetTop) > 1) {
              el.scrollTo({
                top: targetTop,
                behavior: 'smooth'
              });
            }
          } else {
            el.scrollTop = 0;
          }
        }
      });

      // Window scroll fallback if main page is scrolling
      const winMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (!matchedContainer && winMaxScroll > 0) {
        const winTargetTop = Math.round((scrollPct / 100) * winMaxScroll);
        if (Math.abs(window.scrollY - winTargetTop) > 2) {
          window.scrollTo({
            top: winTargetTop,
            behavior: 'smooth'
          });
        }
      }
    };

    applyScroll();
    const rafId = requestAnimationFrame(applyScroll);
    const timer1 = setTimeout(applyScroll, 40);
    const timer2 = setTimeout(applyScroll, 120);
    const timer3 = setTimeout(applyScroll, 300);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [livePresentation?.scrollPosition, studentFollowSync, livePresentation?.currentSlide, showLiveSyncModal, activeTab]);

  // ResizeObserver listener so if images, math, or text load dynamically, scroll stays locked to teacher
  useEffect(() => {
    if (!studentFollowSync || typeof livePresentation?.scrollPosition !== 'number') return;

    const scrollPct = livePresentation.scrollPosition;
    const syncScroll = () => {
      [studentLiveScrollRef.current, studentModalScrollRef.current].forEach(el => {
        if (el) {
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll > 0) {
            const targetTop = Math.round((scrollPct / 100) * maxScroll);
            if (Math.abs(el.scrollTop - targetTop) > 2) {
              el.scrollTo({
                top: targetTop,
                behavior: 'smooth'
              });
            }
          }
        }
      });
    };

    if (typeof ResizeObserver !== 'undefined') {
      const observers: ResizeObserver[] = [];
      [studentLiveScrollRef.current, studentModalScrollRef.current].forEach(el => {
        if (el) {
          const ro = new ResizeObserver(() => syncScroll());
          ro.observe(el);
          observers.push(ro);
        }
      });
      return () => observers.forEach(ro => ro.disconnect());
    }
  }, [livePresentation?.scrollPosition, studentFollowSync, showLiveSyncModal, activeTab]);

  useEffect(() => {
    if (livePresentation && livePresentation.active) {
      setShowLiveSyncModal(true);
      setStudentFollowSync(true);
      setStudentSlideOverride(null);
      setActiveTab('live_presentation');
      toast(`🔴 Presentasi Mode Lab Komputer "${livePresentation.materialTitle}" sedang ditayangkan oleh Guru!`, {
        icon: '📺',
        duration: 5000
      });
    }
  }, [
    livePresentation?.active, 
    livePresentation?.startedAt, 
    livePresentation?.materialId,
    livePresentation?.currentSlide
  ]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const alreadyCheckedIn = dailyCheckIns.some(c => c.studentNis === currentStudent.nis && c.date.startsWith(today));
    setHasCheckedIn(alreadyCheckedIn);
  }, [dailyCheckIns, currentStudent.nis]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  
  
  const handleCheckIn = () => {
    if (dailyNote.trim().length < 10) {
      toast.error('Mohon ceritakan sedikit alasanmu (minimal 10 karakter) agar Guru BK bisa memahamimu dengan baik.');
      return;
    }
    
    setIsSubmitting(true);
      if (onAddDailyCheckIn) {
        onAddDailyCheckIn({ studentNis: currentStudent.nis, date: new Date().toISOString(), mood: dailyMood, note: dailyNote.trim() });
        setHasCheckedIn(true);
        toast.success('Jurnal berhasil dikirim!');
      }
    setIsSubmitting(false);
  };


  const [showAKPDForm, setShowAKPDForm] = useState(false);
  const [akpdAnswers, setAkpdAnswers] = useState({
    q1: 0, q2: 0, q3: 0, q4: 0,
    q5: 0, q6: 0, q7: 0, q8: 0,
    q9: 0, q10: 0, q11: 0, q12: 0,
    q13: 0, q14: 0, q15: 0, q16: 0,
    essayEmotion: '',
    essaySocial: '',
    essayAcademic: '',
    essayCareer: ''
  });
  const [showSosiometriForm, setShowSosiometriForm] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const mySociometry = sociometries.find(s => s.studentNis === currentStudent.nis);
  useEffect(() => {
    if (showSosiometriForm) {
      setSelectedFriends(mySociometry?.friendsWith || []);
    }
  }, [showSosiometriForm, mySociometry]);
  const [showKarirForm, setShowKarirForm] = useState(false);
  const [showCounselingForm, setShowCounselingForm] = useState(false);
  const [counselingTopic, setCounselingTopic] = useState('');
  const [counselingDesc, setCounselingDesc] = useState('');
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



  // Materials Viewer State
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);

  // CBT Exam State
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});
  const [tokenError, setTokenError] = useState('');
  const [tokenErrors, setTokenErrors] = useState<Record<string, string>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: any }>({});
  
  // CBT Paginated & Navigation State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Record<string, boolean>>({});
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState<boolean>(false);
  
  // Submit exam state
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    totalPoints: number;
    maxPoints: number;
    answers: any[];
  } | null>(null);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter Materials & Exams to match Student's specific class
  const classMaterials = materials.filter(m => {
    if (m.status !== 'Aktif') return false;
    return Array.isArray(m.classId) ? m.classId.includes(currentStudent.classId) : m.classId === currentStudent.classId;
  });
  const classExams = exams.filter(e => {
    if (!e) return false;
    const stClassId = currentStudent.classId;
    const stClassName = currentStudent.className;
    if (Array.isArray(e.classId)) {
      return e.classId.includes(stClassId) || (stClassName ? e.classId.includes(stClassName) : false);
    }
    return e.classId === stClassId || (stClassName && e.classId === stClassName) || e.classId === 'all';
  });

  // Filter Teacher Announcements for this student
  const studentAnnouncements = announcements.filter(a => {
    if (!a.isActive) return false;
    
    // Auto-expiry: Sembunyikan informasi yang usianya lebih dari 7 hari (Otomatis Bersih)
    if (a.createdAt) {
      const createdAt = new Date(a.createdAt).getTime();
      const now = new Date().getTime();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (now - createdAt > SEVEN_DAYS) return false;
    }

    if (a.targetType === 'all') return true;
    if (a.targetType === 'class') {
      return a.targetClassName === currentStudent.className || a.targetClassId === currentStudent.classId;
    }
    return true;
  });

  const [readAnnouncements, setReadAnnouncements] = useState<string[]>(() => {
    const saved = localStorage.getItem(`gas_read_ann_${currentStudent.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showPopNotification, setShowPopNotification] = useState(false);
  const [showReadHistory, setShowReadHistory] = useState(false);

  useEffect(() => {
    // Pop-up hanya muncul untuk informasi yang Penting atau Mendesak
    const unreadUrgent = studentAnnouncements.filter(a => 
      !readAnnouncements.includes(a.id) && 
      (a.priority === 'mendesak' || a.priority === 'penting')
    );
    if (unreadUrgent.length > 0 && !examStarted) {
      setShowPopNotification(true);
    }
  }, [studentAnnouncements.length, currentStudent.id]);

  const handleMarkAsRead = (id: string) => {
    if (readAnnouncements.includes(id)) return;
    const next = [...readAnnouncements, id];
    setReadAnnouncements(next);
    localStorage.setItem(`gas_read_ann_${currentStudent.id}`, JSON.stringify(next));
    toast.success('Informasi telah dibaca & otomatis dibersihkan dari papan.');
  };

  const unreadCount = studentAnnouncements.filter(a => !readAnnouncements.includes(a.id)).length;

  // 🛡️ ANTI-CONTEK DETECTION LOGIC (Using window blur / page visibility)
  useEffect(() => {
    if (!examStarted || !activeExam) return;

    const recordCheat = (type: string) => {
      setCheatingAttempts(prev => {
        const next = prev + 1;
        onAddCheatLog({
          studentName: currentStudent.name,
          studentNis: currentStudent.nis,
          className: currentStudent.className || 'Kelas',
          examTitle: activeExam.title,
          violationType: `${type} (${next}x)`,
          examId: activeExam.id,
          teacherId: activeExam.teacherId,
          subjectId: activeExam.subjectId,
          classId: currentStudent.classId
        });
        return next;
      });
      setShowCheatModal(true);
    };

    const handleWindowBlur = () => {
      recordCheat('Keluar dari layar/tab aplikasi');
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        recordCheat('Aplikasi masuk ke background/ditutup');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordCheat('Mencoba klik kanan (Context Menu)');
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordCheat(`Mencoba ${e.type === 'copy' ? 'menyalin' : e.type === 'paste' ? 'menempel' : 'memotong'} (Clipboard)`);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Mencegah Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        recordCheat('Mencoba Screenshot (PrintScreen)');
      }
      
      // Mencegah Alt+Tab atau Windows Key (kalo bisa ditangkap)
      if (e.key === 'Meta' || e.key === 'Alt') {
        // Hanya catatan, OS event biasanya tidak bisa di block
      }

      // Mencegah Ctrl+C, Ctrl+V, dll
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          recordCheat(`Mencoba shortcut (Ctrl/Cmd+${e.key.toUpperCase()})`);
        }
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, activeExam, currentStudent, onAddCheatLog]);

  // Exam Countdown Timer
  useEffect(() => {
    if (examStarted && timerSeconds > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleAutoSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [examStarted, timerSeconds]);

  const handleStartExam = (exam: Exam) => {
    const rawInput = tokenInputs[exam.id] || tokenInput || '';
    const inputClean = rawInput.trim().toUpperCase();
    const targetToken = (exam.token || '').trim().toUpperCase();

    if (targetToken && inputClean !== targetToken) {
      const errMsg = `Token yang Anda masukkan (${inputClean || 'Kosong'}) salah! Token ujian ini adalah "${targetToken}". Periksa kembali besar/kecil huruf dan spasi.`;
      setTokenErrors(prev => ({ ...prev, [exam.id]: errMsg }));
      setTokenError(errMsg);
      toast.error('Token Kunci Ujian Salah!');
      return;
    }

    if (!exam.questions || exam.questions.length === 0) {
      const errMsg = 'Soal ujian ini belum memiliki butir pertanyaan dari guru! Mohon hubungi guru pengampu.';
      setTokenErrors(prev => ({ ...prev, [exam.id]: errMsg }));
      setTokenError(errMsg);
      toast.error('Paket Soal Ujian Kosong!');
      return;
    }

    setTokenErrors(prev => ({ ...prev, [exam.id]: '' }));
    setTokenError('');
    setActiveExam(exam);
    setTimerSeconds((exam.durationMinutes || 60) * 60);
    setExamStarted(true);
    setCheatingAttempts(0);
    setStudentAnswers({});
    setScoreResult(null);
    setCurrentQuestionIndex(0);
    setDoubtfulQuestions({});
    setShowConfirmSubmitModal(false);
    toast.success(`Selamat mengerjakan ${exam.title}!`);
  };

  const toggleDoubtful = (qId: string) => {
    setDoubtfulQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const checkQuestionAnswered = (q: ExamQuestion) => {
    const ans = studentAnswers[q.id];
    if (ans === undefined || ans === null) return false;
    if (typeof ans === 'string') return ans.trim() !== '';
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'number') return true;
    if (typeof ans === 'boolean') return true;
    return false;
  };

  const getExamSummaryStats = () => {
    if (!activeExam) return { total: 0, answered: 0, doubtful: 0, unanswered: 0 };
    const total = activeExam.questions.length;
    let answered = 0;
    let doubtful = 0;

    activeExam.questions.forEach(q => {
      const isAns = checkQuestionAnswered(q);
      const isDoubt = Boolean(doubtfulQuestions[q.id]);
      if (isDoubt) doubtful++;
      if (isAns) answered++;
    });

    const unanswered = Math.max(0, total - answered);
    return { total, answered, doubtful, unanswered };
  };

  const handleSelectAnswer = (qId: string, answer: any) => {
    setStudentAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSelectMultipleAnswer = (qId: string, option: string, checked: boolean) => {
    const current = (studentAnswers[qId] as string[]) || [];
    let next: string[];
    if (checked) {
      next = [...current, option];
    } else {
      next = current.filter(o => o !== option);
    }
    setStudentAnswers(prev => ({ ...prev, [qId]: next }));
  };

  // Evaluate final scoring strictly following our UjianController scoring system
  const handleEvaluateExam = () => {
    if (!activeExam) return;

    let totalPoints = 0;
    const maxPoints = activeExam.questions.length;
    const evaluatedAnswers: any[] = [];

    activeExam.questions.forEach(q => {
      const studentAns = studentAnswers[q.id];
      let isCorrect = false;
      let pointsEarned = 0;

      switch (q.type) {
        case 'PilihanGanda':
          if (studentAns && String(studentAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
            isCorrect = true;
            pointsEarned = 1;
          }
          break;

        case 'PilihanGandaKompleks':
          if (Array.isArray(studentAns) && Array.isArray(q.correctAnswers)) {
            const sortedStudent = [...studentAns].sort();
            const sortedCorrect = [...q.correctAnswers].sort();
            if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
              isCorrect = true;
              pointsEarned = 1;
            }
          }
          break;

        case 'PilihanAsosiatif':
          if (studentAns) {
            const correctCombination = q.correctCombination || [];
            let computedKey = '';
            
            const has1 = correctCombination.includes(1);
            const has2 = correctCombination.includes(2);
            const has3 = correctCombination.includes(3);
            const has4 = correctCombination.includes(4);
            const count = correctCombination.length;

            if (has1 && has2 && has3 && count === 3) computedKey = 'A';
            else if (has1 && has3 && count === 2) computedKey = 'B';
            else if (has2 && has4 && count === 2) computedKey = 'C';
            else if (has4 && count === 1) computedKey = 'D';
            else if (has1 && has2 && has3 && has4 && count === 4) computedKey = 'E';

            if (String(studentAns).trim().toUpperCase() === computedKey) {
              isCorrect = true;
              pointsEarned = 1;
            }
          }
          break;

        case 'SebabAkibat':
          if (studentAns) {
            let computedKey = '';
            const pBenar = q.correctStatementTrue;
            const aBenar = q.correctReasonTrue;
            const hubSebab = q.correctCausality;

            if (pBenar && aBenar && hubSebab) computedKey = 'A';
            else if (pBenar && aBenar && !hubSebab) computedKey = 'B';
            else if (pBenar && !aBenar) computedKey = 'C';
            else if (!pBenar && aBenar) computedKey = 'D';
            else if (!pBenar && !aBenar) computedKey = 'E';

            if (String(studentAns).trim().toUpperCase() === computedKey) {
              isCorrect = true;
              pointsEarned = 1;
            }
          }
          break;

        case 'Uraian':
          // Uraian questions require manual teacher grading.
          // Initial auto-score is 0 until teacher manually evaluates and approves points.
          isCorrect = false;
          pointsEarned = 0;
          break;
      }

      if (isCorrect) {
        totalPoints += pointsEarned;
      }

      evaluatedAnswers.push({
        questionId: q.id,
        studentAnswer: studentAns,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
        essayScore: 0,
        teacherNote: ''
      });
    });

    const hasEssayQuestions = activeExam.questions.some(q => q.type === 'Uraian');
    const finalScore = Math.round((totalPoints / maxPoints) * 100) || 0;

    // Send to main app spreadsheet storage
    onSubmitExam({
      examId: activeExam.id,
      examTitle: activeExam.title,
      studentName: currentStudent.name,
      studentNis: currentStudent.nis,
      className: currentStudent.className || 'Kelas VII-A',
      score: finalScore,
      answers: evaluatedAnswers,
      cheatingAttempts: cheatingAttempts,
      essayGraded: !hasEssayQuestions
    });

    setScoreResult({
      score: finalScore,
      totalPoints,
      maxPoints,
      answers: evaluatedAnswers
    });

    setExamStarted(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleAutoSubmitExam = () => {
    toast('Waktu ujian telah habis! Jawaban Anda otomatis terkirim.');
    handleEvaluateExam();
  };

  // Timer formatter
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <div className="space-y-6-6 max-w-7xl mx-auto animate-fade-in" id="student-panel-container">
      {/* Student Welcome Header */}
      {!examStarted && (
        <div className="space-y-4">
          {/* LIVE PRESENTATION SYNC ALERT BANNER FOR COMPUTER LAB */}
          {livePresentation?.active && (
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse border-2 border-red-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Radio className="w-6 h-6 text-white animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/30 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      🔴 LIVE PRESENTASI LAB KOMPUTER
                    </span>
                    <span className="text-xs font-bold text-amber-200">
                      Guru: {livePresentation.teacherName}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base mt-0.5 text-white">
                    {livePresentation.materialTitle}
                  </h3>
                  <p className="text-[11px] text-red-100 mt-0.5">
                    Sedang ditayangkan di Slide {livePresentation.currentSlide} dari {livePresentation.totalSlides}.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLiveSyncModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-red-700 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Tv className="w-4 h-4 text-red-600" />
                <span>Gabung Presentasi Sync (Lab)</span>
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Pembelajaran Interaktif Digital
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1.5">Halo, {currentStudent.name}</h2>
              <p className="text-xs text-slate-500">
                NIS: <strong>{currentStudent.nis}</strong> • Kelas : <strong className="text-indigo-600">{currentStudent.className || 'VII-A'}</strong>
              </p>
            </div>

          <div className="flex flex-row sm:flex-nowrap gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('beranda')}
              className={`flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'beranda'
                  ? 'bg-amber-100 text-amber-900 shadow-xs border border-amber-300 font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
              <span>Beranda & Notifikasi</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* DEDICATED LIVE PRESENTATION / MODE LAB TAB */}
            <button
              onClick={() => {
                setActiveTab('live_presentation');
                if (livePresentation?.active) {
                  setShowLiveSyncModal(true);
                }
              }}
              className={`flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                livePresentation?.active
                  ? 'bg-red-600 text-white shadow-lg animate-pulse font-black ring-2 ring-red-400'
                  : activeTab === 'live_presentation'
                  ? 'bg-red-50 text-red-700 font-extrabold border border-red-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${livePresentation?.active ? 'text-white animate-spin' : 'text-red-500'}`} />
              <span>📺 Mode Lab Presentasi</span>
              {livePresentation?.active && (
                <span className="bg-white text-red-600 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  LIVE
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bk')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeTab === 'bk' 
                  ? 'bg-teal-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Heart className="w-4 h-4" /> Bimbingan & Konseling
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📚 Bahan Ajar & Materi
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📁 Kirim Tugas (GDrive)
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'exams'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              ✍️ Ujian/Soal Evaluasi
            </button>
            <button
              onClick={() => setActiveTab('scores')}
              className={`flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'scores'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📊 Riwayat Nilai
            </button>
          </div>
        </div>
        </div>
      )}

      {/* DEDICATED LIVE PRESENTATION / MODE LAB TAB SECTION */}
      {activeTab === 'live_presentation' && !examStarted && (
        <div className="space-y-6 animate-fade-in">
          {livePresentation?.active ? (
            <div className="bg-slate-950 border-2 border-red-500 rounded-3xl shadow-2xl p-6 text-white space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center font-black animate-pulse shadow-lg shrink-0">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] font-black rounded-full uppercase tracking-wider">
                        🔴 SIARAN LIVE AKTIF
                      </span>
                      <span className="text-xs text-slate-300 font-bold">
                        Guru Pengampu: {livePresentation.teacherName}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {livePresentation.materialTitle}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setForceRotate90(!forceRotate90)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      forceRotate90
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                    }`}
                    title="Rotasi Layar 90° jika HP terkunci di mode berdiri (portrait)"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{forceRotate90 ? 'Layar 90° On' : '🔄 Rotasi 90° HP'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFullscreenLandscape}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    title="Buka Mode Fullscreen & Rotasi Landscape HP"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Mode Tidur (Landscape)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentFollowSync(!studentFollowSync);
                      if (!studentFollowSync) setStudentSlideOverride(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      studentFollowSync
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {studentFollowSync ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{studentFollowSync ? 'Sync Otomatis Terkunci' : 'Sync Dilepas (Bebas)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLiveSyncModal(true)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Layar Penuh Modal</span>
                  </button>
                </div>
              </div>

              {/* Slide Screen View */}
              {(() => {
                const activeSlide = studentFollowSync ? livePresentation.currentSlide : (studentSlideOverride || livePresentation.currentSlide);
                const mat = materials.find(m => m.id === livePresentation.materialId);
                const currentUrl = mat?.fileUrl || '';
                let embedUrl: string | null = null;
                if (currentUrl.includes('youtube.com/watch') || currentUrl.includes('youtu.be/')) {
                  let vId = '';
                  if (currentUrl.includes('v=')) vId = currentUrl.split('v=')[1]?.split('&')[0] || '';
                  else if (currentUrl.includes('youtu.be/')) vId = currentUrl.split('youtu.be/')[1]?.split('?')[0] || '';
                  if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
                } else if (currentUrl.includes('drive.google.com/file/d/')) {
                  const fId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (fId) embedUrl = `https://drive.google.com/file/d/${fId}/preview`;
                } else if (currentUrl.includes('docs.google.com/presentation/d/')) {
                  const sId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (sId) embedUrl = `https://docs.google.com/presentation/d/${sId}/embed?start=false&loop=false&delayms=3000#slide=${activeSlide}`;
                } else if (currentUrl.includes('docs.google.com/document/d/')) {
                  const dId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (dId) embedUrl = `https://docs.google.com/document/d/${dId}/pub?embedded=true`;
                } else if (currentUrl.toLowerCase().endsWith('.pdf') || currentUrl.toLowerCase().includes('.pdf?')) {
                  embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentUrl)}&embedded=true#page=${activeSlide}`;
                }
                const isImg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(currentUrl) || currentUrl.startsWith('data:image/');

                // Split text content into paragraphs/slides if available
                const contentParagraphs = mat?.content ? mat.content.split(/\n\s*\n|\n(?=[A-Z0-9])|---/).filter(p => p.trim()) : [];
                const activeContentChunk = contentParagraphs.length > 0 
                  ? (contentParagraphs[Math.min(activeSlide - 1, contentParagraphs.length - 1)] || mat?.content)
                  : mat?.content;

                const displayTotal = Math.max(livePresentation.totalSlides || 1, contentParagraphs.length || 1);

                return (
                  <div 
                    ref={studentLiveScrollRef}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 relative flex flex-col items-center justify-start text-center space-y-4 shadow-2xl min-h-[500px] overflow-y-auto max-h-[75vh] scroll-smooth"
                  >
                    {/* Laser Pointer overlay from Teacher */}
                    {livePresentation.laserPointer && studentFollowSync && (
                      <div
                        className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
                        style={{
                          left: `${livePresentation.laserPointer.x}%`,
                          top: `${livePresentation.laserPointer.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          <span className="absolute w-8 h-8 rounded-full bg-red-500/60 animate-ping" />
                          <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_15px_rgba(239,68,68,1)] flex items-center justify-center" />
                          <span className="absolute left-6 whitespace-nowrap bg-red-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg border border-red-400">
                            🔴 Laser Guru: {livePresentation.teacherName}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-bold border border-slate-700 shrink-0">
                      <Tv className="w-3.5 h-3.5 text-emerald-400" />
                      <span>TAYANG REAL-TIME • SLIDE {activeSlide}/{displayTotal}</span>
                      {studentFollowSync && typeof livePresentation?.scrollPosition === 'number' && (
                        <span className="ml-1 px-2 py-0.5 bg-emerald-950/80 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-700/80 flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Scroll Sync ({Math.round(livePresentation.scrollPosition)}%)
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white max-w-2xl shrink-0">
                      {mat?.title || livePresentation.materialTitle}
                    </h3>

                    {embedUrl ? (
                      <div className="w-full h-[60vh] max-w-4xl rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl my-2 shrink-0">
                        <iframe
                          key={`student_tab_embed_${embedUrl}_${activeSlide}`}
                          src={embedUrl}
                          className="w-full h-full border-0"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          title="Media Presentasi Tab Siswa"
                        />
                      </div>
                    ) : isImg ? (
                      <div className="max-w-3xl max-h-[60vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl my-2 shrink-0">
                        <img src={currentUrl} alt="Slide Media" className="max-h-[55vh] object-contain mx-auto" />
                      </div>
                    ) : mat?.content ? (
                      <div className="w-full max-w-3xl text-sm text-slate-200 leading-relaxed text-left bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 shadow-inner space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2 text-xs text-amber-300 font-extrabold">
                          <span>📌 Bagian Slide / Paragraf {activeSlide}</span>
                          <span className="text-[10px] bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-800/60">Disinkronkan Guru</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-100 text-base leading-relaxed">
                          {activeContentChunk}
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-300 max-w-lg space-y-3">
                        <p className="text-xs">
                          Materi pembelajaran ini sedang dipandu langsung oleh Bpk/Ibu Guru di lab komputer.
                        </p>
                        {currentUrl && (
                          <a
                            href={currentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                          >
                            <ExternalLink className="w-4 h-4" /> Buka Dokumen / Slide Sumber
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Tv className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-black text-slate-900">Mode Lab Komputer Real-Time</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Belum ada siaran presentasi yang diaktifkan oleh Guru saat ini. Ketika Guru menekan tombol <strong>Mode Lab</strong> di layar utama, tayangan slide dan penjelasan akan otomatis muncul secara Pop-up Modal di seluruh komputer siswa secara real-time.
                </p>
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Lihat Perpustakaan Bahan Ajar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BERANDA & NOTIFIKASI GURU SECTION */}
      
      {activeTab === 'bk' && !examStarted && (
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
                      className={`py-3 px-2 rounded-xl border-2 transition font-bold text-sm ${dailyMood === mood ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}
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
                    placeholder="Kenapa kamu merasa demikian hari ini? Ceritakan sedikit alasanmu (wajib, min 10 karakter)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleCheckIn}
                  disabled={isSubmitting || dailyNote.trim().length < 10}
                  className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md w-full"
                >
                  Kirim Jurnal Harian
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">Layanan BK Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setShowAKPDForm(true)} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <FileText className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Isi Asesmen Kebutuhan Murid (AKM)</span>
                <span className="text-xs text-slate-500">Bantu kami memahami kebutuhanmu di sekolah</span>
              </button>
              <button onClick={() => setShowSosiometriForm(true)} className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center transition gap-2 group ${mySociometry ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                {mySociometry ? (
                  <CheckCircle className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition" />
                ) : (
                  <Users className="w-8 h-8 text-rose-500 group-hover:scale-110 transition" />
                )}
                <span className="font-bold text-slate-800">{mySociometry ? 'Edit Sosiometri Kelas' : 'Isi Sosiometri Kelas'}</span>
                <span className={`text-xs ${mySociometry ? 'text-emerald-600' : 'text-slate-500'}`}>{mySociometry ? 'Sudah Diisi' : 'Pemetaan hubungan pertemanan di kelas'}</span>
              </button>

              <button onClick={() => setShowKarirForm(true)} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <Briefcase className="w-8 h-8 text-amber-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Karir & Peminatan</span>
                <span className="text-xs text-slate-500">Rencanakan cita-cita & minatmu</span>
              </button>
              <button onClick={() => setShowCounselingForm(true)} className="p-4 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition gap-2 group">
                <MessageSquare className="w-8 h-8 text-teal-500 group-hover:scale-110 transition" />
                <span className="font-bold text-slate-800">Ruang Konsultasi BK</span>
                <span className="text-xs text-slate-500">Ajukan sesi konseling ke Guru BK</span>
              </button>

            </div>
          </div>

          
          {/* Modal Ruang Konseling */}
          {showCounselingForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50">
                  <div>
                    <h2 className="text-xl font-black text-teal-900">Ruang Konsultasi & Konseling BK</h2>
                    <p className="text-sm text-teal-700 mt-1">Ajukan jadwal atau diskusikan masalahmu dengan Guru BK.</p>
                  </div>
                  <button onClick={() => setShowCounselingForm(false)} className="p-2 hover:bg-teal-100 rounded-full text-teal-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Form Pengajuan Baru */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-teal-500" /> Ajukan Konseling Baru</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Topik Konseling *</label>
                        <select
                          value={counselingTopic}
                          onChange={e => setCounselingTopic(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="">Pilih Topik...</option>
                          <option value="Pribadi">Masalah Pribadi</option>
                          <option value="Sosial">Masalah Sosial/Pertemanan</option>
                          <option value="Belajar">Masalah Belajar/Akademik</option>
                          <option value="Karir">Bimbingan Karir & Studi Lanjut</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Ceritakan Singkat Permasalahanmu *</label>
                        <textarea
                          value={counselingDesc}
                          onChange={e => setCounselingDesc(e.target.value)}
                          placeholder="Ceritakan dengan aman & rahasia. Kenapa kamu butuh konseling?"
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <button
                        disabled={!counselingTopic || !counselingDesc.trim() || isSubmitting}
                        onClick={() => {
                          if (!onAddStudentCounselingRequest || !currentStudent) return;
                          setIsSubmitting(true);
                          try {
                            onAddStudentCounselingRequest({
                              studentId: currentStudent.id,
                              studentName: currentStudent.name,
                              className: classes.find(c => c.id === currentStudent.classId)?.name || '',
                              topic: counselingTopic,
                              description: counselingDesc.trim(),
                              status: 'Menunggu',
                            });
                            toast.success('Permintaan konseling terkirim!');
                            setCounselingTopic('');
                            setCounselingDesc(''); setShowCounselingForm(false);
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md w-full"
                      >
                        {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Konseling'}
                      </button>
                    </div>
                  </div>

                  {/* Riwayat Pengajuan */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-teal-500" /> Riwayat Permintaanmu</h3>
                    {!studentCounselingRequests || studentCounselingRequests.filter(r => r.studentId === currentStudent?.id).length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-xl">Belum ada riwayat konseling.</p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {studentCounselingRequests
                          .filter(r => r.studentId === currentStudent?.id)
                          .sort((a,b) => b.requestedAt - a.requestedAt)
                          .map((req, idx) => (
                          <div key={req.id || idx} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{req.topic}</span>
                                <span className="text-xs text-slate-400 ml-2">{new Date(req.requestedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'})}</span>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                req.status === 'Menunggu' ? 'bg-amber-100 text-amber-700' :
                                req.status === 'Dijadwalkan' ? 'bg-blue-100 text-blue-700' : req.status === 'Diproses' ? 'bg-indigo-100 text-indigo-700' :
                                req.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium mb-3">{req.description}</p>
                            
                            {req.feedback && (
                              <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
                                <p className="text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Tanggapan Guru BK:</p>
                                <p className="text-sm text-teal-800">{req.feedback}</p>
                                {req.scheduledAt && (
                                  <div className="mt-2 flex items-center gap-2 text-teal-900 bg-teal-100/50 p-2 rounded-lg font-bold text-xs">
                                    <Clock className="w-4 h-4" /> Jadwal: {req.scheduledAt}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal AKPD */}
          {showAKPDForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                  <div>
                    <h2 className="text-xl font-black text-indigo-900">Formulir AKM</h2>
                    <p className="text-sm text-indigo-700 mt-1">Asesmen Kebutuhan Murid - Skala Likert & Esai</p>
                  </div>
                  <button onClick={() => setShowAKPDForm(false)} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-8">
                  <div className="bg-indigo-50/50 p-4 rounded-xl text-sm text-indigo-800 border border-indigo-100">
                    <p className="font-bold mb-2">Silahkan beri tanda pada pilihan yang paling sesuai dengan kondisimu:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="font-bold">TP</span> : Tidak Pernah</li>
                      <li><span className="font-bold">KD</span> : Kadang-Kadang</li>
                      <li><span className="font-bold">SR</span> : Sering</li>
                    </ul>
                  </div>

                  {/* Likert Scale Questions */}
                  <div className="space-y-6">
                    {/* Pribadi */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">A. BIDANG PRIBADI (Kematangan Emosi & Kemandirian)</h3>
                      {[
                        { id: 'q1', text: 'Saya merasa sulit mengendalikan emosi saat marah atau kecewa.' },
                        { id: 'q2', text: 'Saya merasa kurang percaya diri dengan bentuk tubuh/penampilan saya.' },
                        { id: 'q3', text: 'Saya sering merasa cemas atau stres tanpa alasan yang jelas.' },
                        { id: 'q4', text: 'Saya merasa sulit untuk menolak ajakan teman yang berdampak buruk.' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+1}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sosial */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">B. BIDANG SOSIAL (Hubungan Remaja & Adaptasi)</h3>
                      {[
                        { id: 'q5', text: 'Saya merasa canggung atau sulit beradaptasi di lingkungan sekolah baru.' },
                        { id: 'q6', text: 'Saya pernah/sedang mengalami ejekan, kucilan, atau bullying dari teman.' },
                        { id: 'q7', text: 'Saya merasa suasana atau komunikasi di dalam rumah kurang harmonis.' },
                        { id: 'q8', text: 'Saya merasa kesulitan dalam mencari teman akrab di kelas.' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+5}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Belajar */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">C. BIDANG BELAJAR (Metode & Hambatan Akademik SMP)</h3>
                      {[
                        { id: 'q9', text: 'Saya sering menunda-nunda mengerjakan tugas sekolah sampai menumpuk.' },
                        { id: 'q10', text: 'Belajar di rumah sering terganggu karena kecanduan game atau media sosial.' },
                        { id: 'q11', text: 'Saya merasa grogi, pusing, atau takut yang berlebihan saat menghadapi ujian.' },
                        { id: 'q12', text: 'Saya belum tahu gaya belajar yang cocok untuk saya (Visual/Auditori/Kinestetik).' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+9}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Karier */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      <h3 className="font-bold text-slate-800 bg-slate-100 p-2 rounded-lg">D. BIDANG KARIER (Pengenalan Potensi & Masa Depan)</h3>
                      {[
                        { id: 'q13', text: 'Saya belum mengetahui bakat, minat, atau potensi utama dalam diri saya.' },
                        { id: 'q14', text: 'Saya bingung menentukan pilihan antara masuk SMA atau SMK setelah lulus SMP.' },
                        { id: 'q15', text: 'Pilihan sekolah lanjutan saya berbeda dengan keinginan orang tua.' },
                        { id: 'q16', text: 'Saya membutuhkan informasi mengenai jenis-jenis pekerjaan di masa depan.' }
                      ].map((q, i) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 transition rounded-lg">
                          <p className="text-sm text-slate-700 flex-1"><span className="font-bold mr-2">{i+13}.</span>{q.text}</p>
                          <div className="flex gap-2 shrink-0">
                            {[
                              { label: 'TP', val: 1 },
                              { label: 'KD', val: 2 },
                              { label: 'SR', val: 3 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => setAkpdAnswers({...akpdAnswers, [q.id]: opt.val})}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${(akpdAnswers as any)[q.id] === opt.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Essay Section */}
                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <div className="bg-indigo-50/50 p-4 rounded-xl text-sm text-indigo-800 border border-indigo-100">
                      <p className="font-bold mb-1">BAGIAN B: PERTANYAAN ESAY TERBUKA (Eksplorasi Mendalam)</p>
                      <p>Jawablah pertanyaan di bawah ini dengan singkat dan jujur.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Kondisi Emosi</label>
                        <p className="text-sm text-slate-600 mb-2">Apa hal yang paling sering membuatmu merasa sedih, kecewa, atau tertekan dalam 3 bulan terakhir ini?</p>
                        <textarea
                          value={akpdAnswers.essayEmotion}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essayEmotion: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Hubungan Sosial</label>
                        <p className="text-sm text-slate-600 mb-2">Jika kamu memiliki masalah (baik di rumah maupun di sekolah), siapakah orang pertama yang biasanya kamu ajak bercerita atau meminta bantuan?</p>
                        <textarea
                          value={akpdAnswers.essaySocial}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essaySocial: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Target Belajar</label>
                        <p className="text-sm text-slate-600 mb-2">Apa kesulitan terbesar yang kamu hadapi pada mata pelajaran tertentu di SMP saat ini?</p>
                        <textarea
                          value={akpdAnswers.essayAcademic}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essayAcademic: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Cita-Cita Awal</label>
                        <p className="text-sm text-slate-600 mb-2">Sebutkan 2 profesi atau pekerjaan yang paling kamu impikan saat ini!</p>
                        <textarea
                          value={akpdAnswers.essayCareer}
                          onChange={(e) => setAkpdAnswers({...akpdAnswers, essayCareer: e.target.value})}
                          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition resize-none"
                          rows={3}
                          placeholder="Jawaban..."
                        />
                      </div>
                    </div>
                  </div>

                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button onClick={() => setShowAKPDForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      // Check if all Likert questions are answered
                      const allAnswered = Object.keys(akpdAnswers).filter(k => k.startsWith('q')).every(k => (akpdAnswers as any)[k] > 0);
                      if (!allAnswered) {
                        toast.error('Mohon isi semua pertanyaan pilihan ganda terlebih dahulu.');
                        return;
                      }

                      if (onAddNeedsAssessment) {
                        onAddNeedsAssessment({
                          studentNis: currentStudent.nis,
                          ...akpdAnswers
                        } as any);
                      }
                      setShowAKPDForm(false);
                      toast.success('AKM Berhasil Disimpan!');
                    }} 
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
                  >
                    Kirim Asesmen
                  </button>
                </div>
              </div>
            </div>
          )}

                    {/* Modal Sosiometri */}
          {showSosiometriForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                  <div>
                    <h2 className="text-xl font-black text-rose-900">Formulir Sosiometri</h2>
                    <p className="text-sm text-rose-700 mt-1">Pilih teman di kelasmu (Maksimal 3 orang)</p>
                  </div>
                  <button onClick={() => setShowSosiometriForm(false)} className="p-2 hover:bg-rose-100 rounded-full text-rose-700 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <p className="text-sm text-slate-600 mb-4">Siapa teman di kelas yang paling sering kamu jadikan tempat berdiskusi atau bekerja kelompok?</p>
                  
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-800 mb-3">Teman Terpilih ({selectedFriends.length}/3)</p>
                    {selectedFriends.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada teman yang dipilih</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedFriends.map((nis, idx) => {
                          const f = students.find(s => s.nis === nis);
                          return (
                            <div key={`${nis}_${idx}`} className="flex items-center gap-1.5 bg-rose-100 text-rose-800 px-3 py-1.5 rounded-full text-sm font-bold border border-rose-200 shadow-sm">
                              {f?.name}
                              <button onClick={(e) => { e.stopPropagation(); setSelectedFriends(selectedFriends.filter(n => n !== nis)); }} className="hover:text-rose-950 hover:bg-rose-200 p-0.5 rounded-full transition ml-1" title="Hapus pilihan ini">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-800 mb-3">Daftar Teman Kelas</p>
                  <div className="space-y-2">
                    {students.filter(s => s.classId === currentStudent.classId && s.nis !== currentStudent.nis).map(friend => (
                      <button
                        key={friend.id || friend.nis}
                        onClick={() => {
                          if (selectedFriends.includes(friend.nis)) {
                            setSelectedFriends(selectedFriends.filter(nis => nis !== friend.nis));
                          } else if (selectedFriends.length < 3) {
                            setSelectedFriends([...selectedFriends, friend.nis]);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border-2 transition flex items-center justify-between ${selectedFriends.includes(friend.nis) ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-700 hover:border-rose-300'}`}
                      >
                        <span className="font-bold">{friend.name}</span>
                        {selectedFriends.includes(friend.nis) && <CheckCircle className="w-5 h-5 text-rose-500" />}
                      </button>
                    ))}
                    {students.filter(s => s.classId === currentStudent.classId && s.nis !== currentStudent.nis).length === 0 && (
                      <div className="text-center p-4 text-slate-500 bg-slate-50 rounded-xl">Belum ada data teman di kelas ini.</div>
                    )}
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  {mySociometry && onDeleteSociometry && (
                    <button 
                      onClick={() => {
                        onDeleteSociometry(mySociometry.id);
                        setShowSosiometriForm(false);
                        toast.success('Data Sosiometri Dihapus!');
                      }} 
                      className="mr-auto px-5 py-2.5 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition">
                      Hapus Data
                    </button>
                  )}
                  <button onClick={() => setShowSosiometriForm(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition">
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      if (mySociometry && onUpdateSociometry) {
                        onUpdateSociometry(mySociometry.id, { friendsWith: selectedFriends });
                        toast.success('Pilihan Teman Berhasil Diperbarui!');
                      } else if (onAddSociometry) {
                        onAddSociometry({
                          studentNis: currentStudent.nis,
                          classId: currentStudent.classId,
                          friendsWith: selectedFriends
                        });
                        toast.success('Sosiometri Berhasil Disimpan!');
                      }
                      setShowSosiometriForm(false);
                    }} 
                    disabled={selectedFriends.length === 0}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-md transition"
                  >
                    {mySociometry ? 'Simpan Perubahan' : 'Kirim Pilihan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {activeTab === 'beranda' && !examStarted && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-slate-950 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-950/70 block">Notifikasi Guru</span>
                <h3 className="text-2xl font-black mt-0.5">{studentAnnouncements.length} Catatan</h3>
                <p className="text-xs text-amber-950/80 font-semibold mt-1">{unreadCount} belum dibaca</p>
              </div>
              <Megaphone className="w-10 h-10 text-amber-950/30" />
            </div>

            <div
              onClick={() => setActiveTab('materials')}
              className="bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Materi Pembelajaran</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{classMaterials.length} File E-Book</h3>
                <p className="text-xs text-indigo-600 font-bold mt-1">Buka e-learning kelas →</p>
              </div>
              <BookOpen className="w-10 h-10 text-indigo-100" />
            </div>

            <div
              onClick={() => setActiveTab('exams')}
              className="bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Jadwal Tes & Ujian CBT</span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{classExams.length} Tes Tersedia</h3>
                <p className="text-xs text-indigo-600 font-bold mt-1">Siapkan token ujian →</p>
              </div>
              <Clock className="w-10 h-10 text-indigo-100" />
            </div>
          </div>

          {/* Main Notification Feed */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
                  Papan Informasi & Catatan Guru Mapel
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Catatan penting, arahan tugas, dan jadwal pembelajaran yang diinformasikan langsung oleh guru kepada kelas Anda.
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => studentAnnouncements.forEach(a => handleMarkAsRead(a.id))}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-extrabold px-3.5 py-2 rounded-xl transition self-start sm:self-auto cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600" /> Tandai Semua Sudah Dibaca
                </button>
              )}
            </div>

            {(() => {
              const unreadList = studentAnnouncements.filter(a => !readAnnouncements.includes(a.id));
              const readList = studentAnnouncements.filter(a => readAnnouncements.includes(a.id));

              if (studentAnnouncements.length === 0) {
                return (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-semibold text-xs">Belum ada catatan atau pengumuman dari guru mapel untuk kelas {currentStudent.className}.</p>
                  </div>
                );
              }

              if (unreadList.length === 0) {
                return (
                  <div className="space-y-4">
                    <div className="text-center py-10 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30 space-y-3">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                      <div>
                        <h4 className="text-slate-900 font-extrabold text-sm">Semua Catatan Guru Telah Dibaca!</h4>
                        <p className="text-slate-600 text-xs mt-0.5">Papan informasi Anda bersih. Tidak ada pengumuman baru yang tertunda.</p>
                      </div>
                      {readList.length > 0 && (
                        <button
                          onClick={() => setShowReadHistory(!showReadHistory)}
                          className="bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5 mt-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          {showReadHistory ? 'Sembunyikan Riwayat Terbaca' : `📋 Lihat Riwayat Informasi Terbaca (${readList.length})`}
                        </button>
                      )}
                    </div>

                    {showReadHistory && readList.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Riwayat Catatan Yang Telah Dibaca:</span>
                        {readList.map(ann => (
                          <div key={ann.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 opacity-80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 text-xs">👨‍🏫 {ann.teacherName} ({ann.teacherSubject})</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Terbaca
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-800 text-sm">{ann.title}</h5>
                            <div className="text-xs text-slate-600 leading-relaxed">{renderFormattedText(ann.content)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {unreadList.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 bg-gradient-to-r from-amber-50 via-amber-50/30 to-white border-amber-300 shadow-sm animate-fade-in"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Baru
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                              ann.priority === 'mendesak' ? 'bg-rose-100 text-rose-800 border border-rose-200 font-black' :
                              ann.priority === 'penting' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {ann.priority === 'mendesak' ? '🚨 Perhatian Mendesak' : ann.priority === 'penting' ? '⭐ Penting' : 'ℹ️ Info Mapel'}
                            </span>
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              👨‍🏫 {ann.teacherName} ({ann.teacherSubject})
                            </span>
                          </div>

                          <button
                            onClick={() => handleMarkAsRead(ann.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 text-[11px] font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            title="Klik jika sudah membaca & mengerti. Catatan ini akan otomatis dibersihkan dari papan utama."
                          >
                            <CheckCircle2 className="w-4 h-4 text-slate-950" /> Mengerti & Sudah Dibaca
                          </button>
                        </div>

                        <h4 className="font-extrabold text-slate-950 text-base">{ann.title}</h4>
                        <div className="text-xs text-slate-700 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                          {renderFormattedText(ann.content)}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Ditujukan untuk: <strong className="text-slate-600">{ann.targetType === 'all' ? 'Seluruh Siswa SMPN 1 Beji' : `Kelas ${ann.targetClassName}`}</strong></span>
                        <span>Diterbitkan: {new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}

                  {readList.length > 0 && (
                    <div className="pt-2 text-right">
                      <button
                        onClick={() => setShowReadHistory(!showReadHistory)}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                      >
                        {showReadHistory ? 'Sembunyikan Riwayat Terbaca' : `📋 Lihat Catatan Terbaca Sebelumnya (${readList.length})`}
                      </button>
                    </div>
                  )}

                  {showReadHistory && readList.length > 0 && (
                    <div className="space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Riwayat Catatan Yang Telah Dibaca:</span>
                      {readList.map(ann => (
                        <div key={ann.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 opacity-80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 text-xs">👨‍🏫 {ann.teacherName} ({ann.teacherSubject})</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Terbaca
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-800 text-sm">{ann.title}</h5>
                          <div className="text-xs text-slate-600 leading-relaxed">{renderFormattedText(ann.content)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MATERIALS BROWSER */}
      {activeTab === 'materials' && !examStarted && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Materi Pelajaran Aktif</h3>
            <p className="text-slate-500 text-xs mt-0.5">Daftar buku pegangan, PDF ringkasan, dan materi video pembelajaran resmi untuk kelas Anda.</p>
          </div>

          {classMaterials.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-xs">Belum ada materi pembelajaran aktif untuk kelas Anda saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classMaterials.map((mat) => {
                const subjectName = subjects.find(s => s.id === mat.subjectId)?.name || 'Mata Pelajaran';
                const teacherName = mat.teacherId
                  ? teachers.find(t => t.id === mat.teacherId)?.name
                  : teachers.find(t => (t.subject || '').split(',').map(s => s.trim().toLowerCase()).includes(subjectName.toLowerCase()))?.name || 'Guru Mapel';

                return (
                  <div key={mat.id} className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        mat.fileType === 'PDF' ? 'bg-red-50 text-red-700 border border-red-100' :
                        mat.fileType === 'Video' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        mat.fileType === 'Word' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        mat.fileType === 'Excel' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        mat.fileType === 'PPT' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {mat.fileType}
                      </span>
                      <h4 className="font-bold text-slate-950 text-sm leading-snug">{mat.title}</h4>

                      {/* INFO MAPEL & GURU */}
                      <div className="pt-2.5 space-y-1.5 text-slate-600 text-[11px] border-t border-slate-150/50 mt-2.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Mapel: <strong className="text-slate-800">{subjectName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Guru: <span className="font-semibold text-slate-700">{teacherName}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 block">Siswa {currentStudent.className}</span>
                      {mat.fileType === 'Article' ? (
                        <button
                          onClick={() => setActiveMaterial(mat)}
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Baca Artikel
                        </button>
                      ) : (
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Buka Materi
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TUGAS & PENGUMPULAN SISWA (GDRIVE) TAB */}
      {activeTab === 'assignments' && !examStarted && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6 animate-fade-in">
          {/* Header & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Pengumpulan Tugas (GDrive)
                </span>
                <span className="text-xs text-slate-500 font-bold">Kelas: {currentStudent.className}</span>
              </div>
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-2">
                <Folder className="w-6 h-6 text-emerald-600" /> Folder Tugas Pembelajaran Guru
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Akses folder tugas yang telah disediakan oleh Guru, buka link Google Drive guru, dan kirimkan bukti pengumpulan tugas Anda di sini.
              </p>
            </div>

            {currentStudentAssignFolderId && (
              <button
                onClick={() => setCurrentStudentAssignFolderId(null)}
                className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                ← Kembali ke Root Folder
              </button>
            )}
          </div>

          {/* Breadcrumb Path */}
          {(() => {
            const path: AssignmentFolder[] = [];
            let curr = currentStudentAssignFolderId;
            while (curr) {
              const found = assignmentFolders.find(f => f.id === curr);
              if (found) {
                path.unshift(found);
                curr = found.parentId || null;
              } else {
                break;
              }
            }

            return (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 overflow-x-auto">
                <button
                  onClick={() => setCurrentStudentAssignFolderId(null)}
                  className={`hover:text-emerald-700 transition cursor-pointer flex items-center gap-1 ${!currentStudentAssignFolderId ? 'text-emerald-700 font-black' : ''}`}
                >
                  <Folder className="w-4 h-4 text-amber-500" /> Utama (Semua Tugas Kelas)
                </button>
                {path.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <span className="text-slate-300">/</span>
                    <button
                      onClick={() => setCurrentStudentAssignFolderId(item.id)}
                      className={`hover:text-emerald-700 transition cursor-pointer ${idx === path.length - 1 ? 'text-emerald-700 font-black' : ''}`}
                    >
                      {item.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            );
          })()}

          {/* Directory Content List */}
          {(() => {
            // Filter assignmentFolders for student's class
            const currentItems = assignmentFolders.filter(item => {
              const isDirectChild = (item.parentId || null) === currentStudentAssignFolderId;
              if (!isDirectChild) return false;

              // Filter by class if assigned
              if (item.classId) {
                const targetClass = classes.find(c => c.id === item.classId);
                const matchesClass = item.classId === currentStudent.classId || 
                  (targetClass && targetClass.name === currentStudent.className);
                if (!matchesClass) return false;
              }
              return true;
            });

            if (currentItems.length === 0) {
              return (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                  <Folder className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">Belum Ada Folder / Tugas Di Sini</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Guru belum menambahkan folder atau tugas baru di direktori ini untuk kelas {currentStudent.className}.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentItems.map(item => {
                  if (item.type === 'folder') {
                    return (
                      <div
                        key={item.id}
                        onClick={() => setCurrentStudentAssignFolderId(item.id)}
                        className="p-5 bg-gradient-to-br from-amber-50/50 to-amber-100/30 border border-amber-200/80 rounded-2xl hover:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-amber-500/10 rounded-xl group-hover:scale-105 transition-transform">
                            <Folder className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-800 transition">
                              {item.title}
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                              Guru: {item.teacherName || 'Guru Mapel'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Item is Assignment
                  const targetSubject = subjects.find(s => s.id === item.subjectId);
                  const mySubmission = (assignmentSubmissions || []).find(
                    s => s.assignmentFolderId === item.id && s.studentId === currentStudent.id
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            {targetSubject?.name || 'Mata Pelajaran'}
                          </span>
                          {mySubmission ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Dikumpulkan
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              ⏳ Belum Dikumpulkan
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">{item.title}</h4>
                          <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                            👨‍🏫 Guru: {item.teacherName}
                          </p>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {item.dueDate && (
                          <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Tenggat: {new Date(item.dueDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}

                        {/* Submission status details if submitted */}
                        {mySubmission && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                              <span>Waktu Kirim: {new Date(mySubmission.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              {mySubmission.grade !== undefined && (
                                <span className="px-2 py-0.5 bg-emerald-700 text-white font-black rounded-lg text-[10px]">
                                  Nilai: {mySubmission.grade}/100
                                </span>
                              )}
                            </div>
                            {mySubmission.feedback && (
                              <p className="text-[11px] text-slate-700 italic bg-white p-2 rounded-lg border border-emerald-100">
                                "Feedback Guru: {mySubmission.feedback}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        {item.gdriveFolderUrl && (
                          <a
                            href={item.gdriveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Buka Folder GDrive Guru
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setSelectedAssignmentForSubmit(item);
                            if (mySubmission) {
                              setSubmitFileUrl(mySubmission.fileUrl || '');
                              setSubmitNotes(mySubmission.notes || '');
                            } else {
                              setSubmitFileUrl('');
                              setSubmitNotes('');
                            }
                          }}
                          className={`w-full py-2.5 font-black text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            mySubmission 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {mySubmission ? 'Edit / Update Berkas Tugas' : 'Kirim / Unggah Tugas ke Guru'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL STUDENT KUMPULKAN TUGAS */}
      {selectedAssignmentForSubmit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Form Pengumpulan Tugas
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">
                  {selectedAssignmentForSubmit.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedAssignmentForSubmit(null);
                  setDirectFileObj(null);
                  setSubmitFileUrl('');
                  setSubmitNotes('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submitter Mode Selector Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setSubmitType('direct_file')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  submitType === 'direct_file'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                Upload File Langsung
              </button>
              <button
                type="button"
                onClick={() => setSubmitType('gdrive_link')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  submitType === 'gdrive_link'
                    ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-blue-600" />
                Link Google Drive / URL
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              
              if (submitType === 'direct_file') {
                if (!directFileObj && !submitFileUrl) {
                  toast.error('Silakan pilih atau tarik file tugas yang akan diunggah!');
                  return;
                }
              } else {
                if (!submitFileUrl.trim()) {
                  toast.error('Masukkan URL / Link Google Drive tugas Anda!');
                  return;
                }
                const driveAnalysis = analyzeDriveUrl(submitFileUrl);
                if (!driveAnalysis.isValid) {
                  toast.error('Format URL tidak valid! Pastikan diawali dengan http:// atau https://');
                  return;
                }
              }

              if (onSaveAssignmentSubmission) {
                const isDirect = submitType === 'direct_file';
                const fileUrlToSave = isDirect ? (directFileObj?.dataUrl || submitFileUrl) : submitFileUrl.trim();
                const fileNameToSave = isDirect ? (directFileObj?.name || 'File_Tugas.pdf') : 'Link Google Drive';
                const fileTypeToSave = isDirect ? (directFileObj?.type || 'file') : 'gdrive';
                const fileSizeToSave = isDirect ? directFileObj?.size : undefined;

                onSaveAssignmentSubmission({
                  assignmentFolderId: selectedAssignmentForSubmit.id,
                  studentId: currentStudent.id,
                  studentName: currentStudent.name,
                  studentNis: currentStudent.nis,
                  studentClass: currentStudent.className || 'Kelas',
                  submissionType: isDirect ? 'direct_file' : 'gdrive_link',
                  fileUrl: fileUrlToSave,
                  fileName: fileNameToSave,
                  fileType: fileTypeToSave,
                  fileSize: fileSizeToSave,
                  notes: submitNotes.trim() || undefined,
                  status: 'Dikumpulkan'
                });
                toast.success(`Berhasil mengumpulkan tugas ${selectedAssignmentForSubmit.title}!`);
              }

              setSelectedAssignmentForSubmit(null);
              setDirectFileObj(null);
              setSubmitFileUrl('');
              setSubmitNotes('');
            }} className="space-y-4">

              {submitType === 'direct_file' ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-6 text-center transition group relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.zip,.rar,.mp3"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) {
                          toast.error('Ukuran file maksimal 20 MB');
                          return;
                        }
                        setIsUploadingFile(true);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
                          const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${(file.size / 1024).toFixed(0)} KB`;
                          
                          let extType = 'other';
                          const nameLower = file.name.toLowerCase();
                          if (nameLower.endsWith('.pdf')) extType = 'pdf';
                          else if (/\.(jpg|jpeg|png|gif|webp)$/.test(nameLower)) extType = 'image';
                          else if (/\.(doc|docx)$/.test(nameLower)) extType = 'word';
                          else if (/\.(xls|xlsx|csv)$/.test(nameLower)) extType = 'excel';
                          else if (/\.(ppt|pptx)$/.test(nameLower)) extType = 'ppt';
                          else if (/\.(mp4|webm|mkv|mov)$/.test(nameLower)) extType = 'video';
                          else if (/\.(mp3|wav|m4a|ogg)$/.test(nameLower)) extType = 'audio';
                          else if (/\.(zip|rar|7z)$/.test(nameLower)) extType = 'zip';

                          setDirectFileObj({
                            name: file.name,
                            size: sizeStr,
                            type: extType,
                            dataUrl
                          });
                          setIsUploadingFile(false);
                          toast.success(`File ${file.name} (${sizeStr}) siap dikumpulkan!`);
                        };
                        reader.onerror = () => {
                          setIsUploadingFile(false);
                          toast.error('Gagal membaca file');
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs">
                          Klik atau Geser & Tarik File Tugas Ke Sini
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Format disukai: PDF, Word, Excel, Gambar, Video, Zip, Audio (Maks 20 MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {isUploadingFile && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Membaca & Memproses File...</span>
                    </div>
                  )}

                  {directFileObj && (
                    <div className="bg-emerald-50/80 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase flex items-center justify-center shrink-0">
                          {directFileObj.type}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-xs truncate">{directFileObj.name}</p>
                          <p className="text-[10px] text-emerald-700 font-bold">{directFileObj.size} • Siap diunggah</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDirectFileObj(null)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-800">📌 Petunjuk Pengumpulan Google Drive:</p>
                    <ol className="list-decimal list-inside text-slate-600 space-y-1">
                      <li>Unggah file tugas ke Google Drive milik Anda / Folder Guru.</li>
                      <li>Salin link bagikan (share link) Google Drive dengan akses publik/sekolah.</li>
                      <li>Tempelkan link URL pada kolom di bawah.</li>
                    </ol>
                    {selectedAssignmentForSubmit.gdriveFolderUrl && (
                      <a
                        href={selectedAssignmentForSubmit.gdriveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Buka Folder GDrive Guru
                      </a>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL / Link File Google Drive Tugas Anda *
                    </label>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/file/d/..."
                      value={submitFileUrl}
                      onChange={(e) => setSubmitFileUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:ring-2 focus:ring-emerald-500"
                    />

                    {(() => {
                      if (!submitFileUrl.trim()) return null;
                      const driveInfo = analyzeDriveUrl(submitFileUrl);
                      return (
                        <div className={`mt-2 p-3 rounded-xl border text-xs space-y-1.5 ${driveInfo.colorClass}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold flex items-center gap-1.5">
                              {driveInfo.isValid ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                              )}
                              {driveInfo.label}
                            </span>
                            {driveInfo.isValid && (
                              <a
                                href={submitFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" /> Uji Buka Link
                              </a>
                            )}
                          </div>
                          {driveInfo.warningNote && (
                            <p className="text-[11px] font-medium leading-normal bg-white/80 p-2 rounded-lg border border-slate-200/50">
                              ⚠️ {driveInfo.warningNote}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Pesan untuk Guru (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pak/Bu, tugas laporan praktikum sudah saya unggah lengkap dengan lampiran grafik."
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignmentForSubmit(null);
                    setDirectFileObj(null);
                    setSubmitFileUrl('');
                    setSubmitNotes('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingFile}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Kirim Tugas Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTICLE VIEWER MODAL */}
      {activeMaterial && activeMaterial.fileType === 'Article' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <FileText className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{activeMaterial.title}</h3>
                  <p className="text-xs font-semibold text-slate-500">Materi Artikel</p>
                </div>
              </div>
              <button
                onClick={() => setActiveMaterial(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50">
              <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xs border border-slate-100">
                <div className="prose prose-slate prose-sm sm:prose-base prose-indigo max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ __html: activeMaterial.content || '' }} 
                    className="quill-content"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXAMS CBT SELECTOR */}
      {activeTab === 'exams' && !examStarted && !scoreResult && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Daftar Soal Evaluasi & Ujian CBT</h3>
            <p className="text-slate-500 text-xs mt-0.5">Selesaikan Soal Ujian / Soal Evaluasi</p>
          </div>

          {classExams.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-xs">Belum ada paket ujian CBT yang dirilis untuk kelas Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classExams.map((exam) => {
                const subjectName = subjects.find(s => s.id === exam.subjectId)?.name || 'Mata Pelajaran';
                const teacherName = exam.teacherId
                  ? teachers.find(t => t.id === exam.teacherId)?.name
                  : teachers.find(t => (t.subject || '').split(',').map(s => s.trim().toLowerCase()).includes(subjectName.toLowerCase()))?.name || 'Guru Mapel';

                return (
                  <div key={exam.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition bg-slate-50/50 flex flex-col justify-between space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-100">
                        CBT Simulator
                      </span>
                      <h4 className="font-extrabold text-slate-950 text-base mt-2 leading-snug">{exam.title}</h4>

                      {/* INFO MAPEL & GURU CBT */}
                      <div className="pt-2.5 space-y-1.5 text-slate-600 text-[11px] border-t border-slate-150/50 mt-2.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Mapel: <strong className="text-slate-800">{subjectName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Guru: <span className="font-semibold text-slate-700">{teacherName}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-slate-200/50 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <span className="text-slate-400 text-[10px] block">Waktu</span>
                          <strong className="text-slate-800">{exam.durationMinutes} Menit</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="text-slate-400 text-[10px] block">Soal</span>
                          <strong className="text-slate-800">{exam.questions.length} Butir Soal</strong>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const mySub = (submissions || []).find(sub => sub.studentNis === currentStudent.nis && sub.examId === exam.id);
                      const cardTokenInput = tokenInputs[exam.id] ?? tokenInput ?? '';
                      const cardTokenError = tokenErrors[exam.id] ?? tokenError ?? '';
                      const hasEssayQuestions = exam.questions.some(q => q.type === 'Uraian');
                      const showScore = !hasEssayQuestions
                        ? (exam.showScoreToStudent !== false)
                        : (mySub?.essayGraded === true && exam.showScoreToStudent !== false);

                      return (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {mySub && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 font-bold">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Sudah Dikerjakan
                              </span>
                              {hasEssayQuestions && !mySub.essayGraded ? (
                                <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                  Proses Koreksi Guru
                                </span>
                              ) : showScore ? (
                                <span className="bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full font-black">
                                  Nilai: {mySub.score}
                                </span>
                              ) : (
                                <span className="bg-emerald-100/90 text-emerald-800 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                  Jawaban Tersimpan
                                </span>
                              )}
                            </div>
                          )}

                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2 items-start">
                            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-800 font-medium leading-tight">
                              <strong>Sistem Pengawasan Aktif:</strong> Segala bentuk aktivitas seperti keluar dari layar ujian, membuka aplikasi lain, atau melakukan copy-paste akan dicatat otomatis pada <strong>Log Pelanggaran Guru</strong>.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">Masukkan Token Kunci Ujian *</label>
                              {exam.token && (
                                <span className="text-[10px] text-slate-400 font-mono font-medium">
                                  Format: HURUF BESAR
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder={`Contoh: ${exam.token || 'MTK7'}`}
                              value={cardTokenInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTokenInputs(prev => ({ ...prev, [exam.id]: val }));
                                setTokenInput(val);
                                if (tokenErrors[exam.id]) {
                                  setTokenErrors(prev => ({ ...prev, [exam.id]: '' }));
                                }
                              }}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>

                          {cardTokenError && (
                            <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200 leading-snug">
                              {cardTokenError}
                            </p>
                          )}

                          <button
                            onClick={() => handleStartExam(exam)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
                          >
                            <Key className="w-3.5 h-3.5" /> {mySub ? 'Kerjakan Ulang Ujian' : 'Kerjakan Ujian Sekarang'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CORE CBT EXAM RUNNING VIEW */}
      {examStarted && activeExam && (
        <div className="space-y-4 select-none pb-12">
          {/* TOP CBT HEADER BANNER (MATCHING USER REFERENCE DESIGN) */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <GraduationCap className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase block">LEMBAR UJIAN & EVALUASI CBT</span>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">{activeExam.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Selamat datang,</span>
                <span className="text-xs font-black text-slate-100 block">{currentStudent.name}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs border border-indigo-400/40">
                {currentStudent.name ? currentStudent.name.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>
          </div>

          {/* CHEATING ALERT IF ANY */}
          {cheatingAttempts > 0 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs font-extrabold rounded-xl flex items-center gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>PERINGATAN: Sistem mendeteksi Anda meninggalkan halaman/tab ujian sebanyak {cheatingAttempts} kali!</span>
            </div>
          )}

          {/* MAIN 2-COLUMN CBT CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: QUESTION CONTENT & NAVIGATION (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-4">
              {(() => {
                const totalQuestions = activeExam.questions.length;
                const safeIndex = Math.min(Math.max(0, currentQuestionIndex), totalQuestions - 1);
                const q = activeExam.questions[safeIndex];

                if (!q) return <div className="p-8 bg-white rounded-2xl text-center">Soal tidak ditemukan.</div>;

                const isCurrentDoubtful = Boolean(doubtfulQuestions[q.id]);

                return (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
                    
                    {/* QUESTION CARD TOP HEADER BAR */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">SOAL NO.</span>
                        <span className="px-3 py-1 bg-indigo-600 text-white font-black text-sm rounded-lg shadow-2xs">
                          {safeIndex + 1}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium ml-1">
                          (dari {totalQuestions} Soal)
                        </span>
                      </div>

                      {/* TIMER BADGE */}
                      <div className="flex items-center bg-slate-200/80 rounded-xl overflow-hidden border border-slate-300/80 shadow-2xs">
                        <span className="px-2.5 py-1 text-[11px] font-black text-slate-600 uppercase tracking-wider bg-slate-200">
                          SISA WAKTU
                        </span>
                        <span className="px-3 py-1 text-xs sm:text-sm font-mono font-black text-indigo-900 bg-white">
                          {formatTime(timerSeconds)}
                        </span>
                      </div>
                    </div>

                    {/* QUESTION BODY CONTAINER */}
                    <div className="p-5 sm:p-7 space-y-6 min-h-[320px]">
                      
                      {/* TYPE & SCORE BADGES */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md border border-slate-200/80">
                          {q.type === 'PilihanGanda' ? 'Pilihan Ganda Standar' :
                           q.type === 'PilihanGandaKompleks' ? 'Pilihan Ganda Kompleks (Jawaban Jamak)' :
                           q.type === 'PilihanAsosiatif' ? 'Pilihan Asosiatif (1, 2, 3, 4)' :
                           q.type === 'SebabAkibat' ? 'Pilihan Sebab - Akibat' :
                           'Soal Uraian / Essay'}
                        </span>
                        {q.score !== undefined && (
                          <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                            Bobot: {q.score} Poin
                          </span>
                        )}
                      </div>

                      {/* QUESTION TEXT STIMULUS */}
                      <div className="text-slate-900 text-sm sm:text-base leading-relaxed font-medium">
                        {renderFormattedText(q.questionText, q.fontPreset)}
                      </div>

                      {/* MEDIA ATTACHMENTS (Image, Video, Audio) */}
                      {q.mediaType && q.mediaType !== 'None' && q.mediaUrl && (
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl max-w-lg mx-auto">
                          {q.mediaType === 'Image' && (
                            <img 
                              src={q.mediaUrl} 
                              alt="Stimulus Soal" 
                              className="rounded-xl max-h-72 object-contain mx-auto border bg-white shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {q.mediaType === 'Video' && (
                            <div className="aspect-video w-full rounded-xl overflow-hidden border bg-black shadow-2xs">
                              <iframe
                                src={q.mediaUrl.includes('youtube.com/watch') 
                                  ? q.mediaUrl.replace('watch?v=', 'embed/') 
                                  : q.mediaUrl}
                                title="Video Stimulus Soal"
                                className="w-full h-full border-0"
                                allowFullScreen
                              />
                            </div>
                          )}
                          {q.mediaType === 'Audio' && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200">
                              <audio 
                                src={q.mediaUrl} 
                                controls 
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* ANSWER OPTIONS RENDERING BY QUESTION TYPE */}
                      <div className="pt-2">
                        {q.type === 'PilihanGanda' && (
                          <div className="space-y-3 text-xs sm:text-sm font-semibold">
                            {q.options.map((opt, oIdx) => {
                              const optionLetter = String.fromCharCode(65 + oIdx);
                              const isSelected = studentAnswers[q.id] === optionLetter;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleSelectAnswer(q.id, optionLetter)}
                                  className={`w-full p-3.5 sm:p-4 rounded-xl border text-left transition cursor-pointer flex items-center gap-3.5 ${
                                    isSelected 
                                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-extrabold shadow-2xs ring-1 ring-indigo-500' 
                                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                  }`}
                                >
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border font-black shrink-0 transition ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                      : 'bg-slate-100 text-slate-600 border-slate-300'
                                  }`}>
                                    {optionLetter}
                                  </span>
                                  <span className="leading-snug">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'PilihanGandaKompleks' && (
                          <div className="space-y-3 text-xs sm:text-sm font-semibold">
                            {q.options.map((opt, oIdx) => {
                              const currentSelection = (studentAnswers[q.id] as string[]) || [];
                              const isSelected = currentSelection.includes(opt);
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => handleSelectMultipleAnswer(q.id, opt, !isSelected)}
                                  className={`w-full p-3.5 sm:p-4 rounded-xl border text-left transition cursor-pointer flex items-center gap-3.5 ${
                                    isSelected 
                                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-extrabold shadow-2xs ring-1 ring-indigo-500' 
                                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                  }`}
                                >
                                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs border font-black shrink-0 transition ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                      : 'bg-slate-100 text-slate-500 border-slate-300'
                                  }`}>
                                    {isSelected ? '✓' : ''}
                                  </span>
                                  <span className="leading-snug">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'PilihanAsosiatif' && (
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                              <p className="font-extrabold text-slate-800">Simulasikan Pilihan Kombinasi Pernyataan Anda:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-semibold">
                                {q.statements.map((st, sIdx) => {
                                  const currentSelectedCombination = (studentAnswers[`aso_helper_${q.id}`] as number[]) || [];
                                  const isChecked = currentSelectedCombination.includes(sIdx + 1);

                                  const toggleVal = () => {
                                    let nextCombination: number[];
                                    if (isChecked) {
                                      nextCombination = currentSelectedCombination.filter(v => v !== sIdx + 1);
                                    } else {
                                      nextCombination = [...currentSelectedCombination, sIdx + 1].sort();
                                    }
                                    handleSelectAnswer(`aso_helper_${q.id}`, nextCombination);
                                    
                                    const has1 = nextCombination.includes(1);
                                    const has2 = nextCombination.includes(2);
                                    const has3 = nextCombination.includes(3);
                                    const has4 = nextCombination.includes(4);
                                    const len = nextCombination.length;

                                    let computedKey = '';
                                    if (has1 && has2 && has3 && len === 3) computedKey = 'A';
                                    else if (has1 && has3 && len === 2) computedKey = 'B';
                                    else if (has2 && has4 && len === 2) computedKey = 'C';
                                    else if (has4 && len === 1) computedKey = 'D';
                                    else if (has1 && has2 && has3 && has4 && len === 4) computedKey = 'E';

                                    handleSelectAnswer(q.id, computedKey);
                                  };

                                  return (
                                    <button
                                      type="button"
                                      key={sIdx}
                                      onClick={toggleVal}
                                      className={`p-2.5 rounded-lg border text-xs text-center transition cursor-pointer font-bold ${
                                        isChecked ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      Pernyataan ({sIdx + 1}) {isChecked ? '✓' : ''}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold">
                              {['A', 'B', 'C', 'D', 'E'].map(choice => {
                                const isSelected = studentAnswers[q.id] === choice;
                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() => handleSelectAnswer(q.id, choice)}
                                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                                      isSelected 
                                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-extrabold shadow-2xs' 
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-black shrink-0 ${
                                      isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-300'
                                    }`}>
                                      {choice}
                                    </span>
                                    <span className="text-xs text-slate-700 leading-snug">
                                      {choice === 'A' && 'A: jika (1), (2), dan (3) benar'}
                                      {choice === 'B' && 'B: jika (1) dan (3) benar'}
                                      {choice === 'C' && 'C: jika (2) dan (4) benar'}
                                      {choice === 'D' && 'D: jika hanya (4) yang benar'}
                                      {choice === 'E' && 'E: jika semuanya (1,2,3,4) benar'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {q.type === 'Uraian' && (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            <textarea
                              placeholder="Ketikkan jawaban uraian / essay Anda di sini..."
                              value={studentAnswers[q.id] || ''}
                              onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                              className="w-full h-40 px-4 py-3 border border-indigo-200 rounded-xl text-sm font-medium text-slate-800 bg-indigo-50/10 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-y"
                            />
                          </div>
                        )}

                        {q.type === 'SebabAkibat' && (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                              <p><strong>Pernyataan:</strong> "{q.statement}"</p>
                              <p><strong>Alasan:</strong> "{q.reason}"</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold">
                              {['A', 'B', 'C', 'D', 'E'].map(choice => {
                                const isSelected = studentAnswers[q.id] === choice;
                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() => handleSelectAnswer(q.id, choice)}
                                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                                      isSelected 
                                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-extrabold shadow-2xs' 
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-black shrink-0 ${
                                      isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-300'
                                    }`}>
                                      {choice}
                                    </span>
                                    <span className="text-xs text-slate-700 leading-snug">
                                      {choice === 'A' && 'A: Pernyataan BENAR, Alasan BENAR, keduanya ada Hubungan Sebab-Akibat.'}
                                      {choice === 'B' && 'B: Pernyataan BENAR, Alasan BENAR, keduanya TIDAK ada Hubungan Sebab-Akibat.'}
                                      {choice === 'C' && 'C: Pernyataan BENAR, Alasan SALAH.'}
                                      {choice === 'D' && 'D: Pernyataan SALAH, Alasan BENAR.'}
                                      {choice === 'E' && 'E: Pernyataan dan Alasan keduanya SALAH.'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTTOM NAVIGATION BUTTONS BAR (SOAL SEBELUMNYA, RAGU-RAGU, SOAL SELANJUTNYA) */}
                    <div className="bg-slate-100 border-t border-slate-200 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
                      
                      {/* BUTTON PREVIOUS */}
                      <button
                        type="button"
                        disabled={safeIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                          safeIndex === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" /> SOAL SEBELUMNYA
                      </button>

                      {/* BUTTON RAGU-RAGU */}
                      <button
                        type="button"
                        onClick={() => toggleDoubtful(q.id)}
                        className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer shadow-2xs border ${
                          isCurrentDoubtful
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 active:scale-95'
                            : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 border-amber-300 active:scale-95'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-black ${
                          isCurrentDoubtful ? 'bg-white text-amber-600 border-white' : 'border-amber-700 bg-white/50 text-amber-800'
                        }`}>
                          {isCurrentDoubtful ? '✓' : ''}
                        </span>
                        RAGU - RAGU
                      </button>

                      {/* BUTTON NEXT / SELESAI */}
                      {safeIndex < totalQuestions - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                          className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                        >
                          SOAL SELANJUTNYA <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowConfirmSubmitModal(true)}
                          className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                        >
                          SELESAI UJIAN <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT COLUMN: QUESTION NUMBER GRID & HENTIKAN UJIAN (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm tracking-wide uppercase flex items-center gap-2">
                    <Grid className="w-4 h-4 text-indigo-600" /> NOMOR SOAL
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {activeExam.questions.length} Butir
                  </span>
                </div>

                {/* 5-COLUMN GRID OF QUESTION NUMBERS */}
                <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1 pr-1 custom-scrollbar">
                  {activeExam.questions.map((q, idx) => {
                    const isAns = checkQuestionAnswered(q);
                    const isDoubt = Boolean(doubtfulQuestions[q.id]);
                    const isCurrent = idx === currentQuestionIndex;

                    let btnClass = 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300';
                    if (isDoubt) {
                      btnClass = 'bg-amber-500 text-white font-black border-amber-600 shadow-2xs';
                    } else if (isAns) {
                      btnClass = 'bg-emerald-600 text-white font-black border-emerald-700 shadow-2xs';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`aspect-square w-full rounded-xl text-xs sm:text-sm font-extrabold border transition flex items-center justify-center cursor-pointer relative ${btnClass} ${
                          isCurrent ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105 z-10 shadow-md font-black' : 'hover:scale-105'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* LEGEND COLOR INDICATORS */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] font-bold text-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 border border-emerald-700 shrink-0" />
                    <span>Hijau = Sudah Dijawab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-amber-500 border border-amber-600 shrink-0" />
                    <span>Orange = Ragu-ragu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-300 shrink-0" />
                    <span>Abu-abu = Belum Dijawab</span>
                  </div>
                </div>

                {/* RED HENTIKAN UJIAN BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmitModal(true)}
                  className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2 border border-rose-700 uppercase tracking-wide"
                >
                  <AlertOctagon className="w-4 h-4" /> HENTIKAN UJIAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT / HENTIKAN UJIAN MODAL */}
      {showConfirmSubmitModal && activeExam && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-100">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Konfirmasi Hentikan / Selesaikan Ujian</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Periksa kembali ringkasan lembar pengerjaan jawaban Anda sebelum dikirimkan ke server.
                </p>
              </div>
            </div>

            {(() => {
              const stats = getExamSummaryStats();
              return (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs font-bold text-slate-700">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500">Total Soal Ujian</span>
                    <span className="font-extrabold text-slate-900 text-sm">{stats.total} Soal</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Sudah Dijawab</span>
                    <span className="font-extrabold text-emerald-800 text-sm">{stats.answered} Soal</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-700">
                    <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Ragu - Ragu</span>
                    <span className="font-extrabold text-amber-800 text-sm">{stats.doubtful} Soal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Belum Dijawab</span>
                    <span className="font-extrabold text-slate-700 text-sm">{stats.unanswered} Soal</span>
                  </div>
                </div>
              );
            })()}

            {getExamSummaryStats().doubtful > 0 && (
              <div className="p-3 bg-amber-50 text-amber-900 text-xs font-semibold rounded-xl border border-amber-200/80">
                ⚠️ Masih ada <strong>{getExamSummaryStats().doubtful} soal</strong> bertanda Ragu-Ragu. Anda disarankan memeriksa kembali pilihan Anda sebelum menghentikan ujian.
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmSubmitModal(false)}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal, Lanjutkan Ujian
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmSubmitModal(false);
                  handleEvaluateExam();
                }}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Ya, Hentikan & Kirim Jawaban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCORE RESULTS DISPLAY */}
      {scoreResult && activeExam && (() => {
        const hasEssayQuestions = activeExam.questions.some(q => q.type === 'Uraian');
        const showScore = !hasEssayQuestions && (activeExam.showScoreToStudent !== false);

        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-2xl font-black text-slate-950">Selamat Telah Mengerjakan Ujian</h3>
              <p className="text-slate-500 text-sm">Jawaban pengerjaan Anda telah berhasil tersimpan di sistem CBT.</p>
            </div>

            {hasEssayQuestions ? (
              <div className="bg-amber-50/80 rounded-2xl p-6 border border-amber-200/80 max-w-md mx-auto space-y-2 text-amber-950">
                <span className="text-xs font-black uppercase tracking-wider block text-amber-800">Ujian Soal Uraian (Essay)</span>
                <p className="text-xs font-medium leading-relaxed">
                  Ujian ini memuat soal Uraian. Nilai hasil belajar akan tersedia dan diperbarui di Leger setelah dikoreksi oleh Guru.
                </p>
              </div>
            ) : showScore ? (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 max-w-sm mx-auto space-y-4">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Nilai Hasil Belajar</span>
                <span className="text-6xl font-black text-indigo-700 block">{scoreResult.score}</span>
                <p className="text-xs text-slate-500">
                  Menjawab benar <strong>{scoreResult.totalPoints}</strong> dari total <strong>{scoreResult.maxPoints}</strong> poin.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200 max-w-md mx-auto space-y-2 text-slate-600">
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-500">Nilai Hasil Belajar</span>
                <p className="text-xs font-medium leading-relaxed">
                  Guru mengatur agar nilai ujian ini tidak ditampilkan secara langsung. Silakan hubungi Guru Anda untuk mengonfirmasi hasil nilai.
                </p>
              </div>
            )}

            {cheatingAttempts > 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 inline-block font-semibold">
                Log Ujian mencatat {cheatingAttempts} kali pemindahan fokus tab browser. Tetaplah jujur di ujian berikutnya!
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 inline-block font-semibold flex items-center gap-1.5 justify-center">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Sangat Bagus! Anda mengerjakan dengan integritas tinggi (0 pelanggaran tab).
              </div>
            )}

            <button
              onClick={() => {
                setScoreResult(null);
                setActiveExam(null);
                setTokenInput('');
                setActiveTab('exams');
              }}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-sm py-3 rounded-xl transition cursor-pointer"
            >
              Kembali ke Dashboard Siswa
            </button>
          </div>
        );
      })()}

      {/* CHEATING ALERT MODAL */}
      {showCheatModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-950 text-base">Terdeteksi Berpindah Tab!</h3>
              <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded border border-red-100">
                Peringatan: {cheatingAttempts}x Pelanggaran Terpantau
              </p>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">
                Sistem CBT ANBK melacak aktivitas tab browser. Kejadian keluar jendela atau membuka tab lain otomatis dicatat di database Spreadsheet pengawas.
              </p>
            </div>

            <button
              onClick={() => setShowCheatModal(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              Saya Mengerti & Kembali Mengerjakan
            </button>
          </div>
        </div>
      )}

      {/* SCORES HISTORY */}
      {activeTab === 'scores' && !examStarted && !scoreResult && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Riwayat Nilai & Evaluasi</h3>
            <p className="text-slate-500 text-xs mt-0.5">Daftar nilai ujian dan tugas yang telah Anda kerjakan</p>
          </div>

          {(() => {
            const mySubmissions = submissions.filter(sub => sub.studentNis === currentStudent.nis);
            
            if (mySubmissions.length === 0) {
              return (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-400 text-xs">Anda belum memiliki riwayat nilai.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {mySubmissions.map((sub) => {
                  const examObj = exams.find(e => e.id === sub.examId);
                  const subjectName = subjects.find(s => s.id === examObj?.subjectId)?.name || 'Mata Pelajaran';
                  const hasEssayQuestions = examObj?.questions.some(q => q.type === 'Uraian');
                  const isGradedPending = hasEssayQuestions && !sub.essayGraded;
                  const isScoreHiddenByTeacher = !hasEssayQuestions && examObj?.showScoreToStudent === false;

                  return (
                    <div key={sub.id} className="border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                            {subjectName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {hasEssayQuestions && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Ada Uraian
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{sub.examTitle}</h4>
                      </div>
                      <div className="bg-white px-5 py-3 rounded-xl shadow-xs border border-slate-100 flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Nilai Akhir</span>
                        {isGradedPending ? (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            Proses Koreksi
                          </span>
                        ) : isScoreHiddenByTeacher ? (
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Disembunyikan
                          </span>
                        ) : (
                          <span className={`text-2xl font-black ${sub.score >= 75 ? 'text-green-600' : 'text-rose-600'}`}>
                            {sub.score}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* POPUP MODAL NOTIFIKASI UPON LOGIN (IF UNREAD EXISTS) */}
      {showPopNotification && !examStarted && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Bell className="w-6 h-6 text-amber-600 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-base">Notifikasi Catatan Guru Mapel</h3>
                  <p className="text-[11px] text-amber-800 font-semibold">Ada {unreadCount} pesan baru yang perlu Anda perhatikan hari ini</p>
                </div>
              </div>
              <button
                onClick={() => setShowPopNotification(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {studentAnnouncements
                .filter(a => !readAnnouncements.includes(a.id))
                .slice(0, 3)
                .map(ann => (
                  <div key={ann.id} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-700 text-xs">👨‍🏫 {ann.teacherName} ({ann.teacherSubject})</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        {ann.priority === 'mendesak' ? '🚨 Mendesak' : '⭐ Info Baru'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{ann.title}</h4>
                    <p className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-lg border border-amber-100 leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleMarkAsRead(ann.id)}
                        className="text-[11px] font-extrabold text-amber-800 bg-amber-200/60 hover:bg-amber-300 px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mengerti & Sudah Dibaca
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Semua catatan juga tersimpan di tab Beranda</span>
              <button
                onClick={() => {
                  studentAnnouncements.forEach(a => handleMarkAsRead(a.id));
                  setShowPopNotification(false);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md"
              >
                Tutup & Masuk Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

      {/* MODAL STUDENT LIVE PRESENTATION SYNCHRONIZED VIEWER */}
      {((showLiveSyncModal || livePresentation?.active) && livePresentation && livePresentation.active) && (
        <div className={`fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 z-[99999] animate-fade-in ${forceRotate90 ? 'overflow-hidden' : ''}`}>
          <div 
            style={forceRotate90 ? {
              transform: 'rotate(90deg)',
              transformOrigin: 'center center',
              width: '100vh',
              height: '100vw',
              position: 'fixed',
              top: 'calc(50% - 50vw)',
              left: 'calc(50% - 50vh)',
              zIndex: 99999,
              backgroundColor: '#020617'
            } : {}}
            className={`bg-slate-900 text-white shadow-2xl border-slate-800 w-full flex flex-col overflow-hidden transition-all duration-200 ${
              forceRotate90
                ? 'rounded-none border-0'
                : 'h-full rounded-2xl sm:rounded-3xl border landscape:h-full landscape:rounded-none landscape:border-0'
            }`}
          >
            {/* Top Notification Badge for Mobile Phone Portrait Users */}
            <div className="bg-amber-950/90 border-b border-amber-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-200 font-bold shrink-0 sm:hidden">
              <div className="flex items-center gap-1.5 truncate">
                <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">💡 Miringkan HP atau tekan tombol Rotasi 90° jika posisi HP berdiri</span>
              </div>
              <button 
                onClick={() => setForceRotate90(!forceRotate90)}
                className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded font-black text-[10px] shrink-0 ml-1 cursor-pointer"
              >
                {forceRotate90 ? 'Layar Normal' : 'Rotasi Now'}
              </button>
            </div>

            {/* Header */}
            <div className="bg-slate-950 p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-red-600 text-white flex items-center justify-center font-black animate-pulse shadow-md shrink-0">
                  <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-600/30 text-red-400 border border-red-500/40 text-[9px] sm:text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                      LIVE LAB
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-300 font-bold truncate">
                      Guru: {livePresentation.teacherName}
                    </span>
                  </div>
                  <h3 className="font-black text-xs sm:text-base text-white mt-0.5 truncate max-w-[200px] sm:max-w-md">
                    {livePresentation.materialTitle}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setForceRotate90(!forceRotate90)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    forceRotate90
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                  }`}
                  title="Putar slide 90 derajat jika HP dalam posisi berdiri (portrait)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{forceRotate90 ? '90° On' : '🔄 Rotasi 90°'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFullscreenLandscape}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Mode Tidur (Landscape Fullscreen)"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden sm:inline">Mode Tidur (Landscape)</span>
                  <span className="sm:hidden">Landscape</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentFollowSync(!studentFollowSync);
                    if (!studentFollowSync) setStudentSlideOverride(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    studentFollowSync
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {studentFollowSync ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{studentFollowSync ? 'Sync Otomatis Terkunci' : 'Sync Dilepas'}</span>
                  <span className="sm:hidden">{studentFollowSync ? 'Sync On' : 'Bebas'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLiveSyncModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Presentation Canvas View */}
            <div className="flex-1 bg-slate-950 p-2 sm:p-4 relative flex flex-col items-center justify-center overflow-hidden">
              {(() => {
                const activeSlide = studentFollowSync ? livePresentation.currentSlide : (studentSlideOverride || livePresentation.currentSlide);
                const mat = materials.find(m => m.id === livePresentation.materialId);
                const currentUrl = mat?.fileUrl || '';
                let embedUrl: string | null = null;
                if (currentUrl.includes('youtube.com/watch') || currentUrl.includes('youtu.be/')) {
                  let vId = '';
                  if (currentUrl.includes('v=')) vId = currentUrl.split('v=')[1]?.split('&')[0] || '';
                  else if (currentUrl.includes('youtu.be/')) vId = currentUrl.split('youtu.be/')[1]?.split('?')[0] || '';
                  if (vId) embedUrl = `https://www.youtube.com/embed/${vId}`;
                } else if (currentUrl.includes('drive.google.com/file/d/')) {
                  const fId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (fId) embedUrl = `https://drive.google.com/file/d/${fId}/preview`;
                } else if (currentUrl.includes('docs.google.com/presentation/d/')) {
                  const sId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (sId) embedUrl = `https://docs.google.com/presentation/d/${sId}/embed?start=false&loop=false&delayms=3000#slide=${activeSlide}`;
                } else if (currentUrl.includes('docs.google.com/document/d/')) {
                  const dId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (dId) embedUrl = `https://docs.google.com/document/d/${dId}/pub?embedded=true`;
                } else if (currentUrl.toLowerCase().endsWith('.pdf') || currentUrl.toLowerCase().includes('.pdf?')) {
                  embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentUrl)}&embedded=true#page=${activeSlide}`;
                }
                const isImg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(currentUrl) || currentUrl.startsWith('data:image/');

                // Split text content into paragraphs/slides if available
                const contentParagraphs = mat?.content ? mat.content.split(/\n\s*\n|\n(?=[A-Z0-9])|---/).filter(p => p.trim()) : [];
                const activeContentChunk = contentParagraphs.length > 0 
                  ? (contentParagraphs[Math.min(activeSlide - 1, contentParagraphs.length - 1)] || mat?.content)
                  : mat?.content;

                const displayTotal = Math.max(livePresentation.totalSlides || 1, contentParagraphs.length || 1);

                return (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <div 
                      ref={studentModalScrollRef}
                      className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-6 flex flex-col items-center justify-start text-center space-y-3 sm:space-y-4 shadow-2xl overflow-y-auto relative scroll-smooth"
                    >
                      {/* Laser Pointer overlay from Teacher */}
                      {livePresentation.laserPointer && studentFollowSync && (
                        <div
                          className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
                          style={{
                            left: `${livePresentation.laserPointer.x}%`,
                            top: `${livePresentation.laserPointer.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          <div className="relative flex items-center justify-center">
                            <span className="absolute w-8 h-8 rounded-full bg-red-500/60 animate-ping" />
                            <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_15px_rgba(239,68,68,1)] flex items-center justify-center" />
                            <span className="absolute left-6 whitespace-nowrap bg-red-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg border border-red-400">
                              🔴 Laser Guru: {livePresentation.teacherName}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-bold border border-slate-700 shrink-0">
                        <Tv className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SIARAN LIVE LAB • SLIDE {activeSlide}/{displayTotal}</span>
                        {studentFollowSync && typeof livePresentation?.scrollPosition === 'number' && (
                          <span className="ml-1 px-2 py-0.5 bg-emerald-950/80 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-700/80 flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Scroll Sync ({Math.round(livePresentation.scrollPosition)}%)
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg sm:text-2xl font-black text-white max-w-2xl shrink-0">
                        {mat?.title || livePresentation.materialTitle}
                      </h2>

                      {embedUrl ? (
                        <div className="w-full h-[65vh] landscape:h-[82vh] sm:h-[58vh] max-w-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl my-1 shrink-0 flex-1 min-h-[220px]">
                          <iframe
                            key={`student_modal_embed_${embedUrl}_${activeSlide}`}
                            src={embedUrl}
                            className="w-full h-full border-0 object-contain"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            title="Media Presentasi Siswa"
                          />
                        </div>
                      ) : isImg ? (
                        <div className="w-full max-w-full max-h-[65vh] landscape:max-h-[82vh] sm:max-h-[58vh] overflow-hidden rounded-xl sm:rounded-2xl border border-slate-700 shadow-2xl my-1 shrink-0 flex-1 flex items-center justify-center">
                          <img src={currentUrl} alt="Slide Media" className="max-h-[60vh] landscape:max-h-[80vh] sm:max-h-[50vh] object-contain mx-auto" />
                        </div>
                      ) : mat?.content ? (
                        <div className="w-full max-w-full text-sm text-slate-200 leading-relaxed text-left bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 shadow-inner space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2 text-xs text-amber-300 font-extrabold">
                            <span>📌 Bagian Slide / Paragraf {activeSlide}</span>
                            <span className="text-[10px] bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-800/60">Disinkronkan Guru</span>
                          </div>
                          <p className="whitespace-pre-line text-slate-100 text-base leading-relaxed">
                            {activeContentChunk}
                          </p>
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-300 max-w-lg space-y-3">
                          <p className="text-xs">
                            Materi pembelajaran ini sedang dipandu langsung oleh Bpk/Ibu Guru di lab komputer.
                          </p>
                          {currentUrl && (
                            <a
                              href={currentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                            >
                              <ExternalLink className="w-4 h-4" /> Buka Dokumen / Slide Sumber
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Controls */}
            <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-white">Status Sync: TERSAMBUNG LIVE</span>
              </div>

              {!studentFollowSync && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = studentSlideOverride || livePresentation.currentSlide;
                      if (cur > 1) setStudentSlideOverride(cur - 1);
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
                  >
                    ◀ Prev
                  </button>
                  <span className="font-mono text-slate-300">
                    {studentSlideOverride || livePresentation.currentSlide} / {livePresentation.totalSlides}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = studentSlideOverride || livePresentation.currentSlide;
                      if (cur < livePresentation.totalSlides) setStudentSlideOverride(cur + 1);
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg"
                  >
                    Next ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentFollowSync(true);
                      setStudentSlideOverride(null);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg ml-2"
                  >
                    🔒 Kembali Sync Guru
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING QUICK LAUNCHER WIDGET FOR LIVE PRESENTATION */}
      {livePresentation?.active && !showLiveSyncModal && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce">
          <button
            type="button"
            onClick={() => setShowLiveSyncModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-2xl shadow-2xl font-black text-xs border-2 border-white flex items-center gap-2 cursor-pointer hover:scale-105 transition"
          >
            <Radio className="w-4 h-4 animate-spin text-white" />
            <span>🔴 PRESENTASI LIVE LAB (Slide {livePresentation.currentSlide}/{livePresentation.totalSlides}) • Klik Buka</span>
          </button>
        </div>
      )}
    </>
  );
}