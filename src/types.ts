export interface SchoolConfig {
  logoUrl: string;
  headerAppName: string;
  headerSubtitle: string;
  landingTopTag: string;
  landingTitle: string;
  landingDescription: string;
  footerText: string;
  adminPassword?: string;
  principalName?: string;
  principalNip?: string;
  academicYear?: string;
  semester?: 'Ganjil' | 'Genap';
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  email: string;
  subject: string;
  photoUrl: string;
  password?: string;
  isAdmin?: boolean;
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface SubjectItem {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  email: string;
  classId: string;
  className?: string;
  password?: string;
  status?: 'Aktif' | 'Lulus' | 'Pindah';
  noAbsen?: number;
  archivedAt?: string;
  gender?: 'L' | 'P';
}

export interface Material {
  id: string;
  title: string;
  classId: string | string[];
  subjectId: string;
  fileType: 'PDF' | 'Video' | 'Link' | 'Article' | 'Word' | 'Excel' | 'PPT';
  fileUrl: string;
  content?: string; // Rich text content if fileType is Article
  status: 'Aktif' | 'Draft';
  teacherId: string;
  createdAt: string;
}

export interface TeachingModule {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
  type?: 'file' | 'folder';
  parentId?: string | null;
}

export interface AttendanceStatus {
  studentId: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface JournalEntry {
  id: string;
  date: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  topic: string;
  learningObjectives?: string;
  notes: string;
  startPeriod?: number;
  endPeriod?: number;
  attendance: AttendanceStatus[];
}

export type QuestionType = 
  | 'PilihanGanda' 
  | 'PilihanGandaKompleks' 
  | 'PilihanAsosiatif' 
  | 'SebabAkibat'
  | 'Uraian';

export interface BaseQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  mediaUrl?: string;
  mediaType?: 'Image' | 'Video' | 'Audio' | 'None';
  score?: number;
  fontPreset?: 'Sans' | 'Serif' | 'Grotesk' | 'Mono';
}

export interface PilihanGandaQuestion extends BaseQuestion {
  type: 'PilihanGanda';
  options: string[]; // ['A', 'B', 'C', 'D']
  correctAnswer: string; // 'A'
}

export interface PilihanGandaKompleksQuestion extends BaseQuestion {
  type: 'PilihanGandaKompleks';
  options: string[]; // ['Opsi A', 'Opsi B', 'Opsi C']
  correctAnswers: string[]; // ['Opsi A', 'Opsi C']
}

export interface PilihanAsosiatifQuestion extends BaseQuestion {
  type: 'PilihanAsosiatif';
  statements: string[]; // ['(1) Pernyataan 1', '(2) Pernyataan 2', '(3) Pernyataan 3', '(4) Pernyataan 4']
  correctCombination: number[]; // [1, 3] or [1, 2, 3] or [4]
  // GAS evaluation logic:
  // 1, 2, 3 benar -> A
  // 1, 3 benar -> B
  // 2, 4 benar -> C
  // Hanya 4 benar -> D
  // Semua benar -> E
}

export interface SebabAkibatQuestion extends BaseQuestion {
  type: 'SebabAkibat';
  statement: string; // Pernyataan pertama
  reason: string; // Pernyataan kedua (Sebab)
  correctStatementTrue: boolean; // Apakah pernyataan benar?
  correctReasonTrue: boolean; // Apakah alasan benar?
  correctCausality: boolean; // Apakah ada hubungan sebab-akibat?
}

export interface UraianQuestion extends BaseQuestion {
  type: 'Uraian';
  correctAnswer?: string; // Optional: Kunci jawaban atau rubrik untuk uraian
}

export type ExamQuestion = 
  | PilihanGandaQuestion 
  | PilihanGandaKompleksQuestion 
  | PilihanAsosiatifQuestion 
  | SebabAkibatQuestion
  | UraianQuestion;

export interface QuestionBank {
  id: string;
  title: string;
  subjectId: string;
  teacherId: string;
  questions: ExamQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  token: string;
  durationMinutes: number;
  questions: ExamQuestion[];
  createdAt: string;
  teacherId?: string;
  showScoreToStudent?: boolean;
}

export interface CheatLog {
  id: string;
  studentName: string;
  studentNis: string;
  className: string;
  examTitle: string;
  timestamp: string;
  violationType: string;
  examId?: string;
  teacherId?: string;
  subjectId?: string;
  classId?: string;
}

export interface CounselingReferral {
  id: string;
  teacherId: string;
  studentNis: string;
  studentName: string;
  className: string;
  issueCategory: string;
  issueDetails: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai';
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  createdAt: string;
}

export interface CounselingSession {
  id: string;
  referralId?: string;
  studentNis: string;
  studentName: string;
  className: string;
  date: string;
  counselorName: string;
  notes: string;
  actionTaken: string;
  isABK: boolean;
  abkNotes?: string;
  status: 'Selesai' | 'Butuh Tindak Lanjut';
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentName: string;
  studentNis: string;
  className: string;
  score: number;
  submittedAt: string;
  answers: {
    questionId: string;
    studentAnswer: any; // Format varies by type
    isCorrect: boolean;
    pointsEarned: number;
    essayScore?: number;
    teacherNote?: string;
  }[];
  cheatingAttempts: number;
  essayGraded?: boolean;
  manualTotalScore?: number;
  teacherFeedback?: string;
}

export interface TeacherScheduleNote {
  id: string;
  teacherId: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jum\'at' | 'Sabtu';
  jamKe: string;
  classId: string;
  className: string;
  room?: string;
  note: string;
}

export interface TeacherAnnouncement {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  targetType: 'all' | 'class';
  targetClassId?: string;
  targetClassName?: string;
  title: string;
  content: string;
  priority: 'normal' | 'penting' | 'mendesak';
  createdAt: string;
  isActive: boolean;
}

export interface RegistrationRequest {
  id: string;
  role: 'Teacher' | 'Student';
  name: string;
  identifier: string; // NIP for Teacher, NIS for Student
  passwordOrEmail: string; // password/email
  subjectOrClass: string; // Mata Pelajaran or Kelas
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  isAdmin?: boolean;
}

export interface ShareRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  itemId: string; // Material ID or QuestionBank ID
  itemType: 'Material' | 'QuestionBank' | 'TeachingModule';
  itemTitle: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}



export interface GlobalAnnouncement {
  id: string;
  title: string;
  content: string;
  targetRole: 'Teacher' | 'Student' | 'All';
  priority: 'info' | 'penting' | 'mendesak';
  createdAt: string;
}

export interface ManualGrade {
  studentId: string;
  studentName: string;
  studentNis: string;
  score: number;
  criteriaGrades?: Record<string, string>;
  notes?: string;
}

export interface ManualAssessment {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  type: string;
  criteriaNames?: string[];
  grades: ManualGrade[];
  createdAt: string;
}


export interface DailyCheckIn {
  id: string;
  studentNis: string;
  date: string;
  mood: 'Senang' | 'Biasa' | 'Sedih' | 'Marah' | 'Takut' | 'Lelah';
  note?: string;
  createdAt: string;
}

export interface NeedsAssessment {
  id: string;
  studentNis: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  q11: number;
  q12: number;
  q13: number;
  q14: number;
  q15: number;
  q16: number;
  essayEmotion: string;
  essaySocial: string;
  essayAcademic: string;
  essayCareer: string;
  createdAt: string;
}

export interface Sociometry {
  id: string;
  studentNis: string;
  classId: string;
  friendsWith: string[];
  createdAt: string;
}

export interface HomeVisit {
  id: string;
  studentNis: string;
  studentName: string;
  className: string;
  date: string;
  counselorName: string;
  purpose: string;
  parentName: string;
  visitResult: string;
  followUp: string;
  status: 'Direncanakan' | 'Selesai';
  createdAt: string;
}

export interface CareerPlan {
  id: string;
  studentNis: string;
  studentName: string;
  className: string;
  interests: string[];
  strengths: string[];
  targetUniversity?: string;
  targetMajor?: string;
  targetCareer: string;
  counselorNotes?: string;
  updatedAt: string;
}

export interface AssignmentFolder {
  id: string;
  title: string;
  type: 'folder' | 'assignment';
  parentId?: string | null;
  classId?: string;
  subjectId?: string;
  teacherId: string;
  teacherName?: string;
  dueDate?: string;
  description?: string;
  gdriveFolderUrl?: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentFolderId?: string;
  assignmentId?: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  classId?: string;
  studentClass?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  submissionType?: 'direct_file' | 'gdrive_link';
  notes?: string;
  submittedAt: string;
  status: 'Dikumpulkan' | 'Sudah Dikumpulkan' | 'Perlu Perbaikan' | 'Dinilai';
  grade?: number;
  feedback?: string;
}

export interface LivePresentationSession {
  id?: string;
  active: boolean;
  materialId: string;
  materialTitle: string;
  teacherId: string;
  teacherName: string;
  classId?: string;
  className?: string;
  subjectName?: string;
  currentSlide: number;
  totalSlides: number;
  zoomLevel?: number;
  laserPointer?: { x: number; y: number } | null;
  scrollPosition?: number;
  presenterNote?: string;
  slideImages?: string[];
  updatedAt?: number;
  startedAt?: string;
}

