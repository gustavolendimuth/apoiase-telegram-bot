import crypto from 'crypto';
import Member, { IMember } from '../models/Member';
import Integration from '../models/Integration';
import EventLog from '../models/EventLog';
import telegramService from './telegramService';
import logger from '../config/logger';

/**
 * Serviço de gerenciamento de membros
 */
export class MemberService {
  /**
   * Gera token único para link de convite
   */
  private generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cria um novo membro (apoiador) e gera link de convite
   */
  async createMember(
    integrationId: string,
    supporterEmail: string,
    supporterId: string
  ): Promise<{
    member: IMember;
    inviteLink: string;
  }> {
    try {
      const integration = await Integration.findById(integrationId);

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      if (!integration.isActive) {
        throw new Error('Integração está inativa');
      }

      // Verificar se já existe membro para este apoiador
      let member = await Member.findOne({
        integrationId,
        supporterEmail: supporterEmail.toLowerCase(),
      });

      if (member) {
        // Se já existe mas foi removido, reativar
        if (member.status === 'removed') {
          member.status = 'pending_verification';
          member.removedAt = undefined;
        }
      } else {
        // Criar novo membro
        member = await Member.create({
          integrationId,
          supporterEmail: supporterEmail.toLowerCase(),
          supporterId,
          status: 'pending_verification',
        });
      }

      // Gerar novo token de convite
      const inviteToken = this.generateInviteToken();
      const expirationHours = parseInt(
        process.env.INVITE_LINK_EXPIRATION_HOURS || '24'
      );
      const inviteExpiresAt = new Date(
        Date.now() + expirationHours * 60 * 60 * 1000
      );

      member.inviteToken = inviteToken;
      member.inviteExpiresAt = inviteExpiresAt;
      await member.save();

      // Gerar link de convite do Telegram
      const telegramInviteLink = await telegramService.createInviteLink(
        parseInt(integration.telegramGroupId),
        expirationHours * 3600 // converter para segundos
      );

      // Registrar evento
      await EventLog.create({
        eventType: 'member_joined',
        integrationId: integration._id,
        memberId: member._id,
        metadata: {
          supporterEmail,
          supporterId,
        },
      });

      logger.info('Membro criado e link gerado:', {
        memberId: member._id,
        integrationId,
        supporterEmail,
      });

      return {
        member,
        inviteLink: telegramInviteLink,
      };
    } catch (error) {
      logger.error('Erro ao criar membro:', error);
      throw error;
    }
  }

  /**
   * Busca membro pelo token de convite
   */
  async getMemberByInviteToken(inviteToken: string): Promise<IMember | null> {
    try {
      const member = await Member.findOne({
        inviteToken,
        inviteExpiresAt: { $gt: new Date() }, // Não expirado
      });

      return member;
    } catch (error) {
      logger.error('Erro ao buscar membro por token:', error);
      throw error;
    }
  }

  /**
   * Verifica e vincula usuário do Telegram ao membro
   */
  async verifyAndLinkTelegramUser(
    email: string,
    telegramUserId: string,
    telegramUsername?: string
  ): Promise<IMember | null> {
    try {
      const member = await Member.findOne({
        supporterEmail: email.toLowerCase(),
        status: { $in: ['pending_verification', 'active'] },
      });

      if (!member) {
        logger.warn('Membro não encontrado para verificação:', { email });
        return null;
      }

      // Atualizar dados do Telegram
      member.telegramUserId = telegramUserId;
      member.telegramUsername = telegramUsername;
      member.status = 'active';
      member.verifiedAt = new Date();

      if (!member.joinedAt) {
        member.joinedAt = new Date();
      }

      await member.save();

      // Registrar evento
      await EventLog.create({
        eventType: 'member_verified',
        integrationId: member.integrationId,
        memberId: member._id,
        userId: telegramUserId,
        metadata: {
          email,
          telegramUsername,
        },
      });

      logger.info('Membro verificado e vinculado:', {
        memberId: member._id,
        email,
        telegramUserId,
      });

      return member;
    } catch (error) {
      logger.error('Erro ao verificar membro:', error);
      throw error;
    }
  }

  /**
   * Lista membros de uma integração
   */
  async listMembersByIntegration(
    integrationId: string,
    status?: string
  ): Promise<IMember[]> {
    try {
      const query: any = { integrationId };

      if (status) {
        query.status = status;
      }

      const members = await Member.find(query).sort({ createdAt: -1 });

      return members;
    } catch (error) {
      logger.error('Erro ao listar membros:', error);
      throw error;
    }
  }

  /**
   * Remove membro do grupo
   */
  async removeMember(
    memberId: string,
    reason: string = 'manual'
  ): Promise<void> {
    try {
      const member = await Member.findById(memberId).populate('integrationId');

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      // Se tem Telegram ID, remover do grupo
      if (member.telegramUserId) {
        const integration: any = member.integrationId;

        if (integration) {
          try {
            await telegramService.removeUserFromGroup(
              parseInt(integration.telegramGroupId),
              parseInt(member.telegramUserId)
            );
          } catch (error) {
            logger.warn('Erro ao remover usuário do Telegram:', error);
          }
        }
      }

      // Atualizar status
      member.status = 'removed';
      member.removedAt = new Date();
      await member.save();

      // Registrar evento
      await EventLog.create({
        eventType: 'member_removed',
        integrationId: member.integrationId,
        memberId: member._id,
        userId: member.telegramUserId,
        metadata: {
          reason,
        },
      });

      logger.info('Membro removido:', {
        memberId,
        reason,
      });
    } catch (error) {
      logger.error('Erro ao remover membro:', error);
      throw error;
    }
  }

  /**
   * Marca membro como com pagamento em atraso
   */
  async markPaymentOverdue(memberId: string): Promise<void> {
    try {
      const member = await Member.findById(memberId);

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      member.status = 'payment_overdue';
      member.lastPaymentCheck = new Date();
      await member.save();

      // Registrar evento
      await EventLog.create({
        eventType: 'payment_overdue',
        integrationId: member.integrationId,
        memberId: member._id,
        userId: member.telegramUserId,
      });

      logger.info('Membro marcado como pagamento em atraso:', {
        memberId,
      });
    } catch (error) {
      logger.error('Erro ao marcar pagamento em atraso:', error);
      throw error;
    }
  }

  /**
   * Envia aviso de remoção para membro
   */
  async sendRemovalWarning(memberId: string): Promise<void> {
    try {
      const member = await Member.findById(memberId);

      if (!member || !member.telegramUserId) {
        return;
      }

      const warningMessage =
        '⚠️ *Aviso de Remoção*\n\n' +
        'Detectamos que seu pagamento está em atraso.\n\n' +
        'Você tem 48 horas para regularizar sua situação, ' +
        'caso contrário será removido do grupo automaticamente.\n\n' +
        'Para regularizar, acesse seu apoio na APOIA.se.';

      await telegramService.sendMessage(
        parseInt(member.telegramUserId),
        warningMessage
      );

      member.removalWarningAt = new Date();
      await member.save();

      // Registrar evento
      await EventLog.create({
        eventType: 'warning_sent',
        integrationId: member.integrationId,
        memberId: member._id,
        userId: member.telegramUserId,
      });

      logger.info('Aviso de remoção enviado:', {
        memberId,
      });
    } catch (error) {
      logger.error('Erro ao enviar aviso de remoção:', error);
    }
  }

  /**
   * Busca membros que devem ser removidos
   * (pagamento em atraso há mais de X dias)
   */
  async getMembersToRemove(): Promise<IMember[]> {
    try {
      const toleranceDays = parseInt(
        process.env.REMOVAL_TOLERANCE_DAYS || '7'
      );
      const toleranceDate = new Date(
        Date.now() - toleranceDays * 24 * 60 * 60 * 1000
      );

      const members = await Member.find({
        status: 'payment_overdue',
        lastPaymentCheck: { $lt: toleranceDate },
      });

      return members;
    } catch (error) {
      logger.error('Erro ao buscar membros para remoção:', error);
      throw error;
    }
  }

  /**
   * Busca membros que devem receber aviso de remoção
   */
  async getMembersToWarn(): Promise<IMember[]> {
    try {
      const warningHours = parseInt(
        process.env.REMOVAL_WARNING_HOURS || '48'
      );
      const removalDate = new Date(
        Date.now() + warningHours * 60 * 60 * 1000
      );

      // Membros em atraso que ainda não receberam aviso
      const members = await Member.find({
        status: 'payment_overdue',
        removalWarningAt: { $exists: false },
      });

      return members;
    } catch (error) {
      logger.error('Erro ao buscar membros para avisar:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de pagamento do membro
   */
  async updatePaymentStatus(
    memberId: string,
    isPaymentOk: boolean
  ): Promise<void> {
    try {
      const member = await Member.findById(memberId);

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      if (isPaymentOk && member.status === 'payment_overdue') {
        member.status = 'active';
        member.removalWarningAt = undefined;
      } else if (!isPaymentOk && member.status === 'active') {
        member.status = 'payment_overdue';
      }

      member.lastPaymentCheck = new Date();
      await member.save();

      logger.info('Status de pagamento atualizado:', {
        memberId,
        newStatus: member.status,
      });
    } catch (error) {
      logger.error('Erro ao atualizar status de pagamento:', error);
      throw error;
    }
  }
}

export default new MemberService();
