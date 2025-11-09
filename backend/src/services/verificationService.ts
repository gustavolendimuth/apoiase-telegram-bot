import axios from 'axios';
import Integration from '../models/Integration';
import Support from '../models/Support';
import User from '../models/User';
import Campaign from '../models/Campaign';
import memberService from './memberService';
import logger from '../config/logger';

/**
 * Interface para dados do apoiador da APOIA.se
 */
interface SupporterData {
  id: string;
  email: string;
  campaignId: string;
  supportLevel: string; // Nível de apoio
  amount: number; // Valor da contribuição
  status: 'active' | 'inactive' | 'cancelled';
  paymentStatus: 'up_to_date' | 'overdue' | 'failed';
  lastPaymentDate?: Date;
}

/**
 * Serviço de verificação de apoiadores (API interna)
 */
export class VerificationService {
  /**
   * Verifica status do apoiador usando modelo Support interno
   */
  async verifySupporterStatus(
    email: string,
    campaignId: string
  ): Promise<SupporterData | null> {
    try {
      // Buscar usuário pelo email
      const user = await User.findOne({ email });

      if (!user) {
        logger.info('Usuário não encontrado para email:', email.substring(0, 3) + '***');
        return null;
      }

      // Buscar apoio ativo para esta campanha
      const support = await Support.findOne({
        userId: user._id,
        campaignId,
        status: { $in: ['active', 'paused', 'payment_failed'] },
      });

      if (!support) {
        logger.info('Apoio não encontrado para usuário e campanha');
        return null;
      }

      // Determinar status e payment status
      const isActive = support.status === 'active';
      const isPaymentOk = support.status === 'active'; // Se status for active, pagamento está ok

      const supporterData: SupporterData = {
        id: (support._id as any).toString(),
        email: user.email,
        campaignId: campaignId,
        supportLevel: support.rewardLevelId || 'basic', // Renomeado de rewardLevel para supportLevel
        amount: support.amount, // Incluir valor da contribuição
        status: isActive ? 'active' : support.status === 'cancelled' ? 'cancelled' : 'inactive',
        paymentStatus: isPaymentOk ? 'up_to_date' : support.status === 'payment_failed' ? 'failed' : 'overdue',
        lastPaymentDate: support.lastPaymentDate,
      };

      logger.info('Apoiador verificado com sucesso', {
        supportId: support._id,
        status: supporterData.status,
        paymentStatus: supporterData.paymentStatus,
      });

      return supporterData;
    } catch (error) {
      logger.error('Erro ao verificar apoiador:', error);
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
        integration.campaignId.toString()
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

      // Verificar acesso baseado no nível mínimo de apoio (hierárquico)
      if (integration.minSupportLevel) {
        // Buscar campanha para obter a hierarquia de níveis de apoio
        const campaign = await Campaign.findById(integration.campaignId);

        if (!campaign) {
          return {
            hasAccess: false,
            reason: 'Campanha não encontrada',
            supporterData,
          };
        }

        // Encontrar o nível mínimo configurado e o nível do usuário
        const minLevel = campaign.rewardLevels.find(
          (level) => level.id === integration.minSupportLevel
        );
        const userLevel = campaign.rewardLevels.find(
          (level) => level.id === supporterData.supportLevel
        );

        // Se não encontrou o nível do usuário ou o nível mínimo, negar acesso
        if (!userLevel) {
          return {
            hasAccess: false,
            reason: 'Nível de apoio não encontrado',
            supporterData,
          };
        }

        if (!minLevel) {
          logger.warn('Nível mínimo configurado não encontrado na campanha', {
            integrationId: integration._id,
            minSupportLevel: integration.minSupportLevel,
          });
          // Permitir acesso se o nível mínimo configurado não existe mais
        } else {
          // Verificar se o valor do apoio do usuário é >= ao valor mínimo
          if (userLevel.amount < minLevel.amount) {
            return {
              hasAccess: false,
              reason: `Nível de apoio insuficiente. Necessário: ${minLevel.title} (${minLevel.amount}) ou superior`,
              supporterData,
            };
          }
        }
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
            integration.campaignId.toString()
          );

          if (!supporterData) {
            // Apoiador não encontrado - remover
            await memberService.removeMember(
              (member._id as any).toString(),
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
            await memberService.markPaymentOverdue((member._id as any).toString());
            updated++;
          } else if (isPaymentOk && member.status === 'payment_overdue') {
            await memberService.updatePaymentStatus((member._id as any).toString(), true);
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
