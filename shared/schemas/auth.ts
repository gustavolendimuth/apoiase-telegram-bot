import { z } from 'zod';

// ============================================================================
// Register Schema
// ============================================================================

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),

  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ============================================================================
// Login Schema
// ============================================================================

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(1, 'Digite sua senha'),
});

// ============================================================================
// Validate APOIA.se Token Schema
// ============================================================================

export const validateApoiaseTokenSchema = z.object({
  token: z.string()
    .min(1, 'Token é obrigatório'),
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ValidateApoiaseTokenData = z.infer<typeof validateApoiaseTokenSchema>;
