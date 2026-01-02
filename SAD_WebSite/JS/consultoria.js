// Firebase imports
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { db, auth } from '../firebase/firebase.js';

import { translations, setLanguage, currentLanguage } from './translations.js';
import { gerarRecomendacao } from './apriori.js';
import { getAllTransactions, saveTransaction, saveCustomModel, getCustomModels } from '../firebase/firestore.js';

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
      // Utilizador logado
      console.log('Utilizador logado:', user.email);

      // Carregar histórico e dados da página
      window.scrollTo(0, 0);
      loadHistorico();

      // Habilitar botões ou campos que dependem do login
      document.getElementById('consultoriaForm').style.display = 'block';

    } else {
      // Utilizador não logado
      console.log('Utilizador não está logado, redirecionando para login...');
      window.location.href = './login.html';
    }
  });
});



// Dados padrão
let locaisConhecidos = {
  'Porto Centro': { lat: 41.1496, lng: -8.6110, image: 'https://via.placeholder.com/800x400?text=Porto+Centro', description: 'Centro histórico do Porto, ideal para stands de luxo com alta visibilidade.', baseRent: 5000, locationMultiplier: 1.5 },
  'Vila Nova de Gaia': { lat: 41.1230, lng: -8.6128, image: 'https://via.placeholder.com/800x400?text=Vila+Nova+de+Gaia', description: 'Subúrbio familiar com acesso fácil ao Porto, perfeito para famílias.', baseRent: 3000, locationMultiplier: 1.0 },
  'Leça da Palmeira': { lat: 41.1918, lng: -8.7003, image: 'https://via.placeholder.com/800x400?text=Le%C3%A7a+da+Palmeira', description: 'Área costeira vibrante, atrativa para jovens e turismo.', baseRent: 3500, locationMultiplier: 1.2 },
  'Gondomar': { lat: 41.1396, lng: -8.5322, image: 'https://via.placeholder.com/800x400?text=Gondomar', description: 'Área residencial acessível, ideal para famílias com orçamento limitado.', baseRent: 2500, locationMultiplier: 0.8 },
  'Maia': { lat: 41.2367, lng: -8.6199, image: 'https://via.placeholder.com/800x400?text=Maia', description: 'Subúrbio moderno com boas infraestruturas familiares.', baseRent: 3200, locationMultiplier: 1.0 },
  'Póvoa de Varzim': { lat: 41.3768, lng: -8.7636, image: 'https://via.placeholder.com/800x400?text=P%C3%B3voa+de+Varzim', description: 'Costa norte com praias e vida noturna, atrativa para jovens.', baseRent: 3800, locationMultiplier: 1.3 }
};

let regrasRelacionadas = [
  { antecedente: ['luxo', 'alto', 'executivos'], consequente: 'Porto Centro', confidence: 0.8 },
  { antecedente: ['medio', 'medio', 'familias'], consequente: 'Vila Nova de Gaia', confidence: 0.75 },
  { antecedente: ['economico', 'baixo', 'jovens'], consequente: 'Leça da Palmeira', confidence: 0.7 },
  { antecedente: ['economico', 'baixo', 'familias'], consequente: 'Gondomar', confidence: 0.55 },
  { antecedente: ['luxo', 'medio', 'familias'], consequente: 'Maia', confidence: 0.6 },
  { antecedente: ['economico', 'medio', 'jovens'], consequente: 'Póvoa de Varzim', confidence: 0.65 }
];

// Multiplicadores de custo por critério
const costMultipliers = {
  gama: { luxo: 2.0, medio: 1.5, economico: 1.0 },
  orcamento: { alto: 1.8, medio: 1.3, baixo: 1.0 },
  cliente: { executivos: 1.7, familias: 1.2, jovens: 1.0 },
  localizacao: { centro: 1.6, subúrbios: 1.2, praia: 1.4 }
};

// Função para calcular o custo operacional estimado
function calcularCustoOperacional(local, criterios) {
  const localInfo = locaisConhecidos[local];
  if (!localInfo) return null;

  let baseCost = localInfo.baseRent * localInfo.locationMultiplier;

  // Aplicar multiplicadores baseados nos critérios
  const [gama, orcamento, cliente, localizacao] = criterios;
  baseCost *= costMultipliers.gama[gama] || 1.0;
  baseCost *= costMultipliers.orcamento[orcamento] || 1.0;
  baseCost *= costMultipliers.cliente[cliente] || 1.0;
  baseCost *= costMultipliers.localizacao[localizacao] || 1.0;

  // Custos adicionais fixos (estimados)
  const additionalCosts = {
    utilities: 500, // Eletricidade, água, etc.
    staff: 2000, // Salários básicos
    maintenance: 300, // Manutenção
    marketing: 400 // Marketing local
  };

  const totalCost = baseCost + additionalCosts.utilities + additionalCosts.staff + additionalCosts.maintenance + additionalCosts.marketing;

  return {
    total: Math.round(totalCost),
    breakdown: {
      rent: Math.round(baseCost),
      utilities: additionalCosts.utilities,
      staff: additionalCosts.staff,
      maintenance: additionalCosts.maintenance,
      marketing: additionalCosts.marketing
    }
  };
}

let displayedHistoricoCount = 4;

// Dados dos modelos por gama
const modelosPorGama = {
  luxo: [
    "Audi A8", "Audi Q8", "Audi e-tron GT", "Audi R8",
    "BMW Série 7", "BMW Série 8", "BMW i7", "BMW iX", "BMW XM", "BMW X5", "BMW M5", "BMW M8",
    "Mercedes-Benz Classe S", "Mercedes-Benz Classe G", "Mercedes-Benz GLE", "Mercedes-Benz GLS", "Mercedes-Benz EQC", "Mercedes-Benz EQE", "Mercedes-Benz EQS", "Mercedes-Benz EQV", "Mercedes-Benz AMG GT", "Mercedes-Benz AMG SL", "Mercedes-Benz MayBach Classe S", "Mercedes-Benz MayBach EQS", "Mercedes-Benz MayBach GLS", "Mercedes-Benz MayBach SL", "Mercedes-Benz SLR McLaren",
    "Porsche Taycan", "Porsche Panamera", "Porsche 911", "Porsche 718",
    "Maserati Grecale", "Maserati Grancabrio", "Maserati MCPura", "Maserati MC20", "Maserati GranTurismo", "Maserati GT2", "Maserati MCXtrema",
    "Ferrari Roma", "Ferrari SF90", "Ferrari Purosangue", "Ferrari 296 GTB", "Ferrari 12cilindri", "Ferrari Daytona SP3", "Ferrari Amalfi", "Ferrari F12berlinetta", "Ferrari 812", "Ferrari GTC4Lusso", "Ferrari California", "Ferrari Portofino", "Ferrari Testarossa", "Ferrari 360", "Ferrari 488", "Ferrari F8", "Ferrari Monza SP1", "Ferrari Monza SP2", "Ferrari 288 GTO", "Ferrari F40", "Ferrari F50", "Ferrari Enzo", "Ferrari LaFerrari", "Ferrari F80",
    "Lamborghini Revuelto", "Lamborghini Huracán", "Lamborghini Urus", "Lamborghini Aventador", "Lamborghini Countach", "Lamborghini Temerario", "Lamborghini Miura", "Lamborghini Diablo", "Lamborghini Murciélago", "Lamborghini Gallardo",
    "Pagani Utopia", "Pagani Huayra R",
    "Bugatti Veyron", "Bugatti Chiron", "Bugatti Mistral", "Bugatti Tourbillon",
    "Volvo EX90",
    "Koenigsegg One:1", "Koenigsegg Gemera", "Koenigsegg Agera", "Koenigsegg CC850",
    "Jaguar F-Type", "Jaguar F-Pace", "Jaguar I-Pace", "Jaguar XJ",
    "Land Rover Defender", "Land Rover Range Rover", "Land Rover Range Rover Sport",
    "Aston Martin DB5", "Aston Martin DBX", "Aston Martin DB12", "Aston Martin Vantage", "Aston Martin Vanquish", "Aston Martin Valhalla", "Aston Martin Valkyrie",
    "McLaren 765LT", "McLaren 720S", "McLaren Artura", "McLaren 750S", "McLaren GT", "McLaren 570S", "McLaren P1", "McLaren Senna", "McLaren Speedtail", "McLaren W1",
    "Rimac Nevera",
    "Ford Mustang GT",
    "Tesla Model S", "Tesla Model X",
    "Chevrolet Corvette C8 Stingray", "Chevrolet Corvette C1", "Chevrolet Corvette C7",
    "Cadillac Escalade",
    "Toyota Supra MK4", "Toyota Supra MK5",
    "Lexus LFA", "Lexus RX",
    "BYD Tang"
  ],
  medio: [
    "Audi A5", "Audi A6", "Audi A7", "Audi Q5", "Audi Q6 e-tron", "Audi Q7",
    "BMW Série 3", "BMW Série 4", "BMW Série 5", "BMW i4", "BMW i5", "BMW iX1", "BMW iX2", "BMW iX3", "BMW X1", "BMW X3", "BMW Z4", "BMW M2", "BMW M3", "BMW M4",
    "Mercedes-Benz Classe C", "Mercedes-Benz Classe E", "Mercedes-Benz Classe V", "Mercedes-Benz GLA", "Mercedes-Benz GLB", "Mercedes-Benz GLC", "Mercedes-Benz EQA", "Mercedes-Benz EQB", "Mercedes-Benz CLA", "Mercedes-Benz CLE",
    "Volkswagen ID.4", "Volkswagen ID.5", "Volkswagen Tiguan", "Volkswagen Passat",
    "Porsche Cayenne", "Porsche Macan",
    "Peugeot 408", "Peugeot 3008",
    "Volvo XC60",
    "Polestar Polestar 3",
    "Jaguar E-Pace",
    "Land Rover Evoque", "Land Rover Discovery Sport",
    "Mini Countryman",
    "Cupra Tavascan",
    "Skoda Enyaq", "Skoda Kodiaq",
    "Ford Kuga", "Ford Mustang Mach-E",
    "Chevrolet Camaro",
    "Jeep Grand Cherokee",
    "Toyota C-HR", "Toyota RAV4",
    "Lexus UX", "Lexus NX", "Lexus RZ",
    "Honda Civic Type-R", "Honda CR-V",
    "Mazda MX-5", "Mazda MX-7",
    "Nissan X-Trail", "Nissan Ariya",
    "Hyundai Tucson",
    "MG Marvel R"
  ],
  economico: [
    "Audi A1", "Audi A3", "Audi A4", "Audi Q2", "Audi Q3", "Audi Q4 e-tron",
    "BMW Isetta", "BMW Série 1", "BMW Série 2",
    "Mercedes-Benz Classe A", "Mercedes-Benz Classe B", "Mercedes-Benz Classe T", "Mercedes-Benz EQT",
    "Volkswagen Golf", "Volkswagen ID.3",
    "Opel Astra", "Opel Corsa", "Opel Mokka", "Opel Grandland",
    "Smart #1", "Smart #3",
    "Fiat 500e", "Fiat Tipo", "Fiat 600e",
    "Alfa Romeo Tonale", "Alfa Romeo Giulia", "Alfa Romeo Stelvio",
    "Renault Clio", "Renault Captur", "Renault Arkana", "Renault Megane E-Tech",
    "Peugeot 208", "Peugeot 2008", "Peugeot 308",
    "Citroën C3", "Citroën C4", "Citroën ë-C4", "Citroën C5 X",
    "DS Automobiles DS 3", "DS Automobiles DS 4", "DS Automobiles DS 7", "DS Automobiles DS 9",
    "Volvo XC40", "Volvo C40", "Volvo EX30",
    "Polestar Polestar 2", "Polestar Polestar 4",
    "Mini Cooper", "Mini Electric",
    "Seat Leon", "Seat Arona", "Seat Ateca",
    "Cupra Formentor", "Cupra Born",
    "Skoda Octavia", "Skoda Fabia", "Skoda Superb",
    "Dacia Sandero", "Dacia Logan", "Dacia Spring", "Dacia Duster",
    "Ford Focus", "Ford Fiesta", "Ford Puma",
    "Tesla Model 3", "Tesla Model Y",
    "Chevrolet Onix",
    "Jeep Renegade", "Jeep Compass", "Jeep Wrangler",
    "Toyota Corolla", "Toyota Yaris", "Toyota Aygo X", "Toyota bZ4X",
    "Honda Civic", "Honda HR-V", "Honda Jazz", "Honda e:Ny1",
    "Mazda Mazda 2", "Mazda Mazda 3", "Mazda CX-30", "Mazda CX-5", "Mazda MX-30",
    "Nissan Qashqai", "Nissan Juke", "Nissan Leaf",
    "Subaru Impreza", "Subaru XV", "Subaru Outback", "Subaru Solterra",
    "Suzuki Swift", "Suzuki Vitara", "Suzuki S-Cross",
    "Hyundai i20", "Hyundai i30", "Hyundai Kona", "Hyundai Ioniq 5", "Hyundai Ioniq 6",
    "Kia Ceed", "Kia Sportage", "Kia Niro", "Kia EV6", "Kia EV9",
    "MG MG4", "MG MG5", "MG ZS EV",
    "BYD Atto 3", "BYD Dolphin", "BYD Seal"
  ]
};

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

  // Populate modelo select based on gama
  populateModeloSelect(this.value);
});

// Function to populate modelo select
async function populateModeloSelect(gama) {
  const modeloSelect = document.getElementById('modelo');
  modeloSelect.innerHTML = '<option value="">Selecione</option>';

  // Load custom models from Firebase
  let customModels = {};
  try {
    customModels = await getCustomModels();
  } catch (error) {
    console.error('Erro ao carregar modelos personalizados:', error);
  }

  // Merge default models with custom models
  const allModels = [...(modelosPorGama[gama] || [])];
  if (customModels[gama]) {
    customModels[gama].forEach(model => {
      if (!allModels.includes(model)) {
        allModels.push(model);
      }
    });
  }

  allModels.forEach(modelo => {
    const option = document.createElement('option');
    option.value = modelo;
    option.textContent = modelo;
    modeloSelect.appendChild(option);
  });

  // Always add the custom option
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Adicionar novo modelo';
  modeloSelect.appendChild(customOption);
}

// Event listener for modelo search
document.getElementById('modeloSearch').addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  const modeloSelect = document.getElementById('modelo');
  const options = modeloSelect.querySelectorAll('option');

  options.forEach(option => {
    if (option.value === '') return; // Skip the "Selecione" option
    const text = option.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      option.style.display = 'block';
    } else {
      option.style.display = 'none';
    }
  });
});

// Event listener for modelo select change
document.getElementById('modelo').addEventListener('change', function () {
  const customContainer = document.getElementById('customModeloContainer');
  const customInput = document.getElementById('customModelo');
  if (this.value === 'custom') {
    customContainer.style.display = 'block';
    customInput.required = true;
  } else {
    customContainer.style.display = 'none';
    customInput.required = false;
    customInput.value = '';
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
      ajustarConfiança(currentRecommendation.consequente, true);
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
      ajustarConfiança(currentRecommendation.consequente, false);
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
    exportarRelatorio(currentRecommendation, currentRespostas, currentRecommendation.advancedFilters);
  } else {
    const t = translations[currentLanguage];
    alert(t.noRecommendationAvailable || 'Por favor, gere uma recomendação primeiro.');
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

  const localEspecifico = document.getElementById('localEspecifico').value.trim();
  const errorDiv = document.getElementById('localEspecificoError');

  // Check if localEspecifico is empty
  if (!localEspecifico) {
    if (!errorDiv) {
      const newErrorDiv = document.createElement('div');
      newErrorDiv.id = 'localEspecificoError';
      newErrorDiv.className = 'text-danger mt-1';
      newErrorDiv.textContent = translations[currentLanguage].pleaseAddItemToList;
      document.getElementById('localEspecifico').parentNode.appendChild(newErrorDiv);
    }
    document.getElementById('localEspecifico').focus();
    return; // Prevent form submission
  } else {
    if (errorDiv) {
      errorDiv.remove();
    }
  }

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

  // Get modelo value
  let modelo = document.getElementById('modelo').value;
  if (modelo === 'custom') {
    modelo = document.getElementById('customModelo').value.trim();
    // Save the new custom model to Firebase
    if (modelo) {
      try {
        await saveCustomModel(gama, modelo);
      } catch (error) {
        console.error('Erro ao salvar modelo personalizado:', error);
      }
    }
  }

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
    // Usar local específico fornecido pelo utilizador
    const localInfo = locaisConhecidos[localEspecifico];
    if (localInfo) {
      // Calcular confiança baseada nas respostas do utilizador usando o Apriori
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
        consequente: localEspecifico,
        confidenceAjustada: confianca / 100
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

      // Adicionar nova regra baseada nas respostas do utilizador
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

  // Calcular custo operacional
  const custoOperacional = calcularCustoOperacional(melhorRegra.consequente, respostas);
  melhorRegra.custoOperacional = custoOperacional;

  // Set current recommendation and responses
  currentRecommendation = melhorRegra;
  currentRespostas = respostas;
  feedbackGiven = false;

  // Attach advanced filters to current recommendation for export
  currentRecommendation.advancedFilters = filtrosAvancados;

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

// Função para ajustar confiança baseada no feedback
function ajustarConfiança(local, positivo) {
  const regra = regrasRelacionadas.find(r => r.consequente === local);
  if (regra) {
    if (positivo) {
      regra.confidence = Math.min(1.0, regra.confidence + 0.05); // Aumentar confiança em 5%
    } else {
      regra.confidence = Math.max(0.0, regra.confidence - 0.05); // Diminuir confiança em 5%
    }
    // Note: saveLearnedData() is commented out as it's not implemented
    // saveLearnedData();
  }
}

// Função para exportar relatório
function exportarRelatorio(recomendacao, criterios, filtrosAvancados) {
  try {
    if (!window.jspdf) {
      throw new Error('jsPDF library not loaded');
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cover Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Consultoria Auto Premium', 105, 80, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Recomendação Personalizada', 105, 100, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`Local Recomendado: ${recomendacao.consequente}`, 105, 120, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-PT')}`, 105, 140, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Sistema de Consultoria Inteligente para Locais de Stand Automóvel', 105, 160, { align: 'center' });

    // Table of Contents
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Índice', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('1. Resumo Executivo ..................................................... 3', 20, 50);
    doc.text('2. Recomendação Principal ............................................. 4', 20, 60);
    doc.text('3. Critérios Utilizados ................................................. 5', 20, 70);
    doc.text('4. Detalhes do Local ................................................... 6', 20, 80);
    doc.text('5. Custo Operacional Estimado ........................................ 7', 20, 90);
    doc.text('6. Filtros Avançados Aplicados ....................................... 8', 20, 100);
    doc.text('7. Análise SWOT ........................................................ 9', 20, 110);
    doc.text('8. Conclusão e Recomendações ........................................ 10', 20, 120);

    // Section 1: Resumo Executivo
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumo Executivo', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const resumoText = `Este relatório apresenta uma recomendação personalizada para a abertura de um stand automóvel no local ${recomendacao.consequente}, baseada nos critérios fornecidos pelo utilizador. A recomendação foi gerada utilizando algoritmos de mineração de dados Apriori, com um nível de confiança de ${recomendacao.confidenceAjustada ? (recomendacao.confidenceAjustada * 100).toFixed(0) + '%' : 'N/A'}. O custo operacional estimado mensal é de €${recomendacao.custoOperacional ? recomendacao.custoOperacional.total : 'N/A'}.`;
    const resumoLines = doc.splitTextToSize(resumoText, 170);
    doc.text(resumoLines, 20, 50);

    // Section 2: Recomendação Principal
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Recomendação Principal', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Local Recomendado: ${recomendacao.consequente}`, 20, 50);
    doc.text(`Nível de Confiança: ${recomendacao.confidenceAjustada ? (recomendacao.confidenceAjustada * 100).toFixed(0) + '%' : 'N/A'}`, 20, 60);

    const descriptionLines = doc.splitTextToSize(`Descrição: ${recomendacao.description}`, 170);
    doc.text(descriptionLines, 20, 80);

    // Section 3: Critérios Utilizados
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Critérios Utilizados', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const criteriosText = `• Tipo de Gama: ${criterios[0] || 'N/A'}\n• Orçamento: ${criterios[1] || 'N/A'}\n• Tipo de Cliente: ${criterios[2] || 'N/A'}\n• Preferência de Localização: ${criterios[3] || 'N/A'}`;
    const criteriosLines = doc.splitTextToSize(criteriosText, 170);
    doc.text(criteriosLines, 20, 50);

    // Section 4: Detalhes do Local
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Detalhes do Local', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (recomendacao.lat && recomendacao.lng) {
      doc.text(`Coordenadas: ${recomendacao.lat}, ${recomendacao.lng}`, 20, 50);
    }
    doc.text(`Localização: ${recomendacao.consequente}`, 20, 70);

    // Section 5: Custo Operacional Estimado
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('5. Custo Operacional Estimado Mensal', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (recomendacao.custoOperacional) {
      doc.text(`Total Estimado: €${recomendacao.custoOperacional.total}`, 20, 50);
      doc.text(`• Renda: €${recomendacao.custoOperacional.breakdown.rent}`, 20, 70);
      doc.text(`• Utilitários: €${recomendacao.custoOperacional.breakdown.utilities}`, 20, 80);
      doc.text(`• Staff: €${recomendacao.custoOperacional.breakdown.staff}`, 20, 90);
      doc.text(`• Manutenção: €${recomendacao.custoOperacional.breakdown.maintenance}`, 20, 100);
      doc.text(`• Marketing: €${recomendacao.custoOperacional.breakdown.marketing}`, 20, 110);

      // Add calculation breakdown table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento do Cálculo:', 20, 130);

      // Calculate step-by-step values
      const localInfo = locaisConhecidos[recomendacao.consequente];
      const [gama, orcamento, cliente, localizacao] = criterios;

      const baseRent = localInfo.baseRent;
      const locationMultiplier = localInfo.locationMultiplier;
      const step1 = baseRent;
      const step2 = step1 * locationMultiplier;
      const step3 = step2 * (costMultipliers.gama[gama] || 1.0);
      const step4 = step3 * (costMultipliers.orcamento[orcamento] || 1.0);
      const step5 = step4 * (costMultipliers.cliente[cliente] || 1.0);
      const step6 = step5 * (costMultipliers.localizacao[localizacao] || 1.0);
      const step7 = step6 + 500; // utilities
      const step8 = step7 + 2000; // staff
      const step9 = step8 + 300; // maintenance
      const step10 = step9 + 400; // marketing
      const finalTotal = Math.round(step10);

      const calculationData = [
        ['Passo', 'Descrição', 'Fórmula', 'Valor (€)'],
        ['1', 'Renda base do local', `locaisConhecidos[${recomendacao.consequente}].baseRent`, step1.toFixed(0)],
        ['2', 'Aplicar multiplicador de localização', `${step1.toFixed(0)} × ${locationMultiplier}`, step2.toFixed(0)],
        ['3', 'Aplicar multiplicador de gama', `${step2.toFixed(0)} × ${(costMultipliers.gama[gama] || 1.0).toFixed(1)}`, step3.toFixed(0)],
        ['4', 'Aplicar multiplicador de orçamento', `${step3.toFixed(0)} × ${(costMultipliers.orcamento[orcamento] || 1.0).toFixed(1)}`, step4.toFixed(0)],
        ['5', 'Aplicar multiplicador de cliente', `${step4.toFixed(0)} × ${(costMultipliers.cliente[cliente] || 1.0).toFixed(1)}`, step5.toFixed(0)],
        ['6', 'Aplicar multiplicador de preferência de localização', `${step5.toFixed(0)} × ${(costMultipliers.localizacao[localizacao] || 1.0).toFixed(1)}`, step6.toFixed(0)],
        ['7', 'Adicionar custos de utilitários', `${step6.toFixed(0)} + 500`, step7.toFixed(0)],
        ['8', 'Adicionar custos de staff', `${step7.toFixed(0)} + 2000`, step8.toFixed(0)],
        ['9', 'Adicionar custos de manutenção', `${step8.toFixed(0)} + 300`, step9.toFixed(0)],
        ['10', 'Adicionar custos de marketing', `${step9.toFixed(0)} + 400`, step10.toFixed(0)],
        ['11', 'Arredondar para euro mais próximo', `Math.round(${step10.toFixed(2)})`, finalTotal.toString()]
      ];

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 140,
          head: [calculationData[0]],
          body: calculationData.slice(1),
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 60 },
            2: { cellWidth: 70 },
            3: { cellWidth: 25 }
          }
        });
      }
    } else {
      doc.text('Não disponível', 20, 50);
    }

    // Section 6: Filtros Avançados
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('6. Filtros Avançados Aplicados', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let filtrosText = '';
    if (filtrosAvancados && Object.keys(filtrosAvancados).length > 0) {
      if (filtrosAvancados.orcamentoMin) filtrosText += `• Orçamento Mínimo: €${filtrosAvancados.orcamentoMin}\n`;
      if (filtrosAvancados.orcamentoMax) filtrosText += `• Orçamento Máximo: €${filtrosAvancados.orcamentoMax}\n`;
      if (filtrosAvancados.tiposCarro && filtrosAvancados.tiposCarro.length > 0) filtrosText += `• Tipos de Carro: ${filtrosAvancados.tiposCarro.join(', ')}\n`;
      if (filtrosAvancados.faixaEtaria) filtrosText += `• Faixa Etária: ${filtrosAvancados.faixaEtaria}\n`;
      if (filtrosAvancados.nivelRendimento) filtrosText += `• Nível de Rendimento: ${filtrosAvancados.nivelRendimento}\n`;
    }
    if (filtrosText) {
      const filtrosLines = doc.splitTextToSize(filtrosText, 170);
      doc.text(filtrosLines, 20, 50);
    } else {
      doc.text('Nenhum filtro avançado aplicado.', 20, 50);
    }

    // Section 7: Análise SWOT
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('7. Análise SWOT', 20, 30);

    // Criar tabela SWOT específica para o local
    const localInfo = locaisConhecidos[recomendacao.consequente];
    const swotData = [
      ['Forças', 'Fraquezas'],
      [`• ${localInfo ? localInfo.description : 'Localização estratégica'}\n• Alta visibilidade e acessibilidade\n• Demanda consistente de clientes`, '• Concorrência local intensa\n• Custos operacionais elevados\n• Dependência de fatores económicos externos'],
      ['Oportunidades', 'Ameaças'],
      ['• Expansão para novos segmentos de mercado\n• Parcerias com empresas locais\n• Inovação em serviços e tecnologias', '• Flutuações económicas\n• Mudanças nas preferências dos consumidores\n• Regulamentações governamentais']
    ];

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 50,
        head: [],
        body: swotData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 90 }
        }
      });
    }

    // Section 8: Conclusão e Recomendações
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('8. Conclusão e Recomendações', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const conclusaoText = `Com base na análise realizada, recomendamos a abertura do stand automóvel no local ${recomendacao.consequente}. Esta recomendação tem um nível de confiança de ${recomendacao.confidenceAjustada ? (recomendacao.confidenceAjustada * 100).toFixed(0) + '%' : 'N/A'} e considera todos os critérios fornecidos. Recomendamos consultar um especialista local para avaliação detalhada antes de tomar uma decisão final.`;
    const conclusaoLines = doc.splitTextToSize(conclusaoText, 170);
    doc.text(conclusaoLines, 20, 50);

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Este relatório foi gerado automaticamente pelo sistema de Consultoria Auto Premium.', 20, doc.internal.pageSize.height - 20);
      doc.text('Para mais informações, visite www.consultoriaautopremium.com', 20, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${pageCount}`, 180, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    doc.save('relatorio_recomendacao.pdf');
    const t = translations[currentLanguage];
    alert(t.reportExported);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    alert('Erro ao exportar relatório. Verifique o console para mais detalhes.');
  }
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
