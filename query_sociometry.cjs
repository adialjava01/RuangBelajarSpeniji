const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  projectId: "global-bonfire-cdw25",
  appId: "1:664486781666:web:0d92fe269296c51192f4bb",
  apiKey: "AIzaSyD2F08kPWRfr_jH-CJO5EsTjByNU25Jiqo",
  authDomain: "global-bonfire-cdw25.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-jurnalmengajargu-429b906f-b4d8-43d2-bd51-5cc768b29c81");

async function run() {
  const colRef = collection(db, "sociometries");
  const snap = await getDocs(colRef);
  console.log("Found sociometries:", snap.size);
  snap.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
run();
