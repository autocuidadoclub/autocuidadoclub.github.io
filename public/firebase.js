// firebase.js
import firebase from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// Ensure environment variables are loaded
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

// Check if any required config is missing
if (Object.values(firebaseConfig).includes("MISSING_ENV")) {
  console.error("🔥 Firebase configuration is missing. Check env.js!");
} else {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and Firestore
const auth = getAuth();
const db = getFirestore();

export { firebase, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, setDoc, getDoc, doc };
