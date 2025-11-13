import rateLimit from 'express-rate-limit';

// Rate limiter geral para API
// Em desenvolvimento, usa limites mais permissivos
const isDevelopment = process.env.NODE_ENV === 'development';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 1000 : 100, // 1000 em dev, 100 em prod
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter mais restritivo para webhooks
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: isDevelopment ? 300 : 30, // 300 em dev, 30 em prod
  message: 'Muitas requisições de webhook, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para autenticação
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 50 : 5, // 50 em dev, 5 em prod (segurança)
  message: 'Muitas tentativas de autenticação, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
