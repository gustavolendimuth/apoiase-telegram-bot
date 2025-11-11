import axios, { AxiosResponse } from 'axios';
import { getApiUrl } from './env';
import type {
  // Campaign types
  GetCampaignBySlugResponse,
  GetCampaignResponse,
  ListCampaignsResponse,
  MyCampaignsResponse,
  CreateCampaignResponse,
  UpdateCampaignResponse,
  DeleteCampaignResponse,
  SearchCampaignsResponse,

  // Auth types
  LoginResponse,
  RegisterResponse,
  GetMeResponse,

  // Integration Auth types
  InitiateAuthResponse,
  TelegramAuthResponse,
  ListGroupsResponse,
  SelectGroupResponse,
  CompleteIntegrationResponse,
  GetSessionResponse,

  // Integration types
  ListIntegrationsResponse,
  GetIntegrationResponse,
  CreateIntegrationResponse,

  // Support types
  MySupportsResponse,
  CreateSupportResponse,

  // Base types
  ICampaign,
  ISupport,
} from '@shared/types';

const API_URL = getApiUrl();

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Campaign API
// ============================================================================

export const campaignApi = {
  /**
   * GET /api/campaigns/slug/:slug
   * Busca campanha por slug
   */
  getBySlug: (slug: string): Promise<AxiosResponse<GetCampaignBySlugResponse>> =>
    axiosInstance.get(`/api/campaigns/slug/${slug}`),

  /**
   * GET /api/campaigns/:id
   * Busca campanha por ID
   */
  getById: (id: string): Promise<AxiosResponse<GetCampaignResponse>> =>
    axiosInstance.get(`/api/campaigns/${id}`),

  /**
   * GET /api/campaigns/all
   * Lista todas as campanhas com filtros
   */
  list: (params?: {
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<AxiosResponse<ListCampaignsResponse>> =>
    axiosInstance.get('/api/campaigns/all', { params }),

  /**
   * GET /api/campaigns/search
   * Busca campanhas por texto
   */
  search: (query: string, limit?: number): Promise<AxiosResponse<SearchCampaignsResponse>> =>
    axiosInstance.get('/api/campaigns/search', {
      params: { q: query, limit },
    }),

  /**
   * GET /api/campaigns/my/campaigns
   * Lista campanhas do usuário autenticado
   */
  getMyCampaigns: (): Promise<AxiosResponse<MyCampaignsResponse>> =>
    axiosInstance.get('/api/campaigns/my/campaigns'),

  /**
   * POST /api/campaigns
   * Cria nova campanha
   */
  create: (data: Partial<ICampaign>): Promise<AxiosResponse<CreateCampaignResponse>> =>
    axiosInstance.post('/api/campaigns', data),

  /**
   * PUT /api/campaigns/:id
   * Atualiza campanha
   */
  update: (
    id: string,
    data: Partial<ICampaign>
  ): Promise<AxiosResponse<UpdateCampaignResponse>> =>
    axiosInstance.put(`/api/campaigns/${id}`, data),

  /**
   * DELETE /api/campaigns/:id
   * Deleta campanha
   */
  delete: (id: string): Promise<AxiosResponse<DeleteCampaignResponse>> =>
    axiosInstance.delete(`/api/campaigns/${id}`),
};

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  /**
   * POST /api/auth/register
   * Registra novo usuário
   */
  register: (data: {
    email: string;
    password: string;
    name: string;
  }): Promise<AxiosResponse<RegisterResponse>> =>
    axiosInstance.post('/api/auth/register', data),

  /**
   * POST /api/auth/login
   * Faz login
   */
  login: (data: { email: string; password: string }): Promise<AxiosResponse<LoginResponse>> =>
    axiosInstance.post('/api/auth/login', data),

  /**
   * GET /api/auth/me
   * Busca usuário autenticado
   */
  getMe: (): Promise<AxiosResponse<GetMeResponse>> => axiosInstance.get('/api/auth/me'),

  /**
   * POST /api/auth/logout
   * Faz logout
   */
  logout: () => axiosInstance.post('/api/auth/logout'),
};

// ============================================================================
// Integration Auth API (OAuth-like flow)
// ============================================================================

export const integrationAuthApi = {
  /**
   * GET /api/integration/authorize
   * Inicia fluxo de autorização
   */
  initiateAuth: (params: {
    campaign_slug: string;
    api_key: string;
    bearer_token: string;
    redirect_uri?: string;
  }): Promise<AxiosResponse<InitiateAuthResponse>> =>
    axiosInstance.get('/api/integration/authorize', { params }),

  /**
   * POST /api/integration/telegram-auth
   * Processa autenticação do Telegram
   */
  telegramAuth: (
    stateToken: string,
    authData: any
  ): Promise<AxiosResponse<TelegramAuthResponse>> =>
    axiosInstance.post('/api/integration/telegram-auth', {
      stateToken,
      authData,
    }),

  /**
   * GET /api/integration/available-groups
   * Lista grupos Telegram disponíveis
   */
  listGroups: (stateToken: string): Promise<AxiosResponse<ListGroupsResponse>> =>
    axiosInstance.get('/api/integration/available-groups', {
      params: { stateToken },
    }),

  /**
   * POST /api/integration/select-group
   * Seleciona grupo Telegram
   */
  selectGroup: (
    stateToken: string,
    groupId: string,
    groupTitle: string
  ): Promise<AxiosResponse<SelectGroupResponse>> =>
    axiosInstance.post('/api/integration/select-group', {
      stateToken,
      groupId,
      groupTitle,
    }),

  /**
   * POST /api/integration/complete
   * Finaliza integração
   */
  complete: (
    stateToken: string,
    supportLevels: string[]
  ): Promise<AxiosResponse<CompleteIntegrationResponse>> =>
    axiosInstance.post('/api/integration/complete', {
      stateToken,
      supportLevels,
    }),

  /**
   * GET /api/integration/session/:stateToken
   * Busca dados da sessão
   */
  getSession: (stateToken: string): Promise<AxiosResponse<GetSessionResponse>> =>
    axiosInstance.get(`/api/integration/session/${stateToken}`),

  /**
   * POST /api/integration/cancel
   * Cancela autorização
   */
  cancel: (stateToken: string) =>
    axiosInstance.post('/api/integration/cancel', { stateToken }),
};

// ============================================================================
// Integration API
// ============================================================================

export const integrationApi = {
  /**
   * GET /api/integrations
   * Lista integrações do usuário
   */
  list: (): Promise<AxiosResponse<ListIntegrationsResponse>> =>
    axiosInstance.get('/api/integrations'),

  /**
   * GET /api/integrations/:id
   * Busca integração por ID
   */
  getById: (id: string): Promise<AxiosResponse<GetIntegrationResponse>> =>
    axiosInstance.get(`/api/integrations/${id}`),

  /**
   * POST /api/integrations
   * Cria nova integração
   */
  create: (data: any): Promise<AxiosResponse<CreateIntegrationResponse>> =>
    axiosInstance.post('/api/integrations', data),

  /**
   * DELETE /api/integrations/:id
   * Deleta integração
   */
  delete: (id: string) => axiosInstance.delete(`/api/integrations/${id}`),
};

// ============================================================================
// Support API
// ============================================================================

export const supportApi = {
  /**
   * GET /api/supports/my/supports
   * Lista apoios do usuário
   */
  getMySupports: (): Promise<AxiosResponse<MySupportsResponse>> =>
    axiosInstance.get('/api/supports/my/supports'),

  /**
   * POST /api/supports
   * Cria novo apoio
   */
  create: (data: Partial<ISupport>): Promise<AxiosResponse<CreateSupportResponse>> =>
    axiosInstance.post('/api/supports', data),

  /**
   * POST /api/supports/:id/pause
   * Pausa apoio
   */
  pause: (id: string) => axiosInstance.post(`/api/supports/${id}/pause`),

  /**
   * POST /api/supports/:id/resume
   * Resume apoio
   */
  resume: (id: string) => axiosInstance.post(`/api/supports/${id}/resume`),

  /**
   * POST /api/supports/:id/cancel
   * Cancela apoio
   */
  cancel: (id: string) => axiosInstance.post(`/api/supports/${id}/cancel`),
};

// Export do axios instance para casos especiais
export { axiosInstance as api };
export default axiosInstance;
