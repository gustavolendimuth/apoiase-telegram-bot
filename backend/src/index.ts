import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import integrationRoutes from './routes/integrationRoutes';
import webhookRoutes from './routes/webhookRoutes';
import { setupRecurringJobs } from './jobs/syncMembers';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/webhook', webhookRoutes);
// TODO: Adicionar outras rotas quando forem criadas
// app.use('/api/members', memberRoutes);

// Handlers de erro
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Iniciar bot do Telegram
    if (process.env.TELEGRAM_BOT_TOKEN) {
      const telegramService = (await import('./services/telegramService')).default;
      await telegramService.start();
    } else {
      logger.warn('TELEGRAM_BOT_TOKEN não configurado - bot não será iniciado');
    }

    // Configurar jobs recorrentes
    setupRecurringJobs();
    logger.info('Jobs recorrentes configurados');

    // Iniciar o servidor
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais de término
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido. Encerrando graciosamente...');
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const telegramService = (await import('./services/telegramService')).default;
    await telegramService.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido. Encerrando graciosamente...');
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const telegramService = (await import('./services/telegramService')).default;
    await telegramService.stop();
  }
  process.exit(0);
});

// Tratamento de exceções não capturadas
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;
