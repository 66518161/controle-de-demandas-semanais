import { PrismaClient } from '@prisma/client';
import { generateWeeklyConsolidation } from '../services/llmService.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const CONSOLIDATION_DIR = path.resolve(process.cwd(), 'data/consolidations');

// Garante que a pasta exista
async function ensureDirExists() {
  try {
    await fs.mkdir(CONSOLIDATION_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Erro ao criar diretório de consolidações:', err);
    }
  }
}

// Função recursiva para obter os subordinados diretos e indiretos de um superior
async function getSubordinatesRecursive(superiorId) {
  const allRelations = await prisma.hierarquiaReporte.findMany();
  const subordinates = [];
  
  function recurse(id) {
    const direct = allRelations.filter(r => r.IdSuperior === id).map(r => r.IdColaborador);
    for (const subId of direct) {
      if (!subordinates.includes(subId)) {
        subordinates.push(subId);
        recurse(subId);
      }
    }
  }
  
  recurse(superiorId);
  return subordinates;
}

/**
 * Executa a consolidação semanal para todos os superiores do sistema para a semana/ano fornecidos
 */
export async function runWeeklyConsolidationForWeek(semana, ano, targetSuperiorId) {
  await ensureDirExists();

  let superioresIds = [];
  if (targetSuperiorId) {
    superioresIds = [parseInt(targetSuperiorId, 10)];
  } else {
    const relationSuperiores = await prisma.hierarquiaReporte.findMany({
      select: { IdSuperior: true },
      distinct: ['IdSuperior']
    });
    superioresIds = relationSuperiores.map(r => r.IdSuperior);
  }
  const results = [];

  for (const superiorId of superioresIds) {
    const subordinates = await getSubordinatesRecursive(superiorId);
    if (subordinates.length === 0) continue;

    // Busca todas as tarefas dos subordinados nesta semana/ano
    const tasks = await prisma.tarefaReportada.findMany({
      where: {
        Semana: semana,
        Ano: ano,
        Reporte: {
          IdUsuario: { in: subordinates }
        }
      },
      include: {
        Reporte: {
          include: {
            Usuario: {
              include: {
                CargoRef: true
              }
            }
          }
        }
      }
    });

    const groupedData = {};
    tasks.forEach(t => {
      const user = t.Reporte.Usuario;
      if (!groupedData[user.IdUsuario]) {
        groupedData[user.IdUsuario] = {
          nome: user.Nome,
          cargo: user.CargoRef?.Nome || user.Cargo,
          tarefas: []
        };
      }
      groupedData[user.IdUsuario].tarefas.push({
        descricao: t.DescricaoTarefa,
        status: t.StatusTarefa,
        prioridade: t.OrdemPrioridade === 1 ? 'Alta' : t.OrdemPrioridade === 2 ? 'Média' : 'Baixa'
      });
    });

    // Solicita a consolidação ao serviço de LLM
    const reportText = await generateWeeklyConsolidation(semana, ano, groupedData);

    // Salva o relatório no sistema de arquivos local
    const filePath = path.join(CONSOLIDATION_DIR, `${semana}-${ano}-${superiorId}.md`);
    await fs.writeFile(filePath, reportText, 'utf8');

    results.push({ idSuperior: superiorId, success: true });
  }

  return results;
}

/**
 * Lê o relatório consolidado gerado para o superior
 */
export async function getConsolidation(req, res) {
  const { semana, ano, idSuperior } = req.query;

  if (!semana || !ano || !idSuperior) {
    return res.status(400).json({ error: 'Semana, ano e idSuperior são parâmetros obrigatórios.' });
  }

  try {
    await ensureDirExists();
    const filePath = path.join(CONSOLIDATION_DIR, `${semana}-${ano}-${idSuperior}.md`);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      res.json({ Relatorio: content });
    } catch (readErr) {
      if (readErr.code === 'ENOENT') {
        return res.json({ Relatorio: null });
      }
      throw readErr;
    }
  } catch (error) {
    console.error('Erro ao ler consolidação semanal local:', error);
    res.status(500).json({ error: 'Erro ao carregar a consolidação semanal.' });
  }
}

/**
 * Dispara manualmente a consolidação de demandas
 */
export async function triggerConsolidation(req, res) {
  const { semana, ano, idSuperior } = req.body;

  try {
    const now = new Date();
    function getISOWeek(date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    const semValue = semana ? parseInt(semana, 10) : getISOWeek(now);
    const anoValue = ano ? parseInt(ano, 10) : now.getFullYear();

    await runWeeklyConsolidationForWeek(semValue, anoValue, idSuperior);

    res.json({ message: `Consolidação executada com sucesso para a Semana ${semValue}/${anoValue}.` });
  } catch (error) {
    console.error('Erro ao disparar consolidação manual:', error);
    res.status(500).json({ error: 'Erro ao disparar consolidação manual.' });
  }
}
