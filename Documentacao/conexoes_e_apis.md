# Controle de Demandas Semanais V2 — Conexões de Banco e APIs

Este documento mapeia todas as conexões de banco de dados e endpoints de API consumidos ou expostos pelo sistema.

## 🗄️ Conexão de Banco de Dados

O backend conecta-se à instância gerenciada do **Microsoft Azure SQL Database** através de credenciais mapeadas no arquivo `.env`.

*   **Host**: `srvproddf.database.windows.net`
*   **Database**: `DB_CRONOGRAMA_DF`
*   **Usuário**: `cronogramadf`
*   **Porta**: `1433`
*   **Mecanismo**: Prisma ORM v5 com provedor nativo `sqlserver`.

---

## 🔌 Mapeamento de APIs (Backend Express)

Todas as rotas do backend rodam sob o prefixo `/api` no servidor Express (porta `5001` em desenvolvimento):

### 1. Autenticação e Usuários
*   **`POST /api/login`**: Valida o email e senha do usuário contra o banco de dados e retorna os dados do perfil autenticado.
*   **`GET /api/users`**: Retorna a listagem completa de colaboradores com seus perfis cadastrados.
*   **`POST /api/users`**: Registra um novo colaborador.
*   **`PUT /api/users/:id`**: Atualiza dados cadastrais de um colaborador existente.
*   **`DELETE /api/users/:id`**: Exclui o cadastro de um usuário.
*   **`POST /api/microsoft`**: Recebe os dados obtidos via Microsoft SSO (email, name, microsoftId), valida ou vincula o colaborador contra o banco de dados e retorna o perfil autenticado do usuário.
*   **`POST /api/forgot-password`**: Recebe o e-mail do usuário, valida se está cadastrado, gera uma senha temporária complexa (`Vibra@xxxx`), salva o hash bcrypt dessa senha no banco e envia a senha temporária para o e-mail cadastrado por SMTP.

### 2. Tarefas e Demandas
*   **`GET /api/tasks`**: Retorna a listagem das demandas reportadas. Aceita os query parameters:
    *   `IdUsuario`: Filtra apenas as demandas daquele analista.
    *   `IdSuperior`: Filtra apenas as demandas dos subordinados do gestor.
*   **`PUT /api/tasks/:id`**: Atualiza uma tarefa de forma dinâmica. Suporta a alteração de:
    *   `DescricaoTarefa` (String)
    *   `StatusTarefa` (String - Mapeada para 'Não Iniciado', 'Em Andamento', 'Aguardando', 'Finalizado', 'Cancelado')
    *   `ComentarioDiretor` (String - Feedback avaliado pela liderança, registrando data/hora automaticamente)
    *   `OrdemPrioridade` (Int - Prioridade da tarefa: 1 para Alta, 2 para Média, 3 para Baixa)
    *   `ComentarioNotificado` (Boolean - Controla se a notificação foi lida pelo subordinado)

### 3. Consolidação Semanal por LLM (OpenRouter)
*   **`GET /api/consolidation`**: Retorna a consolidação executiva gerada por inteligência artificial para o superior correspondente na semana/ano especificados.
    *   Query parameters: `semana` (Int), `ano` (Int), `idSuperior` (Int)
*   **`POST /api/consolidation/trigger`**: Dispara manualmente a consolidação das demandas de todos os colaboradores e gera os relatórios executivos para seus respectivos superiores imediatos para fins de teste.
*   **Armazenamento Resiliente**: Visando contornar as restrições de DDL (`CREATE TABLE`) do usuário do banco Azure SQL, os relatórios gerados pela LLM são persistidos de forma segura no sistema de arquivos local do servidor Express, sob a pasta `server/data/consolidations/`, em formato Markdown estruturado (`{semana}-{ano}-{idSuperior}.md`).

### 4. Integração de IA (OpenRouter)
*   **`POST /api/chat`**: Rota para envio de mensagens e interação inteligente com a IA (OpenRouter).
    *   **Payload de Entrada**:
        *   `message` (String): Mensagem de texto enviada pelo usuário.
        *   `existingTasks` (Array): Lista de tarefas às quais o usuário logado tem permissão para visualizar, contendo título, status, responsável (`assigneeId` e `assigneeName`) e prazo.
        *   `currentUser` (Object): Objeto representando o perfil do colaborador atualmente logado, permitindo à LLM personificar e humanizar a interação pelo nome, além de filtrar regras de alteração de status por ID.
    *   **Formato de Retorno (JSON)**:
        *   `reply` (String): Resposta principal da IA estruturada em Markdown, humanizada, empática e amigável.
        *   `tarefas` (Array): Tarefas novas inéditas extraídas para confirmação e inclusão no painel.
        *   `suggestedActions` (Array): Ações interativas recomendadas de atualização de status de demandas existentes (gerando botões na interface de chat).

---

## ✉️ Notificações de E-mail (SMTP)

O backend utiliza a biblioteca `nodemailer` para disparar notificações automáticas por e-mail sempre que um superior (diretor ou gerente) adiciona um comentário a uma demanda.

As configurações de SMTP são parametrizadas no arquivo `.env`:
*   **`SMTP_HOST`**: Servidor de e-mail de saída (ex: `smtp.office365.com` ou `smtp.gmail.com`).
*   **`SMTP_PORT`**: Porta de conexão (ex: `587` para STARTTLS ou `465` para SMTPS/SSL).
*   **`SMTP_USER`**: Conta de e-mail utilizada para autenticação.
*   **`SMTP_PASS`**: Senha de aplicativo ou credencial de acesso da conta de e-mail.
*   **`SMTP_FROM`**: Remetente visível (ex: `"Notificações DemandFlow" <notificacoes@vibraresidencial.com.br>`).

### Fluxo de Disparo:
1. O superior envia um comentário para a demanda (`PUT /api/tasks/:id` preenchendo `ComentarioDiretor`).
2. O controlador `taskController.js` recupera as informações da demanda e o e-mail do colaborador associado (`task.Reporte.Usuario.Email`).
3. O backend resolve o nome do diretor que realizou a operação e aciona o serviço `emailService.js` de forma assíncrona para que a resposta HTTP do usuário não sofra latência de rede.
4. O colaborador recebe uma notificação formatada em HTML detalhando a demanda comentada, o status atual e o teor do comentário do gestor.

Se as credenciais SMTP não estiverem preenchidas no `.env`, o sistema exibe um aviso de contingência no console do servidor (`[Email Service] AVISO: SMTP não totalmente configurado`) e segue o fluxo de atualização normalmente, prevenindo crashes no banco ou na aplicação.

---

## 🔑 Fluxo de Autenticação Microsoft SSO (Frontend)

O fluxo de autenticação com a Microsoft (Entra ID) é implementado de forma segura e otimizada por meio da biblioteca oficial `@azure/msal-browser`. 

*   **Página de Redirecionamento dedicada (`/auth.html`)**: Em vez de carregar a aplicação React inteira no popup de login após o redirecionamento da Microsoft, o sistema utiliza o arquivo estático [auth.html](file:///d:/Reportes-Semanais-V2/public/auth.html).
*   **Orquestração local**: Para garantir o funcionamento em ambientes de intranet ou offline e evitar chamadas a servidores de terceiros, a biblioteca do MSAL ([msal-browser.min.js](file:///d:/Reportes-Semanais-V2/public/msal-browser.min.js)) e a ponte de redirecionamento do popup ([msal-redirect-bridge.min.js](file:///d:/Reportes-Semanais-V2/public/msal-redirect-bridge.min.js)) são servidas localmente a partir da pasta `/public` da aplicação.
*   **Comunicação entre janelas**:
    1. O popup é aberto pela aplicação principal e navega para o login da Microsoft.
    2. Após autenticar, a Microsoft redireciona o popup de volta para a página estática dedicada [auth.html](file:///d:/Reportes-Semanais-V2/public/auth.html).
    3. A página `auth.html` carrega a ponte do MSAL (`msal-redirect-bridge.min.js`) e chama a função `msalRedirectBridge.broadcastResponseToMainFrame()`.
    4. Essa função extrai o hash retornado na URL, envia-o de volta para a janela pai de forma segura utilizando um canal `BroadcastChannel` integrado e fecha a janela do popup de forma imediata. A janela pai então consome o token e completa o login.

