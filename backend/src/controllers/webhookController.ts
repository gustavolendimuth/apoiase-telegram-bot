import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';
import memberService from '../services/memberService';
import verificationService from '../services/verificationService';
import Integration from '../models/Integration';
import EventLog from '../models/EventLog';

/**
 * Controller de webhooks
 */
export class WebhookController {
  /**
   * Valida assinatura do webhook da APOIA.se
   */
  private validateApoiaseSignature(
    payload: string,
    signature: string
  ): boolean {
    const secret = process.env.APOIASE_WEBHOOK_SECRET || '';

    if (!secret) {
      logger.warn('APOIASE_WEBHOOK_SECRET não configurado');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Webhook da APOIA.se
   * POST /webhook/apoiase
   */
  async apoiaseWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-apoiase-signature'] as string;
      const payload = JSON.stringify(req.body);

      // Validar assinatura (em produção)
      if (process.env.NODE_ENV === 'production') {
        if (!signature || !this.validateApoiaseSignature(payload, signature)) {
          logger.warn('Assinatura inválida no webhook APOIA.se');
          res.status(401).json({ error: 'Assinatura inválida' });
          return;
        }
      }

      const { event, data } = req.body;

      logger.info('Webhook APOIA.se recebido:', { event, data });

      switch (event) {
        case 'supporter.created':
        case 'supporter.updated':
          await this.handleSupporterUpdated(data);
          break;

        case 'supporter.deleted':
        case 'supporter.cancelled':
          await this.handleSupporterDeleted(data);
          break;

        case 'payment.succeeded':
          await this.handlePaymentSucceeded(data);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(data);
          break;

        default:
          logger.warn('Evento desconhecido do webhook APOIA.se:', event);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Erro ao processar webhook APOIA.se:', error);
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  /**
   * Handler para apoiador criado/atualizado
   */
  private async handleSupporterUpdated(data: any): Promise<void> {
    try {
      const { supporterId, supporterEmail, campaignId, rewardLevel, status } =
        data;

      // Buscar integrações desta campanha
      const integrations = await Integration.find({
        campaignId,
        isActive: true,
      });

      if (integrations.length === 0) {
        logger.info('Nenhuma integração ativa para esta campanha:', campaignId);
        return;
      }

      for (const integration of integrations) {
        // Verificar acesso (agora inclui verificação de rewardLevels ou minAmount)
        const accessCheck = await verificationService.checkSupporterAccess(
          supporterEmail,
          integration._id.toString()
        );

        if (accessCheck.hasAccess) {
          // Criar membro e gerar link de convite
          const result = await memberService.createMember(
            integration._id.toString(),
            supporterEmail,
            supporterId
          );

          logger.info('Membro criado via webhook:', {
            email: supporterEmail,
            integrationId: integration._id,
          });

          // TODO: Enviar link de convite por email
        }
      }
    } catch (error) {
      logger.error('Erro ao processar apoiador atualizado:', error);
    }
  }

  /**
   * Handler para apoiador deletado/cancelado
   */
  private async handleSupporterDeleted(data: any): Promise<void> {
    try {
      const { supporterEmail, campaignId } = data;

      // Buscar integrações desta campanha
      const integrations = await Integration.find({
        campaignId,
      });

      for (const integration of integrations) {
        const members = await memberService.listMembersByIntegration(
          integration._id.toString()
        );

        // Buscar membro pelo email
        const member = members.find(
          (m) => m.supporterEmail.toLowerCase() === supporterEmail.toLowerCase()
        );

        if (member) {
          await memberService.removeMember(
            member._id.toString(),
            'supporter_cancelled'
          );

          logger.info('Membro removido via webhook:', {
            email: supporterEmail,
            integrationId: integration._id,
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao processar apoiador deletado:', error);
    }
  }

  /**
   * Handler para pagamento bem-sucedido
   */
  private async handlePaymentSucceeded(data: any): Promise<void> {
    try {
      const { supporterEmail, campaignId } = data;

      // Buscar integrações desta campanha
      const integrations = await Integration.find({
        campaignId,
      });

      for (const integration of integrations) {
        const members = await memberService.listMembersByIntegration(
          integration._id.toString()
        );

        const member = members.find(
          (m) => m.supporterEmail.toLowerCase() === supporterEmail.toLowerCase()
        );

        if (member && member.status === 'payment_overdue') {
          await memberService.updatePaymentStatus(
            member._id.toString(),
            true
          );

          logger.info('Status de pagamento atualizado via webhook:', {
            email: supporterEmail,
            newStatus: 'active',
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao processar pagamento bem-sucedido:', error);
    }
  }

  /**
   * Handler para pagamento falho
   */
  private async handlePaymentFailed(data: any): Promise<void> {
    try {
      const { supporterEmail, campaignId } = data;

      // Buscar integrações desta campanha
      const integrations = await Integration.find({
        campaignId,
      });

      for (const integration of integrations) {
        const members = await memberService.listMembersByIntegration(
          integration._id.toString()
        );

        const member = members.find(
          (m) => m.supporterEmail.toLowerCase() === supporterEmail.toLowerCase()
        );

        if (member && member.status === 'active') {
          await memberService.markPaymentOverdue(member._id.toString());

          logger.info('Membro marcado como pagamento em atraso via webhook:', {
            email: supporterEmail,
          });
        }
      }
    } catch (error) {
      logger.error('Erro ao processar pagamento falho:', error);
    }
  }

  /**
   * Webhook do Telegram (alternativa ao long polling)
   * POST /webhook/telegram
   */
  async telegramWebhook(req: Request, res: Response): Promise<void> {
    try {
      // O Telegraf já processa as atualizações automaticamente
      // Este endpoint é para quando usar webhooks ao invés de polling

      logger.info('Webhook Telegram recebido');

      // TODO: Processar update do Telegram
      // await bot.handleUpdate(req.body);

      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error('Erro ao processar webhook Telegram:', error);
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }
}

export default new WebhookController();
