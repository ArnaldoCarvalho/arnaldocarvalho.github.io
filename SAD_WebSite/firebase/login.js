import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");


async function login(event) {
    event.preventDefault(); // impede o reload da página
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.style.display = "none";
    try {
        const userCred = await signInWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );
        window.location.replace('./consultoria.html');
        console.log(userCred.user.email);
    } catch (err) {
        console.log(err.message);
        // Mensagem customizada
        let message = "Ocorreu um erro. Verifique email e senha.";
        switch(err.code) {
            case "auth/invalid-email":
                message = "Email inválido.";
                break;
            case "auth/user-not-found":
                message = "Usuário não encontrado.";
                break;
        }
        errorMessage.textContent = message;
        errorMessage.style.display = "block"; // mostra a mensagem
    }
}

document.getElementById("loginForm").addEventListener("submit", login);
