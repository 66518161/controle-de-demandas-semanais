import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Carrega as variáveis do arquivo .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migração DDL: Adicionando coluna Adm na tabela Usuarios...');
  try {
    // Executa a alteração na tabela de banco de dados
    await prisma.$executeRawUnsafe('ALTER TABLE Usuarios ADD Adm BIT NULL;');
    console.log('Coluna Adm BIT NULL adicionada com sucesso na tabela Usuarios!');
  } catch (error) {
    if (error.message.includes('already') || error.message.includes('exist') || error.message.includes('duplicado')) {
      console.log('Aviso: A coluna Adm já existe no banco de dados.');
    } else {
      console.error('Erro ao adicionar coluna Adm:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
