// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCe0XvFARPq4sz5XnZZy1hAyPNcYOxvTTU",
  authDomain: "air-bd.firebaseapp.com",
  projectId: "air-bd",
  storageBucket: "air-bd.firebasestorage.app",
  messagingSenderId: "746534237930",
  appId: "1:746534237930:web:231627d7d326504a528993",
  measurementId: "G-NK23KT7P63"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);