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
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

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
export interface GetCampaignBySlugResponse extends ApiSuccessResponse<ICampaign> {}

// GET /api/campaigns/:id
export interface GetCampaignResponse extends ApiSuccessResponse<ICampaign> {}

// GET /api/campaigns/all
export interface ListCampaignsResponse extends ApiSuccessResponse<{
  campaigns: ICampaign[];
  total: number;
  page: number;
  limit: number;
}> {}

// GET /api/campaigns/search
export interface SearchCampaignsResponse extends ApiSuccessResponse<{
  campaigns: ICampaign[];
  total: number;
}> {}

// GET /api/campaigns/my/campaigns
export interface MyCampaignsResponse extends ApiSuccessResponse<{
  campaigns: ICampaign[];
}> {}

// POST /api/campaigns
export interface CreateCampaignResponse extends ApiSuccessResponse<{
  campaign: ICampaign;
  message: string;
}> {}

// PUT /api/campaigns/:id
export interface UpdateCampaignResponse extends ApiSuccessResponse<{
  campaign: ICampaign;
  message: string;
}> {}

// DELETE /api/campaigns/:id
export interface DeleteCampaignResponse extends ApiSuccessResponse<{
  message: string;
}> {}

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
export interface RegisterResponse extends ApiSuccessResponse<{
  user: IUser;
  token: string;
  message: string;
}> {}

// POST /api/auth/login
export interface LoginResponse extends ApiSuccessResponse<{
  user: IUser;
  token: string;
}> {}

// GET /api/auth/me
export interface GetMeResponse extends ApiSuccessResponse<{
  user: IUser;
}> {}

// POST /api/auth/validate-apoiase
export interface ValidateApoiaseResponse extends ApiSuccessResponse<{
  user: IUser;
  token: string;
}> {}

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
export interface CreateSupportResponse extends ApiSuccessResponse<{
  support: ISupport;
  message: string;
}> {}

// GET /api/supports/my/supports
export interface MySupportsResponse extends ApiSuccessResponse<{
  supports: ISupport[];
}> {}

// GET /api/supports/campaign/:campaignId
export interface CampaignSupportsResponse extends ApiSuccessResponse<{
  supports: ISupport[];
  total: number;
}> {}

// POST /api/supports/:id/pause
export interface PauseSupportResponse extends ApiSuccessResponse<{
  support: ISupport;
  message: string;
}> {}

// POST /api/supports/:id/resume
export interface ResumeSupportResponse extends ApiSuccessResponse<{
  support: ISupport;
  message: string;
}> {}

// POST /api/supports/:id/cancel
export interface CancelSupportResponse extends ApiSuccessResponse<{
  support: ISupport;
  message: string;
}> {}

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
export interface CreateIntegrationResponse extends ApiSuccessResponse<{
  integration: IIntegration;
  apiKey: string;
  message: string;
}> {}

// GET /api/integrations
export interface ListIntegrationsResponse extends ApiSuccessResponse<{
  integrations: IIntegration[];
}> {}

// GET /api/integrations/telegram-link/:campaignId
export interface GetTelegramLinkResponse extends ApiSuccessResponse<{
  telegramLink: string;
  botUsername: string;
}> {}

// GET /api/integrations/:id
export interface GetIntegrationResponse extends ApiSuccessResponse<{
  integration: IIntegration;
}> {}

// PUT /api/integrations/:id
export interface UpdateIntegrationResponse extends ApiSuccessResponse<{
  integration: IIntegration;
  message: string;
}> {}

// DELETE /api/integrations/:id
export interface DeleteIntegrationResponse extends ApiSuccessResponse<{
  message: string;
}> {}

// POST /api/integrations/:id/activate
export interface ActivateIntegrationResponse extends ApiSuccessResponse<{
  integration: IIntegration;
  message: string;
}> {}

// POST /api/integrations/:id/deactivate
export interface DeactivateIntegrationResponse extends ApiSuccessResponse<{
  integration: IIntegration;
  message: string;
}> {}

// POST /api/integrations/:id/regenerate-key
export interface RegenerateKeyResponse extends ApiSuccessResponse<{
  integration: IIntegration;
  apiKey: string;
  message: string;
}> {}

// ============================================================================
// Integration Auth API Response Types (OAuth-like flow)
// ============================================================================

// GET /api/integration/authorize
export interface InitiateAuthResponse extends ApiSuccessResponse<{
  stateToken: string;
  campaign: {
    slug: string;
    title: string;
  };
  redirectUrl: string;
}> {}

// POST /api/integration/telegram-auth
export interface TelegramAuthResponse extends ApiSuccessResponse<{
  message: string;
  authenticated: boolean;
}> {}

// GET /api/integration/available-groups
export interface ListGroupsResponse extends ApiSuccessResponse<{
  groups: Array<{
    id: string;
    title: string;
    type: 'group' | 'supergroup' | 'channel';
    memberCount: number;
    hasExistingMembers: boolean;
  }>;
}> {}

// POST /api/integration/select-group
export interface SelectGroupResponse extends ApiSuccessResponse<{
  message: string;
  warning?: string;
}> {}

// POST /api/integration/complete
export interface CompleteIntegrationResponse extends ApiSuccessResponse<{
  integration: IIntegration;
  integrationId: string;
  message: string;
}> {}

// GET /api/integration/session/:stateToken
export interface GetSessionResponse extends ApiSuccessResponse<{
  session: {
    stateToken: string;
    status: string;
    campaignSlug: string;
    telegramUserId?: number;
    telegramUsername?: string;
    telegramGroupId?: string;
    telegramGroupTitle?: string;
  };
}> {}

// POST /api/integration/cancel
export interface CancelAuthResponse extends ApiSuccessResponse<{
  message: string;
}> {}

// ============================================================================
// APOIA.se Integration Routes Response Types
// ============================================================================

// POST /api/campaigns/:campaignSlug/integrations/telegram
export interface StartIntegrationResponse extends ApiSuccessResponse<{
  redirectUrl: string;
  stateToken: string;
}> {}

// GET /api/campaigns/:campaignSlug/integrations/telegram/callback
export interface IntegrationCallbackResponse extends ApiSuccessResponse<{
  integration?: IIntegration;
  message: string;
}> {}

// GET /api/campaigns/:campaignSlug/integrations/telegram
export interface ListCampaignIntegrationsResponse extends ApiSuccessResponse<{
  integrations: IIntegration[];
}> {}

// DELETE /api/campaigns/:campaignSlug/integrations/telegram/:id
export interface DeleteCampaignIntegrationResponse extends ApiSuccessResponse<{
  message: string;
}> {}
