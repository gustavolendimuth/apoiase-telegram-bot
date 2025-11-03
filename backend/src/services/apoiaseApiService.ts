import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

/**
 * Resposta da API APOIA.se para verificação de apoiador
 */
interface BackerCheckResponse {
  isBacker: boolean;
  isPaidThisMonth: boolean;
  thisMonthPaidValue?: number;
}

/**
 * Credenciais da campanha para autenticação
 */
export interface CampaignCredentials {
  apiKey: string;
  bearerToken: string;
}

/**
 * Serviço para integração com a API da APOIA.se
 *
 * Documentação: https://apoiase.notion.site/APOIA-se-API-4b87651821884061a7532abfd7f26087
 *
 * Limitações:
 * - Máximo 5000 requisições por mês
 * - Máximo 5 requisições por segundo
 */
export class ApoiaseApiService {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseUrl = process.env.APOIASE_API_URL || 'https://api.apoia.se';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para logging de rate limiting
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          logger.warn('APOIA.se API rate limit atingido', {
            url: error.config?.url,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica se um email é apoiador ativo e com pagamento em dia
   *
   * @param email - Email do apoiador cadastrado na APOIA.se
   * @param credentials - Credenciais da campanha (apiKey + bearerToken)
   * @returns Status do apoiador
   */
  async checkBacker(
    email: string,
    credentials: CampaignCredentials
  ): Promise<BackerCheckResponse> {
    try {
      const response = await this.axiosInstance.get<BackerCheckResponse>(
        `/backers/charges/${encodeURIComponent(email)}`,
        {
          headers: {
            'x-api-key': credentials.apiKey,
            'authorization': `Bearer ${credentials.bearerToken}`,
          },
        }
      );

      logger.info('APOIA.se API - Apoiador verificado', {
        email: email.substring(0, 3) + '***', // Log parcial por privacidade
        isBacker: response.data.isBacker,
        isPaidThisMonth: response.data.isPaidThisMonth,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('APOIA.se API - Credenciais inválidas', {
          status: error.response.status,
        });
        throw new Error('Credenciais da campanha inválidas');
      }

      if (error.response?.status === 404) {
        // Email não encontrado - retornar como não-apoiador
        logger.info('APOIA.se API - Email não encontrado', {
          email: email.substring(0, 3) + '***',
        });
        return {
          isBacker: false,
          isPaidThisMonth: false,
        };
      }

      logger.error('APOIA.se API - Erro ao verificar apoiador', {
        error: error.message,
        status: error.response?.status,
      });

      throw error;
    }
  }

  /**
   * Verifica se apoiador tem acesso baseado no status
   *
   * @param email - Email do apoiador
   * @param credentials - Credenciais da campanha
   * @returns Se tem acesso e motivo (se negado)
   */
  async checkAccess(
    email: string,
    credentials: CampaignCredentials
  ): Promise<{
    hasAccess: boolean;
    reason?: string;
    paidValue?: number;
  }> {
    try {
      const backerStatus = await this.checkBacker(email, credentials);

      if (!backerStatus.isBacker) {
        return {
          hasAccess: false,
          reason: 'Email não está registrado como apoiador desta campanha',
        };
      }

      if (!backerStatus.isPaidThisMonth) {
        return {
          hasAccess: false,
          reason: 'Pagamento do mês atual pendente ou não confirmado',
        };
      }

      return {
        hasAccess: true,
        paidValue: backerStatus.thisMonthPaidValue,
      };
    } catch (error) {
      logger.error('Erro ao verificar acesso do apoiador', { error });
      throw error;
    }
  }

  /**
   * Valida se as credenciais da campanha são válidas
   * Faz uma requisição de teste para verificar autenticação
   *
   * @param credentials - Credenciais a serem validadas
   * @returns Se as credenciais são válidas
   */
  async validateCredentials(
    credentials: CampaignCredentials
  ): Promise<boolean> {
    try {
      // Usa um email de teste para validar as credenciais
      // A APOIA.se retorna 401 se as credenciais estiverem erradas
      await this.axiosInstance.get(
        `/backers/charges/test@example.com`,
        {
          headers: {
            'x-api-key': credentials.apiKey,
            'authorization': `Bearer ${credentials.bearerToken}`,
          },
        }
      );

      // Se não deu 401, as credenciais são válidas (mesmo que o email não exista)
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return false;
      }

      // Outros erros (404, 429, etc) indicam que as credenciais funcionaram
      if (error.response?.status) {
        return true;
      }

      // Erro de rede ou timeout
      logger.error('Erro ao validar credenciais da APOIA.se', {
        error: error.message,
      });
      throw error;
    }
  }
}

export default new ApoiaseApiService();
