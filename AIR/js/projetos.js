import { db } from "../firebase/firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const lista = document.getElementById("listaProjetos");
const modal = new bootstrap.Modal(document.getElementById("modalProjeto"));

const nome = document.getElementById("nome");
const cliente = document.getElementById("cliente");
const status = document.getElementById("status");
const descricao = document.getElementById("descricao");
const projetoId = document.getElementById("projetoId");

const projetosRef = collection(db, "projetos");

// LISTAR
async function carregarProjetos() {
    lista.innerHTML = "";
    const snapshot = await getDocs(projetosRef);

    snapshot.forEach(docSnap => {
        const p = docSnap.data();

        lista.innerHTML += `
      <div class="col-md-4">
        <div class="card shadow-sm h-100 p-3">
          <h5>${p.nome}</h5>
          <p class="text-muted">${p.descricao}</p>
          <span class="badge bg-primary mb-2">${p.status}</span>
          <p><strong>Cliente:</strong> ${p.cliente}</p>

          <div class="d-flex gap-2 mt-auto">
            <button class="btn btn-sm btn-outline-primary" onclick="editarProjeto('${docSnap.id}', '${p.nome}', '${p.cliente}', '${p.status}', '${p.descricao}')">
              Editar
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="apagarProjeto('${docSnap.id}')">
              Apagar
            </button>
          </div>
        </div>
      </div>
    `;
    });
}

// SALVAR / EDITAR
document.getElementById("salvarProjeto").addEventListener("click", async () => {
    const dados = {
        nome: nome.value,
        cliente: cliente.value,
        status: status.value,
        descricao: descricao.value
    };

    if (projetoId.value) {
        await updateDoc(doc(db, "projetos", projetoId.value), dados);
    } else {
        await addDoc(projetosRef, dados);
    }

    modal.hide();
    limparFormulario();
    carregarProjetos();
});

// EDITAR
window.editarProjeto = (id, n, c, s, d) => {
    projetoId.value = id;
    nome.value = n;
    cliente.value = c;
    status.value = s;
    descricao.value = d;

    modal.show();
};

// APAGAR
window.apagarProjeto = async (id) => {
    if (confirm("Deseja apagar este projeto?")) {
        await deleteDoc(doc(db, "projetos", id));
        carregarProjetos();
    }
};

function limparFormulario() {
    projetoId.value = "";
    nome.value = "";
    cliente.value = "";
    status.value = "Planejamento";
    descricao.value = "";
}

carregarProjetos();
