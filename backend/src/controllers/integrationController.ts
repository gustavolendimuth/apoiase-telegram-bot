import { Response } from 'express';
import integrationService from '../services/integrationService';
import logger from '../config/logger';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Controller de integrações
 */
export class IntegrationController {
  /**
   * Criar nova integração
   * POST /api/integrations
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { campaignId, telegramGroupId, rewardLevels } = req.body;

      // Validações
      if (!campaignId || !telegramGroupId) {
        res.status(400).json({
          error: 'campaignId e telegramGroupId são obrigatórios',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      // Criar integração
      const integration = await integrationService.createIntegration(
        campaignId,
        telegramGroupId,
        rewardLevels || [],
        req.user.id
      );

      logger.info('Integração criada via API:', {
        integrationId: integration._id,
        userId: req.user.id,
      });

      res.status(201).json({
        message: 'Integração criada com sucesso',
        integration: {
          id: integration._id,
          campaignId: integration.campaignId,
          telegramGroupId: integration.telegramGroupId,
          telegramGroupTitle: integration.telegramGroupTitle,
          telegramGroupType: integration.telegramGroupType,
          apiKey: integration.apiKey,
          rewardLevels: integration.rewardLevels,
          isActive: integration.isActive,
          createdAt: integration.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao criar integração via API:', error);
      res.status(500).json({
        error: error.message || 'Erro ao criar integração',
      });
    }
  }

  /**
   * Listar integrações da campanha do usuário
   * GET /api/integrations
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.query;

      if (!campaignId) {
        res.status(400).json({
          error: 'campaignId é obrigatório',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const integrations = await integrationService.listIntegrationsByCampaign(
        campaignId as string
      );

      res.json({
        integrations: integrations.map((integration) => ({
          id: integration._id,
          campaignId: integration.campaignId,
          telegramGroupId: integration.telegramGroupId,
          telegramGroupTitle: integration.telegramGroupTitle,
          telegramGroupType: integration.telegramGroupType,
          rewardLevels: integration.rewardLevels,
          isActive: integration.isActive,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
        })),
      });
    } catch (error) {
      logger.error('Erro ao listar integrações via API:', error);
      res.status(500).json({
        error: 'Erro ao listar integrações',
      });
    }
  }

  /**
   * Buscar integração por ID
   * GET /api/integrations/:id
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const integration = await integrationService.getIntegrationById(id);

      if (!integration) {
        res.status(404).json({
          error: 'Integração não encontrada',
        });
        return;
      }

      // Verificar se o usuário tem acesso
      const hasAccess = await integrationService.checkUserAccess(id, req.user.id);

      if (!hasAccess && req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado',
        });
        return;
      }

      res.json({
        integration: {
          id: integration._id,
          campaignId: integration.campaignId,
          telegramGroupId: integration.telegramGroupId,
          telegramGroupTitle: integration.telegramGroupTitle,
          telegramGroupType: integration.telegramGroupType,
          apiKey: integration.apiKey,
          rewardLevels: integration.rewardLevels,
          isActive: integration.isActive,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar integração via API:', error);
      res.status(500).json({
        error: 'Erro ao buscar integração',
      });
    }
  }

  /**
   * Atualizar integração
   * PUT /api/integrations/:id
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rewardLevels, isActive } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      // Verificar se o usuário tem acesso
      const hasAccess = await integrationService.checkUserAccess(id, req.user.id);

      if (!hasAccess && req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado',
        });
        return;
      }

      const updates: any = {};
      if (rewardLevels !== undefined) updates.rewardLevels = rewardLevels;
      if (isActive !== undefined) updates.isActive = isActive;

      const integration = await integrationService.updateIntegration(id, updates);

      if (!integration) {
        res.status(404).json({
          error: 'Integração não encontrada',
        });
        return;
      }

      logger.info('Integração atualizada via API:', {
        integrationId: id,
        userId: req.user.id,
        updates,
      });

      res.json({
        message: 'Integração atualizada com sucesso',
        integration: {
          id: integration._id,
          campaignId: integration.campaignId,
          telegramGroupId: integration.telegramGroupId,
          telegramGroupTitle: integration.telegramGroupTitle,
          rewardLevels: integration.rewardLevels,
          isActive: integration.isActive,
          updatedAt: integration.updatedAt,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar integração via API:', error);
      res.status(500).json({
        error: error.message || 'Erro ao atualizar integração',
      });
    }
  }

  /**
   * Deletar integração
   * DELETE /api/integrations/:id
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      // Verificar se o usuário tem acesso
      const hasAccess = await integrationService.checkUserAccess(id, req.user.id);

      if (!hasAccess && req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado',
        });
        return;
      }

      await integrationService.deleteIntegration(id);

      logger.info('Integração deletada via API:', {
        integrationId: id,
        userId: req.user.id,
      });

      res.json({
        message: 'Integração deletada com sucesso',
      });
    } catch (error: any) {
      logger.error('Erro ao deletar integração via API:', error);
      res.status(500).json({
        error: error.message || 'Erro ao deletar integração',
      });
    }
  }

  /**
   * Ativar integração
   * POST /api/integrations/:id/activate
   */
  async activate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const hasAccess = await integrationService.checkUserAccess(id, req.user.id);

      if (!hasAccess && req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado',
        });
        return;
      }

      const integration = await integrationService.activateIntegration(id);

      if (!integration) {
        res.status(404).json({
          error: 'Integração não encontrada',
        });
        return;
      }

      res.json({
        message: 'Integração ativada com sucesso',
        integration: {
          id: integration._id,
          isActive: integration.isActive,
        },
      });
    } catch (error) {
      logger.error('Erro ao ativar integração via API:', error);
      res.status(500).json({
        error: 'Erro ao ativar integração',
      });
    }
  }

  /**
   * Desativar integração
   * POST /api/integrations/:id/deactivate
   */
  async deactivate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const hasAccess = await integrationService.checkUserAccess(id, req.user.id);

      if (!hasAccess && req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado',
        });
        return;
      }

      const integration = await integrationService.deactivateIntegration(id);

      if (!integration) {
        res.status(404).json({
          error: 'Integração não encontrada',
        });
        return;
      }

      res.json({
        message: 'Integração desativada com sucesso',
        integration: {
          id: integration._id,
          isActive: integration.isActive,
        },
      });
    } catch (error) {
      logger.error('Erro ao desativar integração via API:', error);
      res.status(500).json({
        error: 'Erro ao desativar integração',
      });
    }
  }

  /**
   * Regenerar API Key
   * POST /api/integrations/:id/regenerate-key
   */
  async regenerateApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const hasAccess = await integrationService.checkUserAccess(id, req.user.id);

      if (!hasAccess && req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado',
        });
        return;
      }

      const integration = await integrationService.regenerateApiKey(id);

      if (!integration) {
        res.status(404).json({
          error: 'Integração não encontrada',
        });
        return;
      }

      logger.info('API Key regenerada via API:', {
        integrationId: id,
        userId: req.user.id,
      });

      res.json({
        message: 'API Key regenerada com sucesso',
        apiKey: integration.apiKey,
      });
    } catch (error) {
      logger.error('Erro ao regenerar API key via API:', error);
      res.status(500).json({
        error: 'Erro ao regenerar API key',
      });
    }
  }
}

export default new IntegrationController();
