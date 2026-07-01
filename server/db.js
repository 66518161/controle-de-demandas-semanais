import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis a partir do .env na raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false', // true por padrão
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
  }
};

let poolPromise;

export async function getDatabasePool() {
  if (!poolPromise) {
    if (!dbConfig.server || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
      throw new Error('Configurações de conexão com o banco de dados Azure SQL ausentes no arquivo .env.');
    }
    
    poolPromise = sql.connect(dbConfig)
      .then(pool => {
        console.log('Pool de conexões com o Azure SQL estabelecido com sucesso.');
        return pool;
      })
      .catch(err => {
        console.error('Erro de conexão com o Azure SQL:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

export async function executeQuery(queryText, params = {}) {
  try {
    const pool = await getDatabasePool();
    const request = pool.request();
    
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    
    return await request.query(queryText);
  } catch (error) {
    console.error('Erro ao executar query SQL:', { queryText, params, error: error.message });
    throw error;
  }
}

export { sql };
