import Redis from 'ioredis';
import logger from './logger';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('Redis conectado com sucesso');
});

redisClient.on('error', (err) => {
  logger.error('Erro no Redis:', err);
});

export default redisClient;
