// register.js
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const registerForm = document.getElementById("registerForm");
const errorMessage = document.getElementById("errorMessage");

// 📝 REGISTRO
async function register(event) {
    event.preventDefault(); // impede reload da página
    errorMessage.style.display = "none";

    if (password.value !== confirmPassword.value) {
        errorMessage.textContent = "As palavras-passe não coincidem.";
        errorMessage.style.display = "block";
        return;
    }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email.value, password.value);
        console.log("Usuário registado:", userCred.user.email);
        alert("Registo realizado com sucesso! Faça login.");
        window.location.href = './';
    } catch (err) {
        console.error(err.message);

        // Mensagem customizada
        let message = "Ocorreu um erro no registo.";
        switch(err.code) {
            case "auth/email-already-in-use":
                message = "Email já está em uso.";
                break;
            case "auth/invalid-email":
                message = "Email inválido.";
                break;
            case "auth/weak-password":
                message = "Senha fraca. Use no mínimo 6 caracteres.";
                break;
        }
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    }
}

// Evento do formulário
registerForm.addEventListener("submit", register);
