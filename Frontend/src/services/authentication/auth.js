// ../services/authentication/auth.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdTGPWAVDEAboCVR4PQTmUGQQcnjsSSOA",
  authDomain: "whiteboard-93739.firebaseapp.com",
  projectId: "whiteboard-93739",
  storageBucket: "whiteboard-93739.firebasestorage.app",
  messagingSenderId: "294373553763",
  appId: "1:294373553763:web:1be5aa95916bcd11c8ea56",
  measurementId: "G-ZR4VXVG1X8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
