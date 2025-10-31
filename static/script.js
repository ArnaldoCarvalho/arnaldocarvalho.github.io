function mostrarMensagem() {
    alert("Você clicou no botão!");
    const btn = document.querySelector("button");
    btn.classList.add("clicado");
    setTimeout(() => btn.classList.remove("clicado"), 400);
}
