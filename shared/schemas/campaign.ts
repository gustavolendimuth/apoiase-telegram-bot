import { z } from 'zod';

// ============================================================================
// Reward Level Schema
// ============================================================================

export const rewardLevelSchema = z.object({
  id: z.string().optional(), // Optional because it's generated
  title: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .min(1, 'Valor mínimo é R$ 1'),
  description: z.string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  benefits: z.array(z.string().min(1, 'Benefício não pode estar vazio'))
    .min(1, 'Adicione pelo menos um benefício')
    .max(10, 'Máximo de 10 benefícios por nível'),
  maxBackers: z.number()
    .positive('Número máximo de apoiadores deve ser positivo')
    .optional(),
  estimatedDelivery: z.string()
    .optional(),
});

// ============================================================================
// Create Campaign Schema
// ============================================================================

export const createCampaignSchema = z.object({
  title: z.string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .trim(),

  slug: z.string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
    .trim(),

  description: z.string()
    .min(50, 'Descrição deve ter no mínimo 50 caracteres')
    .max(5000, 'Descrição deve ter no máximo 5000 caracteres')
    .trim(),

  category: z.string()
    .min(1, 'Selecione uma categoria')
    .max(50, 'Categoria muito longa'),

  goal: z.number()
    .positive('Meta deve ser maior que zero')
    .min(100, 'Meta mínima é R$ 100')
    .max(10000000, 'Meta máxima é R$ 10.000.000'),

  currency: z.string()
    .default('BRL')
    .refine(val => ['BRL', 'USD', 'EUR'].includes(val), {
      message: 'Moeda inválida. Use BRL, USD ou EUR',
    }),

  imageUrl: z.string()
    .url('URL da imagem inválida')
    .optional()
    .or(z.literal('')),

  videoUrl: z.string()
    .url('URL do vídeo inválida')
    .optional()
    .or(z.literal('')),

  rewardLevels: z.array(rewardLevelSchema)
    .min(1, 'Adicione pelo menos um nível de apoio')
    .max(20, 'Máximo de 20 níveis de apoio por campanha'),

  status: z.enum(['draft', 'active', 'paused', 'completed'])
    .default('draft'),
}).refine(
  (data) => {
    // Validar que reward levels estão ordenados por amount
    const amounts = data.rewardLevels.map(r => r.amount);
    for (let i = 1; i < amounts.length; i++) {
      if (amounts[i] < amounts[i - 1]) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Os níveis de apoio devem estar ordenados por valor (do menor para o maior)',
    path: ['rewardLevels'],
  }
);

// ============================================================================
// Update Campaign Schema
// ============================================================================

export const updateCampaignSchema = createCampaignSchema.partial();

// ============================================================================
// Search/Filter Schemas
// ============================================================================

export const campaignFiltersSchema = z.object({
  category: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(10).optional(),
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type RewardLevelFormData = z.infer<typeof rewardLevelSchema>;
export type CreateCampaignFormData = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignFormData = z.infer<typeof updateCampaignSchema>;
export type CampaignFilters = z.infer<typeof campaignFiltersSchema>;
