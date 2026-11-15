import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyATzUODpiaurvfz5pBpZgoYxnb3hlAv-V4",
  authDomain: "sahaara-5c835.firebaseapp.com",
  projectId: "sahaara-5c835",
  storageBucket: "sahaara-5c835.firebasestorage.app",
  messagingSenderId: "822055235986",
  appId: "1:822055235986:web:98da043b1c09d42292914b",
  measurementId: "G-Y75ECT1FS4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
