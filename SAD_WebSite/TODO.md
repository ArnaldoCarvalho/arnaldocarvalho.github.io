# TODO: Migrar Projeto para Firebase Firestore

## Information Gathered
- **Current Setup**: O projeto usa PHP backend com MySQL local. O arquivo `api.php` lida com ações como `saveRecommendation`, `saveFeedback`, `getHistorico`, `getCriterios`. O banco de dados inclui tabelas como `recomendacoes`, `criterios`, `feedbacks`, `fAvancados`, `carros`.
- **Frontend**: `consultoria.js` faz chamadas fetch para `api.php`.
- **Migration Goal**: Substituir MySQL por Firebase Firestore, movendo a lógica do backend para o frontend JavaScript usando Firebase SDK.

## Plan
- [x] **Configurar Firebase**: Criar projeto Firebase, habilitar Firestore e Authentication se necessário. Adicionar Firebase SDK ao HTML.
- [x] **Migrar Modelo de Dados**: Adaptar tabelas MySQL para coleções Firestore (e.g., `recomendacoes` -> collection `recommendations`).
- [x] **Atualizar consultoria.js**: Substituir chamadas fetch para `api.php` por operações Firestore (addDoc, getDocs, updateDoc, etc.).
- [x] **Atualizar analytics.js**: Substituir fetch para `api.php` por operações Firestore.
- [x] **Remover Arquivos PHP**: Remover ou arquivar `db.php` e `api.php` após migração. ✅ Arquivos removidos.
- [x] **Testar Funcionalidades**: Verificar salvamento de recomendações, feedback, histórico e critérios.
- [ ] **Deploy**: Hospedar no Firebase Hosting se desejado.

## Dependent Files to be Edited
- `SAD-WebSite/JS/consultoria.js`: Principal arquivo a ser atualizado para usar Firebase.
- `SAD-WebSite/JS/analytics.js`: Atualizado para usar Firebase.
- `SAD-WebSite/PHP/consultoria.php`: Adicionar scripts Firebase SDK.
- `SAD-WebSite/PHP/api.php`: Removido após migração.
- `SAD-WebSite/PHP/db.php`: Removido.
- Novo arquivo: `SAD-WebSite/JS/firebase-config.js`: Para configuração Firebase.

## Followup Steps
- Configurar projeto Firebase no console.
- Instalar Firebase CLI para deploy.
- Testar em ambiente local e produção.
- Migrar dados existentes se necessário.
