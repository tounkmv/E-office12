import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocFromServer
} from "firebase/firestore";

const firebaseConfig = {
  projectId: "grounded-backup-4dckx",
  appId: "1:155204650437:web:57133370b31970ec7c77ac",
  apiKey: "AIzaSyC5zdhShQfmSlkwzInfLUYGKqZE0AGP3F8",
  authDomain: "grounded-backup-4dckx.firebaseapp.com",
  storageBucket: "grounded-backup-4dckx.firebasestorage.app",
  messagingSenderId: "155204650437"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom Database ID and long polling to prevent iframe environment connection issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-b11ab298-3842-499d-b8a0-5955f36707be");

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Test Connection Helper as required by Firebase skill
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Connection: OK");
  } catch (error) {
    console.error("Firebase connection test error:", error);
  }
}

// Re-export common services and types
export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
export type { FirebaseUser };
