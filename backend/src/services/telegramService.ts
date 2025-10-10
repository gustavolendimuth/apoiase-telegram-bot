import { Telegraf, Context } from 'telegraf';
import logger from '../config/logger';
import Member from '../models/Member';
import Integration from '../models/Integration';
import EventLog from '../models/EventLog';
import verificationService from './verificationService';

/**
 * Serviço do Bot do Telegram
 * Gerencia interações com usuários e grupos
 */
export class TelegramService {
  private bot: Telegraf | null = null;
  private botToken: string;
  private initialized: boolean = false;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    if (!this.botToken) {
      logger.warn('TELEGRAM_BOT_TOKEN não configurado - serviço Telegram desabilitado');
      return;
    }

    try {
      this.bot = new Telegraf(this.botToken);
      this.setupCommands();
      this.setupHandlers();
      this.initialized = true;
    } catch (error) {
      logger.error('Erro ao inicializar serviço Telegram:', error);
    }
  }

  /**
   * Configura comandos do bot
   */
  private setupCommands(): void {
    if (!this.bot) return;

    // Comando /start
    this.bot.command('start', async (ctx: Context) => {
      try {
        const userName = ctx.from?.first_name || 'Apoiador';

        await ctx.reply(
          `Olá, ${userName}! 👋\n\n` +
          `Bem-vindo ao bot de integração APOIA.se + Telegram.\n\n` +
          `Para verificar seu acesso ao grupo, use o comando /verify\n\n` +
          `Precisa de ajuda? Use /help`
        );

        logger.info('Comando /start executado:', {
          userId: ctx.from?.id,
          username: ctx.from?.username,
        });
      } catch (error) {
        logger.error('Erro ao processar comando /start:', error);
        await ctx.reply('Desculpe, ocorreu um erro. Tente novamente mais tarde.');
      }
    });

    // Comando /help
    this.bot.command('help', async (ctx: Context) => {
      try {
        await ctx.reply(
          `📚 *Comandos Disponíveis*\n\n` +
          `/start - Iniciar conversa com o bot\n` +
          `/verify - Verificar seu status de apoio\n` +
          `/help - Mostrar esta mensagem de ajuda\n\n` +
          `*Como funciona?*\n` +
          `1. Entre no grupo usando o link fornecido\n` +
          `2. O bot enviará uma mensagem solicitando verificação\n` +
          `3. Use /verify e informe seu email de apoio\n` +
          `4. Pronto! Seu acesso será liberado automaticamente`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        logger.error('Erro ao processar comando /help:', error);
      }
    });

    // Comando /verify
    this.bot.command('verify', async (ctx: Context) => {
      try {
        await ctx.reply(
          `Para verificar seu acesso, por favor informe o *e-mail* que você usa para apoiar na APOIA.se:\n\n` +
          `Digite apenas o e-mail (exemplo: seuemail@gmail.com)`,
          { parse_mode: 'Markdown' }
        );

        logger.info('Comando /verify executado:', {
          userId: ctx.from?.id,
          username: ctx.from?.username,
        });
      } catch (error) {
        logger.error('Erro ao processar comando /verify:', error);
      }
    });
  }

  /**
   * Configura handlers de eventos
   */
  private setupHandlers(): void {
    if (!this.bot) return;

    // Handler para novos membros no grupo
    this.bot.on('new_chat_members', async (ctx: Context) => {
      try {
        const message = ctx.message;
        if (!message || !('new_chat_members' in message)) return;
        const newMembers = message.new_chat_members || [];
        const chatId = ctx.chat?.id;

        for (const member of newMembers) {
          // Ignorar bots
          if (member.is_bot) continue;

          logger.info('Novo membro detectado:', {
            userId: member.id,
            username: member.username,
            chatId,
          });

          // Encontrar integração do grupo
          const integration = await Integration.findOne({
            telegramGroupId: chatId?.toString(),
            isActive: true,
          });

          if (!integration) {
            logger.warn('Grupo sem integração configurada:', chatId);
            continue;
          }

          // Enviar mensagem de boas-vindas no grupo
          await ctx.reply(
            `Olá, ${member.first_name}! 👋\n\n` +
            `Para ter acesso completo a este grupo, você precisa verificar seu apoio.\n\n` +
            `Por favor, inicie uma conversa privada comigo (@${ctx.botInfo?.username}) e use o comando /verify`
          );

          // Tentar enviar mensagem privada
          try {
            if (!this.bot) return;
            const chatTitle = ctx.chat && 'title' in ctx.chat ? ctx.chat.title : 'o grupo';
            await this.bot.telegram.sendMessage(
              member.id,
              `Olá! Para completar seu acesso ao grupo "${chatTitle}", ` +
              `por favor use o comando /verify e informe seu e-mail de apoio.`
            );
          } catch (error) {
            logger.warn('Não foi possível enviar mensagem privada:', {
              userId: member.id,
              error,
            });
          }

          // Registrar evento
          await EventLog.create({
            eventType: 'member_joined',
            integrationId: integration._id,
            userId: member.id.toString(),
            metadata: {
              username: member.username,
              firstName: member.first_name,
              chatId,
            },
          });
        }
      } catch (error) {
        logger.error('Erro ao processar novos membros:', error);
      }
    });

    // Handler para membros que saíram
    this.bot.on('left_chat_member', async (ctx: Context) => {
      try {
        const message = ctx.message;
        if (!message || !('left_chat_member' in message)) return;
        const member = message.left_chat_member;
        const chatId = ctx.chat?.id;

        if (!member || member.is_bot) return;

        logger.info('Membro saiu do grupo:', {
          userId: member.id,
          username: member.username,
          chatId,
        });

        // Atualizar status no banco
        await Member.updateMany(
          {
            telegramUserId: member.id.toString(),
          },
          {
            status: 'removed',
            removedAt: new Date(),
          }
        );

        // Registrar evento
        const integration = await Integration.findOne({
          telegramGroupId: chatId?.toString(),
        });

        if (integration) {
          await EventLog.create({
            eventType: 'member_removed',
            integrationId: integration._id,
            userId: member.id.toString(),
            metadata: {
              username: member.username,
              reason: 'left_voluntarily',
            },
          });
        }
      } catch (error) {
        logger.error('Erro ao processar saída de membro:', error);
      }
    });

    // Handler para mensagens de texto (verificação de email)
    this.bot.on('text', async (ctx: Context) => {
      try {
        const message = ctx.message;
        if (!message || !('text' in message)) return;

        // Ignorar comandos (já tratados)
        if (message.text?.startsWith('/')) return;

        // Apenas processar em chat privado
        if (ctx.chat?.type !== 'private') return;

        const text = message.text || '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(text)) {
          await ctx.reply('🔍 Verificando seu e-mail...');

          logger.info('Email recebido para verificação:', {
            email: text,
            userId: ctx.from?.id,
          });

          // Buscar integrações ativas para verificar
          const integrations = await Integration.find({ isActive: true });

          let verified = false;

          for (const integration of integrations) {
            const result = await verificationService.processSupporterVerification(
              text,
              integration._id.toString(),
              ctx.from?.id.toString(),
              ctx.from?.username
            );

            if (result.success) {
              verified = true;
              await ctx.reply(
                `✅ Verificação concluída!\n\n` +
                `Seu acesso ao grupo "${integration.telegramGroupTitle}" foi liberado.\n\n` +
                `Bem-vindo! 🎉`
              );
              break;
            }
          }

          if (!verified) {
            await ctx.reply(
              `❌ Não encontramos um apoio ativo com este e-mail.\n\n` +
              `Verifique se:\n` +
              `• O e-mail está correto\n` +
              `• Seu apoio está ativo e em dia\n` +
              `• Você tem o nível de recompensa adequado\n\n` +
              `Precisa de ajuda? Entre em contato com o fazedor.`
            );
          }
        }
      } catch (error) {
        logger.error('Erro ao processar mensagem de texto:', error);
      }
    });

    // Handler de erros
    this.bot.catch((error: any, ctx: Context) => {
      logger.error('Erro no bot:', {
        error,
        updateType: ctx.updateType,
      });
    });
  }

  /**
   * Inicia o bot
   */
  async start(): Promise<void> {
    if (!this.initialized || !this.bot) {
      logger.warn('Bot do Telegram não inicializado - pulando start');
      return;
    }

    try {
      logger.info('Iniciando bot do Telegram...');

      await this.bot.launch();

      logger.info('Bot do Telegram iniciado com sucesso!');
      logger.info('Bot username:', (await this.bot.telegram.getMe()).username);
    } catch (error) {
      logger.error('Erro ao iniciar bot do Telegram:', error);
      throw error;
    }
  }

  /**
   * Para o bot graciosamente
   */
  async stop(): Promise<void> {
    if (!this.initialized || !this.bot) {
      return;
    }
    logger.info('Parando bot do Telegram...');
    await this.bot.stop();
  }

  /**
   * Envia mensagem para um usuário
   */
  async sendMessage(userId: number, message: string): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot não inicializado');
    }
    try {
      await this.bot.telegram.sendMessage(userId, message);
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', { userId, error });
      throw error;
    }
  }

  /**
   * Remove usuário de um grupo
   */
  async removeUserFromGroup(chatId: number, userId: number): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot não inicializado');
    }
    try {
      await this.bot.telegram.banChatMember(chatId, userId);
      await this.bot.telegram.unbanChatMember(chatId, userId);

      logger.info('Usuário removido do grupo:', { chatId, userId });
    } catch (error) {
      logger.error('Erro ao remover usuário do grupo:', { chatId, userId, error });
      throw error;
    }
  }

  /**
   * Obtém informações de um grupo
   */
  async getChat(chatId: number) {
    if (!this.bot) {
      throw new Error('Bot não inicializado');
    }
    try {
      return await this.bot.telegram.getChat(chatId);
    } catch (error) {
      logger.error('Erro ao obter informações do grupo:', { chatId, error });
      throw error;
    }
  }

  /**
   * Gera link de convite para um grupo
   */
  async createInviteLink(chatId: number, expiresIn: number = 86400): Promise<string> {
    if (!this.bot) {
      throw new Error('Bot não inicializado');
    }
    try {
      const link = await this.bot.telegram.createChatInviteLink(chatId, {
        expire_date: Math.floor(Date.now() / 1000) + expiresIn,
        member_limit: 1,
      });

      return link.invite_link;
    } catch (error) {
      logger.error('Erro ao criar link de convite:', { chatId, error });
      throw error;
    }
  }

  /**
   * Retorna instância do bot
   */
  getBot(): Telegraf | null {
    return this.bot;
  }
}

export default new TelegramService();
