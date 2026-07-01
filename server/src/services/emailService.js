import nodemailer from 'nodemailer';

/**
 * Envia uma notificação por e-mail para o colaborador informando sobre um novo comentário do diretor.
 * 
 * @param {string} toEmail - E-mail do colaborador.
 * @param {string} collaboratorName - Nome do colaborador.
 * @param {string} taskTitle - Título da tarefa.
 * @param {string} taskStatus - Status da tarefa.
 * @param {string} commentText - Texto do comentário feito.
 * @param {string} directorName - Nome do diretor que comentou.
 */
export async function sendEmailNotification(toEmail, collaboratorName, taskTitle, taskStatus, commentText, directorName) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || user || 'notificacoes@demandflow.com.br';
  if (from && !from.includes('<')) {
    from = `"DemandFlow" <${from}>`;
  }
  const replyTo = process.env.SMTP_REPLY_TO || 'noreplay@gruponortis.com.br';

  if (!host || !user || !pass) {
    console.warn('[Email Service] AVISO: SMTP não totalmente configurado no .env. E-mail simulado no log:', {
      para: toEmail,
      colaborador: collaboratorName,
      demanda: taskTitle,
      status: taskStatus,
      comentario: commentText,
      diretor: directorName
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from,
    to: toEmail,
    replyTo,
    subject: `[DemandFlow] Novo comentário de ${directorName} em sua demanda`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Olá, ${collaboratorName}!</h2>
        <p style="color: #4b5563; font-size: 16px;">O diretor/superior <strong>${directorName}</strong> adicionou um comentário à sua demanda no sistema <strong>DemandFlow</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Demanda:</strong> ${taskTitle}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Status Atual:</strong> ${taskStatus}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 12px 0;">
          <p style="margin: 0; font-size: 14px; color: #1e293b; font-style: italic;"><strong>Comentário do Diretor:</strong> "${commentText}"</p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; margin-bottom: 0;">Você pode acessar o portal e verificar os detalhes respondendo ao comentário se necessário.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 10px; text-align: center;">Este é um e-mail de notificação automática do sistema DemandFlow. Não responda diretamente a este e-mail.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] E-mail enviado com sucesso para ${toEmail}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Service] Erro ao enviar e-mail para ${toEmail}:`, error.message);
    throw error;
  }
}

/**
 * Envia uma senha temporária por e-mail para redefinição de acesso.
 * 
 * @param {string} toEmail - E-mail do usuário.
 * @param {string} userName - Nome do usuário.
 * @param {string} tempPassword - Senha temporária gerada.
 */
export async function sendPasswordResetEmail(toEmail, userName, tempPassword) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || user || 'notificacoes@demandflow.com.br';
  if (from && !from.includes('<')) {
    from = `"DemandFlow" <${from}>`;
  }
  const replyTo = process.env.SMTP_REPLY_TO || 'noreplay@gruponortis.com.br';

  if (!host || !user || !pass) {
    console.warn('[Email Service] AVISO: SMTP não configurado. E-mail de reset simulado:', {
      para: toEmail,
      nome: userName,
      senhaTemporaria: tempPassword
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from,
    to: toEmail,
    replyTo,
    subject: '[DemandFlow] Redefinição de Senha',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Olá, ${userName}!</h2>
        <p style="color: #4b5563; font-size: 16px;">Você solicitou a redefinição de senha para a sua conta no sistema <strong>DemandFlow</strong>.</p>
        
        <p style="color: #4b5563; font-size: 16px;">Sua nova senha temporária de acesso é:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; border: 1px dashed #3b82f6;">
          <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px;">${tempPassword}</span>
        </div>
        
        <p style="color: #dc2626; font-size: 14px; font-weight: 500;">Recomendamos fazer login e alterar essa senha temporária no seu perfil assim que acessar o sistema.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; border-top: 1px solid #f3f4f6; padding-top: 10px; text-align: center;">Este é um e-mail de notificação automática do sistema DemandFlow. Não responda diretamente a este e-mail.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] E-mail de redefinição enviado para ${toEmail}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Service] Erro ao enviar e-mail de redefinição para ${toEmail}:`, error.message);
    throw error;
  }
}
