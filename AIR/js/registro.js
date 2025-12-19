import { auth } from "../firebase/firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.getElementById("btnregist").addEventListener("click", async ()  => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch(error => {
            alert(error.message);
        });
});

