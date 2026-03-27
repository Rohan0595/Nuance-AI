import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBKyCXvzqVz8Ej3-OgJC9mszAIgEAthkPk",
  authDomain: "nuance-ai-e9e6b.firebaseapp.com",
  projectId: "nuance-ai-e9e6b",
  storageBucket: "nuance-ai-e9e6b.firebasestorage.app",
  messagingSenderId: "780158972013",
  appId: "1:780158972013:web:c90d3f5fec7028150e8f64",
  measurementId: "G-VC7037EH5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
