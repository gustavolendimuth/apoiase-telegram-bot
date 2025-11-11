import { z } from 'zod';

// ============================================================================
// Create Support Schema
// ============================================================================

export const createSupportSchema = z.object({
  campaignId: z.string()
    .min(1, 'ID da campanha é obrigatório')
    .regex(/^[a-f\d]{24}$/i, 'ID da campanha inválido'),

  rewardLevelId: z.string()
    .min(1, 'Selecione um nível de apoio'),

  amount: z.number()
    .positive('Valor deve ser positivo')
    .min(1, 'Valor mínimo é R$ 1'),

  recurring: z.boolean()
    .default(false),

  paymentMethod: z.enum(['credit_card', 'pix', 'boleto'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' }),
  }).optional(),
});

// ============================================================================
// Update Support Status Schema
// ============================================================================

export const updateSupportStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled', 'payment_failed'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type CreateSupportFormData = z.infer<typeof createSupportSchema>;
export type UpdateSupportStatusData = z.infer<typeof updateSupportStatusSchema>;
