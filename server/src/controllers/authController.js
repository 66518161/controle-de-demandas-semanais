import prisma from '../config/prisma.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await prisma.usuario.findFirst({
      where: {
        Email: email,
      },
      include: {
        CargoRef: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    let isMatch = false;
    const isHash = user.Senha && (user.Senha.startsWith('$2a$') || user.Senha.startsWith('$2b$'));

    if (isHash) {
      isMatch = await bcrypt.compare(password, user.Senha);
    } else {
      isMatch = (user.Senha === password);
      // Se bateu no texto plano, migra transparente para hash no banco
      if (isMatch && password) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await prisma.usuario.update({
            where: { IdUsuario: user.IdUsuario },
            data: { Senha: hashedPassword }
          });
          console.log(`[Auth] Senha do usuário ${user.Email} migrada para hash com sucesso.`);
        } catch (migrationErr) {
          console.error('[Auth] Falha ao migrar senha para hash:', migrationErr);
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    res.json({
      message: 'Login realizado com sucesso.',
      user: {
        id: user.IdUsuario.toString(),
        name: user.Nome,
        email: user.Email,
        role: user.IdCargo === 3 ? 'director' : user.IdCargo === 2 ? 'manager' : 'analyst',
        microsoftId: user.MicrosoftID,
        adm: user.Adm === true,
      },
    });
  } catch (error) {
    console.error('Erro na autenticação do usuário:', error);
    res.status(500).json({ error: 'Erro interno ao processar a autenticação.' });
  }
}

export async function loginMicrosoft(req, res) {
  const { email, name, microsoftId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'O email da conta Microsoft é obrigatório.' });
  }

  try {
    // Busca usuário no banco pelo email
    let user = await prisma.usuario.findFirst({
      where: {
        Email: email,
      },
      include: {
        CargoRef: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Este e-mail corporativo não está cadastrado no sistema. Entre em contato com o administrador.'
      });
    }

    // Se o usuário ainda não tiver o MicrosoftID gravado, grava o id recebido
    if (!user.MicrosoftID && microsoftId) {
      user = await prisma.usuario.update({
        where: { IdUsuario: user.IdUsuario },
        data: { MicrosoftID: microsoftId },
        include: { CargoRef: true }
      });
    }

    res.json({
      message: 'SSO Microsoft realizado com sucesso.',
      user: {
        id: user.IdUsuario.toString(),
        name: user.Nome,
        email: user.Email,
        role: user.IdCargo === 3 ? 'director' : user.IdCargo === 2 ? 'manager' : 'analyst',
        microsoftId: user.MicrosoftID,
        adm: user.Adm === true,
      },
    });
  } catch (error) {
    console.error('Erro no login Microsoft SSO:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao processar o SSO Microsoft.' });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'O email é obrigatório.' });
  }

  try {
    const user = await prisma.usuario.findFirst({
      where: {
        Email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado com este e-mail.' });
    }

    // Gerar uma senha temporária aleatória de 10 caracteres contendo letras e números
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tempPassword = 'Vibra@';
    for (let i = 0; i < 4; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Criptografar a senha temporária antes de salvar no banco de dados
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Redefinir no banco de dados
    await prisma.usuario.update({
      where: { IdUsuario: user.IdUsuario },
      data: { Senha: hashedPassword },
    });

    // Disparar o e-mail de redefinição de forma assíncrona
    sendPasswordResetEmail(user.Email, user.Nome, tempPassword).catch(err => {
      console.error('[Email Reset] Falha ao disparar e-mail de redefinição:', err);
    });

    res.json({ message: 'Uma nova senha temporária foi enviada para o seu e-mail.' });
  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    res.status(500).json({ error: 'Erro interno ao processar a redefinição de senha.' });
  }
}
