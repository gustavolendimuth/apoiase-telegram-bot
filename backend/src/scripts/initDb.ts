import { connectDatabase } from '../config/database';
import Integration from '../models/Integration';
import Member from '../models/Member';
import EventLog from '../models/EventLog';
import logger from '../config/logger';

/**
 * Script para inicializar o banco de dados
 * Cria índices e valida schemas
 */
async function initializeDatabase() {
  try {
    logger.info('Iniciando configuração do banco de dados...');

    // Conectar ao banco
    await connectDatabase();

    // Criar índices
    logger.info('Criando índices...');
    await Integration.createIndexes();
    await Member.createIndexes();
    await EventLog.createIndexes();

    logger.info('✓ Banco de dados configurado com sucesso!');
    logger.info('Índices criados:');
    logger.info('- Integration: campaignId, telegramGroupId, apiKey');
    logger.info('- Member: integrationId, supporterEmail, telegramUserId');
    logger.info('- EventLog: eventType, createdAt');

    process.exit(0);
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

export default initializeDatabase;
