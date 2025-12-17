import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// 🚪 LOGOUT
async function logout() {
  try {
    await signOut(auth);
    console.log("Logout realizado");
    window.location.replace('./login.html');
  } catch (err) {
    console.error(err.message);
  }
}

document.getElementById("btnLogout").addEventListener("click", logout);
