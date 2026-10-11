import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Same Firebase project as the ERP web app (SCM/src/services/firebase.ts).
const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: 'texawave-erp-11daa.firebaseapp.com',
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ||
    'https://texawave-erp-11daa-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'texawave-erp-11daa',
  storageBucket: 'texawave-erp-11daa.firebasestorage.app',
  messagingSenderId: '180611557766',
  appId: '1:180611557766:web:e5e9522b95b31eac26a407',
});

export const database = getDatabase(app);
