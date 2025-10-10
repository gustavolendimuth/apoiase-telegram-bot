import crypto from 'crypto';
import Integration, { IIntegration } from '../models/Integration';
import EventLog from '../models/EventLog';
import telegramService from './telegramService';
import logger from '../config/logger';

/**
 * Serviço de gerenciamento de integrações
 */
export class IntegrationService {
  /**
   * Gera uma chave API única para a integração
   */
  private generateApiKey(): string {
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
    rewardLevels: string[],
    createdBy: string
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
        rewardLevels,
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
          rewardLevels: rewardLevels.length,
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
      rewardLevels: string[];
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
      return integration.createdBy === userId;
    } catch (error) {
      logger.error('Erro ao verificar acesso:', error);
      return false;
    }
  }
}

export default new IntegrationService();
