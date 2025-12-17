// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxGGihZ-2QSwO4idZ-5ITZeMMkQsVnJEU",
  authDomain: "websad1.firebaseapp.com",
  projectId: "websad1",
  storageBucket: "websad1.firebasestorage.app",
  messagingSenderId: "488049681968",
  appId: "1:488049681968:web:d6b1eeb2e95764628daff5",
  measurementId: "G-HZMQXR2LPC"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Função para criar timestamp do Firebase
export const timestamp = serverTimestamp;

