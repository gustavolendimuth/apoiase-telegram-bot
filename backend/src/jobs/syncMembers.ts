import Bull from 'bull';
import redisClient from '../config/redis';
import logger from '../config/logger';
import Integration from '../models/Integration';
import verificationService from '../services/verificationService';
import memberService from '../services/memberService';

/**
 * Queue para sincronização de membros
 */
const syncQueue = new Bull('member-sync', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

/**
 * Processa job de sincronização
 */
syncQueue.process(async (job) => {
  const { integrationId } = job.data;

  logger.info('Iniciando sincronização de membros:', { integrationId });

  try {
    const result = await verificationService.syncIntegrationMembers(
      integrationId
    );

    logger.info('Sincronização concluída:', {
      integrationId,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error('Erro na sincronização de membros:', {
      integrationId,
      error,
    });
    throw error;
  }
});

/**
 * Job de verificação e remoção automática
 */
const removalQueue = new Bull('member-removal', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

/**
 * Processa remoções automáticas
 */
removalQueue.process(async (job) => {
  logger.info('Iniciando processo de remoção automática');

  try {
    // Buscar membros que devem receber aviso
    const membersToWarn = await memberService.getMembersToWarn();

    for (const member of membersToWarn) {
      try {
        await memberService.sendRemovalWarning(member._id.toString());
      } catch (error) {
        logger.error('Erro ao enviar aviso:', {
          memberId: member._id,
          error,
        });
      }
    }

    // Buscar membros para remover
    const membersToRemove = await memberService.getMembersToRemove();

    let removed = 0;
    for (const member of membersToRemove) {
      try {
        await memberService.removeMember(
          member._id.toString(),
          'payment_overdue_automatic'
        );
        removed++;
      } catch (error) {
        logger.error('Erro ao remover membro:', {
          memberId: member._id,
          error,
        });
      }
    }

    logger.info('Processo de remoção concluído:', {
      warned: membersToWarn.length,
      removed,
    });

    return {
      warned: membersToWarn.length,
      removed,
    };
  } catch (error) {
    logger.error('Erro no processo de remoção automática:', error);
    throw error;
  }
});

/**
 * Agenda sincronização diária para todas as integrações ativas
 */
export async function scheduleDailySyncAll(): Promise<void> {
  try {
    const integrations = await Integration.find({ isActive: true });

    for (const integration of integrations) {
      await syncQueue.add(
        {
          integrationId: integration._id.toString(),
        },
        {
          priority: 1,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }

    logger.info('Sincronização diária agendada para todas as integrações:', {
      count: integrations.length,
    });
  } catch (error) {
    logger.error('Erro ao agendar sincronização diária:', error);
  }
}

/**
 * Agenda verificação de remoções
 */
export async function scheduleRemovalCheck(): Promise<void> {
  try {
    await removalQueue.add(
      {},
      {
        priority: 1,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    logger.info('Verificação de remoções agendada');
  } catch (error) {
    logger.error('Erro ao agendar verificação de remoções:', error);
  }
}

/**
 * Configura jobs recorrentes (cron)
 */
export function setupRecurringJobs(): void {
  // Sincronização diária às 02:00 AM
  syncQueue.add(
    'daily-sync-all',
    {},
    {
      repeat: {
        cron: '0 2 * * *', // Todos os dias às 02:00
      },
    }
  );

  // Verificação de remoções a cada 6 horas
  removalQueue.add(
    'removal-check',
    {},
    {
      repeat: {
        cron: '0 */6 * * *', // A cada 6 horas
      },
    }
  );

  logger.info('Jobs recorrentes configurados');
}

/**
 * Handlers de eventos da queue
 */
syncQueue.on('completed', (job, result) => {
  logger.info('Job de sincronização concluído:', {
    jobId: job.id,
    result,
  });
});

syncQueue.on('failed', (job, err) => {
  logger.error('Job de sincronização falhou:', {
    jobId: job?.id,
    error: err.message,
  });
});

removalQueue.on('completed', (job, result) => {
  logger.info('Job de remoção concluído:', {
    jobId: job.id,
    result,
  });
});

removalQueue.on('failed', (job, err) => {
  logger.error('Job de remoção falhou:', {
    jobId: job?.id,
    error: err.message,
  });
});

export { syncQueue, removalQueue };
