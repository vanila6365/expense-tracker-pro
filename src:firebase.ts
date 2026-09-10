import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHkjVBPMp0bAlesgITEzc3TXBJANa0VAc",
  authDomain: "gen-lang-client-0923264454.firebaseapp.com",
  projectId: "gen-lang-client-0923264454",
  storageBucket: "gen-lang-client-0923264454.firebasestorage.app",
  messagingSenderId: "806776209684",
  appId: "1:806776209684:web:8d1fc313c7ec0c847b8201"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-1751d725-749c-4cac-9c28-2065193c409f");
export const googleProvider = new GoogleAuthProvider();
