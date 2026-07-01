import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import consolidationRoutes from './routes/consolidationRoutes.js';

// Em produção (Azure), as variáveis vêm das Application Settings.
// Em dev local, o dotenv carrega do .env na raiz do projeto.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[Backend API] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', timestamp: new Date().toISOString() });
});

// Registrar Rotas da API
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/consolidation', consolidationRoutes);

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Agendador Automático: Toda sexta às 08:00
import { runWeeklyConsolidationForWeek } from './controllers/consolidationController.js';

function setupWeeklyConsolidationCron() {
  function scheduleNextRun() {
    const now = new Date();
    const nextFriday = new Date();
    const dayOfWeek = 5; // Sexta-feira
    
    nextFriday.setDate(now.getDate() + (dayOfWeek + 7 - now.getDay()) % 7);
    nextFriday.setHours(8, 0, 0, 0);
    
    if (nextFriday <= now) {
      nextFriday.setDate(nextFriday.getDate() + 7);
    }
    
    const msUntilRun = nextFriday.getTime() - now.getTime();
    console.log(`[Weekly Cron] Próxima consolidação agendada para: ${nextFriday.toLocaleString('pt-BR')} (em ${Math.round(msUntilRun / 1000 / 60)} minutos)`);
    
    setTimeout(async () => {
      try {
        console.log('[Weekly Cron] Iniciando consolidação semanal automática...');
        const dateForWeek = new Date();
        const d = new Date(Date.UTC(dateForWeek.getFullYear(), dateForWeek.getMonth(), dateForWeek.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const currentSemana = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        const currentAno = dateForWeek.getFullYear();
        
        await runWeeklyConsolidationForWeek(currentSemana, currentAno);
        console.log('[Weekly Cron] Consolidação automática executada com sucesso.');
      } catch (err) {
        console.error('[Weekly Cron] Erro durante a consolidação automática:', err);
      } finally {
        scheduleNextRun();
      }
    }, msUntilRun);
  }
  
  scheduleNextRun();
}

app.listen(PORT, () => {
  console.log(`[Backend API] Servidor rodando na porta ${PORT}`);
  setupWeeklyConsolidationCron();
});
