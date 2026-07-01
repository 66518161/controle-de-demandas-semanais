import prisma from '../config/prisma.js';
import { processReportWithLLM } from '../services/llmService.js';

// Helper recursivo para buscar todos os subordinados imediatos e indiretos do usuário
async function getSubordinateIdsRecursive(userId) {
  const subs = await prisma.hierarquiaReporte.findMany({
    where: { IdSuperior: userId },
    select: { IdColaborador: true }
  });
  
  let ids = subs.map(s => s.IdColaborador);
  for (const id of ids) {
    const subIds = await getSubordinateIdsRecursive(id);
    ids = ids.concat(subIds);
  }
  return ids;
}

// Helper para converter Status do Banco para Status do Frontend
const mapDbStatusToFrontend = (status) => {
  const s = status ? status.toLowerCase() : '';
  if (s.includes('concluid') || s.includes('finaliz')) return 'concluido';
  if (s.includes('andament') || s.includes('progresso')) return 'em-andamento';
  if (s.includes('aguard') || s.includes('esper') || s.includes('pend')) return 'aguardando';
  if (s.includes('cancel')) return 'cancelado';
  return 'nao-iniciado';
};

export async function processChat(req, res) {
  const { message, currentUser } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'O campo message é obrigatório.' });
  }

  try {
    const currentUserId = currentUser?.id ? parseInt(currentUser.id, 10) : null;
    let allowedTasks = [];

    if (currentUserId) {
      // 1. Obter a lista completa de IDs da equipe (se houver subordinados)
      const subordinateIds = await getSubordinateIdsRecursive(currentUserId);
      const userIdsToQuery = [currentUserId, ...subordinateIds];

      // 2. Consultar as Views de tarefas ativas e concluídas no banco
      const [pendingTasks, finalizedTasks] = await Promise.all([
        prisma.v_TarefasPendentes.findMany({
          where: { IdUsuario: { in: userIdsToQuery } }
        }),
        prisma.v_TarefasFinalizadas.findMany({
          where: { IdUsuario: { in: userIdsToQuery } }
        })
      ]);

      // 3. Mapear as demandas unificando para o formato esperado pelo prompt da LLM
      const mapDbTaskToContext = (t, isPending) => ({
        id: String(t.IdTarefa),
        title: t.DescricaoTarefa,
        status: mapDbStatusToFrontend(t.StatusTarefa),
        assigneeName: t.NomeUsuario || 'Desconhecido',
        assigneeEmail: t.EmailUsuario || '',
        assigneeId: String(t.IdUsuario),
        dueDate: t.DataRegistro ? t.DataRegistro.toISOString().split('T')[0] : null,
        dataRegistro: t.DataRegistro ? t.DataRegistro.toISOString().split('T')[0] : null
      });

      allowedTasks = [
        ...pendingTasks.map(t => mapDbTaskToContext(t, true)),
        ...finalizedTasks.map(t => mapDbTaskToContext(t, false))
      ];
    }

    const result = await processReportWithLLM(message, allowedTasks, currentUser);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar chat com LLM:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem com a inteligência artificial.' });
  }
}
