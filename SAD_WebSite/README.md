# Projeto SAD: Sistema de Apoio à Decisão para Stand de Vendas Multimarca de Automóveis

## Visão Geral do Projeto

Este projeto consiste no desenvolvimento de um **Sistema de Apoio à Decisão (SAD)** para um **Stand de Vendas Multimarca de Automóveis no Grande Porto**. O principal objetivo é fornecer uma solução de *software* que auxilie na gestão do negócio, seleção de inventário e otimização do *layout* da exposição.

O desenvolvimento da solução inclui a aplicação prática de conceitos de **Desenvolvimento de *Software*** e **Business Intelligence (BI)**, com a implementação centralizada no **algoritmo APRIORI**.

## Objetivos

O projeto visa atingir os seguintes objetivos principais:
* Aplicação prática de conceitos de desenvolvimento de *software* e Business Intelligence.
* Desenvolvimento de habilidades em liderança, gestão, modelagem matemática e programação.
* Resolução de problemas concretos em ambiente real.
* Estimular a capacidade empreendedora dos alunos.

## Motivações e Desafios

O sistema deve ser capaz de auxiliar nas seguintes decisões cruciais para o negócio:
* Escolher a dimensão adequada do *stand*.
* Selecionar as gamas de automóveis a expor.
* Considerar os gostos dos clientes e a melhor forma de exposição das viaturas para conquistar clientes.
* Recomendar produtos a promover paralelamente à venda da viatura (Cross-Selling).
* Sugerir a melhor zona para o negócio.

## Requisitos Funcionais (RF)

O *software* a ser desenvolvido deverá contemplar os seguintes requisitos funcionais:
* **RF 1:** Autenticação para entrada na aplicação.
* **RF 2:** Desenho da aplicação (*Interfaces Gráficos*).
* **RF 3:** Introdução manual de modelos de automóveis (*CRUD Manual*).
* **RF 4:** Importação em massa de Base de Dados de automóveis (*CRUD Bulk*).
* **RF 5:** Procura e seleção de modelo(s).
* **RF 6:** Execução de nova simulação baseada no algoritmo **APRIORI**. Inclui o cálculo de custos de operação e a produção de uma matriz SWOT.
* **RF 7:** Exportação dos resultados da simulação.

## Tecnologias Adotadas

### Aplicação Principal (Requisitos)
* **IDE/Linguagem:** Visual Studio.
* **Base de Dados:** XAMPP.

### Protótipo Web / Módulo de Consultoria (Implementação Atual)
* **Backend:** **Flask** (Python) para servir a aplicação.
* **Frontend:** **HTML5**, **CSS3**, **JavaScript ES6+**.
* **Framework UI:** **Bootstrap**.
* **Business Intelligence & Gráficos:** **Chart.js** para visualização de dados de *analytics*.
* **Serviço de Email:** **EmailJS** para o envio de recomendações.

## Status e Funcionalidades Implementadas (Protótipo Web)

A implementação do **Protótipo Web** encontra-se em estado avançado, com as seguintes funcionalidades ativas:

### 1. Sistema de Consultoria e Recomendação
* Página de consultoria dedicada (`consultoria.html`) com formulário moderno.
* Motor de recomendação implementado (`apriori.js`) baseado no **algoritmo Apriori** com *Machine Learning* leve.
* O sistema calcula as melhores localizações para o stand (Grande Porto) com base nos critérios de input: Tipo de Gama, Orçamento, Tipo de Cliente Alvo, e Preferência de Localização.
* **Aprendizagem Contínua:** O sistema ajusta a confiança das regras Apriori com base no *feedback* e nas tendências de mercado simuladas.
* Exportação de PDFs da recomendação usando jsPDF.

### 2. Análise de Dados (*Analytics Dashboard*)
* Dashboard de *analytics* implementado (`analytics.js`) para monitorização.
* Recolha de dados de uso e *feedback* do utilizador armazenados localmente.
* Visualização de estatísticas do sistema, incluindo contagens de locais, critérios, *success rates* e dados de *timeline*.

---

## Estrutura da Equipa

O projeto é desenvolvido pela seguinte equipa, cujas funções estão alinhadas com os requisitos definidos:

| Nome do Membro | Função |
| :--- | :--- |
| **Guilherme** | Project Manager |
| **Gabriel** | Analista / Arquiteto de Sistema |
| **Diogo** | Secretário |
| **Leandro** | Programador |
| **João** | Programador |
| **Arnaldo** | Programador |
| **Gonzalo** | Programador |

### Responsabilidades por Função (Geral)

* **Project Manager:** Comunicação, gestão de conflitos, planeamento (GANTT + WBS), relatórios e avaliação da equipa.
* **Analista / Arquiteto de Sistema:** Criação de repositório (SVN/GIT), relatório de requisitos, Plano de Testes de Aceitação, processo de instalação, Manual de Instalação e Manutenção.
* **Programador:** Desenvolvimento de *software*, implementação dos modelos de BI, implementação da BD em SQL Server, *Interfaces Gráficos*, testes unitários, e liderança/participação na revisão de código.
* **Secretário:** Implementação e manutenção do *website*, elaboração de atas, conformidade documental, produção da PEN com a documentação, e produção de um relatório científico.

---

## Cronograma e Entregáveis

O projeto está organizado em **WBS** (Work Breakdown Structure) e **Gantt Chart**, com três marcos de entrega (*Milestones*). *Nota: O atraso na entrega nas datas definidas implica uma penalização de 1 valor por dia ultrapassado*.

### 1ª Milestone (07/11/2025)
* Planeamento do Projeto (**GANTT + WBS**).
* Ativação do website (*Project Website on-line*).
* Relatório de Performance I.

### 2ª Milestone (19/12/2025)
* Relatório de especificação de requisitos (*Requirements Specification*).
* Relatório de testes de aceitação (*Acceptance Test Plan*).
* *Code Review I*.
* Testes de sobrevivência do projeto I (*Survival Test Report*).
* Relatório de Performance II.

### Última Milestone (Fevereiro 2026)
* Apresentação do Projeto e Auto-avaliação da equipa.
* Manual de Instalação e Manutenção.
* *Code Review II*.
* Instalação da aplicação “easy-to-use”.
* **PEN** com toda a documentação (*todos os artefatos*).
* Relatório científico e Relatório final do Projeto.
* Relatório de performance III.