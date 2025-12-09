# Documentação de Software - Sistema de Análise Fluviométrica

## 1\. Descrição Geral do Sistema

### Objetivo do Software

O sistema tem como objetivo auxiliar no processamento e interpretação de dados de vazão de rios, fornecendo uma interface para gerenciar metadados de estações, importar registros de vazão e realizar análises estatísticas essenciais para a gestão de recursos hídricos.

### Principais Funcionalidades

  * **Gerenciamento de Estações:** Visualização e gestão de metadados de estações fluviométricas (foco em RS e SC).
  * **Análise de Vazões:** Processamento e visualização de dados históricos.
  * **Curva de Permanência:** Cálculo de curvas para análise de disponibilidade hídrica.
  * **Análise Q7,10:** Cálculo da vazão mínima média de sete dias consecutivos com período de retorno de dez anos.
  * **Comparação de Percentis:** Ferramentas para comparar diferentes percentis de vazão.
  * **Pré-processamento:** Limpeza e preparação de dados.

### Arquitetura Geral

O software é uma aplicação Desktop construída com **Electron**, utilizando uma arquitetura modular que separa o processo principal (Main) da interface (Renderer) e da lógica de negócios (Backend).

  * **Frontend:** React com TypeScript e Material UI (MUI).
  * **Backend:** Node.js com TypeScript.
  * **Banco de Dados:** SQLite (local).
  * **Build/Empacotamento:** Vite e Electron Forge.

## 2\. Ambiente de Desenvolvimento

  * **Linguagens:** TypeScript, JavaScript.
  * **Runtime:** Node.js (v20+ recomendado).
  * **Ferramentas de Build:** Vite v7.1.7, Electron Forge.
  * **Formatação de Código:** Prettier.

## 3\. Dependências

As principais bibliotecas e frameworks utilizados no projeto são:

**Dependências de Produção:**

  * `electron`: 38.0.0
  * `react`: ^19.1.1
  * `react-dom`: ^19.1.1
  * `@mui/material`: ^7.3.4 (Interface Gráfica)
  * `@mui/x-charts`: ^8.20.0 (Gráficos)
  * `better-sqlite3`: ^12.4.1 (Banco de Dados)
  * `dayjs`: ^1.11.18 (Manipulação de Datas)

**Dependências de Desenvolvimento:**

  * `typescript`: ^5.9.3
  * `vite`: ^7.1.7
  * `@electron-forge/cli`: ^7.8.3

## 4\. Instalação

### Pré-requisitos

  * Git
  * Node.js

### Passo a Passo

1.  **Clonar o repositório:**
    Utilize o comando `git clone` para baixar o código fonte.
2.  **Acessar a pasta do projeto:**
    Navegue até o diretório raiz do projeto clonado.
3.  **Instalar dependências:**
    Execute o comando abaixo para instalar todas as bibliotecas necessárias:
    
    ```
    npm install
    ```

## 5\. Configuração

### Execução Local

Para iniciar a aplicação em modo de desenvolvimento:

```
npm start
```

Para empacotar a aplicação para distribuição:

```
npm run package
```

### Banco de Dados

O sistema utiliza o **SQLite**. A configuração é automática:

  * O gerenciador de banco de dados verifica a existência do arquivo do banco.
  * Se não existir, ele cria o diretório e o arquivo automaticamente (`schema.db` em dev ou `fluviometric.db` em produção).
  * As tabelas (`stations`, `daily_streamflows`, `monthly_stats`) e índices são criados automaticamente na inicialização.

## 6\. Estrutura do Código

A organização das pastas segue o padrão modular do Electron Forge com Vite:

  * `/src/electron/`: Contém o processo principal (Main Process) e scripts de preload, responsáveis pela comunicação com o sistema operacional e criação de janelas.
  * `/src/backend/`: Lógica de negócios e acesso a dados.
      * `controllers/`: Gerencia as requisições que chegam via IPC.
      * `db/`: Configuração do SQLite e schemas.
      * `routes/`: Definição dos canais de comunicação (endpoints IPC).
      * `services/`: Algoritmos de cálculo (Q7,10, Percentis).
  * `/src/frontend/`: Contém a interface do usuário (Renderer Process).
      * `components/`: Componentes React reutilizáveis e telas principais.
      * `services/`: Integração com a API do backend via IPC.
  * `/src/data/`: Arquivos estáticos JSON com metadados das estações e registros de vazão iniciais.
  * `/src/frontend.old/`: Contém as interfaces *placeholders* e de testes iniciais do projeto.

## 7\. Interface

### Fluxo de Navegação

O sistema utiliza uma barra lateral para navegação entre os módulos principais:

1.  **Alterar Estação:** Retorna à tela inicial de seleção.
2.  **Informações Estação:** Exibe detalhes da estação selecionada (tela `home`).
3.  **Pré-Processamento:** Ferramentas de ajuste de dados (tela `pre-processing`).
4.  **Dados Fluviométricos:** Tabela e visualização de vazões (tela `streamflow`).
5.  **Curva de Permanência:** Gráfico de persistência de vazão (tela `flow-duration-curve`).
6.  **Vazão Q7,10:** Módulo de análise específica Q7,10 (tela `q710`).

## 8\. APIs (Canais IPC)

O sistema utiliza comunicação Inter-Process (IPC) em vez de APIs HTTP tradicionais. Abaixo estão os principais canais ("endpoints") disponíveis para o frontend:

### Estações (`src/backend/routes/station.routes.ts`)

  * `stations:getAll`: Retorna todas as estações.
  * `stations:getById`: Busca estação por ID (código).
  * `stations:search`: Busca estações com filtros (nome, bacia, rio, estado, cidade).
  * `stations:count`: Retorna a contagem total de estações.

### Vazões (`src/backend/routes/streamflow.routes.ts`)

  * `streamflow:getForExport`: Busca vazões filtradas por data para exportação.
  * `streamflow:analyzeNullFlows`: Analisa falhas nos registros de vazão.
  * `streamflow:getNullFlowsSummary`: Retorna um resumo das falhas.
  * `streamflow:getAvailableDateRange`: Retorna as datas mínima e máxima disponíveis.

### Análise e Cálculos (`src/backend/routes/percentile.routes.ts` e `q710.routes.ts`)

  * `analysis:calculateQ710`: Realiza o cálculo da Q7,10.
  * `analysis:calculatePercentile`: Calcula um percentil específico.
  * `analysis:calculateFlowDurationCurve`: Gera dados para a curva de permanência.
  * `analysis:compareAllPercentileMethods`: Compara diferentes métodos estatísticos de cálculo.
