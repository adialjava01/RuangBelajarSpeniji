import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { addDocument } from '../firebaseSync';
import { SCHOOL_LOGO_BASE64 } from '../assets/schoolLogo';
import { 
  Teacher, Student, ClassItem, SubjectItem, Material, JournalEntry, Exam, ExamQuestion, QuestionType, TeacherScheduleNote, TeacherAnnouncement, QuestionBank, ExamSubmission, ShareRequest, CheatLog, TeachingModule, ManualAssessment, ManualGrade, CounselingReferral, AssignmentFolder, AssignmentSubmission, LivePresentationSession
} from '../types';

import { 
  BookOpen, Plus, Trash2, Calendar, FileText, ToggleLeft, ToggleRight, ListTodo, Key, Clock, HelpCircle, Save, Check,
  FileSpreadsheet, Upload, AlertCircle, Clipboard, Download, Info, Printer, Filter, BarChart3, X, Settings, Building, UserCheck, ShieldAlert,
  Edit3, Camera, User, Image, MapPin, Bell, Megaphone, AlertTriangle, Sparkles, Send, Database, CheckCircle, FileCode, Users,
  Folder, FolderPlus, Scissors, ClipboardPaste, Copy, CornerUpLeft, ArrowLeft, Search, Tv, Radio, Eye, Play, Square, Maximize2, Minimize2, MousePointer, ChevronLeft, ChevronRight, Lock, Unlock, ExternalLink
} from 'lucide-react';

export interface SchoolIdentityConfig {
  header1: string;
  header2: string;
  schoolName: string;
  address: string;
  cityLocation: string;
  principalName: string;
  principalNip: string;
}

interface TeacherPanelProps {
  currentTeacher: Teacher;
  classes: ClassItem[];
  subjects: SubjectItem[];
  students: Student[];
  materials: Material[];
  teachingModules?: TeachingModule[];
  onSaveTeachingModule?: (mod: Omit<TeachingModule, 'id'>) => void;
  onUpdateTeachingModule?: (mod: TeachingModule) => void;
  onDeleteTeachingModule?: (id: string) => void;
  exams: Exam[];
  questionBanks?: QuestionBank[];
  journals: JournalEntry[];
  submissions?: ExamSubmission[];
  manualAssessments?: ManualAssessment[];
  cheatLogs?: CheatLog[];
  onDeleteCheatLog?: (id: string) => void;
  onClearCheatLogsBatch?: (ids: string[]) => void;
  onSaveMaterial: (materi: Omit<Material, 'id' | 'createdAt'>) => void;
  onUpdateMaterial?: (materi: Material) => void;
  onToggleMaterial: (id: string, currentStatus: 'Aktif' | 'Draft') => void;
  onDeleteMaterial?: (id: string) => void;
  onSaveExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void;
  onUpdateExam?: (exam: Exam) => void;
  onDeleteExam?: (id: string) => void;
  onSaveQuestionBank?: (bank: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'> | QuestionBank) => void;
  onDeleteQuestionBank?: (id: string) => void;
  onSaveManualAssessment?: (assessment: Omit<ManualAssessment, 'id' | 'createdAt'>) => void;
  onUpdateManualAssessment?: (assessment: ManualAssessment) => void;
  onDeleteManualAssessment?: (id: string) => void;
  onSaveJournal: (entry: Omit<JournalEntry, 'id'>) => void;
  onUpdateJournal?: (entry: JournalEntry) => void;
  onDeleteJournal?: (id: string) => void;
  onUpdateTeacher?: (updated: Teacher) => void;
  announcements?: TeacherAnnouncement[];
  shareRequests?: ShareRequest[];
  teachers?: Teacher[];
  onShareToTeacher?: (request: Omit<ShareRequest, 'id' | 'createdAt'>) => void;
  onAddReferral?: (ref: Omit<CounselingReferral, 'id' | 'createdAt'>) => void;
  onRespondShare?: (requestId: string, response: 'Accepted' | 'Rejected') => void;
  onDeleteShare?: (requestId: string) => void;
  onClearAllShares?: (receiverId: string) => void;
  onSaveAnnouncement?: (ann: Omit<TeacherAnnouncement, 'id' | 'createdAt'>) => void;
  onDeleteAnnouncement?: (id: string) => void;
  onToggleAnnouncement?: (id: string) => void;
  scheduleNotes: TeacherScheduleNote[];
  onSaveSchedule: (newSched: Omit<TeacherScheduleNote, 'id'>) => void;
  onUpdateSchedule: (updatedSched: TeacherScheduleNote) => void;
  onDeleteSchedule: (id: string) => void;
  assignmentFolders?: AssignmentFolder[];
  assignmentSubmissions?: AssignmentSubmission[];
  onSaveAssignmentFolder?: (folder: Omit<AssignmentFolder, 'id' | 'createdAt'>) => void;
  onUpdateAssignmentFolder?: (folder: AssignmentFolder) => void;
  onDeleteAssignmentFolder?: (id: string) => void;
  onUpdateAssignmentSubmission?: (sub: AssignmentSubmission) => void;
  onDeleteAssignmentSubmission?: (id: string) => void;
  livePresentation?: LivePresentationSession;
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
  );
}

export default function TeacherPanel({
  currentTeacher,
  classes,
  subjects,
  students,
  materials,
  teachingModules = [],
  onSaveTeachingModule,
  onUpdateTeachingModule,
  onDeleteTeachingModule,
  exams,
  questionBanks = [],
  journals,
  submissions = [],
  manualAssessments = [],
  cheatLogs = [],
  onDeleteCheatLog,
  onClearCheatLogsBatch,
  onSaveMaterial,
  onUpdateMaterial,
  onToggleMaterial,
  onDeleteMaterial,
  onSaveExam,
  onUpdateExam,
  onDeleteExam,
  onSaveQuestionBank,
  onDeleteQuestionBank,
  onSaveManualAssessment,
  onUpdateManualAssessment,
  onDeleteManualAssessment,
  onSaveJournal,
  onUpdateJournal,
  onDeleteJournal,
  onUpdateTeacher,
  announcements = [],
  shareRequests = [],
  teachers = [],
  onShareToTeacher,
  onRespondShare,
  onDeleteShare,
  onClearAllShares,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onAddReferral,
  onToggleAnnouncement,
  scheduleNotes,
  onSaveSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  assignmentFolders = [],
  assignmentSubmissions = [],
  onSaveAssignmentFolder,
  onUpdateAssignmentFolder,
  onDeleteAssignmentFolder,
  onUpdateAssignmentSubmission,
  onDeleteAssignmentSubmission,
  livePresentation,
  onUpdateLivePresentation
}: TeacherPanelProps) {
  const myScheduleNotes = (scheduleNotes || []).filter(n => n.teacherId === currentTeacher.id);
  const sortedClasses = [...classes].sort((a, b) => {
    const aMatch = a.name.match(/^(VII|VIII|IX|7|8|9)(.*)$/i);
    const bMatch = b.name.match(/^(VII|VIII|IX|7|8|9)(.*)$/i);
    
    const getGradeLevel = (match: RegExpMatchArray | null) => {
      if (!match) return 99;
      const gradeStr = match[1].toUpperCase();
      if (gradeStr === 'VII' || gradeStr === '7') return 7;
      if (gradeStr === 'VIII' || gradeStr === '8') return 8;
      if (gradeStr === 'IX' || gradeStr === '9') return 9;
      return 99;
    };
    
    const levelA = getGradeLevel(aMatch);
    const levelB = getGradeLevel(bMatch);
    
    if (levelA !== levelB) return levelA - levelB;
    return a.name.localeCompare(b.name);
  });

  const [activeTab, setActiveTab] = useState<'journal' | 'materials' | 'teaching_modules' | 'exams' | 'bank_soal' | 'daftar_nilai' | 'profile' | 'announcements' | 'cheatlogs' | 'konseling' | 'inbox' | 'assignments'>('journal');
  const [inboxFilter, setInboxFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Rejected'>('All');

  // --- ASSIGNMENTS & FOLDER MANAGEMENT STATE ---
  const [currentAssignFolderId, setCurrentAssignFolderId] = useState<string | null>(null);
  const [showAssignFolderModal, setShowAssignFolderModal] = useState(false);
  const [showAssignItemModal, setShowAssignItemModal] = useState(false);
  const [assignModalMode, setAssignModalMode] = useState<'create' | 'edit'>('create');
  const [editingAssignId, setEditingAssignId] = useState<string | null>(null);
  
  const [assignFolderTitleInput, setAssignFolderTitleInput] = useState('');
  const [assignItemTitleInput, setAssignItemTitleInput] = useState('');
  const [assignClassIdInput, setAssignClassIdInput] = useState('');
  const [assignSubjectIdInput, setAssignSubjectIdInput] = useState('');
  const [assignDueDateInput, setAssignDueDateInput] = useState('');
  const [assignDescInput, setAssignDescInput] = useState('');
  const [assignGDriveUrlInput, setAssignGDriveUrlInput] = useState('');

  // Cut & Paste State
  const [clipboardAssignItem, setClipboardAssignItem] = useState<{ id: string; title: string; type: 'folder' | 'assignment' } | null>(null);

  // Student Submissions Inspection State
  const [selectedSubmissionsAssign, setSelectedSubmissionsAssign] = useState<AssignmentFolder | null>(null);
  const [feedbackGradeInput, setFeedbackGradeInput] = useState<Record<string, { grade: number; feedback: string }>>({});

  // Live Presentation Lab Sync State for Teacher
  const [activeLiveMaterial, setActiveLiveMaterial] = useState<Material | null>(null);
  const [liveSlideNum, setLiveSlideNum] = useState<number>(1);
  const [liveLaserPointer, setLiveLaserPointer] = useState<{ x: number; y: number } | null>(null);
  const lastLaserSyncRef = useRef<number>(0);
  const teacherContentRef = useRef<HTMLDivElement | null>(null);

  // --- 0. IDENTITAS SEKOLAH & KEPALA SEKOLAH STATE ---
  const [schoolIdentity, setSchoolIdentity] = useState<SchoolIdentityConfig>(() => {
    const saved = localStorage.getItem('smpn1beji_school_identity');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      header1: 'PEMERINTAH KABUPATEN PASURUAN',
      header2: 'DINAS PENDIDIKAN',
      schoolName: 'SMP NEGERI 1 BEJI',
      address: 'Jl. Wicaksana No. 22A Gununggangsir Beji, Kab Pasuruan',
      cityLocation: 'Beji, Kab. Pasuruan',
      principalName: 'Dr. H. Ahmad Wijaya, M.Pd.',
      principalNip: '19720512 199802 1 004'
    };
  });

  const [editIdentityForm, setEditIdentityForm] = useState<SchoolIdentityConfig>(schoolIdentity);

  useEffect(() => {
    setEditIdentityForm(schoolIdentity);
  }, [schoolIdentity]);

  const handleSaveSchoolIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolIdentity(editIdentityForm);
    localStorage.setItem('smpn1beji_school_identity', JSON.stringify(editIdentityForm));
    toast('Identitas Sekolah & Nama Kepala Sekolah berhasil diperbarui!');
  };

  // --- 0.5. PROFILE & SCHEDULE STATE ---
  const [profilePhotoInput, setProfilePhotoInput] = useState(currentTeacher.photoUrl || '');
  const [profileNameInput, setProfileNameInput] = useState(currentTeacher.name || '');
  const [profileNipInput, setProfileNipInput] = useState(currentTeacher.nip || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Anti-cheat log states
  const [teacherCheatClassFilter, setTeacherCheatClassFilter] = useState('ALL');
  const [teacherCheatExamFilter, setTeacherCheatExamFilter] = useState('ALL');
  const [teacherCheatDateFilter, setTeacherCheatDateFilter] = useState<'ALL' | 'TODAY'>('ALL');
  const [teacherCheatSearchQuery, setTeacherCheatSearchQuery] = useState('');

  useEffect(() => {
    setProfilePhotoInput(currentTeacher.photoUrl || '');
    setProfileNameInput(currentTeacher.name || '');
    setProfileNipInput(currentTeacher.nip || '');
  }, [currentTeacher]);

  const handleProfilePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePhotoInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTeacher: Teacher = {
      ...currentTeacher,
      name: profileNameInput,
      nip: profileNipInput,
      photoUrl: profilePhotoInput
    };
    if (onUpdateTeacher) {
      onUpdateTeacher(updatedTeacher);
    }
    setProfileSuccessMsg('Foto Profil & Biodata Guru Mapel berhasil diperbarui!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  // Schedule Notes State
  

  const parseJamsFromText = (text: string): number[] => {
    const rangeMatch = text.match(/Jam Ke\s*(\d+)\s*-\s*(\d+)/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end && end <= 12) {
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
      }
    }
    const numbersMatch = text.match(/\d+/g);
    if (numbersMatch) {
      const nums = numbersMatch.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 12);
      if (nums.length > 0) return Array.from(new Set(nums)).sort((a,b)=>a-b);
    }
    return [];
  };

  const formatJamsText = (nums: number[]): string => {
    if (nums.length === 0) return '';
    const sorted = [...nums].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const isConsecutive = sorted.length === max - min + 1;
    if (sorted.length === 1) {
      return `Jam Ke ${min} (1 Jam Pelajaran)`;
    }
    if (isConsecutive) {
      return `Jam Ke ${min} - ${max} (${sorted.length} Jam Pelajaran)`;
    }
    return `Jam Ke ${sorted.join(', ')} (${sorted.length} Jam Pelajaran)`;
  };

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Semua');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [schedDay, setSchedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jum\'at' | 'Sabtu'>('Senin');
  const [schedJam, setSchedJam] = useState('Jam Ke 1 - 2 (2 Jam Pelajaran)');
  const [selectedJams, setSelectedJams] = useState<number[]>([1, 2]);
  const [schedClass, setSchedClass] = useState('');
  const [schedRoom, setSchedRoom] = useState('Ruang Kelas');
  const [schedNote, setSchedNote] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleToggleJam = (num: number) => {
    const exists = selectedJams.includes(num);
    const next = exists ? selectedJams.filter(n => n !== num) : [...selectedJams, num];
    setSelectedJams(next);
    setSchedJam(formatJamsText(next));
  };

  const handleSetPresetJams = (nums: number[]) => {
    setSelectedJams(nums);
    setSchedJam(formatJamsText(nums));
  };

  const handleOpenAddSchedule = () => {
    setEditingScheduleId(null);
    setSchedDay('Senin');
    setSchedJam('Jam Ke 1 - 2 (2 Jam Pelajaran)');
    setSelectedJams([1, 2]);
    setSchedClass(sortedClasses[0]?.name || 'VII-A');
    setSchedRoom('Ruang Kelas');
    setSchedNote('');
    setShowScheduleModal(true);
  };

  const handleOpenEditSchedule = (note: TeacherScheduleNote) => {
    setEditingScheduleId(note.id);
    setSchedDay(note.day);
    setSchedJam(note.jamKe);
    setSelectedJams(parseJamsFromText(note.jamKe));
    setSchedClass(note.className);
    setSchedRoom(note.room || '');
    setSchedNote(note.note);
    setShowScheduleModal(true);
  };

  const handleSaveScheduleNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedJam || !schedClass) return;

    let updated: TeacherScheduleNote[];
    if (editingScheduleId) {
      const targetNote = scheduleNotes.find(n => n.id === editingScheduleId);
      if (targetNote) {
        onUpdateSchedule({
          ...targetNote,
          day: schedDay,
          jamKe: schedJam,
          className: schedClass,
          classId: classes.find(c => c.name === schedClass)?.id || schedClass,
          room: schedRoom,
          note: schedNote
        });
      }
    } else {
      onSaveSchedule({
        teacherId: currentTeacher.id,
        day: schedDay,
        jamKe: schedJam,
        classId: classes.find(c => c.name === schedClass)?.id || schedClass,
        className: schedClass,
        room: schedRoom,
        note: schedNote
      });
    }
    setShowScheduleModal(false);
  };

  const handleDeleteScheduleNote = (id: string) => {
    onDeleteSchedule(id);
  };

  // --- ANNOUNCEMENTS / NOTIFICATIONS STATE ---
  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [annTitleInput, setAnnTitleInput] = useState('');
  const [annContentInput, setAnnContentInput] = useState('');
  const [annTargetType, setAnnTargetType] = useState<'all' | 'class'>('all');
  const [annTargetClass, setAnnTargetClass] = useState(sortedClasses[0]?.name || 'VII-A');
  const [annPriority, setAnnPriority] = useState<'normal' | 'penting' | 'mendesak'>('penting');

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitleInput.trim() || !annContentInput.trim()) return;
    if (onSaveAnnouncement) {
      onSaveAnnouncement({
        teacherId: currentTeacher.id,
        teacherName: currentTeacher.name,
        teacherSubject: currentTeacher.subject,
        targetType: annTargetType,
        targetClassId: annTargetType === 'class' ? classes.find(c => c.name === annTargetClass)?.id : undefined,
        targetClassName: annTargetType === 'class' ? annTargetClass : undefined,
        title: annTitleInput.trim(),
        content: annContentInput.trim(),
        priority: annPriority,
        isActive: true
      });
    }
    setAnnTitleInput('');
    setAnnContentInput('');
    setShowAddAnnModal(false);
    toast('Notifikasi Catatan / Informasi berhasil dikirim kepada Siswa!');
  };

  const teacherAnnouncements = announcements.filter(a => {
    if (currentTeacher.name === 'Semua Guru') return true;
    const currentSubjects = (currentTeacher.subject || '').split(',').map(s => s.trim().toLowerCase());
    const annSubjects = (a.teacherSubject || '').split(',').map(s => s.trim().toLowerCase());
    const hasSubjectOverlap = currentTeacher.subject !== 'Semua Mata Pelajaran' && currentSubjects.some(s => annSubjects.includes(s));
    return a.teacherId === currentTeacher.id || 
           a.teacherName === currentTeacher.name || 
           hasSubjectOverlap;
  });

  // --- 1. JOURNAL STATE ---
  const [journalSubTab, setJournalSubTab] = useState<'form' | 'recap_daily' | 'recap_weekly' | 'recap_monthly' | 'settings'>('form');
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalClass, setJournalClass] = useState('');
  const [journalSubject, setJournalSubject] = useState('');
  const [journalStartPeriod, setJournalStartPeriod] = useState<number>(2);
  const [journalEndPeriod, setJournalEndPeriod] = useState<number>(4);
  const [journalTopic, setJournalTopic] = useState('');
  const [journalObjectives, setJournalObjectives] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [attendance, setAttendance] = useState<{ [studentId: string]: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' }>({});
  const [journalSuccessMessage, setJournalSuccessMessage] = useState('');

  // Recap filter states
  const [recapFilterDate, setRecapFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [recapFilterMonth, setRecapFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-07"
  const [printModalData, setPrintModalData] = useState<{ isOpen: boolean; title: string; subtitle: string; entries: JournalEntry[] }>({
    isOpen: false,
    title: '',
    subtitle: '',
    entries: []
  });

  // Get active student lists matching selected class
  const classStudents = students.filter(s => s.classId === journalClass).sort((a, b) => {
    if (a.noAbsen != null && b.noAbsen != null) return a.noAbsen - b.noAbsen;
    if (a.noAbsen != null) return -1;
    if (b.noAbsen != null) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  useEffect(() => {
    // Set default attendance for newly selected class
    const initialAtt: typeof attendance = {};
    classStudents.forEach(s => {
      initialAtt[s.id] = 'Hadir';
    });
    setAttendance(initialAtt);
  }, [journalClass, students]);

  const handleAttendanceChange = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleEditJournalAction = (journal: JournalEntry) => {
    setEditingJournalId(journal.id);
    setJournalDate(journal.date);
    setJournalClass(journal.classId);
    setJournalSubject(journal.subjectId);
    setJournalStartPeriod(journal.startPeriod || 2);
    setJournalEndPeriod(journal.endPeriod || 2);
    setJournalTopic(journal.topic);
    setJournalObjectives(journal.learningObjectives || '');
    setJournalNotes(journal.notes || '');
    
    const attMap: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'> = {};
    journal.attendance.forEach(a => {
      attMap[a.studentId] = a.status;
    });
    setAttendance(attMap);

    setJournalSubTab('form');
  };

  const handleDeleteJournalAction = (id: string) => {
    if (onDeleteJournal) {
      onDeleteJournal(id);
      toast.success('Jurnal berhasil dihapus');
    }
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalClass || !journalSubject || !journalTopic || !journalObjectives) {
      toast('Mohon lengkapi data kelas, mapel, topik, dan tujuan pembelajaran!');
      return;
    }

    if (journalStartPeriod > journalEndPeriod) {
      toast('Jam mulai pembelajaran tidak boleh lebih besar dari jam selesai!');
      return;
    }

    const attendanceList = classStudents.map(s => ({
      studentId: s.id,
      status: attendance[s.id] || 'Hadir'
    }));

    if (editingJournalId && onUpdateJournal) {
      onUpdateJournal({
        id: editingJournalId,
        date: journalDate,
        classId: journalClass,
        subjectId: journalSubject,
        teacherId: currentTeacher.id,
        topic: journalTopic,
        learningObjectives: journalObjectives,
        notes: journalNotes,
        startPeriod: Number(journalStartPeriod),
        endPeriod: Number(journalEndPeriod),
        attendance: attendanceList
      });
      toast.success('Jurnal berhasil diperbarui!');
    } else {
      onSaveJournal({
        date: journalDate,
        classId: journalClass,
        subjectId: journalSubject,
        teacherId: currentTeacher.id,
        topic: journalTopic,
        learningObjectives: journalObjectives,
        notes: journalNotes,
        startPeriod: Number(journalStartPeriod),
        endPeriod: Number(journalEndPeriod),
        attendance: attendanceList
      });
      setJournalSuccessMessage('Jurnal Mengajar Digital berhasil disimpan!');
      setTimeout(() => setJournalSuccessMessage(''), 4000);
    }

    setJournalTopic('');
    setJournalObjectives('');
    setJournalNotes('');
    setEditingJournalId(null);
  };

  const getAbsentStudentDetails = (entry: JournalEntry) => {
    const sakitNames = entry.attendance
      .filter(a => a.status === 'Sakit')
      .map(a => students.find(s => s.id === a.studentId)?.name || a.studentId);
    const izinNames = entry.attendance
      .filter(a => a.status === 'Izin')
      .map(a => students.find(s => s.id === a.studentId)?.name || a.studentId);
    const alpaNames = entry.attendance
      .filter(a => a.status === 'Alpa')
      .map(a => students.find(s => s.id === a.studentId)?.name || a.studentId);

    return { sakitNames, izinNames, alpaNames };
  };

  const renderAbsentStudentsCell = (entry: JournalEntry) => {
    const hadir = entry.attendance.filter(a => a.status === 'Hadir').length;
    const { sakitNames, izinNames, alpaNames } = getAbsentStudentDetails(entry);
    const totalAbsent = sakitNames.length + izinNames.length + alpaNames.length;

    return (
      <div className="space-y-1.5 min-w-[200px]">
        <div className="font-mono text-[11px] font-bold text-center bg-slate-100/80 py-1 px-2 rounded-lg border border-slate-200">
          <span className="text-emerald-700">{hadir}H</span> / <span className="text-blue-600">{sakitNames.length}S</span> / <span className="text-amber-600">{izinNames.length}I</span> / <span className="text-red-600">{alpaNames.length}A</span>
        </div>
        {totalAbsent === 0 ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
              ✅ Semua Hadir (100%)
            </span>
          </div>
        ) : (
          <div className="space-y-1 text-[10px] text-left">
            {sakitNames.length > 0 && (
              <div className="p-1.5 bg-blue-50 border border-blue-200 text-blue-950 rounded-md leading-relaxed shadow-2xs">
                <span className="font-black text-blue-700">🤒 Sakit ({sakitNames.length}): </span>
                <span className="font-semibold">{sakitNames.join(', ')}</span>
              </div>
            )}
            {izinNames.length > 0 && (
              <div className="p-1.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-md leading-relaxed shadow-2xs">
                <span className="font-black text-amber-700">📩 Izin ({izinNames.length}): </span>
                <span className="font-semibold">{izinNames.join(', ')}</span>
              </div>
            )}
            {alpaNames.length > 0 && (
              <div className="p-1.5 bg-red-50 border border-red-200 text-red-950 rounded-md leading-relaxed shadow-2xs">
                <span className="font-black text-red-700">❌ Alpa ({alpaNames.length}): </span>
                <span className="font-semibold">{alpaNames.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getDayNameIndo = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '-';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dateObj.getDay()];
  };

  const formatMonthIndo = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const parts = monthStr.split('-');
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return monthStr;
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (month >= 1 && month <= 12 && !isNaN(day)) {
      return `${day} ${months[month - 1]} ${year}`;
    }
    return dateStr;
  };

  const handleExportJournalRecap = (entries: JournalEntry[], filenameTitle: string) => {
    if (entries.length === 0) {
      toast('Tidak ada data jurnal untuk diekspor!');
      return;
    }

    const rows = entries.map((j, idx) => {
      const cls = classes.find(c => c.id === j.classId)?.name || j.classId;
      const subj = subjects.find(s => s.id === j.subjectId)?.name || j.subjectId;
      const tchr = j.teacherId === currentTeacher.id ? currentTeacher.name : j.teacherId;
      
      const attHadir = j.attendance.filter(a => a.status === 'Hadir').length;
      const { sakitNames, izinNames, alpaNames } = getAbsentStudentDetails(j);

      const jamStr = (j.startPeriod && j.endPeriod) 
        ? `Jam Ke ${j.startPeriod} s/d ${j.endPeriod}` 
        : '-';

      const daftarTidakHadir = [
        sakitNames.length > 0 ? `Sakit: ${sakitNames.join(', ')}` : null,
        izinNames.length > 0 ? `Izin: ${izinNames.join(', ')}` : null,
        alpaNames.length > 0 ? `Alpa: ${alpaNames.join(', ')}` : null,
      ].filter(Boolean).join(' | ') || 'Nihil (Semua Hadir)';

      return {
        'No': idx + 1,
        'Tanggal': j.date,
        'Hari': getDayNameIndo(j.date),
        'Jam Ke-': jamStr,
        'Kelas': cls,
        'Mata Pelajaran': subj,
        'Guru Mapel': tchr,
        'NIP Guru': j.teacherId === currentTeacher.id ? (currentTeacher.nip || '-') : '-',
        'Topik / Materi': j.topic,
        'Tujuan Pembelajaran': j.learningObjectives || '-',
        'Hadir (Jml)': attHadir,
        'Sakit (Jml)': sakitNames.length,
        'Nama Siswa Sakit': sakitNames.join(', ') || '-',
        'Izin (Jml)': izinNames.length,
        'Nama Siswa Izin': izinNames.join(', ') || '-',
        'Alpa (Jml)': alpaNames.length,
        'Nama Siswa Alpa': alpaNames.join(', ') || '-',
        'Catatan Siswa Tidak Hadir': daftarTidakHadir,
        'Catatan / Kendala KBM': j.notes || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      {wch: 5}, {wch: 12}, {wch: 10}, {wch: 16}, {wch: 14}, {wch: 22}, {wch: 24}, {wch: 35}, {wch: 40},
      {wch: 10}, {wch: 10}, {wch: 25}, {wch: 10}, {wch: 25}, {wch: 10}, {wch: 25}, {wch: 40}, {wch: 30}
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Jurnal');
    XLSX.writeFile(wb, `${filenameTitle.replace(/\s+/g, '_')}.xlsx`);
  };

  const sortJournalsAscending = (a: JournalEntry, b: JournalEntry) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const startA = a.startPeriod || 0;
    const startB = b.startPeriod || 0;
    return startA - startB;
  };

  const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const generateAndOpenPrintWindow = (entriesToPrint: JournalEntry[], title: string, subtitle: string) => {
    if (entriesToPrint.length === 0) {
      toast('Tidak ada data jurnal untuk dicetak!');
      return;
    }

    const htmlRows = entriesToPrint.map((j, idx) => {
      const cls = classes.find(c => c.id === j.classId)?.name || j.classId;
      const subj = subjects.find(s => s.id === j.subjectId)?.name || j.subjectId;
      const tchr = j.teacherId === currentTeacher.id ? currentTeacher.name : j.teacherId;
      const hadir = j.attendance.filter(a => a.status === 'Hadir').length;
      const { sakitNames, izinNames, alpaNames } = getAbsentStudentDetails(j);
      
      const hari = getDayNameIndo(j.date);
      const jamStr = (j.startPeriod && j.endPeriod) ? `Jam Ke ${j.startPeriod} - ${j.endPeriod}` : '-';
      const formattedDate = formatDateToDDMMYYYY(j.date);

      let absenHtml = '<span style="color:#059669;font-weight:bold;">Semua Hadir (100%)</span>';
      if (sakitNames.length + izinNames.length + alpaNames.length > 0) {
        const list = [];
        if (sakitNames.length > 0) list.push(`<b>Sakit (${sakitNames.length}):</b> ${sakitNames.join(', ')}`);
        if (izinNames.length > 0) list.push(`<b>Izin (${izinNames.length}):</b> ${izinNames.join(', ')}`);
        if (alpaNames.length > 0) list.push(`<b>Alpa (${alpaNames.length}):</b> ${alpaNames.join(', ')}`);
        absenHtml = list.join('<br/>');
      }

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="white-space:nowrap;"><b>${hari}</b><br/>${formattedDate}</td>
          <td style="text-align:center;">${jamStr}</td>
          <td><b>${cls}</b><br/><span style="color:#475569;">${subj}</span></td>
          <td><b>${j.topic}</b>${j.learningObjectives ? `<br/><small style="color:#64748b;">TP: ${j.learningObjectives}</small>` : ''}</td>
          <td style="text-align:center;font-family:monospace;font-weight:bold;">${hadir}H / ${sakitNames.length}S / ${izinNames.length}I / ${alpaNames.length}A</td>
          <td style="font-size:11px;">${absenHtml}</td>
          <td style="font-size:11px;">${j.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { position: relative; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; min-height: 80px; }
          .header-logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 72px; height: 72px; object-fit: contain; }
          .header-text { text-align: center; width: 100%; padding-left: 80px; padding-right: 80px; }
          .header-text h1 { font-size: 16px; margin: 0; text-transform: uppercase; color: #0f172a; font-weight: bold; line-height: 1.25; }
          .header-text h2 { font-size: 13px; margin: 4px 0 0 0; color: #334155; font-weight: normal; }
          .meta { margin-bottom: 16px; font-size: 13px; display: flex; justify-content: space-between; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th, td { border: 1px solid #94a3b8; padding: 8px 10px; vertical-align: top; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; text-transform: uppercase; font-size: 11px; }
          .footer { display: flex; justify-content: space-between; margin-top: 36px; font-size: 13px; page-break-inside: avoid; }
          .sign-box { text-align: center; width: 220px; }
          .sign-space { height: 70px; }
          .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak Dokumen / Simpan PDF</button>
        </div>
        <div class="header">
          <img src="${SCHOOL_LOGO_BASE64}" alt="Logo Sekolah" class="header-logo" />
          <div class="header-text">
            <h1>${schoolIdentity.header1}</h1>
            <h1>${schoolIdentity.header2}</h1>
            <h1 style="font-size:20px;margin-top:2px;font-weight:bold;color:#0f172a;">${schoolIdentity.schoolName}</h1>
            <h2>${schoolIdentity.address}</h2>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:16px;text-decoration:underline;">${title.toUpperCase()}</h3>
          <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">${subtitle}</p>
        </div>
        <div class="meta">
          <div>Nama Guru Mapel: ${currentTeacher.name}</div>
          <div>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:30px;text-align:center;">No</th>
              <th style="width:110px;">Hari & Tanggal</th>
              <th style="width:85px;text-align:center;">Jam Ke</th>
              <th style="width:140px;">Kelas & Mapel</th>
              <th>Topik & Capaian Pembelajaran</th>
              <th style="width:110px;text-align:center;">Presensi</th>
              <th style="width:200px;">Siswa Tidak Hadir</th>
              <th style="width:150px;">Catatan KBM</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
        <div class="footer">
          <div class="sign-box">
            <p>Mengetahui,<br/>Kepala Sekolah</p>
            <div class="sign-space"></div>
            <p><b><u>${schoolIdentity.principalName}</u></b><br/>NIP. ${schoolIdentity.principalNip}</p>
          </div>
          <div class="sign-box">
            <p>${schoolIdentity.cityLocation}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mapel,</p>
            <div class="sign-space"></div>
            <p><b><u>${currentTeacher.name}</u></b><br/>NIP. ${currentTeacher.nip || '-'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Coba buka jendela baru, atau tampilkan modal preview di UI jika terblokir
    const printWin = window.open('', '_blank', 'width=1100,height=800');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlDocument);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    } else {
      // Jika pop-up blocker aktif, buka modal pratinjau cetak di dalam app
      setPrintModalData({
        isOpen: true,
        title,
        subtitle,
        entries: entriesToPrint
      });
    }
  };

  const handlePrintJournalRecap = (entriesToPrint: JournalEntry[], title: string, subtitle: string) => {
    // Selalu buka modal pratinjau cetak rapi sekaligus buka print window
    setPrintModalData({
      isOpen: true,
      title,
      subtitle,
      entries: entriesToPrint
    });
    generateAndOpenPrintWindow(entriesToPrint, title, subtitle);
  };



  const exportManualGradeExcel = (assessmentId: string) => {
    const assessment = manualAssessments?.find(m => m.id === assessmentId);
    if (!assessment) return;
    const cls = getClassName(assessment.classId);
    
    const criteriaList = assessment.criteriaNames || [];
    
    const data = assessment.grades.map((g, idx) => {
      const row: Record<string, string | number> = {
        'No': idx + 1,
        'NIS': g.studentNis,
        'Nama Siswa': g.studentName,
        'Nilai Angka': g.score,
      };
      
      criteriaList.forEach(criteria => {
        row[criteria] = g.criteriaGrades?.[criteria] || 'B';
      });
      
      row['Catatan'] = g.notes || '';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penilaian Manual');
    XLSX.writeFile(workbook, `Penilaian_${assessment.title.replace(/\s+/g, '_')}_${cls}.xlsx`);
  };

  const printManualGradeDocument = (assessmentId: string) => {
    const assessment = manualAssessments?.find(m => m.id === assessmentId);
    if (!assessment) return;
    const cls = getClassName(assessment.classId);
    const subj = getSubjectName(assessment.subjectId);

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Penilaian Manual - ${assessment.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { position: relative; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; min-height: 80px; }
          .header-logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 72px; height: 72px; object-fit: contain; }
          .header-text { text-align: center; width: 100%; padding-left: 80px; padding-right: 80px; }
          .header-text h1 { font-size: 16px; margin: 0; text-transform: uppercase; color: #0f172a; font-weight: bold; line-height: 1.25; }
          .header-text h2 { font-size: 13px; margin: 4px 0 0 0; color: #334155; font-weight: normal; }
          .info-table { width: 100%; margin-bottom: 20px; font-size: 12px; }
          .info-table td { padding: 4px 0; }
          .info-table td:nth-child(1) { width: 120px; font-weight: bold; }
          .info-table td:nth-child(2) { width: 10px; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          .data-table th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
          .text-center { text-align: center; }
          .footer { display: flex; justify-content: space-between; margin-top: 36px; font-size: 13px; page-break-inside: avoid; }
          .sign-box { text-align: center; width: 220px; }
          .signature-space { height: 70px; }
          .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak Dokumen / Simpan PDF</button>
        </div>
        <div class="header">
          <img src="${SCHOOL_LOGO_BASE64}" alt="Logo Sekolah" class="header-logo" />
          <div class="header-text">
            <h1>${schoolIdentity.header1}</h1>
            <h1>${schoolIdentity.header2}</h1>
            <h1 style="font-size:20px;margin-top:2px;font-weight:bold;color:#0f172a;">${schoolIdentity.schoolName}</h1>
            <h2>${schoolIdentity.address}</h2>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:16px;text-decoration:underline;">DAFTAR NILAI ${assessment.title.toUpperCase()}</h3>
          <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">Mata Pelajaran: ${subj} | Kelas: ${cls} | Jenis: ${assessment.type}</p>
        </div>
        
        <table class="info-table">
          <tr><td>Mata Pelajaran</td><td>:</td><td>${subj}</td></tr>
          <tr><td>Kelas</td><td>:</td><td>${cls}</td></tr>
          <tr><td>Jenis Penilaian</td><td>:</td><td>${assessment.type}</td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${assessment.date}</td></tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th class="text-center" style="width: 80px;">Nilai Angka</th>
              ${(assessment.criteriaNames || []).map(c => `<th class="text-center" style="width: 70px;">${c}</th>`).join('')}
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${assessment.grades.map((g, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${g.studentNis}</td>
                <td>${g.studentName}</td>
                <td class="text-center"><strong>${g.score}</strong></td>
                ${(assessment.criteriaNames || []).map(c => `<td class="text-center">${g.criteriaGrades?.[c] || 'B'}</td>`).join('')}
                <td>${g.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="sign-box">
            <p>Mengetahui,<br/>Kepala Sekolah</p>
            <div class="signature-space"></div>
            <p><b><u>${schoolIdentity.principalName}</u></b><br/>NIP. ${schoolIdentity.principalNip}</p>
          </div>
          <div class="sign-box">
            <p>${schoolIdentity.cityLocation}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mapel,</p>
            <div class="signature-space"></div>
            <p><b><u>${currentTeacher.name}</u></b><br/>NIP. ${currentTeacher.nip || '-'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlDocument);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  const exportGradesExcel = (selectedExamId: string) => {
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;
    const examSubmissions = teacherSubmissions.filter(s => s.examId === selectedExamId).sort(sortSubmissions);
    const cls = getClassName(exam.classId);
    const subj = getSubjectName(exam.subjectId);
    
    const data = examSubmissions.map((s, idx) => ({
      'No': idx + 1,
      'NIS': s.studentNis,
      'Nama Siswa': s.studentName,
      'Nilai': s.score,
      'Waktu Pengerjaan': new Date(s.submittedAt).toLocaleString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Nilai');
    XLSX.writeFile(workbook, `Daftar_Nilai_${exam.title.replace(/\s+/g, '_')}_${cls}.xlsx`);
  };

  const printGradesDocument = (selectedExamId: string) => {
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;
    
    const examSubmissions = teacherSubmissions.filter(s => s.examId === selectedExamId).sort(sortSubmissions);
    const cls = getClassName(exam.classId);
    const subj = getSubjectName(exam.subjectId);
    
    const rows = examSubmissions.map((s, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${s.studentNis}</td>
        <td><b>${s.studentName}</b></td>
        <td style="text-align:center; font-weight:bold; font-size:14px; color: ${s.score >= 70 ? '#059669' : '#e11d48'}">${s.score}</td>
        <td style="text-align:center;">${new Date(s.submittedAt).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Nilai - ${exam.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { position: relative; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; min-height: 80px; }
          .header-logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 72px; height: 72px; object-fit: contain; }
          .header-text { text-align: center; width: 100%; padding-left: 80px; padding-right: 80px; }
          .header-text h1 { font-size: 16px; margin: 0; text-transform: uppercase; color: #0f172a; font-weight: bold; line-height: 1.25; }
          .header-text h2 { font-size: 13px; margin: 4px 0 0 0; color: #334155; font-weight: normal; }
          .meta { margin-bottom: 16px; font-size: 13px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th, td { border: 1px solid #94a3b8; padding: 8px 10px; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; text-transform: uppercase; font-size: 12px; }
          .footer { display: flex; justify-content: space-between; margin-top: 36px; font-size: 13px; page-break-inside: avoid; }
          .sign-box { text-align: center; width: 220px; }
          .sign-space { height: 70px; }
          .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
        </div>
        <div class="header">
          <img src="${SCHOOL_LOGO_BASE64}" alt="Logo Sekolah" class="header-logo" />
          <div class="header-text">
            <h1>${schoolIdentity.header1}</h1>
            <h1>${schoolIdentity.header2}</h1>
            <h1 style="font-size:20px;margin-top:2px;font-weight:bold;color:#0f172a;">${schoolIdentity.schoolName}</h1>
            <h2>${schoolIdentity.address}</h2>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:16px;text-decoration:underline;">DAFTAR NILAI ${exam.title.toUpperCase()}</h3>
          <p style="margin:4px 0 0 0;font-size:13px;color:#475569;">Kelas: ${cls} | Mapel: ${subj}</p>
        </div>
        <div class="meta">
          <div>Guru Mata Pelajaran: ${currentTeacher.name}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:50px;text-align:center;">No</th>
              <th>NIS</th>
              <th>Nama Siswa</th>
              <th style="text-align:center;">Nilai</th>
              <th style="text-align:center;">Waktu Pengumpulan</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" style="text-align:center;">Belum ada siswa yang mengerjakan.</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          <div class="sign-box">
            <p>Mengetahui,<br/>Kepala Sekolah</p>
            <div class="sign-space"></div>
            <p><b><u>${schoolIdentity.principalName}</u></b><br/>NIP. ${schoolIdentity.principalNip}</p>
          </div>
          <div class="sign-box">
            <p>${schoolIdentity.cityLocation}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mapel,</p>
            <div class="sign-space"></div>
            <p><b><u>${currentTeacher.name}</u></b><br/>NIP. ${currentTeacher.nip || '-'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlDocument);
      printWin.document.close();
    }
  };

  // --- 2. MATERIALS STATE ---
  const [showAddMateriModal, setShowAddMateriModal] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{ id: string; action: 'cut' } | null>(null);
  const [showShareModuleModal, setShowShareModuleModal] = useState(false);
  const [shareModuleId, setShareModuleId] = useState<string | null>(null);
  const [shareModuleTargetTeacher, setShareModuleTargetTeacher] = useState<string>('');

  const handleShareModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModuleId || !shareModuleTargetTeacher) return;
    const mod = teachingModules.find(m => m.id === shareModuleId);
    if (!mod) return;
    onShareToTeacher({
      itemId: mod.id,
      itemType: 'TeachingModule',
      itemTitle: mod.title,
      receiverId: shareModuleTargetTeacher,
      senderId: currentTeacher.id,
      senderName: currentTeacher.name,
      status: 'Pending'
    });
    toast.success('Berhasil dikirim ke guru tujuan!');
    setShowShareModuleModal(false);
    setShareModuleId(null);
    setShareModuleTargetTeacher('');
  };

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState<{ id: string, name: string } | null>(null);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    const folderId = `fold_${Math.random().toString(36).substring(7)}`;
    onSaveTeachingModule?.({
      id: folderId,
      title: folderName,
      classId: '',
      subjectId: '',
      teacherId: currentTeacher.id,
      fileName: '',
      fileUrl: '',
      fileType: '',
      createdAt: new Date().toISOString(),
      type: 'folder',
      parentId: currentFolderId
    } as any);
    toast.success('Folder dibuat!');
    setShowFolderModal(false);
    setFolderName('');
  };

  const handleRenameItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRenameModal || !showRenameModal.name.trim()) return;
    const mod = teachingModules.find(m => m.id === showRenameModal.id);
    if (mod) {
      onUpdateTeachingModule?.({
        ...mod,
        title: showRenameModal.name
      });
      toast.success('Berhasil diganti nama!');
    }
    setShowRenameModal(null);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const modToMove = teachingModules.find(m => m.id === clipboard.id);
    if (modToMove) {
      onUpdateTeachingModule?.({
        ...modToMove,
        parentId: currentFolderId
      });
      toast.success('Berhasil dipindah!');
    }
    setClipboard(null);
  };
  
  // --- TEACHING MODULES STATE ---
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleClassId, setModuleClassId] = useState('');
  const [moduleSubjectId, setModuleSubjectId] = useState('');
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const [moduleUploadProgress, setModuleUploadProgress] = useState(0);

  const resetModuleForm = () => {
    setModuleTitle('');
    setModuleClassId('');
    setModuleSubjectId('');
    setModuleFile(null);
    setModuleUploadProgress(0);
    setEditingModuleId(null);
  };

  
  const handleDownloadFolder = async (folder: TeachingModule) => {
    toast.loading('Mengompres folder, mohon tunggu...', { id: 'download-folder' });
    try {
      const zip = new JSZip();
      
      const addFilesToZip = async (currentFolderId: string, currentZipFolder: JSZip) => {
        const children = (teachingModules || []).filter(m => m.parentId === currentFolderId);
        for (const child of children) {
          if (child.type === 'folder') {
            const newZipFolder = currentZipFolder.folder(child.title);
            if (newZipFolder) {
              await addFilesToZip(child.id, newZipFolder);
            }
          } else {
            if (child.fileUrl === 'CHUNKED') {
              const q = query(collection(db, 'teachingModuleChunks'), where('moduleId', '==', child.id), orderBy('chunkIndex'));
              const snap = await getDocs(q);
              let base64 = '';
              snap.forEach(doc => {
                base64 += doc.data().data;
              });
              if (base64) {
                const base64Data = base64.split(';base64,').pop();
                if (base64Data) {
                  currentZipFolder.file(child.fileName, base64Data, { base64: true });
                }
              }
            } else if (child.fileUrl) {
              try {
                const response = await fetch(child.fileUrl);
                const blob = await response.blob();
                currentZipFolder.file(child.fileName, blob);
              } catch (e) {
                console.warn('Could not fetch file for zip: ', child.fileUrl);
              }
            }
          }
        }
      };

      await addFilesToZip(folder.id, zip);
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `${folder.title}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Berhasil diunduh', { id: 'download-folder' });
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh folder', { id: 'download-folder' });
    }
  };

  const handleDownloadModule = async (mod: TeachingModule) => {
    if (mod.type === 'folder') {
      return handleDownloadFolder(mod);
    }

    if (mod.fileUrl !== 'CHUNKED') {
      const a = document.createElement('a');
      a.href = mod.fileUrl;
      a.download = mod.fileName;
      a.click();
      return;
    }
    
    toast.loading('Mengunduh file...', { id: 'download-mod' });
    try {
      const q = query(collection(db, 'teachingModuleChunks'), where('moduleId', '==', mod.id), orderBy('chunkIndex'));
      const snap = await getDocs(q);
      let base64 = '';
      snap.forEach(doc => {
        base64 += doc.data().data;
      });
      if (base64) {
        const a = document.createElement('a');
        a.href = base64;
        a.download = mod.fileName;
        a.click();
        toast.success('Berhasil diunduh', { id: 'download-mod' });
      } else {
        toast.error('File tidak ditemukan', { id: 'download-mod' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh', { id: 'download-mod' });
    }
  };

  const handleSaveModuleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle || !moduleClassId || !moduleSubjectId) return;
    if (!editingModuleId && !moduleFile) {
      toast.error('Pilih file perangkat pembelajaran untuk diunggah');
      return;
    }

    if (moduleFile && !editingModuleId) {
      if (moduleFile.size > 2200000) {
        toast.error('Ukuran file maksimal 2MB untuk versi ini.');
        return;
      }
      setUploading(true);
      setModuleUploadProgress(10);
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        const moduleId = `tm_${Math.random().toString(36).substring(7)}`;
        const chunkSize = 800000;
        const numChunks = Math.ceil(base64Url.length / chunkSize);
        
        try {
          for (let i = 0; i < numChunks; i++) {
            const chunkData = base64Url.slice(i * chunkSize, (i + 1) * chunkSize);
            await addDocument('teachingModuleChunks', {
              id: `${moduleId}_chunk_${i}`,
              moduleId,
              chunkIndex: i,
              data: chunkData
            });
            setModuleUploadProgress(10 + ((i + 1) / numChunks) * 80);
          }
          
          onSaveTeachingModule?.({
            id: moduleId,
            title: moduleTitle,
            classId: moduleClassId,
            subjectId: moduleSubjectId,
            teacherId: currentTeacher.id,
            fileName: moduleFile.name,
            fileUrl: 'CHUNKED',
            fileType: moduleFile.type || 'application/octet-stream',
            type: 'file',
            parentId: currentFolderId,
            createdAt: new Date().toISOString()
          } as any);
          toast.success('Perangkat Pembelajaran berhasil diunggah!');
        } catch (err) {
          console.error(err);
          toast.error('Gagal mengunggah file. Silakan coba lagi.');
        } finally {
          setUploading(false);
          setModuleUploadProgress(100);
          setShowModuleModal(false);
          resetModuleForm();
        }
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file');
        setUploading(false);
      };
      reader.readAsDataURL(moduleFile);
    } else if (editingModuleId && onUpdateTeachingModule) {
      const existing = teachingModules.find(m => m.id === editingModuleId);
      if (existing) {
        onUpdateTeachingModule({
          ...existing,
          title: moduleTitle,
          classId: moduleClassId,
          subjectId: moduleSubjectId,
        });
        toast.success('Perangkat Pembelajaran berhasil diperbarui!');
        setShowModuleModal(false);
        resetModuleForm();
      }
    }
  };

  const [materiTitle, setMateriTitle] = useState('');
  const [materiClasses, setMateriClasses] = useState<string[]>([]);
  const [materiSubject, setMateriSubject] = useState('');
  const [materiType, setMateriType] = useState<'PDF' | 'Video' | 'Link' | 'Article' | 'Word' | 'Excel' | 'PPT'>('Article');
  const [materiUrl, setMateriUrl] = useState('');
  const [materiContent, setMateriContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const [showShareMateriModal, setShowShareMateriModal] = useState(false);
  const [shareMateriId, setShareMateriId] = useState<string | null>(null);
  const [shareMateriSelectedClasses, setShareMateriSelectedClasses] = useState<string[]>([]);
  const [shareMateriTargetType, setShareMateriTargetType] = useState<'Class' | 'Teacher'>('Class');
  const [shareMateriSelectedTeacher, setShareMateriSelectedTeacher] = useState<string>('');
  const [shareMateriSuccess, setShareMateriSuccess] = useState<boolean>(false);

  const handleSimulatedMateriUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      const simulatedDriveUrl = `https://drive.google.com/file/d/materi_drive_${Math.random().toString(36).substring(7)}/view`;
      setMateriUrl(simulatedDriveUrl);
      setUploading(false);
    }, 1500);
  };

  const handleShareMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareMateriId) return;
    const sourceMat = materials.find(m => m.id === shareMateriId);
    if (!sourceMat) return;

    if (shareMateriTargetType === 'Teacher') {
      if (!shareMateriSelectedTeacher) {
        toast('Pilih guru tujuan!');
        return;
      }
      if (onShareToTeacher) {
        onShareToTeacher({
          senderId: currentTeacher.id,
          senderName: currentTeacher.name,
          receiverId: shareMateriSelectedTeacher,
          itemId: sourceMat.id,
          itemType: 'Material',
          itemTitle: sourceMat.title,
          status: 'Pending'
        });
        toast('Permintaan berbagi berhasil dikirim ke guru yang bersangkutan. Menunggu persetujuan.');
        setShowShareMateriModal(false);
        setShareMateriId(null);
      }
      return;
    }

    if (shareMateriSelectedClasses.length === 0) {
      toast('Pilih minimal 1 kelas!');
      return;
    }

    // Convert existing classId to array if it isn't
    const existingClasses = Array.isArray(sourceMat.classId) ? sourceMat.classId : [sourceMat.classId];
    
    // Add new classes avoiding duplicates
    const newClassesSet = new Set([...existingClasses, ...shareMateriSelectedClasses]);
    const mergedClasses = Array.from(newClassesSet);

    if (onUpdateMaterial) {
      onUpdateMaterial({
        ...sourceMat,
        classId: mergedClasses
      });
    }

    setShareMateriSuccess(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiTitle || materiClasses.length === 0 || !materiSubject) {
      toast('Mohon isi Judul Materi, Kelas, dan Mata Pelajaran.');
      return;
    }
    if (materiType !== 'Article' && !materiUrl) {
      toast('Mohon unggah berkas atau masukkan link materi.');
      return;
    }
    if (materiType === 'Article' && (!materiContent || materiContent === '<p><br></p>')) {
      toast('Mohon isi konten materi artikel.');
      return;
    }

    if (editingMaterialId && onUpdateMaterial) {
      const existing = materials.find(m => m.id === editingMaterialId);
      if (existing) {
        onUpdateMaterial({
          ...existing,
          title: materiTitle,
          classId: materiClasses,
          subjectId: materiSubject,
          fileType: materiType,
          fileUrl: materiType === 'Article' ? '' : materiUrl,
          content: materiType === 'Article' ? materiContent : undefined,
        });
      }
    } else {
      onSaveMaterial({
        title: materiTitle,
        classId: materiClasses,
        subjectId: materiSubject,
        fileType: materiType,
        fileUrl: materiType === 'Article' ? '' : materiUrl,
        content: materiType === 'Article' ? materiContent : undefined,
        status: 'Aktif',
        teacherId: currentTeacher.id
      });
    }

    // Reset Form
    setEditingMaterialId(null);
    setMateriTitle('');
    setMateriUrl('');
    setMateriContent('');
    setShowAddMateriModal(false);
  };


  // --- 3. EXAMS STATE ---
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [isQuestionBankMode, setIsQuestionBankMode] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examClass, setExamClass] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examToken, setExamToken] = useState('');
  const [examDuration, setExamDuration] = useState(30);

  // --- 4. QUESTION BANK STATE ---
  const [showAddQuestionBankModal, setShowAddQuestionBankModal] = useState(false);
  const [qbTitle, setQbTitle] = useState('');
  const [qbSubject, setQbSubject] = useState('');
  const [editingQbId, setEditingQbId] = useState<string | null>(null);

  // --- 4.5. SHARE QUESTION BANK STATE ---
  const [showShareQbModal, setShowShareQbModal] = useState(false);
  const [shareQbId, setShareQbId] = useState<string | null>(null);
  const [shareSelectedClasses, setShareSelectedClasses] = useState<string[]>([]);
  const [shareQbTargetType, setShareQbTargetType] = useState<'Class' | 'Teacher'>('Class');
  const [shareQbSelectedTeacher, setShareQbSelectedTeacher] = useState<string>('');
  const [shareDuration, setShareDuration] = useState(60);
  const [shareSuccessResult, setShareSuccessResult] = useState<{classId: string, className: string, token: string}[] | null>(null);

  // --- 4.6. DAFTAR NILAI STATE ---
  const [selectedClassForGrades, setSelectedClassForGrades] = useState<string>('');
  const [selectedExamForGrades, setSelectedExamForGrades] = useState<string>('');
  const [selectedManualAssessment, setSelectedManualAssessment] = useState<string>('');
  const [showManualAssessmentForm, setShowManualAssessmentForm] = useState(false);
  const [editingManualAssessment, setEditingManualAssessment] = useState<ManualAssessment | null>(null);

  const [manualTitle, setManualTitle] = useState('');
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualType, setManualType] = useState('Praktikum');
  const [manualDate, setManualDate] = useState('');
  const [manualGrades, setManualGrades] = useState<ManualGrade[]>([]);
  const [manualCriteria, setManualCriteria] = useState<string[]>([]);
  const [newCriteriaInput, setNewCriteriaInput] = useState('');

  const handleOpenManualForm = (assessment?: ManualAssessment) => {
    if (assessment) {
      setEditingManualAssessment(assessment);
      setManualTitle(assessment.title);
      setManualSubjectId(assessment.subjectId);
      setManualType(assessment.type);
      setManualDate(assessment.date);
      setManualGrades(assessment.grades);
      setManualCriteria(assessment.criteriaNames || []);
    } else {
      setEditingManualAssessment(null);
      setManualTitle('');
      const mySubjectObj = subjects.find(s => 
        s.name.toLowerCase() === (currentTeacher.subject || '').toLowerCase() || 
        s.id === currentTeacher.subject
      );
      setManualSubjectId(mySubjectObj?.id || (subjects.length > 0 ? subjects[0].id : ''));
      setManualType('Praktikum');
      setManualDate(new Date().toISOString().split('T')[0]);
      setManualCriteria([]);
      
      const classStudents = students
        .filter(s => s.classId === selectedClassForGrades)
        .sort((a, b) => {
          if (a.noAbsen != null && b.noAbsen != null) return a.noAbsen - b.noAbsen;
          if (a.noAbsen != null) return -1;
          if (b.noAbsen != null) return 1;
          return a.name.localeCompare(b.name);
        });
      setManualGrades(classStudents.map(s => ({
        studentId: s.id,
        studentName: s.name,
        studentNis: s.nis,
        score: 0,
        criteriaGrades: {},
        notes: ''
      })));
    }
    setShowManualAssessmentForm(true);
  };

  const handleSaveManual = () => {
    if (!manualTitle || !manualSubjectId || !manualDate) {
      toast.error('Mohon lengkapi judul, mapel, dan tanggal.');
      return;
    }
    
    if (editingManualAssessment && onUpdateManualAssessment) {
      onUpdateManualAssessment({
        ...editingManualAssessment,
        title: manualTitle,
        subjectId: manualSubjectId,
        type: manualType,
        date: manualDate,
        criteriaNames: manualCriteria,
        grades: manualGrades
      });
      toast.success('Penilaian manual diperbarui!');
    } else if (onSaveManualAssessment) {
      onSaveManualAssessment({
        title: manualTitle,
        classId: selectedClassForGrades,
        subjectId: manualSubjectId,
        teacherId: currentTeacher.id,
        date: manualDate,
        type: manualType,
        criteriaNames: manualCriteria,
        grades: manualGrades
      });
      toast.success('Penilaian manual disimpan!');
    }
    setShowManualAssessmentForm(false);
  };

  const handleGradeChange = (studentId: string, score: number) => {
    setManualGrades(prev => prev.map(g => g.studentId === studentId ? { ...g, score } : g));
  };

  const handleGradeNoteChange = (studentId: string, notes: string) => {
    setManualGrades(prev => prev.map(g => g.studentId === studentId ? { ...g, notes } : g));
  };

  const handleGradeCriteriaChange = (studentId: string, criteriaName: string, val: string) => {
    setManualGrades(prev => prev.map(g => {
      if (g.studentId === studentId) {
        return {
          ...g,
          criteriaGrades: {
            ...(g.criteriaGrades || {}),
            [criteriaName]: val
          }
        };
      }
      return g;
    }));
  };

  // Custom exam questions creator (shared between exams and question bank)
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(10);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentQType, setCurrentQType] = useState<QuestionType>('PilihanGanda');
  
  // --- DELETE CONFIRMATION STATE ---
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'Materi' | 'Ujian' | 'Bank Soal', name: string } | null>(null);
  
  // Single question form
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  // Pilihan Ganda Standard inputs
  const [pgOptions, setPgOptions] = useState<string[]>(['', '', '', '']);
  const [pgCorrect, setPgCorrect] = useState('0');
  // Pilihan Ganda Kompleks inputs
  const [pgkOptions, setPgkOptions] = useState<string[]>(['', '', '', '']);
  const [pgkCorrects, setPgkCorrects] = useState<boolean[]>([false, false, false, false]);
  // Pilihan Asosiatif inputs
  const [asoStatements, setAsoStatements] = useState<string[]>([
    '(1) Hasil dari x + y = 5',
    '(2) Hasil dari x - y = 1',
    '(3) Titik potong grafik berada di (3, 2)',
    '(4) Grafik melintasi titik (0, 0)'
  ]);
  const [asoCorrects, setAsoCorrects] = useState<boolean[]>([false, false, false, false]);
  // Pilihan Sebab-Akibat inputs
  const [saStatement, setSaStatement] = useState('Kecepatan linear partikel yang bergerak melingkar adalah konstan.');
  const [saReason, setSaReason] = useState('Arah kecepatan partikel selalu menyinggung lintasan lingkaran.');
  const [saStatementTrue, setSaStatementTrue] = useState(false);
  const [saReasonTrue, setSaReasonTrue] = useState(true);
  const [saCausality, setSaCausality] = useState(false);
  const [uraianAnswer, setUraianAnswer] = useState('');

  // Media & Score state for current question
  const [qFontPreset, setQFontPreset] = useState<'Sans' | 'Serif' | 'Grotesk' | 'Mono'>('Sans');
  const [qMediaType, setQMediaType] = useState<'Image' | 'Video' | 'Audio' | 'None'>('None');
  const [qMediaUrl, setQMediaUrl] = useState('');
  const [qScore, setQScore] = useState<number>(10);

  // Spreadsheet / Excel import states
  const [showImportSection, setShowImportSection] = useState(false);
  const [showBankSoalImporter, setShowBankSoalImporter] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number>(0);

  const insertTextAtCursor = (before: string, after: string = '') => {
    setQText(prev => prev + before + (after ? 'teks' + after : ''));
  };

  const handleAddQuestionToExam = () => {
    if (!qText.trim()) {
      toast('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    const questionId = `q_${Math.random().toString(36).substring(7)}`;
    let questionNode: ExamQuestion;

    const mediaObj = qMediaType !== 'None' ? {
      mediaType: qMediaType,
      mediaUrl: qMediaUrl
    } : {};

    if (currentQType === 'PilihanGanda') {
      questionNode = {
        id: questionId,
        questionText: qText,
        type: 'PilihanGanda',
        options: pgOptions.filter(o => o.trim() !== ''),
        correctAnswer: String.fromCharCode(65 + Number(pgCorrect)), // A, B, C, D
        score: qScore,
        fontPreset: qFontPreset,
        ...mediaObj
      };
    } else if (currentQType === 'PilihanGandaKompleks') {
      const activeOptions = pgkOptions.filter(o => o.trim() !== '');
      const activeCorrects = activeOptions.filter((_, idx) => pgkCorrects[idx]);
      questionNode = {
        id: questionId,
        questionText: qText,
        type: 'PilihanGandaKompleks',
        options: activeOptions,
        correctAnswers: activeCorrects,
        score: qScore,
        fontPreset: qFontPreset,
        ...mediaObj
      };
    } else if (currentQType === 'PilihanAsosiatif') {
      const correctCombination: number[] = [];
      asoCorrects.forEach((val, idx) => {
        if (val) correctCombination.push(idx + 1);
      });
      questionNode = {
        id: questionId,
        questionText: qText,
        type: 'PilihanAsosiatif',
        statements: asoStatements.filter(s => s.trim() !== ''),
        correctCombination: correctCombination,
        score: qScore,
        fontPreset: qFontPreset,
        ...mediaObj
      };
    } else if (currentQType === 'SebabAkibat') {
      // SebabAkibat
      questionNode = {
        id: questionId,
        questionText: qText,
        type: 'SebabAkibat',
        statement: saStatement,
        reason: saReason,
        correctStatementTrue: saStatementTrue,
        correctReasonTrue: saReasonTrue,
        correctCausality: saCausality,
        score: qScore,
        fontPreset: qFontPreset,
        ...mediaObj
      };
    } else if (currentQType === 'Uraian') {
      questionNode = {
        id: questionId,
        questionText: qText,
        type: 'Uraian',
        correctAnswer: uraianAnswer,
        score: qScore,
        fontPreset: qFontPreset,
        ...mediaObj
      };
    }

    if (editingQuestionIndex !== null) {
      setExamQuestions(prev => {
        const newQuestions = [...prev];
        questionNode.id = newQuestions[editingQuestionIndex].id; // Keep original ID
        newQuestions[editingQuestionIndex] = questionNode;
        return newQuestions;
      });
      setEditingQuestionIndex(null);
      toast('Soal berhasil diperbarui!');
    } else {
      setExamQuestions(prev => [...prev, questionNode]);
      toast('Soal berhasil ditambahkan!');
    }
    
    // Clear question fields
    setQText('');
    setPgOptions(['', '', '', '']);
    setPgkOptions(['', '', '', '']);
    setPgkCorrects([false, false, false, false]);
    setAsoCorrects([false, false, false, false]);
    setQMediaType('None');
    setQMediaUrl('');
    setQScore(10);
    setQFontPreset('Sans');
  };

  const handleEditQuestion = (idx: number) => {
    const q = examQuestions[idx];
    setEditingQuestionIndex(idx);
    setCurrentQType(q.type);
    setQText(q.questionText);
    setQScore(q.score ?? 10);
    setQFontPreset(q.fontPreset ?? 'Sans');
    setQMediaType(q.mediaType || 'None');
    setQMediaUrl(q.mediaUrl || '');

    if (q.type === 'PilihanGanda' && q.options) {
      const paddedOptions = [...q.options];
      while (paddedOptions.length < 4) paddedOptions.push('');
      setPgOptions(paddedOptions.slice(0, 4));
      
      let correctIdx = 0;
      if (q.correctAnswer === 'B') correctIdx = 1;
      else if (q.correctAnswer === 'C') correctIdx = 2;
      else if (q.correctAnswer === 'D') correctIdx = 3;
      setPgCorrect(correctIdx.toString());
    } else if (q.type === 'PilihanGandaKompleks' && q.options) {
      const paddedOptions = [...q.options];
      while (paddedOptions.length < 4) paddedOptions.push('');
      setPgkOptions(paddedOptions.slice(0, 4));
      
      const corrects = paddedOptions.map(opt => Array.isArray(q.correctAnswers) ? q.correctAnswers.includes(opt) : false);
      setPgkCorrects(corrects);
    } else if (q.type === 'PilihanAsosiatif' && q.statements) {
      const paddedStatements = [...q.statements];
      while (paddedStatements.length < 4) paddedStatements.push('');
      setAsoStatements(paddedStatements.slice(0, 4));
      
      const corrects = paddedStatements.map(opt => Array.isArray(q.correctCombination) ? q.correctCombination.includes(opt) : false);
      setAsoCorrects(corrects);
    } else if (q.type === 'SebabAkibat') {
      setSaStatement(q.statement || '');
      setSaReason(q.reason || '');
      setSaStatementTrue(q.correctStatementTrue || false);
      setSaReasonTrue(q.correctReasonTrue || false);
      setSaCausality(q.correctCausality || false);
    } else if (q.type === 'Uraian') {
      setUraianAnswer(typeof q.correctAnswer === 'string' ? q.correctAnswer : '');
    }
  };

  const handleRemoveQuestion = (idx: number) => {
    setExamQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const processRowsMatrix = (rows: string[][]) => {
    if (rows.length === 0) {
      toast('Tidak ada baris data yang ditemukan!');
      return;
    }

    const parsedQuestions: ExamQuestion[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // Determine if first row is header
    let startIdx = 0;
    const firstRowStr = (rows[0] || []).join(' ').toLowerCase();
    const isHeader = firstRowStr.includes('tipe') || 
                     firstRowStr.includes('soal') || 
                     firstRowStr.includes('pertanyaan') || 
                     firstRowStr.includes('opsi') ||
                     firstRowStr.includes('kunci') ||
                     firstRowStr.includes('skor');

    if (isHeader) {
      startIdx = 1;
    }

    for (let i = startIdx; i < rows.length; i++) {
      let cols = rows[i].map(c => (c || '').replace(/^["']|["']$/g, '').trim());

      if (cols.length < 2 || !cols[1]) {
        if (cols.join('').trim() !== '') {
          errors.push(`Baris ${i + 1}: Kolom tidak lengkap atau Pertanyaan kosong.`);
        }
        continue;
      }

      const rawType = cols[0] || 'PilihanGanda';
      const rawQuestionText = cols[1];
      const col2 = cols[2] || '';
      const col3 = cols[3] || '';
      const col4 = cols[4] || '';
      const col5 = cols[5] || '';
      const rawKunci = cols[6] || '';
      const rawScore = cols[7] ? parseFloat(cols[7]) : 10;
      const rawMediaType = cols[8] || 'None';
      const rawMediaUrl = cols[9] || '';
      const rawFontPreset = cols[10] || 'Sans';

      // Determine clean question type
      let type: QuestionType = 'PilihanGanda';
      const typeLower = rawType.toLowerCase();
      if (typeLower.includes('kompleks') || typeLower === 'pilihangandakompleks') {
        type = 'PilihanGandaKompleks';
      } else if (typeLower.includes('asosiatif') || typeLower === 'pilihanasosiatif') {
        type = 'PilihanAsosiatif';
      } else if (typeLower.includes('sebab') || typeLower === 'sebabaquibat' || typeLower === 'sebabakibat') {
        type = 'SebabAkibat';
      }

      const score = isNaN(rawScore) ? 10 : rawScore;
      const fontPreset = (['Sans', 'Serif', 'Grotesk', 'Mono'].includes(rawFontPreset) 
        ? rawFontPreset 
        : 'Sans') as any;
      const mediaType = (['None', 'Image', 'Video', 'Audio'].includes(rawMediaType)
        ? rawMediaType
        : 'None') as any;

      const mediaObj = mediaType !== 'None' && rawMediaUrl ? {
        mediaType,
        mediaUrl: rawMediaUrl
      } : {};

      const questionId = `q_import_${Math.random().toString(36).substring(7)}_${i}`;

      const baseQuestion = {
        id: questionId,
        questionText: rawQuestionText,
        score,
        fontPreset,
        ...mediaObj
      };

      if (type === 'PilihanGanda') {
        const options = [col2, col3, col4, col5].filter(o => o !== '');
        if (options.length < 2) {
          errors.push(`Baris ${i + 1} (${type}): Pilihan ganda harus memiliki minimal 2 opsi.`);
          continue;
        }

        let correctAnswer = 'A';
        const cleanKunci = rawKunci.toUpperCase().trim();
        if (['A', 'B', 'C', 'D', 'E'].includes(cleanKunci)) {
          correctAnswer = cleanKunci;
        } else {
          // Fallback if index like 1, 2, 3
          const num = parseInt(cleanKunci);
          if (!isNaN(num) && num >= 1 && num <= 5) {
            correctAnswer = String.fromCharCode(64 + num);
          }
        }

        parsedQuestions.push({
          ...baseQuestion,
          type: 'PilihanGanda',
          options,
          correctAnswer
        } as ExamQuestion);
        successCount++;
      } else if (type === 'PilihanGandaKompleks') {
        const options = [col2, col3, col4, col5].filter(o => o !== '');
        if (options.length < 2) {
          errors.push(`Baris ${i + 1} (${type}): Pilihan Ganda Kompleks harus memiliki minimal 2 opsi.`);
          continue;
        }

        // Kunci should be like A,C or A,B,D
        const cleanKunci = rawKunci.toUpperCase();
        const correctAnswers: string[] = [];
        options.forEach((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          if (cleanKunci.includes(letter)) {
            correctAnswers.push(opt);
          }
        });

        parsedQuestions.push({
          ...baseQuestion,
          type: 'PilihanGandaKompleks',
          options,
          correctAnswers
        } as ExamQuestion);
        successCount++;
      } else if (type === 'PilihanAsosiatif') {
        const statements = [col2, col3, col4, col5].filter(s => s !== '');
        if (statements.length === 0) {
          errors.push(`Baris ${i + 1} (${type}): Pernyataan asosiatif tidak boleh kosong.`);
          continue;
        }

        // correctCombination: number[] (like [1, 2, 3] or [1, 3] parsed from rawKunci)
        const combination: number[] = [];
        const cleanKunci = rawKunci.replace(/\s/g, ''); // remove spaces
        const parts = cleanKunci.split(/[,;|]/);
        parts.forEach(p => {
          const num = parseInt(p);
          if (!isNaN(num) && num >= 1 && num <= 4) {
            combination.push(num);
          }
        });

        // Default to [1, 3] if invalid combination
        const correctCombination = combination.length > 0 ? combination : [1, 3];

        parsedQuestions.push({
          ...baseQuestion,
          type: 'PilihanAsosiatif',
          statements,
          correctCombination
        } as ExamQuestion);
        successCount++;
      } else if (type === 'SebabAkibat') {
        // col2: Sebab statement, col3: Alasan statement
        if (!col2 || !col3) {
          errors.push(`Baris ${i + 1} (${type}): Sebab-Akibat memerlukan pernyataan Sebab (Opsi A) & Alasan (Opsi B).`);
          continue;
        }

        // rawKunci like BENAR,BENAR,YA or TRUE,TRUE,YES or B,B,Y or 1,1,1
        // format: [PernyataanSebabTrue, PernyataanAlasanTrue, KausalitasTrue]
        const cleanKunci = rawKunci.toUpperCase().replace(/\s/g, '');
        const parts = cleanKunci.split(/[,;|]/);

        const correctStatementTrue = parts[0] === 'BENAR' || parts[0] === 'TRUE' || parts[0] === 'YA' || parts[0] === 'YES' || parts[0] === 'B' || parts[0] === 'Y' || parts[0] === '1';
        const correctReasonTrue = parts[1] === 'BENAR' || parts[1] === 'TRUE' || parts[1] === 'YA' || parts[1] === 'YES' || parts[1] === 'B' || parts[1] === 'Y' || parts[1] === '1';
        const correctCausality = parts[2] === 'BENAR' || parts[2] === 'TRUE' || parts[2] === 'YA' || parts[2] === 'YES' || parts[2] === 'B' || parts[2] === 'Y' || parts[2] === '1';

        parsedQuestions.push({
          ...baseQuestion,
          type: 'SebabAkibat',
          statement: col2,
          reason: col3,
          correctStatementTrue,
          correctReasonTrue,
          correctCausality
        } as ExamQuestion);
        successCount++;
      }
    }

    if (parsedQuestions.length > 0) {
      setExamQuestions(prev => [...prev, ...parsedQuestions]);
      setImportSuccessCount(successCount);
      setImportText(''); // reset text on success
      toast(`Berhasil mengimpor ${successCount} butir soal dari spreadsheet!`);
    } else {
      toast('Gagal mengimpor soal. Periksa format berkas/tabel dan coba lagi.');
    }

    setImportErrors(errors);
  };

  const handleImportFromSpreadsheet = () => {
    if (!importText.trim()) {
      toast('Teks / data spreadsheet kosong!');
      return;
    }

    const lines = importText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) {
      toast('Tidak ada baris data yang ditemukan!');
      return;
    }

    const stringRows = lines.map(line => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(';')) return line.split(';');
      return line.split(',');
    });

    processRowsMatrix(stringRows);
  };

  const handleFileUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        const stringRows = jsonRows.map(row => row.map(cell => cell !== undefined && cell !== null ? String(cell) : ''));
        
        processRowsMatrix(stringRows);
      } catch (err) {
        toast('Gagal membaca berkas Excel. Pastikan berkas berformat .xls, .xlsx, atau .csv yang valid.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const handleDownloadTemplateExcel = () => {
    // Sheet 1: Contoh Soal
    const headers = [
      'Tipe Soal', 'Pertanyaan', 'Opsi A / Sebab', 'Opsi B / Alasan', 'Opsi C', 'Opsi D', 
      'Kunci Jawaban', 'Skor', 'Tipe Media', 'Link Media', 'Font Preset'
    ];
    
    const rows = [
      [
        'PilihanGanda', 
        'Siapakah presiden pertama Republik Indonesia yang memproklamasikan kemerdekaan?', 
        'Ir. Soekarno', 'Drs. Moh. Hatta', 'B.J. Habibie', 'Jenderal Soedirman', 
        'A', '10', 'None', '', 'Sans'
      ],
      [
        'PilihanGandaKompleks', 
        'Manakah di bawah ini yang merupakan organ penyusun sistem pencernaan manusia? (Pilih lebih dari 1)', 
        'Lambung', 'Paru-paru', 'Usus Halus', 'Jantung', 
        'A,C', '10', 'None', '', 'Sans'
      ],
      [
        'PilihanAsosiatif', 
        'Berikut adalah pernyataan mengenai ciri-ciri sel makhluk hidup:', 
        '(1) Memiliki dinding sel yang kaku', '(2) Memiliki kloroplas untuk fotosintesis', '(3) Memiliki lisosom aktif', '(4) Memiliki vakuola sentral yang besar', 
        '1,2,4', '15', 'None', '', 'Mono'
      ],
      [
        'SebabAkibat', 
        'Perhatikan pernyataan dan alasan mengenai pemanasan global di bawah ini:', 
        'Meningkatnya kadar gas karbon dioksida (CO2) di atmosfer menyebabkan efek rumah kaca.', 
        'Gas karbon dioksida memiliki sifat menyerap dan memantulkan kembali radiasi panas matahari ke bumi.', 
        'Kosongkan', 'Kosongkan', 
        'BENAR,BENAR,YA', '10', 'None', '', 'Serif'
      ]
    ];

    // Sheet 2: Panduan & Aturan Pengisian Kolom
    const panduanHeaders = ['Kolom', 'Nama Kolom', 'Pilihan Nilai / Format yang Diizinkan', 'Keterangan & Cara Isi'];
    const panduanRows = [
      ['1', 'Tipe Soal', 'PilihanGanda | PilihanGandaKompleks | PilihanAsosiatif | SebabAkibat', 'Tentukan tipe model soal literasi/numerasi ANBK.'],
      ['2', 'Pertanyaan', 'Teks bebas (Mendukung **teks tebal** & *miring*)', 'Tuliskan butir pertanyaan atau wacana soal.'],
      ['3', 'Opsi A / Sebab', 'Teks Opsi A (untuk PG/PGK/Asosiatif) atau Pernyataan SEBAB (untuk SebabAkibat)', 'Wajib diisi.'],
      ['4', 'Opsi B / Alasan', 'Teks Opsi B (untuk PG/PGK/Asosiatif) atau Pernyataan ALASAN (untuk SebabAkibat)', 'Wajib diisi.'],
      ['5', 'Opsi C', 'Teks Opsi C', 'Isi jika ada opsi ke-3 (Kosongkan jika Sebab-Akibat).'],
      ['6', 'Opsi D', 'Teks Opsi D', 'Isi jika ada opsi ke-4 (Kosongkan jika Sebab-Akibat).'],
      ['7', 'Kunci Jawaban', 'Lihat aturan khusus per tipe soal di bawah:', 'PG: huruf A/B/C/D\nPGK: huruf dipisah koma (cth: A,C atau A,B,D)\nAsosiatif: angka urutan (cth: 1,2,3)\nSebabAkibat: 3 status BENAR/SALAH & YA/TIDAK (cth: BENAR,BENAR,YA)'],
      ['8', 'Skor', 'Angka (contoh: 10, 15, 20)', 'Bobot nilai soal tersebut.'],
      ['9', 'Tipe Media', 'None | Image | Video | Audio', 'Kosongkan atau isi None jika tanpa media.'],
      ['10', 'Link Media', 'URL https://... (gambar/video/audio)', 'Link berkas media jika kolom ke-9 bukan None.'],
      ['11', 'Font Preset', 'Sans | Serif | Grotesk | Mono', 'Gaya huruf tampilan soal. Standar: Sans.']
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const ws2 = XLSX.utils.aoa_to_sheet([panduanHeaders, ...panduanRows]);

    // Set column widths for better readability
    ws1['!cols'] = [{wch: 22}, {wch: 60}, {wch: 30}, {wch: 30}, {wch: 25}, {wch: 25}, {wch: 15}, {wch: 8}, {wch: 12}, {wch: 25}, {wch: 12}];
    ws2['!cols'] = [{wch: 8}, {wch: 18}, {wch: 55}, {wch: 60}];

    XLSX.utils.book_append_sheet(wb, ws1, 'Template Soal ANBK');
    XLSX.utils.book_append_sheet(wb, ws2, 'Panduan & Aturan Kolom');

    XLSX.writeFile(wb, 'Template_Soal_ANBK_Literasi_Numerasi.xlsx');
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examClass || !examSubject || !examToken) {
      toast('Mohon lengkapi info paket ujian!');
      return;
    }
    if (examQuestions.length === 0) {
      toast('Paket ujian harus memiliki minimal 1 soal!');
      return;
    }

    if (editingExamId && onUpdateExam) {
      const existingExam = teacherExams.find(ex => ex.id === editingExamId);
      if (existingExam) {
        onUpdateExam({
          ...existingExam,
          title: examTitle,
          classId: examClass,
          subjectId: examSubject,
          token: examToken.toUpperCase(),
          durationMinutes: Number(examDuration),
          questions: examQuestions
        });
        toast('Paket ujian berhasil diperbarui!');
      }
    } else {
      onSaveExam({
        title: examTitle,
        classId: examClass,
        subjectId: examSubject,
        token: examToken.toUpperCase(),
        durationMinutes: Number(examDuration),
        questions: examQuestions,
        teacherId: currentTeacher.id
      });
      toast('Paket ujian berhasil disimpan!');
    }

    // Reset Form
    setEditingExamId(null);
    setExamTitle('');
    setExamToken('');
    setExamQuestions([]);
    setShowAddExamModal(false);
  };

  const handleShareQuestionBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareQbId) return;

    const qb = questionBanks.find(q => q.id === shareQbId);
    if (!qb) return;

    if (shareQbTargetType === 'Teacher') {
      if (!shareQbSelectedTeacher) {
        toast('Pilih guru tujuan!');
        return;
      }
      if (onShareToTeacher) {
        onShareToTeacher({
          senderId: currentTeacher.id,
          senderName: currentTeacher.name,
          receiverId: shareQbSelectedTeacher,
          itemId: qb.id,
          itemType: 'QuestionBank',
          itemTitle: qb.title,
          status: 'Pending'
        });
        toast('Permintaan berbagi berhasil dikirim ke guru yang bersangkutan. Menunggu persetujuan.');
        setShowShareQbModal(false);
        setShareQbId(null);
      }
      return;
    }

    if (shareSelectedClasses.length === 0) {
      toast('Pilih minimal 1 kelas!');
      return;
    }
    
    const results: {classId: string, className: string, token: string}[] = [];

    shareSelectedClasses.forEach(classId => {
      const generatedToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      const cls = classes.find(c => c.id === classId);
      
      onSaveExam({
        title: qb.title,
        classId: classId,
        subjectId: qb.subjectId,
        token: generatedToken,
        durationMinutes: shareDuration,
        questions: [...qb.questions],
        teacherId: currentTeacher.id,
      });

      results.push({
        classId,
        className: cls?.name || classId,
        token: generatedToken
      });
    });
    
    setShareSuccessResult(results);
    setShareQbId(null);
    setShareSelectedClasses([]);
    setShareDuration(60);
  };

  const [refClassId, setRefClassId] = useState('');
  const [refStudentNis, setRefStudentNis] = useState('');
  const [refCategory, setRefCategory] = useState('');
  const [refDetails, setRefDetails] = useState('');
  const [refPriority, setRefPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refStudentNis || !refDetails || !onAddReferral) return;
    const student = students.find(s => s.nis === refStudentNis);
    if (!student) return;
    onAddReferral({
      teacherId: currentTeacher.id,
      studentNis: student.nis,
      studentName: student.name,
      className: classes.find(c => c.id === student.classId)?.name || 'N/A',
      issueCategory: refCategory,
      issueDetails: refDetails,
      status: 'Menunggu',
      priority: refPriority
    });
    setRefStudentNis('');
    setRefCategory('');
    setRefClassId('');
    setRefDetails('');
    setRefPriority('Sedang');
    toast('Rujukan berhasil dikirim ke Guru BK!', { icon: '🤝' });
  };

  const handleSaveQuestionBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbTitle || !qbSubject) {
      toast('Mohon lengkapi judul dan mapel Bank Soal!');
      return;
    }
    if (examQuestions.length === 0) {
      toast('Bank Soal harus memiliki minimal 1 soal!');
      return;
    }

    if (onSaveQuestionBank) {
      onSaveQuestionBank({
        ...(editingQbId ? { id: editingQbId } : {}),
        title: qbTitle,
        subjectId: qbSubject,
        teacherId: currentTeacher.id,
        questions: examQuestions,
      } as QuestionBank);
    }

    setQbTitle('');
    setQbSubject('');
    setExamQuestions([]);
    setEditingQbId(null);
    setShowAddQuestionBankModal(false);
  };


  // Helper resolvers
  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'N/A';
  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'N/A';

  const sortSubmissions = (a: ExamSubmission, b: ExamSubmission) => {
    const studentA = students.find(s => s.nis === a.studentNis);
    const studentB = students.find(s => s.nis === b.studentNis);
    const noAbsenA = studentA?.noAbsen;
    const noAbsenB = studentB?.noAbsen;
    
    if (noAbsenA != null && noAbsenB != null) return noAbsenA - noAbsenB;
    if (noAbsenA != null) return -1;
    if (noAbsenB != null) return 1;
    return (a.studentName || '').localeCompare(b.studentName || '');
  };

  // Filters for Teacher's own content (strictly by teacher ID or matching subject)
  const teacherSubjectObj = subjects.find(s => 
    s.name.toLowerCase() === (currentTeacher.subject || '').toLowerCase() || 
    s.id === currentTeacher.subject
  );
  const teacherSubjectId = teacherSubjectObj?.id;

  const isMyItem = (item: { teacherId?: string; subjectId?: string }) => {
    if (item.teacherId) return item.teacherId === currentTeacher.id;
    if (item.subjectId) {
      if (teacherSubjectId && item.subjectId === teacherSubjectId) return true;
      const subjName = subjects.find(s => s.id === item.subjectId)?.name || '';
      if (subjName && currentTeacher.subject && subjName.toLowerCase() === currentTeacher.subject.toLowerCase()) return true;
    }
    return false;
  };

  const teacherMaterials = materials.filter(m => m.teacherId === currentTeacher.id || isMyItem(m));
  const teacherExams = exams.filter(e => isMyItem(e));
  const teacherQuestionBanks = questionBanks.filter(qb => qb.teacherId === currentTeacher.id || isMyItem(qb));
  const teacherManualAssessments = (manualAssessments || []).filter(m => isMyItem(m));
  const teacherJournals = (journals || []).filter(j => j.teacherId === currentTeacher.id || isMyItem(j));
  const teacherSubmissions = submissions.filter(s => teacherExams.some(e => e.id === s.examId));
  const teacherExamTitles = teacherExams.map(e => e.title);
  const teacherCheatLogs = (cheatLogs || []).filter(log => {
    if (!log) return false;
    if (log.teacherId && log.teacherId === currentTeacher.id) return true;
    if (log.examId && teacherExams.some(e => e.id === log.examId)) return true;
    if (log.examTitle && teacherExamTitles.some(t => t && t.toLowerCase().trim() === log.examTitle.toLowerCase().trim())) return true;
    if (log.subjectId && teacherSubjectId && log.subjectId === teacherSubjectId) return true;
    if (currentTeacher.subject && log.examTitle && log.examTitle.toLowerCase().includes(currentTeacher.subject.toLowerCase())) return true;
    return false;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="teacher-panel-container">
      {/* Teacher Profile Quick Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentTeacher.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'}
            alt={currentTeacher.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full object-cover border-4 border-indigo-800/80"
          />
          <div>
            <h2 className="text-xl font-bold">{currentTeacher.name}</h2>
            <div className="mt-1.5 inline-block">
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                NIP. {currentTeacher.nip}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-2">Mata Pelajaran : <strong>{currentTeacher.subject}</strong></p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* GROUPED ADMINISTRASI GURU BUTTON */}
          <button
            onClick={() => {
              if (!['journal', 'teaching_modules', 'materials', 'daftar_nilai'].includes(activeTab)) {
                setActiveTab('journal');
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              ['journal', 'teaching_modules', 'materials', 'daftar_nilai'].includes(activeTab)
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-300'
                : 'bg-indigo-800/40 text-indigo-100 hover:bg-indigo-800/60'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-900" />
            📂 Administrasi Guru
          </button>

          {/* NEW TUGAS & PENGUMPULAN GDRIVE TAB */}
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'assignments'
                ? 'bg-emerald-400 text-slate-950 shadow-md font-extrabold ring-2 ring-emerald-300'
                : 'bg-indigo-800/40 text-indigo-100 hover:bg-indigo-800/60'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-emerald-900" />
            📤 Tugas & Pengumpulan (GDrive)
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'bg-indigo-800/40 text-indigo-100 hover:bg-indigo-800/60'
            }`}
          >
            ✍️ Ujian & Evaluasi CBT
          </button>
          <button
            onClick={() => setActiveTab('cheatlogs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cheatlogs'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'bg-indigo-800/40 text-indigo-100 hover:bg-indigo-800/60'
            }`}
          >
            🚨 Log Anti-Contek
            {teacherCheatLogs && teacherCheatLogs.length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">
                {teacherCheatLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bank_soal')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bank_soal'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'bg-indigo-800/40 text-indigo-100 hover:bg-indigo-800/60'
            }`}
          >
            🗄️ Bank Soal
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'bg-indigo-800/40 text-indigo-100 hover:bg-indigo-800/60'
            }`}
          >
            👤 Profil & Jadwal Mengajar
          </button>
          <button
            onClick={() => setActiveTab('konseling')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'konseling'
                ? 'bg-teal-50 text-teal-700 shadow-xs'
                : 'bg-teal-800/40 text-teal-100 hover:bg-teal-800/60'
            }`}
          >
            🤝 Konseling BK
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
            }`}
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" /> Notifikasi Siswa
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'bg-purple-400 text-slate-950 shadow-xs'
                : 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Kotak Masuk Berbagi
            {shareRequests.filter(r => r.receiverId === currentTeacher.id && r.status === 'Pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-black">
                {shareRequests.filter(r => r.receiverId === currentTeacher.id && r.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUB-NAVBAR UNTUK MENU ADMINISTRASI GURU */}
      {['journal', 'teaching_modules', 'materials', 'daftar_nilai'].includes(activeTab) && (
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 px-3 py-1 flex items-center gap-1.5 border-r border-slate-800">
              <Folder className="w-3.5 h-3.5 text-amber-400" /> Sub-Menu Administrasi Guru:
            </span>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'journal'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              📝 Jurnal Mengajar
            </button>
            <button
              onClick={() => setActiveTab('teaching_modules')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'teaching_modules'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              📑 Perangkat Pembelajaran
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              📚 Materi Pelajaran
            </button>
            <button
              onClick={() => setActiveTab('daftar_nilai')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'daftar_nilai'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              📊 Daftar Nilai
            </button>
          </div>
        </div>
      )}

      {/* 1. JURNAL MENGAJAR FORM & REKAPITULASI (THE CORE FEATURE) */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Jurnal Mengajar Digital & Rekapitulasi Jam Pembelajaran
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Catat jam pembelajaran, topik, dan presensi kelas, atau lihat rekapitulasi harian, mingguan, dan bulanan.
              </p>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setJournalSubTab('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === 'form'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✍️ Input Jurnal Baru
              </button>
              <button
                type="button"
                onClick={() => setJournalSubTab('recap_daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === 'recap_daily'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Rekap Harian
              </button>
              <button
                type="button"
                onClick={() => setJournalSubTab('recap_weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === 'recap_weekly'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📆 Rekap Mingguan
              </button>
              <button
                type="button"
                onClick={() => setJournalSubTab('recap_monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === 'recap_monthly'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Rekap Bulanan
              </button>
              <button
                type="button"
                onClick={() => setJournalSubTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                }`}
              >
                ⚙️ Pengaturan Kop & Kepala Sekolah
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: FORM INPUT JURNAL */}
          {journalSubTab === 'form' && (
            <div className="space-y-6">
              {journalSuccessMessage && (
                <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2 animate-pulse">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{journalSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveJournal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">Tanggal KBM</label>
                    <input
                      type="date"
                      required
                      value={journalDate}
                      onChange={(e) => setJournalDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">Kelas Pembelajaran</label>
                    <select
                      required
                      value={journalClass}
                      onChange={(e) => setJournalClass(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Pilih Kelas</option>
                      {sortedClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">Mata Pelajaran</label>
                    <select
                      required
                      value={journalSubject}
                      onChange={(e) => setJournalSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Pilih Mapel</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* FORM JAM PEMBELAJARAN KE BERAPA */}
                <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Jadwal Jam Pembelajaran Ke- Berapa? (Input Sesuai Sesi KBM Guru) *
                    </label>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      Durasi: {Math.max(0, (journalEndPeriod || 0) - (journalStartPeriod || 0) + 1)} Jam Pelajaran (JP)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">Mulai Pada Jam Ke-</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-900 bg-white border border-slate-200 px-2.5 py-2 rounded-lg shrink-0">Jam Ke -</span>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          required
                          value={journalStartPeriod}
                          onChange={(e) => setJournalStartPeriod(Number(e.target.value))}
                          placeholder="2"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-extrabold text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">Sampai Dengan Jam Ke-</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-900 bg-white border border-slate-200 px-2.5 py-2 rounded-lg shrink-0">Jam Ke -</span>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          required
                          value={journalEndPeriod}
                          onChange={(e) => setJournalEndPeriod(Number(e.target.value))}
                          placeholder="4"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-extrabold text-indigo-950 bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-indigo-800 font-medium">
                    💡 Contoh pengisian: Jika Anda mengajar hari ini pada jam pembelajaran ke 2 hingga jam ke 4, masukkan angka <strong>2</strong> pada kolom Mulai dan angka <strong>4</strong> pada kolom Sampai.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700">Topik / Sub-Bab Pembelajaran *</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Sistem Aljabar Kuadrat Dua Variabel, atau Teks Eksplanasi Fenomena Alam"
                    value={journalTopic}
                    onChange={(e) => setJournalTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700">Tujuan Pembelajaran (TP) *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Masukkan capaian atau tujuan pembelajaran yang ingin dicapai siswa pada sesi ini..."
                    value={journalObjectives}
                    onChange={(e) => setJournalObjectives(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-700">Catatan Kelas / Kendala Mengajar (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Tulis catatan penting seperti siswa yang butuh bimbingan khusus, media ajar yang digunakan, atau hambatan selama KBM..."
                    value={journalNotes}
                    onChange={(e) => setJournalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Attendance checklist section */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-indigo-600" />
                    Presensi & Kehadiran Siswa
                  </h4>
                  
                  {!journalClass ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                      <p className="text-slate-400 text-xs">Pilih kelas di atas terlebih dahulu untuk memuat daftar absensi siswa.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                      <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-500 text-center w-20">No Absen</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">Nama Siswa</th>
                            <th className="px-4 py-3 font-semibold text-slate-500 text-center w-24">Hadir</th>
                            <th className="px-4 py-3 font-semibold text-slate-500 text-center w-24">Sakit</th>
                            <th className="px-4 py-3 font-semibold text-slate-500 text-center w-24">Izin</th>
                            <th className="px-4 py-3 font-semibold text-slate-500 text-center w-24">Alpa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {classStudents.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-3 font-bold text-slate-900 text-center">{s.noAbsen || '-'}</td>
                              <td className="px-6 py-3 font-bold text-slate-900">{s.name} <span className="text-[10px] text-slate-400 font-mono">({s.nis})</span></td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`att_${s.id}`}
                                  checked={attendance[s.id] === 'Hadir'}
                                  onChange={() => handleAttendanceChange(s.id, 'Hadir')}
                                  className="text-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`att_${s.id}`}
                                  checked={attendance[s.id] === 'Sakit'}
                                  onChange={() => handleAttendanceChange(s.id, 'Sakit')}
                                  className="text-blue-500 w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`att_${s.id}`}
                                  checked={attendance[s.id] === 'Izin'}
                                  onChange={() => handleAttendanceChange(s.id, 'Izin')}
                                  className="text-amber-500 w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="radio"
                                  name={`att_${s.id}`}
                                  checked={attendance[s.id] === 'Alpa'}
                                  onChange={() => handleAttendanceChange(s.id, 'Alpa')}
                                  className="text-red-500 w-4 h-4 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {editingJournalId ? 'Update Jurnal & Presensi' : 'Simpan Jurnal & Presensi Kelas ke Sheets'}
                  </button>
                  {editingJournalId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingJournalId(null);
                        setJournalTopic('');
                        setJournalObjectives('');
                        setJournalNotes('');
                      }}
                      className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm shadow-sm"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* SUB-TAB 2: REKAP HARIAN */}
          {journalSubTab === 'recap_daily' && (() => {
            const dailyFiltered = teacherJournals.filter(j => j.date === recapFilterDate).sort(sortJournalsAscending);
            const totalJP = dailyFiltered.reduce((acc, j) => {
              const dur = (j.startPeriod && j.endPeriod) ? (j.endPeriod - j.startPeriod + 1) : 2;
              return acc + Math.max(0, dur);
            }, 0);

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Filter Tanggal Pembelajaran:</label>
                      <input
                        type="date"
                        value={recapFilterDate}
                        onChange={(e) => setRecapFilterDate(e.target.value)}
                        className="mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-950"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportJournalRecap(dailyFiltered, `Rekap_Jurnal_Harian_${recapFilterDate}`)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Excel (.XLSX)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintJournalRecap(dailyFiltered, 'Rekap Jurnal Pembelajaran Harian', `Periode Tanggal: ${formatDateIndo(recapFilterDate)}`)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4" /> Cetak Laporan
                    </button>
                    <button
                      type="button"
                      onClick={() => setJournalSubTab('settings')}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Ubah Nama Kepala Sekolah atau Kop Surat"
                    >
                      <Settings className="w-4 h-4" /> Edit Kop & Kepsek
                    </button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl">
                    <span className="text-xs font-bold text-indigo-700 block">Total Sesi Mengajar Hari Ini</span>
                    <span className="text-2xl font-extrabold text-indigo-950 mt-1 block">{dailyFiltered.length} <span className="text-xs font-normal text-slate-500">Sesi Kelas</span></span>
                  </div>
                  <div className="bg-teal-50/60 border border-teal-100 p-4 rounded-xl">
                    <span className="text-xs font-bold text-teal-700 block">Total Jam Pembelajaran (JP)</span>
                    <span className="text-2xl font-extrabold text-teal-950 mt-1 block">{totalJP} <span className="text-xs font-normal text-slate-500">Jam Pelajaran</span></span>
                  </div>
                  <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-xl">
                    <span className="text-xs font-bold text-purple-700 block">Status Laporan</span>
                    <span className="text-sm font-extrabold text-purple-950 mt-2 block flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Terverifikasi Digital
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Jam Ke-</th>
                        <th className="px-4 py-3">Kelas & Mapel</th>
                        <th className="px-4 py-3">Topik Pembelajaran</th>
                        <th className="px-4 py-3 text-center">Presensi & Siswa Tidak Hadir</th>
                        <th className="px-4 py-3">Catatan / Kendala</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {dailyFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada jurnal mengajar tercatat pada tanggal {recapFilterDate}.
                          </td>
                        </tr>
                      ) : (
                        dailyFiltered.map((j) => {
                          const cls = classes.find(c => c.id === j.classId)?.name || j.classId;
                          const subj = subjects.find(s => s.id === j.subjectId)?.name || j.subjectId;
                          const hadir = j.attendance.filter(a => a.status === 'Hadir').length;
                          const sakit = j.attendance.filter(a => a.status === 'Sakit').length;
                          const izin = j.attendance.filter(a => a.status === 'Izin').length;
                          const alpa = j.attendance.filter(a => a.status === 'Alpa').length;

                          return (
                            <tr key={j.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {j.startPeriod && j.endPeriod ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-extrabold text-[11px]">
                                    <Clock className="w-3 h-3 text-indigo-600" /> Jam ke {j.startPeriod} - {j.endPeriod}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Standar (2 JP)</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-800">
                                {cls} <span className="block text-[11px] font-normal text-indigo-600">{subj}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-slate-900 block">{j.topic}</span>
                                {j.learningObjectives && <span className="text-[11px] text-slate-500 block line-clamp-1">TP: {j.learningObjectives}</span>}
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                {renderAbsentStudentsCell(j)}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                                {j.notes || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEditJournalAction(j)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Edit Jurnal"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJournalAction(j.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Hapus Jurnal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* SUB-TAB 3: REKAP MINGGUAN (7 HARI TERAKHIR) */}
          {journalSubTab === 'recap_weekly' && (() => {
            const now = Date.now();
            const sevenDaysAgo = now - 7 * 86400000;
            const weeklyFiltered = teacherJournals.filter(j => {
              const dTime = Date.parse(j.date);
              return !isNaN(dTime) && dTime >= sevenDaysAgo && dTime <= now + 86400000;
            }).sort(sortJournalsAscending);

            const totalWeeklyJP = weeklyFiltered.reduce((acc, j) => {
              const dur = (j.startPeriod && j.endPeriod) ? (j.endPeriod - j.startPeriod + 1) : 2;
              return acc + Math.max(0, dur);
            }, 0);

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      📆 Rekap Jurnal Mingguan (7 Hari Terakhir)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Menampilkan seluruh aktivitas KBM dalam 7 hari terakhir beserta jam pembelajarannya.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportJournalRecap(weeklyFiltered, 'Rekap_Jurnal_Mingguan')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Excel Mingguan
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintJournalRecap(weeklyFiltered, 'Rekap Jurnal Pembelajaran Mingguan', 'Periode: 7 Hari Terakhir')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4" /> Cetak
                    </button>
                    <button
                      type="button"
                      onClick={() => setJournalSubTab('settings')}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Ubah Nama Kepala Sekolah atau Kop Surat"
                    >
                      <Settings className="w-4 h-4" /> Edit Kop & Kepsek
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-700">Total Sesi Mingguan</span>
                      <span className="text-2xl font-extrabold text-indigo-950 mt-1 block">{weeklyFiltered.length} <span className="text-xs font-normal text-slate-500">Pertemuan</span></span>
                    </div>
                    <BarChart3 className="w-8 h-8 text-indigo-400 opacity-80" />
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-700">Total Jam Pembelajaran (JP) Mingguan</span>
                      <span className="text-2xl font-extrabold text-emerald-950 mt-1 block">{totalWeeklyJP} <span className="text-xs font-normal text-slate-500">JP Terekam</span></span>
                    </div>
                    <Clock className="w-8 h-8 text-emerald-400 opacity-80" />
                  </div>
                </div>

                {/* Table Mingguan */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Hari & Tanggal</th>
                        <th className="px-4 py-3">Jam Ke-</th>
                        <th className="px-4 py-3">Kelas & Mapel</th>
                        <th className="px-4 py-3">Topik Pembelajaran</th>
                        <th className="px-4 py-3 text-center">Presensi & Siswa Tidak Hadir</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {weeklyFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            Belum ada aktivitas jurnal mengajar dalam 7 hari terakhir.
                          </td>
                        </tr>
                      ) : (
                        weeklyFiltered.map((j) => {
                          const cls = classes.find(c => c.id === j.classId)?.name || j.classId;
                          const subj = subjects.find(s => s.id === j.subjectId)?.name || j.subjectId;
                          const hadir = j.attendance.filter(a => a.status === 'Hadir').length;
                          const sakit = j.attendance.filter(a => a.status === 'Sakit').length;
                          const izin = j.attendance.filter(a => a.status === 'Izin').length;
                          const alpa = j.attendance.filter(a => a.status === 'Alpa').length;
                          
                          const dObj = new Date(j.date);
                          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                          const dayStr = !isNaN(dObj.getTime()) ? dayNames[dObj.getDay()] : '';

                          return (
                            <tr key={j.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                                {dayStr}, {formatDateToDDMMYYYY(j.date)}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {j.startPeriod && j.endPeriod ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[11px]">
                                    Jam {j.startPeriod} - {j.endPeriod}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">2 JP</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-800">
                                {cls} <span className="block text-[11px] font-normal text-indigo-600">{subj}</span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-800">
                                {j.topic}
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                {renderAbsentStudentsCell(j)}
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEditJournalAction(j)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Edit Jurnal"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJournalAction(j.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Hapus Jurnal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* SUB-TAB 4: REKAP BULANAN */}
          {journalSubTab === 'recap_monthly' && (() => {
            const monthlyFiltered = teacherJournals.filter(j => j.date.startsWith(recapFilterMonth)).sort(sortJournalsAscending);
            const totalMonthlyJP = monthlyFiltered.reduce((acc, j) => {
              const dur = (j.startPeriod && j.endPeriod) ? (j.endPeriod - j.startPeriod + 1) : 2;
              return acc + Math.max(0, dur);
            }, 0);

            return (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Pilih Bulan & Tahun Pembelajaran:</label>
                      <input
                        type="month"
                        value={recapFilterMonth}
                        onChange={(e) => setRecapFilterMonth(e.target.value)}
                        className="mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-950"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportJournalRecap(monthlyFiltered, `Rekap_Jurnal_Bulanan_${recapFilterMonth}`)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Unduh Excel Bulanan
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintJournalRecap(monthlyFiltered, 'Rekap Jurnal Pembelajaran Bulanan', `Periode Bulan: ${formatMonthIndo(recapFilterMonth)}`)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4" /> Cetak Bulanan
                    </button>
                    <button
                      type="button"
                      onClick={() => setJournalSubTab('settings')}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Ubah Nama Kepala Sekolah atau Kop Surat"
                    >
                      <Settings className="w-4 h-4" /> Edit Kop & Kepsek
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-indigo-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Total Pertemuan Bulan Ini</span>
                      <span className="text-3xl font-extrabold mt-1 block">{monthlyFiltered.length} <span className="text-sm font-normal text-indigo-200">Sesi KBM</span></span>
                    </div>
                    <BookOpen className="w-10 h-10 text-indigo-400 opacity-60" />
                  </div>
                  <div className="bg-emerald-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Akumulasi Jam Pelajaran (JP)</span>
                      <span className="text-3xl font-extrabold mt-1 block">{totalMonthlyJP} <span className="text-sm font-normal text-emerald-200">Jam Pelajaran</span></span>
                    </div>
                    <Clock className="w-10 h-10 text-emerald-300 opacity-60" />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Jam Ke-</th>
                        <th className="px-4 py-3">Kelas & Mapel</th>
                        <th className="px-4 py-3">Topik & Capaian Pembelajaran</th>
                        <th className="px-4 py-3 text-center">Presensi & Siswa Tidak Hadir</th>
                        <th className="px-4 py-3">Catatan</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {monthlyFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            Belum ada jurnal tercatat untuk periode bulan {formatMonthIndo(recapFilterMonth)}.
                          </td>
                        </tr>
                      ) : (
                        monthlyFiltered.map((j) => {
                          const cls = classes.find(c => c.id === j.classId)?.name || j.classId;
                          const subj = subjects.find(s => s.id === j.subjectId)?.name || j.subjectId;
                          const hadir = j.attendance.filter(a => a.status === 'Hadir').length;
                          const sakit = j.attendance.filter(a => a.status === 'Sakit').length;
                          const izin = j.attendance.filter(a => a.status === 'Izin').length;
                          const alpa = j.attendance.filter(a => a.status === 'Alpa').length;
                          return (
                            <tr key={j.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                                {formatDateToDDMMYYYY(j.date)}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {j.startPeriod && j.endPeriod ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-extrabold text-[11px] border border-indigo-200">
                                    Jam {j.startPeriod} - {j.endPeriod}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">2 JP</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-800">
                                {cls} <span className="block text-[11px] font-normal text-indigo-600">{subj}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-bold text-slate-900 block">{j.topic}</span>
                                {j.learningObjectives && <span className="text-[11px] text-slate-500 block line-clamp-1">{j.learningObjectives}</span>}
                              </td>
                              <td className="px-4 py-3.5 align-top">
                                {renderAbsentStudentsCell(j)}
                              </td>
                              <td className="px-4 py-3.5 text-[11px] text-slate-600">
                                {j.notes || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEditJournalAction(j)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Edit Jurnal"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJournalAction(j.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Hapus Jurnal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {journalSubTab === 'settings' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">Form Pengaturan Kop Surat & Data Kepala Sekolah</h4>
                    <p className="text-xs text-slate-500">Sesuaikan nama sekolah, alamat resmi, serta Nama & NIP Kepala Sekolah untuk cetakan laporan resmi.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const defaults: SchoolIdentityConfig = {
                      header1: 'PEMERINTAH KABUPATEN PASURUAN',
                      header2: 'DINAS PENDIDIKAN',
                      schoolName: 'SMP NEGERI 1 BEJI',
                      address: 'Jl. Wicaksana No. 22A Gununggangsir Beji, Kab Pasuruan',
                      cityLocation: 'Beji, Kab. Pasuruan',
                      principalName: 'Dr. H. Ahmad Wijaya, M.Pd.',
                      principalNip: '19720512 199802 1 004'
                    };
                    setEditIdentityForm(defaults);
                    setSchoolIdentity(defaults);
                    localStorage.setItem('smpn1beji_school_identity', JSON.stringify(defaults));
                    toast('Identitas berhasil dikembalikan ke standar awal SMPN 1 BEJI!');
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-center"
                >
                  🔄 Kembalikan ke Standar
                </button>
              </div>

              <form onSubmit={handleSaveSchoolIdentity} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kolom Kiri: Form Input */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2 text-indigo-900">
                      <Building className="w-4 h-4 text-indigo-600" />
                      1. Identitas & Kop Surat Sekolah
                    </h5>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Instansi Tingkat 1 (Baris Atas)</label>
                      <input
                        type="text"
                        value={editIdentityForm.header1}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, header1: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="PEMERINTAH KABUPATEN PASURUAN"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Instansi Tingkat 2 (Baris Kedua)</label>
                      <input
                        type="text"
                        value={editIdentityForm.header2}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, header2: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="DINAS PENDIDIKAN"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Satuan Pendidikan / Sekolah</label>
                      <input
                        type="text"
                        value={editIdentityForm.schoolName}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, schoolName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="SMP NEGERI 1 BEJI"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Resmi Sekolah</label>
                      <input
                        type="text"
                        value={editIdentityForm.address}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Jl. Wicaksana No. 22A Gununggangsir Beji, Kab Pasuruan"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2 text-indigo-900">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      2. Penandatangan (Kepala Sekolah & Kota TTD)
                    </h5>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Tempat Tanda Tangan</label>
                      <input
                        type="text"
                        value={editIdentityForm.cityLocation}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, cityLocation: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Beji, Kab. Pasuruan"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah (Lengkap dengan Gelar)</label>
                      <input
                        type="text"
                        value={editIdentityForm.principalName}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, principalName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Dr. H. Ahmad Wijaya, M.Pd."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                      <input
                        type="text"
                        value={editIdentityForm.principalNip}
                        onChange={(e) => setEditIdentityForm({ ...editIdentityForm, principalNip: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="19720512 199802 1 004"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Simpan Pengaturan & Perbarui Cetakan
                  </button>
                </div>

                {/* Kolom Kanan: Live Preview Kertas Cetak */}
                <div className="bg-slate-200/80 p-5 rounded-2xl border border-slate-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        👁️ Pratinjau Kop & Kolom Tanda Tangan
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">Live Preview</span>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm text-slate-900">
                      {/* Kop Pratinjau */}
                      <div className="relative border-b-3 border-double border-slate-900 pb-3 mb-4 flex items-center justify-between">
                        <img 
                          src={SCHOOL_LOGO_BASE64} 
                          alt="Logo Sekolah" 
                          className="w-12 h-12 object-contain absolute left-0 top-1/2 -translate-y-1/2" 
                        />
                        <div className="text-center w-full px-12">
                          <h1 className="text-xs font-black uppercase text-slate-900 leading-tight">{editIdentityForm.header1 || '-'}</h1>
                          <h2 className="text-xs font-black uppercase text-slate-800 leading-tight mt-0.5">{editIdentityForm.header2 || '-'}</h2>
                          <h3 className="text-sm sm:text-base font-black text-indigo-950 uppercase tracking-tight mt-1">{editIdentityForm.schoolName || '-'}</h3>
                          <p className="text-[10px] text-slate-600 font-medium mt-1">{editIdentityForm.address || '-'}</p>
                        </div>
                      </div>

                      <div className="py-4 text-center border-y border-dashed border-slate-200 text-slate-400 text-[11px] italic">
                        [ Konten Tabel Rekapitulasi Jurnal Pembelajaran Akan Ditampilkan Di Sini ]
                      </div>

                      {/* TTD Pratinjau */}
                      <div className="mt-6 grid grid-cols-2 gap-4 text-[11px] font-medium text-slate-800">
                        <div className="text-center">
                          <p>Mengetahui,<br/>Kepala Sekolah</p>
                          <div className="h-12"></div>
                          <p className="font-extrabold underline text-slate-950">{editIdentityForm.principalName || '-'}</p>
                          <p className="text-[10px] text-slate-500">NIP. {editIdentityForm.principalNip || '-'}</p>
                        </div>
                        <div className="text-center">
                          <p>{editIdentityForm.cityLocation || '-'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mapel,</p>
                          <div className="h-12"></div>
                          <p className="font-extrabold underline text-slate-950">{currentTeacher.name}</p>
                          <p className="text-[10px] text-slate-500">NIP. {currentTeacher.nip || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-indigo-900/10 border border-indigo-200 rounded-xl text-indigo-950 text-xs">
                    💡 <b>Catatan:</b> Pengaturan ini langsung berlaku untuk semua fitur cetak (Rekap Harian, Mingguan, Bulanan) baik dalam bentuk pratinjau, cetak printer, maupun unduh PDF.
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. MATERIALS TAB */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Materi Pelajaran</h3>
              <p className="text-slate-500 text-xs mt-0.5">Berkas materi dan kelola status publikasinya.</p>
            </div>
            <button
              onClick={() => {
                setEditingMaterialId(null);
                setMateriTitle('');
                setMateriClasses([]);
                setMateriSubject('');
                setMateriType('Article');
                setMateriUrl('');
                setMateriContent('');
                setShowAddMateriModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Buat Materi Baru
            </button>
          </div>

          {teacherMaterials.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-xs">Belum ada materi pelajaran yang Anda unggah.</p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-500">Judul Materi</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Mata Pelajaran</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Kelas</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Format</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Tautan Berkas</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Publikasi</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {teacherMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3 font-bold text-slate-900">{mat.title}</td>
                      <td className="px-6 py-3 text-slate-500">{getSubjectName(mat.subjectId)}</td>
                      <td className="px-6 py-3">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {Array.isArray(mat.classId) 
                            ? `Kelas ${mat.classId.map(cId => getClassName(cId).replace(/^Kelas\s+/i, '')).join(', ')}`
                            : `Kelas ${getClassName(mat.classId).replace(/^Kelas\s+/i, '')}`}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          mat.fileType === 'PDF' ? 'bg-red-50 text-red-700 border border-red-100' :
                          mat.fileType === 'Video' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          mat.fileType === 'Word' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          mat.fileType === 'Excel' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          mat.fileType === 'PPT' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          'bg-slate-50 text-slate-700 border border-slate-100'
                        }`}>
                          {mat.fileType}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline font-mono truncate max-w-[200px] block"
                        >
                          Google Drive Link
                        </a>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => onToggleMaterial(mat.id, mat.status)}
                          className="flex items-center gap-1.5 font-bold cursor-pointer hover:opacity-85 transition"
                        >
                          {mat.status === 'Aktif' ? (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                              <ToggleRight className="w-4 h-4 text-emerald-600" /> Aktif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                              <ToggleLeft className="w-4 h-4 text-slate-400" /> Draft
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLiveMaterial(mat);
                              setLiveSlideNum(1);
                              const session: LivePresentationSession = {
                                id: 'active_session',
                                materialId: mat.id,
                                materialTitle: mat.title,
                                teacherId: currentTeacher.id,
                                teacherName: currentTeacher.name,
                                currentSlide: 1,
                                totalSlides: 10,
                                active: true,
                                startedAt: new Date().toISOString()
                              };
                              if (onUpdateLivePresentation) {
                                onUpdateLivePresentation(session);
                              }
                              toast.success(`Mode Presentasi Lab Komputer Diaktifkan untuk ${mat.title}`);
                            }}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                            title="Mulai Presentasi Real-Time di Komputer Siswa Lab"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Mode Lab</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingMaterialId(mat.id);
                              setMateriTitle(mat.title);
                              setMateriClasses(Array.isArray(mat.classId) ? mat.classId : [mat.classId]);
                              setMateriSubject(mat.subjectId);
                              setMateriType(mat.fileType);
                              setMateriUrl(mat.fileUrl);
                              setMateriContent(mat.content || '');
                              setShowAddMateriModal(true);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-indigo-50"
                            title="Edit Materi"
                          >
                            <FileCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setShareMateriId(mat.id);
                              setShareMateriSelectedClasses([]);
                              setShareMateriSuccess(false);
                              setShowShareMateriModal(true);
                            }}
                            className="text-slate-400 hover:text-emerald-600 transition p-1.5 rounded-lg hover:bg-emerald-50"
                            title="Bagikan Materi ke Kelas Lain"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete({ id: mat.id, type: 'Materi', name: mat.title });
                            }}
                            className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                            title="Hapus Materi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      
      {/* 2B. TEACHING MODULES TAB */}
      {activeTab === 'teaching_modules' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Perangkat Pembelajaran</h3>
              <p className="text-slate-500 text-xs mt-0.5">Unggah dan kelola perangkat pembelajaran untuk dibagikan.</p>
            </div>
            <button
              onClick={() => {
                resetModuleForm();
                setShowModuleModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Unggah Perangkat Pembelajaran
            </button>
          </div>

          <div className="flex gap-2 items-center mb-4">
              {currentFolderId && (
                <button
                  onClick={() => {
                    const currentFolder = teachingModules.find(m => m.id === currentFolderId);
                    setCurrentFolderId(currentFolder?.parentId || null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Kembali
                </button>
              )}
              <button
                onClick={() => { setFolderName(''); setShowFolderModal(true); }}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3 h-3" /> Buat Folder
              </button>
              {clipboard && (
                <button
                  onClick={handlePaste}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3 h-3" /> Tempel (Paste)
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider bg-slate-50">
                  <th className="p-4 font-bold rounded-tl-xl">Nama / Judul</th>
                  <th className="p-4 font-bold">Kelas & Mapel</th>
                  <th className="p-4 font-bold">File</th>
                  <th className="p-4 font-bold">Tgl Diunggah</th>
                  <th className="p-4 font-bold text-right rounded-tr-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {teachingModules.filter(m => m.teacherId === currentTeacher.id && (m.parentId || null) === currentFolderId).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-400">
                      Belum ada folder atau perangkat pembelajaran di sini.
                    </td>
                  </tr>
                ) : (
                  teachingModules
                    .filter(m => m.teacherId === currentTeacher.id && (m.parentId || null) === currentFolderId)
                    .sort((a, b) => {
                      if (a.type === 'folder' && b.type !== 'folder') return -1;
                      if (a.type !== 'folder' && b.type === 'folder') return 1;
                      return (a.title || '').localeCompare(b.title || '');
                    })
                    .map(mod => (
                    <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                        {mod.type === 'folder' ? (
                          <button onClick={() => setCurrentFolderId(mod.id)} className="flex items-center gap-2 text-indigo-700 hover:underline cursor-pointer bg-transparent border-none p-0 text-left font-semibold">
                            <Folder className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                            {mod.title}
                          </button>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-slate-400" />
                            {mod.title}
                          </>
                        )}
                      </td>
                      <td className="p-4">
                        {mod.type === 'folder' ? '-' : (
                          <>
                            <div className="text-xs font-bold text-indigo-700 bg-indigo-50 inline-block px-2 py-1 rounded-md mb-1">{classes.find(c => c.id === mod.classId)?.name || mod.classId}</div>
                            <div className="text-xs text-slate-500">{subjects.find(s => s.id === mod.subjectId)?.name || mod.subjectId}</div>
                          </>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        <button type="button" onClick={() => handleDownloadModule(mod)} className="text-indigo-600 hover:underline flex items-center gap-1.5 text-xs font-bold cursor-pointer bg-transparent border-none p-0 text-left">
                          <Download className="w-3.5 h-3.5" />
                          Unduh
                        </button>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(mod.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setShareModuleId(mod.id);
                              setShowShareModuleModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Bagikan"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowRenameModal({ id: mod.id, name: mod.title })}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Ganti Nama"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setClipboard({ id: mod.id, action: 'cut' });
                              toast('Disalin ke Papan Klip. Pindah ke folder lain lalu Paste.');
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Potong (Cut)"
                          >
                            <Scissors className="w-4 h-4" />
                          </button>
                          {mod.type !== 'folder' && (
                            <button
                              onClick={() => {
                                setModuleTitle(mod.title);
                                setModuleClassId(mod.classId);
                                setModuleSubjectId(mod.subjectId);
                                setEditingModuleId(mod.id);
                                setShowModuleModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Info"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteTeachingModule && (
                            <button
                              onClick={() => onDeleteTeachingModule(mod.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

{/* 3. EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">LMS Tugas/Soal Mapel</h3>
              <p className="text-slate-500 text-xs mt-0.5">LMS Interaktif</p>
            </div>
            <button
              onClick={() => {
                setIsQuestionBankMode(false);
                setShowAddExamModal(true);
                setExamQuestions([]);
                setTargetQuestionCount(10);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Buat Paket Ujian Baru
            </button>
          </div>

          {teacherExams.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-xs">Belum ada paket ujian terdaftar untuk kelas Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teacherExams.map((exam) => (
                <div key={exam.id} className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Kelas {getClassName(exam.classId)}
                        </span>
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {getSubjectName(exam.subjectId)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-950 text-base">{exam.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {onUpdateExam && (
                        <button 
                          onClick={() => {
                            const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
                            onUpdateExam({
                              ...exam,
                              token: newToken
                            });
                            toast(`Token berhasil direset menjadi: ${newToken}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition flex-shrink-0 flex items-center gap-1.5 text-xs font-bold"
                          title="Reset Token Ujian"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Reset
                        </button>
                      )}
                      {onUpdateExam && (
                        <>
                          <button
                            onClick={() => {
                              setEditingExamId(exam.id);
                              setExamTitle(exam.title);
                              setExamClass(exam.classId);
                              setExamSubject(exam.subjectId);
                              setExamToken(exam.token);
                              setExamDuration(exam.durationMinutes);
                              setExamQuestions(exam.questions);
                              setTargetQuestionCount(Math.max(10, exam.questions.length));
                              setIsQuestionBankMode(false);
                              setShowAddExamModal(true);
                            }}
                            className="text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition flex-shrink-0 flex items-center gap-1.5 text-xs font-bold"
                            title="Edit Ujian"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setEditingExamId(null);
                              setExamTitle(exam.title + ' (Salinan)');
                              setExamClass('');
                              setExamSubject(exam.subjectId);
                              setExamToken(Math.random().toString(36).substring(2, 8).toUpperCase());
                              setExamDuration(exam.durationMinutes);
                              setExamQuestions(exam.questions);
                              setTargetQuestionCount(Math.max(10, exam.questions.length));
                              setIsQuestionBankMode(false);
                              setShowAddExamModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition flex-shrink-0 flex items-center gap-1.5 text-xs font-bold"
                            title="Duplikat ke Kelas Lain"
                          >
                            <Copy className="w-3.5 h-3.5" /> Duplikat
                          </button>
                          {onSaveQuestionBank && (
                            <button
                              onClick={() => {
                                setQbTitle(exam.title + ' (Arsip Bank Soal)');
                                setQbSubject(exam.subjectId);
                                setExamQuestions(exam.questions);
                                setTargetQuestionCount(Math.max(10, exam.questions.length));
                                setEditingQbId(null);
                                setIsQuestionBankMode(true);
                                setShowAddQuestionBankModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition flex-shrink-0 flex items-center gap-1.5 text-xs font-bold"
                              title="Simpan ke Bank Soal"
                            >
                              <Database className="w-3.5 h-3.5" /> Arsipkan
                            </button>
                          )}
                        </>
                      )}
                      {onDeleteExam && (
                        <button
                          onClick={() => setItemToDelete({ id: exam.id, type: 'Ujian', name: exam.title })}
                          className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition flex-shrink-0 flex items-center gap-1.5 text-xs font-bold"
                          title="Hapus Ujian"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-y border-slate-200/50 py-3 text-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Token Kunci</span>
                      <span className="font-mono font-black text-slate-800 flex items-center justify-center gap-0.5 mt-0.5">
                        <Key className="w-3.5 h-3.5 text-amber-500" /> {exam.token}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Waktu Ujian</span>
                      <span className="font-bold text-slate-800 flex items-center justify-center gap-0.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> {exam.durationMinutes} mnt
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Jumlah Soal</span>
                      <span className="font-bold text-slate-800 flex items-center justify-center gap-0.5 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> {exam.questions.length} Butir
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">Rincian Komposisi Soal ANBK:</span>
                    <div className="flex gap-2 flex-wrap text-[9px] font-semibold">
                      <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">
                        Pilihan Ganda: {exam.questions.filter(q => q.type === 'PilihanGanda').length}
                      </span>
                      <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">
                        Pilihan Kompleks: {exam.questions.filter(q => q.type === 'PilihanGandaKompleks').length}
                      </span>
                      <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">
                        Asosiatif: {exam.questions.filter(q => q.type === 'PilihanAsosiatif').length}
                      </span>
                      <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">
                        Sebab-Akibat: {exam.questions.filter(q => q.type === 'SebabAkibat').length}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3.4. DAFTAR NILAI TAB */}
      {activeTab === 'daftar_nilai' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Daftar Nilai Siswa</h3>
              <p className="text-slate-500 text-xs mt-0.5">Lihat hasil pengerjaan siswa dari paket ujian dan tugas yang telah diberikan.</p>
            </div>
            {(selectedExamForGrades || selectedManualAssessment) && (
              <div className="flex gap-2">
                <button
                  onClick={() => selectedExamForGrades ? exportGradesExcel(selectedExamForGrades) : exportManualGradeExcel(selectedManualAssessment)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Excel
                </button>
                <button
                  onClick={() => selectedExamForGrades ? printGradesDocument(selectedExamForGrades) : printManualGradeDocument(selectedManualAssessment)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Cetak PDF
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!selectedClassForGrades ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">Pilih Kelas yang Anda Ajar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sortedClasses.map(c => {
                    const classExamsCount = teacherExams.filter(e => Array.isArray(e.classId) ? e.classId.includes(c.id) : e.classId === c.id).length;
                    const classManualCount = teacherManualAssessments.filter(m => m.classId === c.id).length;
                    const totalItems = classExamsCount + classManualCount;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClassForGrades(c.id); setSelectedExamForGrades(''); }}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition text-left flex flex-col justify-between h-full group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900">Kelas {c.name}</h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">{totalItems} Evaluasi ({classExamsCount} CBT, {classManualCount} Manual)</p>
                          </div>
                        </div>
                        <div className="w-full text-center text-xs font-bold text-indigo-600 bg-white border border-indigo-100 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          Lihat Daftar Nilai
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {showManualAssessmentForm ? (
                  <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800">{editingManualAssessment ? 'Edit Penilaian Manual' : 'Input Nilai Manual'}</h4>
                      <button onClick={() => setShowManualAssessmentForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                        <select
                          value={manualSubjectId}
                          onChange={(e) => setManualSubjectId(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Penilaian</label>
                        <select
                          value={manualType}
                          onChange={(e) => setManualType(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Praktikum">Praktikum</option>
                          <option value="Tugas Kelompok">Tugas Kelompok</option>
                          <option value="Presentasi">Presentasi</option>
                          <option value="Sikap / Perilaku">Sikap / Perilaku</option>
                          <option value="Proyek">Proyek</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Keterangan</label>
                        <input
                          type="text"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="Misal: Praktikum Difraksi Cahaya"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Penilaian Ranah Afektif / Psikomotorik (Opsional)</label>
                      <p className="text-xs text-slate-500 mb-3">Tambahkan kriteria penilaian khusus (misal: Tanggung Jawab, Kerjasama tim, Penggunaan Alat) dengan skala nilai A-D.</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {manualCriteria.map(criteria => (
                          <span key={criteria} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200">
                            {criteria}
                            <button 
                              type="button"
                              onClick={() => {
                                setManualCriteria(prev => prev.filter(c => c !== criteria));
                              }}
                              className="text-indigo-500 hover:text-indigo-900 focus:outline-none"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          value={newCriteriaInput}
                          onChange={(e) => setNewCriteriaInput(e.target.value)}
                          placeholder="Misal: Kerjasama Tim"
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newCriteriaInput.trim() && !manualCriteria.includes(newCriteriaInput.trim())) {
                                setManualCriteria([...manualCriteria, newCriteriaInput.trim()]);
                                setNewCriteriaInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCriteriaInput.trim() && !manualCriteria.includes(newCriteriaInput.trim())) {
                              setManualCriteria([...manualCriteria, newCriteriaInput.trim()]);
                              setNewCriteriaInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                            <th className="px-4 py-3 font-bold">NIS</th>
                            <th className="px-4 py-3 font-bold w-1/3">Nama Siswa</th>
                            <th className="px-4 py-3 font-bold text-center w-28">Nilai Angka (0-100)</th>
                            {manualCriteria.map(criteria => (
                              <th key={criteria} className="px-4 py-3 font-bold text-center w-24">{criteria} (A-D)</th>
                            ))}
                            <th className="px-4 py-3 font-bold text-center">Catatan (Opsional)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {manualGrades.map((g, idx) => (
                            <tr key={g.studentId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 text-center text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{g.studentNis}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-800">{g.studentName}</td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={g.score}
                                  onChange={(e) => handleGradeChange(g.studentId, Number(e.target.value))}
                                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>
                              {manualCriteria.map(criteria => (
                                <td key={criteria} className="px-4 py-2.5">
                                  <select 
                                    value={g.criteriaGrades?.[criteria] || 'B'}
                                    onChange={(e) => handleGradeCriteriaChange(g.studentId, criteria, e.target.value)}
                                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                  </select>
                                </td>
                              ))}
                              <td className="px-4 py-2.5">
                                <input
                                  type="text"
                                  value={g.notes || ''}
                                  onChange={(e) => handleGradeNoteChange(g.studentId, e.target.value)}
                                  placeholder="Catatan..."
                                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={handleSaveManual}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> {editingManualAssessment ? 'Simpan Perubahan' : 'Simpan Penilaian'}
                      </button>
                    </div>
                  </div>
                ) : selectedManualAssessment ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setSelectedManualAssessment('')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ← Kembali
                      </button>
                      <div className="h-4 w-px bg-slate-300"></div>
                      <h4 className="font-bold text-slate-800 text-sm">{teacherManualAssessments.find(m => m.id === selectedManualAssessment)?.title}</h4>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded ml-2">
                        {teacherManualAssessments.find(m => m.id === selectedManualAssessment)?.type}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                            <th className="px-4 py-3 font-bold">NIS</th>
                            <th className="px-4 py-3 font-bold w-1/3">Nama Siswa</th>
                            <th className="px-4 py-3 font-bold text-center">Nilai</th>
                            <th className="px-4 py-3 font-bold">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teacherManualAssessments.find(m => m.id === selectedManualAssessment)?.grades.map((g, idx) => (
                            <tr key={g.studentId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.studentNis}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{g.studentName}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-extrabold text-sm ${g.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {g.score}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {g.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : selectedExamForGrades ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setSelectedExamForGrades('')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ← Kembali
                      </button>
                      <div className="h-4 w-px bg-slate-300"></div>
                      <h4 className="font-bold text-slate-800 text-sm">{teacherExams.find(e => e.id === selectedExamForGrades)?.title}</h4>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                            <th className="px-4 py-3 font-bold">NIS</th>
                            <th className="px-4 py-3 font-bold w-1/3">Nama Siswa</th>
                            <th className="px-4 py-3 font-bold text-center">Nilai</th>
                            <th className="px-4 py-3 font-bold text-center">Waktu Pengerjaan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teacherSubmissions.filter(s => s.examId === selectedExamForGrades).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm italic">
                                Belum ada siswa yang mengumpulkan tugas/ujian ini.
                              </td>
                            </tr>
                          ) : (
                            teacherSubmissions
                              .filter(s => s.examId === selectedExamForGrades)
                              .sort(sortSubmissions)
                              .map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.studentNis}</td>
                                  <td className="px-4 py-3 font-bold text-slate-800">{s.studentName}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-extrabold text-sm ${s.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {s.score}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                                    {new Date(s.submittedAt).toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedClassForGrades('')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit transition cursor-pointer"
                      >
                        ← Kembali ke Daftar Kelas
                      </button>
                      <button
                        onClick={() => handleOpenManualForm()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Input Nilai Manual
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <FileText className="w-4 h-4 text-indigo-600" /> Ujian & Tugas CBT
                      </h4>
                      {teacherExams.filter(e => Array.isArray(e.classId) ? e.classId.includes(selectedClassForGrades) : e.classId === selectedClassForGrades).length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Belum ada tugas CBT di kelas ini.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teacherExams.filter(e => Array.isArray(e.classId) ? e.classId.includes(selectedClassForGrades) : e.classId === selectedClassForGrades).map(exam => {
                            const submissionCount = teacherSubmissions.filter(s => s.examId === exam.id).length;
                            return (
                              <button
                                key={exam.id}
                                onClick={() => setSelectedExamForGrades(exam.id)}
                                className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition text-left space-y-2 flex flex-col justify-between cursor-pointer"
                              >
                                <div>
                                  <h5 className="font-extrabold text-slate-900">{exam.title}</h5>
                                  <p className="text-xs text-slate-500 mt-1">{getSubjectName(exam.subjectId)}</p>
                                </div>
                                <div className="flex justify-between items-center w-full mt-4 pt-3 border-t border-slate-100">
                                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{submissionCount} Siswa Mengerjakan</span>
                                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">Lihat Nilai <FileText className="w-3.5 h-3.5" /></span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Clipboard className="w-4 h-4 text-emerald-600" /> Penilaian Manual
                      </h4>
                      {teacherManualAssessments.filter(m => m.classId === selectedClassForGrades).length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Belum ada penilaian manual di kelas ini.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teacherManualAssessments.filter(m => m.classId === selectedClassForGrades).map(assessment => (
                            <div
                              key={assessment.id}
                              className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition text-left space-y-2 flex flex-col justify-between group"
                            >
                              <div>
                                <div className="flex justify-between items-start">
                                  <h5 className="font-extrabold text-slate-900">{assessment.title}</h5>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenManualForm(assessment)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer" title="Edit">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { onDeleteManualAssessment?.(assessment.id); }} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer" title="Hapus">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">{assessment.type}</p>
                                  <p className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{getSubjectName(assessment.subjectId)}</p>
                                  <p className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{assessment.date}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center w-full mt-4 pt-3 border-t border-slate-100">
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{assessment.grades.length} Nilai</span>
                                <button 
                                  onClick={() => setSelectedManualAssessment(assessment.id)}
                                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                                >
                                  Lihat Nilai <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}              </div>
            )}
          </div>
        </div>
      )}

      {/* 3.5. BANK SOAL TAB */}
      {activeTab === 'bank_soal' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Bank Soal Guru</h3>
              <p className="text-slate-500 text-xs mt-0.5">Kelola koleksi soal yang dapat digunakan kembali untuk tugas atau ujian.</p>
            </div>
            <button
              onClick={() => {
                setIsQuestionBankMode(true);
                setShowAddQuestionBankModal(true);
                setQbTitle('');
                setQbSubject('');
                setExamQuestions([]);
                setTargetQuestionCount(10);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Bank Soal Baru
            </button>
          </div>

          {teacherQuestionBanks.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Belum ada bank soal yang dibuat.</p>
              <p className="text-slate-400 text-xs mt-1">Gunakan tombol di atas untuk membuat koleksi soal pertama Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherQuestionBanks.map((qb) => (
                <div key={qb.id} className="border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-indigo-100 hover:shadow-md transition bg-white space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{qb.title}</h4>
                      <p className="text-[11px] font-semibold text-indigo-600 mt-1">{getSubjectName(qb.subjectId)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShareQbId(qb.id);
                          setShareSelectedClasses([]);
                          setShareDuration(60);
                          setShowShareQbModal(true);
                        }}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 p-1.5 rounded transition cursor-pointer flex items-center gap-1.5 px-2.5 shadow-xs font-bold text-xs"
                        title="Bagikan ke Kelas"
                      >
                        <Send className="w-3.5 h-3.5" /> Bagikan
                      </button>
                      <button
                        onClick={() => {
                          const w = window.open('', '_blank');
                          if (w) {
                            w.document.write(`
                              <html>
                                <head>
                                  <title>Cetak Bank Soal - ${qb.title}</title>
                                  <style>
                                    body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                                    .header { position: relative; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; min-height: 80px; }
                                    .header-logo { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 72px; height: 72px; object-fit: contain; }
                                    .header-text { text-align: center; width: 100%; padding-left: 80px; padding-right: 80px; }
                                    .header-text h1 { font-size: 16px; margin: 0; text-transform: uppercase; color: #0f172a; font-weight: bold; line-height: 1.25; }
                                    .header-text h2 { font-size: 13px; margin: 4px 0 0 0; color: #334155; font-weight: normal; }
                                    .question { margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
                                    .q-text { font-weight: bold; margin-bottom: 10px; }
                                    .options { margin-left: 20px; }
                                    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; font-size: 11px; margin-bottom: 10px; font-weight: bold; }
                                    @media print { body { padding: 0; max-width: 100%; } .no-print { display: none; } }
                                  </style>
                                </head>
                                <body>
                                  <button class="no-print" onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; cursor: pointer;">Cetak Dokumen</button>
                                  <div class="header">
                                    <img src="${SCHOOL_LOGO_BASE64}" alt="Logo Sekolah" class="header-logo" />
                                    <div class="header-text">
                                      <h1>${schoolIdentity.header1}</h1>
                                      <h1>${schoolIdentity.header2}</h1>
                                      <h1 style="font-size:20px;margin-top:2px;font-weight:bold;color:#0f172a;">${schoolIdentity.schoolName}</h1>
                                      <h2>${schoolIdentity.address}</h2>
                                    </div>
                                  </div>
                                  <h2 style="font-size:18px; font-weight:bold; text-align:center; color:#0f172a; margin-top:10px; text-decoration:underline;">NASKAH BANK SOAL: ${qb.title.toUpperCase()}</h2>
                                  <h2 style="font-size:14px; font-weight:bold; text-align:center; color:#475569; margin-top:2px; margin-bottom:25px;">Mata Pelajaran: ${getSubjectName(qb.subjectId)} | Jumlah: ${qb.questions.length} Soal</h2>
                                  <div>
                                    ${qb.questions.map((q, idx) => `
                                      <div class="question">
                                        <div class="type-badge">${q.type}</div>
                                        <div class="q-text">${idx + 1}. ${q.questionText}</div>
                                        ${q.type === 'PilihanGanda' || q.type === 'PilihanGandaKompleks' ? `
                                          <div class="options">
                                            ${(q as any).options.map((opt: string, oIdx: number) => `
                                              <div>${String.fromCharCode(65 + oIdx)}. ${opt}</div>
                                            `).join('')}
                                          </div>
                                        ` : ''}
                                        ${q.type === 'PilihanAsosiatif' ? `
                                          <div class="options">
                                            ${(q as any).statements.map((stmt: string) => `
                                              <div>${stmt}</div>
                                            `).join('')}
                                          </div>
                                        ` : ''}
                                        ${q.type === 'SebabAkibat' ? `
                                          <div class="options">
                                            <div><strong>Sebab:</strong> ${(q as any).statement}</div>
                                            <div><strong>Akibat:</strong> ${(q as any).reason}</div>
                                          </div>
                                        ` : ''}
                                      </div>
                                    `).join('')}
                                  </div>
                                </body>
                              </html>
                            `);
                            w.document.close();
                          }
                        }}
                        className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-1.5 rounded transition cursor-pointer"
                        title="Cetak Bank Soal"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsQuestionBankMode(true);
                          setEditingQbId(qb.id);
                          setQbTitle(qb.title);
                          setQbSubject(qb.subjectId);
                          setExamQuestions(qb.questions);
                          setTargetQuestionCount(Math.max(10, qb.questions.length));
                          setShowAddQuestionBankModal(true);
                        }}
                        className="text-slate-400 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 p-1.5 rounded transition cursor-pointer"
                        title="Edit Bank Soal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteQuestionBank && (
                        <button
                          onClick={() => {
                            setItemToDelete({ id: qb.id, type: 'Bank Soal', name: qb.title });
                          }}
                          className="text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-1.5 rounded transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dibuat</span>
                      <span className="font-bold text-slate-800 flex items-center gap-0.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {new Date(qb.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Jumlah Soal</span>
                      <span className="font-bold text-slate-800 flex items-center gap-0.5 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> {qb.questions.length} Butir
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CHEATLOGS */}
      {activeTab === 'cheatlogs' && (
        <div className="space-y-6 animate-fade-in">
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const uniqueClasses = Array.from(new Set((teacherCheatLogs || []).map(l => l.className).filter(Boolean)));
            const uniqueExams = Array.from(new Set((teacherCheatLogs || []).map(l => l.examTitle).filter(Boolean)));

            const filteredLogs = (teacherCheatLogs || []).filter(log => {
              if (teacherCheatClassFilter !== 'ALL' && log.className !== teacherCheatClassFilter) return false;
              if (teacherCheatExamFilter !== 'ALL' && log.examTitle !== teacherCheatExamFilter) return false;
              if (teacherCheatDateFilter === 'TODAY') {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                if (logDate !== todayStr) return false;
              }
              if (teacherCheatSearchQuery.trim()) {
                const q = teacherCheatSearchQuery.toLowerCase();
                const matchName = log.studentName?.toLowerCase().includes(q);
                const matchNis = log.studentNis?.toLowerCase().includes(q);
                const matchClass = log.className?.toLowerCase().includes(q);
                const matchExam = log.examTitle?.toLowerCase().includes(q);
                if (!matchName && !matchNis && !matchClass && !matchExam) return false;
              }
              return true;
            });

            return (
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Log Pelanggaran Ujian Saya</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Catatan otomatis siswa yang keluar dari aplikasi/tab browser saat mengerjakan ujian yang Anda ampu. Total ({teacherCheatLogs.length}) kejadian.
                      </p>
                    </div>
                  </div>

                  {teacherCheatLogs.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {filteredLogs.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus ${filteredLogs.length} log pelanggaran terpilih?`)) {
                              if (onClearCheatLogsBatch) {
                                onClearCheatLogsBatch(filteredLogs.map(l => l.id));
                              } else if (onDeleteCheatLog) {
                                filteredLogs.forEach(l => onDeleteCheatLog(l.id));
                                toast.success('Log pelanggaran terpilih berhasil dibersihkan.');
                              }
                            }
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="Hapus log pelanggaran sesuai filter yang aktif"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                          Bersihkan Hasil Filter ({filteredLogs.length})
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin MENGHAPUS SEMUA (${teacherCheatLogs.length}) log pelanggaran pada ujian Anda?`)) {
                            if (onClearCheatLogsBatch) {
                              onClearCheatLogsBatch(teacherCheatLogs.map(l => l.id));
                            } else if (onDeleteCheatLog) {
                              teacherCheatLogs.forEach(l => onDeleteCheatLog(l.id));
                              toast.success('Semua log pelanggaran ujian Anda berhasil dibersihkan.');
                            }
                          }
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                        title="Hapus seluruh log pelanggaran ujian Anda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Semua Log ({teacherCheatLogs.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* FILTER CONTROLS */}
                {teacherCheatLogs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Siswa / NIS</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Ketik nama / NIS / ujian..."
                          value={teacherCheatSearchQuery}
                          onChange={(e) => setTeacherCheatSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
                      <select
                        value={teacherCheatClassFilter}
                        onChange={(e) => setTeacherCheatClassFilter(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
                      >
                        <option value="ALL">-- Semua Kelas ({uniqueClasses.length}) --</option>
                        {uniqueClasses.map(c => (
                          <option key={c} value={c}>Kelas {c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Ujian</label>
                      <select
                        value={teacherCheatExamFilter}
                        onChange={(e) => setTeacherCheatExamFilter(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
                      >
                        <option value="ALL">-- Semua Ujian ({uniqueExams.length}) --</option>
                        {uniqueExams.map(ex => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rentang Tanggal</label>
                      <select
                        value={teacherCheatDateFilter}
                        onChange={(e) => setTeacherCheatDateFilter(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
                      >
                        <option value="ALL">Semua Tanggal</option>
                        <option value="TODAY">📅 Hari Ini Sahaja ({new Date().toLocaleDateString('id-ID')})</option>
                      </select>
                    </div>
                  </div>
                )}

                {teacherCheatLogs.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Log Pelanggaran Ujian</h4>
                    <p className="text-slate-500 text-xs mt-1">Siswa mengerjakan ujian Anda dengan jujur dan berintegritas tinggi.</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-amber-200 rounded-2xl bg-amber-50/30">
                    <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <p className="text-slate-700 font-bold text-xs">Tidak ada log pelanggaran yang cocok dengan filter yang Anda pilih.</p>
                    <button
                      onClick={() => {
                        setTeacherCheatClassFilter('ALL');
                        setTeacherCheatExamFilter('ALL');
                        setTeacherCheatDateFilter('ALL');
                        setTeacherCheatSearchQuery('');
                      }}
                      className="mt-3 text-xs text-indigo-600 font-extrabold underline cursor-pointer"
                    >
                      Reset Filter Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                            <th className="p-3.5">Waktu</th>
                            <th className="p-3.5">Nama Siswa</th>
                            <th className="p-3.5">NIS</th>
                            <th className="p-3.5">Kelas</th>
                            <th className="p-3.5">Ujian</th>
                            <th className="p-3.5">Pelanggaran</th>
                            <th className="p-3.5 text-center">Aksi Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-red-50/20 transition">
                              <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-3.5">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"></span>
                                  {log.studentName}
                                </p>
                              </td>
                              <td className="p-3.5 font-mono text-slate-600">{log.studentNis}</td>
                              <td className="p-3.5 font-semibold text-slate-700">{log.className}</td>
                              <td className="p-3.5 font-medium text-indigo-700">{log.examTitle}</td>
                              <td className="p-3.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {log.violationType}
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus catatan pelanggaran siswa "${log.studentName}" pada ujian "${log.examTitle}"?`)) {
                                      if (onDeleteCheatLog) {
                                        onDeleteCheatLog(log.id);
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus catatan pelanggaran ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. TAB PROFIL GURU & JADWAL MENGAJAR PRIBADI */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-fade-in">
          {/* A. KELOLA FOTO PROFIL & BIODATA GURU MAPEL */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <UserCheck className="w-6 h-6 text-indigo-600" /> Pengaturan Foto Profil & Biodata Guru Mapel
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sesuaikan foto profil profesional Anda, nama lengkap beserta gelar, dan NIP yang akan tercetak otomatis di setiap dokumen resmi.
                </p>
              </div>
              {profileSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <Check className="w-4 h-4 shrink-0" /> {profileSuccessMsg}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveProfileChanges} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Live Preview Foto Profil */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <img
                    src={profilePhotoInput || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'}
                    alt="Preview Profil"
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition duration-300"
                  />
                  <label className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md cursor-pointer transition">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{profileNameInput || currentTeacher.name}</h4>
                  <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">NIP. {profileNipInput || currentTeacher.nip}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 bg-slate-200/70 text-slate-700 rounded-lg text-[10px] font-bold">
                    Mapel: {currentTeacher.subject}
                  </span>
                </div>
                <label className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition flex items-center justify-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" /> Pilih File Foto dari Perangkat
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Form Input URL & Biodata */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-indigo-600" /> Link / URL Foto Profil (Opsi Alternatif)
                  </label>
                  <input
                    type="text"
                    value={profilePhotoInput}
                    onChange={(e) => setProfilePhotoInput(e.target.value)}
                    placeholder="Tempel tautan gambar (URL langsung / Google Drive) atau unggah file di kiri..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tips: Anda dapat mengunggah file langsung menggunakan tombol di foto atas, atau menyalin link foto eksternal ke dalam kotak ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" /> Nama Lengkap Guru Mapel (Serta Gelar) *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-600" /> NIP Guru Mapel *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileNipInput}
                      onChange={(e) => setProfileNipInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Simpan Perubahan Profil Guru Mapel
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* B. MENU KELENGKAPAN: JADWAL MENGAJAR & CATATAN KELAS PRIBADI */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <Calendar className="w-6 h-6 text-indigo-600" /> Agenda Jadwal Mengajar & Catatan Kelas Guru Mapel
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Catat hari, jam pelajaran, ruangan, dan agenda khusus di tiap kelas. Anda dapat mengedit perubahan jadwal sewaktu-waktu jika ada pergeseran jam atau tugas kelas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSchedule}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Jadwal & Catatan Baru
              </button>
            </div>

            {/* Filter Hari */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
              {(['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu']).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 cursor-pointer ${
                    selectedDayFilter === d
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d === 'Semua' ? '📅 Semua Hari' : d}
                </button>
              ))}
            </div>

            {/* Grid Kartu Jadwal & Note */}
            {myScheduleNotes.filter(n => selectedDayFilter === 'Semua' || n.day === selectedDayFilter).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Belum Ada Catatan Jadwal Mengajar</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Tambahkan jadwal hari dan jam mengajar kelas Anda dengan mengklik tombol Tambah Jadwal di kanan atas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myScheduleNotes
                  .filter(n => selectedDayFilter === 'Semua' || n.day === selectedDayFilter)
                  .map((note) => (
                    <div
                      key={note.id}
                      className="bg-gradient-to-br from-white to-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-xs rounded-lg uppercase tracking-wide flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" /> {note.day}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-1 rounded-md">
                            {note.jamKe}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-indigo-600 shrink-0" /> Kelas : {note.className}
                          </h4>
                          {note.room && (
                            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {note.room}
                            </p>
                          )}
                        </div>

                        <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-xs text-slate-700">
                          <span className="font-extrabold text-amber-900 block mb-1 text-[11px] uppercase tracking-wider flex items-center gap-1">
                            📌 Catatan & Agenda KBM:
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{note.note || 'Tidak ada catatan khusus.'}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSchedule(note)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Jadwal & Catatan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduleNote(note.id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PENGUMUMAN & NOTIFIKASI SISWA */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <Bell className="w-3 h-3" /> Siaran Khusus Mapel {currentTeacher.subject} ({currentTeacher.name})
              </span>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mt-1">
                <Megaphone className="w-5 h-5 text-amber-600" />
                Manajemen Notifikasi & Informasi Beranda Siswa
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Kirim pengumuman penting, tugas cepat, atau informasi agenda mengajar yang akan langsung muncul sebagai notifikasi pop-up & banner di beranda siswa saat login.
              </p>
            </div>

            <button
              onClick={() => setShowAddAnnModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Kirim Notifikasi Baru
            </button>
          </div>

          <div className="space-y-4">
            {teacherAnnouncements.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-xs">Belum ada catatan atau informasi notifikasi untuk mata pelajaran {currentTeacher.subject}.</p>
                <p className="text-slate-400 text-[11px] mt-1">Tekan tombol "Kirim Notifikasi Baru" untuk memberi tahu siswa mengenai jadwal, materi, atau tugas mapel ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacherAnnouncements
                  .map(ann => (
                    <div
                      key={ann.id}
                      className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                        ann.isActive
                          ? 'bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-200/80 shadow-xs'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider ${
                              ann.priority === 'mendesak' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              ann.priority === 'penting' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {ann.priority === 'mendesak' ? '🚨 Mendesak' : ann.priority === 'penting' ? '⭐ Penting' : 'ℹ️ Informasi'}
                            </span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {ann.targetType === 'all' ? '🌐 Semua Kelas Siswa' : `🎯 Khusus Kelas ${ann.targetClassName}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {onToggleAnnouncement && (
                              <button
                                onClick={() => onToggleAnnouncement(ann.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                  ann.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                                title={ann.isActive ? 'Klik untuk nonaktifkan notifikasi' : 'Klik untuk aktifkan notifikasi'}
                              >
                                {ann.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                {ann.isActive ? 'Aktif' : 'Nonaktif'}
                              </button>
                            )}
                            {onDeleteAnnouncement && (
                              <button
                                onClick={() => onDeleteAnnouncement(ann.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Notifikasi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm">{ann.title}</h4>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-150/60">
                          {ann.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-150/80 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>Oleh: <strong className="text-slate-700">{ann.teacherName}</strong> ({ann.teacherSubject})</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB INBOX (KOTAK MASUK BERBAGI) */}
      {activeTab === 'konseling' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-teal-600">🤝</span> Rujukan Konseling (Guru BK)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Laporkan siswa yang membutuhkan pendampingan khusus atau bimbingan konseling kepada Guru BK.
            </p>
          </div>

          <form onSubmit={handleCreateReferral} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Buat Rujukan Baru</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Pilih Kelas</label>
                <select
                  value={refClassId}
                  onChange={(e) => {
                    setRefClassId(e.target.value);
                    setRefStudentNis('');
                  }}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">-- Semua Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Pilih Siswa * (Ketik untuk mencari)</label>
                <input
                  type="text"
                  list="ref-students-list"
                  value={refStudentNis}
                  onChange={(e) => setRefStudentNis(e.target.value)}
                  placeholder="Pilih atau ketik NIS siswa..."
                  required
                  autoComplete="off"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
                <datalist id="ref-students-list">
                  {students
                    .filter(s => refClassId ? s.classId === refClassId : true)
                    .map(s => (
                    <option key={s.nis} value={s.nis}>{s.name} ({classes.find(c => c.id === s.classId)?.name || 'N/A'})</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-700">Kategori Kendala *</label>
                <input
                  type="text"
                  value={refCategory}
                  onChange={(e) => setRefCategory(e.target.value)}
                  placeholder="Ketik Kategori Kendala..."
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700">Detail Kendala & Kronologi *</label>
              <textarea
                value={refDetails}
                onChange={(e) => setRefDetails(e.target.value)}
                required
                rows={4}
                placeholder="Deskripsikan perilaku atau kendala yang dialami siswa saat proses pembelajaran..."
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-700">Tingkat Prioritas</label>
              <div className="flex gap-3">
                {['Rendah', 'Sedang', 'Tinggi'].map((p) => (
                  <label key={p} className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-xl cursor-pointer transition ${refPriority === p ? (p === 'Tinggi' ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' : p === 'Sedang' ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold' : 'bg-blue-50 border-blue-500 text-blue-700 font-bold') : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={refPriority === p}
                      onChange={(e) => setRefPriority(e.target.value as any)}
                      className="sr-only"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 px-6 rounded-xl transition shadow-md"
              >
                Kirim Rujukan ke Guru BK
              </button>
            </div>
          </form>
        </div>
      )}
      {activeTab === 'inbox' && (() => {
        const myRequests = shareRequests.filter(r => r.receiverId === currentTeacher.id);
        const pendingCount = myRequests.filter(r => r.status === 'Pending').length;
        const acceptedCount = myRequests.filter(r => r.status === 'Accepted').length;
        const rejectedCount = myRequests.filter(r => r.status === 'Rejected').length;

        const filteredRequests = myRequests.filter(r => {
          if (inboxFilter === 'Pending') return r.status === 'Pending';
          if (inboxFilter === 'Accepted') return r.status === 'Accepted';
          if (inboxFilter === 'Rejected') return r.status === 'Rejected';
          return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-xl relative">
                  <Send className="w-6 h-6" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    Kotak Masuk Berbagi
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Permintaan & riwayat kiriman materi, perangkat ajar, atau bank soal dari guru lain.</p>
                </div>
              </div>

              {myRequests.length > 0 && onClearAllShares && (
                <button
                  onClick={() => {
                    if (window.confirm(`Apakah Anda yakin ingin menghapus SELURUH (${myRequests.length}) notifikasi di kotak masuk Anda?`)) {
                      onClearAllShares(currentTeacher.id);
                      toast('Kotak masuk berhasil dibersihkan');
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0"
                  title="Bersihkan semua notifikasi kotak masuk"
                >
                  <Trash2 className="w-4 h-4" /> Bersihkan Semua ({myRequests.length})
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
              <button
                onClick={() => setInboxFilter('All')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  inboxFilter === 'All'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({myRequests.length})
              </button>
              <button
                onClick={() => setInboxFilter('Pending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  inboxFilter === 'Pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Menunggu ({pendingCount})
              </button>
              <button
                onClick={() => setInboxFilter('Accepted')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  inboxFilter === 'Accepted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Diterima ({acceptedCount})
              </button>
              <button
                onClick={() => setInboxFilter('Rejected')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  inboxFilter === 'Rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ditolak ({rejectedCount})
              </button>
            </div>

            {/* Request List */}
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
                  <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-bold text-sm">Kotak masuk kosong</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {inboxFilter === 'All' 
                      ? 'Belum ada permintaan berbagi dari rekan guru.' 
                      : `Tidak ada notifikasi dengan status "${inboxFilter}".`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredRequests.map(req => (
                    <div 
                      key={req.id} 
                      className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:shadow-md ${
                        req.status === 'Pending' 
                          ? 'bg-amber-50/40 border-amber-200/80' 
                          : req.status === 'Accepted'
                          ? 'bg-emerald-50/30 border-emerald-100'
                          : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                            req.itemType === 'Material' ? 'bg-emerald-100 text-emerald-800' : 
                            req.itemType === 'TeachingModule' ? 'bg-blue-100 text-blue-800' : 
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {req.itemType === 'Material' ? '📖 Materi' : req.itemType === 'TeachingModule' ? '📁 Perangkat Ajar' : '📝 Bank Soal'}
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                            req.status === 'Pending' ? 'bg-amber-500 text-white shadow-2xs' :
                            req.status === 'Accepted' ? 'bg-emerald-600 text-white' : 
                            'bg-rose-500 text-white'
                          }`}>
                            {req.status === 'Pending' ? '⏳ Menunggu Konfirmasi' : req.status === 'Accepted' ? '✅ Diterima & Disalin' : '❌ Ditolak'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base">{req.itemTitle}</h4>
                        <p className="text-xs text-slate-500">
                          Pengirim: <strong className="text-slate-800 font-bold">{req.senderName}</strong> • {new Date(req.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                        {req.status === 'Pending' && onRespondShare && (
                          <>
                            <button
                              onClick={() => {
                                onRespondShare(req.id, 'Rejected');
                                toast('Permintaan berbagi telah ditolak.');
                              }}
                              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-100/80 hover:bg-rose-200 rounded-lg transition cursor-pointer"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => {
                                onRespondShare(req.id, 'Accepted');
                                toast.success('Berhasil menerima & menyalin ke akun Anda!');
                              }}
                              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Terima & Salin
                            </button>
                          </>
                        )}

                        {/* Always visible option to Delete item */}
                        {onDeleteShare && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus notifikasi "${req.itemTitle}" dari kotak masuk?`)) {
                                onDeleteShare(req.id);
                                toast('Notifikasi dihapus dari kotak masuk');
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Hapus notifikasi ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 11. TUGAS & PENGUMPULAN (GOOGLE DRIVE) */}
      {activeTab === 'assignments' && (() => {
        const myFolders = (assignmentFolders || []).filter(f => f.teacherId === currentTeacher.id);
        const currentFolderItems = myFolders.filter(f => {
          if (currentAssignFolderId === null) return !f.parentId;
          return f.parentId === currentAssignFolderId;
        });

        // Breadcrumbs
        const crumbs = [{ id: null, title: '📁 Root Utama' }];
        let currId = currentAssignFolderId;
        const tempCrumbs: { id: string; title: string }[] = [];
        while (currId) {
          const found = myFolders.find(f => f.id === currId);
          if (found) {
            tempCrumbs.unshift({ id: found.id, title: found.title });
            currId = found.parentId || null;
          } else {
            break;
          }
        }
        const fullCrumbs = [...crumbs, ...tempCrumbs];

        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    Pusat Tugas & Pengumpulan Berkas (Google Drive)
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Kelola struktur folder tugas, sediakan link tempat siswa mengumpulkan tugas, serta periksa berkas siswa secara terstruktur.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {clipboardAssignItem && (
                  <button
                    onClick={() => {
                      const itemToMove = myFolders.find(f => f.id === clipboardAssignItem.id);
                      if (itemToMove && onUpdateAssignmentFolder) {
                        if (itemToMove.id === currentAssignFolderId) {
                          toast.error('Tidak bisa menempel item ke dalam dirinya sendiri!');
                          return;
                        }
                        onUpdateAssignmentFolder({
                          ...itemToMove,
                          parentId: currentAssignFolderId
                        });
                        toast.success(`'${clipboardAssignItem.title}' berhasil dipindahkan ke folder ini!`);
                        setClipboardAssignItem(null);
                      }
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm flex items-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Folder className="w-4 h-4" /> 📋 Tempel '{clipboardAssignItem.title}' Di Sini
                  </button>
                )}

                <button
                  onClick={() => {
                    setAssignModalMode('create');
                    setAssignFolderTitleInput('');
                    setEditingAssignId(null);
                    setShowAssignFolderModal(true);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-indigo-600" /> + Folder Baru
                </button>

                <button
                  onClick={() => {
                    setAssignModalMode('create');
                    setAssignItemTitleInput('');
                    setAssignClassIdInput(classes[0]?.id || '');
                    setAssignSubjectIdInput(subjects[0]?.id || '');
                    setAssignDueDateInput('');
                    setAssignDescInput('');
                    setAssignGDriveUrlInput('');
                    setEditingAssignId(null);
                    setShowAssignItemModal(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + Tugas Baru (GDrive)
                </button>
              </div>
            </div>

            {/* Breadcrumb Navigation Bar */}
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold text-slate-700 scrollbar-none">
                {fullCrumbs.map((c, idx) => (
                  <React.Fragment key={c.id || 'root'}>
                    {idx > 0 && <span className="text-slate-400">/</span>}
                    <button
                      onClick={() => setCurrentAssignFolderId(c.id)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        currentAssignFolderId === c.id
                          ? 'bg-indigo-600 text-white font-black shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {c.id === null ? <Folder className="w-3.5 h-3.5 text-amber-400" /> : <Folder className="w-3.5 h-3.5 text-indigo-500" />}
                      {c.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {currentAssignFolderId !== null && (
                <button
                  onClick={() => {
                    const curr = myFolders.find(f => f.id === currentAssignFolderId);
                    setCurrentAssignFolderId(curr?.parentId || null);
                  }}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali Ke Atas
                </button>
              )}
            </div>

            {/* Content Listing */}
            {currentFolderItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <FolderPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-700 text-sm">Folder Ini Masih Kosong</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Belum ada folder atau tugas di dalam direktori ini. Klik tombol di atas untuk membuat sub-folder baru atau menambahkan tugas pengumpulan siswa.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentFolderItems.map(item => {
                  if (item.type === 'folder') {
                    const childCount = myFolders.filter(f => f.parentId === item.id).length;
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl p-4 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => setCurrentAssignFolderId(item.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                              <Folder className="w-6 h-6 fill-amber-400 text-amber-600" />
                            </div>
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                              {childCount} Item
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">Dibuat: {new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>

                        {/* Folder Actions */}
                        <div className="flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-3 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignModalMode('edit');
                              setAssignFolderTitleInput(item.title);
                              setEditingAssignId(item.id);
                              setShowAssignFolderModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Rename / Edit Folder"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClipboardAssignItem({ id: item.id, title: item.title, type: 'folder' });
                              toast('Folder dipotong (Cut). Pilih folder tujuan lalu klik Tempel.', { icon: '✂️' });
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Potong (Cut) Folder"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Apakah Anda yakin ingin menghapus folder '${item.title}' beserta seluruh isinya?`) && onDeleteAssignmentFolder) {
                                onDeleteAssignmentFolder(item.id);
                                toast.success('Folder berhasil dihapus');
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // ASSIGNMENT ITEM
                  const cls = classes.find(c => c.id === item.classId);
                  const sbj = subjects.find(s => s.id === item.subjectId);
                  const subCount = (assignmentSubmissions || []).filter(s => s.assignmentFolderId === item.id).length;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-2xl p-4 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            {cls?.name || 'Semua Kelas'}
                          </span>
                          {item.dueDate && (
                            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base mt-3">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Mata Pelajaran: <strong className="text-slate-800">{sbj?.name || currentTeacher.subject}</strong>
                        </p>
                        {item.description && (
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 mt-4 pt-3 border-t border-slate-100">
                        {item.gdriveFolderUrl && (
                          <a
                            href={item.gdriveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Buka Folder Google Drive Guru
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedSubmissionsAssign(item)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> Lihat Pengumpulan Siswa ({subCount} Dikumpulkan)
                        </button>

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              setAssignModalMode('edit');
                              setAssignItemTitleInput(item.title);
                              setAssignClassIdInput(item.classId || classes[0]?.id || '');
                              setAssignSubjectIdInput(item.subjectId || subjects[0]?.id || '');
                              setAssignDueDateInput(item.dueDate || '');
                              setAssignDescInput(item.description || '');
                              setAssignGDriveUrlInput(item.gdriveFolderUrl || '');
                              setEditingAssignId(item.id);
                              setShowAssignItemModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Detail Tugas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setClipboardAssignItem({ id: item.id, title: item.title, type: 'assignment' });
                              toast('Tugas dipotong (Cut). Buka folder tujuan lalu klik Tempel.', { icon: '✂️' });
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Potong (Cut) Tugas"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus tugas '${item.title}'?`) && onDeleteAssignmentFolder) {
                                onDeleteAssignmentFolder(item.id);
                                toast.success('Tugas berhasil dihapus');
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL ADD MATERI */}
      {showAddMateriModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center sm:p-4 lg:p-6 z-50 animate-fade-in">
          <div className="bg-slate-50 sm:rounded-[2rem] shadow-2xl w-full h-full max-w-[1400px] flex flex-col overflow-hidden animate-fade-in-up border border-white/20">
            <form onSubmit={handleSaveMaterial} className="flex flex-col h-full w-full">
              {/* HEADER (Sticky) */}
              <div className="bg-white px-6 lg:px-8 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 z-10 relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Buat Materi Baru</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Tulis artikel materi atau lampirkan berkas untuk siswa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMateriModal(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <X className="w-4 h-4" /> Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" /> Publikasikan Materi
                  </button>
                </div>
              </div>

              {/* BODY (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 max-w-[1200px] mx-auto">
                  
                  {/* LEFT COLUMN: Config */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <Settings className="w-5 h-5 text-slate-400" />
                        <h4 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">Pengaturan Materi</h4>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700">Judul Materi *</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Bab 2 - Struktur Sel Tumbuhan"
                          value={materiTitle}
                          onChange={(e) => setMateriTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Untuk Kelas *</label>
                          <div className="flex flex-wrap gap-2">
                            {sortedClasses.map(c => (
                              <label key={c.id} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border cursor-pointer transition ${materiClasses.includes(c.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                                  checked={materiClasses.includes(c.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setMateriClasses([...materiClasses, c.id]);
                                    } else {
                                      setMateriClasses(materiClasses.filter(id => id !== c.id));
                                    }
                                  }}
                                />
                                <span className="font-bold text-xs">{c.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold mb-1 text-slate-700">Mata Pelajaran *</label>
                          <select
                            required
                            value={materiSubject}
                            onChange={(e) => setMateriSubject(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                          >
                            <option value="">Pilih Mapel</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-2 text-slate-700">Format Konten *</label>
                        <div className="flex flex-wrap gap-3">
                          {(['Article', 'PDF', 'Video', 'Link', 'Word', 'Excel', 'PPT'] as const).map(type => (
                            <label 
                              key={type} 
                              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                                materiType === type 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="materiType"
                                checked={materiType === type}
                                onChange={() => setMateriType(type)}
                                className="hidden"
                              />
                              <span className="text-xs font-bold">{type === 'Article' ? 'Tulis Artikel' : type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Content Editor / Uploader */}
                  <div className="lg:col-span-8">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col min-h-[500px]">
                      
                      {materiType === 'Article' ? (
                        <div className="flex flex-col h-full space-y-4">
                          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <h4 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">Editor Artikel</h4>
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-2xl p-1 border border-slate-200">
                            <ReactQuill
                              theme="snow"
                              value={materiContent}
                              onChange={setMateriContent}
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, 3, false] }],
                                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                                  ['link', 'image', 'video'],
                                  ['clean']
                                ],
                              }}
                              formats={[
                                'header',
                                'bold', 'italic', 'underline', 'strike', 'blockquote',
                                'list', 'indent',
                                'link', 'image', 'video'
                              ]}
                              placeholder="Ketikkan materi pembelajaran di sini... (Anda juga bisa menyematkan link file Word, Excel, PPT, atau PDF dari Google Drive melalui icon Link di toolbar)"
                              className="h-[400px] overflow-hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full space-y-6">
                          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <Upload className="w-5 h-5 text-indigo-500" />
                            <h4 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">Lampirkan Berkas / Tautan</h4>
                          </div>

                          <div className="space-y-6 flex-1">
                            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                              <label className="block text-xs font-semibold mb-3 text-slate-700">Opsi A: Unggah Berkas (Simulasi Google Drive)</label>
                              <div className="flex flex-col sm:flex-row items-center gap-4">
                                <input
                                  type="file"
                                  id="materiFile"
                                  accept={
                                    materiType === 'PDF' ? 'application/pdf' : 
                                    materiType === 'Video' ? 'video/*' : 
                                    materiType === 'Word' ? '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                                    materiType === 'Excel' ? '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                                    materiType === 'PPT' ? '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation' : 
                                    '*/*'
                                  }
                                  onChange={handleSimulatedMateriUpload}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('materiFile')?.click()}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-sm px-6 py-3 rounded-xl transition shadow-xs"
                                >
                                  <Upload className="w-4 h-4" /> Pilih File {materiType}
                                </button>
                                {uploading && (
                                  <span className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    Mengunggah...
                                  </span>
                                )}
                                {materiUrl && materiUrl.includes('materi_drive_') && !uploading && (
                                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                    <CheckCircle className="w-4 h-4" /> Berhasil diunggah
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center py-2">
                              <div className="flex-1 border-t border-slate-100"></div>
                              <span className="text-[10px] text-slate-400 font-extrabold px-4 bg-white rounded-full mx-2">ATAU MASUKKAN LINK</span>
                              <div className="flex-1 border-t border-slate-100"></div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold mb-2 text-slate-700">Opsi B: Tempel Link / Tautan Langsung *</label>
                              <input
                                type="url"
                                required={!materiUrl}
                                placeholder="Contoh: https://youtube.com/... atau https://drive.google.com/..."
                                value={materiUrl}
                                onChange={(e) => setMateriUrl(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                              />
                              <p className="text-[11px] text-slate-400 mt-2 font-medium">Anda bisa menempelkan link YouTube, dokumen Google Docs/Sheets/Drive, presentasi Canva, atau web belajar lainnya.</p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SHARE MATERI TO CLASSES */}
      {(showShareMateriModal || shareMateriSuccess) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-white/20">
            {shareMateriSuccess ? (
              <div>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Materi Berhasil Dibagikan</h3>
                      <p className="text-xs text-slate-500">Materi telah diduplikasi ke kelas tujuan.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShareMateriSuccess(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => { setShareMateriSuccess(false); setShowShareMateriModal(false); setShareMateriId(null); }} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition">
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleShareMaterialSubmit}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Bagikan Materi</h3>
                      <p className="text-xs text-slate-500">Duplikasi materi ini ke kelas lain</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowShareMateriModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold mb-3 text-slate-700">Pilih Tujuan Berbagi</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => setShareMateriTargetType('Class')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${shareMateriTargetType === 'Class' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Ke Kelas Saya
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareMateriTargetType('Teacher')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${shareMateriTargetType === 'Teacher' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Ke Guru Lain
                      </button>
                    </div>

                    {shareMateriTargetType === 'Class' ? (
                      <>
                        <label className="block text-xs font-bold mb-2 text-slate-700">Pilih Kelas Tujuan *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {sortedClasses.map(c => (
                            <label key={c.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${shareMateriSelectedClasses.includes(c.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                                checked={shareMateriSelectedClasses.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setShareMateriSelectedClasses([...shareMateriSelectedClasses, c.id]);
                                  } else {
                                    setShareMateriSelectedClasses(shareMateriSelectedClasses.filter(id => id !== c.id));
                                  }
                                }}
                              />
                              <span className="font-bold text-sm">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-bold mb-2 text-slate-700">Pilih Guru Tujuan *</label>
                        <select
                          value={shareMateriSelectedTeacher}
                          onChange={(e) => setShareMateriSelectedTeacher(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
                        >
                          <option value="">-- Pilih Guru --</option>
                          {teachers.filter(t => t.id !== currentTeacher.id).map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Mapel: {t.subject})</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Materi akan dikirim sebagai permintaan. Guru yang bersangkutan harus menyetujui agar materi disalin ke akun mereka.
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowShareMateriModal(false)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition">
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md rounded-xl transition flex items-center gap-2">
                    <Send className="w-4 h-4" /> Bagikan Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL SHARE QUESTION BANK TO CLASSES */}
      {(showShareQbModal || shareSuccessResult) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-white/20">
            {shareSuccessResult ? (
              <div>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Berhasil Dibagikan</h3>
                      <p className="text-xs text-slate-500">Berikut adalah token unik untuk masing-masing kelas</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShareSuccessResult(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {shareSuccessResult.map((res, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kelas</p>
                          <p className="font-bold text-slate-900">{res.className}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Token Ujian</p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg text-lg tracking-widest">{res.token}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(res.token);
                                toast(`Token Kelas ${res.className} berhasil disalin!`);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-200 bg-indigo-50 rounded-lg transition"
                              title="Salin Token"
                            >
                              <Clipboard className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShareSuccessResult(null)} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition">
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleShareQuestionBankSubmit}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Bagikan Bank Soal</h3>
                      <p className="text-xs text-slate-500">Buat paket ujian dari bank soal ini</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowShareQbModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold mb-3 text-slate-700">Pilih Tujuan Berbagi</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => setShareQbTargetType('Class')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${shareQbTargetType === 'Class' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Jadikan Ujian Kelas
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareQbTargetType('Teacher')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${shareQbTargetType === 'Teacher' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Bagikan ke Guru Lain
                      </button>
                    </div>

                    {shareQbTargetType === 'Class' ? (
                      <>
                        <label className="block text-xs font-bold mb-2 text-slate-700">Pilih Kelas Tujuan *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                          {sortedClasses.map(c => (
                            <label key={c.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${shareSelectedClasses.includes(c.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                                checked={shareSelectedClasses.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setShareSelectedClasses([...shareSelectedClasses, c.id]);
                                  } else {
                                    setShareSelectedClasses(shareSelectedClasses.filter(id => id !== c.id));
                                  }
                                }}
                              />
                              <span className="font-bold text-sm">{c.name}</span>
                            </label>
                          ))}
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1.5 text-slate-700">Durasi Pengerjaan (Menit) *</label>
                          <input
                            type="number"
                            required
                            min="5"
                            value={shareDuration}
                            onChange={(e) => setShareDuration(Number(e.target.value))}
                            className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                          />
                          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            Token unik untuk setiap kelas akan otomatis dibuatkan oleh sistem.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-bold mb-2 text-slate-700">Pilih Guru Tujuan *</label>
                        <select
                          value={shareQbSelectedTeacher}
                          onChange={(e) => setShareQbSelectedTeacher(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50"
                        >
                          <option value="">-- Pilih Guru --</option>
                          {teachers.filter(t => t.id !== currentTeacher.id).map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Mapel: {t.subject})</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Bank soal akan dikirim sebagai permintaan. Guru yang bersangkutan harus menyetujui agar bank soal disalin ke akun mereka.
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowShareQbModal(false)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition">
                    Batal
                  </button>
                  <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md rounded-xl transition flex items-center gap-2">
                    <Send className="w-4 h-4" /> Bagikan Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADD EXAM / QUESTION BANK & CUSTOM ANBK QUESTION BUILDER */}
      {(showAddExamModal || showAddQuestionBankModal) && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center sm:p-4 lg:p-6 z-50">
          <div className="bg-[#f8fafc] sm:rounded-[2rem] shadow-2xl w-full h-full max-w-[1800px] flex flex-col overflow-hidden animate-fade-in-up border border-indigo-500/20">
            <form onSubmit={isQuestionBankMode ? handleSaveQuestionBankSubmit : handleSaveExam} className="flex flex-col h-full w-full">
              {/* HEADER (Sticky) */}
              <div className="bg-white/80 backdrop-blur-xl px-6 lg:px-10 py-6 border-b border-indigo-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 z-10 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`p-3.5 rounded-2xl shadow-inner border ${isQuestionBankMode ? 'bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 border-amber-200' : 'bg-gradient-to-br from-indigo-100 to-purple-50 text-indigo-600 border-indigo-200'}`}>
                    {isQuestionBankMode ? <Database className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight flex items-center gap-2">
                      {isQuestionBankMode 
                        ? (editingQbId ? 'Edit Bank Soal' : 'Buat Bank Soal Baru') 
                        : (editingExamId ? 'Edit Paket Ujian' : 'Pembuatan Paket Ujian')}
                      {!isQuestionBankMode && <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border border-indigo-200 shadow-xs">Studio CBT</span>}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {isQuestionBankMode ? 'Koleksi butir soal untuk digunakan kembali.' : 'Rakit soal interaktif untuk dikerjakan siswa dengan antarmuka modern.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExamModal(false);
                      setShowAddQuestionBankModal(false);
                      setEditingQbId(null);
                    }}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <X className="w-4 h-4" /> Batal
                  </button>
                  <button
                    type="submit"
                    disabled={examQuestions.length === 0}
                    className={`px-8 py-2.5 text-white font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 ${
                      isQuestionBankMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                    }`}
                  >
                    <Save className="w-4 h-4" /> {isQuestionBankMode ? 'Simpan Bank Soal' : 'Simpan Ujian'}
                  </button>
                </div>
              </div>

              {/* BODY (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 max-w-[1600px] mx-auto">
                  {/* LEFT COLUMN: Editor & Config */}
                  <div className="xl:col-span-8 space-y-6 lg:space-y-8">
                    
                    {/* Exam / QB Config */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Settings className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-slate-900 text-sm tracking-widest uppercase">Pengaturan Dasar</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">{isQuestionBankMode ? 'Judul Bank Soal *' : 'Judul Paket Ujian *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isQuestionBankMode ? "Contoh: Bank Soal Matematika K-13" : "Contoh: Penilaian Harian Aljabar"}
                    value={isQuestionBankMode ? qbTitle : examTitle}
                    onChange={(e) => isQuestionBankMode ? setQbTitle(e.target.value) : setExamTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Rencana Jml Soal *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetQuestionCount}
                    onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                {!isQuestionBankMode && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700">Untuk Kelas *</label>
                      <select
                        required
                        value={examClass}
                        onChange={(e) => setExamClass(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                      >
                        <option value="">Pilih Kelas</option>
                        {sortedClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700">Token *</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. ALJB99"
                        value={examToken}
                        onChange={(e) => setExamToken(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none font-bold text-indigo-700 tracking-wider"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700">Durasi (Menit) *</label>
                      <input
                        type="number"
                        required
                        value={examDuration}
                        onChange={(e) => setExamDuration(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  </>
                )}
                {isQuestionBankMode && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1 text-slate-700">Mata Pelajaran *</label>
                    <select
                      required
                      value={qbSubject}
                      onChange={(e) => setQbSubject(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                    >
                      <option value="">Pilih Mapel</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Subject Selection for Exam */}
              {!isQuestionBankMode && (
                <div className="w-1/3">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Mata Pelajaran *</label>
                  <select
                    required
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                  >
                    <option value="">Pilih Mapel</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div> {/* END CONFIG CARD */}

              {/* BANK SOAL IMPORTER SECTION */}
              {!isQuestionBankMode && (
                <div className="border border-indigo-100 rounded-2xl p-5 bg-indigo-50/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex items-start gap-2.5">
                      <Database className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          🗄️ Import dari Bank Soal
                        </h4>
                        <p className="text-[11px] text-indigo-700 font-medium leading-relaxed mt-0.5">
                          Tarik soal dari koleksi Bank Soal Anda untuk mempercepat pembuatan paket ujian.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBankSoalImporter(!showBankSoalImporter)}
                      className="text-xs font-extrabold text-indigo-700 hover:text-indigo-950 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition shrink-0 border border-indigo-200"
                    >
                      {showBankSoalImporter ? 'Sembunyikan Panel ✕' : 'Pilih Bank Soal 📥'}
                    </button>
                  </div>

                  {showBankSoalImporter && (
                    <div className="space-y-4 border-t border-indigo-100/50 pt-4">
                      {teacherQuestionBanks.length === 0 ? (
                         <div className="text-center py-6 bg-white rounded-xl border border-dashed border-indigo-200">
                           <p className="text-indigo-400 text-xs font-medium">Anda belum memiliki bank soal.</p>
                         </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                          {teacherQuestionBanks.map(qb => (
                            <div key={qb.id} className="border border-slate-200 p-3 rounded-xl bg-white flex flex-col justify-between hover:border-indigo-300 transition">
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm mb-1">{qb.title}</h5>
                                <span className="text-[10px] text-slate-500">{getSubjectName(qb.subjectId)} • {qb.questions.length} Soal</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setExamQuestions(prev => [...prev, ...qb.questions]);
                                  toast(`Berhasil menambahkan ${qb.questions.length} soal dari ${qb.title}`);
                                }}
                                className="mt-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-1.5 px-3 rounded-lg w-full text-center transition cursor-pointer"
                              >
                                Tambahkan Semua Soal
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SPREADSHEET IMPORTER SECTION */}
              <div className="border border-emerald-150 rounded-2xl p-5 bg-emerald-50/15 space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-start gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        📥 Import Soal Massal dari Spreadsheet (Excel / CSV)
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-medium leading-relaxed mt-0.5">
                        Salin-tempel baris tabel langsung dari Google Sheets / Microsoft Excel atau berkas CSV.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImportSection(!showImportSection)}
                    className="text-xs font-extrabold text-emerald-700 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition shrink-0 border border-emerald-200"
                  >
                    {showImportSection ? 'Sembunyikan Panel ✕' : 'Mulai Import Soal 📥'}
                  </button>
                </div>

                {showImportSection && (
                  <div className="space-y-5 border-t border-emerald-100/50 pt-4">
                    {/* LANGKAH 1 & UNDUH TEMPLATE EXCEL */}
                    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-300 p-4 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                            <Download className="w-3 h-3" /> Langkah 1: Unduh Template Excel Lengkap
                          </span>
                          <h5 className="font-extrabold text-emerald-950 text-sm">
                            Gunakan Format File Standar (.xlsx) beserta Petunjuk Pengisian
                          </h5>
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            Unduh berkas contoh di bawah ini. Berkas terdiri dari 2 sheet: <strong>Sheet 1 (Contoh Soal)</strong> dengan contoh soal Pilihan Ganda, PG Kompleks, Asosiatif, dan Sebab-Akibat, serta <strong>Sheet 2 (Panduan & Aturan Kolom)</strong>.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadTemplateExcel}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition shrink-0 cursor-pointer active:scale-95"
                        >
                          <Download className="w-4 h-4" /> Unduh Template Soal (.XLSX)
                        </button>
                      </div>
                    </div>

                    {/* LANGKAH 2: UNGGAH BERKAS EXCEL */}
                    <div className="bg-white border-2 border-dashed border-emerald-300 rounded-2xl p-5 text-center space-y-3 hover:border-emerald-500 transition-colors">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          Langkah 2: Langsung Unggah Berkas Excel
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm">
                          Pilih atau Tarik Berkas Soal Anda (.XLSX, .XLS, .CSV)
                        </h5>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Setelah Anda mengisi soal pada berkas Excel yang diunduh, pilih berkas tersebut di bawah ini untuk langsung memproses seluruh butir soal secara otomatis.
                        </p>
                      </div>
                      <div className="flex justify-center pt-1">
                        <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" /> Pilih File Excel / CSV
                          <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUploadExcel}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* LANGKAH ALTERNATIF: SALIN-TEMPEL TEKS */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <Clipboard className="w-4 h-4 text-slate-500" />
                          Alternatif Langkah 2: Salin-Tempel Baris dari Google Sheets / Excel
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const mockHeader = "Tipe Soal\tPertanyaan\tOpsi A / Sebab\tOpsi B / Alasan\tOpsi C\tOpsi D\tKunci Jawaban\tSkor\tTipe Media\tLink Media\tFont Preset\n" +
                              "PilihanGanda\tContoh soal matematika **aljabar** dasar\t5\t10\t15\t20\tB\t10\tNone\t\tSans\n" +
                              "PilihanGandaKompleks\tMana sajakah yang merupakan organ ekskresi manusia?\tGinjal\tParu-paru\tJantung\tKulit\tA,B,D\t10\tNone\t\tSans\n" +
                              "PilihanAsosiatif\tPernyataan matriks ordo 2x2:\t(1) Determinan = 0\t(2) Memiliki invers\t(3) Matriks identitas\t(4) Matriks singular\t1,4\t15\tNone\t\tMono\n" +
                              "SebabAkibat\tContoh soal IPA fisika optik\tCahaya dapat mengalami polarisasi.\tCahaya merupakan gelombang transversal.\t\t\tBENAR,BENAR,YA\t10\tImage\thttps://picsum.photos/400/300\tSerif";
                            navigator.clipboard.writeText(mockHeader);
                            toast("Template baris contoh berhasil disalin! Silakan tempel (Ctrl+V) ke Excel atau Google Sheets untuk latihan.");
                          }}
                          className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 rounded text-[10px] font-bold border border-slate-300 transition"
                        >
                          📋 Salin Teks Contoh ke Clipboard
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Jika tidak ingin mengunggah file .xlsx, Anda dapat langsung menyalin (Copy) baris dari spreadsheet lalu menempelkannya (Paste) di sini..."
                        className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                      />
                      <div className="flex justify-end gap-2 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setImportText('');
                            setImportErrors([]);
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                        >
                          Bersihkan
                        </button>
                        <button
                          type="button"
                          onClick={handleImportFromSpreadsheet}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-1 transition shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" /> Proses Teks
                        </button>
                      </div>
                    </div>

                    {/* Guidance detail collapsible / table */}
                    <details className="bg-white border border-slate-200 p-3.5 rounded-xl text-xs">
                      <summary className="font-bold text-slate-700 text-xs cursor-pointer select-none flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-indigo-600" /> Referensi Tabel Struktur Kolom (11 Kolom Berurutan)
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">Klik untuk buka / tutup detail</span>
                      </summary>
                      <div className="mt-3 space-y-2 pt-3 border-t border-slate-100">
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Urutan kolom dalam berkas Excel (.xlsx / .csv) Anda harus persis mengikuti <strong>11 kolom</strong> di bawah ini:
                        </p>
                        <div className="overflow-x-auto border border-slate-150 rounded-lg max-h-48 bg-slate-50">
                          <table className="w-full text-[10px] text-left border-collapse font-mono">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                                <th className="p-2 border-r whitespace-nowrap">Kolom 1: Tipe</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 2: Pertanyaan</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 3: Opsi A / Sebab</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 4: Opsi B / Alasan</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 5: Opsi C</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 6: Opsi D</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 7: Kunci</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 8: Skor</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 9: Media</th>
                                <th className="p-2 border-r whitespace-nowrap">Kolom 10: Tautan Media</th>
                                <th className="p-2 whitespace-nowrap">Kolom 11: Font</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b bg-white">
                                <td className="p-2 border-r font-bold text-indigo-700">PilihanGanda</td>
                                <td className="p-2 border-r text-slate-700 font-semibold text-xs whitespace-nowrap">**Tebal** Hasil dari 5+3?</td>
                                <td className="p-2 border-r">6</td>
                                <td className="p-2 border-r">8</td>
                                <td className="p-2 border-r">10</td>
                                <td className="p-2 border-r">12</td>
                                <td className="p-2 border-r font-extrabold text-emerald-700">B</td>
                                <td className="p-2 border-r text-indigo-600">10</td>
                                <td className="p-2 border-r text-slate-500">None</td>
                                <td className="p-2 border-r text-slate-400">-</td>
                                <td className="p-2 text-slate-500">Sans</td>
                              </tr>
                              <tr className="border-b bg-slate-50/50">
                                <td className="p-2 border-r font-bold text-purple-700">PilihanGandaKompleks</td>
                                <td className="p-2 border-r text-slate-700 font-semibold text-xs whitespace-nowrap">Manakah bilangan genap?</td>
                                <td className="p-2 border-r">2</td>
                                <td className="p-2 border-r">3</td>
                                <td className="p-2 border-r">4</td>
                                <td className="p-2 border-r">5</td>
                                <td className="p-2 border-r font-extrabold text-emerald-700">A,C</td>
                                <td className="p-2 border-r text-indigo-600">10</td>
                                <td className="p-2 border-r text-slate-500">None</td>
                                <td className="p-2 border-r text-slate-400">-</td>
                                <td className="p-2 text-slate-500">Sans</td>
                              </tr>
                              <tr className="border-b bg-white">
                                <td className="p-2 border-r font-bold text-teal-700">PilihanAsosiatif</td>
                                <td className="p-2 border-r text-slate-700 font-semibold text-xs whitespace-nowrap">Kombinasi nilai x + y = 5:</td>
                                <td className="p-2 border-r">(1) x=2, y=3</td>
                                <td className="p-2 border-r">(2) x=1, y=4</td>
                                <td className="p-2 border-r">(3) x=3, y=2</td>
                                <td className="p-2 border-r">(4) x=0, y=0</td>
                                <td className="p-2 border-r font-extrabold text-emerald-700">1,2,3</td>
                                <td className="p-2 border-r text-indigo-600">15</td>
                                <td className="p-2 border-r text-slate-500">None</td>
                                <td className="p-2 border-r text-slate-400">-</td>
                                <td className="p-2 text-slate-500">Mono</td>
                              </tr>
                              <tr className="bg-slate-50/50">
                                <td className="p-2 border-r font-bold text-amber-700">SebabAkibat</td>
                                <td className="p-2 border-r text-slate-700 font-semibold text-xs whitespace-nowrap">Sistem organ manusia sangat kompleks...</td>
                                <td className="p-2 border-r">Manusia memiliki jantung 4 ruang.</td>
                                <td className="p-2 border-r">Jantung bertugas memompa darah ke seluruh tubuh.</td>
                                <td className="p-2 border-r text-slate-300">Kosongkan</td>
                                <td className="p-2 border-r text-slate-300">Kosongkan</td>
                                <td className="p-2 border-r font-extrabold text-emerald-700">BENAR,BENAR,YA</td>
                                <td className="p-2 border-r text-indigo-600">10</td>
                                <td className="p-2 border-r text-slate-500">Image</td>
                                <td className="p-2 border-r text-indigo-600">https://image.com/anatomy.jpg</td>
                                <td className="p-2 text-slate-500">Serif</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>

                    {importErrors.length > 0 && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-700 max-h-36 overflow-y-auto">
                        <span className="font-bold flex items-center gap-1.5 text-red-800">
                          <AlertCircle className="w-4 h-4" /> Peringatan / Error Import:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {importErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Question Editor section */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                  <Edit3 className="w-5 h-5 text-slate-400" />
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">Editor Butir Soal</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Pertanyaan / Stimulus Utama *</label>
                    
                    {/* Rich Formatting Toolbar (Google Forms style) */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-lg border border-slate-200">
                      {/* Font Preset Selector */}
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Font:</span>
                        <select
                          value={qFontPreset}
                          onChange={(e) => setQFontPreset(e.target.value as any)}
                          className="text-[10px] font-bold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
                        >
                          <option value="Sans">Default Sans</option>
                          <option value="Serif">Elegant Serif</option>
                          <option value="Grotesk">Modern Grotesk</option>
                          <option value="Mono">Tech Monospace</option>
                        </select>
                      </div>

                      <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

                      {/* Formatting buttons */}
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('**', '**')}
                        title="Tebalkan Teks (Bold)"
                        className="p-1 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition font-black text-xs px-2 cursor-pointer border border-slate-200 bg-white"
                      >
                        B
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('*', '*')}
                        title="Miringkan Teks (Italic)"
                        className="p-1 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition italic text-xs px-2.5 cursor-pointer border border-slate-200 bg-white"
                      >
                        I
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('__', '__')}
                        title="Garis Bawah (Underline)"
                        className="p-1 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition underline text-xs px-2 cursor-pointer border border-slate-200 bg-white"
                      >
                        U
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('`', '`')}
                        title="Teks Kode / Monospace"
                        className="p-1 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition font-mono text-xs px-1.5 cursor-pointer border border-slate-200 bg-white"
                      >
                        &lt;/&gt;
                      </button>

                      <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

                      <button
                        type="button"
                        onClick={() => {
                          const linkText = prompt("Masukkan Teks Tautan (Contoh: Buka Website Pembelajaran):", "Buka Website");
                          if (linkText === null) return;
                          const linkUrl = prompt("Masukkan URL / Tautan Tujuan (Contoh: https://...):", "https://");
                          if (!linkUrl) return;
                          setQText(prev => prev + ` [${linkText}](${linkUrl}) `);
                        }}
                        title="Sematkan Link / Tautan"
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition text-[10px] font-extrabold cursor-pointer border border-slate-200 bg-white flex items-center gap-1"
                      >
                        🔗 Link
                      </button>

                      <button
                        type="button"
                        onClick={() => setQText(prev => prev + '\n- Item 1\n- Item 2')}
                        title="Tambah Daftar Poin (List)"
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition text-[10px] font-extrabold cursor-pointer border border-slate-200 bg-white flex items-center gap-1"
                      >
                        • Daftar
                      </button>

                      <button
                        type="button"
                        onClick={() => setQText(prev => prev + '\n\n[Paragraf Baru]\n')}
                        title="Tambah Paragraf Baru"
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded transition text-[10px] font-extrabold cursor-pointer border border-slate-200 bg-white flex items-center gap-1"
                      >
                        ¶ Paragraf
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Tulis stimulus teks, narasi, atau pertanyaan utama..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />

                    {/* LIVE RENDER PREVIEW (NEW) */}
                    {qText && (
                      <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-2xs">
                        <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wider uppercase">Live Preview Hasil Tampilan Soal:</span>
                        <div className="mt-2 text-slate-900 leading-relaxed border-l-2 border-indigo-400 pl-2.5">
                          {renderFormattedText(qText, qFontPreset)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">Jenis Soal *</label>
                    <select
                      value={currentQType}
                      onChange={(e) => setCurrentQType(e.target.value as QuestionType)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-indigo-900"
                    >
                      <option value="PilihanGanda">1. Pilihan Ganda Standar</option>
                      <option value="PilihanGandaKompleks">2. Pilihan Ganda Kompleks (Multi)</option>
                      <option value="PilihanAsosiatif">3. Pilihan Asosiatif (Kombinasi 1,2,3,4)</option>
                      <option value="SebabAkibat">4. Pilihan Sebab-Akibat</option>
                      <option value="Uraian">5. Uraian (Esai)</option>
                    </select>
                  </div>
                </div>

                {/* PILIHAN MEDIA & BOBOT SKOR (NEW) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3.5 bg-slate-100/50 rounded-xl border border-slate-200/50">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">Sematkan Media</label>
                    <select
                      value={qMediaType}
                      onChange={(e) => setQMediaType(e.target.value as 'Image' | 'Video' | 'Audio' | 'None')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="None">Tanpa Media (Teks Saja)</option>
                      <option value="Image">🖼️ Gambar / Ilustrasi</option>
                      <option value="Video">🎥 Video Pembelajaran</option>
                      <option value="Audio">🔊 Audio / Suara / Listening</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold mb-1 text-slate-700">Tautan / URL Media {qMediaType !== 'None' && '*'}</label>
                    <input
                      type="url"
                      disabled={qMediaType === 'None'}
                      placeholder={
                        qMediaType === 'None'
                          ? "Pilih opsi media terlebih dahulu..."
                          : qMediaType === 'Image'
                          ? "https://contoh.com/gambar.jpg"
                          : qMediaType === 'Video'
                          ? "https://youtube.com/embed/... atau .mp4"
                          : "https://contoh.com/audio.mp3"
                      }
                      required={qMediaType !== 'None'}
                      value={qMediaUrl}
                      onChange={(e) => setQMediaUrl(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-mono disabled:bg-slate-50 disabled:text-slate-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">Bobot Skor Soal *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.1"
                      placeholder="Contoh: 10 atau 2.5"
                      value={qScore}
                      onChange={(e) => setQScore(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:outline-hidden text-indigo-700"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight">Bisa berupa angka desimal (e.g., 2.5), genap, atau ganjil sesuai bobot kesulitan.</p>
                  </div>
                </div>

                {/* DYNAMIC SOAL PARAMETERS */}
                {currentQType === 'PilihanGanda' && (
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500">Parameter Pilihan Ganda Tunggal (Pilih Satu Jawaban Benar)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {pgOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400 text-xs">{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pgOptions];
                              newOpts[idx] = e.target.value;
                              setPgOptions(newOpts);
                            }}
                            className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-xs"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-slate-700">Kunci Jawaban Benar:</span>
                      <select
                        value={pgCorrect}
                        onChange={(e) => setPgCorrect(e.target.value)}
                        className="border border-slate-200 rounded px-2 py-0.5 text-xs font-bold"
                      >
                        {pgOptions.map((_, idx) => (
                          <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {currentQType === 'PilihanGandaKompleks' && (
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500">Parameter Pilihan Ganda Kompleks (Centang Semua Pilihan Yang Benar)</p>
                    <div className="space-y-2">
                      {pgkOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={pgkCorrects[idx]}
                            onChange={(e) => {
                              const newCorrects = [...pgkCorrects];
                              newCorrects[idx] = e.target.checked;
                              setPgkCorrects(newCorrects);
                            }}
                            className="text-indigo-600"
                          />
                          <input
                            type="text"
                            placeholder={`Pilihan Opsi ${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...pgkOptions];
                              newOpts[idx] = e.target.value;
                              setPgkOptions(newOpts);
                            }}
                            className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQType === 'PilihanAsosiatif' && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg text-slate-600 text-[10px] leading-relaxed">
                      <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <p>
                        Siswa akan disajikan 4 pernyataan berangka (1, 2, 3, 4). Sistem Penilaian ANBK di Apps Script secara otomatis menghitung kunci jawaban kombinasi:<br />
                        <strong>A</strong> (1,2,3 benar) | <strong>B</strong> (1,3 benar) | <strong>C</strong> (2,4 benar) | <strong>D</strong> (hanya 4 benar) | <strong>E</strong> (semua benar).
                      </p>
                    </div>
                    <div className="space-y-2">
                      {asoStatements.map((st, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={asoCorrects[idx]}
                            onChange={(e) => {
                              const newCorrects = [...asoCorrects];
                              newCorrects[idx] = e.target.checked;
                              setAsoCorrects(newCorrects);
                            }}
                            className="text-indigo-600"
                          />
                          <input
                            type="text"
                            value={st}
                            onChange={(e) => {
                              const newSts = [...asoStatements];
                              newSts[idx] = e.target.value;
                              setAsoStatements(newSts);
                            }}
                            className="w-full px-2.5 py-1 border border-slate-200 rounded-md text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQType === 'SebabAkibat' && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg text-slate-600 text-[10px] leading-relaxed">
                      <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <p>
                        Ujian Sebab-Akibat mengevaluasi dua komponen pernyataan. Kunci pilihan akhir dihitung otomatis di backend Apps Script:<br />
                        <strong>A:</strong> Keduanya Benar & saling berhubungan Kausalitas • <strong>B:</strong> Keduanya Benar tapi tidak ada hubungan • <strong>C:</strong> Pernyataan Benar, Alasan Salah • <strong>D:</strong> Pernyataan Salah, Alasan Benar • <strong>E:</strong> Keduanya Salah.
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Pernyataan Pertama (Sebab):</label>
                        <input
                          type="text"
                          value={saStatement}
                          onChange={(e) => setSaStatement(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                        />
                        <label className="flex items-center gap-1.5 mt-1 cursor-pointer font-semibold text-indigo-700">
                          <input
                            type="checkbox"
                            checked={saStatementTrue}
                            onChange={(e) => setSaStatementTrue(e.target.checked)}
                          />
                          Pernyataan ini BENAR secara ilmiah
                        </label>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">Pernyataan Kedua (Alasan):</label>
                        <input
                          type="text"
                          value={saReason}
                          onChange={(e) => setSaReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md"
                        />
                        <label className="flex items-center gap-1.5 mt-1 cursor-pointer font-semibold text-indigo-700">
                          <input
                            type="checkbox"
                            checked={saReasonTrue}
                            onChange={(e) => setSaReasonTrue(e.target.checked)}
                          />
                          Alasan ini BENAR secara ilmiah
                        </label>
                      </div>

                      {saStatementTrue && saReasonTrue && (
                        <div>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-700">
                            <input
                              type="checkbox"
                              checked={saCausality}
                              onChange={(e) => setSaCausality(e.target.checked)}
                            />
                            Kedua pernyataan memiliki hubungan Sebab-Akibat yang logis
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddQuestionToExam}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-xs"
                  >
                    {editingQuestionIndex !== null 
                      ? `Perbarui Soal #${editingQuestionIndex + 1}` 
                      : `Tambahkan Soal ini ke ${isQuestionBankMode ? 'Bank Soal' : 'Paket Ujian'}`}
                  </button>
                  {editingQuestionIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestionIndex(null);
                        setQText('');
                        setPgOptions(['', '', '', '']);
                        setPgkOptions(['', '', '', '']);
                        setPgkCorrects([false, false, false, false]);
                        setAsoCorrects([false, false, false, false]);
                        setQMediaType('None');
                        setQMediaUrl('');
                        setQScore(10);
                        setQFontPreset('Sans');
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-xs"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </div>
              
            </div>
            {/* END LEFT COLUMN */}

            {/* RIGHT COLUMN: Nav & Review */}
            <div className="xl:col-span-4 space-y-6 lg:space-y-8">
              <div className="lg:sticky lg:top-24 space-y-6 lg:space-y-8 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                {/* Question Navigation / Progress */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-extrabold text-slate-800 text-sm">Progress Rencana Soal</h4>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {examQuestions.length} / {targetQuestionCount} Terisi
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: Math.max(targetQuestionCount, examQuestions.length) }).map((_, idx) => {
                      const isFilled = idx < examQuestions.length;
                      return (
                        <div 
                          key={idx}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                            isFilled ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-300 text-slate-400'
                          }`}
                          title={isFilled ? `Soal #${idx + 1} Terisi` : `Slot Soal #${idx + 1} Kosong`}
                        >
                          {idx + 1}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* QUESTIONS LIST REVIEW */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 flex flex-col relative overflow-hidden" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                  <h4 className="font-black text-slate-900 text-sm tracking-widest uppercase mb-4 shrink-0 mt-2 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-500" /> Daftar Soal Terbuat ({examQuestions.length} Butir)
                  </h4>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {examQuestions.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center h-full">
                        <Database className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-500">Belum ada soal dimasukkan.</p>
                        <p className="text-xs text-slate-400 mt-1">Gunakan Editor Butir Soal untuk mengisi.</p>
                      </div>
                    ) : (
                      examQuestions.map((q, idx) => (
                        <div key={q.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start gap-4 hover:border-indigo-100 transition">
                          <div className="text-xs space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md text-[10px]">
                                Soal #{idx + 1} ({q.type})
                              </span>
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-md text-[10px]">
                                Bobot: {q.score !== undefined ? q.score : 10}
                              </span>
                              {q.mediaType && q.mediaType !== 'None' && (
                                <span className="bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md text-[10px] flex items-center gap-1">
                                  {q.mediaType === 'Image' ? '🖼️' : q.mediaType === 'Video' ? '🎥' : '🔊'} {q.mediaType}
                                </span>
                              )}
                            </div>
                            <div className="font-medium text-slate-900 leading-relaxed text-[13px]">
                              {renderFormattedText(q.questionText, q.fontPreset)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditQuestion(idx)}
                              className="text-amber-500 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Soal"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* MODAL PRINT PREVIEW LAPORAN RESMI SEKOLAH */}
      {printModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header / Action Bar Modal (Tidak ikutan ter-print) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Printer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Pratinjau Dokumen Cetak Laporan KBM</h3>
                  <p className="text-xs text-slate-400">Dokumen siap cetak dalam format resmi sekolah (A4 Landscape)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPrintModalData({ isOpen: false, title: '', subtitle: '', entries: [] });
                    setJournalSubTab('settings');
                  }}
                  className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Ubah Nama Kepala Sekolah / Kop Surat"
                >
                  <Settings className="w-4 h-4" /> Ubah Kop & Kepsek
                </button>
                <button
                  type="button"
                  onClick={() => generateAndOpenPrintWindow(printModalData.entries, printModalData.title, printModalData.subtitle)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Buka Jendela Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExportJournalRecap(printModalData.entries, printModalData.title)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Unduh Excel
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalData({ isOpen: false, title: '', subtitle: '', entries: [] })}
                  className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl transition cursor-pointer ml-2"
                  title="Tutup Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Laporan Kertas Resmi (Tampilan Kertas A4) */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100/60 grow">
              <div className="bg-white max-w-5xl mx-auto p-8 sm:p-12 shadow-md rounded-xl border border-slate-300 text-slate-900">
                {/* Kop Surat Sekolah */}
                <div className="relative border-b-4 border-double border-slate-900 pb-4 mb-6 flex items-center justify-between">
                  <img 
                    src={SCHOOL_LOGO_BASE64} 
                    alt="Logo Sekolah" 
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain absolute left-0 top-1/2 -translate-y-1/2" 
                  />
                  <div className="text-center w-full px-16 sm:px-24">
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">{schoolIdentity.header1}</h1>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 mt-0.5">{schoolIdentity.header2}</h1>
                    <h2 className="text-lg sm:text-2xl font-black text-indigo-950 uppercase tracking-tight mt-1">{schoolIdentity.schoolName}</h2>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">{schoolIdentity.address}</p>
                  </div>
                </div>

                {/* Judul Dokumen */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-black underline uppercase tracking-wide text-slate-900">{printModalData.title}</h3>
                  <p className="text-xs font-bold text-slate-600 mt-1">{printModalData.subtitle}</p>
                </div>

                {/* Info Metadata */}
                <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs font-bold mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-normal">Nama Guru Mapel:</span> <span className="text-indigo-900 font-extrabold">{currentTeacher.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-normal">Total Sesi Terangkum:</span> <span className="text-emerald-700 font-extrabold">{printModalData.entries.length} Sesi Pertemuan</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-normal">Tanggal Dicetak:</span> <span className="text-slate-800">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Tabel Laporan */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 uppercase font-extrabold text-[11px] tracking-wider divide-x divide-slate-400">
                        <th className="border border-slate-400 p-2 text-center w-10">No</th>
                        <th className="border border-slate-400 p-2 w-28">Hari & Tanggal</th>
                        <th className="border border-slate-400 p-2 text-center w-20">Jam Ke</th>
                        <th className="border border-slate-400 p-2 w-36">Kelas & Mapel</th>
                        <th className="border border-slate-400 p-2">Topik & Capaian Pembelajaran</th>
                        <th className="border border-slate-400 p-2 text-center w-28">Presensi</th>
                        <th className="border border-slate-400 p-2 w-48">Siswa Tidak Hadir</th>
                        <th className="border border-slate-400 p-2 w-36">Catatan KBM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {printModalData.entries.map((j, idx) => {
                        const cls = classes.find(c => c.id === j.classId)?.name || j.classId;
                        const subj = subjects.find(s => s.id === j.subjectId)?.name || j.subjectId;
                        const hadir = j.attendance.filter(a => a.status === 'Hadir').length;
                        const { sakitNames, izinNames, alpaNames } = getAbsentStudentDetails(j);
                        const hari = getDayNameIndo(j.date);
                        const jamStr = (j.startPeriod && j.endPeriod) ? `Jam Ke ${j.startPeriod} - ${j.endPeriod}` : '-';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 divide-x divide-slate-300 align-top">
                            <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-slate-300 p-2 whitespace-nowrap">
                              <span className="font-extrabold text-indigo-900 block">{hari}</span>
                              <span className="text-[11px] text-slate-600">{formatDateToDDMMYYYY(j.date)}</span>
                            </td>
                            <td className="border border-slate-300 p-2 text-center font-bold text-purple-900">{jamStr}</td>
                            <td className="border border-slate-300 p-2">
                              <span className="font-extrabold text-slate-900 block">{cls}</span>
                              <span className="text-[11px] text-slate-600">{subj}</span>
                            </td>
                            <td className="border border-slate-300 p-2">
                              <span className="font-bold text-slate-900 block">{j.topic}</span>
                              {j.learningObjectives && <span className="text-[10px] text-slate-500 block mt-0.5">TP: {j.learningObjectives}</span>}
                            </td>
                            <td className="border border-slate-300 p-2 text-center font-mono font-extrabold text-[11px]">
                              <span className="text-emerald-700">{hadir}H</span> / <span className="text-blue-600">{sakitNames.length}S</span> / <span className="text-amber-600">{izinNames.length}I</span> / <span className="text-red-600">{alpaNames.length}A</span>
                            </td>
                            <td className="border border-slate-300 p-2 text-[11px]">
                              {sakitNames.length === 0 && izinNames.length === 0 && alpaNames.length === 0 ? (
                                <span className="text-emerald-700 font-bold">✅ Semua Hadir (100%)</span>
                              ) : (
                                <div className="space-y-1">
                                  {sakitNames.length > 0 && <div className="text-blue-900"><b>🤒 Sakit ({sakitNames.length}):</b> {sakitNames.join(', ')}</div>}
                                  {izinNames.length > 0 && <div className="text-amber-900"><b>📩 Izin ({izinNames.length}):</b> {izinNames.join(', ')}</div>}
                                  {alpaNames.length > 0 && <div className="text-red-900"><b>❌ Alpa ({alpaNames.length}):</b> {alpaNames.join(', ')}</div>}
                                </div>
                              )}
                            </td>
                            <td className="border border-slate-300 p-2 text-[11px] text-slate-700">
                              {j.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Kolom Tanda Tangan Resmi */}
                <div className="mt-12 grid grid-cols-2 gap-8 text-xs font-medium text-slate-800 page-break-inside-avoid">
                  <div className="text-center">
                    <p>Mengetahui,<br/>Kepala Sekolah</p>
                    <div className="h-20"></div>
                    <p className="font-extrabold underline text-slate-950">{schoolIdentity.principalName}</p>
                    <p className="text-[11px] text-slate-500">NIP. {schoolIdentity.principalNip}</p>
                  </div>
                  <div className="text-center">
                    <p>{schoolIdentity.cityLocation}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mapel,</p>
                    <div className="h-20"></div>
                    <p className="font-extrabold underline text-slate-950">{currentTeacher.name}</p>
                    <p className="text-[11px] text-slate-500">NIP. {currentTeacher.nip || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* MODAL UPLOAD MODUL AJAR */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {editingModuleId ? 'Edit Info Perangkat Pembelajaran' : 'Unggah Perangkat Pembelajaran'}
              </h3>
              <button
                onClick={() => {
                  setShowModuleModal(false);
                  resetModuleForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModuleForm} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Judul Perangkat Pembelajaran</label>
                  <input
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={e => setModuleTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    placeholder="Contoh: Perangkat Pembelajaran BAB 1 - Sistem Tata Surya"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Pilih Kelas</label>
                    <select
                      required
                      value={moduleClassId}
                      onChange={e => setModuleClassId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- Kelas --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Mata Pelajaran</label>
                    <select
                      required
                      value={moduleSubjectId}
                      onChange={e => setModuleSubjectId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- Mapel --</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {!editingModuleId && (
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">File Perangkat Pembelajaran (.pdf, .doc, .docx, .xls)</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={e => setModuleFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {uploading && (
                <div className="bg-indigo-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-indigo-700">
                    <span>Mengunggah file...</span>
                    <span>{Math.round(moduleUploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/50 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${moduleUploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setShowModuleModal(false);
                    resetModuleForm();
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {uploading ? 'Menyimpan...' : 'Simpan Perangkat Pembelajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT SCHEDULE NOTE */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                {editingScheduleId ? 'Edit Jadwal & Catatan Kelas' : 'Tambah Jadwal Mengajar Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleNote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari Mengajar *</label>
                  <select
                    value={schedDay}
                    onChange={(e: any) => setSchedDay(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jum'at">Jum'at</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Tujuan *</label>
                  <select
                    required
                    value={schedClass}
                    onChange={(e) => setSchedClass(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {sortedClasses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Ekstrakurikuler / Lainnya">Ekstrakurikuler / Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Pemilihan Jam Ke Pembelajaran (Bisa Pilih > 3 Jam Tanpa Tampilan Waktu Jam) */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="block text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" /> Pilih Jam Pembelajaran *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Klik nomor jam di bawah (opsional bebas pilih, mendukung lebih dari 3 jam tanpa tampilan waktu jam).
                    </p>
                  </div>
                  {selectedJams.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSelectedJams([]); setSchedJam(''); }}
                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer shrink-0"
                    >
                      Reset Pilihan
                    </button>
                  )}
                </div>

                {/* Tombol Interaktif Jam 1 - 10 */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = selectedJams.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleToggleJam(num)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-400/50'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300'
                        }`}
                        title={`Jam Ke ${num}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Preset Rentang Jam Cepat */}
                <div className="pt-2 border-t border-indigo-100/70 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-extrabold text-indigo-900 mr-1 uppercase tracking-wider">Preset Cepat:</span>
                  {[
                    { label: 'Jam 1 - 2 (2 Jam)', nums: [1, 2] },
                    { label: 'Jam 1 - 3 (3 Jam)', nums: [1, 2, 3] },
                    { label: 'Jam 1 - 4 (4 Jam)', nums: [1, 2, 3, 4] },
                    { label: 'Jam 3 - 5 (3 Jam)', nums: [3, 4, 5] },
                    { label: 'Jam 4 - 6 (3 Jam)', nums: [4, 5, 6] },
                    { label: 'Jam 6 - 8 (3 Jam)', nums: [6, 7, 8] },
                    { label: 'Jam 1 - 6 (6 Jam)', nums: [1, 2, 3, 4, 5, 6] },
                    { label: 'Full Proyek (8 Jam)', nums: [1, 2, 3, 4, 5, 6, 7, 8] },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSetPresetJams(preset.nums)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-[11px] font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Input Text Hasil Formasi / Manual */}
                <div className="pt-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hasil Keterangan Jam (Bisa diedit manual jika perlu):</label>
                  <input
                    type="text"
                    required
                    placeholder="Pilih jam di atas atau ketik manual..."
                    value={schedJam}
                    onChange={(e) => {
                      setSchedJam(e.target.value);
                      setSelectedJams(parseJamsFromText(e.target.value));
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Lab</label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Kelas VII-A / Lab Komputer"
                  value={schedRoom}
                  onChange={(e) => setSchedRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Khusus & Agenda Mengajar di Kelas</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Materi Bab 3 (Tata Negara), pengumpulan tugas proyek, persiapan Ulangan Harian..."
                  value={schedNote}
                  onChange={(e) => setSchedNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Jadwal & Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD ANNOUNCEMENT / NOTIFIKASI */}
      {showAddAnnModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" /> Kirim Notifikasi & Catatan Kepada Siswa
              </h3>
              <button
                onClick={() => setShowAddAnnModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700">Judul Informasi / Catatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 📢 Persiapan Ulangan Harian Bab Aljabar / Tugas PR Halaman 45"
                  value={annTitleInput}
                  onChange={(e) => setAnnTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700">Sasaran Siswa Penerima</label>
                  <select
                    value={annTargetType}
                    onChange={(e) => setAnnTargetType(e.target.value as 'all' | 'class')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="all">🌐 Seluruh Siswa (Semua Kelas)</option>
                    <option value="class">🎯 Khusus Kelas Tertentu</option>
                  </select>
                </div>

                {annTargetType === 'class' && (
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">Pilih Kelas Sasaran</label>
                    <select
                      value={annTargetClass}
                      onChange={(e) => setAnnTargetClass(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    >
                      {sortedClasses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700">Tingkat Prioritas Notifikasi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnnPriority('normal')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      annPriority === 'normal' ? 'bg-blue-50 text-blue-700 border-blue-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    ℹ️ Informasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnPriority('penting')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      annPriority === 'penting' ? 'bg-amber-50 text-amber-800 border-amber-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    ⭐ Penting
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnPriority('mendesak')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      annPriority === 'mendesak' ? 'bg-rose-50 text-rose-800 border-rose-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    🚨 Mendesak
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700">Isi Pesan Catatan / Informasi Untuk Siswa *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi pesan atau arahan yang perlu dibaca dan diketahui oleh siswa saat mereka membuka beranda..."
                  value={annContentInput}
                  onChange={(e) => setAnnContentInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddAnnModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer font-extrabold"
                >
                  <Send className="w-4 h-4" /> Kirim Sekarang Ke Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS KONFIRMASI */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-center text-lg">Hapus {itemToDelete.type}?</h3>
            <p className="text-slate-500 text-sm text-center mt-2 leading-relaxed">
              Anda yakin ingin menghapus <strong>"{itemToDelete.name}"</strong>? Data yang sudah dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (itemToDelete.type === 'Materi' && onDeleteMaterial) onDeleteMaterial(itemToDelete.id);
                  if (itemToDelete.type === 'Ujian' && onDeleteExam) onDeleteExam(itemToDelete.id);
                  if (itemToDelete.type === 'Bank Soal' && onDeleteQuestionBank) onDeleteQuestionBank(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-200 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT FOLDER */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Buat Folder Baru</h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Nama Folder</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="Contoh: Modul Semester 1"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-sm shadow-indigo-200"
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAGIKAN MODULE */}
      {showShareModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <form onSubmit={handleShareModuleSubmit}>
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Bagikan Perangkat / Folder</h3>
                    <p className="text-xs text-slate-500">Kirim salinan ke guru lain</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowShareModuleModal(false); setShareModuleId(null); }}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Pilih Guru Tujuan</label>
                  <select
                    required
                    value={shareModuleTargetTeacher}
                    onChange={e => setShareModuleTargetTeacher(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-sm"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {teachers.filter(t => t.id !== currentTeacher.id).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowShareModuleModal(false); setShareModuleId(null); }}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!shareModuleTargetTeacher}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-sm shadow-indigo-200"
                  >
                    Kirim Bagikan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GANTI NAMA */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Ganti Nama</h3>
              <button
                type="button"
                onClick={() => setShowRenameModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRenameItemSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Nama Baru</label>
                <input
                  type="text"
                  required
                  value={showRenameModal.name}
                  onChange={e => setShowRenameModal({ ...showRenameModal, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-sm shadow-indigo-200"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUAT / EDIT FOLDER TUGAS */}
      {showAssignFolderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                {assignModalMode === 'create' ? 'Buat Folder Tugas Baru' : 'Edit Nama Folder'}
              </h3>
              <button
                onClick={() => setShowAssignFolderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!assignFolderTitleInput.trim()) return;

              if (assignModalMode === 'create' && onSaveAssignmentFolder) {
                onSaveAssignmentFolder({
                  title: assignFolderTitleInput.trim(),
                  type: 'folder',
                  parentId: currentAssignFolderId,
                  teacherId: currentTeacher.id,
                  teacherName: currentTeacher.name
                });
                toast.success('Folder Tugas berhasil dibuat!');
              } else if (assignModalMode === 'edit' && editingAssignId && onUpdateAssignmentFolder) {
                const existing = (assignmentFolders || []).find(f => f.id === editingAssignId);
                if (existing) {
                  onUpdateAssignmentFolder({
                    ...existing,
                    title: assignFolderTitleInput.trim()
                  });
                  toast.success('Nama Folder berhasil diperbarui!');
                }
              }

              setShowAssignFolderModal(false);
              setAssignFolderTitleInput('');
              setEditingAssignId(null);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Folder *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Folder Tugas Semester 1 / Bab 1 Aljabar"
                  value={assignFolderTitleInput}
                  onChange={(e) => setAssignFolderTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAssignFolderModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUAT / EDIT TUGAS (GDRIVE) */}
      {showAssignItemModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {assignModalMode === 'create' ? 'Buat Tugas Pengumpulan Siswa' : 'Edit Detail Tugas'}
              </h3>
              <button
                onClick={() => setShowAssignItemModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!assignItemTitleInput.trim() || !assignClassIdInput || !assignSubjectIdInput) {
                toast.error('Lengkapi Judul, Kelas, dan Mata Pelajaran');
                return;
              }

              if (assignModalMode === 'create' && onSaveAssignmentFolder) {
                onSaveAssignmentFolder({
                  title: assignItemTitleInput.trim(),
                  type: 'assignment',
                  parentId: currentAssignFolderId,
                  classId: assignClassIdInput,
                  subjectId: assignSubjectIdInput,
                  teacherId: currentTeacher.id,
                  teacherName: currentTeacher.name,
                  dueDate: assignDueDateInput || undefined,
                  description: assignDescInput.trim() || undefined,
                  gdriveFolderUrl: assignGDriveUrlInput.trim() || `https://drive.google.com/drive/folders/smpn1beji_${Math.random().toString(36).substring(7)}`
                });
                toast.success('Tugas Pembelajaran baru berhasil ditambahkan!');
              } else if (assignModalMode === 'edit' && editingAssignId && onUpdateAssignmentFolder) {
                const existing = (assignmentFolders || []).find(f => f.id === editingAssignId);
                if (existing) {
                  onUpdateAssignmentFolder({
                    ...existing,
                    title: assignItemTitleInput.trim(),
                    classId: assignClassIdInput,
                    subjectId: assignSubjectIdInput,
                    dueDate: assignDueDateInput || undefined,
                    description: assignDescInput.trim() || undefined,
                    gdriveFolderUrl: assignGDriveUrlInput.trim() || existing.gdriveFolderUrl
                  });
                  toast.success('Detail Tugas berhasil diperbarui!');
                }
              }

              setShowAssignItemModal(false);
              setAssignItemTitleInput('');
              setAssignClassIdInput('');
              setAssignSubjectIdInput('');
              setAssignDueDateInput('');
              setAssignDescInput('');
              setAssignGDriveUrlInput('');
              setEditingAssignId(null);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tugas Laporan Praktikum Photosynthesis"
                  value={assignItemTitleInput}
                  onChange={(e) => setAssignItemTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Sasaran *</label>
                  <select
                    value={assignClassIdInput}
                    onChange={(e) => setAssignClassIdInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {sortedClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran *</label>
                  <select
                    value={assignSubjectIdInput}
                    onChange={(e) => setAssignSubjectIdInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tenggat Waktu / Deadline (Opsional)</label>
                <input
                  type="datetime-local"
                  value={assignDueDateInput}
                  onChange={(e) => setAssignDueDateInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Petunjuk & Instukri Tugas</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan petunjuk pengerjaan tugas untuk siswa..."
                  value={assignDescInput}
                  onChange={(e) => setAssignDescInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Folder Google Drive Tempat Tugas Siswa (GDrive)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={assignGDriveUrlInput}
                  onChange={(e) => setAssignGDriveUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono text-blue-700 focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Masukkan URL folder Google Drive milik Anda di mana siswa akan diarahkan untuk mengunggah file tugas. Jika dikosongkan, sistem akan membuat link folder terstruktur secara otomatis.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAssignItemModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Detail Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSPEKSI PENGUMPULAN SISWA */}
      {selectedSubmissionsAssign && (() => {
        const targetClass = classes.find(c => c.id === selectedSubmissionsAssign.classId);
        const classStudents = students.filter(s => s.className === targetClass?.name || s.classId === targetClass?.id);
        const taskSubs = (assignmentSubmissions || []).filter(s => s.assignmentFolderId === selectedSubmissionsAssign.id);

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl p-6 space-y-5 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    {targetClass?.name || 'Seluruh Kelas'}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-1">
                    Rekapitulasi Pengumpulan: {selectedSubmissionsAssign.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Siswa: {classStudents.length} • Dikumpulkan: {taskSubs.length} Siswa
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmissionsAssign(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {classStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Tidak ada data siswa terdaftar di kelas ini.</p>
                ) : (
                  classStudents.map(st => {
                    const sub = taskSubs.find(s => s.studentId === st.id);
                    const currentGrade = feedbackGradeInput[sub?.id || ''] || { grade: sub?.grade || 100, feedback: sub?.feedback || '' };

                    return (
                      <div
                        key={st.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          sub ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                              sub ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {st.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">{st.name}</h4>
                              <p className="text-[11px] text-slate-500">NIS: {st.nis} • Kelas: {st.className || targetClass?.name || '-'}</p>
                            </div>
                          </div>

                          <div>
                            {sub ? (
                              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Dikumpulkan ({new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-extrabold rounded-full">
                                ⏳ Belum Mengumpulkan
                              </span>
                            )}
                          </div>
                        </div>

                        {sub && (
                          <div className="mt-3 pt-3 border-t border-emerald-100/80 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              {sub.submissionType === 'direct_file' ? (
                                <div className="flex items-center gap-2 bg-emerald-100/80 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                                  <span className="px-2 py-0.5 bg-emerald-700 text-white font-black text-[10px] rounded-md uppercase">
                                    {sub.fileType || 'FILE'}
                                  </span>
                                  <span className="truncate max-w-[200px]">{sub.fileName || 'Berkas Tugas'}</span>
                                  {sub.fileSize && <span className="text-[10px] text-emerald-700">({sub.fileSize})</span>}
                                  <a
                                    href={sub.fileUrl}
                                    download={sub.fileName || 'Tugas_Siswa'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition flex items-center gap-1 text-[11px]"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Unduh / Buka File
                                  </a>
                                </div>
                              ) : (
                                sub.fileUrl && (
                                  <a
                                    href={sub.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> Buka Link Google Drive
                                  </a>
                                )
                              )}

                              {sub.notes && (
                                <p className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200 flex-1">
                                  "Catatan Siswa: {sub.notes}"
                                </p>
                              )}
                            </div>

                            {/* Nilai & Feedback Form */}
                            <div className="bg-white p-3 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-end sm:items-center gap-3">
                              <div className="w-24">
                                <label className="block text-[10px] font-black text-slate-500 uppercase">Nilai (0-100)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={currentGrade.grade}
                                  onChange={(e) => {
                                    setFeedbackGradeInput({
                                      ...feedbackGradeInput,
                                      [sub.id]: { ...currentGrade, grade: Number(e.target.value) }
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                />
                              </div>

                              <div className="flex-1 w-full">
                                <label className="block text-[10px] font-black text-slate-500 uppercase">Feedback / Catatan Evaluasi Guru</label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Kerja bagus! Hasil analisis praktikum sangat detail."
                                  value={currentGrade.feedback}
                                  onChange={(e) => {
                                    setFeedbackGradeInput({
                                      ...feedbackGradeInput,
                                      [sub.id]: { ...currentGrade, feedback: e.target.value }
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateAssignmentSubmission) {
                                    onUpdateAssignmentSubmission({
                                      ...sub,
                                      grade: currentGrade.grade,
                                      feedback: currentGrade.feedback,
                                      status: 'Dinilai'
                                    });
                                    toast.success(`Nilai untuk ${st.name} berhasil disimpan!`);
                                  }
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
                              >
                                Simpan Nilai
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL TEACHER LIVE PRESENTATION REAL-TIME SYNC CONTROL */}
      {(activeLiveMaterial || livePresentation?.active) && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black animate-pulse shadow-md">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-black rounded-full uppercase tracking-wider">
                      🔴 PRESENTASI LAB KOMPUTER REAL-TIME
                    </span>
                    <span className="text-xs text-slate-300 font-bold">
                      Pengontrol: {currentTeacher.name}
                    </span>
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-white mt-0.5">
                    {activeLiveMaterial?.title || livePresentation?.materialTitle}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateLivePresentation) {
                      onUpdateLivePresentation({
                        id: 'active_session',
                        materialId: '',
                        materialTitle: '',
                        teacherId: currentTeacher.id,
                        teacherName: currentTeacher.name,
                        currentSlide: 1,
                        totalSlides: 1,
                        active: false,
                        startedAt: ''
                      });
                    }
                    setActiveLiveMaterial(null);
                    toast.success('Mode Presentasi Lab Komputer dihentikan.');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Hentikan Presentasi Sync</span>
                </button>
              </div>
            </div>

            {/* Presentation Interactive Canvas with Pointer & Scroll Tracking */}
            <div 
              className="flex-1 bg-slate-950 p-2 sm:p-4 relative flex flex-col items-center justify-center overflow-hidden cursor-crosshair group"
            >
              {(() => {
                const currentMat = activeLiveMaterial || materials.find(m => m.id === livePresentation?.materialId);
                const currentUrl = currentMat?.fileUrl || '';
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
                  if (sId) embedUrl = `https://docs.google.com/presentation/d/${sId}/embed?start=false&loop=false&delayms=3000#slide=${liveSlideNum}`;
                } else if (currentUrl.includes('docs.google.com/document/d/')) {
                  const dId = currentUrl.split('/d/')[1]?.split('/')[0];
                  if (dId) embedUrl = `https://docs.google.com/document/d/${dId}/pub?embedded=true`;
                } else if (currentUrl.toLowerCase().endsWith('.pdf') || currentUrl.toLowerCase().includes('.pdf?')) {
                  embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentUrl)}&embedded=true#page=${liveSlideNum}`;
                }
                const isImg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(currentUrl) || currentUrl.startsWith('data:image/');

                // Split text content into paragraphs/slides if available
                const contentParagraphs = currentMat?.content ? currentMat.content.split(/\n\n|---/).filter(p => p.trim()) : [];
                const activeContentChunk = contentParagraphs.length > 0 
                  ? (contentParagraphs[Math.min(liveSlideNum - 1, contentParagraphs.length - 1)] || currentMat?.content)
                  : currentMat?.content;

                const handlePointerAndScrollUpdate = (xPct: number, yPct: number, scrollPct?: number) => {
                  setLiveLaserPointer({ x: xPct, y: yPct });
                  const now = Date.now();
                  if (now - lastLaserSyncRef.current > 75 && onUpdateLivePresentation) {
                    lastLaserSyncRef.current = now;
                    const currentMatTitle = activeLiveMaterial?.title || livePresentation?.materialTitle || '';
                    const currentMatId = activeLiveMaterial?.id || livePresentation?.materialId || '';
                    const currentTotal = Math.max(livePresentation?.totalSlides || 10, contentParagraphs.length || 10);

                    onUpdateLivePresentation({
                      id: 'active_session',
                      materialId: currentMatId,
                      materialTitle: currentMatTitle,
                      teacherId: currentTeacher.id,
                      teacherName: currentTeacher.name,
                      currentSlide: liveSlideNum,
                      totalSlides: currentTotal,
                      laserPointer: { x: xPct, y: yPct },
                      scrollPosition: scrollPct !== undefined ? scrollPct : (livePresentation?.scrollPosition || 0),
                      active: true,
                      startedAt: livePresentation?.startedAt || new Date().toISOString()
                    });
                  }
                };

                return (
                  <div 
                    ref={teacherContentRef}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
                      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
                      handlePointerAndScrollUpdate(x, y);
                    }}
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const maxScroll = target.scrollHeight - target.clientHeight;
                      const pct = maxScroll > 0 ? Math.round((target.scrollTop / maxScroll) * 100) : 0;
                      if (liveLaserPointer) {
                        handlePointerAndScrollUpdate(liveLaserPointer.x, liveLaserPointer.y, pct);
                      }
                    }}
                    className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-start text-center space-y-4 shadow-2xl relative overflow-y-auto"
                  >
                    {/* Laser Pointer Visual on Teacher Screen */}
                    {liveLaserPointer && (
                      <div
                        className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
                        style={{
                          left: `${liveLaserPointer.x}%`,
                          top: `${liveLaserPointer.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          <span className="absolute w-8 h-8 rounded-full bg-red-500/50 animate-ping" />
                          <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_15px_rgba(239,68,68,1)] flex items-center justify-center" />
                          <span className="absolute left-6 whitespace-nowrap bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md border border-red-400">
                            🔴 Laser Guru
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-800 rounded-full text-slate-300 text-xs font-bold border border-slate-700 shrink-0">
                      <Tv className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MODE LAB AKTIFF • SLIDE {liveSlideNum} DARI {Math.max(livePresentation?.totalSlides || 10, contentParagraphs.length || 10)}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white max-w-2xl shrink-0">
                      {currentMat?.title || activeLiveMaterial?.title || livePresentation?.materialTitle}
                    </h2>

                    {embedUrl ? (
                      <div className="w-full h-[55vh] max-w-4xl rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl my-2 shrink-0">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full border-0"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          title="Media Presentasi"
                        />
                      </div>
                    ) : isImg ? (
                      <div className="max-w-3xl max-h-[55vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl my-2 shrink-0">
                        <img src={currentUrl} alt="Slide Media" className="max-h-[50vh] object-contain mx-auto" />
                      </div>
                    ) : currentMat?.content ? (
                      <div className="w-full max-w-3xl text-sm text-slate-200 leading-relaxed text-left bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 shadow-inner space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2 text-xs text-amber-300 font-extrabold">
                          <span>📌 Bagian Slide / Paragraf {liveSlideNum}</span>
                          <span className="text-[10px] bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-800/60">Tersambung Real-time ke Layar Siswa</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-100 text-base leading-relaxed">
                          {activeContentChunk}
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-300 max-w-lg space-y-3">
                        <p className="text-xs">
                          Materi disinkronkan secara real-time ke seluruh layar komputer siswa yang login di lab.
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
                        <p className="text-[11px] text-amber-300 font-bold bg-amber-950/50 p-2.5 rounded-xl border border-amber-800/50">
                          💡 Geser kursor di area ini untuk menggerakkan laser pointer merah pada komputer tiap siswa.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Controller Footer Toolbar */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newSlide = Math.max(1, liveSlideNum - 1);
                    setLiveSlideNum(newSlide);
                    if (onUpdateLivePresentation) {
                      onUpdateLivePresentation({
                        id: 'active_session',
                        materialId: activeLiveMaterial?.id || livePresentation?.materialId || '',
                        materialTitle: activeLiveMaterial?.title || livePresentation?.materialTitle || '',
                        teacherId: currentTeacher.id,
                        teacherName: currentTeacher.name,
                        currentSlide: newSlide,
                        totalSlides: livePresentation?.totalSlides || 10,
                        active: true,
                        startedAt: livePresentation?.startedAt || new Date().toISOString()
                      });
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Slide Sebelumnya
                </button>

                <span className="font-mono text-xs font-black text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  Slide {liveSlideNum} / {livePresentation?.totalSlides || 10}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const total = livePresentation?.totalSlides || 10;
                    const newSlide = Math.min(total, liveSlideNum + 1);
                    setLiveSlideNum(newSlide);
                    if (onUpdateLivePresentation) {
                      onUpdateLivePresentation({
                        id: 'active_session',
                        materialId: activeLiveMaterial?.id || livePresentation?.materialId || '',
                        materialTitle: activeLiveMaterial?.title || livePresentation?.materialTitle || '',
                        teacherId: currentTeacher.id,
                        teacherName: currentTeacher.name,
                        currentSlide: newSlide,
                        totalSlides: total,
                        active: true,
                        startedAt: livePresentation?.startedAt || new Date().toISOString()
                      });
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  Slide Selanjutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MousePointer className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Laser Pointer Active • Real-Time Sync via Firestore</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
