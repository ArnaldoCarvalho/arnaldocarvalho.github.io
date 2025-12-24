// Firebase imports
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { db, auth } from '../firebase/firebase.js';

import { translations, setLanguage, currentLanguage } from './translations.js';
import { gerarRecomendacao } from './apriori.js';
import { getAllTransactions, saveTransaction } from '../firebase/firestore.js';

let currentRecommendation = null;
let currentRecommendationId = null; // guarda id recomendacao
let currentCriterioId = null;
let currentFeedbackId = null; // guarda id feedback para atualizar
let currentRespostas = null;
let feedbackGiven = false;

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuário logado
      console.log('Usuário logado:', user.email);

      // Carregar histórico e dados da página
      window.scrollTo(0, 0);
      loadHistorico();

      // Habilitar botões ou campos que dependem do login
      document.getElementById('consultoriaForm').style.display = 'block';

    } else {
      // Usuário não logado
      console.log('Usuário não está logado, redirecionando para login...');
      window.location.href = './login.html';
    }
  });
});



// Dados padrão
let locaisConhecidos = {
  'Porto Centro': { lat: 41.1579, lng: -8.6291, image: 'https://via.placeholder.com/800x400?text=Porto+Centro', description: 'Centro histórico do Porto, ideal para stands de luxo com alta visibilidade.' },
  'Vila Nova de Gaia': { lat: 41.1333, lng: -8.6167, image: 'https://via.placeholder.com/800x400?text=Vila+Nova+de+Gaia', description: 'Subúrbio familiar com acesso fácil ao Porto, perfeito para famílias.' },
  'Leça da Palmeira': { lat: 41.1917, lng: -8.7000, image: 'https://via.placeholder.com/800x400?text=Le%C3%A7a+da+Palmeira', description: 'Área costeira vibrante, atrativa para jovens e turismo.' },
  'Gondomar': { lat: 41.1500, lng: -8.5333, image: 'https://via.placeholder.com/800x400?text=Gondomar', description: 'Área residencial acessível, ideal para famílias com orçamento limitado.' },
  'Maia': { lat: 41.2333, lng: -8.6167, image: 'https://via.placeholder.com/800x400?text=Maia', description: 'Subúrbio moderno com boas infraestruturas familiares.' },
  'Póvoa de Varzim': { lat: 41.3833, lng: -8.7667, image: 'https://via.placeholder.com/800x400?text=P%C3%B3voa+de+Varzim', description: 'Costa norte com praias e vida noturna, atrativa para jovens.' }
};

let regrasRelacionadas = [
  { antecedente: ['luxo', 'alto', 'executivos'], consequente: 'Porto Centro', confidence: 0.8 },
  { antecedente: ['medio', 'medio', 'familias'], consequente: 'Vila Nova de Gaia', confidence: 0.75 },
  { antecedente: ['economico', 'baixo', 'jovens'], consequente: 'Leça da Palmeira', confidence: 0.7 },
  { antecedente: ['economico', 'baixo', 'familias'], consequente: 'Gondomar', confidence: 0.55 },
  { antecedente: ['luxo', 'medio', 'familias'], consequente: 'Maia', confidence: 0.6 },
  { antecedente: ['economico', 'medio', 'jovens'], consequente: 'Póvoa de Varzim', confidence: 0.65 }
];

let displayedHistoricoCount = 4;

async function loadHistorico(showAll = false) {
  const historicoLista = document.getElementById('historicoLista');
  historicoLista.innerHTML = '';

  if (!auth.currentUser) {
    historicoLista.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Please log in to view your recommendation history.</p></div>';
    return;
  }

  try {
    const q = query(collection(db, 'recommendations'), where('userId', '==', auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    const historico = [];
    querySnapshot.forEach((doc) => {
      historico.push({ id: doc.id, ...doc.data() });
    });
    // Sort by data descending client-side
    historico.sort((a, b) => b.data.seconds - a.data.seconds);

    if (historico.length === 0) {
      historicoLista.innerHTML = '<div class="col-12 text-center"><p class="text-muted">' + translations[currentLanguage].noRecommendations + '</p></div>';
      return;
    }

    const totalToShow = showAll ? historico.length : Math.min(displayedHistoricoCount, historico.length);

    // mostra entrada mais recente
    const entriesToShow = historico.slice(0, totalToShow);

    entriesToShow.forEach((item) => {
      const col = document.createElement('div');
      col.className = 'col-md-6 mb-4';
      // garante que criterios é string
      const criteriosStr = Array.isArray(item.criterios) ? item.criterios.join(', ') : item.criterios;
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title">${item.local}</h6>
            <p class="card-text"><strong>${translations[currentLanguage].criteria}</strong> ${criteriosStr}</p>
            <p class="card-text"><strong>${translations[currentLanguage].date}</strong> ${new Date(item.data.seconds * 1000).toLocaleDateString('pt-PT')}</p>
            <p class="card-text"><strong>${translations[currentLanguage].feedback}</strong> ${item.feedback || translations[currentLanguage].none}</p>
          </div>
        </div>
      `;
      historicoLista.appendChild(col);
    });

    // botao mostra mais
    let showMoreBtn = document.getElementById('showMoreHistoricoBtn');
    if (!showMoreBtn) {
      showMoreBtn = document.createElement('button');
      showMoreBtn.id = 'showMoreHistoricoBtn';
      showMoreBtn.className = 'btn btn-secondary w-100 mb-3';
      showMoreBtn.textContent = 'Mais';
      showMoreBtn.addEventListener('click', () => {
        displayedHistoricoCount += 4;
        if (displayedHistoricoCount >= historico.length) {
          loadHistorico(true);
          showMoreBtn.style.display = 'none';
        } else {
          loadHistorico(false);
        }
      });
      // botao 'limparHistorico'
      const limparBtn = document.getElementById('limparHistorico');
      if (limparBtn && limparBtn.parentNode) {
        limparBtn.parentNode.insertBefore(showMoreBtn, limparBtn);
      } else {
        historicoLista.parentNode.appendChild(showMoreBtn);
      }
    }

    if (displayedHistoricoCount >= historico.length) {
      showMoreBtn.style.display = 'none';
    } else {
      showMoreBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    historicoLista.innerHTML = '<div class="col-12 text-center"><p class="text-muted">' + translations[currentLanguage].noRecommendations + '</p></div>';
  }
}

// Limpar histórico
document.getElementById('limparHistorico').addEventListener('click', async function () {
  const t = translations[currentLanguage];
  if (confirm(t.confirmClearHistory)) {
    try {
      const q = query(collection(db, 'recommendations'), where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
      loadHistorico();
      alert(t.historyCleared);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      alert('Erro ao limpar histórico.');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0); // Scroll no inicio quando carrega pagina
  //loadLearnedData();
  loadHistorico();
});

// Atualizar datalist com locais conhecidos
function updateLocaisDatalist() {
  const datalist = document.getElementById('locaisDisponiveis');
  datalist.innerHTML = '';
  Object.keys(locaisConhecidos).forEach(local => {
    const option = document.createElement('option');
    option.value = local;
    datalist.appendChild(option);
  });
}

updateLocaisDatalist();

// Event listener para gama luxo definir orçamento automaticamente
document.getElementById('gama').addEventListener('change', function () {
  const orcamentoSelect = document.getElementById('orcamento');
  if (this.value === 'luxo') {
    orcamentoSelect.value = 'alto';
    orcamentoSelect.disabled = true;
  } else {
    orcamentoSelect.disabled = false;
    if (orcamentoSelect.value === 'alto') {
      orcamentoSelect.value = '';
    }
  }
});

function disabledFeedbackButtons() {
  document.getElementById('thumbsUp').disabled = true;
  document.getElementById('thumbsDown').disabled = true;
}


document.getElementById('thumbsUp').addEventListener('click', async function () {
  if (!feedbackGiven && currentRecommendation && currentRecommendationId && currentFeedbackId) {
    feedbackGiven = true;
    try {
      // atualizar feedback com id feedback
      const feedbackRef = doc(db, 'recommendations', currentFeedbackId);
      await updateDoc(feedbackRef, {
        feedback: true
      });
      //ajustarConfiança(currentRecommendation.consequente, true);
      const t = translations[currentLanguage];
      alert(t.positiveFeedback);
      disabledFeedbackButtons();
    } catch (error) {
      console.error('Erro ao salvar feedback positivo:', error);
      alert('Erro ao salvar feedback positivo.');
    }
  }
});

document.getElementById('thumbsDown').addEventListener('click', async function () {
  if (!feedbackGiven && currentRecommendation && currentRecommendationId && currentFeedbackId) {
    feedbackGiven = true;
    try {
      // atualizar feedback com id feedback
      const feedbackRef = doc(db, 'recommendations', currentFeedbackId);
      await updateDoc(feedbackRef, {
        feedback: false
      });
      //ajustarConfiança(currentRecommendation.consequente, false);
      const t = translations[currentLanguage];
      alert(t.negativeFeedback);
      disabledFeedbackButtons();
    } catch (error) {
      console.error('Erro ao salvar feedback negativo:', error);
      alert('Erro ao salvar feedback negativo.');
    }
  }
});

// Event listeners para botões de ação (definidos uma vez)
document.getElementById('exportBtn').addEventListener('click', function () {
  if (currentRecommendation && currentRespostas) {
    exportarRelatorio(currentRecommendation, currentRespostas);
  }
});

document.getElementById('shareBtn').addEventListener('click', function () {
  if (currentRecommendation) {
    compartilharRecomendacao(currentRecommendation);
  }
});

document.getElementById('directionsBtn').addEventListener('click', function () {
  if (currentRecommendation) {
    mostrarDirecoes(currentRecommendation);
  }
});

document.getElementById('consultoriaForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loadingIndicator';
  loadingIndicator.className = 'text-center my-3';
  loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p>Gerando recomendação...</p>';
  document.getElementById('consultoriaForm').appendChild(loadingIndicator);

  // Disable submit button
  const submitBtn = document.querySelector('#consultoriaForm button[type="submit"]');
  submitBtn.disabled = true;

  const gama = document.getElementById('gama').value;
  const orcamento = document.getElementById('orcamento').value;
  const cliente = document.getElementById('cliente').value;
  const localizacao = document.getElementById('localizacao').value;
  const localEspecifico = document.getElementById('localEspecifico').value.trim();

  // Filtros avançados
  const orcamentoMin = document.getElementById('orcamentoMin').value;
  const orcamentoMax = document.getElementById('orcamentoMax').value;
  const tiposCarro = Array.from(document.getElementById('tiposCarro').selectedOptions).map(option => option.value);
  const faixaEtaria = document.getElementById('faixaEtaria').value;
  const nivelRendimento = document.getElementById('nivelRendimento').value;

  const respostas = [gama, orcamento, cliente, localizacao];
  const filtrosAvancados = {
    orcamentoMin: orcamentoMin ? parseInt(orcamentoMin) : null,
    orcamentoMax: orcamentoMax ? parseInt(orcamentoMax) : null,
    tiposCarro: tiposCarro,
    faixaEtaria: faixaEtaria,
    nivelRendimento: nivelRendimento
  };

  // Fetch transactions from Firebase
  let transactions = await getAllTransactions();
  // If no transactions in Firebase, use default ones
  if (transactions.length === 0) {
    transactions = [
      ['luxo', 'alto', 'executivos', 'centro', 'Porto Centro'],
      ['luxo', 'alto', 'executivos', 'centro', 'Porto Centro'],
      ['medio', 'medio', 'familias', 'subúrbios', 'Vila Nova de Gaia'],
      ['medio', 'medio', 'familias', 'subúrbios', 'Vila Nova de Gaia'],
      ['economico', 'baixo', 'jovens', 'praia', 'Leça da Palmeira'],
      ['economico', 'baixo', 'jovens', 'praia', 'Leça da Palmeira'],
      ['luxo', 'alto', 'executivos', 'centro', 'Porto Centro'],
      ['medio', 'medio', 'jovens', 'centro', 'Porto Centro'],
      ['economico', 'baixo', 'familias', 'subúrbios', 'Gondomar'],
      ['luxo', 'medio', 'familias', 'subúrbios', 'Maia'],
      ['medio', 'alto', 'executivos', 'centro', 'Porto Centro'],
      ['economico', 'medio', 'jovens', 'praia', 'Póvoa de Varzim']
    ];
  }

  let melhorRegra;
  let recomendacaoTexto;

  if (localEspecifico) {
    // Usar local específico fornecido pelo usuário
    const localInfo = locaisConhecidos[localEspecifico];
    if (localInfo) {
      // Calcular confiança baseada nas respostas do usuário usando o Apriori
      const regraLocal = regrasRelacionadas.find(r => r.consequente === localEspecifico);
      const confianca = regraLocal ? (regraLocal.confidence * 100).toFixed(0) : '75'; // 75% como padrão para locais conhecidos

      let qualidade;
      if (confianca >= 80) {
        qualidade = 'excelente';
      } else if (confianca >= 60) {
        qualidade = 'Boa';
      } else {
        qualidade = 'baixa';
      }

      melhorRegra = {
        recomendacao: `Você escolheu abrir o stand em ${localEspecifico}. Confiança baseada no Apriori: ${confianca}%. Esta é uma escolha de qualidade ${qualidade} baseada nos seus critérios.`,
        ...localInfo,
        consequente: localEspecifico
      };
    } else {
      // Local não reconhecido, aprender e adicionar à base de dados
      // Adicionar novo local com valores padrão
      locaisConhecidos[localEspecifico] = {
        lat: 41.1579, // Porto como fallback
        lng: -8.6291,
        image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80',
        description: `Local personalizado: ${localEspecifico}. Adicionado à base de dados baseada nas suas preferências.`
      };

      // Adicionar nova regra baseada nas respostas do usuário
      const novaRegra = {
        antecedente: [gama, orcamento, cliente, localizacao],
        consequente: localEspecifico,
        confidence: 0.5 // Confiança inicial para novos locais
      };
      regrasRelacionadas.push(novaRegra);

      // Salvar dados aprendidos
      //saveLearnedData();

      melhorRegra = {
        recomendacao: `Novo local aprendido: ${localEspecifico}. Adicionado à nossa base de dados com base nas suas preferências. Confiança inicial: 50%. Recomendamos consultar um especialista local para avaliação detalhada.`,
        ...locaisConhecidos[localEspecifico],
        consequente: localEspecifico
      };
    }
  } else {
    // Usar recomendação baseada no Apriori
    melhorRegra = await gerarRecomendacao(transactions, respostas, filtrosAvancados, 0.5, 0.7); // minSupport 50%, minConfidence 70%
  }

  // Update the transaction with the recommended location
  await saveTransaction([...respostas, melhorRegra.consequente]);

  // Remove loading indicator and re-enable submit button
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
  submitBtn.disabled = false;

  document.getElementById('recomendacao').textContent = melhorRegra.recomendacao;
  document.getElementById('resultado').classList.remove('d-none');

  document.getElementById("resultado").scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Mostrar seção de comparação se houver melhoresRegras
  if (melhorRegra.melhoresRegras && melhorRegra.melhoresRegras.length > 1) {
    document.getElementById('comparacaoSection').classList.remove('d-none');
    const container = document.getElementById('comparacaoContainer');
    container.innerHTML = '';
    melhorRegra.melhoresRegras.forEach((regra, index) => {
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card h-100">
          <img src="${regra.image}" class="card-img-top" alt="${regra.consequente}" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${index + 1}. ${regra.consequente}</h5>
            <p class="card-text"><strong>Confiança Ajustada:</strong> ${(regra.confidenceAjustada * 100).toFixed(0)}%</p>
            <p class="card-text">${regra.description}</p>
            <p class="card-text"><strong>Coordenadas:</strong> ${regra.lat}, ${regra.lng}</p>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } else {
    document.getElementById('comparacaoSection').classList.add('d-none');
  }

  // Set current recommendation and responses
  currentRecommendation = melhorRegra;
  currentRespostas = respostas;
  feedbackGiven = false;

  // Remove campos vazios, para evitar nulos desnecessarios
  Object.keys(filtrosAvancados).forEach(key => {
    if (filtrosAvancados[key] === null || filtrosAvancados[key] === '' || (Array.isArray(filtrosAvancados[key]) && filtrosAvancados[key].length === 0)) {
      delete filtrosAvancados[key];
    }
  });

  // Save recommendation and criteria to Firebase with feedback null
  try {
    const docRef = await addDoc(collection(db, 'recommendations'), {
      userId: auth.currentUser.uid,
      local: melhorRegra.consequente,
      criterios: respostas,
      advancedFilters: filtrosAvancados,
      feedback: null,
      data: new Date()
    });
    currentRecommendationId = docRef.id;
    currentFeedbackId = docRef.id; // Use the same ID for feedback update
  } catch (error) {
    console.error('Erro ao salvar recomendação:', error);
  }

  // Timeout para salvar com "nenhum" se nenhum feedback for dado
  setTimeout(async () => {
    if (!feedbackGiven) {
      // no feedback
      feedbackGiven = true;
      disabledFeedbackButtons();
    }
  }, 30000); // 30 segundos

  // Atualizar imagem e descrição
  if (melhorRegra.image) {
    document.getElementById('localImage').src = melhorRegra.image;
    document.getElementById('localImage').alt = melhorRegra.consequente || 'Local Selecionado';
  }
  if (melhorRegra.description) {
    document.getElementById('localDescription').textContent = melhorRegra.description;
  }

  // Atualizar imagem do mapa com um mapa mundial destacando o Grande Porto
  if (melhorRegra.consequente) {
    document.getElementById('map').src = './img/mapa.png';
    document.getElementById('map').alt = 'Mapa do Grande Porto';
  }

  // Enable feedback buttons
  document.getElementById('thumbsUp').disabled = false;
  document.getElementById('thumbsDown').disabled = false;

  // Mostrar comodidades próximas
  mostrarComodidadesProximas(melhorRegra);

  updateLocaisDatalist();

  loadHistorico();

});

// Função para ajustar confiança baseada no feedback (nao funciona na BD)
/*function ajustarConfiança(local, positivo) {
  const regra = regrasRelacionadas.find(r => r.consequente === local);
  if (regra) {
    if (positivo) {
      regra.confidence = Math.min(1.0, regra.confidence + 0.05); // Aumentar confiança em 5%
    } else {
      regra.confidence = Math.max(0.0, regra.confidence - 0.05); // Diminuir confiança em 5%
    }
    saveLearnedData();
  }
}*/

// Função para exportar relatório
function exportarRelatorio(recomendacao, criterios) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Relatório de Recomendação - Consultoria Auto Premium', 20, 30);

  doc.setFontSize(14);
  doc.text(`Local Recomendado: ${recomendacao.consequente}`, 20, 50);
  doc.text(`Critérios Utilizados: ${criterios.join(', ')}`, 20, 70);
  doc.text(`Descrição: ${recomendacao.description}`, 20, 90);
  doc.text(`Confiança: ${recomendacao.confidence ? (recomendacao.confidence * 100).toFixed(0) + '%' : 'N/A'}`, 20, 110);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, 20, 130);

  doc.save('relatorio_recomendacao.pdf');
  const t = translations[currentLanguage];
  alert(t.reportExported);
}

// Função para compartilhar recomendação
function compartilharRecomendacao(recomendacao) {
  const texto = `Recomendação da Consultoria Auto Premium: ${recomendacao.consequente}. ${recomendacao.description}`;
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: 'Recomendação de Local - Consultoria Auto Premium',
      text: texto,
      url: url
    });
  } else {
    // Fallback para copiar para clipboard
    navigator.clipboard.writeText(`${texto} ${url}`).then(() => {
      const t = translations[currentLanguage];
      alert(t.recommendationCopied);
    }).catch(() => {
      const t = translations[currentLanguage];
      alert(t.recommendationCopied);
    });
  }
}

// Função para mostrar direções
function mostrarDirecoes(recomendacao) {
  if (recomendacao.lat && recomendacao.lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${recomendacao.lat},${recomendacao.lng}`;
    window.open(url, '_blank');
  } else {
    const t = translations[currentLanguage];
    alert(t.coordinatesNotAvailable);
  }
}

// Função para mostrar comodidades próximas
function mostrarComodidadesProximas(recomendacao) {
  if (!recomendacao.lat || !recomendacao.lng) return;

  const amenitiesSection = document.getElementById('nearbyAmenities');
  const amenitiesList = document.getElementById('amenitiesList');

  // Simular comodidades próximas (em um cenário real, usaria Places API)
  const t = translations[currentLanguage];
  const comodidades = [
    { tipo: t.restaurant, nome: 'Restaurante Exemplo', distancia: t.distance + ': 0.5 km' },
    { tipo: t.parking, nome: 'Parque de Estacionamento', distancia: t.distance + ': 0.2 km' },
    { tipo: t.supermarket, nome: 'Supermercado Local', distancia: t.distance + ': 1.0 km' },
    { tipo: t.pharmacy, nome: 'Farmácia Central', distancia: t.distance + ': 0.8 km' }
  ];

  amenitiesList.innerHTML = '';
  comodidades.forEach(comodidade => {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-2';
    col.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h6 class="card-title">${comodidade.tipo}</h6>
          <p class="card-text">${comodidade.nome}</p>
          <small class="text-muted">${comodidade.distancia}</small>
        </div>
      </div>
    `;
    amenitiesList.appendChild(col);
  });

  amenitiesSection.classList.remove('d-none');
}

// Inicializar EmailJS
(function () {
  emailjs.init('8oTr3sfCMTgJvfPQ7'); // Chave pública do EmailJS
})();

// Função para enviar email do formulário de contacto
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const mensagem = document.getElementById('mensagem').value;

  const templateParams = {
    from_name: nome,
    reply_to: email,
    message: mensagem,
    to_email: 'magalhesantonio170@gmail.com',
    to_name: 'Consultoria Auto Premium'
  };

  emailjs.send('service_x9r0hya', 'template_qvvldga', templateParams)
    .then(function (response) {
      const t = translations[currentLanguage];
      alert(t.messageSent);
      document.getElementById('contactForm').reset();
    }, function (error) {
      const t = translations[currentLanguage];
      alert(t.errorSendingMessage);
      console.error('Erro:', error);
    });
});

// Event listener para enviar recomendação por email
document.getElementById('emailRecomendacaoBtn').addEventListener('click', function () {
  if (!currentRecommendation) {
    const t = translations[currentLanguage];
    alert(t.noRecommendationAvailable);
    return;
  }

  const emailCliente = document.getElementById('emailRecomendacao').value.trim();
  if (!emailCliente) {
    const t = translations[currentLanguage];
    alert(t.enterValidEmail);
    return;
  }

  const recomendacaoTexto = `Recomendação Personalizada da Consultoria Auto Premium:\n\n${currentRecommendation.recomendacao}\n\nDescrição: ${currentRecommendation.description}\n\nCritérios utilizados: ${currentRespostas.join(', ')}\n\nEmail do Cliente: ${emailCliente}\n\nData: ${new Date().toLocaleDateString('pt-PT')}`;

  const templateParams = {
    from_name: 'Consultoria Auto Premium',
    reply_to: 'noreply@consultoriaautopremium.com',
    message: recomendacaoTexto,
    to_email: 'magalhesantonio170@gmail.com',
    to_name: 'Consultoria Auto Premium'
  };

  emailjs.send('service_x9r0hya', 'template_qvvldga', templateParams)
    .then(function (response) {
      const t = translations[currentLanguage];
      alert(t.recommendationSent);
      document.getElementById('emailRecomendacao').value = '';
    }, function (error) {
      const t = translations[currentLanguage];
      alert(t.errorSendingRecommendation);
      console.error('Erro:', error);
    });
});

// Language dropdown event listeners
document.addEventListener('click', function (e) {
  if (e.target.closest('.dropdown-item[data-lang]')) {
    e.preventDefault();
    const lang = e.target.closest('.dropdown-item').getAttribute('data-lang');
    setLanguage(lang);
    updateLanguageDisplay(lang);
    console.log(lang)
  }
});

function updateLanguageDisplay(lang) {
  const t = translations[lang];
  const timestamp = Date.now();
  document.getElementById('currentFlag').src = ((lang == 'pt') ? './img/pt.png' : './img/en.png') + '?t=' + timestamp;
  //document.getElementById('currentLanguage').textContent = t.language;

}

// Initialize language display
updateLanguageDisplay(currentLanguage);

document.getElementById('btnLogout').addEventListener('click', async () => {
  try {
    await signOut(auth);
    console.log('Usuário deslogado com sucesso.');
    // Redireciona para a página de login
    window.location.replace('./login.html');
  } catch (error) {
    console.error('Erro ao deslogar:', error);
    alert('Erro ao tentar sair. Tente novamente.');
  }
});


let scrollTimer;

window.addEventListener("scroll", function () {
  // 👉 Enquanto move (faz A)
  //document.body.classList.add("expand");
  //console.log('on');
  // Limpa o timer anterior
  clearTimeout(scrollTimer);

  // 👉 Se parar (faz B) após 200ms sem scroll
  scrollTimer = setTimeout(function () {
    //document.body.classList.remove("expand");
    //console.log('off');
  }, 200);
});
