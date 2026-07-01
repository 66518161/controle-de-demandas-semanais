import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.usuario.findMany({
      include: {
        CargoRef: true,
      },
    });
    console.log('--- Usuários no Banco de Dados ---');
    users.forEach((u) => {
      console.log(`ID: ${u.IdUsuario} | Nome: ${u.Nome} | Email: ${u.Email} | Senha: ${u.Senha} | Cargo: ${u.CargoRef?.Nome || u.IdCargo} | Adm: ${u.Adm}`);
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
