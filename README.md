# Sistema de Análise Fluviométrica
Uma aplicação desktop para análise de dados fluviométricos, incluindo cálculo de curvas de permanência, análise Q7,10 e outras ferramentas hidrológicas.

<div align="middle"><img src="src/assets/icon.ico" height="80"/></div>

## Descrição
Este projeto é um sistema de análise hidrológica desenvolvido como parte da disciplina **Projeto Integrador I** do curso de bacharelado em **Engenharia da Computação**, da **Universidade Federal de Santa Catarina (UFSC) - Campus Araranguá**.

O software foi construído para auxiliar no processamento e interpretação de dados de vazão de rios. Ele fornece uma interface amigável para gerenciar metadados de estações, importar registros de vazão e realizar análises estatísticas essenciais para a gestão de recursos hídricos. A aplicação utiliza um banco de dados SQLite local para armazenar e consultar dados hidrológicos de forma eficiente.

Os dados das estações e de vazão utilizados nesta aplicação foram obtidos através da **Agência Nacional de Águas e Saneamento Básico (ANA)**.

## Funcionalidades
- **Gerenciamento de Estações:** Ferramentas para gerenciar e visualizar metadados de estações fluviométricas (focando em conjuntos de dados do Rio Grande do Sul e Santa Catarina).
- **Análise de Vazões:** Visualização e processamento de dados históricos de vazão.
- **Curva de Permanência:** Cálculo e plotagem de curvas de permanência para análise de disponibilidade hídrica.
- **Análise Q7,10:** Ferramentas específicas para o cálculo da vazão mínima média de sete dias consecutivos com período de retorno de dez anos (Q7,10).
- **Comparação de Percentis:** Recursos para comparar diferentes percentis de vazão.
- **Pré-processamento de Dados:** Utilitários para limpeza e preparação dos dados de entrada para análise.

## Tecnologias Utilizadas
- **Core:** Electron (v38.0.0)
- **Frontend:** React (v19), TypeScript, Material UI (MUI)
- **Backend:** Node.js, TypeScript
- **Banco de Dados:** SQLite (via better-sqlite3)
- **Ferramentas de Build:** Vite, Electron Forge

## Instalação
Para clonar e executar esta aplicação, você precisará do Git e do Node.js instalados no seu computador.
1. Clone o repositório
2. Navegue até a pasta do repositório
3. Instale as dependências:

```
npm install
```

## Uso
Você pode executar a aplicação em modo de desenvolvimento ou empacotá-la para distribuição usando os seguintes scripts definidos no package.json:

- Iniciar a aplicação (Desenvolvimento):
```
npm start
```
- Empacotar a aplicação:
```
npm run package
```
- Criar distribuíveis (Make):
```
npm run make
```

## Estrutura do Projeto
O projeto segue uma estrutura modular separando o processo principal do Electron, o frontend em React e a lógica de backend:
- **src/electron/:** Processo principal (main) e scripts de preload.
- **src/frontend/:** Componentes React, telas (Início, Curva de Permanência, Vazão) e interfaces de usuário.
- **src/backend/:** Controladores, serviços e lógica de banco de dados para cálculos (Q7,10, Curva de Permanência).
- **src/data/:** Arquivos JSON para metadados das estações e registros de vazão.

## Autores
- Augusto Henrique de Souza Miranda
- Thomas Tavares Tomaz

## Licença
Este projeto está licenciado sob a Licença MIT.

---
<a href="https://www.flaticon.com/free-icons/sea" title="sea icons">Sea icons created by Yobany_MTOM - Flaticon</a>
