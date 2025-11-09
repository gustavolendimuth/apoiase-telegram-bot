import crypto from 'crypto';
import Integration, { IIntegration } from '../models/Integration';
import EventLog from '../models/EventLog';
import TelegramAuthToken from '../models/TelegramAuthToken';
import Campaign from '../models/Campaign';
import telegramService from './telegramService';
import logger from '../config/logger';

/**
 * Serviço de gerenciamento de integrações
 */
export class IntegrationService {
  /**
   * Gera uma chave API única para a integração
   */
  public generateApiKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Valida se o bot tem permissões corretas no grupo
   */
  async validateBotPermissions(telegramGroupId: string): Promise<boolean> {
    try {
      const chat = await telegramService.getChat(parseInt(telegramGroupId));

      // Verificar se é um grupo/supergrupo/canal
      if (!['group', 'supergroup', 'channel'].includes(chat.type)) {
        throw new Error('O bot só pode ser adicionado a grupos, supergrupos ou canais');
      }

      // TODO: Verificar se o bot é administrador
      // const botMember = await telegramService.getChatMember(chatId, botId);
      // if (botMember.status !== 'administrator') {
      //   throw new Error('O bot precisa ser administrador do grupo');
      // }

      return true;
    } catch (error) {
      logger.error('Erro ao validar permissões do bot:', error);
      throw new Error('Não foi possível validar as permissões do bot no grupo');
    }
  }

  /**
   * Cria uma nova integração
   */
  async createIntegration(
    campaignId: string,
    telegramGroupId: string,
    createdBy: string,
    options: {
      minSupportLevel?: string;
    }
  ): Promise<IIntegration> {
    try {
      // Verificar se já existe integração para este grupo
      const existingIntegration = await Integration.findOne({
        telegramGroupId,
      });

      if (existingIntegration) {
        throw new Error('Já existe uma integração configurada para este grupo');
      }

      // Validar permissões do bot no grupo
      await this.validateBotPermissions(telegramGroupId);

      // Obter informações do grupo
      const chat = await telegramService.getChat(parseInt(telegramGroupId));
      const chatTitle = 'title' in chat ? chat.title : 'Sem título';

      // Gerar API Key única
      const apiKey = this.generateApiKey();

      // Criar integração
      const integration = await Integration.create({
        campaignId,
        telegramGroupId,
        telegramGroupType: chat.type as 'group' | 'supergroup' | 'channel',
        telegramGroupTitle: chatTitle,
        apiKey,
        minSupportLevel: options.minSupportLevel,
        isActive: true,
        createdBy,
      });

      // Registrar evento
      await EventLog.create({
        eventType: 'integration_created',
        integrationId: integration._id,
        metadata: {
          campaignId,
          groupTitle: chatTitle,
          minSupportLevel: options.minSupportLevel || 'none',
        },
      });

      logger.info('Integração criada com sucesso:', {
        integrationId: integration._id,
        campaignId,
        groupTitle: chatTitle,
      });

      return integration;
    } catch (error) {
      logger.error('Erro ao criar integração:', error);
      throw error;
    }
  }

  /**
   * Lista todas as integrações de uma campanha
   */
  async listIntegrationsByCampaign(campaignId: string): Promise<IIntegration[]> {
    try {
      const integrations = await Integration.find({
        campaignId,
      }).sort({ createdAt: -1 });

      return integrations;
    } catch (error) {
      logger.error('Erro ao listar integrações:', error);
      throw error;
    }
  }

  /**
   * Busca uma integração pelo ID
   */
  async getIntegrationById(integrationId: string): Promise<IIntegration | null> {
    try {
      const integration = await Integration.findById(integrationId);
      return integration;
    } catch (error) {
      logger.error('Erro ao buscar integração:', error);
      throw error;
    }
  }

  /**
   * Busca uma integração pela chave API
   */
  async getIntegrationByApiKey(apiKey: string): Promise<IIntegration | null> {
    try {
      const integration = await Integration.findOne({ apiKey, isActive: true });
      return integration;
    } catch (error) {
      logger.error('Erro ao buscar integração por API key:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma integração
   */
  async updateIntegration(
    integrationId: string,
    updates: Partial<{
      minSupportLevel: string;
      isActive: boolean;
    }>
  ): Promise<IIntegration | null> {
    try {
      const integration = await Integration.findByIdAndUpdate(
        integrationId,
        { $set: updates },
        { new: true }
      );

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      // Registrar evento
      await EventLog.create({
        eventType: 'integration_updated',
        integrationId: integration._id,
        metadata: {
          updates,
        },
      });

      logger.info('Integração atualizada:', {
        integrationId,
        updates,
      });

      return integration;
    } catch (error) {
      logger.error('Erro ao atualizar integração:', error);
      throw error;
    }
  }

  /**
   * Ativa uma integração
   */
  async activateIntegration(integrationId: string): Promise<IIntegration | null> {
    return this.updateIntegration(integrationId, { isActive: true });
  }

  /**
   * Desativa uma integração
   */
  async deactivateIntegration(integrationId: string): Promise<IIntegration | null> {
    return this.updateIntegration(integrationId, { isActive: false });
  }

  /**
   * Deleta uma integração
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const integration = await Integration.findById(integrationId);

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      // Fazer o bot sair do grupo antes de deletar a integração
      try {
        await telegramService.leaveChat(integration.telegramGroupId);
        logger.info('Bot removido do grupo ao deletar integração', {
          integrationId,
          telegramGroupId: integration.telegramGroupId,
        });
      } catch (leaveChatError: any) {
        logger.warn('Não foi possível remover o bot do grupo (grupo pode não existir mais)', {
          integrationId,
          telegramGroupId: integration.telegramGroupId,
          error: leaveChatError.message,
        });
        // Continuar com a deleção mesmo se não conseguir sair do grupo
      }

      await Integration.findByIdAndDelete(integrationId);

      // Registrar evento
      await EventLog.create({
        eventType: 'integration_deleted',
        integrationId: integration._id,
        metadata: {
          campaignId: integration.campaignId,
          groupTitle: integration.telegramGroupTitle,
        },
      });

      logger.info('Integração deletada:', {
        integrationId,
        campaignId: integration.campaignId,
      });
    } catch (error) {
      logger.error('Erro ao deletar integração:', error);
      throw error;
    }
  }

  /**
   * Regenera a chave API de uma integração
   */
  async regenerateApiKey(integrationId: string): Promise<IIntegration | null> {
    try {
      const newApiKey = this.generateApiKey();

      const integration = await Integration.findByIdAndUpdate(
        integrationId,
        { $set: { apiKey: newApiKey } },
        { new: true }
      );

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      logger.info('API Key regenerada:', {
        integrationId,
      });

      return integration;
    } catch (error) {
      logger.error('Erro ao regenerar API key:', error);
      throw error;
    }
  }

  /**
   * Verifica se um usuário tem acesso a uma integração
   */
  async checkUserAccess(integrationId: string, userId: string): Promise<boolean> {
    try {
      const integration = await Integration.findById(integrationId);

      if (!integration) {
        return false;
      }

      // Verificar se o usuário é o criador
      return integration.createdBy.toString() === userId;
    } catch (error) {
      logger.error('Erro ao verificar acesso:', error);
      return false;
    }
  }

  /**
   * Busca o link do Telegram de uma campanha
   */
  async getTelegramLinkByCampaign(campaignId: string): Promise<string | null> {
    try {
      const integration = await Integration.findOne({
        campaignId,
        isActive: true,
      });

      if (!integration) {
        return null;
      }

      // Gera o link do grupo Telegram
      // Se o grupo começar com -100, é um supergrupo (remover -100 e usar apenas os dígitos)
      const groupId = integration.telegramGroupId;
      let telegramLink: string;

      if (groupId.startsWith('-100')) {
        // Supergrupo: https://t.me/c/{id_sem_100}/{thread_id}
        const cleanId = groupId.replace('-100', '');
        telegramLink = `https://t.me/c/${cleanId}`;
      } else if (groupId.startsWith('@')) {
        // Username público
        telegramLink = `https://t.me/${groupId.replace('@', '')}`;
      } else {
        // Tentar criar link de convite
        try {
          const inviteLink = await telegramService.createInviteLink(
            parseInt(groupId),
            0 // Sem expiração
          );
          telegramLink = inviteLink;
        } catch (error) {
          logger.warn('Erro ao criar link de convite, usando ID:', error);
          telegramLink = `https://t.me/c/${groupId.replace('-', '')}`;
        }
      }

      return telegramLink;
    } catch (error) {
      logger.error('Erro ao buscar link do Telegram:', error);
      throw error;
    }
  }

  /**
   * Inicia o processo de autorização do Telegram (OAuth-like)
   * Cria um token temporário e retorna o deep link para adicionar o bot
   */
  async startTelegramAuthorization(
    campaignId: string,
    userId: string,
    minSupportLevel?: string
  ): Promise<{
    token: string;
    authUrl: string;
    expiresAt: Date;
  }> {
    try {
      // Validar se a campanha existe
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campanha não encontrada');
      }

      // Gerar token único e seguro
      const token = crypto.randomBytes(32).toString('hex');

      // Definir expiração (15 minutos)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Criar token de autorização
      await TelegramAuthToken.create({
        token,
        campaignId,
        userId,
        minSupportLevel,
        status: 'pending',
        expiresAt,
      });

      // Obter informações do bot
      const bot = telegramService.getBot();
      if (!bot) {
        throw new Error('Bot do Telegram não inicializado');
      }

      const botInfo = await bot.telegram.getMe();
      const botUsername = botInfo.username;

      // Criar deep link para adicionar bot ao grupo
      // Formato: https://t.me/{bot_username}?startgroup={token}
      const authUrl = `https://t.me/${botUsername}?startgroup=${token}`;

      logger.info('Autorização do Telegram iniciada:', {
        token,
        campaignId,
        userId,
        expiresAt,
      });

      return {
        token,
        authUrl,
        expiresAt,
      };
    } catch (error) {
      logger.error('Erro ao iniciar autorização do Telegram:', error);
      throw error;
    }
  }

  /**
   * Verifica o status de uma autorização do Telegram
   */
  async checkTelegramAuthorizationStatus(
    token: string
  ): Promise<{
    status: 'pending' | 'completed' | 'expired';
    integration?: {
      id: string;
      telegramGroupId: string;
      telegramGroupTitle: string;
    };
  }> {
    try {
      const authToken = await TelegramAuthToken.findOne({ token });

      if (!authToken) {
        throw new Error('Token de autorização não encontrado');
      }

      // Verificar se expirou
      if (authToken.expiresAt < new Date()) {
        if (authToken.status === 'pending') {
          authToken.status = 'expired';
          await authToken.save();
        }
        return { status: 'expired' };
      }

      // Se já foi usado, retornar integração
      if (authToken.status === 'used' && authToken.integrationId) {
        const integration = await Integration.findById(authToken.integrationId);
        if (integration) {
          return {
            status: 'completed',
            integration: {
              id: integration._id.toString(),
              telegramGroupId: integration.telegramGroupId,
              telegramGroupTitle: integration.telegramGroupTitle || '',
            },
          };
        }
      }

      return { status: authToken.status as 'pending' | 'completed' | 'expired' };
    } catch (error) {
      logger.error('Erro ao verificar status da autorização:', error);
      throw error;
    }
  }

  /**
   * Processa a autorização quando o bot é adicionado a um grupo
   * Chamado pelo handler do Telegram quando o bot detecta /start com startgroup
   */
  async processTelegramAuthorization(
    token: string,
    telegramGroupId: string
  ): Promise<IIntegration> {
    try {
      // Buscar token
      const authToken = await TelegramAuthToken.findOne({ token, status: 'pending' });

      if (!authToken) {
        throw new Error('Token de autorização inválido ou já utilizado');
      }

      // Verificar se expirou
      if (authToken.expiresAt < new Date()) {
        authToken.status = 'expired';
        await authToken.save();
        throw new Error('Token de autorização expirado');
      }

      // Criar integração
      const integration = await this.createIntegration(
        authToken.campaignId.toString(),
        telegramGroupId,
        authToken.userId.toString(),
        {
          minSupportLevel: authToken.minSupportLevel,
        }
      );

      // Marcar token como usado
      authToken.status = 'used';
      authToken.usedAt = new Date();
      authToken.integrationId = integration._id;
      await authToken.save();

      logger.info('Autorização do Telegram processada com sucesso:', {
        token,
        integrationId: integration._id,
        telegramGroupId,
      });

      return integration;
    } catch (error) {
      logger.error('Erro ao processar autorização do Telegram:', error);
      throw error;
    }
  }

  /**
   * Busca informações de integração para apoiadores
   * Retorna se há integração ativa e o link para entrar no grupo
   */
  async getIntegrationInfoForSupporter(
    campaignId: string,
    supporterEmail: string
  ): Promise<{
    hasIntegration: boolean;
    telegramLink?: string;
    groupTitle?: string;
    isMember?: boolean;
  }> {
    try {
      const integration = await Integration.findOne({
        campaignId,
        isActive: true,
      });

      if (!integration) {
        return { hasIntegration: false };
      }

      // Buscar se o apoiador já é membro
      const Member = (await import('../models/Member')).default;
      const member = await Member.findOne({
        integrationId: integration._id,
        supporterEmail,
      });

      const telegramLink = await this.getTelegramLinkByCampaign(campaignId);

      return {
        hasIntegration: true,
        telegramLink: telegramLink || undefined,
        groupTitle: integration.telegramGroupTitle,
        isMember: member ? member.status === 'active' : false,
      };
    } catch (error) {
      logger.error('Erro ao buscar informações de integração para apoiador:', error);
      throw error;
    }
  }
}

export default new IntegrationService();
