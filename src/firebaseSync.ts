import React from "react";
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

// Helper to remove undefined values safely without crashing on invalid structures
const stripUndefined = (obj: any) => {
  if (obj === undefined || obj === null) return {};
  try {
    return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
  } catch (e) {
    console.warn("stripUndefined error, falling back to raw object:", e);
    return obj;
  }
};

export function syncCollection<T extends { id: string }>(
  collectionName: string,
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  seedData?: T[]
) {
  try {
    const colRef = collection(db, collectionName);
    
    // Initialize with seed data if empty
    if (seedData && seedData.length > 0) {
      getDocs(colRef).then(snapshot => {
        if (snapshot.empty) {
          const batch = writeBatch(db);
          seedData.forEach(item => {
            const docRef = doc(colRef, item.id);
            batch.set(docRef, stripUndefined(item));
          });
          batch.commit().catch(err => console.warn(`Error seeding ${collectionName}:`, err));
        }
      }).catch(err => console.warn(`Error checking seed for ${collectionName}:`, err));
    }

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const data: T[] = [];
        snapshot.forEach(doc => {
          data.push(doc.data() as T);
        });
        setState(data);
      },
      (error) => {
        console.warn(`Firestore onSnapshot error (${collectionName}):`, error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Error setting up syncCollection for ${collectionName}:`, err);
    return () => {};
  }
}

export async function addDocument<T extends { id: string }>(collectionName: string, data: T) {
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, stripUndefined(data));
  } catch (err) {
    console.error(`Error adding document to ${collectionName}:`, err);
  }
}

export async function deleteDocument(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting document ${id} from ${collectionName}:`, err);
  }
}

export async function updateDocument<T extends { id: string }>(collectionName: string, data: T) {
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, stripUndefined(data), { merge: true });
  } catch (err) {
    console.error(`Error updating document ${data.id} in ${collectionName}:`, err);
  }
}

export function syncConfig<T>(
  docName: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
  defaultData: T
) {
  try {
    const docRef = doc(db, 'config', docName);
    
    getDocs(collection(db, 'config')).then(snapshot => {
      if (!snapshot.docs.find(d => d.id === docName)) {
        setDoc(docRef, stripUndefined(defaultData) as any).catch(err => console.warn(`Error saving default config for ${docName}:`, err));
      }
    }).catch(err => console.warn(`Error checking config collection:`, err));

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setState(docSnap.data() as T);
        } else {
          setState(defaultData);
        }
      },
      (error) => {
        console.warn(`Firestore onSnapshot error for config (${docName}):`, error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`Error setting up syncConfig for ${docName}:`, err);
    return () => {};
  }
}

export async function saveConfig<T>(docName: string, data: T) {
  try {
    const docRef = doc(db, 'config', docName);
    await setDoc(docRef, stripUndefined(data) as any, { merge: true });
  } catch (err) {
    console.error(`Error saving config ${docName}:`, err);
  }
}

export async function restoreDatabaseBatch(backupData: Record<string, any>, mode: 'merge' | 'overwrite' = 'merge') {
  const collectionsToRestore = [
    'teachers', 'students', 'classes', 'subjects', 'materials', 'teachingModules',
    'exams', 'questionBanks', 'journals', 'cheatLogs', 'counselingReferrals',
    'counselingSessions', 'studentCounselingRequests', 'dailyCheckIns', 'needsAssessments', 'sociometries',
    'homeVisits', 'careerPlans', 'submissions', 'manualAssessments',
    'announcements', 'registrations', 'shareRequests', 'globalAnnouncements',
    'assignmentFolders', 'assignmentSubmissions', 'scheduleNotes', 'livePresentations'
  ];

  let totalRestored = 0;

  for (const colName of collectionsToRestore) {
    const items = backupData[colName];
    if (Array.isArray(items) && items.length > 0) {
      const chunkSize = 400;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(item => {
          if (item && item.id) {
            const docRef = doc(db, colName, String(item.id));
            if (mode === 'merge') {
              batch.set(docRef, stripUndefined(item), { merge: true });
            } else {
              batch.set(docRef, stripUndefined(item));
            }
            totalRestored++;
          }
        });
        await batch.commit();
      }
    }
  }

  if (backupData.schoolConfig) {
    const docRef = doc(db, 'config', 'schoolConfig');
    await setDoc(docRef, stripUndefined(backupData.schoolConfig), { merge: mode === 'merge' });
  }

  if (backupData.livePresentation) {
    const docRef = doc(db, 'config', 'livePresentation');
    await setDoc(docRef, stripUndefined(backupData.livePresentation), { merge: mode === 'merge' });
  }

  return totalRestored;
}
