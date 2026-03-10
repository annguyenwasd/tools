import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const usingEmulator = import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_DATABASE_URL;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-tools.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'http://127.0.0.1:9000?ns=demo-tools',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-tools',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

if (usingEmulator) {
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
}
