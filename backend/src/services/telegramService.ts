import { Telegraf, Context } from 'telegraf';
import logger from '../config/logger';
import Member from '../models/Member';
import Integration from '../models/Integration';
import EventLog from '../models/EventLog';
import verificationService from './verificationService';
import TelegramGroupDiscoveryService from './telegramGroupDiscoveryService';

/**
 * Serviço do Bot do Telegram
 * Gerencia interações com usuários e grupos
 */
export class TelegramService {
  private bot: Telegraf | null = null;
  private botToken: string;
  private initialized: boolean = false;
  private groupDiscoveryService: TelegramGroupDiscoveryService | null = null;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    if (!this.botToken) {
      logger.warn('TELEGRAM_BOT_TOKEN não configurado - serviço Telegram desabilitado');
      return;
    }

    try {
      this.bot = new Telegraf(this.botToken);
      this.groupDiscoveryService = new TelegramGroupDiscoveryService(this.botToken);
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

    // Comando /start (com suporte a startgroup para autorização)
    this.bot.command('start', async (ctx: Context) => {
      try {
        const userName = ctx.from?.first_name || 'Apoiador';
        const message = ctx.message;

        // Verificar se é um startgroup (autorização de integração)
        if (message && 'text' in message) {
          const commandText = message.text;
          const match = commandText.match(/\/start\s+(.+)/);

          if (match) {
            const param = match[1];

            // Se começa com "startgroup=", é uma autorização
            if (param.includes('=')) {
              const [action, token] = param.split('=');
              if (action === 'startgroup' && token) {
                await this.handleTelegramAuthorization(ctx, token);
                return;
              }
            }
          }
        }

        // Mensagem padrão de /start
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
        const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';

        let helpText = `📚 *Comandos Disponíveis*\n\n` +
          `/start - Iniciar conversa com o bot\n` +
          `/verify - Verificar seu status de apoio\n` +
          `/help - Mostrar esta mensagem de ajuda\n`;

        if (isGroup) {
          helpText += `/register - Registrar grupo no sistema (admin)\n`;
        }

        helpText += `\n*Como funciona?*\n` +
          `1. Entre no grupo usando o link fornecido\n` +
          `2. O bot enviará uma mensagem solicitando verificação\n` +
          `3. Use /verify e informe seu email de apoio\n` +
          `4. Pronto! Seu acesso será liberado automaticamente`;

        await ctx.reply(helpText, { parse_mode: 'Markdown' });
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

    // Comando /register - registra o grupo no sistema (admin only)
    this.bot.command('register', async (ctx: Context) => {
      try {
        const chat = ctx.chat;

        if (!chat) {
          await ctx.reply('❌ Erro ao identificar o chat.');
          return;
        }

        // Verificar se é um grupo
        if (chat.type !== 'group' && chat.type !== 'supergroup') {
          await ctx.reply('❌ Este comando só funciona em grupos.');
          return;
        }

        // Verificar se o usuário é admin do grupo
        if (!ctx.from) {
          await ctx.reply('❌ Erro ao identificar o usuário.');
          return;
        }

        const member = await ctx.telegram.getChatMember(chat.id, ctx.from.id);
        if (member.status !== 'creator' && member.status !== 'administrator') {
          await ctx.reply('❌ Apenas administradores podem registrar o grupo.');
          return;
        }

        // Registrar grupo no discovery service
        if (this.groupDiscoveryService) {
          await this.groupDiscoveryService.discoverGroup(chat.id.toString());

          const groupTitle = 'title' in chat ? chat.title : 'Sem título';

          await ctx.reply(
            `✅ *Grupo registrado com sucesso!*\n\n` +
            `📋 Informações:\n` +
            `• ID: \`${chat.id}\`\n` +
            `• Nome: ${groupTitle}\n\n` +
            `Agora você pode selecioná-lo ao criar uma integração!`,
            { parse_mode: 'Markdown' }
          );

          logger.info('Grupo registrado manualmente via comando /register:', {
            groupId: chat.id,
            groupTitle: groupTitle,
            registeredBy: ctx.from.id,
          });
        } else {
          await ctx.reply('❌ Serviço de descoberta não disponível.');
        }
      } catch (error: any) {
        logger.error('Erro ao processar comando /register:', error);
        await ctx.reply('❌ Erro ao registrar grupo: ' + error.message);
      }
    });
  }

  /**
   * Handler para autorização do Telegram via deep link
   */
  private async handleTelegramAuthorization(ctx: Context, token: string): Promise<void> {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        await ctx.reply('❌ Erro ao identificar o grupo.');
        return;
      }

      logger.info('Processando autorização do Telegram:', {
        token,
        chatId,
        chatType: ctx.chat?.type,
      });

      // Importação dinâmica para evitar dependência circular
      const { default: integrationService } = await import('./integrationService');

      // Processar autorização
      const integration = await integrationService.processTelegramAuthorization(
        token,
        chatId.toString()
      );

      // Mensagem de sucesso
      await ctx.reply(
        `✅ *Integração configurada com sucesso!*\n\n` +
        `Este grupo agora está integrado com a campanha no APOIA.se.\n\n` +
        `Os apoiadores com os níveis de recompensa configurados poderão acessar este grupo automaticamente.\n\n` +
        `Você pode gerenciar esta integração no painel do APOIA.se.`,
        { parse_mode: 'Markdown' }
      );

      logger.info('Integração criada via autorização:', {
        token,
        integrationId: integration._id,
        groupId: chatId,
      });
    } catch (error: any) {
      logger.error('Erro ao processar autorização:', error);

      let errorMessage = '❌ Erro ao configurar integração.\n\n';

      if (error.message.includes('já existe')) {
        errorMessage += 'Este grupo já possui uma integração configurada.';
      } else if (error.message.includes('expirado')) {
        errorMessage += 'O link de autorização expirou. Por favor, gere um novo link no painel.';
      } else if (error.message.includes('inválido')) {
        errorMessage += 'Link de autorização inválido ou já utilizado.';
      } else {
        errorMessage += 'Por favor, tente novamente ou entre em contato com o suporte.';
      }

      await ctx.reply(errorMessage);
    }
  }

  /**
   * Configura handlers de eventos
   */
  private setupHandlers(): void {
    if (!this.bot) return;

    // Handler para quando o bot é adicionado a um grupo/canal
    this.bot.on('my_chat_member', async (ctx: Context) => {
      try {
        const update = ctx.update;
        if (!('my_chat_member' in update)) return;

        const { new_chat_member, old_chat_member, chat } = update.my_chat_member;

        // Verificar se o bot foi adicionado (status mudou para member ou administrator)
        const wasNotMember = ['left', 'kicked'].includes(old_chat_member.status);
        const isNowMember = ['member', 'administrator'].includes(new_chat_member.status);

        if (wasNotMember && isNowMember) {
          logger.info('Bot adicionado a um novo grupo:', {
            chatId: chat.id,
            chatTitle: 'title' in chat ? chat.title : 'N/A',
            chatType: chat.type,
          });

          // Verificar se há um parâmetro de autorização pendente
          // Nota: O Telegram envia o parâmetro via comando /start depois de adicionar ao grupo
          // Então a autorização será processada no handler do /start
        }
      } catch (error) {
        logger.error('Erro ao processar my_chat_member:', error);
      }
    });

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

  /**
   * Retorna instância do serviço de descoberta de grupos
   */
  getGroupDiscoveryService(): TelegramGroupDiscoveryService | null {
    return this.groupDiscoveryService;
  }
}

export default new TelegramService();
