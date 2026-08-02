const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'ai-studio-jurnalmengajargu-429b906f-b4d8-43d2-bd51-5cc768b29c81' });
const db = getFirestore();

async function run() {
  const snapshot = await db.collection('sociometries').get();
  console.log("Found:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
run();
