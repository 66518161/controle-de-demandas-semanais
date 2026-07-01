import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const apiKey = process.env.LLM_API_KEY ? process.env.LLM_API_KEY.replace(/['"]/g, '') : null;
const apiUrl = (process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions').replace(/['"]/g, '');
const model = (process.env.LLM_MODEL || 'google/gemini-2.5-flash').replace(/['"]/g, '');

/**
 * Envia uma mensagem à LLM no OpenRouter para estruturar o reporte em formato JSON.
 * Retorna um objeto no formato { tarefas: Array<{ id: number|null, tarefa: string, status: string }> }.
 * 
 * @param {string} userMessage - O texto bruto do reporte do usuário.
 * @param {Array<Object>} existingTasks - Lista de tarefas pendentes atuais do colaborador [{ IdTarefa, DescricaoTarefa, StatusTarefa }].
 * @returns {Promise<{ tarefas: Array<{ id: number|null, tarefa: string, status: string }> }>}
 */
export async function processReportWithLLM(userMessage, existingTasks = [], currentUser = null) {
  if (!apiKey) {
    console.warn('AVISO: LLM_API_KEY não configurada. Utilizando modo de fallback mockado.');
    return simulateLLMResponse(userMessage, existingTasks);
  }

  const userName = currentUser?.name || 'Colaborador';
  const userRole = currentUser?.role || 'analyst';
  const userEmail = currentUser?.email || '';
  const userId = currentUser?.id || '';

  const systemPrompt = `Você é a IA assistente oficial do sistema "DemandFlow" (Controle de Demandas Semanais) da Diretoria Financeira.
O usuário atual logado com quem você está conversando é:
- Nome: ${userName}
- Cargo: ${userRole}
- E-mail: ${userEmail}
- ID do Usuário: ${userId}
- Administrador do Sistema: ${currentUser?.adm === true ? 'Sim' : 'Não'}
- Data Atual de Referência da Conversa: ${new Date().toLocaleDateString('pt-BR')} (use esta data para se orientar sobre termos temporais como "semana passada", "esta semana", "mês passado", etc.)

Aqui estão as demandas (tarefas) ativas e finalizadas cadastradas no banco de dados (Views v_TarefasPendentes e v_TarefasFinalizadas) às quais o usuário tem acesso legítimo:
${JSON.stringify(existingTasks || [])}

Sua missão é interagir com o usuário seguindo estas regras:

1. TOM DE VOZ E HUMANIZAÇÃO: Fale de forma simpática, natural e prestativa em português do Brasil. Trate o usuário pelo nome próprio de maneira amigável, mas **EVITE REPETIR SAUDAÇÕES DE BOAS-VINDAS** (como "Olá, Leandro! Que bom te ver por aqui!" ou "Tudo bem?") em cada resposta do chat. Se a conversa já foi iniciada ou o usuário fez uma pergunta direta, responda de forma objetiva e direta, sem introduções repetitivas.

2. ASSUNTOS DO SISTEMA: Responda apenas a perguntas e comandos relacionados ao gerenciamento de demandas, status de tarefas, relatórios de produtividade, consolidação de reportes semanais e controle de atividades da Diretoria Financeira. Se o usuário perguntar sobre receitas, piadas ou outros assuntos não relacionados a isso, responda de forma polida e amigável que você atua exclusivamente no suporte à gestão de demandas do DemandFlow.

3. LISTAR DEMANDAS E HISTÓRICOS: Se o usuário pedir para listar suas demandas ou as demandas de sua equipe (como "quais são minhas demandas?", "o que tenho pendente?", "mostre as tarefas", "o que meu time fez semana passada?"):
   - NUNCA envie texto corrido ou parágrafos longos.
   - Use exatamente o seguinte mapeamento de emojis de status:
     - ⚪ Não Iniciado
     - 🟡 Em Andamento
     - 🔴 Aguardando
     - 🟢 Concluído (ou Finalizado)
     - ❌ Cancelado
   
   - Se o usuário pedir para listar **suas próprias demandas** (sejam elas pendentes ou concluídas), utilize rigorosamente o seguinte modelo de exibição (com a quebra de linha por extenso para cada item e a data de registro ao final):
     
     Você tem [X] demandas [pendentes/concluídas] no momento. São elas:
     - **[Título da Demanda]** ([Emoji] [Status]) - Registrada em: [dataRegistro]
     - **[Título da Demanda]** ([Emoji] [Status]) - Registrada em: [dataRegistro]
     
     Se precisar de ajuda para organizar ou atualizar alguma delas, é só me dizer! 😊
   
   - Se o usuário pedir para listar as demandas da **equipe** dele, apresente-as agrupadas por colaborador de forma estruturada:
     👤 [Nome do Colaborador] ([Cargo])
     - **[Título da Demanda]** ([Emoji] [Status]) - Registrada em: [dataRegistro]
     - **[Título da Demanda]** ([Emoji] [Status]) - Registrada em: [dataRegistro]

4. RELATÓRIOS E RESUMOS GERENCIAIS/EXECUTIVOS: Se o usuário pedir um "relatório gerencial", "resumo executivo", "relatório consolidado de demandas" ou similar, você DEVE estruturar o campo "reply" rigorosamente de acordo com o seguinte modelo de visualização e cabeçalho:

# Resumo Executivo
## Relatório Executivo de Demandas Semanais
**Data: [Data Atual de Referência da Conversa por extenso, ex: 28 de Junho de 2026]**

### 1. Resumo Executivo
[Insira um parágrafo analítico de 2 a 3 linhas resumindo de forma executiva e humanizada o andamento das frentes da equipe na semana, destacando os principais avanços e urgências.]

### 2. Destaques de Entregas e Progresso
- **[Título do Projeto/Demanda]**: [Descrição curta do progresso de tarefas com status "Em Andamento" ou "concluido"/"Finalizado"]. **IMPORTANTE: Liste aqui todas as entregas concluídas da equipe para dar visibilidade ao trabalho finalizado!**
- **[Título do Projeto/Demanda]**: [Descrição...].

### 3. Alertas Importantes e Projetos Pendentes
- **[Título do Projeto/Demanda]**: [Descrição curta do que está "Aguardando" alinhamento ou "Não Iniciado", com sugestão ou recomendação rápida de ação].

### Detalhamento das Demandas por Colaborador
**IMPORTANTE: Para cada colaborador listado abaixo, você DEVE exibir todas as suas demandas ativas E concluídas/finalizadas que estão presentes no contexto do banco de dados, para que o relatório traga a visão completa de tudo o que foi entregue por ele na semana.**

👤 [Nome do Colaborador] ([Cargo do Colaborador])
- ⚪ [Título da Demanda] (Não Iniciado) - Registrada em: [dataRegistro]
- 🟡 [Título da Demanda] (Em Andamento) - Registrada em: [dataRegistro]
- 🔴 [Título da Demanda] (Aguardando) - Registrada em: [dataRegistro]
- 🟢 [Título da Demanda] (Concluído) - Registrada em: [dataRegistro]
- ❌ [Título da Demanda] (Cancelado) - Registrada em: [dataRegistro]

5. MUDANÇA DE STATUS E ATUALIZAÇÕES:
   - Se o usuário solicitar a alteração de status de alguma demanda específica (ex: "marcar tarefa X como concluída", "mudar status da tarefa Y para em andamento"):
     - Localize a tarefa correspondente na lista fornecida acima.
     - Verifique a permissão: a alteração de status de uma demanda só pode ser efetuada se ela for de propriedade do próprio usuário logado (onde "assigneeId" da tarefa seja igual ao "ID do Usuário" atual: "${userId}").
     - Se for permitida: descreva no campo "reply" (de forma amigável) que o usuário pode prosseguir e adicione uma ação no array "suggestedActions". A ação deve possuir exatamente esta estrutura:
       {"type": "update_status", "taskId": "ID_DA_TAREFA_DETECTADA", "taskTitle": "TÍTULO_DA_TAREFA", "currentStatus": "STATUS_ATUAL_DA_TAREFA"}
     - Se pertencer a outro usuário (assigneeId diferente de "${userId}"): responda de forma muito polida no campo "reply" informando que, por diretrizes de segurança, apenas o colaborador responsável/criador da demanda pode atualizar seu status. Não inclua a ação no array "suggestedActions".
   
   - Se o usuário solicitar a atualização de suas tarefas de forma genérica ou implícita (ex: "quero atualizar as tarefas pendentes", "preciso atualizar status", "atualizar minhas tarefas"):
     - Localize todas as demandas ativas/pendentes (com status diferente de "concluido" ou "cancelado") que pertencem ao próprio usuário logado (onde "assigneeId" é igual a "${userId}").
     - No campo "reply", responda de forma simpática e prestativa: "Com certeza, [Nome]! Aqui estão as suas demandas pendentes de hoje. Você pode mudar o status de qualquer uma delas clicando diretamente nos botões logo abaixo:" (ajuste conforme o tom amigável).
     - Para **CADA** uma dessas demandas detectadas pertencentes a ele, adicione um objeto de ação correspondente no array "suggestedActions" com a estrutura:
       {"type": "update_status", "taskId": "ID_DA_TAREFA", "taskTitle": "TÍTULO_DA_TAREFA", "currentStatus": "STATUS_ATUAL"}
       (Gere uma ação para cada uma para que a tela mostre os botões interativos de todas elas).

5. DUPLICIDADE E PREVENÇÃO DE TAREFAS:
   - Se o usuário pedir para adicionar ou relatar novas atividades (ex: "Fiz o relatório", "Adicione a tarefa: Testar deploy"), compare semanticamente a nova tarefa pretendida com as tarefas na lista fornecida acima.
   - Se a tarefa já parecer existir (significado idêntico ou muito semelhante):
     - **NÃO** a adicione no array "tarefas" (para evitar cadastros duplicados automáticos na tela).
     - No campo "reply", explique de forma muito simpática e humanizada que percebeu que essa demanda já está no sistema (mencionando o nome e o status atual da demanda existente) e pergunte se ele quer apenas atualizar o status dela ou se realmente deseja cadastrar uma nova duplicada.
     - Forneça a ação de atualização no array "suggestedActions" para que ele possa facilmente mudar o status caso queira.
   - Se a tarefa for realmente nova e inédita:
     - Adicione-a no array "tarefas" para que o usuário possa confirmar o cadastro de forma explícita.
     - Cada nova tarefa do array deve possuir exatamente a estrutura:
       {"id": null, "tarefa": "Descrição profissional", "status": "Não Iniciado" | "Em Andamento" | "Aguardando" | "Finalizado" | "Cancelado"}

FORMATO DE RETORNO EXIGIDO:
Você deve responder EXCLUSIVAMENTE com um objeto JSON válido. É PROIBIDO incluir qualquer texto fora do JSON ou usar formatação de bloco de código markdown (como \`\`\`json). Inicie diretamente com '{' e termine com '}'.
Estrutura do JSON esperado:
{
  "reply": "Sua resposta humanizada e explicativa em markdown.",
  "tarefas": [],
  "suggestedActions": []
}
`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/microsoft/botframework',
          'X-Title': 'Bot de Reportes Automáticos DF'
        },
        timeout: 20000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Nenhuma resposta retornada da LLM.');
    }

    let cleanContent = content.trim();
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
    }
    const result = JSON.parse(cleanContent);
    
    return {
      reply: result.reply || '',
      tarefas: result.tarefas || [],
      suggestedActions: result.suggestedActions || []
    };
  } catch (error) {
    console.error('Erro na chamada da LLM via OpenRouter:', error.message);
    if (error.response?.data) {
      console.error('Dados de erro do OpenRouter:', JSON.stringify(error.response.data));
    }
    console.log('Executando fallback simulado devido a erro na LLM.');
    return simulateLLMResponse(userMessage, existingTasks);
  }
}

/**
 * Solicita à LLM a geração de um relatório executivo consolidado com base nos reportes coletados na semana.
 * 
 * @param {Array<Object>} reports - Lista de reportes contendo { nome, cargo, demandas, status, data }
 * @returns {Promise<string>} O texto do relatório executivo gerado.
 */
export async function generateWeeklyExecutiveReport(reports) {
  if (reports.length === 0) {
    return 'Não foram registrados reportes de colaboradores durante a última semana.';
  }

  if (!apiKey) {
    console.warn('AVISO: LLM_API_KEY não configurada. Gerando relatório simulado local.');
    return simulateExecutiveReport(reports);
  }

  const formattedReports = reports.map((r, i) => 
    `[${i+1}] Colaborador: ${r.nome} (${r.cargo || 'Setor: ' + r.setor})
    - Data: ${new Date(r.data_registro).toLocaleDateString('pt-BR')}
    - Status: ${r.status}
    - Demandas: ${r.demandas}`
  ).join('\n\n');

  const systemPrompt = `Você é um gestor executivo sênior. 
Abaixo está a lista contendo todos os reportes de atividades e demandas enviados pelos colaboradores durante a última semana.
Sua tarefa é analisar esses dados brutos e consolidar tudo em um único "Relatório Executivo de Demandas Semanais" de alto nível.
O relatório deve conter:
1. Um resumo executivo curto sobre o progresso geral do time.
2. Destaques de entregas concluídas.
3. Alertas importantes sobre impedimentos ou projetos pendentes.
4. Formatação limpa, profissional e organizada, ideal para leitura rápida de diretores. Use tópicos claros.
Retorne apenas o texto final formatado do relatório, sem comentários meta ou notas de desenvolvimento.`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Abaixo estão os reportes consolidados dos últimos 7 dias:\n\n${formattedReports}` }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/microsoft/botframework',
          'X-Title': 'Bot de Reportes Automáticos DF'
        },
        timeout: 30000
      }
    );

    const reportText = response.data?.choices?.[0]?.message?.content;
    if (!reportText) {
      throw new Error('Nenhum texto de relatório retornado da LLM.');
    }

    return reportText;
  } catch (error) {
    console.error('Erro ao gerar relatório executivo consolidado via OpenRouter:', error.message);
    return simulateExecutiveReport(reports);
  }
}

/**
 * Função de fallback simulado para estruturação de reportes (Cenário de contingência).
 */
function simulateLLMResponse(userMessage, existingTasks = []) {
  console.log(`[LLM MOCK] Simulando parsing para: "${userMessage}"`);
  
  const tasksRaw = userMessage.split(/[,.;]|\be\b/i).map(t => t.trim()).filter(Boolean);
  const tarefas = [];

  for (const t of tasksRaw) {
    let status = 'Em Andamento';
    const textLower = t.toLowerCase();
    
    if (textLower.includes('conclui') || textLower.includes('feite') || textLower.includes('entregue') || textLower.includes('pronto') || textLower.includes('finalizado') || textLower.includes('lavei') || textLower.includes('passei')) {
      status = 'Finalizado';
    } else if (textLower.includes('cancel') || textLower.includes('abort') || textLower.includes('suspend') || textLower.includes('desist')) {
      status = 'Cancelado';
    } else if (textLower.includes('travado') || textLower.includes('imped') || textLower.includes('erro') || textLower.includes('ajuda') || textLower.includes('aguardando') || textLower.includes('esperando')) {
      status = 'Aguardando';
    } else if (textLower.includes('planej') || textLower.includes('vou fazer') || textLower.includes('iniciar') || textLower.includes('comecar') || textLower.includes('não iniciado') || textLower.includes('nao iniciado') || textLower.includes('amanha') || textLower.includes('depois')) {
      status = 'Não Iniciado';
    }
    
    const tarefaFormatada = t.charAt(0).toUpperCase() + t.slice(1);
    
    let matchedId = null;
    const match = existingTasks.find(et => {
      const desc = (et.DescricaoTarefa || et.tarefa || '').toLowerCase();
      return desc.includes(textLower) || textLower.includes(desc);
    });
    if (match) {
      matchedId = match.IdTarefa || match.id || null;
    }

    tarefas.push({
      id: matchedId,
      tarefa: match ? (match.DescricaoTarefa || match.tarefa) : tarefaFormatada,
      status: status
    });
  }

  return {
    reply: `[Modo Offline] Processado com sucesso localmente. Identifiquei as seguintes atividades: ${tarefas.map((t) => `"${t.tarefa}" (${t.status})`).join(', ')}.`,
    tarefas,
    suggestedActions: []
  };
}

/**
 * Função de fallback simulado para o relatório executivo (Cenário de contingência).
 */
function simulateExecutiveReport(reports) {
  let report = '### Relatório Executivo Consolidado Semanal (Simulado/Contingência)\n\n';
  report += `**Período:** Últimos 7 dias | **Total de Reportes:** ${reports.length}\n\n`;
  report += '#### 1. Resumo Operacional\n';
  report += `O time enviou um total de ${reports.length} reportes de atividades. A maioria das demandas encontra-se no estado ativo ou concluído.\n\n`;
  
  report += '#### 2. Destaques de Entregas por Colaborador\n';
  reports.forEach(r => {
    report += `- **${r.nome}** (${r.cargo || 'Colaborador'}): ${r.demandas} (Status: *${r.status}*)\n`;
  });
  
  report += '\n#### 3. Impedimentos / Pontos de Atenção\n';
  const impedidos = reports.filter(r => r.status === 'Impedimento');
  if (impedidos.length > 0) {
    report += `Alerta: Existem ${impedidos.length} colaborador(es) com impedimentos reportados:\n`;
    impedidos.forEach(r => {
      report += `- **${r.nome}**: Relatou dificuldades em suas tarefas listadas.\n`;
    });
  } else {
    report += '- Nenhum impedimento crítico reportado nesta semana.\n';
  }

  return report;
}

/**
 * Gera o Relatório Executivo de Consolidação Semanal para um superior
 * com base no agrupamento de tarefas dos seus liderados.
 */
export async function generateWeeklyConsolidation(semana, ano, groupedData) {
  if (Object.keys(groupedData).length === 0) {
    return `# Relatório Executivo de Demandas Semanais\n**Período:** Semana ${semana}/${ano}\n\n### 1. Resumo Executivo\nNão foram registradas demandas por colaboradores da equipe na Semana ${semana}/${ano}.`;
  }

  if (!apiKey) {
    console.warn('AVISO: LLM_API_KEY não configurada. Gerando consolidação simulada.');
    return simulateWeeklyConsolidation(semana, ano, groupedData);
  }

  // Formata o input para a LLM
  let formattedInput = `Período: Semana ${semana}/${ano}\n\nDemandas por colaborador:\n`;
  for (const userId in groupedData) {
    const col = groupedData[userId];
    formattedInput += `\n👤 ${col.nome} (${col.cargo || 'Colaborador'})\n`;
    col.tarefas.forEach(t => {
      formattedInput += `- ${t.descricao} (Status: ${t.status}, Prioridade: ${t.prioridade})\n`;
    });
  }

  const systemPrompt = `Você é um gestor sênior executivo. Sua tarefa é analisar a lista de demandas semanais enviadas pela equipe e gerar um "Relatório Executivo de Demandas Semanais" de alto nível.
Siga rigorosamente esta estrutura de seções, contendo exatamente estes títulos markdown:

# Relatório Executivo de Demandas Semanais
**Período:** Semana ${semana}/${ano}

### 1. Resumo Executivo
[Um parágrafo de 3-4 linhas resumindo o foco principal das demandas do time, a maturidade geral do progresso e se as entregas estão no rumo certo.]

### 2. Destaques de Entregas Concluídas
[Liste em tópicos os principais projetos e atividades concluídos/finalizados pela equipe com seus responsáveis. Se não houver entregas finalizadas, escreva "Não houve entregas concluídas reportadas para o período."]

### 3. Alertas Importantes
[Liste os principais pontos de atenção, tarefas travadas ou em "Aguardando", riscos de prazo, ou acúmulo de atividades em "Não Iniciado" por algum colaborador específico.]

### Detalhamento das Demandas por Colaborador
[Gere a lista detalhada de colaboradores e suas demandas conforme o formato abaixo. Use os seguintes emojis para os status das tarefas:
- ⚪ para "Não Iniciado"
- 🟡 para "Em Andamento"
- 🔴 para "Aguardando"
- 🟢 para "Finalizado"
- ⚫ para "Cancelado"

Exemplo de formato para o detalhamento:
👤 Nome do Colaborador (Cargo)
⚪ Descrição da tarefa (Não Iniciado)
🟢 Descrição de outra tarefa (Finalizado)
]

Regras importantes:
- Retorne exclusivamente o relatório formatado em markdown.
- Não inclua saudações, observações de IA ou blocos de código markdown adicionais (como \`\`\`markdown).`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formattedInput }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/microsoft/botframework',
          'X-Title': 'Bot de Reportes Automáticos DF'
        },
        timeout: 35000
      }
    );

    const reportText = response.data?.choices?.[0]?.message?.content;
    if (!reportText) {
      throw new Error('Nenhum texto retornado da LLM.');
    }

    return reportText;
  } catch (error) {
    console.error('Erro ao gerar consolidação semanal via LLM:', error.message);
    return simulateWeeklyConsolidation(semana, ano, groupedData);
  }
}

function simulateWeeklyConsolidation(semana, ano, groupedData) {
  let report = `# Relatório Executivo de Demandas Semanais (Simulado)\n`;
  report += `**Período:** Semana ${semana}/${ano}\n\n`;
  report += `### 1. Resumo Executivo\n`;
  report += `O time reportou demandas com foco operacional em andamento e planejamento de novas entregas. O monitoramento contínuo é necessário para assegurar o cumprimento dos prazos.\n\n`;
  
  report += `### 2. Destaques de Entregas Concluídas\n`;
  const concluidas = [];
  for (const uid in groupedData) {
    const col = groupedData[uid];
    col.tarefas.forEach(t => {
      if (t.status.toLowerCase().includes('finaliz') || t.status.toLowerCase().includes('concluid')) {
        concluidas.push(`- **${col.nome}** (${col.cargo}): ${t.descricao}`);
      }
    });
  }
  if (concluidas.length > 0) {
    report += concluidas.join('\n') + '\n\n';
  } else {
    report += `Não houve entregas concluídas reportadas para o período.\n\n`;
  }

  report += `### 3. Alertas Importantes\n`;
  const pendentes = [];
  for (const uid in groupedData) {
    const col = groupedData[uid];
    col.tarefas.forEach(t => {
      if (t.status.toLowerCase().includes('inici') || t.status.toLowerCase().includes('aguard')) {
        pendentes.push(`- **${col.nome}** tem atividade em status *${t.status}*: ${t.descricao}`);
      }
    });
  }
  if (pendentes.length > 0) {
    report += pendentes.slice(0, 3).join('\n') + '\n\n';
  } else {
    report += `Nenhum alerta crítico reportado para o período.\n\n`;
  }

  report += `### Detalhamento das Demandas por Colaborador\n`;
  for (const uid in groupedData) {
    const col = groupedData[uid];
    report += `👤 ${col.nome} (${col.cargo || 'Colaborador'})\n`;
    col.tarefas.forEach(t => {
      let emoji = '⚪';
      const st = t.status.toLowerCase();
      if (st.includes('final') || st.includes('concl')) emoji = '🟢';
      else if (st.includes('andam') || st.includes('prog')) emoji = '🟡';
      else if (st.includes('aguard') || st.includes('esper')) emoji = '🔴';
      else if (st.includes('cancel')) emoji = '⚫';
      report += `${emoji} ${t.descricao} (${t.status})\n`;
    });
    report += `\n`;
  }

  return report;
}
