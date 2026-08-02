const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  'const userCredential = await signInWithEmailAndPassword(auth, email, pass);',
  `let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed') {
          toast.error('Gagal masuk: Mode Email/Password belum diaktifkan di Firebase Console.');
          return;
        }
        throw err;
      }`
);
fs.writeFileSync('src/App.tsx', code);
