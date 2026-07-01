import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const emailsToMakeAdmin = [
      'lamoroso@vibraresidencial.com.br',
      'admin@nortisinc1.onmicrosoft.com',
      'cspindola@gruponortis.com.br',
    ];

    console.log('Atualizando usuários para torná-los Admins...');
    const result = await prisma.usuario.updateMany({
      where: {
        Email: {
          in: emailsToMakeAdmin,
        },
      },
      data: {
        Adm: true,
      },
    });

    console.log(`Sucesso! ${result.count} usuário(s) foram definidos como Admin.`);
  } catch (error) {
    console.error('Erro ao atualizar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
