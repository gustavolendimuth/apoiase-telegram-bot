import { Router } from 'express';
import integrationAuthController from '../controllers/integrationAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Rotas para fluxo de autorização OAuth-like
 * Serviço de integração Telegram para APOIA.se
 */

// Inicia autorização (público - vem do APOIA.se com credenciais temporárias)
router.get('/authorize', integrationAuthController.initiateAuthorization);

// Processa autenticação Telegram (público)
router.post('/telegram-auth', integrationAuthController.processTelegramAuth);

// Lista grupos disponíveis (público - mas validado por state token)
router.get('/available-groups', integrationAuthController.listAvailableGroups);

// Seleciona grupo Telegram (público - mas validado por state token)
router.post('/select-group', integrationAuthController.selectGroup);

// Finaliza e cria integração (público - validado por state token)
router.post('/complete', integrationAuthController.completeAuthorization);

// Busca sessão (público - mas validado por state token)
router.get('/session/:stateToken', integrationAuthController.getSession);

// Cancela autorização (público)
router.post('/cancel', integrationAuthController.cancelAuthorization);

// Callback para redirecionar de volta ao APOIA.se
router.get('/callback', integrationAuthController.handleCallback);

export default router;
