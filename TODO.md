# TODO: Desenvolvimento do Sistema de Apoio à Decisão para Stand Auto Premium

## Funcionalidades Implementadas

### 1. Estrutura Geral do Website
- [x] Criar página principal (index.html) com design responsivo usando Bootstrap
- [x] Implementar navbar fixa com navegação para todas as páginas
- [x] Desenvolver secção hero com imagem de fundo e chamada para acção
- [x] Criar catálogo de automóveis em destaque com cards informativos
- [x] Implementar secção "Sobre Nós" com descrição do stand
- [x] Desenvolver formulário de contacto na página principal
- [x] Implementar funcionalidade de envio de email no formulário de contacto usando EmailJS (credenciais necessárias: Service ID, Template ID, Public Key)
- [x] Adicionar footer com direitos reservados

### 2. Sistema de Consultoria com Apriori
- [x] Criar página de consultoria (consultoria.html) com design moderno
- [x] Implementar formulário principal com campos obrigatórios:
  - Tipo de Gama (Luxo, Médio, Económico)
  - Orçamento (Baixo, Médio, Alto)
  - Tipo de Cliente Alvo (Famílias, Jovens, Executivos)
  - Preferência de Localização (Centro, Subúrbios, Próximo à Praia)
- [x] Adicionar campo opcional "Local Específico" com datalist de locais conhecidos
- [x] Implementar filtros avançados colapsáveis:
  - Faixa de Orçamento (€)
  - Tipos de Carro (múltipla selecção)
  - Faixa Etária do Cliente
  - Nível de Rendimento
- [x] Desenvolver algoritmo Apriori inovador (apriori.js) com:
  - Análise de associações multidimensionais
  - Ajustes dinâmicos baseados em tendências de mercado
  - Integração com dados simulados de mercado em tempo real
  - Machine learning leve para pesos dinâmicos
- [x] Implementar geração de recomendações personalizadas
- [x] Adicionar visualização de resultados com:
  - Imagem do local recomendado
  - Descrição detalhada
  - Mapa do Grande Porto
  - Percentagem de confiança ajustada
- [x] Sistema de feedback com botões de aprovação/desaprovação
- [x] Funcionalidades de acção:
  - Exportar relatório em PDF
  - Partilhar recomendação
  - Obter direcções no Google Maps
- [x] Secção de comodidades próximas simuladas
- [x] Histórico de recomendações com armazenamento local
- [x] Sistema de aprendizagem: novos locais são aprendidos e regras ajustadas
- [x] Comparação de locais recomendados (top 3)
- [x] Limpeza do histórico de recomendações

### 3. Dashboard de Analytics
- [x] Criar módulo de analytics (analytics.js) com classe AnalyticsDashboard
- [x] Implementar agregação de dados do localStorage
- [x] Gráficos de recomendações por local (barras)
- [x] Taxas de sucesso por local (donut chart)
- [x] Combinações de critérios mais comuns (barras horizontais)
- [x] Distribuição de feedback (pizza chart)
- [x] Integração com Chart.js para visualizações
- [ ] Melhorar gráficos existentes com design aprimorado
- [ ] Atualizar para Chart.js v3 syntax
- [ ] Adicionar gráfico de recomendações ao longo do tempo
- [ ] Melhorar "Combinações de Critérios Mais Comuns" com cores e tooltips
- [ ] Melhorar "Distribuição de Feedback" com interatividade

### 4. Páginas Adicionais
- [x] Página de detalhes do carro (detalhes.html) - estrutura básica
- [x] Página do carrinho de compras (carrinho.html) - estrutura básica
- [x] Página de administração (admin.html) - estrutura básica
- [x] Página de login (login.html) - estrutura básica

### 5. Funcionalidades Técnicas
- [x] Design responsivo com Bootstrap 5.3.3
- [x] Armazenamento local para histórico e dados aprendidos
- [x] Validação de formulários
- [x] Animações CSS para melhor UX
- [x] Fontes Google (Poppins)
- [x] Ícones Font Awesome
- [x] Integração com jsPDF para exportação de PDFs
- [x] Simulação de API para dados de mercado
- [x] Tratamento de erros e validações

### 6. Base de Dados e Regras
- [x] Locais pré-definidos no Grande Porto com coordenadas e descrições
- [x] Regras de associação Apriori com confianças iniciais
- [x] Sistema de aprendizagem contínua baseado em feedback do utilizador
- [x] Ajuste dinâmico de confianças com base em tendências simuladas

### 7. Melhorias de UX/UI
- [x] Tema consistente em todas as páginas
- [x] Animações de fade-in e hover effects
- [x] Cores e gradientes modernos
- [x] Layout intuitivo e fácil navegação
- [x] Mensagens de feedback claras para o utilizador

## Estatísticas do Sistema
- Locais cobertos: Porto Centro, Vila Nova de Gaia, Leça da Palmeira, Gondomar, Maia, Póvoa de Varzim
- Regras de associação: 18 regras pré-definidas
- Filtros avançados: 4 categorias
- Tipos de gráficos: 5 tipos diferentes (após melhorias)
- Tecnologias: HTML5, CSS3, JavaScript ES6+, Bootstrap, Chart.js, jsPDF

## Próximas Melhorias Potenciais
- [ ] Integração com API real de dados de mercado
- [ ] Sistema de utilizadores com autenticação
- [ ] Base de dados persistente (não apenas localStorage)
- [ ] Funcionalidades avançadas no painel admin
- [ ] Testes automatizados
- [ ] Otimização de performance
