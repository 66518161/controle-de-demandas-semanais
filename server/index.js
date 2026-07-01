import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { executeQuery } from './db.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
  console.log(`[Backend API] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', timestamp: new Date().toISOString() });
});

// Listar todos os usuários
app.get('/api/users', async (req, res) => {
  try {
    const query = `
      SELECT u.IdUsuario, u.Nome, u.MicrosoftID, u.TeamsID, u.Telefone, u.Cargo, u.IdCargo, u.Status, u.DataCadastro, u.ConversationID, u.Email, u.Departamento, c.Nome AS NomeCargo, h.IdSuperior
      FROM Usuarios u
      LEFT JOIN Cargos c ON u.IdCargo = c.IdCargo
      LEFT JOIN HierarquiaReporte h ON u.IdUsuario = h.IdColaborador
      ORDER BY u.Nome ASC
    `;
    const result = await executeQuery(query);
    res.json(result.recordset || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários do banco de dados.' });
  }
});

// Criar novo usuário
app.post('/api/users', async (req, res) => {
  const { Nome, Email, IdCargo, Status, Departamento, Senha, MicrosoftID, TeamsID, Telefone } = req.body;
  if (!Nome || !Email) {
    return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  }
  try {
    const query = `
      INSERT INTO Usuarios (Nome, Email, IdCargo, Status, Departamento, Senha, MicrosoftID, TeamsID, Telefone)
      OUTPUT INSERTED.IdUsuario
      VALUES (@Nome, @Email, @IdCargo, @Status, @Departamento, @Senha, @MicrosoftID, @TeamsID, @Telefone)
    `;
    const result = await executeQuery(query, {
      Nome,
      Email,
      IdCargo: IdCargo ? parseInt(IdCargo, 10) : 1,
      Status: Status || 'Ativo',
      Departamento: Departamento || null,
      Senha: Senha || null,
      MicrosoftID: MicrosoftID || null,
      TeamsID: TeamsID || null,
      Telefone: Telefone || null
    });
    res.status(201).json({ message: 'Usuário cadastrado com sucesso.', IdUsuario: result.recordset[0].IdUsuario });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// Atualizar usuário
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { Nome, Email, IdCargo, Status, Departamento, Senha, MicrosoftID, TeamsID, Telefone } = req.body;
  try {
    const query = `
      UPDATE Usuarios
      SET Nome = @Nome, Email = @Email, IdCargo = @IdCargo, Status = @Status, 
          Departamento = @Departamento, Senha = @Senha, MicrosoftID = @MicrosoftID, 
          TeamsID = @TeamsID, Telefone = @Telefone
      WHERE IdUsuario = @IdUsuario
    `;
    await executeQuery(query, {
      IdUsuario: parseInt(id, 10),
      Nome,
      Email,
      IdCargo: IdCargo ? parseInt(IdCargo, 10) : 1,
      Status,
      Departamento: Departamento || null,
      Senha: Senha || null,
      MicrosoftID: MicrosoftID || null,
      TeamsID: TeamsID || null,
      Telefone: Telefone || null
    });
    res.json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// Excluir usuário
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `DELETE FROM Usuarios WHERE IdUsuario = @IdUsuario`;
    await executeQuery(query, { IdUsuario: parseInt(id, 10) });
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// Listar todas as tarefas/demandas
app.get('/api/tasks', async (req, res) => {
  const userId = req.query.IdUsuario ? parseInt(req.query.IdUsuario, 10) : null;
  const superiorId = req.query.IdSuperior ? parseInt(req.query.IdSuperior, 10) : null;
  try {
    let query = `
      SELECT t.IdTarefa, t.DescricaoTarefa, t.StatusTarefa, t.ComentarioDiretor, t.DataComentario, r.DataRegistro, t.FoiConsolidada, t.OrdemPrioridade, t.Semana, t.Ano, u.Nome AS NomeUsuario, u.IdUsuario, u.Cargo AS Cargo, u.Departamento AS DepartamentoUsuario, c.Nome AS NomeCargo
      FROM TarefasReportadas t
      INNER JOIN Reportes r ON t.IdReporte = r.IdReporte
      INNER JOIN Usuarios u ON r.IdUsuario = u.IdUsuario
      LEFT JOIN Cargos c ON u.IdCargo = c.IdCargo
    `;
    const params = {};
    if (userId) {
      query += ` WHERE u.IdUsuario = @userId`;
      params.userId = userId;
    } else if (superiorId) {
      query += ` WHERE u.IdUsuario IN (SELECT IdColaborador FROM HierarquiaReporte WHERE IdSuperior = @superiorId)`;
      params.superiorId = superiorId;
    }
    query += ` ORDER BY CASE WHEN t.OrdemPrioridade IS NULL THEN 999999 ELSE t.OrdemPrioridade END ASC, t.IdTarefa DESC`;
    const result = await executeQuery(query, params);
    res.json(result.recordset || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar tarefas.' });
  }
});

// Atualizar tarefa
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { DescricaoTarefa, StatusTarefa, ComentarioDiretor } = req.body;
  try {
    const fields = [];
    const params = { IdTarefa: parseInt(id, 10) };
    if (DescricaoTarefa !== undefined) {
      fields.push('DescricaoTarefa = @DescricaoTarefa');
      params.DescricaoTarefa = DescricaoTarefa;
    }
    if (StatusTarefa !== undefined) {
      fields.push('StatusTarefa = @StatusTarefa');
      params.StatusTarefa = StatusTarefa;
    }
    if (ComentarioDiretor !== undefined) {
      fields.push('ComentarioDiretor = @ComentarioDiretor');
      fields.push('DataComentario = GETDATE()');
      params.ComentarioDiretor = ComentarioDiretor;
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
    }
    const query = `UPDATE TarefasReportadas SET ${fields.join(', ')} WHERE IdTarefa = @IdTarefa`;
    await executeQuery(query, params);
    res.json({ message: 'Tarefa atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[Backend API] Servidor rodando na porta ${PORT}`);
});
