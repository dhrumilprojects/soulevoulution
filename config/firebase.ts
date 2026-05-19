import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCkpJ_CTDQTWQz1S6YX7xSr5xX3OwGd-x0',
  authDomain: 'soulevolution-71c59.firebaseapp.com',
  projectId: 'soulevolution-71c59',
  storageBucket: 'soulevolution-71c59.firebasestorage.app',
  messagingSenderId: '836074374353',
  appId: '1:836074374353:web:00045f2894d323799fb1f0',
  measurementId: 'G-6XLGKY295S',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
