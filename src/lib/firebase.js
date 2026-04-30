import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAYcke6xYeaN38NNGXdw1DVXdfQQwL_icg",
  authDomain: "sendflow-d8ec0.firebaseapp.com",
  projectId: "sendflow-d8ec0",
  storageBucket: "sendflow-d8ec0.firebasestorage.app",
  messagingSenderId: "903687091919",
  appId: "1:903687091919:web:0dde1a735add2db861a9ba"
};

// Prevent multiple initialization (VERY IMPORTANT in Next.js)
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
