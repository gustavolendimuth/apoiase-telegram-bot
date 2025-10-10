// Tipos compartilhados entre frontend e backend

export interface Integration {
  id: string;
  campaignId: string;
  telegramGroupId: string;
  telegramGroupType: 'group' | 'supergroup' | 'channel';
  telegramGroupTitle: string;
  apiKey: string;
  rewardLevels: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  integrationId: string;
  supporterEmail: string;
  supporterId: string;
  telegramUserId?: string;
  telegramUsername?: string;
  status: 'pending_verification' | 'active' | 'payment_overdue' | 'removed';
  joinedAt?: Date;
  verifiedAt?: Date;
  lastPaymentCheck?: Date;
  removalWarningAt?: Date;
  removedAt?: Date;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventLog {
  id: string;
  eventType: 'member_joined' | 'member_verified' | 'member_removed' | 'payment_overdue' | 'warning_sent' | 'integration_created' | 'integration_updated' | 'integration_deleted' | 'error';
  integrationId?: string;
  memberId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'maker' | 'supporter' | 'admin';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Webhooks da APOIA.se
export interface ApoiaseWebhookPayload {
  event: 'supporter.created' | 'supporter.updated' | 'supporter.deleted' | 'payment.succeeded' | 'payment.failed';
  data: {
    supporterId: string;
    supporterEmail: string;
    campaignId: string;
    rewardLevel: string;
    status: 'active' | 'inactive' | 'cancelled';
    paymentStatus?: 'succeeded' | 'failed' | 'pending';
  };
  timestamp: string;
}

// Webhooks do Telegram
export interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  my_chat_member?: TelegramChatMemberUpdated;
  chat_member?: TelegramChatMemberUpdated;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
}

export interface TelegramChatMemberUpdated {
  chat: TelegramChat;
  from: TelegramUser;
  date: number;
  old_chat_member: TelegramChatMember;
  new_chat_member: TelegramChatMember;
}

export interface TelegramChatMember {
  user: TelegramUser;
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
}
