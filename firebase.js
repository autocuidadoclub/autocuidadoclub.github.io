// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Securely load Firebase config from `env.js`
const firebaseConfig = {
  apiKey: window._env_?.FIREBASE_API_KEY || "MISSING_ENV",
  authDomain: window._env_?.FIREBASE_AUTH_DOMAIN || "MISSING_ENV",
  databaseURL: window._env_?.FIREBASE_DATABASE_URL || "MISSING_ENV",
  projectId: window._env_?.FIREBASE_PROJECT_ID || "MISSING_ENV",
  storageBucket: window._env_?.FIREBASE_STORAGE_BUCKET || "MISSING_ENV",
  messagingSenderId: window._env_?.FIREBASE_MESSAGING_SENDER_ID || "MISSING_ENV",
  appId: window._env_?.FIREBASE_APP_ID || "MISSING_ENV",
  measurementId: window._env_?.FIREBASE_MEASUREMENT_ID || "MISSING_ENV"
};

// Check if Firebase Config is properly loaded
if (Object.values(firebaseConfig).includes("MISSING_ENV")) {
  console.error("🔥 Firebase configuration is missing. Check env.js!");
} else {
  console.log("✅ Firebase config loaded successfully!");
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, setDoc, getDoc, doc };
