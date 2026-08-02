const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed') {
          toast.error('Gagal masuk: Mode Email/Password belum diaktifkan di Firebase Console.');
          return;
        }
        throw err;
      }`,
  `      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed') {
          console.warn('Mode Email/Password belum diaktifkan di Firebase Console. Menggunakan fallback lokal.');
        }
        throw err;
      }`
);

fs.writeFileSync('src/App.tsx', code);
