import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

export async function getUsers(req, res) {
  try {
    const users = await prisma.usuario.findMany({
      include: {
        CargoRef: true,
        Subordinados: {
          select: {
            IdSuperior: true,
          },
        },
      },
      orderBy: {
        Nome: 'asc',
      },
    });

    // Mapeamento mantendo compatibilidade
    const mapped = users.map((u) => ({
      IdUsuario: u.IdUsuario,
      Nome: u.Nome,
      MicrosoftID: u.MicrosoftID,
      TeamsID: u.TeamsID,
      Telefone: u.Telefone,
      Cargo: u.Cargo,
      IdCargo: u.IdCargo,
      Status: u.Status,
      DataCadastro: u.DataCadastro,
      ConversationID: u.ConversationID,
      Email: u.Email,
      Departamento: u.Departamento,
      NomeCargo: u.CargoRef?.Nome || null,
      IdSuperior: u.Subordinados[0]?.IdSuperior || null,
      Adm: u.Adm,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Erro ao listar usuários com Prisma:', error);
    res.status(500).json({ error: 'Erro ao carregar usuários.' });
  }
}

export async function createUser(req, res) {
  const { Nome, Email, IdCargo, Status, Departamento, Senha, MicrosoftID, TeamsID, Telefone, Adm } = req.body;
  if (!Nome || !Email) {
    return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  }
  try {
    let finalPassword = Senha || null;
    if (Senha) {
      const salt = await bcrypt.genSalt(10);
      finalPassword = await bcrypt.hash(Senha, salt);
    }

    const user = await prisma.usuario.create({
      data: {
        Nome,
        Email,
        IdCargo: IdCargo ? parseInt(IdCargo, 10) : 1,
        Status: Status || 'Ativo',
        Departamento: Departamento || null,
        Senha: finalPassword,
        MicrosoftID: MicrosoftID || null,
        TeamsID: TeamsID || null,
        Telefone: Telefone || null,
        Adm: Adm === true || Adm === 'true' || Adm === 1,
      },
    });
    res.status(201).json({ message: 'Usuário cadastrado com sucesso.', IdUsuario: user.IdUsuario });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { Nome, Email, IdCargo, Status, Departamento, Senha, MicrosoftID, TeamsID, Telefone, Adm } = req.body;
  try {
    let finalPassword = Senha;
    if (Senha) {
      const salt = await bcrypt.genSalt(10);
      finalPassword = await bcrypt.hash(Senha, salt);
    }

    await prisma.usuario.update({
      where: { IdUsuario: parseInt(id, 10) },
      data: {
        Nome,
        Email,
        IdCargo: IdCargo ? parseInt(IdCargo, 10) : undefined,
        Status,
        Departamento: Departamento || undefined,
        Senha: finalPassword || undefined,
        MicrosoftID: MicrosoftID || undefined,
        TeamsID: TeamsID || undefined,
        Telefone: Telefone || undefined,
        Adm: Adm !== undefined ? (Adm === true || Adm === 'true' || Adm === 1) : undefined,
      },
    });
    res.json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await prisma.usuario.delete({
      where: { IdUsuario: parseInt(id, 10) },
    });
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
}
