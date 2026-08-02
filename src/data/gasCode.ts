export const SPREADSHEET_STRUCTURE = `
=========================================
STRUKTUR DATABASE GOOGLE SPREADSHEET
=========================================

Gunakan satu file Google Spreadsheet utama, lalu buatlah sheet-sheet berikut dengan nama persis sesuai di bawah ini. Pastikan baris pertama adalah nama kolom (Header).

1. Sheet: Users
   Kolom: [ id, username, password, role, name ]
   *Catatan: Menyimpan kredensial login admin dan guru (role: 'Admin', 'Pengajar').

2. Sheet: Pengajar
   Kolom: [ id, name, nip, email, subject, photoUrl ]
   *Catatan: Menyimpan biodata guru pengajar beserta link Google Drive foto profil mereka.

3. Sheet: Mapel
   Kolom: [ id, name ]
   *Catatan: Daftar mata pelajaran (misal: 'Bahasa Indonesia', 'Matematika', 'IPA').

4. Sheet: Siswa
   Kolom: [ id, nis, name, email, classId ]
   *Catatan: Menyimpan data siswa beserta NIS (digunakan sebagai kata sandi login siswa).

5. Sheet: Kelas
   Kolom: [ id, name ]
   *Catatan: Daftar kelas (misal: 'VII-A', 'VIII-B', 'IX-C').

6. Sheet: JurnalMengajar
   Kolom: [ id, date, classId, subjectId, teacherId, topic, notes, attendanceJson ]
   *Catatan: Menyimpan log pengajaran guru beserta detail kehadiran siswa dalam format JSON.

7. Sheet: Materi
   Kolom: [ id, title, classId, subjectId, fileType, fileUrl, status, teacherId, createdAt ]
   *Catatan: File materi pelajaran yang diunggah ke Google Drive dengan toggle Aktif/Draft.

8. Sheet: Ujian
   Kolom: [ id, title, classId, subjectId, token, durationMinutes, questionsJson, createdAt ]
   *Catatan: Menyimpan informasi paket ujian dan kumpulan soal format ANBK dalam format JSON.

9. Sheet: JawabanUjian
   Kolom: [ id, examId, studentNis, studentName, className, score, submittedAt, answersJson, cheatingAttempts ]
   *Catatan: Menyimpan skor akhir ujian siswa, log jawaban, dan jumlah deteksi pindah tab (anti-contek).
`;

export const CODE_GS = `/**
 * ====================================================================
 * SYSTEM UTAMA GOOGLE APPS SCRIPT - Code.gs
 * ====================================================================
 * Nama Aplikasi: JURNAL MENGAJAR GURU SMP Web App
 * Deskripsi: Penanganan Routing Web, Autentikasi, Database CRUD,
 *            dan Integrasi Unggah File Google Drive.
 */

// Ganti ID Spreadsheet Anda di sini!
const SPREADSHEET_ID = "ID_SPREADSHEET_UTAMA_ANDA"; 
// Ganti ID Folder Google Drive untuk Unggahan File di sini!
const DRIVE_FOLDER_ID = "ID_FOLDER_GOOGLE_DRIVE_ANDA";

/**
 * Endpoint Utama Web App
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
      .setTitle('Jurnal Mengajar Guru SMP')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Fungsi untuk menyertakan file HTML/CSS/JS lain ke dalam Index.html
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper untuk mendapatkan akses Spreadsheet
 */
function getDb() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * ----------------------------------------------------
 * SYSTEM AUTENTIKASI (LOGIN)
 * ----------------------------------------------------
 */
function processLogin(usernameOrNis, passwordOrEmail, loginType) {
  const db = getDb();
  
  if (loginType === 'siswa') {
    const sheet = db.getSheetByName('Siswa');
    const data = sheet.getDataRange().getValues();
    // Index: [0: id, 1: nis, 2: name, 3: email, 4: classId]
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim() === usernameOrNis.trim() && String(data[i][3]).trim().toLowerCase() === passwordOrEmail.trim().toLowerCase()) {
        const classSheet = db.getSheetByName('Kelas');
        const classData = classSheet.getDataRange().getValues();
        let className = "Tidak Diketahui";
        for (let c = 1; c < classData.length; c++) {
          if (classData[c][0] === data[i][4]) {
            className = classData[c][1];
            break;
          }
        }
        return {
          status: 'success',
          role: 'Siswa',
          user: {
            id: data[i][0],
            nis: data[i][1],
            name: data[i][2],
            email: data[i][3],
            classId: data[i][4],
            className: className
          }
        };
      }
    }
    return { status: 'error', message: 'NIS atau Email Siswa tidak terdaftar!' };
  } else {
    // Admin / Guru
    const sheet = db.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    // Index: [0: id, 1: username, 2: password, 3: role, 4: name]
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim().toLowerCase() === usernameOrNis.trim().toLowerCase() && String(data[i][2]).trim() === passwordOrEmail.trim()) {
        return {
          status: 'success',
          role: data[i][3], // 'Admin' atau 'Pengajar'
          user: {
            id: data[i][0],
            username: data[i][1],
            role: data[i][3],
            name: data[i][4]
          }
        };
      }
    }
    return { status: 'error', message: 'Username atau Password salah!' };
  }
}

/**
 * ----------------------------------------------------
 * UNGGAH BERKAS KE GOOGLE DRIVE (FOTO & MATERI)
 * ----------------------------------------------------
 */
function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const decodedData = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      status: 'success',
      url: file.getUrl(),
      fileId: file.getId()
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

/**
 * ----------------------------------------------------
 * MANAJEMEN GURU (CRUD ADMIN)
 * ----------------------------------------------------
 */
function getTeachers() {
  const db = getDb();
  const sheet = db.getSheetByName('Pengajar');
  const data = sheet.getDataRange().getValues();
  const teachers = [];
  for (let i = 1; i < data.length; i++) {
    teachers.push({
      id: data[i][0],
      name: data[i][1],
      nip: data[i][2],
      email: data[i][3],
      subject: data[i][4],
      photoUrl: data[i][5]
    });
  }
  return teachers;
}

function saveTeacher(teacherData) {
  const db = getDb();
  const sheet = db.getSheetByName('Pengajar');
  const uuid = Utilities.getUuid();
  
  sheet.appendRow([
    uuid,
    teacherData.name,
    teacherData.nip,
    teacherData.email,
    teacherData.subject,
    teacherData.photoUrl || ''
  ]);

  // Tambahkan juga kredensial login default ke tabel Users
  const userSheet = db.getSheetByName('Users');
  userSheet.appendRow([
    Utilities.getUuid(),
    teacherData.nip, // Username default menggunakan NIP
    'guru123',       // Password default
    'Pengajar',
    teacherData.name
  ]);

  return { status: 'success' };
}

function deleteTeacher(id) {
  const db = getDb();
  const sheet = db.getSheetByName('Pengajar');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Guru tidak ditemukan!' };
}

/**
 * ----------------------------------------------------
 * JURNAL MENGAJAR (LOG UTAMA GURU)
 * ----------------------------------------------------
 */
function getJournals() {
  const db = getDb();
  const sheet = db.getSheetByName('JurnalMengajar');
  const data = sheet.getDataRange().getValues();
  const journals = [];
  for (let i = 1; i < data.length; i++) {
    journals.push({
      id: data[i][0],
      date: Utilities.formatDate(new Date(data[i][1]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      classId: data[i][2],
      subjectId: data[i][3],
      teacherId: data[i][4],
      topic: data[i][5],
      notes: data[i][6],
      attendance: JSON.parse(data[i][7] || '[]')
    });
  }
  return journals;
}

function submitJournal(journalData) {
  try {
    const db = getDb();
    const sheet = db.getSheetByName('JurnalMengajar');
    const id = Utilities.getUuid();
    sheet.appendRow([
      id,
      journalData.date,
      journalData.classId,
      journalData.subjectId,
      journalData.teacherId,
      journalData.topic,
      journalData.notes,
      JSON.stringify(journalData.attendance)
    ]);
    return { status: 'success', id: id };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

/**
 * ----------------------------------------------------
 * MATERI BELAJAR (CRUD GURU & SISWA READ)
 * ----------------------------------------------------
 */
function getMaterials(classId) {
  const db = getDb();
  const sheet = db.getSheetByName('Materi');
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const mat = {
      id: data[i][0],
      title: data[i][1],
      classId: data[i][2],
      subjectId: data[i][3],
      fileType: data[i][4],
      fileUrl: data[i][5],
      status: data[i][6],
      teacherId: data[i][7],
      createdAt: data[i][8]
    };
    if (classId) {
      if (mat.classId === classId && mat.status === 'Aktif') {
        list.push(mat);
      }
    } else {
      list.push(mat);
    }
  }
  return list;
}

function saveMaterial(materiData) {
  const db = getDb();
  const sheet = db.getSheetByName('Materi');
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    materiData.title,
    materiData.classId,
    materiData.subjectId,
    materiData.fileType,
    materiData.fileUrl,
    materiData.status,
    materiData.teacherId,
    new Date().toISOString()
  ]);
  return { status: 'success', id: id };
}

function toggleMaterialStatus(id, currentStatus) {
  const db = getDb();
  const sheet = db.getSheetByName('Materi');
  const data = sheet.getDataRange().getValues();
  const newStatus = currentStatus === 'Aktif' ? 'Draft' : 'Aktif';
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 7).setValue(newStatus);
      return { status: 'success', newStatus: newStatus };
    }
  }
  return { status: 'error', message: 'Materi tidak ditemukan' };
}
`;

export const UJIAN_CONTROLLER_GS = `/**
 * ====================================================================
 * LOGIKA PENILAIAN OTOMATIS ANBK & MANAJEMEN UJIAN - UjianController.gs
 * ====================================================================
 * Fungsi: Evaluasi multi-format soal ANBK:
 *         1. Pilihan Ganda Standar
 *         2. Pilihan Ganda Kompleks (JSON Multi-select)
 *         3. Pilihan Asosiatif (Logika kombinasi angka 1,2,3,4)
 *         4. Pilihan Sebab-Akibat (Pernyataan, Alasan, Hubungan Kausalitas)
 */

function getExams(classId) {
  const db = getDb();
  const sheet = db.getSheetByName('Ujian');
  const data = sheet.getDataRange().getValues();
  const exams = [];
  for (let i = 1; i < data.length; i++) {
    const exam = {
      id: data[i][0],
      title: data[i][1],
      classId: data[i][2],
      subjectId: data[i][3],
      token: data[i][4],
      durationMinutes: Number(data[i][5]),
      questions: JSON.parse(data[i][6] || '[]'),
      createdAt: data[i][7]
    };
    if (classId) {
      if (exam.classId === classId) {
        exams.push(exam);
      }
    } else {
      exams.push(exam);
    }
  }
  return exams;
}

function saveExam(examData) {
  const db = getDb();
  const sheet = db.getSheetByName('Ujian');
  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    examData.title,
    examData.classId,
    examData.subjectId,
    examData.token,
    examData.durationMinutes,
    JSON.stringify(examData.questions),
    new Date().toISOString()
  ]);
  return { status: 'success', id: id };
}

/**
 * ----------------------------------------------------
 * CORE ENGINE: PENILAIAN LOGIKA ANBK
 * ----------------------------------------------------
 */
function submitExamAnswers(submission) {
  try {
    const db = getDb();
    const examSheet = db.getSheetByName('Ujian');
    const examData = examSheet.getDataRange().getValues();
    
    let targetExam = null;
    for (let i = 1; i < examData.length; i++) {
      if (examData[i][0] === submission.examId) {
        targetExam = {
          id: examData[i][0],
          questions: JSON.parse(examData[i][6] || '[]')
        };
        break;
      }
    }
    
    if (!targetExam) {
      return { status: 'error', message: 'Paket Ujian tidak ditemukan!' };
    }

    const questions = targetExam.questions;
    const studentAnswers = submission.answers; // Map of { questionId: answer }
    let totalPoints = 0;
    let maxPoints = questions.length; // Setiap soal bernilai 1 poin maksimal
    const evaluatedAnswers = [];

    questions.forEach(q => {
      const studentAns = studentAnswers[q.id];
      let isCorrect = false;
      let pointsEarned = 0;

      switch (q.type) {
        case 'PilihanGanda':
          // 1. Pilihan Ganda Standar (Tunggal)
          if (studentAns && String(studentAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
            isCorrect = true;
            pointsEarned = 1;
          }
          break;

        case 'PilihanGandaKompleks':
          // 2. Pilihan Ganda Kompleks (JSON Array / Multiselect)
          // Jawaban benar: Array string opsi yang benar.
          // Jawaban siswa: Array string opsi yang dipilih siswa.
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
          // 3. Pilihan Asosiatif (Logika kombinasi angka 1,2,3,4)
          // Berdasarkan aturan Asosiatif ANBK Nasional:
          // A: 1, 2, 3 benar
          // B: 1, 3 benar
          // C: 2, 4 benar
          // D: Hanya 4 benar
          // E: Semua benar (1, 2, 3, 4 benar)
          if (studentAns) {
            const correctCombination = q.correctCombination || []; // misal: [1, 3]
            let computedKey = '';
            
            // Evaluasi kombinasi
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
          // 4. Pilihan Sebab-Akibat (Pernyataan dan Alasan)
          // Opsi Jawaban:
          // A: Pernyataan BENAR, Alasan BENAR, keduanya menunjukkan Hubungan Sebab-Akibat
          // B: Pernyataan BENAR, Alasan BENAR, keduanya TIDAK menunjukkan Hubungan Sebab-Akibat
          // C: Pernyataan BENAR, Alasan SALAH
          // D: Pernyataan SALAH, Alasan BENAR
          // E: Pernyataan dan Alasan keduanya SALAH
          if (studentAns) {
            let computedKey = '';
            const pBenar = q.correctStatementTrue; // boolean
            const aBenar = q.correctReasonTrue;    // boolean
            const hubSebab = q.correctCausality;   // boolean

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
      }

      if (isCorrect) {
        totalPoints += pointsEarned;
      }

      evaluatedAnswers.push({
        questionId: q.id,
        studentAnswer: studentAns,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned
      });
    });

    const finalScore = Math.round((totalPoints / maxPoints) * 100) || 0;

    // Catat ke sheet JawabanUjian
    const answerSheet = db.getSheetByName('JawabanUjian');
    const submissionId = Utilities.getUuid();
    answerSheet.appendRow([
      submissionId,
      submission.examId,
      submission.studentNis,
      submission.studentName,
      submission.className,
      finalScore,
      new Date().toISOString(),
      JSON.stringify(evaluatedAnswers),
      submission.cheatingAttempts || 0
    ]);

    return {
      status: 'success',
      score: finalScore,
      totalPoints: totalPoints,
      maxPoints: maxPoints,
      answers: evaluatedAnswers
    };
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}
`;

export const FRONTEND_INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
      }
    </style>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <div id="app" class="min-h-screen flex flex-col">
      <!-- Routing dinamis ditangani oleh Javascript Client-Side -->
      <header class="bg-indigo-600 text-white shadow-md p-4">
        <div class="container mx-auto flex justify-between items-center">
          <h1 class="text-xl font-bold">Jurnal Mengajar Guru SMP</h1>
          <span id="roleBadge" class="hidden bg-indigo-500 px-3 py-1 rounded text-xs font-semibold"></span>
        </div>
      </header>

      <main class="flex-grow container mx-auto p-4 md:py-8">
        <!-- SEKSI LOGIN -->
        <div id="loginView" class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 my-12">
          <h2 class="text-2xl font-bold text-center mb-6 text-indigo-700">Masuk Sistem</h2>
          
          <div class="flex border-b mb-6">
            <button onclick="switchLoginTab('staff')" id="tabStaff" class="w-1/2 py-2 text-center font-medium border-b-2 border-indigo-600 text-indigo-600">Guru / Admin</button>
            <button onclick="switchLoginTab('siswa')" id="tabSiswa" class="w-1/2 py-2 text-center font-medium text-slate-500 hover:text-slate-700">Siswa</button>
          </div>

          <form id="loginForm" onsubmit="handleLogin(event)">
            <div class="mb-4">
              <label id="userLabel" class="block text-sm font-semibold mb-2">Username / NIP</label>
              <input type="text" id="usernameInput" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div class="mb-6">
              <label id="passLabel" class="block text-sm font-semibold mb-2">Password</label>
              <input type="password" id="passwordInput" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition">Masuk</button>
          </form>
          <div id="loginError" class="mt-4 text-red-600 text-sm font-medium text-center hidden"></div>
        </div>

        <!-- SEKSI DASHBOARD (Akan diisi secara dinamis) -->
        <div id="dashboardView" class="hidden">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-extrabold text-slate-900" id="welcomeUser">Selamat Datang</h2>
            <button onclick="logout()" class="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg text-sm">Keluar</button>
          </div>

          <div id="dashboardContent"></div>
        </div>
      </main>
    </div>

    <!-- Javascript Integrasi GAS -->
    <script>
      let currentRole = '';
      let currentUser = null;
      let activeLoginTab = 'staff';

      function switchLoginTab(tab) {
        activeLoginTab = tab;
        const tabStaff = document.getElementById('tabStaff');
        const tabSiswa = document.getElementById('tabSiswa');
        const userLabel = document.getElementById('userLabel');
        const passLabel = document.getElementById('passLabel');

        if (tab === 'staff') {
          tabStaff.className = "w-1/2 py-2 text-center font-medium border-b-2 border-indigo-600 text-indigo-600";
          tabSiswa.className = "w-1/2 py-2 text-center font-medium text-slate-500 hover:text-slate-700";
          userLabel.innerText = "Username / NIP";
          passLabel.innerText = "Password";
        } else {
          tabSiswa.className = "w-1/2 py-2 text-center font-medium border-b-2 border-indigo-600 text-indigo-600";
          tabStaff.className = "w-1/2 py-2 text-center font-medium text-slate-500 hover:text-slate-700";
          userLabel.innerText = "NIS Siswa";
          passLabel.innerText = "Email Terdaftar";
        }
      }

      function handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('usernameInput').value;
        const pass = document.getElementById('passwordInput').value;
        const errorDiv = document.getElementById('loginError');
        errorDiv.classList.add('hidden');

        // Memanggil GAS backend processLogin(usernameOrNis, passwordOrEmail, loginType)
        google.script.run
          .withSuccessHandler(function(result) {
            if (result.status === 'success') {
              currentRole = result.role;
              currentUser = result.user;
              showDashboard();
            } else {
              errorDiv.innerText = result.message;
              errorDiv.classList.remove('hidden');
            }
          })
          .withFailureHandler(function(err) {
            errorDiv.innerText = "Koneksi server gagal: " + err;
            errorDiv.classList.remove('hidden');
          })
          .processLogin(user, pass, activeLoginTab);
      }

      function showDashboard() {
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('dashboardView').classList.remove('hidden');
        
        const badge = document.getElementById('roleBadge');
        badge.innerText = currentRole;
        badge.classList.remove('hidden');
        
        document.getElementById('welcomeUser').innerText = "Halo, " + currentUser.name;
        
        // Memuat template dashboard yang sesuai berdasarkan role
        loadRoleDashboard();
      }

      function loadRoleDashboard() {
        const container = document.getElementById('dashboardContent');
        container.innerHTML = '<p class="text-center text-slate-500 py-12">Memuat halaman dashboard...</p>';
        
        if (currentRole === 'Pengajar') {
          // Memanggil include file 'DashboardGuru'
          google.script.run
            .withSuccessHandler(function(html) {
              container.innerHTML = html;
              initGuruDashboard();
            })
            .include('DashboardGuru');
        } else if (currentRole === 'Admin') {
          container.innerHTML = '<div class="bg-white p-6 rounded-lg shadow-md"><h3 class="text-xl font-bold mb-4">Admin Dashboard</h3><p>Gunakan panel admin untuk memanajemen Siswa, Guru, Kelas, dan Mapel.</p></div>';
        } else {
          container.innerHTML = '<div class="bg-white p-6 rounded-lg shadow-md"><h3 class="text-xl font-bold mb-4">Siswa Dashboard</h3><p>Lihat Materi Pembelajaran dan selesaikan Ujian CBT ANBK di sini.</p></div>';
        }
      }

      function logout() {
        currentRole = '';
        currentUser = null;
        document.getElementById('loginView').classList.remove('hidden');
        document.getElementById('dashboardView').classList.add('hidden');
        document.getElementById('roleBadge').classList.add('hidden');
        document.getElementById('loginForm').reset();
      }
    </script>
  </body>
</html>
`;

export const FRONTEND_GURU_HTML = `<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
  <!-- Navigasi Guru -->
  <div class="md:col-span-1 bg-white p-4 rounded-xl shadow-md flex flex-col space-y-2">
    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Navigasi Pengajar</h3>
    <button onclick="switchGuruSection('jurnal')" id="btnJurnal" class="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700">📝 Jurnal Mengajar</button>
    <button onclick="switchGuruSection('materi')" id="btnMateri" class="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">📚 Materi Pelajaran</button>
    <button onclick="switchGuruSection('ujian')" id="btnUjian" class="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">✍️ Ujian ANBK CBT</button>
  </div>

  <!-- Konten Section -->
  <div class="md:col-span-3">
    <!-- 1. JURNAL MENGAJAR (FITUR UTAMA) -->
    <div id="secJurnal" class="bg-white p-6 rounded-xl shadow-md space-y-6">
      <div>
        <h3 class="text-xl font-bold text-slate-800">Formulir Jurnal Mengajar Digital</h3>
        <p class="text-sm text-slate-500">Mencatat tanggal, kelas, mata pelajaran, topik bahasan, dan presensi siswa secara real-time.</p>
      </div>

      <form id="journalForm" onsubmit="saveJournal(event)" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold mb-1">Tanggal</label>
            <input type="date" id="jurnalDate" required class="w-full px-3 py-2 border rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1">Kelas</label>
            <select id="jurnalClass" required class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Pilih Kelas</option>
              <option value="class-1">VII-A</option>
              <option value="class-2">VIII-B</option>
              <option value="class-3">IX-C</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1">Mata Pelajaran</label>
            <select id="jurnalSubject" required class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Pilih Mapel</option>
              <option value="subj-1">Bahasa Indonesia</option>
              <option value="subj-2">Matematika</option>
              <option value="subj-3">IPA</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold mb-1">Topik Pembelajaran</label>
          <input type="text" id="jurnalTopic" required placeholder="Contoh: Aljabar Linier atau Teks Deskripsi" class="w-full px-3 py-2 border rounded-lg text-sm">
        </div>

        <div>
          <label class="block text-xs font-semibold mb-1">Catatan KBM / Kendala</label>
          <textarea id="jurnalNotes" rows="3" placeholder="Tulis catatan kelas atau kendala mengajar di sini..." class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
        </div>

        <!-- Bagian Presensi Siswa -->
        <div>
          <h4 class="text-sm font-semibold text-slate-700 mb-2">Presensi Siswa di Kelas</h4>
          <div class="border rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200 text-xs">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-2 text-left font-semibold text-slate-500">Nama Siswa</th>
                  <th class="px-4 py-2 text-center font-semibold text-slate-500 w-24">Hadir</th>
                  <th class="px-4 py-2 text-center font-semibold text-slate-500 w-24">Sakit</th>
                  <th class="px-4 py-2 text-center font-semibold text-slate-500 w-24">Izin</th>
                  <th class="px-4 py-2 text-center font-semibold text-slate-500 w-24">Alpa</th>
                </tr>
              </thead>
              <tbody id="siswaAttendanceRows" class="divide-y divide-slate-100">
                <!-- Baris Siswa Diisi via JS -->
                <tr>
                  <td class="px-4 py-3 text-slate-500 text-center" colspan="5">Pilih kelas terlebih dahulu untuk memuat daftar siswa.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">Simpan Jurnal & Presensi</button>
      </form>
    </div>

    <!-- 2. MATERI PELAJARAN -->
    <div id="secMateri" class="bg-white p-6 rounded-xl shadow-md hidden space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-xl font-bold text-slate-800">Materi Pelajaran</h3>
          <p class="text-sm text-slate-500">Unggah berkas PDF/Video materi dan publikasikan ke siswa.</p>
        </div>
        <button onclick="openAddMateriModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">+ Tambah Materi</button>
      </div>

      <!-- Tabel Daftar Materi -->
      <div class="border rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200 text-xs text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-2 font-semibold">Judul Materi</th>
              <th class="px-4 py-2 font-semibold">Format</th>
              <th class="px-4 py-2 font-semibold">Tautan Berkas</th>
              <th class="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody id="materiTableRows" class="divide-y divide-slate-100">
            <tr>
              <td colspan="4" class="px-4 py-4 text-center text-slate-400">Belum ada materi terdaftar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. CBT ANBK UJIAN -->
    <div id="secUjian" class="bg-white p-6 rounded-xl shadow-md hidden space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-xl font-bold text-slate-800">Bank Ujian Simulator CBT ANBK</h3>
          <p class="text-sm text-slate-500">Buat ujian dengan tipe soal kompleks, asosiatif, dan sebab-akibat.</p>
        </div>
        <button onclick="openAddExamModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">+ Buat Paket Ujian</button>
      </div>

      <div class="border rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-slate-200 text-xs text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-2 font-semibold">Paket Ujian</th>
              <th class="px-4 py-2 font-semibold">Token</th>
              <th class="px-4 py-2 font-semibold">Durasi</th>
              <th class="px-4 py-2 font-semibold">Jumlah Soal</th>
            </tr>
          </thead>
          <tbody id="examTableRows" class="divide-y divide-slate-100">
            <tr>
              <td colspan="4" class="px-4 py-4 text-center text-slate-400">Belum ada paket ujian terdaftar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
  function switchGuruSection(section) {
    document.getElementById('secJurnal').classList.add('hidden');
    document.getElementById('secMateri').classList.add('hidden');
    document.getElementById('secUjian').classList.add('hidden');
    
    document.getElementById('btnJurnal').className = "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50";
    document.getElementById('btnMateri').className = "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50";
    document.getElementById('btnUjian').className = "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50";

    if (section === 'jurnal') {
      document.getElementById('secJurnal').classList.remove('hidden');
      document.getElementById('btnJurnal').className = "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700";
    } else if (section === 'materi') {
      document.getElementById('secMateri').classList.remove('hidden');
      document.getElementById('btnMateri').className = "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700";
      loadMaterials();
    } else if (section === 'ujian') {
      document.getElementById('secUjian').classList.remove('hidden');
      document.getElementById('btnUjian').className = "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700";
      loadExams();
    }
  }

  function initGuruDashboard() {
    // Dipanggil saat template terpasang, mengikat event listener kelas dll.
    document.getElementById('jurnalDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('jurnalClass').addEventListener('change', loadSiswaForAttendance);
  }

  function loadSiswaForAttendance() {
    const classId = document.getElementById('jurnalClass').value;
    const container = document.getElementById('siswaAttendanceRows');
    
    if (!classId) {
      container.innerHTML = '<tr><td class="px-4 py-3 text-slate-400 text-center" colspan="5">Pilih kelas terlebih dahulu.</td></tr>';
      return;
    }

    container.innerHTML = '<tr><td class="px-4 py-3 text-slate-500 text-center" colspan="5">Memuat siswa kelas...</td></tr>';
    
    // Memanggil google.script.run ke backend
    google.script.run
      .withSuccessHandler(function(siswaList) {
        if (!siswaList || siswaList.length === 0) {
          container.innerHTML = '<tr><td class="px-4 py-3 text-red-500 text-center" colspan="5">Tidak ada siswa di kelas ini!</td></tr>';
          return;
        }
        
        let html = '';
        siswaList.forEach(s => {
          html += \`
            <tr>
              <td class="px-4 py-3 font-medium text-slate-700">\${s.name}</td>
              <td class="px-4 py-3 text-center">
                <input type="radio" name="att_\${s.id}" value="Hadir" checked class="text-indigo-600 focus:ring-indigo-500">
              </td>
              <td class="px-4 py-3 text-center">
                <input type="radio" name="att_\${s.id}" value="Sakit" class="text-indigo-600 focus:ring-indigo-500">
              </td>
              <td class="px-4 py-3 text-center">
                <input type="radio" name="att_\${s.id}" value="Izin" class="text-indigo-600 focus:ring-indigo-500">
              </td>
              <td class="px-4 py-3 text-center">
                <input type="radio" name="att_\${s.id}" value="Alpa" class="text-indigo-600 focus:ring-indigo-500">
              </td>
            </tr>
          \`;
        });
        container.innerHTML = html;
      })
      .getSiswaByClass(classId);
  }

  function saveJournal(e) {
    e.preventDefault();
    // Proses pengumpulan absensi dan simpan ke GAS JurnalMengajar sheet...
  }

  function loadMaterials() {
    // Memanggil getMaterials dan merender ke tabel materiTableRows
  }

  function loadExams() {
    // Memanggil getExams dan merender ke tabel examTableRows
  }
</script>
`;
