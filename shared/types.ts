// Tipos compartilhados entre frontend e backend

export interface Integration {
  id: string;
  campaignId: string;
  telegramGroupId: string;
  telegramGroupType: 'group' | 'supergroup' | 'channel';
  telegramGroupTitle: string;
  apiKey: string;
  minSupportLevel?: string; // Nível mínimo de apoio (este e superiores têm acesso)
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
  roles: Array<'admin' | 'user'>;
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

// ============================================================================
// API Response Types
// ============================================================================

// Base response types
export type ApiSuccessResponse<T> = { success: true } & T;

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export type ApiResponseType<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Campaign API Response Types
// ============================================================================

// Campaign interfaces (existing models)
export interface IRewardLevel {
  id: string;
  title: string;
  amount: number;
  description: string;
  benefits: string[];
  maxBackers?: number;
  estimatedDelivery?: string;
}

export interface ICampaign {
  _id: string;
  makerId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  currency: string;
  imageUrl?: string;
  videoUrl?: string;
  rewardLevels: IRewardLevel[];
  supporters: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/campaigns/slug/:slug
export type GetCampaignBySlugResponse = ApiSuccessResponse<ICampaign>;

// GET /api/campaigns/:id
export type GetCampaignResponse = ApiSuccessResponse<ICampaign>;

// GET /api/campaigns/all
export type ListCampaignsResponse = ApiSuccessResponse<{
  campaigns: ICampaign[];
  total: number;
  page: number;
  limit: number;
}>;

// GET /api/campaigns/search
export type SearchCampaignsResponse = ApiSuccessResponse<{
  campaigns: ICampaign[];
  total: number;
}>;

// GET /api/campaigns/my/campaigns
export type MyCampaignsResponse = ApiSuccessResponse<{
  campaigns: ICampaign[];
}>;

// POST /api/campaigns
export type CreateCampaignResponse = ApiSuccessResponse<{
  campaign: ICampaign;
  message: string;
}>;

// PUT /api/campaigns/:id
export type UpdateCampaignResponse = ApiSuccessResponse<{
  campaign: ICampaign;
  message: string;
}>;

// DELETE /api/campaigns/:id
export type DeleteCampaignResponse = ApiSuccessResponse<{
  message: string;
}>;

// ============================================================================
// Auth API Response Types
// ============================================================================

export interface IUser {
  _id: string;
  email: string;
  name: string;
  roles: Array<'admin' | 'user'>;
  createdAt: Date;
  updatedAt: Date;
}

// POST /api/auth/register
export type RegisterResponse = ApiSuccessResponse<{
  user: IUser;
  token: string;
  message: string;
}>;

// POST /api/auth/login
export type LoginResponse = ApiSuccessResponse<{
  user: IUser;
  token: string;
}>;

// GET /api/auth/me
export type GetMeResponse = ApiSuccessResponse<{
  user: IUser;
}>;

// POST /api/auth/validate-apoiase
export type ValidateApoiaseResponse = ApiSuccessResponse<{
  user: IUser;
  token: string;
}>;

// ============================================================================
// Support API Response Types
// ============================================================================

export interface ISupport {
  _id: string;
  userId: string;
  campaignId: string;
  rewardLevelId: string;
  amount: number;
  status: 'active' | 'cancelled' | 'paused' | 'payment_failed';
  recurring: boolean;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// POST /api/supports
export type CreateSupportResponse = ApiSuccessResponse<{
  support: ISupport;
  message: string;
}>;

// GET /api/supports/my/supports
export type MySupportsResponse = ApiSuccessResponse<{
  supports: ISupport[];
}>;

// GET /api/supports/campaign/:campaignId
export type CampaignSupportsResponse = ApiSuccessResponse<{
  supports: ISupport[];
  total: number;
}>;

// POST /api/supports/:id/pause
export type PauseSupportResponse = ApiSuccessResponse<{
  support: ISupport;
  message: string;
}>;

// POST /api/supports/:id/resume
export type ResumeSupportResponse = ApiSuccessResponse<{
  support: ISupport;
  message: string;
}>;

// POST /api/supports/:id/cancel
export type CancelSupportResponse = ApiSuccessResponse<{
  support: ISupport;
  message: string;
}>;

// ============================================================================
// Integration API Response Types
// ============================================================================

export interface IIntegration {
  _id: string;
  campaignId: string;
  telegramGroupId: string;
  telegramGroupType: 'group' | 'supergroup' | 'channel';
  telegramGroupTitle: string;
  apiKey: string;
  supportLevels: string[]; // IDs dos níveis de apoio
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// POST /api/integrations
export type CreateIntegrationResponse = ApiSuccessResponse<{
  integration: IIntegration;
  apiKey: string;
  message: string;
}>;

// GET /api/integrations
export type ListIntegrationsResponse = ApiSuccessResponse<{
  integrations: IIntegration[];
}>;

// GET /api/integrations/telegram-link/:campaignId
export type GetTelegramLinkResponse = ApiSuccessResponse<{
  telegramLink: string;
  botUsername: string;
}>;

// GET /api/integrations/:id
export type GetIntegrationResponse = ApiSuccessResponse<{
  integration: IIntegration;
}>;

// PUT /api/integrations/:id
export type UpdateIntegrationResponse = ApiSuccessResponse<{
  integration: IIntegration;
  message: string;
}>;

// DELETE /api/integrations/:id
export type DeleteIntegrationResponse = ApiSuccessResponse<{
  message: string;
}>;

// POST /api/integrations/:id/activate
export type ActivateIntegrationResponse = ApiSuccessResponse<{
  integration: IIntegration;
  message: string;
}>;

// POST /api/integrations/:id/deactivate
export type DeactivateIntegrationResponse = ApiSuccessResponse<{
  integration: IIntegration;
  message: string;
}>;

// POST /api/integrations/:id/regenerate-key
export type RegenerateKeyResponse = ApiSuccessResponse<{
  integration: IIntegration;
  apiKey: string;
  message: string;
}>;

// ============================================================================
// Integration Auth API Response Types (OAuth-like flow)
// ============================================================================

// GET /api/integration/authorize
export type InitiateAuthResponse = ApiSuccessResponse<{
  stateToken: string;
  campaign: {
    slug: string;
    title: string;
  };
  redirectUrl: string;
}>;

// POST /api/integration/telegram-auth
export type TelegramAuthResponse = ApiSuccessResponse<{
  message: string;
  authenticated: boolean;
}>;

// GET /api/integration/available-groups
export type ListGroupsResponse = ApiSuccessResponse<{
  groups: Array<{
    id: string;
    title: string;
    type: 'group' | 'supergroup' | 'channel';
    memberCount: number;
    hasExistingMembers: boolean;
  }>;
}>;

// POST /api/integration/select-group
export type SelectGroupResponse = ApiSuccessResponse<{
  message: string;
  warning?: string;
}>;

// POST /api/integration/complete
export type CompleteIntegrationResponse = ApiSuccessResponse<{
  integration: IIntegration;
  integrationId: string;
  message: string;
}>;

// GET /api/integration/session/:stateToken
export type GetSessionResponse = ApiSuccessResponse<{
  session: {
    stateToken: string;
    status: string;
    campaignSlug: string;
    telegramUserId?: number;
    telegramUsername?: string;
    telegramGroupId?: string;
    telegramGroupTitle?: string;
  };
}>;

// POST /api/integration/cancel
export type CancelAuthResponse = ApiSuccessResponse<{
  message: string;
}>;

// ============================================================================
// APOIA.se Integration Routes Response Types
// ============================================================================

// POST /api/campaigns/:campaignSlug/integrations/telegram
export type StartIntegrationResponse = ApiSuccessResponse<{
  redirectUrl: string;
  stateToken: string;
}>;

// GET /api/campaigns/:campaignSlug/integrations/telegram/callback
export type IntegrationCallbackResponse = ApiSuccessResponse<{
  integration?: IIntegration;
  message: string;
}>;

// GET /api/campaigns/:campaignSlug/integrations/telegram
export type ListCampaignIntegrationsResponse = ApiSuccessResponse<{
  integrations: IIntegration[];
}>;

// DELETE /api/campaigns/:campaignSlug/integrations/telegram/:id
export type DeleteCampaignIntegrationResponse = ApiSuccessResponse<{
  message: string;
}>;
