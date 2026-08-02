const fs = require('fs');

let cCode = fs.readFileSync('src/components/CounselorPanel.tsx', 'utf8');
cCode = cCode.replace('Asesmen Kebutuhan Peserta Didik (AKPD)', 'Asesmen Kebutuhan Murid (AKM)');
cCode = cCode.replace('Status Pengisian AKPD', 'Status Pengisian AKM');
cCode = cCode.replace('Lihat Hasil AKPD', 'Lihat Hasil AKM');
cCode = cCode.replace('Hasil Pemetaan AKPD', 'Hasil Pemetaan AKM');
cCode = cCode.replace('mengisi form AKPD', 'mengisi form AKM');
fs.writeFileSync('src/components/CounselorPanel.tsx', cCode);

let sCode = fs.readFileSync('src/components/StudentPanel.tsx', 'utf8');
sCode = sCode.replace('Isi Asesmen Kebutuhan (AKPD)', 'Isi Asesmen Kebutuhan Murid (AKM)');
sCode = sCode.replace('Formulir AKPD', 'Formulir AKM');
sCode = sCode.replace('Asesmen Kebutuhan Peserta Didik', 'Asesmen Kebutuhan Murid');
sCode = sCode.replace('AKPD Berhasil Disimpan', 'AKM Berhasil Disimpan');
fs.writeFileSync('src/components/StudentPanel.tsx', sCode);
