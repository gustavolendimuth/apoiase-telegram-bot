import { Telegraf } from 'telegraf';
import logger from '../config/logger';

/**
 * Interface para grupo descoberto
 */
export interface DiscoveredGroup {
  id: string;
  title: string;
  type: 'group' | 'supergroup' | 'channel';
  memberCount?: number;
  canPostMessages: boolean;
  canManageChat: boolean;
  canInviteUsers: boolean;
}

/**
 * Serviço para descoberta automática de grupos Telegram
 *
 * IMPORTANTE: O Telegram Bot API não permite listar todos os grupos onde o bot está.
 * Este serviço usa uma abordagem alternativa:
 * 1. Armazena grupos quando recebe updates (messages, my_chat_member)
 * 2. Valida permissões do bot no grupo
 */
export class TelegramGroupDiscoveryService {
  private bot: Telegraf;
  private discoveredGroups: Map<string, DiscoveredGroup> = new Map();

  constructor(bot: Telegraf) {
    this.bot = bot;
    // Nota: setupListeners() não é chamado aqui para evitar handlers duplicados
    // Os listeners são gerenciados pelo telegramService
  }

  /**
   * Configura listeners para descobrir grupos automaticamente
   */
  private setupListeners() {
    // Listener para quando o bot é adicionado a um grupo
    this.bot.on('my_chat_member', async (ctx) => {
      try {
        const chat = ctx.chat;
        const newStatus = ctx.myChatMember.new_chat_member.status;

        // Bot foi adicionado como administrador ou membro
        if (['administrator', 'member'].includes(newStatus)) {
          if (chat.type === 'group' || chat.type === 'supergroup') {
            await this.discoverGroup(chat.id.toString());
          }
        }

        // Bot foi removido
        if (newStatus === 'left' || newStatus === 'kicked') {
          this.discoveredGroups.delete(chat.id.toString());
          logger.info('Bot removido do grupo', { groupId: chat.id });
        }
      } catch (error) {
        logger.error('Erro no listener my_chat_member', { error });
      }
    });

    // Listener para mensagens (ajuda a descobrir grupos existentes)
    this.bot.on('message', async (ctx) => {
      try {
        const chat = ctx.chat;

        if (chat.type === 'group' || chat.type === 'supergroup') {
          // Se ainda não conhecemos este grupo, descobrir
          if (!this.discoveredGroups.has(chat.id.toString())) {
            await this.discoverGroup(chat.id.toString());
          }
        }
      } catch (error) {
        // Silencioso - não queremos logar erro para cada mensagem
      }
    });
  }

  /**
   * Descobre informações sobre um grupo específico
   */
  async discoverGroup(groupId: string): Promise<DiscoveredGroup | null> {
    try {
      // Obter informações do chat
      const chat = await this.bot.telegram.getChat(groupId);

      if (chat.type !== 'group' && chat.type !== 'supergroup' && chat.type !== 'channel') {
        return null;
      }

      // Obter informações do bot (garantir que botInfo esteja disponível)
      const botInfo = await this.bot.telegram.getMe();

      // Obter permissões do bot
      const botMember = await this.bot.telegram.getChatMember(groupId, botInfo.id);

      logger.info('Permissões do bot no grupo', {
        groupId,
        status: botMember.status,
        permissions: botMember.status === 'administrator' ? {
          can_manage_chat: botMember.can_manage_chat,
          can_invite_users: botMember.can_invite_users,
          can_post_messages: botMember.can_post_messages,
        } : 'not admin',
      });

      if (botMember.status !== 'administrator') {
        logger.warn('Bot não é administrador do grupo', { groupId, title: chat.title });
        return null;
      }

      // Verificar permissões necessárias
      const canPostMessages = botMember.status === 'administrator' && (botMember.can_post_messages !== false);
      const canManageChat = botMember.status === 'administrator' && (botMember.can_manage_chat !== false);
      const canInviteUsers = botMember.status === 'administrator' && (botMember.can_invite_users !== false);

      // Log detalhado das permissões calculadas
      logger.info('Permissões calculadas', {
        groupId,
        canPostMessages,
        canManageChat,
        canInviteUsers,
      });

      const discoveredGroup: DiscoveredGroup = {
        id: groupId,
        title: chat.title || 'Grupo sem título',
        type: chat.type,
        memberCount: 'members_count' in chat ? (chat.members_count as number | undefined) : undefined,
        canPostMessages,
        canManageChat,
        canInviteUsers,
      };

      // Armazenar grupo descoberto em memória
      this.discoveredGroups.set(groupId, discoveredGroup);

      // Persistir grupo no banco de dados
      try {
        const DiscoveredGroupModel = (await import('../models/DiscoveredGroup')).default;

        console.log('[DEBUG] Tentando salvar grupo no banco:', {
          groupId,
          title: discoveredGroup.title,
          canManageChat,
          canInviteUsers,
        });

        const savedGroup = await DiscoveredGroupModel.findOneAndUpdate(
          { groupId },
          {
            groupId,
            title: discoveredGroup.title,
            type: discoveredGroup.type,
            canPostMessages,
            canManageChat,
            canInviteUsers,
            lastChecked: new Date(),
          },
          { upsert: true, new: true }
        );

        console.log('[SUCCESS] Grupo salvo no banco:', {
          _id: savedGroup._id,
          groupId: savedGroup.groupId,
          title: savedGroup.title,
        });

        logger.info('✅ Grupo persistido no banco de dados', {
          groupId,
          dbId: savedGroup._id,
        });
      } catch (dbError: any) {
        console.error('[ERROR] Falha ao salvar grupo no banco:', {
          groupId,
          error: dbError.message,
          stack: dbError.stack,
        });
        logger.error('❌ Erro ao persistir grupo no banco', {
          groupId,
          error: dbError.message,
          stack: dbError.stack,
        });

        // Re-throw para que o erro não seja silencioso
        throw new Error(`Falha ao persistir grupo: ${dbError.message}`);
      }

      logger.info('Grupo descoberto', {
        groupId,
        title: discoveredGroup.title,
        permissions: {
          canPostMessages,
          canManageChat,
          canInviteUsers,
        },
      });

      return discoveredGroup;
    } catch (error: any) {
      logger.error('Erro ao descobrir grupo', { groupId, error: error.message });
      return null;
    }
  }

  /**
   * Lista todos os grupos descobertos onde o bot é administrador
   *
   * NOTA: Em webhook mode (produção), grupos devem ser registrados manualmente
   * usando o comando /register no grupo do Telegram, pois getUpdates() não funciona.
   *
   * Grupos são carregados do banco de dados para persistir entre restarts.
   */
  async listAvailableGroups(): Promise<DiscoveredGroup[]> {
    // Buscar grupos descobertos do banco de dados
    try {
      const DiscoveredGroupModel = (await import('../models/DiscoveredGroup')).default;
      const dbGroups = await DiscoveredGroupModel.find({
        canInviteUsers: true,
        canManageChat: true,
      });

      // Popular cache em memória com grupos do banco
      for (const dbGroup of dbGroups) {
        if (!this.discoveredGroups.has(dbGroup.groupId)) {
          this.discoveredGroups.set(dbGroup.groupId, {
            id: dbGroup.groupId,
            title: dbGroup.title,
            type: dbGroup.type,
            canPostMessages: dbGroup.canPostMessages,
            canManageChat: dbGroup.canManageChat,
            canInviteUsers: dbGroup.canInviteUsers,
          });
        }
      }

      logger.info('Grupos carregados do banco de dados', {
        total: dbGroups.length,
      });
    } catch (error: any) {
      logger.error('Erro ao carregar grupos do banco de dados', { error: error.message });
    }

    return Array.from(this.discoveredGroups.values())
      .filter(group => group.canInviteUsers && group.canManageChat);
  }

  /**
   * Busca um grupo específico por ID e atualiza informações
   */
  async getGroup(groupId: string): Promise<DiscoveredGroup | null> {
    // Tentar obter do cache primeiro
    if (this.discoveredGroups.has(groupId)) {
      return this.discoveredGroups.get(groupId)!;
    }

    // Se não estiver em cache, tentar descobrir
    return await this.discoverGroup(groupId);
  }

  /**
   * Valida se o bot tem permissões necessárias em um grupo
   */
  async validateGroupPermissions(groupId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    try {
      const group = await this.getGroup(groupId);

      if (!group) {
        return {
          valid: false,
          errors: ['Grupo não encontrado ou bot não é membro'],
        };
      }

      const errors: string[] = [];

      if (!group.canInviteUsers) {
        errors.push('Bot não tem permissão para convidar usuários');
      }

      if (!group.canManageChat) {
        errors.push('Bot não tem permissão para gerenciar chat');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Erro ao validar permissões: ${error.message}`],
      };
    }
  }

  /**
   * Remove um grupo do cache (útil quando integração é desativada)
   */
  removeGroup(groupId: string): void {
    this.discoveredGroups.delete(groupId);
  }

  /**
   * Inicia o bot (necessário para receber updates)
   */
  start(): void {
    // Nota: o bot já está sendo gerenciado pelo telegramService
    // Este método existe apenas para compatibilidade
  }
}

export default TelegramGroupDiscoveryService;
