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
import integrationAuthRoutes from './routes/integrationAuthRoutes';
import apoiaseIntegrationRoutes from './routes/apoiaseIntegrationRoutes';
import webhookRoutes from './routes/webhookRoutes';
import campaignRoutes from './routes/campaignRoutes';
import supportRoutes from './routes/supportRoutes';
import { setupRecurringJobs } from './jobs/syncMembers';
import { getFrontendUrl } from './utils/env';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet());

// CORS - configuração com log para debug
const frontendUrl = getFrontendUrl();
logger.info(`CORS configurado para: ${frontendUrl}`);

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/integration', integrationAuthRoutes); // Fluxo OAuth-like
app.use('/api/campaigns', apoiaseIntegrationRoutes); // Endpoints APOIA.se-style (campanhas com integrações)
app.use('/api/campaigns', campaignRoutes);
app.use('/api/supports', supportRoutes);
app.use('/webhook', webhookRoutes);

// Handlers de erro
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Executar seed automático se habilitado
    if (process.env.AUTO_SEED === 'true') {
      logger.info('🌱 AUTO_SEED habilitado - executando seed...');
      try {
        const autoSeed = (await import('./scripts/autoSeed')).default;
        await autoSeed({ standalone: false });
        logger.info('✅ Seed concluído com sucesso');
      } catch (error) {
        logger.error('❌ Erro ao executar seed automático:', error);
        // Não parar a aplicação se o seed falhar
      }
    } else {
      logger.info('ℹ️  AUTO_SEED não está habilitado (valor: ' + process.env.AUTO_SEED + ')');
    }

    // Iniciar bot do Telegram (não bloquear com await, pois bot.launch() inicia polling)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      const telegramService = (await import('./services/telegramService')).default;
      telegramService.start().catch(error => {
        logger.error('Erro ao iniciar bot do Telegram:', error);
      });
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
