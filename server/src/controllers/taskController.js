import prisma from '../config/prisma.js';
import { sendEmailNotification } from '../services/emailService.js';

export async function getTasks(req, res) {
  const userId = req.query.IdUsuario ? parseInt(req.query.IdUsuario, 10) : null;
  const superiorId = req.query.IdSuperior ? parseInt(req.query.IdSuperior, 10) : null;
  try {
    const whereClause = {};

    if (userId) {
      whereClause.Reporte = { IdUsuario: userId };
    } else if (superiorId) {
      whereClause.Reporte = {
        Usuario: {
          Subordinados: {
            some: {
              IdSuperior: superiorId,
            },
          },
        },
      };
    }

    const tasks = await prisma.tarefaReportada.findMany({
      where: whereClause,
      include: {
        Reporte: {
          include: {
            Usuario: {
              include: {
                CargoRef: true,
                Subordinados: {
                  include: {
                    Superior: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { OrdemPrioridade: 'asc' },
        { IdTarefa: 'desc' },
      ],
    });

    const mapped = tasks.map((t) => ({
      IdTarefa: t.IdTarefa,
      DescricaoTarefa: t.DescricaoTarefa,
      StatusTarefa: t.StatusTarefa,
      ComentarioDiretor: t.ComentarioDiretor,
      DataComentario: t.DataComentario,
      DataRegistro: t.Reporte?.DataRegistro,
      FoiConsolidada: t.FoiConsolidada ? 1 : 0,
      OrdemPrioridade: t.OrdemPrioridade,
      Semana: t.Semana,
      Ano: t.Ano,
      NomeUsuario: t.Reporte?.Usuario?.Nome || null,
      IdUsuario: t.Reporte?.Usuario?.IdUsuario || null,
      Cargo: t.Reporte?.Usuario?.Cargo || null,
      DepartamentoUsuario: t.Reporte?.Usuario?.Departamento || null,
      NomeCargo: t.Reporte?.Usuario?.CargoRef?.Nome || null,
      NomeSuperior: t.Reporte?.Usuario?.Subordinados?.[0]?.Superior?.Nome || null,
      IdSuperior: t.Reporte?.Usuario?.Subordinados?.[0]?.Superior?.IdUsuario || null,
      ComentarioNotificado: t.ComentarioNotificado || false,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Erro ao carregar tarefas com Prisma:', error);
    res.status(500).json({ error: 'Erro ao carregar tarefas.' });
  }
}

export async function updateTask(req, res) {
  const { id } = req.params;
  const { DescricaoTarefa, StatusTarefa, ComentarioDiretor, OrdemPrioridade, ComentarioNotificado, IdUsuarioRequisitante } = req.body;
  try {
    const taskId = parseInt(id, 10);

    // Carrega a tarefa atual e suas relações para validação de regras de negócio
    const task = await prisma.tarefaReportada.findUnique({
      where: { IdTarefa: taskId },
      include: {
        Reporte: {
          include: {
            Usuario: {
              include: {
                Subordinados: true, // Registros onde este usuário é o subordinado
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const idCriador = task.Reporte.IdUsuario;
    const idSuperiorImediato = task.Reporte.Usuario.Subordinados?.[0]?.IdSuperior || null;
    const idRequisitanteInt = IdUsuarioRequisitante ? parseInt(IdUsuarioRequisitante, 10) : null;

    // Regra: Alteração de status e descrição só pode ser feita pelo criador da demanda
    if (DescricaoTarefa !== undefined || StatusTarefa !== undefined) {
      if (!idRequisitanteInt || idRequisitanteInt !== idCriador) {
        return res.status(403).json({ 
          error: 'Apenas o criador original da demanda pode alterar seus detalhes ou status.' 
        });
      }
    }

    // Regra: Alteração de prioridade só pode ser feita pelo criador ou pelo seu superior direto (líder)
    if (OrdemPrioridade !== undefined) {
      if (!idRequisitanteInt || (idRequisitanteInt !== idCriador && idRequisitanteInt !== idSuperiorImediato)) {
        return res.status(403).json({ 
          error: 'Apenas o criador original ou o superior direto podem alterar a prioridade da demanda.' 
        });
      }
    }

    // Regra: Alteração da flag de notificação só pode ser feita pelo criador da demanda (quem lê)
    if (ComentarioNotificado !== undefined) {
      if (!idRequisitanteInt || idRequisitanteInt !== idCriador) {
        return res.status(403).json({ 
          error: 'Apenas o responsável pela demanda pode marcar a notificação como lida.' 
        });
      }
    }

    // Regra: Comentários só podem ser feitos pelo superior imediato
    if (ComentarioDiretor !== undefined) {
      if (!idRequisitanteInt) {
        return res.status(403).json({ error: 'O ID do usuário requisitante é obrigatório para comentar.' });
      }
      if (idRequisitanteInt === idCriador) {
        return res.status(403).json({ error: 'Você não pode comentar na sua própria demanda.' });
      }
      if (!idSuperiorImediato || idRequisitanteInt !== idSuperiorImediato) {
        return res.status(403).json({ 
          error: 'Apenas o superior direto do colaborador responsável por esta demanda pode adicionar comentários.' 
        });
      }
    }

    const updateData = {};
    if (DescricaoTarefa !== undefined) updateData.DescricaoTarefa = DescricaoTarefa;
    if (StatusTarefa !== undefined) updateData.StatusTarefa = StatusTarefa;
    if (OrdemPrioridade !== undefined) updateData.OrdemPrioridade = OrdemPrioridade;
    if (ComentarioNotificado !== undefined) updateData.ComentarioNotificado = ComentarioNotificado;
    
    if (ComentarioDiretor !== undefined) {
      updateData.ComentarioDiretor = ComentarioDiretor;
      updateData.DataComentario = new Date();
      updateData.ComentarioNotificado = false; // Sempre que um novo comentário entra, zera o status de notificado
    }

    await prisma.tarefaReportada.update({
      where: { IdTarefa: taskId },
      data: updateData,
    });

    // Dispara e-mail de notificação se o diretor inseriu/atualizou o comentário
    if (ComentarioDiretor !== undefined && task.Reporte?.Usuario?.Email) {
      let directorName = 'Superior';
      if (idRequisitanteInt) {
        const director = await prisma.usuario.findUnique({
          where: { IdUsuario: idRequisitanteInt },
          select: { Nome: true }
        });
        if (director?.Nome) {
          directorName = director.Nome;
        }
      }

      sendEmailNotification(
        task.Reporte.Usuario.Email,
        task.Reporte.Usuario.Nome || 'Colaborador',
        task.DescricaoTarefa,
        task.StatusTarefa,
        ComentarioDiretor,
        directorName
      ).catch(err => {
        console.error('[Email Notification] Falha ao disparar e-mail:', err);
      });
    }

    res.json({ message: 'Tarefa atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar tarefa com Prisma:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
}

export async function createTask(req, res) {
  const { DescricaoTarefa, StatusTarefa, IdUsuario } = req.body;
  if (!DescricaoTarefa || !IdUsuario) {
    return res.status(400).json({ error: 'DescricaoTarefa e IdUsuario são obrigatórios.' });
  }

  try {
    const reporte = await prisma.reporte.create({
      data: {
        IdUsuario: parseInt(IdUsuario, 10),
        TextoOriginal: DescricaoTarefa,
        CanalOrigem: 'Web',
        FoiConsolidado: false,
      },
    });

    const task = await prisma.tarefaReportada.create({
      data: {
        IdReporte: reporte.IdReporte,
        DescricaoTarefa,
        StatusTarefa: StatusTarefa || 'Não Iniciado',
        FoiConsolidada: false,
        ComentarioNotificado: false,
        Semana: Math.ceil((new Date().getDate() + 1) / 7),
        Ano: new Date().getFullYear(),
      },
    });

    res.status(201).json({
      message: 'Tarefa reportada cadastrada com sucesso.',
      task: {
        IdTarefa: task.IdTarefa,
        IdReporte: task.IdReporte,
        DescricaoTarefa: task.DescricaoTarefa,
        StatusTarefa: task.StatusTarefa,
        DataRegistro: reporte.DataRegistro,
        IdUsuario: reporte.IdUsuario,
      },
    });
  } catch (error) {
    console.error('Erro ao cadastrar nova tarefa:', error);
    res.status(500).json({ error: 'Erro ao cadastrar nova tarefa no banco.' });
  }
}
