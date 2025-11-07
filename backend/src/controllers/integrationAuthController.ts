import { Request, Response } from 'express';
import integrationAuthService, { TelegramAuthData } from '../services/integrationAuthService';
import logger from '../config/logger';

/**
 * Controller para gerenciar fluxo de autorização OAuth-like
 */
export class IntegrationAuthController {
  /**
   * GET /integration/authorize
   * Inicia fluxo de autorização OAuth-like
   * Query params esperados (do APOIA.se):
   * - campaign_slug: slug da campanha
   * - api_key: chave temporária
   * - bearer_token: token temporário
   * - redirect_uri: URL de callback do APOIA.se
   */
  async initiateAuthorization(req: Request, res: Response) {
    try {
      const { campaign_slug, api_key, bearer_token, redirect_uri } = req.query;

      // Validar parâmetros
      if (!campaign_slug || !api_key || !bearer_token || !redirect_uri) {
        return res.status(400).json({
          error: 'Parâmetros obrigatórios ausentes',
          required: ['campaign_slug', 'api_key', 'bearer_token', 'redirect_uri'],
        });
      }

      // Iniciar autorização
      const result = await integrationAuthService.initiateAuthorization({
        campaignSlug: campaign_slug as string,
        apiKey: api_key as string,
        bearerToken: bearer_token as string,
        redirectUri: redirect_uri as string,
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
        });
      }

      // Retornar state token e dados da campanha
      res.json({
        success: true,
        stateToken: result.stateToken,
        campaign: result.campaign,
      });
    } catch (error: any) {
      logger.error('Erro no controller de autorização', { error: error.message });
      res.status(500).json({
        error: 'Erro ao iniciar autorização',
      });
    }
  }

  /**
   * POST /integration/telegram-auth
   * Processa autenticação do Telegram Login Widget
   */
  async processTelegramAuth(req: Request, res: Response) {
    try {
      const { stateToken, ...telegramData } = req.body;

      if (!stateToken) {
        return res.status(400).json({
          error: 'State token obrigatório',
        });
      }

      // Validar dados do Telegram
      const requiredFields = ['id', 'first_name', 'auth_date', 'hash'];
      for (const field of requiredFields) {
        if (!(field in telegramData)) {
          return res.status(400).json({
            error: `Campo obrigatório ausente: ${field}`,
          });
        }
      }

      const result = await integrationAuthService.processTelegramAuth(
        stateToken,
        telegramData as TelegramAuthData
      );

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Autenticação Telegram confirmada',
      });
    } catch (error: any) {
      logger.error('Erro ao processar Telegram auth', { error: error.message });
      res.status(500).json({
        error: 'Erro ao processar autenticação',
      });
    }
  }

  /**
   * POST /integration/select-group
   * Processa seleção do grupo Telegram
   */
  async selectGroup(req: Request, res: Response) {
    try {
      const { stateToken, groupId, groupTitle } = req.body;

      if (!stateToken || !groupId || !groupTitle) {
        return res.status(400).json({
          error: 'Parâmetros obrigatórios ausentes',
          required: ['stateToken', 'groupId', 'groupTitle'],
        });
      }

      const result = await integrationAuthService.processGroupSelection(
        stateToken,
        groupId,
        groupTitle
      );

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Grupo selecionado com sucesso',
        warning: result.warning,
      });
    } catch (error: any) {
      logger.error('Erro ao selecionar grupo', { error: error.message });
      res.status(500).json({
        error: 'Erro ao selecionar grupo',
      });
    }
  }

  /**
   * POST /integration/complete
   * Finaliza autorização e cria integração
   * Público - validado por state token
   */
  async completeAuthorization(req: Request, res: Response) {
    try {
      const { stateToken } = req.body;

      if (!stateToken) {
        return res.status(400).json({
          error: 'State token obrigatório',
        });
      }

      const result = await integrationAuthService.completeAuthorization(stateToken);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
        });
      }

      res.json({
        success: true,
        integrationId: result.integrationId,
        integration: result.integration,
      });
    } catch (error: any) {
      logger.error('Erro ao completar autorização', { error: error.message });
      res.status(500).json({
        error: 'Erro ao finalizar integração',
      });
    }
  }

  /**
   * GET /integration/session/:stateToken
   * Busca informações da sessão de autorização
   */
  async getSession(req: Request, res: Response) {
    try {
      const { stateToken } = req.params;

      const session = await integrationAuthService.getSession(stateToken);

      if (!session) {
        return res.status(404).json({
          error: 'Sessão não encontrada',
        });
      }

      // Retornar apenas dados seguros (sem credenciais)
      res.json({
        stateToken: session.stateToken,
        campaignSlug: session.campaignSlug,
        redirectUri: session.redirectUri,
        status: session.status,
        telegramUserId: session.telegramUserId,
        telegramUsername: session.telegramUsername,
        telegramFirstName: session.telegramFirstName,
        selectedGroupId: session.selectedGroupId,
        selectedGroupTitle: session.selectedGroupTitle,
        expiresAt: session.expiresAt,
        isValid: session.isValid(),
      });
    } catch (error: any) {
      logger.error('Erro ao buscar sessão', { error: error.message });
      res.status(500).json({
        error: 'Erro ao buscar sessão',
      });
    }
  }

  /**
   * POST /integration/cancel
   * Cancela autorização
   */
  async cancelAuthorization(req: Request, res: Response) {
    try {
      const { stateToken } = req.body;

      if (!stateToken) {
        return res.status(400).json({
          error: 'State token obrigatório',
        });
      }

      await integrationAuthService.cancelAuthorization(stateToken);

      res.json({
        success: true,
        message: 'Autorização cancelada',
      });
    } catch (error: any) {
      logger.error('Erro ao cancelar autorização', { error: error.message });
      res.status(500).json({
        error: 'Erro ao cancelar autorização',
      });
    }
  }

  /**
   * GET /integration/available-groups
   * Lista grupos disponíveis onde o bot é administrador
   * Requer state token válido
   */
  async listAvailableGroups(req: Request, res: Response) {
    try {
      const { stateToken } = req.query;

      if (!stateToken) {
        return res.status(400).json({
          error: 'State token obrigatório',
        });
      }

      // Verificar se sessão é válida
      const session = await integrationAuthService.getSession(stateToken as string);

      if (!session || !session.isValid()) {
        return res.status(400).json({
          error: 'Sessão inválida ou expirada',
        });
      }

      // Obter serviço de descoberta de grupos da instância singleton do TelegramService
      const telegramService = (await import('../services/telegramService')).default;
      const groupDiscovery = telegramService.getGroupDiscoveryService();

      if (!groupDiscovery) {
        return res.status(500).json({
          error: 'Serviço de descoberta de grupos não disponível',
        });
      }

      // Listar grupos disponíveis
      const groups = await groupDiscovery.listAvailableGroups();

      res.json({
        success: true,
        groups: groups.map(g => ({
          id: g.id,
          title: g.title,
          type: g.type,
          memberCount: g.memberCount,
          hasExistingMembers: g.memberCount !== undefined && g.memberCount > 1, // >1 porque bot conta como membro
        })),
      });
    } catch (error: any) {
      logger.error('Erro ao listar grupos', { error: error.message });
      res.status(500).json({
        error: 'Erro ao listar grupos disponíveis',
      });
    }
  }

  /**
   * GET /integration/callback
   * Endpoint de callback que redireciona de volta ao APOIA.se
   * Usado quando o processo é concluído
   */
  async handleCallback(req: Request, res: Response) {
    try {
      const { state, integration_id, status } = req.query;

      // Se há uma URL de callback na sessão, redirecionar
      if (state) {
        const session = await integrationAuthService.getSession(state as string);

        if (session && session.redirectUri) {
          const callbackUrl = new URL(session.redirectUri);
          callbackUrl.searchParams.set('state', state as string);
          callbackUrl.searchParams.set('status', status as string || 'success');

          if (integration_id) {
            callbackUrl.searchParams.set('integration_id', integration_id as string);
          }

          return res.redirect(callbackUrl.toString());
        }
      }

      // Se não há callback, mostrar mensagem de sucesso
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Integração Telegram - Concluída</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 3rem;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .success { color: #22c55e; font-size: 3rem; margin-bottom: 1rem; }
              .error { color: #ef4444; font-size: 3rem; margin-bottom: 1rem; }
              h1 { margin: 0 0 0.5rem 0; }
              p { color: #666; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="${status === 'success' ? 'success' : 'error'}">
                ${status === 'success' ? '✓' : '✗'}
              </div>
              <h1>${status === 'success' ? 'Integração Concluída!' : 'Erro na Integração'}</h1>
              <p>${status === 'success'
                ? 'Você pode fechar esta janela e voltar ao APOIA.se.'
                : 'Ocorreu um erro. Por favor, tente novamente.'
              }</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      logger.error('Erro no callback', { error: error.message });
      res.status(500).send('Erro ao processar callback');
    }
  }
}

export default new IntegrationAuthController();
