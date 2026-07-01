# Controle de Demandas Semanais V2 — Sistema e Tecnologias

Este documento descreve a finalidade do sistema **Controle de Demandas Semanais V2** e detalha toda a stack tecnológica empregada.

## 📝 Descrição do Sistema

O **Controle de Demandas Semanais V2** é uma evolução do painel administrativo e de consolidação de demandas e relatórios para a Diretoria Financeira. A aplicação permite que analistas registrem suas atividades semanais de forma ágil, que gestores acompanhem o progresso do time e forneçam feedbacks, e que a diretoria visualize relatórios unificados e indicadores de desempenho.

## 🚀 Tecnologias Utilizadas

### Frontend
*   **React 19**: Biblioteca moderna para construção de interfaces SPA.
*   **Vite**: Build tool veloz e servidor de desenvolvimento otimizado.
*   **TypeScript**: Superset estático para maior tipagem e confiabilidade de código.
*   **Zustand**: Biblioteca leve de gerenciamento de estado global.
*   **@azure/msal-browser v5**: Biblioteca oficial da Microsoft para autenticação segura (SSO) baseada no Microsoft Entra ID.
*   **Tailwind CSS**: Estilização baseada em utilitários CSS para agilidade no design.
*   **Shadcn UI**: Componentes acessíveis, responsivos e customizáveis.
*   **React Router v7**: Roteamento dinâmico de páginas da aplicação.

### Backend
*   **Node.js**: Plataforma de execução JavaScript para o servidor.
*   **Express**: Framework web minimalista para a criação dos endpoints de API.
*   **Prisma ORM**: ORM moderno e seguro para mapear as tabelas do banco Azure SQL e gerenciar consultas com tipagem estática e prevenção nativa de SQL Injection.
*   **BcryptJS**: Biblioteca pure-JS para criptografia/hashing irreversível de senhas no banco de dados.
*   **Nodemailer**: Biblioteca para envio de e-mails transacionais e notificações via SMTP.

### Banco de Dados
*   **Microsoft Azure SQL Database**: Banco de dados relacional em nuvem que gerencia os dados transacionais de colaboradores, reportes e demandas.

### Integrações e Inteligência Artificial
*   **OpenRouter / Gemini 2.5 Flash**: API de inteligência artificial de última geração utilizada para o parsing inteligente de mensagens brutas de reportes, prevenção semântica de duplicidades, chat de assistente e consolidação executiva semanal.
*   **Agendamento Cron Nativo (Vanilla JS)**: Algoritmo autônomo baseado em `setTimeout` e datas locais do servidor configurado no backend para processar de forma silenciosa e resiliente a consolidação executiva de todas as equipes toda sexta-feira às 08:00 de forma nativa e sem necessidade de pacotes externos.
*   **Farol de Prazos Dinâmico**: Elemento visual customizado no painel do colaborador que computa a data atual e alerta visualmente sobre a janela de prazos corporativos (limite de envio toda quinta às 16h), mudando a cor do sinalizador (Verde, Amarelo, Vermelho, Cinza).
*   **Renderizador Inline de Markdown (MarkdownText)**: Engine leve escrita em React puro integrada ao chat da IA para converter textos markdown gerados pela LLM em títulos, parágrafos, listas organizadas com ID/data, e botões interativos de mudança de status em tempo real.

## 🛠️ Execução e Arquitetura de Implantação (Deploy)

Para simplificar a operação e evitar problemas de roteamento/CORS em produção, a aplicação foi configurada sob uma arquitetura de execução unificada:

### 1. Ambiente de Desenvolvimento (Local)
Utiliza-se o pacote `concurrently` configurado no [package.json](file:///d:/Reportes-Semanais-V2/package.json) raiz para subir simultaneamente:
- O servidor de desenvolvimento do **Vite** na porta `8080` (frontend).
- O servidor **Express** na porta `5001` (backend).

Comando de inicialização:
```bash
npm run dev
```

### 2. Ambiente de Produção (Deploy Unificado)
No ambiente de produção, a aplicação roda em um único serviço (porta do backend):
1. O frontend é compilado para arquivos estáticos (`vite build`), gerando o diretório `dist/`.
2. O servidor Express ([server/src/index.js](file:///d:/Reportes-Semanais-V2/server/src/index.js)) detecta `NODE_ENV=production` e serve nativamente os arquivos da pasta `dist/` usando `express.static`.
3. Todas as requisições que não sejam de API (`/api/*`) são redirecionadas para o `index.html` do frontend, permitindo o roteamento correto no lado do cliente (Client-Side Routing).

Comando de build e inicialização em produção:
```bash
npm run build
npm start
```

