import crypto from 'crypto';
import IntegrationAuthSession, { IIntegrationAuthSession } from '../models/IntegrationAuthSession';
import Integration from '../models/Integration';
import Campaign from '../models/Campaign';
import integrationService from './integrationService';
import logger from '../config/logger';

/**
 * Dados do Telegram Login Widget
 */
export interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Serviço para gerenciar fluxo de autorização OAuth-like
 * para integração entre APOIA.se e Telegram
 */
export class IntegrationAuthService {
  private botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  }

  /**
   * Inicia o fluxo de autorização OAuth-like
   * Chamado quando APOIA.se redireciona usuário para o serviço de integração
   */
  async initiateAuthorization(params: {
    campaignSlug: string;
    apiKey: string;
    bearerToken: string;
    redirectUri: string;
  }): Promise<{
    success: boolean;
    stateToken?: string;
    campaign?: any;
    error?: string;
  }> {
    try {
      // 1. Validar credenciais temporárias com Redis do APOIA.se
      const redisClient = (await import('../config/redis')).default;
      const credentialsKey = `telegram:integration:${params.apiKey}`;
      const credentialsData = await redisClient.get(credentialsKey);

      if (!credentialsData) {
        return {
          success: false,
          error: 'Credenciais inválidas ou expiradas',
        };
      }

      const credentials = JSON.parse(credentialsData);

      // Validar bearer token
      if (credentials.bearerToken !== params.bearerToken) {
        return {
          success: false,
          error: 'Bearer token inválido',
        };
      }

      // Validar campaign slug
      if (credentials.campaignSlug !== params.campaignSlug) {
        return {
          success: false,
          error: 'Campaign slug não corresponde às credenciais',
        };
      }

      // 2. Buscar campanha
      const campaign = await Campaign.findOne({ slug: params.campaignSlug });

      if (!campaign) {
        return {
          success: false,
          error: 'Campanha não encontrada',
        };
      }

      // 3. Gerar state token único (segurança anti-CSRF)
      const stateToken = crypto.randomBytes(32).toString('base64url');

      // 4. Criar sessão de autorização (expira em 30 minutos)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const session = await IntegrationAuthSession.create({
        stateToken,
        campaignSlug: params.campaignSlug,
        redirectUri: params.redirectUri,
        apoiaseApiKey: params.apiKey,
        apoiaseBearerToken: params.bearerToken,
        status: 'pending',
        expiresAt,
      });

      logger.info('Fluxo de autorização iniciado', {
        stateToken,
        campaignSlug: params.campaignSlug,
      });

      return {
        success: true,
        stateToken,
        campaign: {
          id: campaign._id,
          title: campaign.title,
          slug: campaign.slug,
        },
      };
    } catch (error: any) {
      logger.error('Erro ao iniciar autorização', { error: error.message });
      return {
        success: false,
        error: 'Erro ao iniciar fluxo de autorização',
      };
    }
  }

  /**
   * Valida dados do Telegram Login Widget
   * Verifica se o hash é válido para garantir autenticidade
   */
  validateTelegramAuth(authData: TelegramAuthData): boolean {
    try {
      const { hash, ...data } = authData;

      // Verificar se auth_date não é muito antigo (5 minutos)
      const authDate = data.auth_date;
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - authDate > 300) {
        logger.warn('Telegram auth data expirado');
        return false;
      }

      // Criar string de verificação
      const dataCheckString = Object.keys(data)
        .sort()
        .map((key) => `${key}=${(data as any)[key]}`)
        .join('\n');

      // Calcular hash
      const secretKey = crypto.createHash('sha256').update(this.botToken).digest();
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      logger.error('Erro ao validar Telegram auth', { error });
      return false;
    }
  }

  /**
   * Processa autenticação do Telegram
   * Chamado após usuário fazer login com Telegram Login Widget
   */
  async processTelegramAuth(
    stateToken: string,
    authData: TelegramAuthData
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 1. Buscar sessão
      const session = await IntegrationAuthSession.findOne({
        stateToken,
        status: 'pending',
      });

      if (!session || !session.isValid()) {
        return {
          success: false,
          error: 'Sessão inválida ou expirada',
        };
      }

      // 2. Validar hash do Telegram
      if (!this.validateTelegramAuth(authData)) {
        await session.setError('Autenticação Telegram inválida');
        return {
          success: false,
          error: 'Dados de autenticação inválidos',
        };
      }

      // 3. Atualizar sessão com dados do Telegram
      session.telegramUserId = authData.id;
      session.telegramUsername = authData.username;
      session.telegramFirstName = authData.first_name;
      session.telegramPhotoUrl = authData.photo_url;
      session.status = 'telegram_auth_complete';
      await session.save();

      logger.info('Telegram auth processado com sucesso', {
        stateToken,
        telegramUserId: authData.id,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('Erro ao processar Telegram auth', { error: error.message });
      return {
        success: false,
        error: 'Erro ao processar autenticação',
      };
    }
  }

  /**
   * Processa seleção do grupo Telegram
   */
  async processGroupSelection(
    stateToken: string,
    groupId: string,
    groupTitle: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const session = await IntegrationAuthSession.findOne({
        stateToken,
        status: 'telegram_auth_complete',
      });

      if (!session || !session.isValid()) {
        return {
          success: false,
          error: 'Sessão inválida ou expirada',
        };
      }

      session.selectedGroupId = groupId;
      session.selectedGroupTitle = groupTitle;
      session.status = 'group_selected';
      await session.save();

      logger.info('Grupo selecionado', {
        stateToken,
        groupId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('Erro ao processar seleção de grupo', { error: error.message });
      return {
        success: false,
        error: 'Erro ao processar seleção de grupo',
      };
    }
  }

  /**
   * Finaliza autorização e cria integração
   */
  async completeAuthorization(
    stateToken: string
  ): Promise<{
    success: boolean;
    integrationId?: string;
    integration?: any;
    error?: string;
  }> {
    try {
      // 1. Buscar sessão
      const session = await IntegrationAuthSession.findOne({
        stateToken,
        status: 'group_selected',
      });

      if (!session || !session.isValid()) {
        return {
          success: false,
          error: 'Sessão inválida ou expirada',
        };
      }

      // 2. Buscar campanha pelo slug
      const campaign = await Campaign.findOne({ slug: session.campaignSlug });

      if (!campaign) {
        return {
          success: false,
          error: 'Campanha não encontrada',
        };
      }

      // 3. Obter maker ID das credenciais do APOIA.se armazenadas na sessão
      const redisClient = (await import('../config/redis')).default;
      const credentialsKey = `telegram:integration:${session.apoiaseApiKey}`;
      const credentialsData = await redisClient.get(credentialsKey);

      if (!credentialsData) {
        return {
          success: false,
          error: 'Credenciais expiradas',
        };
      }

      const credentials = JSON.parse(credentialsData);
      const makerId = credentials.makerId;

      // 4. Verificar se o usuário é dono da campanha
      if (campaign.makerId.toString() !== makerId) {
        return {
          success: false,
          error: 'Você não tem permissão para integrar esta campanha',
        };
      }

      // 5. Verificar se já existe integração para este grupo
      const existingIntegration = await Integration.findOne({
        telegramGroupId: session.selectedGroupId!,
      });

      if (existingIntegration) {
        await session.setError('Grupo já está integrado a outra campanha');
        return {
          success: false,
          error: 'Este grupo já está integrado a outra campanha',
        };
      }

      // 6. Criar integração
      const apiKey = await integrationService.generateApiKey();

      const integration = await Integration.create({
        campaignId: campaign._id,
        campaignSlug: session.campaignSlug,
        telegramGroupId: session.selectedGroupId!,
        telegramGroupType: 'supergroup',
        telegramGroupTitle: session.selectedGroupTitle!,
        apiKey,
        rewardLevels: [],
        isActive: true,
        createdBy: makerId,
      });

      // 6. Marcar sessão como completa
      await session.markCompleted();

      logger.info('Integração criada com sucesso', {
        integrationId: integration._id,
        campaignSlug: session.campaignSlug,
        groupId: session.selectedGroupId,
      });

      return {
        success: true,
        integrationId: integration._id.toString(),
        integration: {
          id: integration._id,
          telegramGroupTitle: integration.telegramGroupTitle,
          telegramGroupId: integration.telegramGroupId,
          campaignId: integration.campaignId,
        },
      };
    } catch (error: any) {
      logger.error('Erro ao completar autorização', { error: error.message });
      return {
        success: false,
        error: 'Erro ao finalizar integração',
      };
    }
  }

  /**
   * Busca sessão por state token
   */
  async getSession(stateToken: string): Promise<IIntegrationAuthSession | null> {
    try {
      return await IntegrationAuthSession.findOne({ stateToken });
    } catch (error) {
      logger.error('Erro ao buscar sessão', { error });
      return null;
    }
  }

  /**
   * Cancela autorização
   */
  async cancelAuthorization(stateToken: string): Promise<void> {
    try {
      const session = await IntegrationAuthSession.findOne({ stateToken });
      if (session) {
        await session.setError('Cancelado pelo usuário');
      }
    } catch (error) {
      logger.error('Erro ao cancelar autorização', { error });
    }
  }
}

export default new IntegrationAuthService();
