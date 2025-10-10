import axios from 'axios';
import Integration from '../models/Integration';
import memberService from './memberService';
import logger from '../config/logger';

/**
 * Interface para dados do apoiador da APOIA.se
 */
interface SupporterData {
  id: string;
  email: string;
  campaignId: string;
  rewardLevel: string;
  status: 'active' | 'inactive' | 'cancelled';
  paymentStatus: 'up_to_date' | 'overdue' | 'failed';
  lastPaymentDate?: Date;
}

/**
 * Serviço de verificação de apoiadores na APOIA.se
 */
export class VerificationService {
  private apoiaseApiUrl: string;
  private apoiaseApiKey: string;

  constructor() {
    this.apoiaseApiUrl = process.env.APOIASE_API_URL || 'https://api.apoia.se';
    this.apoiaseApiKey = process.env.APOIASE_API_KEY || '';
  }

  /**
   * Verifica status do apoiador na API da APOIA.se
   */
  async verifySupporterStatus(
    email: string,
    campaignId: string
  ): Promise<SupporterData | null> {
    try {
      // TODO: Implementar integração real com API da APOIA.se
      // Por enquanto, retornar mock para desenvolvimento

      logger.warn('Usando verificação mock - implementar API real da APOIA.se');

      // Mock para desenvolvimento
      const mockSupporter: SupporterData = {
        id: `supporter-${Date.now()}`,
        email,
        campaignId,
        rewardLevel: 'basic',
        status: 'active',
        paymentStatus: 'up_to_date',
        lastPaymentDate: new Date(),
      };

      // Em produção, fazer chamada real:
      /*
      const response = await axios.get(
        `${this.apoiaseApiUrl}/campaigns/${campaignId}/supporters`,
        {
          headers: {
            'Authorization': `Bearer ${this.apoiaseApiKey}`,
          },
          params: {
            email,
          },
        }
      );

      if (!response.data || !response.data.supporter) {
        return null;
      }

      return response.data.supporter;
      */

      return mockSupporter;
    } catch (error) {
      logger.error('Erro ao verificar apoiador na APOIA.se:', error);
      return null;
    }
  }

  /**
   * Verifica se apoiador tem acesso à integração
   */
  async checkSupporterAccess(
    email: string,
    integrationId: string
  ): Promise<{
    hasAccess: boolean;
    reason?: string;
    supporterData?: SupporterData;
  }> {
    try {
      const integration = await Integration.findById(integrationId);

      if (!integration) {
        return {
          hasAccess: false,
          reason: 'Integração não encontrada',
        };
      }

      if (!integration.isActive) {
        return {
          hasAccess: false,
          reason: 'Integração está inativa',
        };
      }

      // Verificar status na APOIA.se
      const supporterData = await this.verifySupporterStatus(
        email,
        integration.campaignId
      );

      if (!supporterData) {
        return {
          hasAccess: false,
          reason: 'Apoiador não encontrado na campanha',
        };
      }

      // Verificar se o apoio está ativo
      if (supporterData.status !== 'active') {
        return {
          hasAccess: false,
          reason: 'Apoio não está ativo',
          supporterData,
        };
      }

      // Verificar se o pagamento está em dia
      if (supporterData.paymentStatus !== 'up_to_date') {
        return {
          hasAccess: false,
          reason: 'Pagamento em atraso',
          supporterData,
        };
      }

      // Verificar se o nível de recompensa dá acesso
      if (
        integration.rewardLevels.length > 0 &&
        !integration.rewardLevels.includes(supporterData.rewardLevel)
      ) {
        return {
          hasAccess: false,
          reason: 'Nível de recompensa não dá acesso a este grupo',
          supporterData,
        };
      }

      return {
        hasAccess: true,
        supporterData,
      };
    } catch (error) {
      logger.error('Erro ao verificar acesso do apoiador:', error);
      return {
        hasAccess: false,
        reason: 'Erro ao verificar acesso',
      };
    }
  }

  /**
   * Processa verificação de apoiador e cria membro se elegível
   */
  async processSupporterVerification(
    email: string,
    integrationId: string,
    telegramUserId?: string,
    telegramUsername?: string
  ): Promise<{
    success: boolean;
    message: string;
    inviteLink?: string;
  }> {
    try {
      const accessCheck = await this.checkSupporterAccess(email, integrationId);

      if (!accessCheck.hasAccess) {
        return {
          success: false,
          message: accessCheck.reason || 'Acesso negado',
        };
      }

      // Se tem Telegram user ID, vincular imediatamente
      if (telegramUserId) {
        const member = await memberService.verifyAndLinkTelegramUser(
          email,
          telegramUserId,
          telegramUsername
        );

        if (member) {
          return {
            success: true,
            message: 'Verificação concluída! Você está liberado para acessar o grupo.',
          };
        }

        // Se não existe membro, criar
        const { member: newMember, inviteLink } = await memberService.createMember(
          integrationId,
          email,
          accessCheck.supporterData!.id
        );

        // Vincular Telegram
        await memberService.verifyAndLinkTelegramUser(
          email,
          telegramUserId,
          telegramUsername
        );

        return {
          success: true,
          message: 'Verificação concluída! Você está liberado para acessar o grupo.',
          inviteLink,
        };
      }

      // Se não tem Telegram user ID, apenas criar membro e gerar link
      const { inviteLink } = await memberService.createMember(
        integrationId,
        email,
        accessCheck.supporterData!.id
      );

      return {
        success: true,
        message: 'Link de convite gerado com sucesso!',
        inviteLink,
      };
    } catch (error) {
      logger.error('Erro ao processar verificação de apoiador:', error);
      return {
        success: false,
        message: 'Erro ao processar verificação',
      };
    }
  }

  /**
   * Verifica status de pagamento de todos os membros de uma integração
   */
  async syncIntegrationMembers(integrationId: string): Promise<{
    checked: number;
    updated: number;
    removed: number;
  }> {
    try {
      const integration = await Integration.findById(integrationId);

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      const members = await memberService.listMembersByIntegration(
        integrationId,
        'active'
      );

      let checked = 0;
      let updated = 0;
      let removed = 0;

      for (const member of members) {
        try {
          checked++;

          const supporterData = await this.verifySupporterStatus(
            member.supporterEmail,
            integration.campaignId
          );

          if (!supporterData) {
            // Apoiador não encontrado - remover
            await memberService.removeMember(
              member._id.toString(),
              'supporter_not_found'
            );
            removed++;
            continue;
          }

          // Verificar status
          const isPaymentOk =
            supporterData.status === 'active' &&
            supporterData.paymentStatus === 'up_to_date';

          if (!isPaymentOk && member.status === 'active') {
            await memberService.markPaymentOverdue(member._id.toString());
            updated++;
          } else if (isPaymentOk && member.status === 'payment_overdue') {
            await memberService.updatePaymentStatus(member._id.toString(), true);
            updated++;
          }
        } catch (error) {
          logger.error('Erro ao verificar membro individual:', {
            memberId: member._id,
            error,
          });
        }
      }

      logger.info('Sincronização de membros concluída:', {
        integrationId,
        checked,
        updated,
        removed,
      });

      return { checked, updated, removed };
    } catch (error) {
      logger.error('Erro ao sincronizar membros da integração:', error);
      throw error;
    }
  }

  /**
   * Verifica status de um único apoiador pelo email
   */
  async verifySingleSupporter(
    email: string,
    campaignId: string
  ): Promise<{
    isValid: boolean;
    status?: string;
    paymentStatus?: string;
    message: string;
  }> {
    try {
      const supporterData = await this.verifySupporterStatus(email, campaignId);

      if (!supporterData) {
        return {
          isValid: false,
          message: 'Apoiador não encontrado nesta campanha',
        };
      }

      const isValid =
        supporterData.status === 'active' &&
        supporterData.paymentStatus === 'up_to_date';

      return {
        isValid,
        status: supporterData.status,
        paymentStatus: supporterData.paymentStatus,
        message: isValid
          ? 'Apoiador válido e com pagamento em dia'
          : 'Apoiador com pendências',
      };
    } catch (error) {
      logger.error('Erro ao verificar apoiador único:', error);
      return {
        isValid: false,
        message: 'Erro ao verificar apoiador',
      };
    }
  }
}

export default new VerificationService();
