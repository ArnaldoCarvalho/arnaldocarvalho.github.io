import { auth } from "../firebase/firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


document.getElementById("btnlogin").addEventListener("click", async ()  => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch(error => {
            alert(error.message);
        });
});