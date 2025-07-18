import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAM6vmmmhh63dJ3YunMU4i57y6jsEyz6kQ",
  authDomain: "responsive-task-454402-v3.firebaseapp.com",
  projectId: "responsive-task-454402-v3",
  storageBucket: "responsive-task-454402-v3.firebasestorage.app",
  messagingSenderId: "452378422592",
  appId: "1:452378422592:web:a643b32453ef35ddff1ea5",
  measurementId: "G-1F4BZB9MZQ"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;