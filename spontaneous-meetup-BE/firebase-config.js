import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

try {
  const serviceAccount = JSON.parse(
    await readFile(new URL('./firebase-admin.json', import.meta.url))
  );

  // Initialize Firebase Admin with explicit credential
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

export const db = getFirestore();
export default admin; 