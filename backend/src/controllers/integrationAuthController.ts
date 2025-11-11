import { Request, Response } from 'express';
import integrationAuthService, { TelegramAuthData } from '../services/integrationAuthService';
import logger from '../config/logger';
import type {
  InitiateAuthResponse,
  TelegramAuthResponse,
  ListGroupsResponse,
  SelectGroupResponse,
  CompleteIntegrationResponse,
  GetSessionResponse,
  CancelAuthResponse,
  ApiErrorResponse,
} from '@shared/types';

/**
 * Controller para gerenciar fluxo de autorização OAuth-like
 */
export class IntegrationAuthController {
  /**
   * GET /integration/authorize
   * Inicia fluxo de autorização OAuth-like
   */
  async initiateAuthorization(
    req: Request,
    res: Response<InitiateAuthResponse | ApiErrorResponse>
  ) {
    try {
      const { campaign_slug, api_key, bearer_token, redirect_uri } = req.query;

      // Validar parâmetros
      if (!campaign_slug || !api_key || !bearer_token || !redirect_uri) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios ausentes',
          message: 'Os parâmetros campaign_slug, api_key, bearer_token e redirect_uri são obrigatórios',
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
          success: false,
          error: result.error || 'Erro ao iniciar autorização',
        });
      }

      // Retornar state token e dados da campanha
      res.json({
        success: true,
        data: {
          stateToken: result.stateToken!,
          campaign: result.campaign!,
          redirectUrl: `/integration/authorize?state=${result.stateToken}`,
        },
      });
    } catch (error: any) {
      logger.error('Erro no controller de autorização', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao iniciar autorização',
        message: 'Erro interno ao processar autorização. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * POST /integration/telegram-auth
   * Processa autenticação do Telegram Login Widget
   */
  async processTelegramAuth(
    req: Request,
    res: Response<TelegramAuthResponse | ApiErrorResponse>
  ) {
    try {
      const { stateToken, authData } = req.body;

      if (!stateToken) {
        return res.status(400).json({
          success: false,
          error: 'State token obrigatório',
        });
      }

      if (!authData) {
        return res.status(400).json({
          success: false,
          error: 'Dados de autenticação obrigatórios',
        });
      }

      // Validar dados do Telegram
      const requiredFields = ['id', 'first_name', 'auth_date', 'hash'];
      for (const field of requiredFields) {
        if (!(field in authData)) {
          return res.status(400).json({
            success: false,
            error: `Campo obrigatório ausente: ${field}`,
          });
        }
      }

      const result = await integrationAuthService.processTelegramAuth(
        stateToken,
        authData as TelegramAuthData
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Erro ao processar autenticação',
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Autenticação Telegram confirmada',
          authenticated: true,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao processar Telegram auth', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao processar autenticação',
        message: 'Erro interno ao autenticar com Telegram. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * GET /integration/available-groups
   * Lista grupos disponíveis onde o bot é administrador
   */
  async listAvailableGroups(
    req: Request,
    res: Response<ListGroupsResponse | ApiErrorResponse>
  ) {
    try {
      const { stateToken } = req.query;

      if (!stateToken) {
        return res.status(400).json({
          success: false,
          error: 'State token obrigatório',
        });
      }

      // Verificar se sessão é válida
      const session = await integrationAuthService.getSession(stateToken as string);

      if (!session || !session.isValid()) {
        return res.status(400).json({
          success: false,
          error: 'Sessão inválida ou expirada',
        });
      }

      // Obter serviço de descoberta de grupos
      const telegramService = (await import('../services/telegramService')).default;
      const groupDiscovery = telegramService.getGroupDiscoveryService();

      if (!groupDiscovery) {
        return res.status(500).json({
          success: false,
          error: 'Serviço de descoberta de grupos não disponível',
        });
      }

      // Listar grupos disponíveis
      const groups = await groupDiscovery.listAvailableGroups();

      res.json({
        success: true,
        data: {
          groups: groups.map(g => ({
            id: g.id,
            title: g.title,
            type: g.type,
            memberCount: g.memberCount,
            hasExistingMembers: g.memberCount !== undefined && g.memberCount > 1,
          })),
        },
      });
    } catch (error: any) {
      logger.error('Erro ao listar grupos', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao listar grupos disponíveis',
        message: 'Erro interno ao buscar grupos. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * POST /integration/select-group
   * Processa seleção do grupo Telegram
   */
  async selectGroup(
    req: Request,
    res: Response<SelectGroupResponse | ApiErrorResponse>
  ) {
    try {
      const { stateToken, groupId, groupTitle } = req.body;

      if (!stateToken || !groupId || !groupTitle) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios ausentes',
          message: 'Os parâmetros stateToken, groupId e groupTitle são obrigatórios',
        });
      }

      const result = await integrationAuthService.processGroupSelection(
        stateToken,
        groupId,
        groupTitle
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Erro ao selecionar grupo',
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Grupo selecionado com sucesso',
          warning: result.warning,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao selecionar grupo', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao selecionar grupo',
        message: 'Erro interno ao selecionar grupo. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * POST /integration/complete
   * Finaliza autorização e cria integração
   */
  async completeAuthorization(
    req: Request,
    res: Response<CompleteIntegrationResponse | ApiErrorResponse>
  ) {
    try {
      const { stateToken } = req.body;

      if (!stateToken) {
        return res.status(400).json({
          success: false,
          error: 'State token obrigatório',
        });
      }

      const result = await integrationAuthService.completeAuthorization(stateToken);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Erro ao completar autorização',
        });
      }

      res.json({
        success: true,
        data: {
          integration: result.integration!,
          integrationId: result.integrationId!,
          message: 'Integração criada com sucesso!',
        },
      });
    } catch (error: any) {
      logger.error('Erro ao completar autorização', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao finalizar integração',
        message: 'Erro interno ao criar integração. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * GET /integration/session/:stateToken
   * Busca informações da sessão de autorização
   */
  async getSession(
    req: Request,
    res: Response<GetSessionResponse | ApiErrorResponse>
  ) {
    try {
      const { stateToken } = req.params;

      const session = await integrationAuthService.getSession(stateToken);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Sessão não encontrada',
        });
      }

      // Retornar apenas dados seguros (sem credenciais)
      res.json({
        success: true,
        data: {
          session: {
            stateToken: session.stateToken,
            status: session.status,
            campaignSlug: session.campaignSlug,
            telegramUserId: session.telegramUserId,
            telegramUsername: session.telegramUsername,
            telegramGroupId: session.selectedGroupId,
            telegramGroupTitle: session.selectedGroupTitle,
          },
        },
      });
    } catch (error: any) {
      logger.error('Erro ao buscar sessão', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar sessão',
        message: 'Erro interno ao buscar sessão. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * POST /integration/cancel
   * Cancela autorização
   */
  async cancelAuthorization(
    req: Request,
    res: Response<CancelAuthResponse | ApiErrorResponse>
  ) {
    try {
      const { stateToken } = req.body;

      if (!stateToken) {
        return res.status(400).json({
          success: false,
          error: 'State token obrigatório',
        });
      }

      await integrationAuthService.cancelAuthorization(stateToken);

      res.json({
        success: true,
        data: {
          message: 'Autorização cancelada',
        },
      });
    } catch (error: any) {
      logger.error('Erro ao cancelar autorização', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Erro ao cancelar autorização',
        message: 'Erro interno ao cancelar. Tente novamente mais tarde.',
      });
    }
  }

  /**
   * GET /integration/callback
   * Endpoint de callback que redireciona de volta ao APOIA.se
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
