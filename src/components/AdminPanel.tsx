import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import React, { useState, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { db } from '../firebase';
import { SCHOOL_LOGO_BASE64 } from '../assets/schoolLogo';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { restoreDatabaseBatch, addDocument } from '../firebaseSync';
import { 
  Teacher, Student, ClassItem, SubjectItem, JournalEntry, CheatLog, ExamSubmission, RegistrationRequest, SchoolConfig, GlobalAnnouncement, TeachingModule, QuestionBank, Material, Exam, CounselingReferral, CounselingSession, DailyCheckIn, NeedsAssessment, Sociometry, HomeVisit, CareerPlan, ManualAssessment, TeacherAnnouncement, ShareRequest
} from '../types';
import { 
  Users, BookOpen, GraduationCap, Calendar, Plus, Trash2, Search, Upload, ShieldAlert, Award, ArrowUpRight, UserCheck, Clock, CheckCircle, XCircle, Edit, Settings, FileSpreadsheet, Download, ArrowRight, KeyRound, MonitorSmartphone, BarChart, TrendingUp, FileText
, Send, ArrowLeft, Folder, X, Printer, Database, Save, RefreshCw, FileUp, FileDown, HardDrive, CheckCircle2, AlertTriangle, Layers, ShieldCheck, FileJson, Square, CheckSquare } from 'lucide-react';

interface AdminPanelProps {
  teachers: Teacher[];
  students: Student[];
  classes: ClassItem[];
  subjects: SubjectItem[];
  journals: JournalEntry[];
  questionBanks?: QuestionBank[];
  teachingModules?: TeachingModule[];
  materials?: Material[];
  exams?: Exam[];
  counselingReferrals?: CounselingReferral[];
  counselingSessions?: CounselingSession[];
  dailyCheckIns?: DailyCheckIn[];
  needsAssessments?: NeedsAssessment[];
  sociometries?: Sociometry[];
  homeVisits?: HomeVisit[];
  careerPlans?: CareerPlan[];
  manualAssessments?: ManualAssessment[];
  announcements?: TeacherAnnouncement[];
  shareRequests?: ShareRequest[];
  cheatLogs: CheatLog[];
  submissions: ExamSubmission[];
  registrations?: RegistrationRequest[];
  schoolConfig?: SchoolConfig;
  onUpdateSchoolConfig?: (config: SchoolConfig) => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onDeleteTeacher: (id: string) => void;
  onAddSubject?: (subjectName: string) => void;
  onDeleteSubject?: (id: string) => void;
  onUpdateSubject?: (subject: SubjectItem) => void;
  onAddClass?: (className: string) => void;
  onDeleteClass?: (id: string) => void;
  onUpdateClass?: (cls: ClassItem) => void;
  onAddStudent?: (student: Omit<Student, 'id'>) => void;
  onDeleteStudent?: (id: string) => void;
  onUpdateTeacher?: (teacher: Teacher) => void;
  onUpdateStudent?: (student: Student) => void;
  onBulkAddStudents?: (students: Omit<Student, 'id'>[]) => void;
  onApproveRegistration?: (id: string, asAdmin?: boolean) => void;
  onToggleTeacherAdmin?: (teacherId: string) => void;
  onRejectRegistration?: (id: string) => void;
  onDeleteRegistration?: (id: string) => void;
  onDeleteCheatLog?: (id: string) => void;
  onClearCheatLogsBatch?: (ids: string[]) => void;
  globalAnnouncements?: GlobalAnnouncement[];
  onAddGlobalAnnouncement?: (ann: Omit<GlobalAnnouncement, 'id' | 'createdAt'>) => void;
  onDeleteGlobalAnnouncement?: (id: string) => void;
  onShareToTeacher?: (req: any) => void;
}

export default function AdminPanel({
  teachers,
  students,
  classes,
  subjects,
  journals,
  questionBanks = [],
  cheatLogs,
  submissions,
  registrations = [],
  teachingModules = [],
  materials = [],
  exams = [],
  counselingReferrals = [],
  counselingSessions = [],
  dailyCheckIns = [],
  needsAssessments = [],
  sociometries = [],
  homeVisits = [],
  careerPlans = [],
  manualAssessments = [],
  announcements = [],
  shareRequests = [],
  schoolConfig,
  onUpdateSchoolConfig,
  onAddTeacher,
  onDeleteTeacher,
  onAddSubject,
  onDeleteSubject,
  onUpdateSubject,
  onAddClass,
  onDeleteClass,
  onUpdateClass,
  onAddStudent,
  onDeleteStudent,
  onUpdateTeacher,
  onUpdateStudent,
  onBulkAddStudents,
  onApproveRegistration,
  onToggleTeacherAdmin,
  onRejectRegistration,
  onDeleteRegistration,
  onDeleteCheatLog,
  onClearCheatLogsBatch,
  globalAnnouncements = [],
  onAddGlobalAnnouncement,
  onDeleteGlobalAnnouncement,
  onShareToTeacher
}: AdminPanelProps) {

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
            // It's a file
            if (child.fileUrl === 'CHUNKED') {
              const q = query(collection(db, 'teachingModuleChunks'), where('moduleId', '==', child.id), orderBy('chunkIndex'));
              const snap = await getDocs(q);
              let base64 = '';
              snap.forEach(doc => {
                base64 += doc.data().data;
              });
              if (base64) {
                // Remove the data URL prefix e.g. "data:application/pdf;base64,"
                const base64Data = base64.split(';base64,').pop();
                if (base64Data) {
                  currentZipFolder.file(child.fileName, base64Data, { base64: true });
                }
              }
            } else if (child.fileUrl) {
              // Not chunked, fetch if possible or just skip if we can't fetch cross-origin
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

  const handleDownloadBankSoal = (bank: QuestionBank) => {
    try {
      const rows = bank.questions.map((q, index) => {
        let optionsDetail = '-';
        let answerStr = '-';

        if (q.type === 'PilihanGanda') {
          optionsDetail = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
          answerStr = q.correctAnswer;
        } else if (q.type === 'PilihanGandaKompleks') {
          optionsDetail = q.options.join('\n');
          answerStr = q.correctAnswers.join(', ');
        } else if (q.type === 'PilihanAsosiatif') {
          optionsDetail = q.statements.join('\n');
          answerStr = q.correctCombination.join(', ');
        } else if (q.type === 'SebabAkibat') {
          optionsDetail = `Pernyataan: ${q.statement}\nAlasan: ${q.reason}`;
          answerStr = `Pernyataan Benar: ${q.correctStatementTrue}, Alasan Benar: ${q.correctReasonTrue}, Sebab-Akibat: ${q.correctCausality}`;
        } else if (q.type === 'Uraian') {
          answerStr = q.correctAnswer || '-';
        }

        // strip html tags for cleaner excel output if you want, but simple strip is ok for now.
        const stripHtml = (html: string) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return doc.body.textContent || "";
        };

        return {
          'No': index + 1,
          'Tipe Soal': q.type,
          'Teks Soal': stripHtml(q.questionText),
          'Detail Pilihan/Pernyataan': optionsDetail,
          'Kunci Jawaban': answerStr,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      
      // Auto-size columns slightly
      ws['!cols'] = [
        { wch: 5 }, // No
        { wch: 20 }, // Tipe
        { wch: 50 }, // Soal
        { wch: 50 }, // Detail
        { wch: 30 }, // Kunci
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Soal');
      XLSX.writeFile(wb, `Bank_Soal_${bank.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      toast.success(`Bank Soal ${bank.title} berhasil diunduh (Excel)`);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengunduh Bank Soal');
    }
  };

  const handleDownloadBankSoalPDF = (bank: QuestionBank) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text(`Bank Soal: ${bank.title}`, 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Guru: ${getTeacherName(bank.teacherId)} | Mapel: ${getSubjectName(bank.subjectId)}`, 14, 30);
      
      const rows = bank.questions.map((q, index) => {
        let optionsDetail = '-';
        let answerStr = '-';

        if (q.type === 'PilihanGanda') {
          optionsDetail = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
          answerStr = q.correctAnswer;
        } else if (q.type === 'PilihanGandaKompleks') {
          optionsDetail = q.options.join('\n');
          answerStr = q.correctAnswers.join(', ');
        } else if (q.type === 'PilihanAsosiatif') {
          optionsDetail = q.statements.join('\n');
          answerStr = q.correctCombination.join(', ');
        } else if (q.type === 'SebabAkibat') {
          optionsDetail = `Pernyataan: ${q.statement}\nAlasan: ${q.reason}`;
          answerStr = `P: ${q.correctStatementTrue}, A: ${q.correctReasonTrue}, S-A: ${q.correctCausality}`;
        } else if (q.type === 'Uraian') {
          answerStr = q.correctAnswer || '-';
        }

        const stripHtml = (html: string) => {
          const d = new DOMParser().parseFromString(html, 'text/html');
          return d.body.textContent || "";
        };

        return [
          index + 1,
          q.type,
          stripHtml(q.questionText),
          optionsDetail,
          answerStr
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [['No', 'Tipe', 'Soal', 'Detail Pilihan', 'Jawaban']],
        body: rows,
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          2: { cellWidth: 60 },
          3: { cellWidth: 60 },
          4: { cellWidth: 25 },
        },
      });

      doc.save(`Bank_Soal_${bank.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success(`Bank Soal ${bank.title} berhasil diunduh (PDF)`);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengunduh PDF');
    }
  };

  const handleDownloadBankSoalDOCX = async (bank: QuestionBank) => {
    try {
      const stripHtml = (html: string) => {
        const d = new DOMParser().parseFromString(html, 'text/html');
        return d.body.textContent || "";
      };

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], width: { size: 5, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tipe Soal", bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Teks Soal", bold: true })] })], width: { size: 35, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Detail Pilihan/Pernyataan", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kunci Jawaban", bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          ],
        })
      ];

      bank.questions.forEach((q, index) => {
        let optionsDetail = '-';
        let answerStr = '-';

        if (q.type === 'PilihanGanda') {
          optionsDetail = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n');
          answerStr = q.correctAnswer;
        } else if (q.type === 'PilihanGandaKompleks') {
          optionsDetail = q.options.join('\n');
          answerStr = q.correctAnswers.join(', ');
        } else if (q.type === 'PilihanAsosiatif') {
          optionsDetail = q.statements.join('\n');
          answerStr = q.correctCombination.join(', ');
        } else if (q.type === 'SebabAkibat') {
          optionsDetail = `Pernyataan: ${q.statement}\nAlasan: ${q.reason}`;
          answerStr = `P: ${q.correctStatementTrue}, A: ${q.correctReasonTrue}, S-A: ${q.correctCausality}`;
        } else if (q.type === 'Uraian') {
          answerStr = q.correctAnswer || '-';
        }

        tableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(index + 1))] }),
            new TableCell({ children: [new Paragraph(q.type)] }),
            new TableCell({ children: [new Paragraph(stripHtml(q.questionText))] }),
            new TableCell({ children: optionsDetail.split('\n').map(line => new Paragraph(line)) }),
            new TableCell({ children: [new Paragraph(answerStr)] }),
          ]
        }));
      });

      const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: `Bank Soal: ${bank.title}`, bold: true, size: 32 })],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `Guru: ${getTeacherName(bank.teacherId)} | Mapel: ${getSubjectName(bank.subjectId)}`, size: 24 })],
              spacing: { after: 400 }
            }),
            table
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bank_Soal_${bank.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Bank Soal ${bank.title} berhasil diunduh (DOCX)`);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengunduh DOCX');
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'teachers' | 'students' | 'journals' | 'teaching_modules' | 'cheatlogs' | 'classes' | 'registrations' | 'config' | 'archived_students' | 'announcements' | 'bank_soal' | 'backup'>('dashboard');
  const [showAddAnnModal, setShowAddAnnModal] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', targetRole: 'All' as 'All' | 'Teacher' | 'Student' });
  const pendingCount = (registrations || []).filter(r => r.status === 'Pending').length;

  // Backup & Restore Database states
  const [backupOptions, setBackupOptions] = useState({
    includeAdminData: true,
    includeBkData: true,
    includeKbmData: true,
    includeExamData: true
  });
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<Record<string, any> | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressText, setRestoreProgressText] = useState('');
  const teacherExcelInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const exportPayload: Record<string, any> = {
      appName: schoolConfig?.headerAppName || 'E-Learning & Jurnal Database Backup',
      schoolName: schoolConfig?.headerSubtitle || 'SMPN 1 BEJI',
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    if (backupOptions.includeAdminData) {
      exportPayload.schoolConfig = schoolConfig;
      exportPayload.teachers = teachers;
      exportPayload.students = students;
      exportPayload.classes = classes;
      exportPayload.subjects = subjects;
      exportPayload.announcements = announcements;
      exportPayload.globalAnnouncements = globalAnnouncements;
      exportPayload.registrations = registrations;
    }

    if (backupOptions.includeBkData) {
      exportPayload.counselingReferrals = counselingReferrals;
      exportPayload.counselingSessions = counselingSessions;
      exportPayload.dailyCheckIns = dailyCheckIns;
      exportPayload.needsAssessments = needsAssessments;
      exportPayload.sociometries = sociometries;
      exportPayload.homeVisits = homeVisits;
      exportPayload.careerPlans = careerPlans;
    }

    if (backupOptions.includeKbmData) {
      exportPayload.journals = journals;
      exportPayload.teachingModules = teachingModules;
      exportPayload.materials = materials;
      exportPayload.questionBanks = questionBanks;
    }

    if (backupOptions.includeExamData) {
      exportPayload.exams = exams;
      exportPayload.submissions = submissions;
      exportPayload.manualAssessments = manualAssessments;
      exportPayload.cheatLogs = cheatLogs;
      exportPayload.shareRequests = shareRequests;
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `BACKUP_DATABASE_LENGKAP_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup database berhasil diunduh dalam format JSON!');
  };

  const handleFileSelectForRestore = (file: File) => {
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
        setRestorePreview(parsed);
        setRestoreFile(file);
        toast.success('Berkas backup berhasil dibaca. Silakan periksa ringkasan dan konfirmasi restorasi.');
      } catch (err) {
        console.error(err);
        toast.error('Gagal membaca berkas JSON. Format berkas tidak sesuai!');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restorePreview) return;
    
    if (restoreMode === 'overwrite') {
      const confirm = window.confirm('PERINGATAN! Anda memilih mode TIMPA TOTAL. Seluruh data pada koleksi terkait akan diperbarui/ditimpa dengan data backup. Apakah Anda yakin?');
      if (!confirm) return;
    }

    setIsRestoring(true);
    setRestoreProgressText('Sedang memproses restorasi batch ke database Firestore...');

    try {
      const count = await restoreDatabaseBatch(restorePreview, restoreMode);
      toast.success(`Restorasi database BERHASIL! ${count} data berhasil diperbarui/dipulihkan.`);
      setRestorePreview(null);
      setRestoreFile(null);
    } catch (err) {
      console.error('Error during restore:', err);
      toast.error('Gagal melakukan restorasi database. Silakan coba lagi.');
    } finally {
      setIsRestoring(false);
      setRestoreProgressText('');
    }
  };

  const handleImportTeachersExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!Array.isArray(data) || data.length === 0) {
          toast.error('Berkas Excel kosong atau format tidak sesuai');
          return;
        }

        let count = 0;
        for (const row of data) {
          const name = row['Nama Guru'] || row['nama'] || row['Nama'] || row['Name'];
          if (!name) continue;
          const nip = row['NIP'] || row['nip'] || '';
          const email = row['Email'] || row['email'] || `${String(name).toLowerCase().replace(/[^a-z0-9]/g, '')}@smp.sch.id`;
          const subject = row['Mata Pelajaran'] || row['subject'] || row['Mapel'] || 'Umum';

          const newTeacher: Teacher = {
            id: `t-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: String(name).trim(),
            nip: String(nip).trim(),
            email: String(email).trim(),
            subject: String(subject).trim(),
            photoUrl: ''
          };

          await addDocument('teachers', newTeacher);
          count++;
        }

        toast.success(`Berhasil mengimpor ${count} data Guru!`);
      } catch (err) {
        console.error('Error importing teachers Excel:', err);
        toast.error('Gagal mengimpor data Guru dari Excel.');
      } finally {
        if (teacherExcelInputRef.current) teacherExcelInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadStudentTemplate = () => {
    const sampleData = [
      { 'Nama Siswa': 'Ahmad Fauzi', 'NIS': '10250', 'Email': 'fauzi@smp.sch.id', 'ID Kelas': 'class-1' },
      { 'Nama Siswa': 'Bunga Citra', 'NIS': '10251', 'Email': 'bunga@smp.sch.id', 'ID Kelas': 'class-1' }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');
    XLSX.writeFile(wb, 'Template_Import_Data_Siswa.xlsx');
    toast.success('Template Excel Data Siswa berhasil diunduh!');
  };

  // Folder and Share states for Teaching Modules
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showShareModuleModal, setShowShareModuleModal] = useState(false);
  const [shareModuleId, setShareModuleId] = useState<string | null>(null);
  const [shareModuleTargetTeacher, setShareModuleTargetTeacher] = useState<string>('');

  // Cheat log states for Admin
  const [cheatLogClassFilter, setCheatLogClassFilter] = useState('ALL');
  const [cheatLogExamFilter, setCheatLogExamFilter] = useState('ALL');
  const [cheatLogDateFilter, setCheatLogDateFilter] = useState<'ALL' | 'TODAY'>('ALL');
  const [cheatLogSearchQuery, setCheatLogSearchQuery] = useState('');

  // Journal tab state for Admin
  const [journalSelectedTeacherId, setJournalSelectedTeacherId] = useState<string | null>(null);
  const [journalTeacherSearch, setJournalTeacherSearch] = useState('');
  const [journalClassFilter, setJournalClassFilter] = useState('ALL');
  const [journalSubjectFilter, setJournalSubjectFilter] = useState('ALL');
  const [journalQuery, setJournalQuery] = useState('');

  // Teaching Modules tab state for Admin
  const [tmSelectedTeacherId, setTmSelectedTeacherId] = useState<string | null>(null);
  const [tmTeacherSearch, setTmTeacherSearch] = useState('');
  const [tmClassFilter, setTmClassFilter] = useState('ALL');
  const [tmSubjectFilter, setTmSubjectFilter] = useState('ALL');
  const [tmQuery, setTmQuery] = useState('');
  
  const handleShareModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModuleId || !shareModuleTargetTeacher) return;
    const mod = teachingModules.find(m => m.id === shareModuleId);
    if (!mod) return;
    onShareToTeacher?.({
      itemId: mod.id,
      itemType: 'TeachingModule',
      itemTitle: mod.title,
      receiverId: shareModuleTargetTeacher,
      senderId: 'admin',
      senderName: 'Admin',
      status: 'Pending'
    });
    toast.success('Berhasil dikirim ke guru tujuan!');
    setShowShareModuleModal(false);
    setShareModuleId(null);
    setShareModuleTargetTeacher('');
  };

  
  // State for config editing
  const [localConfig, setLocalConfig] = useState<SchoolConfig>(schoolConfig || {
    logoUrl: '',
    headerAppName: 'E-LEARNING & JURNAL',
    headerSubtitle: 'SMPN 1 BEJI, Kab. Pasuruan',
    landingTopTag: 'Jurnal Mengajar dan E-Learning',
    landingTitle: 'Sistem Manajemen Mengajar & E-Learning SMPN 1 BEJI',
    landingDescription: 'Aplikasi Komprehensif untuk membantu Guru dan Siswa dalam Pembelajaran dan Materi serta Ujian/Tugas & Evaluasi.',
    footerText: '© 2026 E-Learning/E-Jurnal SMPN 1 BEJI, Kab. Pasuruan.'
  });

  // State for adding/editing teacher
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    nip: '',
    email: '',
    subject: '',
    photoUrl: '',
    isAdmin: false
  });
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for adding/editing student
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState<{name: string, nis: string, email: string, classId: string, noAbsen?: number, gender?: 'L' | 'P'}>({
    name: '',
    nis: '',
    email: '',
    classId: ''
  });

  // States for student Excel/CSV Import and Per-Siswa Promotion / Shuffle
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Array<{ name: string; nis: string; email: string; classId: string; className: string; noAbsen?: number; gender?: 'L' | 'P' }>>([]);
  const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false);
  const [promoteFromClassFilter, setPromoteFromClassFilter] = useState('ALL');
  const [promoteSearchQuery, setPromoteSearchQuery] = useState('');
  const [studentDestMap, setStudentDestMap] = useState<Record<string, string>>({});
  const [selectedPromoteStudentIds, setSelectedPromoteStudentIds] = useState<string[]>([]);
  const [batchTargetClassId, setBatchTargetClassId] = useState('');
  const [showSavePromoteConfirm, setShowSavePromoteConfirm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState('');

  // States for teacher Excel/CSV Import
  const [showTeacherImportModal, setShowTeacherImportModal] = useState(false);
  const [teacherImportText, setTeacherImportText] = useState('');
  const [teacherImportPreview, setTeacherImportPreview] = useState<Array<{ name: string; nip: string; email: string; subject: string }>>([]);

  // States for inline editing Class and Subject
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  // States for Reset Password Modal
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<{ id: string; name: string; identifier: string; role: 'Teacher' | 'Student'; currentPass: string; rawObject: Teacher | Student } | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

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

  const handleDownloadTemplate = () => {
    const rows = [
      { "No Absen": 1, "Nama Lengkap": "Budi Santoso", "NIS": "10260", "Email": "budi@smp.sch.id", "Kelas": "VII-A", "Jenis Kelamin (L/P)": "L" },
      { "No Absen": 2, "Nama Lengkap": "Siti Aminah", "NIS": "10261", "Email": "siti@smp.sch.id", "Kelas": "VII-A", "Jenis Kelamin (L/P)": "P" },
      { "No Absen": 3, "Nama Lengkap": "Dimas Anggara", "NIS": "10262", "Email": "dimas@smp.sch.id", "Kelas": "VII-A", "Jenis Kelamin (L/P)": "L" }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch: 10}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 10}, {wch: 20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'template_import_siswa.xlsx');
  };

  const handleParseImport = (textToParse: string) => {
    const lines = textToParse.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) {
      setImportPreview([]);
      return;
    }
    
    // Check headers
    const headerLine = lines[0].toLowerCase();
    const hasHeader = headerLine.includes('nama') || headerLine.includes('nis');
    const startIndex = hasHeader ? 1 : 0;
    
    // Check column format: "No Absen, Nama Lengkap, NIS, Email, Kelas" vs "Nama Lengkap, NIS, Email, Kelas"
    const isNoAbsenFirst = hasHeader && (headerLine.startsWith('no') || headerLine.startsWith('absen'));

    const result: Array<{ name: string; nis: string; email: string; classId: string; className: string; noAbsen?: number; gender?: 'L' | 'P' }> = [];

    for (let i = startIndex; i < lines.length; i++) {
      let line = lines[i];
      let parts: string[] = [];
      
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim().replace(/^"|"$/g, ''));
      } else if (line.includes(';')) {
        parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
      } else {
        const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
          if (match.index === regex.lastIndex) regex.lastIndex++;
          parts.push((match[1] ?? match[2] ?? '').trim());
        }
      }

      if (parts.length >= 2) {
        let noAbsen, name, nis, email, classNameInput, genderInput;

        if (isNoAbsenFirst) {
          noAbsen = parseInt(parts[0]) || undefined;
          name = parts[1] || `Siswa Baru ${i}`;
          nis = parts[2] || `${Math.floor(10000 + Math.random() * 90000)}`;
          email = parts[3] || `${nis}@smp.sch.id`;
          classNameInput = parts[4] || (classes[0]?.name || 'VII-A');
          genderInput = parts[5];
        } else {
          name = parts[0] || `Siswa Baru ${i}`;
          nis = parts[1] || `${Math.floor(10000 + Math.random() * 90000)}`;
          email = parts[2] || `${nis}@smp.sch.id`;
          classNameInput = parts[3] || (classes[0]?.name || 'VII-A');
          noAbsen = parseInt(parts[4]) || undefined;
          genderInput = parts[5];
        }
        
        let gender: 'L' | 'P' | undefined;
        if (genderInput) {
          const g = genderInput.trim().toUpperCase();
          if (g.startsWith('L')) gender = 'L';
          else if (g.startsWith('P')) gender = 'P';
        }

        const matchedClass = classes.find(c => c.name.toLowerCase() === classNameInput.toLowerCase()) || classes[0];
        const classId = matchedClass ? matchedClass.id : 'class-1';
        const className = matchedClass ? matchedClass.name : classNameInput;

        result.push({ name, nis, email, classId, className, noAbsen, gender });
      }
    }
    setImportPreview(result);
  };

  const processExcelOrCsv = (file: File, setText: (text: string) => void, parse: (text: string) => void) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
        setText(csv);
        parse(csv);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setText(text);
          parse(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUploadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelOrCsv(file, setImportText, handleParseImport);
  };

  const handleDownloadTeacherTemplate = () => {
    const rows = [
      { "Nama Lengkap": "Drs. H. Ahmad Fauzi M.Pd", "NIP": "197501012000121001", "Email": "ahmad.fauzi@smp.sch.id", "Mata Pelajaran": "Matematika, IPA" },
      { "Nama Lengkap": "Siti Nurhaliza S.Pd", "NIP": "198203152008012003", "Email": "siti.nurhaliza@smp.sch.id", "Mata Pelajaran": "Bahasa Indonesia" },
      { "Nama Lengkap": "Budi Gunawan M.Kom", "NIP": "198807122015041002", "Email": "budi.g@smp.sch.id", "Mata Pelajaran": "Informatika" }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch: 30}, {wch: 25}, {wch: 30}, {wch: 30}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
    XLSX.writeFile(wb, 'template_import_guru.xlsx');
  };

  const handleParseTeacherImport = (textToParse: string) => {
    const lines = textToParse.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) {
      setTeacherImportPreview([]);
      return;
    }
    const startIndex = lines[0].toLowerCase().includes('nama') || lines[0].toLowerCase().includes('nip') ? 1 : 0;
    const result: Array<{ name: string; nip: string; email: string; subject: string }> = [];

    for (let i = startIndex; i < lines.length; i++) {
      let line = lines[i];
      let parts: string[] = [];
      
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim().replace(/^"|"$/g, ''));
      } else if (line.includes(';')) {
        parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
      } else {
        const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
          if (match.index === regex.lastIndex) regex.lastIndex++;
          parts.push((match[1] ?? match[2] ?? '').trim());
        }
      }

      if (parts.length >= 2) {
        const name = parts[0] || `Guru Baru ${i}`;
        const nip = parts[1] || `198${Math.floor(10000000 + Math.random() * 90000000)}`;
        const email = parts[2] || `${nip}@smp.sch.id`;
        const subject = parts[3] || (subjects[0]?.name || 'Matematika');

        result.push({ name, nip, email, subject });
      }
    }
    setTeacherImportPreview(result);
  };

  const handleFileUploadTeacherImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelOrCsv(file, setTeacherImportText, handleParseTeacherImport);
  };

  const handleConfirmTeacherImport = () => {
    if (teacherImportPreview.length === 0) return;
    
    teacherImportPreview.forEach(item => {
      if (onAddSubject && item.subject) {
        (item.subject || '').split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed && !subjects.some(sub => (sub.name || '').toLowerCase() === trimmed.toLowerCase())) {
            onAddSubject(trimmed);
          }
        });
      }

      onAddTeacher({
        name: item.name,
        nip: item.nip,
        email: item.email || `${item.nip}@smp.sch.id`,
        subject: item.subject || 'Umum',
        photoUrl: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}-d1d0cf377fde?w=150&auto=format&fit=crop`
      });
    });

    toast(`Berhasil mengimport ${teacherImportPreview.length} data Guru beserta mata pelajarannya!`);
    setShowTeacherImportModal(false);
    setTeacherImportText('');
    setTeacherImportPreview([]);
  };

  // Simulated Google Drive File Upload
  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Simulate latency of DriveApp.createFile()
    setTimeout(() => {
      const simulatedDriveUrl = `https://drive.google.com/file/d/simulated_drive_${Math.random().toString(36).substring(7)}/view`;
      setNewTeacher(prev => ({ ...prev, photoUrl: simulatedDriveUrl }));
      setUploading(false);
    }, 1200);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.nip || !newTeacher.subject) return;

    onAddTeacher({
      name: newTeacher.name,
      nip: newTeacher.nip,
      email: newTeacher.email || `${newTeacher.nip}@smp.sch.id`,
      subject: newTeacher.subject,
      photoUrl: newTeacher.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
      isAdmin: newTeacher.isAdmin || false
    });

    // Reset Form
    setNewTeacher({
      name: '',
      nip: '',
      email: '',
      subject: '',
      photoUrl: '',
      isAdmin: false
    });
    setCustomSubject('');
    setShowSubjectInput(false);
    setShowAddModal(false);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nis || !newStudent.classId) return;

    if (onAddStudent) {
      onAddStudent({
        name: newStudent.name,
        nis: newStudent.nis,
        email: newStudent.email || `${newStudent.nis}@smp.sch.id`,
        classId: newStudent.classId,
        noAbsen: newStudent.noAbsen,
        gender: newStudent.gender
      });
    }

    // Reset Form
    setNewStudent({
      name: '',
      nis: '',
      email: '',
      classId: ''
    });
    setShowAddStudentModal(false);
  };

  // Helper resolvers
  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'N/A';
  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'N/A';
  const getTeacherName = (teacherId: string) => teachers.find(t => t.id === teacherId)?.name || 'N/A';
  const getStudentName = (studentId: string) => students.find(s => s.id === studentId)?.name || studentId;

  // Filters
  const filteredTeachers = teachers.filter(t => 
    (t.name || '').toLowerCase().includes(searchTeacher.toLowerCase()) || 
    t.nip.includes(searchTeacher) ||
    (t.subject || '').toLowerCase().includes(searchTeacher.toLowerCase())
  );

  const activeStudents = students.filter(s => !s.status || s.status === 'Aktif');
  const archivedStudents = students.filter(s => s.status === 'Lulus' || s.status === 'Pindah');

  const filteredStudents = activeStudents.filter(s => 
    (s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.nis.includes(searchStudent) ||
    getClassName(s.classId).toLowerCase().includes(searchStudent.toLowerCase())
  ).sort((a, b) => {
    // Sort by class name first
    const classA = getClassName(a.classId);
    const classB = getClassName(b.classId);
    if (classA !== classB) {
      return classA.localeCompare(classB);
    }
    // Then sort by noAbsen, if available
    if (a.noAbsen != null && b.noAbsen != null) return a.noAbsen - b.noAbsen;
    if (a.noAbsen != null) return -1;
    if (b.noAbsen != null) return 1;
    // Finally, sort by name
  


  return (a.name || '').localeCompare(b.name || '');
  });


  const exportClassExcel = (classId: string, className: string, studentsList: Student[]) => {
    if (studentsList.length === 0) {
      toast.error('Tidak ada siswa di kelas ini.');
      return;
    }
    
    const aoa = [
      ['DAFTAR NAMA AKUN BELAJAR'],
      ['SMPN 1 BEJI'],
      [`Kelas: ${className}`],
      [],
      ['No', 'Nama Lengkap', 'L/P', 'NIS (User)', 'Email (Pass)']
    ];

    studentsList.forEach((s, idx) => {
      aoa.push([
        (idx + 1).toString(),
        s.name,
        s.gender || '-',
        s.nis,
        s.email || '-'
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
    XLSX.writeFile(workbook, `Data_Siswa_${className.replace(/\s+/g, '_')}.xlsx`);
  };

  const printClassDocument = (classId: string, className: string, studentsList: Student[]) => {
    if (studentsList.length === 0) {
      toast.error('Tidak ada siswa di kelas ini.');
      return;
    }
    
    const rows = studentsList.map((s, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><b>${s.name}</b></td>
        <td style="text-align:center;">${s.gender || '-'}</td>
        <td style="text-align:center;">${s.nis}</td>
        <td>${s.email || '-'}</td>
      </tr>
    `).join('');

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Data Siswa</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 0; background: white; }
          
          /* Spacers for repeating margins */
          .spacer-top { height: 15mm; }
          .spacer-bottom { height: 15mm; }
          
          .content-wrapper { padding: 0 15mm; }

          .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 22px; margin: 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 1px; line-height: 1.15; }
          .header h2 { font-size: 22px; color: #2563eb; font-weight: 900; margin: 4px 0 0 0; letter-spacing: 1px; line-height: 1.15; }
          .header-divider { width: 60px; height: 4px; background-color: #3b82f6; margin: 8px auto; border-radius: 2px; }
          .header h3 { font-size: 15px; margin: 0; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.15; }
          
          .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .data-table thead { display: table-header-group; }
          .data-table tr { page-break-inside: avoid; }
          .data-table th, .data-table td { border: 1px solid #94a3b8; padding: 8px 10px; }
          .data-table th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-align: left; font-size: 12px; }
          
          .btn-print { background: #4f46e5; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
          
          .print-footer { position: fixed; bottom: 5mm; left: 15mm; right: 15mm; text-align: center; font-size: 11px; color: #64748b; padding-top: 5px; border-top: 1px solid #e2e8f0; }
          
          /* Main structural table that ensures margins on every page */
          .layout-table { width: 100%; border-collapse: collapse; border: none; }
          .layout-table > thead > tr > td, .layout-table > tbody > tr > td, .layout-table > tfoot > tr > td { border: none; padding: 0; }

          @media print {
            .no-print { display: none; }
          }
          @media screen {
            .print-footer { display: none; }
            body { padding: 20px; }
            .spacer-top, .spacer-bottom { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align:right; padding: 0 15mm;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
        </div>

        <table class="layout-table">
          <thead>
            <tr><td><div class="spacer-top"></div></td></tr>
          </thead>
          <tbody>
            <tr><td>
              <div class="content-wrapper">
                <div class="header" style="position: relative; display: flex; align-items: center; justify-content: center; min-height: 80px; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
                  <img src="${SCHOOL_LOGO_BASE64}" alt="Logo Sekolah" style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 72px; height: 72px; object-fit: contain;" />
                  <div style="text-align: center; width: 100%; padding-left: 80px; padding-right: 80px;">
                    <h1 style="font-size: 20px; margin: 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 1px; line-height: 1.15; font-weight: 800;">DAFTAR NAMA AKUN BELAJAR</h1>
                    <h2 style="font-size: 22px; color: #2563eb; font-weight: 900; margin: 4px 0 0 0; letter-spacing: 1px; line-height: 1.15;">SMPN 1 BEJI</h2>
                    <div class="header-divider"></div>
                    <h3 style="font-size: 15px; margin: 0; color: #475569; font-weight: 600; text-transform: uppercase;">Kelas: ${className}</h3>
                  </div>
                </div>
                
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width:50px;text-align:center;">No</th>
                      <th>Nama Lengkap</th>
                      <th style="width:50px;text-align:center;">L/P</th>
                      <th style="width:120px;text-align:center;">NIS (User)</th>
                      <th>Email (Pass)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
              </div>
            </td></tr>
          </tbody>
          <tfoot>
            <tr><td><div class="spacer-bottom"></div></td></tr>
          </tfoot>
        </table>

        <div class="print-footer">
          SMPN 1 BEJI
        </div>
      </body>
      </html>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlDocument);
      newWindow.document.close();
    }
  };

  const groupedStudents = useMemo(() => {
    const groups = {};
    classes.forEach(c => { groups[c.id] = []; });
    groups['unassigned'] = [];

    filteredStudents.forEach(s => {
      if (s.classId && groups[s.classId]) {
        groups[s.classId].push(s);
      } else {
        groups['unassigned'].push(s);
      }
    });
    return groups;
  }, [filteredStudents, classes]);

  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});

  const toggleGrade = (gradeId: string) => {
    setExpandedGrades(prev => ({ ...prev, [gradeId]: !prev[gradeId] }));
  };

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  const filteredArchivedStudents = archivedStudents.filter(s => 
    (s.name || '').toLowerCase().includes(searchStudent.toLowerCase()) || 
    s.nis.includes(searchStudent)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto" id="admin-panel-container">
      {/* Navigation Sidebar */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 lg:sticky lg:top-24 flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar z-10">
          <div className="px-3 pb-3 mb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Menu Admin</h3>
          </div>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">📊</span> Ringkasan Dasbor
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'registrations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span> Persetujuan Akun
          </div>
          {pendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse ${activeTab === 'registrations' ? 'bg-white text-indigo-600' : 'bg-emerald-500 text-white'}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">🧑‍🏫</span> Data Guru Pengajar
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">🎓</span> Data Siswa Terdaftar
        </button>
        <button
          onClick={() => setActiveTab('archived_students')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'archived_students'
              ? 'bg-slate-800 text-white shadow-md shadow-slate-300'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span className="text-lg">📁</span> Data Alumni / Keluar
        </button>
        <button
          onClick={() => setActiveTab('journals')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'journals'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">📝</span> Riwayat Jurnal Mengajar
        </button>
        <button
          onClick={() => setActiveTab('teaching_modules')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'teaching_modules'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">📑</span> Data Perangkat Pembelajaran
        </button>
        <button
          onClick={() => setActiveTab('bank_soal')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'bank_soal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg flex items-center justify-center w-[20px]"><Database className="w-5 h-5" /></span> Bank Soal Guru
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg">🏫</span> Manajemen Kelas & Mapel
        </button>
        <button
          onClick={() => setActiveTab('cheatlogs')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'cheatlogs'
              ? 'bg-red-600 text-white shadow-md shadow-red-200'
              : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🛡️</span> Deteksi Anti-Contek
          </div>
          {cheatLogs.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse ${activeTab === 'cheatlogs' ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>
              {cheatLogs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
          }`}
        >
          <span className="text-lg flex items-center justify-center w-[20px]"><MonitorSmartphone className="w-5 h-5" /></span> Pengaturan Sekolah / Tampilan
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <span className="text-lg flex items-center justify-center w-[20px]"><HardDrive className="w-5 h-5 text-emerald-500" /></span> Backup & Restorasi DB
        </button>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">

            {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Total Siswa</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{students.length}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Total Guru</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{teachers.length}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-amber-50 text-amber-600 p-4 rounded-xl">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Total Kelas</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{classes.length}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-4 rounded-xl">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Total Mapel</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{subjects.length}</h4>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Total Jurnal</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{journals.length}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-teal-50 text-teal-600 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Jurnal Hari Ini</p>
                <h4 className="text-3xl font-extrabold text-slate-800">
                  {journals.filter(j => new Date(j.date).toDateString() === new Date().toDateString()).length}
                </h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-orange-50 text-orange-600 p-4 rounded-xl">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Persetujuan Akun</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{pendingCount}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">Pelanggaran Ujian</p>
                <h4 className="text-3xl font-extrabold text-slate-800">{cheatLogs.length}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHERS TAB */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Data Guru Pengajar</h3>
              <p className="text-slate-500 text-xs">Kelola data guru pengajar, mapel yang diampu, dan akses login.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Cari guru..."
                  value={searchTeacher}
                  onChange={e => setSearchTeacher(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition"
                />
              </div>
              <button
                onClick={() => {
                  setTeacherImportText('');
                  setTeacherImportPreview([]);
                  setShowTeacherImportModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel / CSV</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-500">Nama Guru</th>
                  <th className="px-6 py-3 font-semibold text-slate-500">NIP/NUPTK</th>
                  <th className="px-6 py-3 font-semibold text-slate-500">Mata Pelajaran</th>
                  <th className="px-6 py-3 font-semibold text-slate-500">Hak Akses</th>
                  <th className="px-6 py-3 font-semibold text-slate-500 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {teachers.filter(t => t.name.toLowerCase().includes(searchTeacher.toLowerCase()) || t.nip.toLowerCase().includes(searchTeacher.toLowerCase())).map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-bold text-slate-900">{teacher.name}</td>
                    <td className="px-6 py-3 font-mono text-slate-600">{teacher.nip}</td>
                    <td className="px-6 py-3 text-slate-600">{teacher.subject}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => onToggleTeacherAdmin?.(teacher.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                          teacher.isAdmin
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-2xs'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                        title={teacher.isAdmin ? 'Akses Admin Aktif (Klik untuk cabut)' : 'Klik untuk berikan Akses Admin'}
                      >
                        <ShieldAlert className={`w-3.5 h-3.5 ${teacher.isAdmin ? 'text-purple-600' : 'text-slate-400'}`} />
                        {teacher.isAdmin ? '🛡️ Admin' : '+ Akses Admin'}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setResetTargetUser({
                              id: teacher.id,
                              name: teacher.name,
                              identifier: teacher.nip,
                              role: 'Teacher',
                              currentPass: teacher.password || teacher.email || teacher.nip,
                              rawObject: teacher
                            });
                            setNewPasswordValue(teacher.password || teacher.email || teacher.nip);
                            setShowResetPassModal(true);
                          }}
                          className="text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          title="Reset Password Login Guru"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTeacher(teacher);
                            setShowEditTeacherModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              message: 'Yakin ingin menghapus guru ini?',
                              onConfirm: () => onDeleteTeacher(teacher.id)
                            });
                          }}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                      Belum ada data guru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Pengaturan Sekolah & Tampilan</h3>
              <p className="text-slate-500 text-xs">Sesuaikan nama sekolah, password admin, deskripsi, dan teks di seluruh aplikasi.</p>
            </div>
            {onUpdateSchoolConfig && (
              <button 
                onClick={() => onUpdateSchoolConfig(localConfig)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Simpan Pengaturan
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Aplikasi (Header)</label>
                <input 
                  type="text" 
                  value={localConfig.headerAppName || ''} 
                  onChange={e => setLocalConfig({...localConfig, headerAppName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subjudul (Header)</label>
                <input 
                  type="text" 
                  value={localConfig.headerSubtitle || ''} 
                  onChange={e => setLocalConfig({...localConfig, headerSubtitle: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Label Atas (Landing Page)</label>
                <input 
                  type="text" 
                  value={localConfig.landingTopTag || ''} 
                  onChange={e => setLocalConfig({...localConfig, landingTopTag: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Logo (Opsional)</label>
                <input 
                  type="text" 
                  value={localConfig.logoUrl || ''} 
                  onChange={e => setLocalConfig({...localConfig, logoUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Utama (Landing Page)</label>
                <input 
                  type="text" 
                  value={localConfig.landingTitle || ''} 
                  onChange={e => setLocalConfig({...localConfig, landingTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Utama (Landing Page)</label>
                <textarea 
                  value={localConfig.landingDescription || ''} 
                  onChange={e => setLocalConfig({...localConfig, landingDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teks Footer</label>
                <input 
                  type="text" 
                  value={localConfig.footerText || ''} 
                  onChange={e => setLocalConfig({...localConfig, footerText: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Admin</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={localConfig.adminPassword || ''} 
                    onChange={e => setLocalConfig({...localConfig, adminPassword: e.target.value})}
                    placeholder="Kosongkan untuk menggunakan default (admin123)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Username admin selalu "admin". Ubah password ini untuk keamanan.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}

      {activeTab === 'announcements' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Pengumuman Global</h2>
              <p className="text-sm text-slate-500">Kirim pengumuman ke Guru atau Siswa.</p>
            </div>
            <button
              onClick={() => setShowAddAnnModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Pengumuman
            </button>
          </div>

          <div className="space-y-4">
            {globalAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-8">Belum ada pengumuman.</p>
            ) : (
              globalAnnouncements.map(ann => (
                <div key={ann.id} className="border border-slate-100 rounded-xl p-4 shadow-xs relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{ann.title}</h3>
                    <button
                      onClick={() => onDeleteGlobalAnnouncement?.(ann.id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                      Target: {ann.targetRole}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ann.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Data Siswa Terdaftar</h3>
              <p className="text-slate-500 text-xs">Kelola data seluruh siswa beserta kelasnya.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setImportText('');
                  setImportPreview([]);
                  setShowImportModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel / CSV</span>
              </button>
              <button
                onClick={() => {
                  setPromoteFromClassFilter('ALL');
                  setPromoteSearchQuery('');
                  const initialMap: Record<string, string> = {};
                  activeStudents.forEach(s => {
                    initialMap[s.id] = s.classId;
                  });
                  setStudentDestMap(initialMap);
                  setSelectedPromoteStudentIds([]);
                  setBatchTargetClassId('');
                  setShowBulkPromoteModal(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Naik / Acak Kelas Siswa (Per-Siswa)</span>
              </button>
              <button
                onClick={() => {
                  setDeleteClassId('');
                  setShowBulkDeleteModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Per Kelas</span>
              </button>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan Nama, NIS, atau Kelas..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Table list grouped by grade */}
          <div className="space-y-4">
            {[
              { id: 'VII', title: 'Kelas VII', match: (name) => name.toUpperCase().startsWith('VII') && !name.toUpperCase().startsWith('VIII') },
              { id: 'VIII', title: 'Kelas VIII', match: (name) => name.toUpperCase().startsWith('VIII') },
              { id: 'IX', title: 'Kelas IX', match: (name) => name.toUpperCase().startsWith('IX') },
              { id: 'Lainnya', title: 'Kelas Lainnya', match: (name) => {
                  const n = name.toUpperCase();
                  return !n.startsWith('VII') && !n.startsWith('VIII') && !n.startsWith('IX');
              }}
            ].map(grade => {
              const gradeClasses = classes.filter(c => grade.match(c.name)).sort((a, b) => a.name.localeCompare(b.name));
              if (gradeClasses.length === 0) return null;

              // Calculate total students in this grade
              let totalStudentsInGrade = 0;
              let matchSearch = false;
              gradeClasses.forEach(cls => {
                const classStudents = groupedStudents[cls.id] || [];
                totalStudentsInGrade += classStudents.length;
                if (classStudents.length > 0) matchSearch = true; // If search yields students in this class
              });

              if (totalStudentsInGrade === 0 && searchStudent !== '') return null;
              if (totalStudentsInGrade === 0 && searchStudent === '' && grade.id === 'Lainnya') return null; // Hide empty "Lainnya" if not searching

              const isGradeExpanded = expandedGrades[grade.id] || searchStudent !== '';

              return (
                <div key={grade.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {/* Grade Header */}
                  <div 
                    onClick={() => toggleGrade(grade.id)}
                    className="bg-indigo-50/50 hover:bg-indigo-50 px-6 py-5 flex items-center justify-between cursor-pointer transition border-b border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-xs">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-extrabold text-slate-800 text-base">{grade.title}</h3>
                        <p className="text-xs text-indigo-600 font-bold mt-0.5">{gradeClasses.length} Kelas • {totalStudentsInGrade} Siswa</p>
                      </div>
                    </div>
                    <div className="text-indigo-400 bg-white p-1.5 rounded-full shadow-xs border border-indigo-100">
                      {isGradeExpanded ? <XCircle className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Classes in Grade */}
                  {isGradeExpanded && (
                    <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4">
                      {gradeClasses.map(cls => {
                        const classStudents = groupedStudents[cls.id] || [];
                        if (classStudents.length === 0 && searchStudent !== '') return null;

                        const isExpanded = expandedClasses[cls.id] || searchStudent !== '';

                        return (
                          <div key={cls.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs transition-all hover:border-indigo-200">
                            <div 
                              onClick={() => toggleClass(cls.id)}
                              className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-bold text-slate-800 text-sm">Kelas {cls.name}</h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                  {classStudents.length} Siswa
                                </span>
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => exportClassExcel(cls.id, cls.name, classStudents)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                    title="Unduh Excel"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => printClassDocument(cls.id, cls.name, classStudents)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                    title="Cetak PDF"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="text-slate-400">
                                  {isExpanded ? <XCircle className="w-4 h-4 text-indigo-500" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-slate-100">
                                {classStudents.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                                      <thead className="bg-slate-50/80">
                                        <tr>
                                          <th className="px-5 py-2.5 font-semibold text-slate-500 text-center w-16">No</th>
                                          <th className="px-5 py-2.5 font-semibold text-slate-500">Nama Lengkap</th>
                                          <th className="px-5 py-2.5 font-semibold text-slate-500 text-center">L/P</th>
                                          <th className="px-5 py-2.5 font-semibold text-slate-500">NIS (Pass)</th>
                                          <th className="px-5 py-2.5 font-semibold text-slate-500">Email</th>
                                          <th className="px-5 py-2.5 font-semibold text-slate-500 text-right">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50 bg-white">
                                        {classStudents.map((siswa) => (
                                          <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                                            <td className="px-5 py-2.5 font-bold text-slate-700 text-center">{siswa.noAbsen || '-'}</td>
                                            <td className="px-5 py-2.5 font-bold text-slate-900">{siswa.name}</td>
                                            <td className="px-5 py-2.5 text-center text-slate-600 font-semibold">{siswa.gender || '-'}</td>
                                            <td className="px-5 py-2.5 font-mono font-medium text-slate-500">{siswa.nis}</td>
                                            <td className="px-5 py-2.5 text-slate-500 truncate max-w-[150px]">{siswa.email}</td>
                                            <td className="px-5 py-2.5 text-right">
                                              <div className="flex items-center justify-end gap-1">
                                                <button
                                                  onClick={() => {
                                                    setResetTargetUser({
                                                      id: siswa.id,
                                                      name: siswa.name,
                                                      identifier: siswa.nis,
                                                      role: 'Student',
                                                      currentPass: siswa.password || siswa.email || siswa.nis,
                                                      rawObject: siswa
                                                    });
                                                    setNewPasswordValue(siswa.password || siswa.email || siswa.nis);
                                                    setShowResetPassModal(true);
                                                  }}
                                                  className="text-amber-600 hover:text-amber-800 p-1.5 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                                  title="Reset Password"
                                                >
                                                  <KeyRound className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setEditingStudent(siswa);
                                                    setShowEditStudentModal(true);
                                                  }}
                                                  className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                                  title="Edit Data Siswa"
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </button>
                                                {onDeleteStudent && (
                                                  <button
                                                    onClick={() => {
                                                      setConfirmModal({
                                                        isOpen: true,
                                                        message: 'Yakin ingin menghapus siswa ini?',
                                                        onConfirm: () => onDeleteStudent(siswa.id)
                                                      });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                    title="Hapus Siswa"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="p-6 text-center text-slate-400 text-xs font-medium bg-white">
                                    Belum ada siswa di kelas ini.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {(groupedStudents['unassigned']?.length > 0) && (
              <div className="border border-red-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div 
                  onClick={() => toggleClass('unassigned')}
                  className="bg-red-50 hover:bg-red-100 px-6 py-4 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 text-red-700 p-2 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-red-800 text-sm">Tanpa Kelas / Kelas Telah Dihapus</h3>
                      <p className="text-xs text-red-500 font-medium">{groupedStudents['unassigned'].length} Siswa Terdaftar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => exportClassExcel('unassigned', 'Tanpa Kelas', groupedStudents['unassigned'])}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                        title="Unduh Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printClassDocument('unassigned', 'Tanpa Kelas', groupedStudents['unassigned'])}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                        title="Cetak PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-red-400">
                      {(expandedClasses['unassigned'] || searchStudent !== '') ? <XCircle className="w-5 h-5 text-red-500" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {(expandedClasses['unassigned'] || searchStudent !== '') && (
                  <div className="border-t border-red-100">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-500 text-center w-20">No Absen</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">Nama Lengkap</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 text-center">L/P</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">NIS (Password)</th>
                            <th className="px-6 py-3 font-semibold text-slate-500">Email</th>
                            <th className="px-6 py-3 font-semibold text-slate-500 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {groupedStudents['unassigned'].map((siswa) => (
                            <tr key={siswa.id} className="hover:bg-slate-50 transition">
                              <td className="px-6 py-3 font-bold text-slate-900 text-center">{siswa.noAbsen || '-'}</td>
                              <td className="px-6 py-3 font-bold text-slate-900">{siswa.name}</td>
                              <td className="px-6 py-3 text-center text-slate-600 font-semibold">{siswa.gender || '-'}</td>
                              <td className="px-6 py-3 font-mono font-semibold text-slate-600">{siswa.nis}</td>
                              <td className="px-6 py-3 text-slate-500">{siswa.email}</td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingStudent(siswa);
                                      setShowEditStudentModal(true);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                                    title="Edit Data Siswa / Naik Kelas"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  {onDeleteStudent && (
                                    <button
                                      onClick={() => onDeleteStudent(siswa.id)}
                                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition cursor-pointer"
                                      title="Hapus Siswa"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {filteredStudents.length === 0 && (
              <div className="border border-slate-100 rounded-xl p-12 text-center text-slate-400 bg-white">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                Tidak ada siswa yang cocok dengan pencarian Anda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ARCHIVED STUDENTS TAB */}
      {activeTab === 'archived_students' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Data Alumni & Siswa Pindah / Keluar</h3>
              <p className="text-slate-500 text-xs">Arsip backup data siswa yang telah lulus atau pindah. Anda dapat mengunduh data ini (Spreadsheet / CSV) sebagai rekam jejak untuk dicadangkan di Google Drive Anda.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = ['ID', 'Nama Lengkap', 'NIS', 'Email', 'Status', 'Riwayat Kelas Terakhir'];
                  const csvRows = [headers.join(',')];
                  filteredArchivedStudents.forEach(s => {
                    const row = [
                      s.id,
                      `"${s.name}"`,
                      s.nis,
                      s.email || '',
                      s.status || '',
                      `"${getClassName(s.classId)}"`
                    ];
                    csvRows.push(row.join(','));
                  });
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Backup_Siswa_Keluar_Lulus.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Download CSV ke Perangkat Anda. Dapat diimport langsung ke Google Spreadsheet untuk Backup."
              >
                <Download className="w-4 h-4" />
                <span>Export to CSV (Spreadsheet)</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan Nama atau NIS..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-500">Nama Lengkap</th>
                  <th className="px-6 py-3 font-semibold text-slate-500 text-center">L/P</th>
                  <th className="px-6 py-3 font-semibold text-slate-500">NIS</th>
                  <th className="px-6 py-3 font-semibold text-slate-500">Riwayat Kelas</th>
                  <th className="px-6 py-3 font-semibold text-slate-500">Status</th>
                  <th className="px-6 py-3 font-semibold text-slate-500 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredArchivedStudents.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition opacity-80">
                    <td className="px-6 py-3 font-bold text-slate-900">{siswa.name}</td>
                    <td className="px-6 py-3 text-center text-slate-600 font-semibold">{siswa.gender || '-'}</td>
                    <td className="px-6 py-3 font-mono font-semibold text-slate-600">{siswa.nis}</td>
                    <td className="px-6 py-3">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded">
                        {getClassName(siswa.classId)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`font-bold px-2.5 py-0.5 rounded ${siswa.status === 'Lulus' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                        {siswa.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStudent(siswa);
                            setShowEditStudentModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                          title="Kembalikan Status Aktif"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {onDeleteStudent && (
                          <button
                            onClick={() => {
                              onDeleteStudent(siswa.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredArchivedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Tidak ada riwayat siswa keluar atau lulus yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JOURNALS TAB */}
      {activeTab === 'journals' && (() => {
        // Build list of teachers with their journal entries
        const teacherMap: { [teacherId: string]: { teacherObj?: Teacher; entries: JournalEntry[] } } = {};

        // Initialize with known teachers
        teachers.forEach(t => {
          teacherMap[t.id] = { teacherObj: t, entries: [] };
        });

        // Add entries
        journals.forEach(entry => {
          if (!teacherMap[entry.teacherId]) {
            teacherMap[entry.teacherId] = { entries: [] };
          }
          teacherMap[entry.teacherId].entries.push(entry);
        });

        // Filter out teachers who match search/filter or have entries if not searching
        const teacherList = Object.keys(teacherMap).map(tId => {
          const tObj = teacherMap[tId].teacherObj;
          const entries = teacherMap[tId].entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const name = tObj ? tObj.name : getTeacherName(tId);
          const nip = tObj ? tObj.nip : '';
          const subject = tObj ? tObj.subject : '';
          return { teacherId: tId, teacherObj: tObj, name, nip, subject, entries };
        });

        // Filter teachers based on search query or class/subject filters
        const filteredTeachers = teacherList.filter(t => {
          const matchesName = journalTeacherSearch === '' || 
            t.name.toLowerCase().includes(journalTeacherSearch.toLowerCase()) || 
            t.nip.toLowerCase().includes(journalTeacherSearch.toLowerCase()) ||
            t.subject.toLowerCase().includes(journalTeacherSearch.toLowerCase());
          
          const matchesClass = journalClassFilter === 'ALL' || t.entries.some(e => e.classId === journalClassFilter);
          const matchesSubject = journalSubjectFilter === 'ALL' || t.entries.some(e => e.subjectId === journalSubjectFilter);

          return matchesName && matchesClass && matchesSubject;
        });

        const activeTeacherWithJournalsCount = teacherList.filter(t => t.entries.length > 0).length;
        const todayJournalsCount = journals.filter(j => new Date(j.date).toDateString() === new Date().toDateString()).length;

        // If a specific teacher is selected
        if (journalSelectedTeacherId) {
          const selectedData = teacherList.find(t => t.teacherId === journalSelectedTeacherId);
          const teacherName = selectedData ? selectedData.name : getTeacherName(journalSelectedTeacherId);
          const teacherObj = selectedData?.teacherObj;
          let teacherEntries = selectedData ? selectedData.entries : [];

          // Filter entries for this teacher if query or class filter is set
          if (journalQuery) {
            teacherEntries = teacherEntries.filter(e => 
              e.topic.toLowerCase().includes(journalQuery.toLowerCase()) ||
              (e.learningObjectives && e.learningObjectives.toLowerCase().includes(journalQuery.toLowerCase())) ||
              (e.notes && e.notes.toLowerCase().includes(journalQuery.toLowerCase()))
            );
          }
          if (journalClassFilter !== 'ALL') {
            teacherEntries = teacherEntries.filter(e => e.classId === journalClassFilter);
          }
          if (journalSubjectFilter !== 'ALL') {
            teacherEntries = teacherEntries.filter(e => e.subjectId === journalSubjectFilter);
          }

          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
              {/* Header with Back Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setJournalSelectedTeacherId(null);
                      setJournalQuery('');
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold rounded-xl transition flex items-center gap-2 text-xs shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Guru
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center shrink-0 border border-indigo-200">
                      {teacherName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                        {teacherName}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {teacherObj?.subject ? `Mata Pelajaran: ${teacherObj.subject}` : 'Guru Pengajar'} • NIP: {teacherObj?.nip || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs">
                    {selectedData?.entries.length || 0} Total Jurnal Mengajar
                  </span>
                </div>
              </div>

              {/* Sub Filter & Search inside selected teacher */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari materi / topik KBM..."
                    value={journalQuery}
                    onChange={(e) => setJournalQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={journalClassFilter}
                    onChange={(e) => setJournalClassFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>Kelas {c.name}</option>
                    ))}
                  </select>

                  <select
                    value={journalSubjectFilter}
                    onChange={(e) => setJournalSubjectFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Mapel</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Entries list for this teacher */}
              {teacherEntries.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-500 font-bold text-sm">Tidak ada riwayat jurnal yang sesuai filter</p>
                  <p className="text-xs text-slate-400 mt-1">Belum ada catatan KBM tersimpan untuk kriteria pencarian ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teacherEntries.map(entry => {
                    const presentList = (entry.attendance || []).filter(a => a.status === 'Hadir');
                    const sakitList = (entry.attendance || []).filter(a => a.status === 'Sakit');
                    const izinList = (entry.attendance || []).filter(a => a.status === 'Izin');
                    const alpaList = (entry.attendance || []).filter(a => a.status === 'Alpa');

                    return (
                      <div key={entry.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                                Kelas {getClassName(entry.classId)}
                              </span>
                              <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
                                {getSubjectName(entry.subjectId)}
                              </span>
                              {entry.startPeriod && entry.endPeriod && (
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                                  Jam Ke {entry.startPeriod} - {entry.endPeriod}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 font-semibold">{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-base mt-1">{entry.topic}</h4>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Presensi Kehadiran</span>
                            <span className="text-lg font-black text-indigo-700">
                              {presentList.length} <span className="text-xs font-bold text-slate-500">/ {entry.attendance.length} Hadir</span>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-3">
                            {entry.learningObjectives && (
                              <div className="space-y-1">
                                <p className="font-bold text-slate-700">🎯 Tujuan Pembelajaran (TP):</p>
                                <p className="text-indigo-950 font-semibold leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                  {entry.learningObjectives}
                                </p>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="font-bold text-slate-700">📝 Catatan KBM:</p>
                              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {entry.notes || 'Tidak ada catatan khusus.'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="font-bold text-slate-700">Rincian Presensi Kelas:</p>
                            <div className="grid grid-cols-4 gap-2 text-center font-bold">
                              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                <span className="block text-[10px] text-emerald-600 font-bold">Hadir</span>
                                <span className="text-base font-black">{presentList.length}</span>
                              </div>
                              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                                <span className="block text-[10px] text-blue-600 font-bold">Sakit</span>
                                <span className="text-base font-black">{sakitList.length}</span>
                              </div>
                              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                                <span className="block text-[10px] text-amber-600 font-bold">Izin</span>
                                <span className="text-base font-black">{izinList.length}</span>
                              </div>
                              <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                                <span className="block text-[10px] text-rose-600 font-bold">Alpa</span>
                                <span className="text-base font-black">{alpaList.length}</span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                              {sakitList.length === 0 && izinList.length === 0 && alpaList.length === 0 ? (
                                <p className="text-xs text-emerald-700 bg-emerald-50/80 p-2 rounded-lg font-bold border border-emerald-200 text-center">
                                  ✅ Seluruh siswa hadir dalam sesi ini (100%).
                                </p>
                              ) : (
                                <div className="space-y-1.5 text-xs">
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daftar Siswa Tidak Hadir:</p>
                                  {sakitList.length > 0 && (
                                    <div className="p-2 bg-blue-50 border border-blue-200 text-blue-950 rounded-lg shadow-2xs leading-relaxed">
                                      <span className="font-extrabold text-blue-700">🤒 Sakit ({sakitList.length}): </span>
                                      <span className="font-semibold">{sakitList.map(a => getStudentName(a.studentId)).join(', ')}</span>
                                    </div>
                                  )}
                                  {izinList.length > 0 && (
                                    <div className="p-2 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg shadow-2xs leading-relaxed">
                                      <span className="font-extrabold text-amber-700">📩 Izin ({izinList.length}): </span>
                                      <span className="font-semibold">{izinList.map(a => getStudentName(a.studentId)).join(', ')}</span>
                                    </div>
                                  )}
                                  {alpaList.length > 0 && (
                                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-950 rounded-lg shadow-2xs leading-relaxed">
                                      <span className="font-extrabold text-rose-700">❌ Alpa ({alpaList.length}): </span>
                                      <span className="font-semibold">{alpaList.map(a => getStudentName(a.studentId)).join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Default Main View: List of Teachers
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Riwayat Jurnal Mengajar Guru</h3>
                <p className="text-slate-500 text-xs mt-0.5">Pilih nama guru di bawah ini untuk melihat arsip lengkap log KBM dan presensi siswa.</p>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl text-indigo-900 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase block leading-none">Total Sesi Jurnal</span>
                    <span className="text-sm font-extrabold">{journals.length} Log</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl text-emerald-900 flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block leading-none">Guru Aktif</span>
                    <span className="text-sm font-extrabold">{activeTeacherWithJournalsCount} Guru</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-100 px-3.5 py-2 rounded-xl text-purple-900 flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-purple-600 font-bold uppercase block leading-none">Jurnal Hari Ini</span>
                    <span className="text-sm font-extrabold">{todayJournalsCount} Log</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama guru / NIP / mapel..."
                  value={journalTeacherSearch}
                  onChange={(e) => setJournalTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={journalClassFilter}
                  onChange={(e) => setJournalClassFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Kelas {c.name}</option>
                  ))}
                </select>

                <select
                  value={journalSubjectFilter}
                  onChange={(e) => setJournalSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Mapel</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Teachers */}
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-slate-500 font-bold text-sm">Tidak ada guru ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map(t => {
                  const entryCount = t.entries.length;
                  const latestEntry = t.entries[0];

                  return (
                    <div
                      key={t.teacherId}
                      onClick={() => setJournalSelectedTeacherId(t.teacherId)}
                      className="group bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-extrabold text-base flex items-center justify-center transition shrink-0">
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition leading-snug">
                                {t.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {t.subject ? `Mapel: ${t.subject}` : 'Guru Pengajar'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span>NIP: <strong className="text-slate-700">{t.nip || '-'}</strong></span>
                          {latestEntry && (
                            <span className="text-[11px] font-medium text-slate-400">
                              Terakhir: {new Date(latestEntry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          entryCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {entryCount} Sesi Jurnal
                        </span>

                        <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                          Lihat Riwayat →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* CHEATLOGS TAB */}
      
      {/* TEACHING MODULES TAB */}
      {activeTab === 'teaching_modules' && (() => {
        const modulesList = teachingModules || [];

        // Map teachers with their uploaded modules & folders
        const teacherMap: { [teacherId: string]: { teacherObj?: Teacher; modules: TeachingModule[] } } = {};

        // Initialize with known teachers
        teachers.forEach(t => {
          teacherMap[t.id] = { teacherObj: t, modules: [] };
        });

        // Add modules to map
        modulesList.forEach(mod => {
          if (!teacherMap[mod.teacherId]) {
            teacherMap[mod.teacherId] = { modules: [] };
          }
          teacherMap[mod.teacherId].modules.push(mod);
        });

        // Build teacher list
        const teacherList = Object.keys(teacherMap).map(tId => {
          const tObj = teacherMap[tId].teacherObj;
          const mods = teacherMap[tId].modules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const name = tObj ? tObj.name : (teachers.find(t => t.id === tId)?.name || 'Guru / Anonim');
          const nip = tObj ? tObj.nip : '';
          const subject = tObj ? tObj.subject : '';
          return { teacherId: tId, teacherObj: tObj, name, nip, subject, modules: mods };
        });

        // Filter teachers based on search query or class/subject filters
        const filteredTeachers = teacherList.filter(t => {
          const matchesName = tmTeacherSearch === '' ||
            t.name.toLowerCase().includes(tmTeacherSearch.toLowerCase()) ||
            t.nip.toLowerCase().includes(tmTeacherSearch.toLowerCase()) ||
            t.subject.toLowerCase().includes(tmTeacherSearch.toLowerCase());

          const matchesClass = tmClassFilter === 'ALL' || t.modules.some(m => m.classId === tmClassFilter);
          const matchesSubject = tmSubjectFilter === 'ALL' || t.modules.some(m => m.subjectId === tmSubjectFilter);

          return matchesName && matchesClass && matchesSubject;
        });

        const activeTeacherWithModulesCount = teacherList.filter(t => t.modules.length > 0).length;
        const totalFolderCount = modulesList.filter(m => m.type === 'folder').length;

        // If a specific teacher is selected (Drill-Down View)
        if (tmSelectedTeacherId) {
          const selectedData = teacherList.find(t => t.teacherId === tmSelectedTeacherId);
          const teacherName = selectedData ? selectedData.name : (teachers.find(t => t.id === tmSelectedTeacherId)?.name || 'Guru');
          const teacherObj = selectedData?.teacherObj;
          let allTeacherMods = selectedData ? selectedData.modules : [];

          // Filter modules for this teacher by class & subject if set
          if (tmClassFilter !== 'ALL') {
            allTeacherMods = allTeacherMods.filter(m => m.classId === tmClassFilter);
          }
          if (tmSubjectFilter !== 'ALL') {
            allTeacherMods = allTeacherMods.filter(m => m.subjectId === tmSubjectFilter);
          }

          // Filter by search query or current folder
          let displayMods: TeachingModule[] = [];
          if (tmQuery.trim()) {
            // When searching, show all matching modules across all folders for this teacher
            displayMods = allTeacherMods.filter(m => 
              m.title.toLowerCase().includes(tmQuery.toLowerCase())
            );
          } else {
            // Normal folder navigation mode
            displayMods = allTeacherMods.filter(m => (m.parentId || null) === currentFolderId);
          }

          // Sort folders first, then files
          displayMods.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return (a.title || '').localeCompare(b.title || '');
          });

          const currentFolderObj = modulesList.find(m => m.id === currentFolderId);

          return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
              {/* Header with Back Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setTmSelectedTeacherId(null);
                      setTmQuery('');
                      setCurrentFolderId(null);
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold rounded-xl transition flex items-center gap-2 text-xs shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Guru
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center shrink-0 border border-indigo-200">
                      {teacherName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                        {teacherName}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {teacherObj?.subject ? `Mata Pelajaran: ${teacherObj.subject}` : 'Guru Pengajar'} • NIP: {teacherObj?.nip || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs">
                    {selectedData?.modules.length || 0} Total Berkas & Folder
                  </span>
                </div>
              </div>

              {/* Sub Filter & Search inside selected teacher */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari perangkat / nama berkas..."
                    value={tmQuery}
                    onChange={(e) => setTmQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={tmClassFilter}
                    onChange={(e) => setTmClassFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>Kelas {c.name}</option>
                    ))}
                  </select>

                  <select
                    value={tmSubjectFilter}
                    onChange={(e) => setTmSubjectFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Mapel</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Folder Breadcrumb & Navigation */}
              {currentFolderId && !tmQuery && (
                <div className="flex items-center gap-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                  <button
                    onClick={() => setCurrentFolderId(currentFolderObj?.parentId || null)}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Induk
                  </button>
                  <span className="text-slate-400">/</span>
                  <Folder className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                  <span className="font-extrabold text-slate-800">{currentFolderObj?.title || 'Folder'}</span>
                </div>
              )}

              {/* Modules Table */}
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider bg-slate-50/80">
                      <th className="p-4 font-bold rounded-tl-2xl">Judul / Berkas</th>
                      <th className="p-4 font-bold">Kelas & Mapel</th>
                      <th className="p-4 font-bold text-center">Tgl Diunggah</th>
                      <th className="p-4 font-bold text-right rounded-tr-2xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {displayMods.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400 bg-slate-50/40">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-600">Tidak ada berkas ditemukan</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tmQuery ? `Tidak ada hasil untuk "${tmQuery}"` : 'Belum ada perangkat pembelajaran yang diunggah dalam folder ini.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      displayMods.map(mod => (
                        <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-semibold text-slate-800">
                            {mod.type === 'folder' ? (
                              <button
                                onClick={() => setCurrentFolderId(mod.id)}
                                className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer bg-transparent border-none p-0 text-left font-bold text-sm"
                              >
                                <Folder className="w-5 h-5 text-indigo-500 fill-indigo-100 shrink-0" />
                                {mod.title}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-900 text-sm">{mod.title}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {mod.type === 'folder' ? (
                              <span className="text-slate-400 italic">-</span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                  Kelas {classes.find(c => c.id === mod.classId)?.name || mod.classId}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {subjects.find(s => s.id === mod.subjectId)?.name || mod.subjectId}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center text-slate-500 font-medium">
                            {new Date(mod.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadModule(mod)}
                                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Unduh
                              </button>
                              <button
                                onClick={() => {
                                  setShareModuleId(mod.id);
                                  setShowShareModuleModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-100"
                                title="Bagikan ke Guru Lain"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // Default Main View: List of Teachers
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Data Perangkat Pembelajaran Guru</h3>
                <p className="text-slate-500 text-xs mt-0.5">Pilih nama guru di bawah ini untuk melihat, mengunduh, dan membagikan perangkat pembelajaran.</p>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl text-indigo-900 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase block leading-none">Total Berkas & Folder</span>
                    <span className="text-sm font-extrabold">{modulesList.length} Item</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl text-emerald-900 flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block leading-none">Guru Pengunggah</span>
                    <span className="text-sm font-extrabold">{activeTeacherWithModulesCount} Guru</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-100 px-3.5 py-2 rounded-xl text-purple-900 flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-purple-600 font-bold uppercase block leading-none">Folder Terorganisir</span>
                    <span className="text-sm font-extrabold">{totalFolderCount} Folder</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama guru / NIP / mapel..."
                  value={tmTeacherSearch}
                  onChange={(e) => setTmTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={tmClassFilter}
                  onChange={(e) => setTmClassFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Kelas {c.name}</option>
                  ))}
                </select>

                <select
                  value={tmSubjectFilter}
                  onChange={(e) => setTmSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Mapel</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Teachers */}
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-slate-500 font-bold text-sm">Tidak ada guru ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map(t => {
                  const entryCount = t.modules.length;
                  const latestEntry = t.modules[0];

                  return (
                    <div
                      key={t.teacherId}
                      onClick={() => {
                        setTmSelectedTeacherId(t.teacherId);
                        setCurrentFolderId(null);
                      }}
                      className="group bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-extrabold text-base flex items-center justify-center transition shrink-0">
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition leading-snug">
                                {t.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {t.subject ? `Mapel: ${t.subject}` : 'Guru Pengajar'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span>NIP: <strong className="text-slate-700">{t.nip || '-'}</strong></span>
                          {latestEntry && (
                            <span className="text-[11px] font-medium text-slate-400">
                              Terakhir: {new Date(latestEntry.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          entryCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {entryCount} Perangkat & Folder
                        </span>

                        <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                          Lihat Perangkat →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'cheatlogs' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const uniqueClasses = Array.from(new Set((cheatLogs || []).map(l => l.className).filter(Boolean)));
            const uniqueExams = Array.from(new Set((cheatLogs || []).map(l => l.examTitle).filter(Boolean)));

            const filteredLogs = (cheatLogs || []).filter(log => {
              if (cheatLogClassFilter !== 'ALL' && log.className !== cheatLogClassFilter) return false;
              if (cheatLogExamFilter !== 'ALL' && log.examTitle !== cheatLogExamFilter) return false;
              if (cheatLogDateFilter === 'TODAY') {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                if (logDate !== todayStr) return false;
              }
              if (cheatLogSearchQuery.trim()) {
                const q = cheatLogSearchQuery.toLowerCase();
                const matchName = log.studentName?.toLowerCase().includes(q);
                const matchNis = log.studentNis?.toLowerCase().includes(q);
                const matchClass = log.className?.toLowerCase().includes(q);
                const matchExam = log.examTitle?.toLowerCase().includes(q);
                if (!matchName && !matchNis && !matchClass && !matchExam) return false;
              }
              return true;
            });

            return (
              <>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      Sistem Deteksi Pelanggaran CBT & Ujian
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Memonitor secara real-time kejadian siswa keluar tab browser ketika ujian CBT sedang berlangsung. Total {cheatLogs.length} pelanggaran tercatat.
                    </p>
                  </div>

                  {cheatLogs.length > 0 && (
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
                          if (confirm(`Apakah Anda yakin ingin MENGHAPUS SEMUA (${cheatLogs.length}) log pelanggaran siswa?`)) {
                            if (onClearCheatLogsBatch) {
                              onClearCheatLogsBatch(cheatLogs.map(l => l.id));
                            } else if (onDeleteCheatLog) {
                              cheatLogs.forEach(l => onDeleteCheatLog(l.id));
                              toast.success('Semua log pelanggaran berhasil dibersihkan.');
                            }
                          }
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                        title="Hapus seluruh log pelanggaran tanpa tersisa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Semua Log ({cheatLogs.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* FILTER BAR */}
                {cheatLogs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Siswa / NIS</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Ketik nama / NIS / ujian..."
                          value={cheatLogSearchQuery}
                          onChange={(e) => setCheatLogSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
                      <select
                        value={cheatLogClassFilter}
                        onChange={(e) => setCheatLogClassFilter(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
                      >
                        <option value="ALL">-- Semua Kelas ({uniqueClasses.length}) --</option>
                        {uniqueClasses.map(c => (
                          <option key={c} value={c}>Kelas {c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filter Paket Ujian</label>
                      <select
                        value={cheatLogExamFilter}
                        onChange={(e) => setCheatLogExamFilter(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
                      >
                        <option value="ALL">-- Semua Paket Ujian ({uniqueExams.length}) --</option>
                        {uniqueExams.map(ex => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rentang Tanggal</label>
                      <select
                        value={cheatLogDateFilter}
                        onChange={(e) => setCheatLogDateFilter(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-400 focus:outline-none"
                      >
                        <option value="ALL">Semua Tanggal</option>
                        <option value="TODAY">📅 Hari Ini Sahaja ({new Date().toLocaleDateString('id-ID')})</option>
                      </select>
                    </div>
                  </div>
                )}

                {cheatLogs.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Log Pelanggaran Siswa</h4>
                    <p className="text-slate-500 text-xs mt-1">Sistem bersih, tidak ada catatan kecurangan atau siswa berintegritas tinggi.</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-amber-200 rounded-2xl bg-amber-50/30">
                    <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <p className="text-slate-700 font-bold text-xs">Tidak ada log pelanggaran yang cocok dengan filter yang Anda pilih.</p>
                    <button
                      onClick={() => {
                        setCheatLogClassFilter('ALL');
                        setCheatLogExamFilter('ALL');
                        setCheatLogDateFilter('ALL');
                        setCheatLogSearchQuery('');
                      }}
                      className="mt-3 text-xs text-indigo-600 font-extrabold underline cursor-pointer"
                    >
                      Reset Filter Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Waktu</th>
                            <th className="px-4 py-3">Nama Siswa</th>
                            <th className="px-4 py-3">NIS</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Paket Ujian</th>
                            <th className="px-4 py-3">Deskripsi Pelanggaran</th>
                            <th className="px-4 py-3 text-center">Aksi Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-red-50/20 transition">
                              <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                                {new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0"></span>
                                {log.studentName}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">{log.studentNis}</td>
                              <td className="px-4 py-3 font-semibold text-slate-700">{log.className}</td>
                              <td className="px-4 py-3 font-medium text-indigo-700">{log.examTitle}</td>
                              <td className="px-4 py-3 text-red-600 font-semibold">{log.violationType}</td>
                              <td className="px-4 py-3 text-center">
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
              </>
            );
          })()}
        </div>
      )}

      {/* BANK SOAL TAB */}
      {activeTab === 'bank_soal' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Bank Soal Guru Mapel
            </h3>
            <p className="text-slate-500 text-xs">Pusat repositori Bank Soal yang telah dibuat oleh semua Guru Mata Pelajaran.</p>
          </div>

          {questionBanks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada data Bank Soal.</p>
              <p className="text-slate-400 text-xs">Bank Soal akan muncul di sini setelah guru membuatnya.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionBanks.map((qb) => {
                const teacherName = getTeacherName(qb.teacherId);
                const subjectName = getSubjectName(qb.subjectId);
                return (
                  <div key={qb.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 line-clamp-2">{qb.title}</h4>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {qb.questions?.length || 0} Soal
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 mt-1">
                      <p className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Guru: <strong>{teacherName}</strong></p>
                      <p className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Mapel: {subjectName}</p>
                      <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Dibuat: {new Date(qb.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="mt-2 pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        onClick={() => handleDownloadBankSoal(qb)}
                        className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Unduh format Excel"
                      >
                        <Download className="w-3.5 h-3.5" /> Excel
                      </button>
                      <button
                        onClick={() => handleDownloadBankSoalPDF(qb)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Unduh format PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={() => handleDownloadBankSoalDOCX(qb)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Unduh format DOCX"
                      >
                        <Download className="w-3.5 h-3.5" /> Word
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CLASSES & SUBJECTS TAB */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* CLASS MANAGEMENT */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                🏫 Manajemen Kelas
              </h3>
              <p className="text-slate-500 text-xs">
                Tambah dan kelola kelas-kelas di sekolah. Kelas baru akan langsung tersedia untuk guru dan siswa.
              </p>
            </div>

            {/* Inline add form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('classNameInput') as HTMLInputElement;
                const val = input.value.trim();
                if (val && onAddClass) {
                  onAddClass(val);
                  input.value = '';
                }
              }}
              className="flex gap-2"
            >
              <input
                name="classNameInput"
                type="text"
                required
                placeholder="Misal: IX-D, VIII-A..."
                className="flex-grow px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kelas</span>
              </button>
            </form>

            {/* Classes list */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {sortedClasses.map((cls) => {
                const studentCount = students.filter(s => s.classId === cls.id).length;
                const isEditing = editingClass?.id === cls.id;

                return (
                  <div key={cls.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editingClassName.trim() && onUpdateClass) {
                            onUpdateClass({ ...cls, name: editingClassName.trim() });
                          }
                          setEditingClass(null);
                        }}
                        className="flex items-center justify-between w-full gap-2"
                      >
                        <input
                          type="text"
                          value={editingClassName}
                          onChange={(e) => setEditingClassName(e.target.value)}
                          className="flex-grow px-3 py-1.5 border border-indigo-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                          autoFocus
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Simpan Perubahan"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingClass(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Batal"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">{cls.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {studentCount} Siswa
                          </span>
                          {onUpdateClass && (
                            <button
                              onClick={() => {
                                setEditingClass(cls);
                                setEditingClassName(cls.name);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Nama Kelas"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteClass && (
                            <button
                              onClick={() => onDeleteClass(cls.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {classes.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada kelas terdaftar.
                </div>
              )}
            </div>
          </div>

          {/* SUBJECTS MANAGEMENT */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                📚 Manajemen Mata Pelajaran
              </h3>
              <p className="text-slate-500 text-xs">
                Tambah dan kelola daftar mata pelajaran utama. Digunakan untuk penjurnalan mengajar dan materi.
              </p>
            </div>

            {/* Inline add form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('subjectNameInput') as HTMLInputElement;
                const val = input.value.trim();
                if (val && onAddSubject) {
                  onAddSubject(val);
                  input.value = '';
                }
              }}
              className="flex gap-2"
            >
              <input
                name="subjectNameInput"
                type="text"
                required
                placeholder="Misal: Seni Musik, PJOK..."
                className="flex-grow px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Mapel</span>
              </button>
            </form>

            {/* Subjects list */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {subjects.map((sub) => {
                const teacherCount = teachers.filter(t => (t.subject || '').split(',').map(s => s.trim().toLowerCase()).includes((sub.name || '').toLowerCase())).length;
                const isEditing = editingSubject?.id === sub.id;

                return (
                  <div key={sub.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editingSubjectName.trim() && onUpdateSubject) {
                            onUpdateSubject({ ...sub, name: editingSubjectName.trim() });
                          }
                          setEditingSubject(null);
                        }}
                        className="flex items-center justify-between w-full gap-2"
                      >
                        <input
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="flex-grow px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                          autoFocus
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Simpan Perubahan"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubject(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Batal"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {teacherCount} Pengajar
                          </span>
                          {onUpdateSubject && (
                            <button
                              onClick={() => {
                                setEditingSubject(sub);
                                setEditingSubjectName(sub.name);
                              }}
                              className="text-emerald-600 hover:text-emerald-800 p-1.5 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Edit Mata Pelajaran"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteSubject && (
                            <button
                              onClick={() => onDeleteSubject(sub.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Hapus Mata Pelajaran"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada mata pelajaran terdaftar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATIONS TAB */}
      {activeTab === 'registrations' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Manajemen & Persetujuan Akun Pendaftar
              </h3>
              <p className="text-slate-500 text-xs">
                Daftar permohonan registrasi akun Guru dan Siswa baru yang masuk dari halaman awal portal.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Masuk</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{registrations.length}</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Menunggu Persetujuan</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">
                {(registrations || []).filter(r => r.status === 'Pending').length}
              </span>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Disetujui Aktif</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">
                {(registrations || []).filter(r => r.status === 'Approved').length}
              </span>
            </div>
            <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-red-600 block">Ditolak</span>
              <span className="text-xl font-black text-red-900 mt-1 block">
                {(registrations || []).filter(r => r.status === 'Rejected').length}
              </span>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-400 text-xs font-semibold">Belum ada permohonan pendaftaran akun.</p>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-xl overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-700">Peran</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Nama Lengkap</th>
                    <th className="px-5 py-3 font-bold text-slate-700">NIP / NIS</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Mapel / Kelas</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Password / Sandi</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Waktu Daftar</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Status</th>
                    <th className="px-5 py-3 font-bold text-slate-700 text-right">Aksi Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(registrations || []).map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase tracking-wider ${
                          reg.role === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                        }`}>
                          {reg.role === 'Teacher' ? '👨‍🏫 Guru' : '👨‍🎓 Siswa'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{reg.name}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{reg.identifier}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{reg.subjectOrClass}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{reg.passwordOrEmail}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[10px]">
                        {new Date(reg.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {reg.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3 animate-spin" /> Menunggu
                          </span>
                        )}
                        {reg.status === 'Approved' && (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3" /> Disetujui
                            </span>
                            {reg.isAdmin && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                <ShieldAlert className="w-3 h-3 text-purple-600" /> Prioritas Admin
                              </span>
                            )}
                          </div>
                        )}
                        {reg.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {reg.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.role === 'Teacher' && (
                              <button
                                onClick={() => onApproveRegistration?.(reg.id, true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs"
                                title="Setujui pendaftaran dan berikan Hak Akses Administrator"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" /> Setujui + Admin
                              </button>
                            )}
                            <button
                              onClick={() => onApproveRegistration?.(reg.id, false)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> {reg.role === 'Teacher' ? 'Setujui Guru' : 'Setujui'}
                            </button>
                            <button
                              onClick={() => onRejectRegistration?.(reg.id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] shadow-2xs"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Tolak
                            </button>
                            <button
                              onClick={() => onDeleteRegistration?.(reg.id)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Hapus Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-slate-400 text-[11px] italic mr-2">Selesai diverifikasi</span>
                            <button
                              onClick={() => onDeleteRegistration?.(reg.id)}
                              className="bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 font-bold px-2 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Hapus Permanen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BACKUP & RESTORASI DATABASE TAB */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 sm:p-8 space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-2.5">
                <HardDrive className="w-6 h-6 text-emerald-600" />
                Pusat Backup & Restorasi Database Sekolah
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Amankan seluruh data sekolah (Guru, Siswa, Ruang BK, Jurnal, Ujian, Nilai) dalam bentuk berkas JSON terstruktur, dan pulihkan data secara utuh saat ada pembaruan sistem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Database Firestore Terhubung
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Data Induk & Akun</span>
              <div className="text-xl font-black text-indigo-950">
                {teachers.length + students.length + classes.length + subjects.length} Item
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {teachers.length} Guru • {students.length} Siswa • {classes.length} Kelas
              </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Ruang BK (Konseling)</span>
              <div className="text-xl font-black text-emerald-950">
                {counselingReferrals.length + counselingSessions.length + dailyCheckIns.length + needsAssessments.length + sociometries.length + homeVisits.length + careerPlans.length} Records
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {counselingSessions.length} Sesi BK • {counselingReferrals.length} Rujukan
              </p>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Pembelajaran & Jurnal</span>
              <div className="text-xl font-black text-purple-950">
                {journals.length + teachingModules.length + materials.length + questionBanks.length} Items
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {journals.length} Jurnal • {teachingModules.length} Perangkat
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Ujian CBT & Nilai</span>
              <div className="text-xl font-black text-amber-950">
                {exams.length + submissions.length + manualAssessments.length + cheatLogs.length} Records
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {exams.length} Ujian • {submissions.length} Lembar Jawab
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CARD 1: BACKUP DATABASE */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">1. Unduh Backup Database (.json)</h4>
                  <p className="text-xs text-slate-500">Ekspor seluruh data aktif ke dalam 1 file cadangan resmi.</p>
                </div>
              </div>

              {/* Module selection checklist */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Pilih Modul Data yang Ingin Ditinggalkan / Cadangkan:
                </label>
                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={backupOptions.includeAdminData}
                      onChange={(e) => setBackupOptions({ ...backupOptions, includeAdminData: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>👨‍🏫 Data Induk Sekolah (Guru, Siswa, Kelas, Mapel, Pengumuman & Konfig)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={backupOptions.includeBkData}
                      onChange={(e) => setBackupOptions({ ...backupOptions, includeBkData: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>💚 Data Ruang BK (Sesi Konseling, Rujukan BK, Asesmen, Check-In, Kunjungan)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={backupOptions.includeKbmData}
                      onChange={(e) => setBackupOptions({ ...backupOptions, includeKbmData: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>📚 Data KBM & Materi (Jurnal Mengajar, Perangkat Pembelajaran, Bank Soal)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={backupOptions.includeExamData}
                      onChange={(e) => setBackupOptions({ ...backupOptions, includeExamData: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>📝 Data Ujian & Evaluasi (Ujian CBT, Hasil Submisi, Nilai, Cheat Logs)</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Download className="w-4 h-4" /> Unduh Berkas Backup Database (.json)
              </button>
            </div>

            {/* CARD 2: IMPOR & RESTORASI DATABASE */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">2. Restorasi / Impor Database (.json)</h4>
                  <p className="text-xs text-slate-500">Unggah berkas JSON cadangan untuk memulihkan data tanpa hilang.</p>
                </div>
              </div>

              {!restorePreview ? (
                <div className="border-2 border-dashed border-indigo-200 bg-white rounded-xl p-6 text-center space-y-3">
                  <FileJson className="w-10 h-10 text-indigo-500 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Pilih Berkas Cadangan (.json)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Format file standar JSON hasil unduhan backup dari sistem ini.</p>
                  </div>
                  <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition">
                    Pilih File JSON
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelectForRestore(file);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4 bg-white p-4 rounded-xl border border-indigo-200 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-black text-slate-900 block">{restoreFile?.name}</span>
                        <span className="text-[10px] text-slate-400">
                          Tanggal Backup: {restorePreview.exportDate ? new Date(restorePreview.exportDate).toLocaleString('id-ID') : '-'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setRestorePreview(null);
                        setRestoreFile(null);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Summary of items inside preview */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg font-medium text-slate-700">
                    <div>👨‍🏫 Guru: <strong className="text-slate-900">{(restorePreview.teachers || []).length}</strong></div>
                    <div>👨‍🎓 Siswa: <strong className="text-slate-900">{(restorePreview.students || []).length}</strong></div>
                    <div>💚 Sesi BK: <strong className="text-slate-900">{(restorePreview.counselingSessions || []).length}</strong></div>
                    <div>📝 Jurnal: <strong className="text-slate-900">{(restorePreview.journals || []).length}</strong></div>
                    <div>📑 Perangkat: <strong className="text-slate-900">{(restorePreview.teachingModules || []).length}</strong></div>
                    <div>📝 Ujian CBT: <strong className="text-slate-900">{(restorePreview.exams || []).length}</strong></div>
                  </div>

                  {/* Mode option */}
                  <div className="space-y-2 pt-1">
                    <span className="font-extrabold text-slate-800 block text-[11px]">Pilih Mode Pemulihan:</span>
                    <label className="flex items-start gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-indigo-600 cursor-pointer"
                      />
                      <div>
                        <span>🟢 Gabung & Perbarui (Upsert) - Rekomendasi</span>
                        <p className="text-[10px] text-slate-500 font-normal">Menambahkan data baru & memperbarui record tanpa menghapus data aktif lainnya.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="overwrite"
                        checked={restoreMode === 'overwrite'}
                        onChange={() => setRestoreMode('overwrite')}
                        className="mt-0.5 text-indigo-600 cursor-pointer"
                      />
                      <div>
                        <span>🔴 Timpa Total (Overwrite)</span>
                        <p className="text-[10px] text-slate-500 font-normal">Menimpa langsung record pada database dengan isi file backup.</p>
                      </div>
                    </label>
                  </div>

                  {isRestoring ? (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-center font-bold text-xs animate-pulse">
                      {restoreProgressText || 'Sedang memproses restorasi database...'}
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleExecuteRestore}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition cursor-pointer text-xs"
                      >
                        Proses Pulihkan Database
                      </button>
                      <button
                        onClick={() => {
                          setRestorePreview(null);
                          setRestoreFile(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: TEMPLATE EXCEL & IMPOR GURU / SISWA */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">3. Impor / Ekspor Massal Format Excel (Guru & Siswa)</h4>
                <p className="text-xs text-slate-500">Unduh template Excel untuk pengisian massal data Guru dan Siswa tanpa perlu mengetik manual satu per satu.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teacher Excel Block */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    👨‍🏫 Data Guru Pengajar
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                    {teachers.length} Guru Terdaftar
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Isi nama guru, NIP, email, dan mata pelajaran pada berkas Excel, lalu unggah langsung untuk dimasukkan ke database.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadTeacherTemplate}
                    className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Template Excel
                  </button>

                  <button
                    onClick={() => {
                      setTeacherImportText('');
                      setTeacherImportPreview([]);
                      setShowTeacherImportModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Impor Excel Guru
                  </button>
                </div>
              </div>

              {/* Student Excel Block */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    👨‍🎓 Data Siswa Terdaftar
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                    {students.length} Siswa Terdaftar
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Gunakan template Excel untuk memasukkan nama siswa, NIS, email, dan ID kelas secara massal.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadStudentTemplate}
                    className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Template Excel
                  </button>

                  <button
                    onClick={() => setActiveTab('students')}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Users className="w-3.5 h-3.5" /> Ke Menu Siswa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ANNOUNCEMENT MODAL */}
      {showAddAnnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Buat Pengumuman</h3>
              <button onClick={() => setShowAddAnnModal(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddGlobalAnnouncement?.(newAnn);
              setShowAddAnnModal(false);
              setNewAnn({ title: '', content: '', targetRole: 'All' });
            }} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
                <select
                  required
                  value={newAnn.targetRole}
                  onChange={(e) => setNewAnn({ ...newAnn, targetRole: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">Semua (Guru & Siswa)</option>
                  <option value="Teacher">Hanya Guru</option>
                  <option value="Student">Hanya Siswa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Isi Pengumuman</label>
                <textarea
                  required
                  rows={4}
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAnnModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TEACHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-base">Registrasi Guru Pengajar Baru</h3>
            
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Nama Lengkap beserta Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, S.Pd."
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">NIP Pegawai *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan NIP"
                    value={newTeacher.nip}
                    onChange={(e) => setNewTeacher(prev => ({ ...prev, nip: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Email Utama (Opsional)</label>
                  <input
                    type="email"
                    placeholder="Masukkan Email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* MULTI-SUBJECT SELECTION BLOCK (TAMBAH GURU) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    📚 Mata Pelajaran yang Diajar (Bisa Pilih &gt; 1 Mapel) *
                  </label>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                    {newTeacher.subject ? (newTeacher.subject || '').split(',').filter(Boolean).length : 0} Mapel Dipilih
                  </span>
                </div>

                {/* Selected Subjects Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white border border-slate-200 rounded-lg items-center">
                  {newTeacher.subject && (newTeacher.subject || '').split(',').map((subj, idx) => {
                    const trimmed = subj.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={idx} className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs">
                        {trimmed}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = newTeacher.subject
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s && s.toLowerCase() !== trimmed.toLowerCase())
                              .join(', ');
                            setNewTeacher(prev => ({ ...prev, subject: updated }));
                          }}
                          className="hover:bg-indigo-800 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] cursor-pointer"
                          title="Hapus mapel ini"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                  {(!newTeacher.subject || newTeacher.subject.trim() === '') && (
                    <span className="text-xs text-slate-400 italic">Klik tombol mapel di bawah untuk memilih...</span>
                  )}
                </div>

                {/* Quick Select Buttons from Existing Subjects */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Klik kotak mapel untuk menambah / mengurangi pilihan:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {subjects.map(s => {
                      const currentList = newTeacher.subject ? (newTeacher.subject || '').split(',').map(item => item.trim().toLowerCase()) : [];
                      const isSelected = currentList.includes((s.name || '').toLowerCase());
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            const list = newTeacher.subject ? (newTeacher.subject || '').split(',').map(item => item.trim()).filter(Boolean) : [];
                            if (isSelected) {
                              const updated = list.filter(item => item.toLowerCase() !== (s.name || '').toLowerCase()).join(', ');
                              setNewTeacher(prev => ({ ...prev, subject: updated }));
                            } else {
                              list.push(s.name);
                              setNewTeacher(prev => ({ ...prev, subject: list.join(', ') }));
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓' : '+'} {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Subject */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <input
                    type="text"
                    placeholder="Atau ketik mapel baru lain..."
                    id="custom_subject_input_add"
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputEl = e.currentTarget;
                        const val = inputEl.value.trim();
                        if (val) {
                          if (onAddSubject && !subjects.some(s => (s.name || '').toLowerCase() === val.toLowerCase())) {
                            onAddSubject(val);
                          }
                          const list = newTeacher.subject ? (newTeacher.subject || '').split(',').map(item => item.trim()).filter(Boolean) : [];
                          if (!list.some(item => item.toLowerCase() === val.toLowerCase())) {
                            list.push(val);
                            setNewTeacher(prev => ({ ...prev, subject: list.join(', ') }));
                          }
                          inputEl.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inputEl = document.getElementById('custom_subject_input_add') as HTMLInputElement;
                      if (inputEl && inputEl.value.trim()) {
                        const val = inputEl.value.trim();
                        if (onAddSubject && !subjects.some(s => (s.name || '').toLowerCase() === val.toLowerCase())) {
                          onAddSubject(val);
                        }
                        const list = newTeacher.subject ? (newTeacher.subject || '').split(',').map(item => item.trim()).filter(Boolean) : [];
                        if (!list.some(item => item.toLowerCase() === val.toLowerCase())) {
                          list.push(val);
                          setNewTeacher(prev => ({ ...prev, subject: list.join(', ') }));
                        }
                        inputEl.value = '';
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
                  >
                    ➕ Tambah Mapel
                  </button>
                </div>
              </div>

              {/* Drive upload simulator */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Foto Profil (Unggah Simultan ke Google Drive)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Unggah Foto
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleSimulatedFileUpload}
                    className="hidden"
                  />
                  {uploading && (
                    <span className="text-[11px] text-indigo-600 font-semibold animate-pulse">
                      Mengunggah berkas ke Google Drive...
                    </span>
                  )}
                  {newTeacher.photoUrl && !uploading && (
                    <span className="text-[11px] text-emerald-600 font-semibold truncate max-w-[250px]">
                      Terunggah! Tautan Drive tersimpan.
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAdminAddTeacher"
                  checked={!!newTeacher.isAdmin}
                  onChange={(e) => setNewTeacher(prev => ({ ...prev, isAdmin: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="isAdminAddTeacher" className="text-xs font-bold text-purple-950 cursor-pointer flex items-center gap-1.5 select-none">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Berikan Hak Akses Administrator (Prioritas Admin Sekolah)
                </label>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                >
                  Daftarkan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-base">Registrasi Siswa Baru</h3>
            
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">No Absen</label>
                  <input
                    type="number"
                    value={newStudent.noAbsen || ''}
                    onChange={(e) => setNewStudent({...newStudent, noAbsen: parseInt(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Rafli"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">NIS (Nomor Induk Siswa) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan NIS"
                    value={newStudent.nis}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, nis: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Kelas *</label>
                  <select
                    required
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Pilih Kelas</option>
                    {sortedClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Jenis Kelamin</label>
                <select
                  value={newStudent.gender || ''}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, gender: (e.target.value as 'L' | 'P') || undefined }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Email Utama (Opsional)</label>
                <input
                  type="email"
                  placeholder="Masukkan Email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                >
                  Daftarkan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL (PENGATURAN MAPEL & PROFIL) */}
      {showEditTeacherModal && editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Atur Mapel & Profil Guru</h3>
              </div>
              <button 
                onClick={() => setShowEditTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateTeacher && editingTeacher) {
                onUpdateTeacher(editingTeacher);
                toast(`Pengaturan guru ${editingTeacher.name} berhasil diperbarui!`);
                setShowEditTeacherModal(false);
              }
            }} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Nama Lengkap beserta Gelar *</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">NIP / NUPTK *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.nip}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Email Utama</label>
                  <input
                    type="email"
                    value={editingTeacher.email}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Password Login (Bisa Diubah/Reset) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editingTeacher.password || 'guru123'}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingTeacher({ ...editingTeacher, password: 'guru123' })}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap"
                  >
                    Reset (guru123)
                  </button>
                </div>
              </div>

              {/* MULTI-SUBJECT SELECTION BLOCK */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    📚 Mata Pelajaran yang Diajar (Bisa Pilih &gt; 1 Mapel) *
                  </label>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                    {editingTeacher.subject ? (editingTeacher.subject || '').split(',').filter(Boolean).length : 0} Mapel Dipilih
                  </span>
                </div>

                {/* Selected Subjects Badges */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white border border-slate-200 rounded-lg items-center">
                  {editingTeacher.subject && (editingTeacher.subject || '').split(',').map((subj, idx) => {
                    const trimmed = subj.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={idx} className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-2xs">
                        {trimmed}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingTeacher.subject
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s && s.toLowerCase() !== trimmed.toLowerCase())
                              .join(', ');
                            setEditingTeacher({ ...editingTeacher, subject: updated || 'Umum' });
                          }}
                          className="hover:bg-indigo-800 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] cursor-pointer"
                          title="Hapus mapel ini"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                  {(!editingTeacher.subject || editingTeacher.subject.trim() === '') && (
                    <span className="text-xs text-slate-400 italic">Belum ada mapel dipilih... Klik di bawah</span>
                  )}
                </div>

                {/* Quick Select Buttons from Existing Subjects */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Klik kotak mapel di bawah untuk menambah / mengurangi pilihan:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {subjects.map(s => {
                      const currentList = editingTeacher.subject ? (editingTeacher.subject || '').split(',').map(item => item.trim().toLowerCase()) : [];
                      const isSelected = currentList.includes((s.name || '').toLowerCase());
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            const list = editingTeacher.subject ? (editingTeacher.subject || '').split(',').map(item => item.trim()).filter(Boolean) : [];
                            if (isSelected) {
                              const updated = list.filter(item => item.toLowerCase() !== (s.name || '').toLowerCase()).join(', ');
                              setEditingTeacher({ ...editingTeacher, subject: updated || 'Umum' });
                            } else {
                              if (list.length === 1 && list[0] === 'Umum') {
                                setEditingTeacher({ ...editingTeacher, subject: s.name });
                              } else {
                                list.push(s.name);
                                setEditingTeacher({ ...editingTeacher, subject: list.join(', ') });
                              }
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓' : '+'} {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Subject */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <input
                    type="text"
                    placeholder="Atau ketik mapel baru lain..."
                    id="custom_subject_input_edit"
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputEl = e.currentTarget;
                        const val = inputEl.value.trim();
                        if (val) {
                          if (onAddSubject && !subjects.some(s => (s.name || '').toLowerCase() === val.toLowerCase())) {
                            onAddSubject(val);
                          }
                          const list = editingTeacher.subject ? (editingTeacher.subject || '').split(',').map(item => item.trim()).filter(Boolean) : [];
                          if (!list.some(item => item.toLowerCase() === val.toLowerCase())) {
                            if (list.length === 1 && list[0] === 'Umum') {
                              setEditingTeacher({ ...editingTeacher, subject: val });
                            } else {
                              list.push(val);
                              setEditingTeacher({ ...editingTeacher, subject: list.join(', ') });
                            }
                          }
                          inputEl.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inputEl = document.getElementById('custom_subject_input_edit') as HTMLInputElement;
                      if (inputEl && inputEl.value.trim()) {
                        const val = inputEl.value.trim();
                        if (onAddSubject && !subjects.some(s => (s.name || '').toLowerCase() === val.toLowerCase())) {
                          onAddSubject(val);
                        }
                        const list = editingTeacher.subject ? (editingTeacher.subject || '').split(',').map(item => item.trim()).filter(Boolean) : [];
                        if (!list.some(item => item.toLowerCase() === val.toLowerCase())) {
                          if (list.length === 1 && list[0] === 'Umum') {
                            setEditingTeacher({ ...editingTeacher, subject: val });
                          } else {
                            list.push(val);
                            setEditingTeacher({ ...editingTeacher, subject: list.join(', ') });
                          }
                        }
                        inputEl.value = '';
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
                  >
                    ➕ Tambah Mapel
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">URL Foto Profil Google Drive</label>
                <input
                  type="url"
                  value={editingTeacher.photoUrl}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAdminEditTeacher"
                  checked={!!editingTeacher.isAdmin}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, isAdmin: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="isAdminEditTeacher" className="text-xs font-bold text-purple-950 cursor-pointer flex items-center gap-1.5 select-none">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Berikan Hak Akses Administrator (Prioritas Admin Sekolah)
                </label>
              </div>

              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed font-medium">
                💡 <strong>Info:</strong> Perubahan mata pelajaran akan langsung diperbarui ke database Spreadsheet dan berlaku untuk portal pengajaran guru bersangkutan.
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowEditTeacherModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL (EDIT DATA / NAIK KELAS INDIVIDUAL) */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Data / Naik Kelas Siswa</h3>
              </div>
              <button 
                onClick={() => setShowEditStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateStudent && editingStudent) {
                const targetClassName = editingStudent.status === 'Lulus' ? 'Alumni' : getClassName(editingStudent.classId);
                onUpdateStudent({
                  ...editingStudent,
                  className: targetClassName
                });
                toast(`Data siswa ${editingStudent.name} berhasil diperbarui!`);
                setShowEditStudentModal(false);
              }
            }} className="space-y-4 text-left">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">No Absen</label>
                  <input
                    type="number"
                    value={editingStudent.noAbsen || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, noAbsen: parseInt(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">NIS (Kredensial Login) *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nis}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Status Siswa *</label>
                  <select
                    required
                    value={editingStudent.status || 'Aktif'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Pindah">Pindah / Keluar</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Penempatan Kelas *</label>
                  <select
                    required
                    value={editingStudent.classId}
                    onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-700"
                  >
                    {sortedClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Jenis Kelamin</label>
                  <select
                    value={editingStudent.gender || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: (e.target.value as 'L' | 'P') || undefined })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Pilih...</option>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Email Utama</label>
                  <input
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Password Login (Bisa Diubah/Reset) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editingStudent.password || editingStudent.email || editingStudent.nis}
                    onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, password: editingStudent.nis })}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap"
                  >
                    Reset ke NIS
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL FOR TEACHER & STUDENT */}
      {showResetPassModal && resetTargetUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Reset Password Akun {resetTargetUser.role === 'Teacher' ? 'Pengajar' : 'Siswa'}</h3>
                  <p className="text-xs text-slate-400">Atur ulang kata sandi login pengguna</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResetPassModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Nama Pengguna:</span>
                <span className="font-bold text-slate-800">{resetTargetUser.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{resetTargetUser.role === 'Teacher' ? 'NIP Pengajar:' : 'NIS Siswa:'}</span>
                <span className="font-mono font-bold text-indigo-600">{resetTargetUser.identifier}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-400">Password Saat Ini:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold text-[11px]">{resetTargetUser.currentPass}</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPasswordValue.trim()) return;
                const finalPass = newPasswordValue.trim();
                if (resetTargetUser.role === 'Teacher' && onUpdateTeacher) {
                  onUpdateTeacher({ ...(resetTargetUser.rawObject as Teacher), password: finalPass });
                } else if (resetTargetUser.role === 'Student' && onUpdateStudent) {
                  onUpdateStudent({ ...(resetTargetUser.rawObject as Student), password: finalPass });
                }
                toast(`Password untuk ${resetTargetUser.name} berhasil diubah menjadi: ${finalPass}`);
                setShowResetPassModal(false);
              }}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan Password Baru *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Ketik password baru..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultPass = resetTargetUser.role === 'Teacher' ? 'guru123' : resetTargetUser.identifier;
                      setNewPasswordValue(defaultPass);
                    }}
                    className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    ⚡ Gunakan Default ({resetTargetUser.role === 'Teacher' ? 'guru123' : `NIS: ${resetTargetUser.identifier}`})
                  </button>
                </div>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
                ℹ️ <strong>Catatan:</strong> Setelah password diubah, pengguna dapat langsung login menggunakan NIP/NIS mereka dan password baru ini.
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL / CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Import Data Siswa (.XLS / .CSV)</h3>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">Unduh Template Standar Excel</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">Isi kolom: <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">No Absen, Nama Lengkap, NIS, Email, Kelas</code></p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Template Excel
              </button>
            </div>

            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Berkas CSV / Excel atau Tempel (Paste) Isi Berkas di Bawah:
              </label>
              
              <div className="flex items-center gap-3">
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 border border-slate-200">
                  <Upload className="w-4 h-4 text-slate-600" /> Pilih Berkas Excel / CSV
                  <input
                    type="file"
                    accept=".csv,.txt,.xls,.xlsx"
                    onChange={handleFileUploadImport}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400 font-medium">Atau salin langsung dari Excel ke kotak di bawah</span>
              </div>

              <textarea
                rows={5}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  handleParseImport(e.target.value);
                }}
                placeholder={`Contoh format:\nNo Absen,Nama Lengkap,NIS,Email,Kelas\n1,Budi Santoso,10260,budi@smp.sch.id,VII-A\n2,Siti Aminah,10261,siti@smp.sch.id,VII-A`}
                className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            {/* PREVIEW TABLE */}
            {importPreview.length > 0 && (
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Pratinjau Data Terbaca ({importPreview.length} Siswa):</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-[11px] text-left">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">No</th>
                        <th className="px-3 py-2">Nama Siswa</th>
                        <th className="px-3 py-2">L/P</th>
                        <th className="px-3 py-2">NIS</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Terdeteksi Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {importPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-800">{item.name}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-600">{item.gender || '-'}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-600">{item.nis}</td>
                          <td className="px-3 py-1.5 text-slate-500">{item.email}</td>
                          <td className="px-3 py-1.5 font-bold text-emerald-700">{item.className}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={() => {
                  if (onBulkAddStudents && importPreview.length > 0) {
                    onBulkAddStudents(importPreview);
                    toast(`Berhasil mengimpor ${importPreview.length} data siswa ke dalam database!`);
                    setShowImportModal(false);
                  }
                }}
                className={`px-5 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs text-white ${
                  importPreview.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Simpan & Import {importPreview.length} Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL / CSV MODAL GURU */}
      {showTeacherImportModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Import Data Guru (.XLS / .CSV)</h3>
              </div>
              <button 
                onClick={() => setShowTeacherImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">Unduh Template Standar Excel Guru</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">Isi kolom: <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">Nama Lengkap, NIP, Email, Mata Pelajaran</code></p>
                <p className="text-[10px] text-emerald-700 italic mt-0.5">*Catatan: Untuk &gt;1 mapel, pisahkan dengan koma (misal: Matematika, IPA)</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTeacherTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Template Excel
              </button>
            </div>

            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Berkas CSV / Excel atau Tempel (Paste) Isi Berkas di Bawah:
              </label>
              
              <div className="flex items-center gap-3">
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 border border-slate-200">
                  <Upload className="w-4 h-4 text-slate-600" /> Pilih Berkas Excel / CSV
                  <input
                    type="file"
                    accept=".csv,.txt,.xls,.xlsx"
                    onChange={handleFileUploadTeacherImport}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400 font-medium">Atau salin langsung dari Excel ke kotak di bawah</span>
              </div>

              <textarea
                rows={5}
                value={teacherImportText}
                onChange={(e) => {
                  setTeacherImportText(e.target.value);
                  handleParseTeacherImport(e.target.value);
                }}
                placeholder={`Contoh format:\nNama Lengkap,NIP,Email,Mata Pelajaran\nDrs. H. Ahmad Fauzi M.Pd,197501012000121001,ahmad.fauzi@smp.sch.id,"Matematika, IPA"\nSiti Nurhaliza S.Pd,198203152008012003,siti.nurhaliza@smp.sch.id,Bahasa Indonesia`}
                className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            {/* PREVIEW TABLE */}
            {teacherImportPreview.length > 0 && (
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Pratinjau Data Guru Terbaca ({teacherImportPreview.length} Guru):</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-[11px] text-left">
                    <thead className="bg-slate-50 font-bold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">No</th>
                        <th className="px-3 py-2">Nama Guru</th>
                        <th className="px-3 py-2">NIP</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Mata Pelajaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {teacherImportPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-800">{item.name}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-600">{item.nip}</td>
                          <td className="px-3 py-1.5 text-slate-500">{item.email}</td>
                          <td className="px-3 py-1.5 font-bold text-indigo-700">
                            <div className="flex flex-wrap gap-1">
                              {(item.subject || '').split(',').map((s, sIdx) => (
                                <span key={sIdx} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">
                                  {s.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowTeacherImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={teacherImportPreview.length === 0}
                onClick={handleConfirmTeacherImport}
                className={`px-5 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs text-white ${
                  teacherImportPreview.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Simpan & Import {teacherImportPreview.length} Guru
              </button>
            </div>
          </div>
        </div>
      )}
      {showBulkPromoteModal && (() => {
        const filteredPromoteStudents = activeStudents.filter(s => {
          const matchesClass = promoteFromClassFilter === 'ALL' || s.classId === promoteFromClassFilter;
          const matchesQuery = !promoteSearchQuery || 
            (s.name || '').toLowerCase().includes(promoteSearchQuery.toLowerCase()) || 
            (s.nis || '').includes(promoteSearchQuery);
          return matchesClass && matchesQuery;
        });

        const allFilteredSelected = filteredPromoteStudents.length > 0 && 
          filteredPromoteStudents.every(s => selectedPromoteStudentIds.includes(s.id));

        const toggleSelectAll = () => {
          if (allFilteredSelected) {
            setSelectedPromoteStudentIds(prev => prev.filter(id => !filteredPromoteStudents.some(s => s.id === id)));
          } else {
            const newIds = Array.from(new Set([...selectedPromoteStudentIds, ...filteredPromoteStudents.map(s => s.id)]));
            setSelectedPromoteStudentIds(newIds);
          }
        };

        const toggleSelectStudent = (id: string) => {
          setSelectedPromoteStudentIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          );
        };

        const handleApplyBatchTarget = () => {
          if (!batchTargetClassId) {
            toast.error('Pilih kelas tujuan terlebih dahulu!');
            return;
          }
          if (selectedPromoteStudentIds.length === 0) {
            toast.error('Pilih setidaknya 1 siswa untuk menerapkan kelas tujuan!');
            return;
          }

          setStudentDestMap(prev => {
            const next = { ...prev };
            selectedPromoteStudentIds.forEach(id => {
              next[id] = batchTargetClassId;
            });
            return next;
          });

          const targetClassObj = classes.find(c => c.id === batchTargetClassId);
          const targetName = batchTargetClassId === 'LULUS' ? '🎓 Lulus / Alumni' : `Kelas ${targetClassObj?.name}`;
          toast.success(`Berhasil mengatur tujuan ${selectedPromoteStudentIds.length} siswa terpilih ke ${targetName}`);
        };

        const changedStudentsCount = activeStudents.filter(s => {
          const dest = studentDestMap[s.id];
          return dest && dest !== s.classId;
        }).length;

        const graduatedCount = activeStudents.filter(s => studentDestMap[s.id] === 'LULUS').length;
        const movedClassCount = changedStudentsCount - graduatedCount;

        return (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                      Kelola Kenaikan Kelas, Acak Kelas & Kelulusan Siswa (Per-Siswa)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Atur kelas tujuan baru untuk setiap siswa secara acak/individual tanpa memutus histori data pembelajaran.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBulkPromoteModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Info Banner */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-bold">Keamanan & Keutuhan Data Pembelajaran Terjamin:</p>
                  <p className="text-amber-900">
                    Memindahkan kelas atau meluluskan siswa per-siswa **TIDAK AKAN** menghapus/memutus data riwayat nilai, jurnal, ujian, tugas, maupun konseling BK dari Kelas 7, 8, hingga 9. ID Akun siswa tetap sama.
                  </p>
                </div>
              </div>

              {/* Controls & Batch Action Bar */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shrink-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  {/* Filter Kelas Asal */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Kelas Asal:</span>
                    <select
                      value={promoteFromClassFilter}
                      onChange={(e) => setPromoteFromClassFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer w-full md:w-48"
                    >
                      <option value="ALL">Semua Kelas Asal ({activeStudents.length} Siswa)</option>
                      {sortedClasses.map(c => {
                        const count = activeStudents.filter(s => s.classId === c.id).length;
                        return (
                          <option key={c.id} value={c.id}>Kelas {c.name} ({count} Siswa)</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Search Student */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama atau NIS siswa..."
                      value={promoteSearchQuery}
                      onChange={(e) => setPromoteSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Batch Actions Bar */}
                <div className="pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      <span>{allFilteredSelected ? 'Batal Pilih Semua' : 'Pilih Semua Terlihat'}</span>
                    </button>
                    <span className="text-xs font-semibold text-slate-500">
                      Terpilih: <strong className="text-amber-700 font-extrabold">{selectedPromoteStudentIds.length}</strong> Siswa
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={batchTargetClassId}
                      onChange={(e) => setBatchTargetClassId(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Setel Kelas Tujuan Serentak --</option>
                      {sortedClasses.map(c => (
                        <option key={c.id} value={c.id}>Pindahkan ke Kelas {c.name}</option>
                      ))}
                      <option value="LULUS" className="font-extrabold text-amber-700">🎓 Setel Lulus / Alumni</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBatchTarget}
                      disabled={selectedPromoteStudentIds.length === 0 || !batchTargetClassId}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-xs whitespace-nowrap cursor-pointer ${
                        selectedPromoteStudentIds.length === 0 || !batchTargetClassId
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>

              {/* Student Table List */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl custom-scrollbar min-h-48">
                {filteredPromoteStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium text-xs">
                    Tidak ada siswa ditemukan berdasarkan filter.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-extrabold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Nama Siswa & NIS</th>
                        <th className="p-3 w-28 text-center">Kelas Asal</th>
                        <th className="p-3 w-64">Pilih Kelas Tujuan Baru</th>
                        <th className="p-3 w-36 text-center">Status Perubahan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPromoteStudents.map((s, idx) => {
                        const isChecked = selectedPromoteStudentIds.includes(s.id);
                        const currentClassName = getClassName(s.classId);
                        const targetClassId = studentDestMap[s.id] || s.classId;
                        const isGraduating = targetClassId === 'LULUS';
                        const isMoved = targetClassId !== s.classId;
                        const targetClassObj = classes.find(c => c.id === targetClassId);

                        return (
                          <tr 
                            key={s.id} 
                            className={`hover:bg-amber-50/40 transition ${
                              isChecked ? 'bg-amber-50/60' : ''
                            } ${isMoved ? 'bg-emerald-50/20' : ''}`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectStudent(s.id)}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 text-xs">{s.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                NIS: {s.nis} {s.gender ? `• (${s.gender})` : ''}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-2.5 py-1 rounded-lg text-[11px]">
                                {currentClassName}
                              </span>
                            </td>
                            <td className="p-3">
                              <select
                                value={targetClassId}
                                onChange={(e) => setStudentDestMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                                className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold outline-none cursor-pointer transition ${
                                  isGraduating 
                                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold' 
                                    : isMoved 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold' 
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                {sortedClasses.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.id === s.classId ? `[Kelas Saat Ini] Kelas ${c.name}` : `→ Pindahkan ke Kelas ${c.name}`}
                                  </option>
                                ))}
                                <option value="LULUS" className="font-extrabold text-amber-700">🎓 Setel Lulus / Alumni</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              {isGraduating ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                                  🎓 Lulus (Alumni)
                                </span>
                              ) : isMoved ? (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                                  → Kelas {targetClassObj?.name || 'Baru'}
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded text-[10px]">
                                  Tetap
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer Summary & Save */}
              <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-bold text-slate-600">Ringkasan Aksi:</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-2.5 py-1 rounded-lg text-[11px]">
                    Naik/Pindah: {movedClassCount} Siswa
                  </span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 font-extrabold px-2.5 py-1 rounded-lg text-[11px]">
                    Lulus: {graduatedCount} Siswa
                  </span>
                  <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                    Tetap: {activeStudents.length - changedStudentsCount} Siswa
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBulkPromoteModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={changedStudentsCount === 0}
                    onClick={() => {
                      const changedStudents = activeStudents.filter(s => {
                        const dest = studentDestMap[s.id];
                        return dest && dest !== s.classId;
                      });

                      if (changedStudents.length === 0) {
                        toast.error('Tidak ada perubahan kelas/status siswa.');
                        return;
                      }

                      setShowSavePromoteConfirm(true);
                    }}
                    className={`px-5 py-2.5 rounded-xl transition cursor-pointer text-white shadow-md flex items-center gap-2 ${
                      changedStudentsCount === 0
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Simpan Perubahan Kelas ({changedStudentsCount} Siswa Berubah)</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION MODAL FOR SAVING PER-STUDENT CLASS PROMOTIONS */}
      {showSavePromoteConfirm && (() => {
        const changedStudents = activeStudents.filter(s => {
          const dest = studentDestMap[s.id];
          return dest && dest !== s.classId;
        });
        const graduatedCount = changedStudents.filter(s => studentDestMap[s.id] === 'LULUS').length;
        const movedCount = changedStudents.length - graduatedCount;

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
                <GraduationCap className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-lg">Konfirmasi Pemindahan / Kenaikan Kelas</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Anda akan memperbarui penempatan kelas untuk <strong className="text-slate-900 font-extrabold">{changedStudents.length} siswa</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-left space-y-2 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Naik / Pindah Kelas:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">{movedCount} Siswa</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Setel Lulus (Alumni):</span>
                  <span className="font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">{graduatedCount} Siswa</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500">Histori Pembelajaran (Jurnal, Nilai, BK):</span>
                  <span className="font-extrabold text-indigo-700">Tetap Utuh</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowSavePromoteConfirm(false)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateStudent) {
                      changedStudents.forEach(s => {
                        const dest = studentDestMap[s.id];
                        if (dest === 'LULUS') {
                          onUpdateStudent({
                            ...s,
                            status: 'Lulus',
                            className: 'Alumni'
                          });
                        } else {
                          const targetClassObj = classes.find(c => c.id === dest);
                          onUpdateStudent({
                            ...s,
                            classId: dest,
                            className: targetClassObj?.name || getClassName(dest),
                            status: 'Aktif'
                          });
                        }
                      });
                    }

                    toast.success(`Berhasil memperbarui kelas & status ${changedStudents.length} siswa! Data riwayat pembelajaran tersimpan utuh.`);
                    setShowSavePromoteConfirm(false);
                    setShowBulkPromoteModal(false);
                  }}
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition cursor-pointer shadow-md shadow-amber-200 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-500">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Hapus Siswa Per Kelas</h3>
              </div>
              <button 
                onClick={() => setShowBulkDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-left font-medium">
              Fitur ini memungkinkan Admin untuk menghapus seluruh data siswa di kelas yang dipilih. 
              <strong>Peringatan:</strong> Aksi ini tidak dapat dibatalkan.
            </p>

            <div className="space-y-4 text-left bg-red-50/50 p-4 rounded-xl border border-red-100">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700">Pilih Kelas yang Akan Dihapus:</label>
                <select
                  value={deleteClassId}
                  onChange={(e) => setDeleteClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 bg-white"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {sortedClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeStudents.filter(s => s.classId === deleteClassId).length > 0 && (
              <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs text-left">
                Terdapat <strong>{activeStudents.filter(s => s.classId === deleteClassId).length} siswa</strong> di kelas ini yang akan terhapus.
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={activeStudents.filter(s => s.classId === deleteClassId).length === 0}
                onClick={() => {
                  const targetStudents = activeStudents.filter(s => s.classId === deleteClassId);
                  if (targetStudents.length === 0) return;
                  
                  setConfirmModal({
                    isOpen: true,
                    message: `Anda yakin ingin menghapus ${targetStudents.length} siswa dari kelas ini?`,
                    onConfirm: () => {
                      if (onDeleteStudent) {
                        targetStudents.forEach(s => onDeleteStudent(s.id));
                      }
                      toast(`Berhasil menghapus ${targetStudents.length} siswa.`);
                      setShowBulkDeleteModal(false);
                    }
                  });
                }}
                className={`px-4 py-2 rounded-lg transition cursor-pointer text-white shadow-xs ${
                  activeStudents.filter(s => s.classId === deleteClassId).length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Hapus Siswa Masal
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* MODAL BAGIKAN MODULE ADMIN */}
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
                    {teachers.map(t => (
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
    </div>
  );
}
