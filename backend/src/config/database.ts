import mongoose from 'mongoose';
import logger from './logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/apoiase-telegram-bot';

    await mongoose.connect(mongoUri);

    logger.info('MongoDB conectado com sucesso');
  } catch (error) {
    logger.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  logger.error('Erro no MongoDB:', err);
});
