import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const fileRef = ref(storage, 'test.txt');

uploadString(fileRef, 'Hello World').then(() => {
  console.log('Upload successful');
  process.exit(0);
}).catch(err => {
  console.error('Upload failed:', err);
  if (err.customData) console.error('Custom data:', err.customData);
  if (err.serverResponse) console.error('Server response:', err.serverResponse);
  process.exit(1);
});
