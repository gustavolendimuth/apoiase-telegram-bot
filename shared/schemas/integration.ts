import { z } from 'zod';

// ============================================================================
// Create Integration Schema
// ============================================================================

export const createIntegrationSchema = z.object({
  campaignId: z.string()
    .min(1, 'ID da campanha é obrigatório')
    .regex(/^[a-f\d]{24}$/i, 'ID da campanha inválido'),

  telegramGroupId: z.string()
    .min(1, 'ID do grupo do Telegram é obrigatório')
    .regex(/^-?\d+$/, 'ID do grupo inválido'),

  telegramGroupTitle: z.string()
    .min(1, 'Título do grupo é obrigatório')
    .max(255, 'Título do grupo muito longo'),

  telegramGroupType: z.enum(['group', 'supergroup', 'channel'], {
    errorMap: () => ({ message: 'Tipo de grupo inválido' }),
  }),

  supportLevels: z.array(z.string())
    .min(1, 'Selecione pelo menos um nível de apoio')
    .max(20, 'Máximo de 20 níveis de apoio'),
});

// ============================================================================
// Update Integration Schema
// ============================================================================

export const updateIntegrationSchema = z.object({
  supportLevels: z.array(z.string())
    .min(1, 'Selecione pelo menos um nível de apoio')
    .max(20, 'Máximo de 20 níveis de apoio')
    .optional(),

  isActive: z.boolean()
    .optional(),
});

// ============================================================================
// Integration Auth Flow Schemas
// ============================================================================

// Initiate authorization
export const initiateAuthSchema = z.object({
  campaign_slug: z.string()
    .min(1, 'Slug da campanha é obrigatório'),

  api_key: z.string()
    .min(1, 'API key é obrigatória'),

  bearer_token: z.string()
    .min(1, 'Bearer token é obrigatório'),

  redirect_uri: z.string()
    .url('URL de redirecionamento inválida')
    .optional(),
});

// Telegram auth callback
export const telegramAuthSchema = z.object({
  stateToken: z.string()
    .min(1, 'Token de estado é obrigatório'),

  authData: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string().optional(),
    username: z.string().optional(),
    photo_url: z.string().url().optional(),
    auth_date: z.number(),
    hash: z.string(),
  }),
});

// Select Telegram group
export const selectGroupSchema = z.object({
  stateToken: z.string()
    .min(1, 'Token de estado é obrigatório'),

  groupId: z.string()
    .min(1, 'ID do grupo é obrigatório')
    .regex(/^-?\d+$/, 'ID do grupo inválido'),
});

// Complete integration
export const completeIntegrationSchema = z.object({
  stateToken: z.string()
    .min(1, 'Token de estado é obrigatório'),

  supportLevels: z.array(z.string())
    .min(1, 'Selecione pelo menos um nível de apoio')
    .max(20, 'Máximo de 20 níveis de apoio'),
});

// Cancel authorization
export const cancelAuthSchema = z.object({
  stateToken: z.string()
    .min(1, 'Token de estado é obrigatório'),

  reason: z.string()
    .optional(),
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type CreateIntegrationFormData = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationFormData = z.infer<typeof updateIntegrationSchema>;
export type InitiateAuthData = z.infer<typeof initiateAuthSchema>;
export type TelegramAuthData = z.infer<typeof telegramAuthSchema>;
export type SelectGroupFormData = z.infer<typeof selectGroupSchema>;
export type CompleteIntegrationFormData = z.infer<typeof completeIntegrationSchema>;
export type CancelAuthData = z.infer<typeof cancelAuthSchema>;
