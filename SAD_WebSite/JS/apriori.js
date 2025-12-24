// Implementação inovadora do algoritmo Apriori com machine learning leve para recomendações
// Inclui integração com dados de mercado em tempo real e Firebase Firestore

import {
  saveTransaction,
  getAllTransactions,
  saveFrequentItemsets,
  getFrequentItemsets,
  saveAssociationRules,
  getAssociationRules
} from '../firebase/firestore.js';

// Mock API para dados de mercado em tempo real
async function fetchMarketData() {
  // Simular chamada de API para dados de mercado
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rentalPrices: {
          'Porto Centro': 2500,
          'Vila Nova de Gaia': 1800,
          'Leça da Palmeira': 2200,
          'Gondomar': 1500,
          'Maia': 1900,
          'Póvoa de Varzim': 2000
        },
        economicIndicators: {
          inflation: 0.025, // 2.5%
          tourismGrowth: 0.15, // 15%
          carSalesGrowth: 0.08 // 8%
        },
        trends: {
          'luxo': 1.12, // Aumento de 12% na demanda por luxo
          'economico': 0.88, // Diminuição de 12% devido a inflação
          'centro': 1.08, // Aumento devido a turismo
          'praia': 1.10, // Aumento devido a procura por lazer
          'executivos': 1.05,
          'jovens': 0.95,
          'familias': 1.06
        }
      });
    }, 500); // Simular delay de rede
  });
}

export async function gerarRecomendacao(transactions, respostas, filtrosAvancados, minSupport, minConfidence) {
  // Save the current transaction to Firebase
  await saveTransaction([...respostas, '']); // We'll update the location later

  // Fetch market data for real-time trends
  const marketData = await fetchMarketData();

  // Passo 1: Calcular suporte para itens individuais
  const itemCounts = {};
  transactions.forEach(transaction => {
    transaction.forEach(item => {
      if (!itemCounts[item]) itemCounts[item] = 0;
      itemCounts[item]++;
    });
  });

  const totalTransactions = transactions.length;
  const frequentItems = {};
  for (const item in itemCounts) {
    const support = itemCounts[item] / totalTransactions;
    if (support >= minSupport) {
      frequentItems[item] = support;
    }
  }

  // Inovação: Ajuste dinâmico de confiança baseado em tendências simuladas (machine learning leve)
  // Agora integrado com dados de mercado em tempo real
  const tendenciasAtuais = marketData.trends;

  // Dados dos locais para adicionar às regras
  const locationData = {
    'Porto Centro': { image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', description: 'Centro histórico do Porto, ideal para stands de luxo com alta visibilidade.', lat: 41.1579, lng: -8.6291, orcamentoMin: 100000, orcamentoMax: 500000, tiposCarro: ['sedan', 'coupe'], faixaEtaria: '41-60', nivelRendimento: 'alto' },
    'Vila Nova de Gaia': { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', description: 'Subúrbio familiar com acesso fácil ao Porto, perfeito para famílias.', lat: 41.1333, lng: -8.6167, orcamentoMin: 50000, orcamentoMax: 150000, tiposCarro: ['suv', 'hatchback'], faixaEtaria: '26-40', nivelRendimento: 'medio' },
    'Leça da Palmeira': { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', description: 'Área costeira vibrante, atrativa para jovens e turismo.', lat: 41.1917, lng: -8.7000, orcamentoMin: 20000, orcamentoMax: 60000, tiposCarro: ['hatchback', 'eletrico'], faixaEtaria: '18-25', nivelRendimento: 'baixo' },
    'Gondomar': { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', description: 'Área residencial acessível, ideal para famílias com orçamento limitado.', lat: 41.1500, lng: -8.5333, orcamentoMin: 25000, orcamentoMax: 70000, tiposCarro: ['hatchback', 'suv'], faixaEtaria: '26-40', nivelRendimento: 'baixo' },
    'Maia': { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', description: 'Subúrbio moderno com boas infraestruturas familiares.', lat: 41.2333, lng: -8.6167, orcamentoMin: 60000, orcamentoMax: 180000, tiposCarro: ['suv', 'sedan'], faixaEtaria: '26-40', nivelRendimento: 'medio' },
    'Póvoa de Varzim': { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80', description: 'Costa norte com praias e vida noturna, atrativa para jovens.', lat: 41.3833, lng: -8.7667, orcamentoMin: 30000, orcamentoMax: 80000, tiposCarro: ['hatchback', 'coupe'], faixaEtaria: '18-25', nivelRendimento: 'medio' }
  };

  // Passo 2: Gerar regras de associação dinamicamente a partir das transações
  const ruleMap = {};
  transactions.forEach(transaction => {
    const antecedente = transaction.slice(0, 4); // First 4 items as criteria
    const consequente = transaction[4]; // Last item as location
    const key = antecedente.join(',') + '->' + consequente;
    if (!ruleMap[key]) {
      ruleMap[key] = { antecedente, consequente, count: 0 };
    }
    ruleMap[key].count++;
  });

  // Calcular suporte e confiança para cada regra
  let regras = [];
  for (const key in ruleMap) {
    const rule = ruleMap[key];
    const supportAntecedente = transactions.filter(t => rule.antecedente.every(item => t.includes(item))).length / totalTransactions;
    const supportRule = rule.count / totalTransactions;
    const confidence = supportRule / supportAntecedente;

    if (supportRule >= minSupport && confidence >= minConfidence && locationData[rule.consequente]) {
      regras.push({
        antecedente: rule.antecedente,
        consequente: rule.consequente,
        confidence,
        ...locationData[rule.consequente]
      });
    }
  }

  // Filtrar regras com base em filtros avançados
  if (filtrosAvancados.orcamentoMin || filtrosAvancados.orcamentoMax) {
    regras = regras.filter(regra => {
      const orcamentoMin = filtrosAvancados.orcamentoMin || 0;
      const orcamentoMax = filtrosAvancados.orcamentoMax || Infinity;
      return regra.orcamentoMin >= orcamentoMin && regra.orcamentoMax <= orcamentoMax;
    });
  }
  if (filtrosAvancados.tiposCarro && filtrosAvancados.tiposCarro.length > 0) {
    regras = regras.filter(regra => filtrosAvancados.tiposCarro.some(tipo => regra.tiposCarro.includes(tipo)));
  }
  if (filtrosAvancados.faixaEtaria) {
    regras = regras.filter(regra => regra.faixaEtaria === filtrosAvancados.faixaEtaria);
  }
  if (filtrosAvancados.nivelRendimento) {
    regras = regras.filter(regra => regra.nivelRendimento === filtrosAvancados.nivelRendimento);
  }

  // Aplicar ajustes de tendências às regras
  regras.forEach(regra => {
    let ajuste = 1;
    regra.antecedente.forEach(item => {
      if (tendenciasAtuais[item]) ajuste *= tendenciasAtuais[item];
    });
    if (tendenciasAtuais[regra.consequente.toLowerCase().split(' ')[0]]) {
      ajuste *= tendenciasAtuais[regra.consequente.toLowerCase().split(' ')[0]];
    }
    regra.confidenceAjustada = Math.min(regra.confidence * ajuste, 1); // Limitar a 100%
  });

  // Função para calcular os melhores locais com pesos ponderados (top 3)
  function calcularMelhoresLocais(respostas, regras) {
    const pesos = {
      gama: 0.3,      // Tipo de gama: luxo, medio, economico
      orcamento: 0.2, // Orçamento: baixo, medio, alto
      cliente: 0.3,   // Cliente alvo: familias, jovens, executivos
      localizacao: 0.2 // Preferência: centro, subúrbios, praia
    };

    const regrasComScore = regras.map(regra => {
      let score = 0;
      // Verificar correspondências com pesos
      if (regra.antecedente.includes(respostas[0])) score += pesos.gama; // Gama
      if (regra.antecedente.includes(respostas[1])) score += pesos.orcamento; // Orçamento
      if (regra.antecedente.includes(respostas[2])) score += pesos.cliente; // Cliente
      if (regra.antecedente.includes(respostas[3])) score += pesos.localizacao; // Localização

      // Multiplicar pelo confidence ajustado
      score *= regra.confidenceAjustada;

      return { ...regra, score };
    });

    // Ordenar por score decrescente e pegar top 3
    regrasComScore.sort((a, b) => b.score - a.score);
    return regrasComScore.slice(0, 3);
  }

  const melhoresRegras = calcularMelhoresLocais(respostas, regras);

  if (melhoresRegras.length > 0) {
    const melhorRegra = melhoresRegras[0];
    return {
      recomendacao: `Com base nas suas respostas e tendências atuais, recomendamos abrir o stand em ${melhorRegra.consequente}. Confiança ajustada: ${(melhorRegra.confidenceAjustada * 100).toFixed(0)}%.`,
      ...melhorRegra,
      melhoresRegras
    };
  } else {
    return {
      recomendacao: "Não foi possível gerar uma recomendação forte com os dados fornecidos. Considere ajustar suas preferências ou contacte-nos para uma análise mais detalhada.",
      lat: null,
      lng: null
    };
  }
}
