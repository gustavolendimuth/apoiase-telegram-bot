import { Router } from 'express';
import integrationController from '../controllers/integrationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas de integração requerem autenticação
router.use(authenticateToken);

// Rotas específicas DEVEM vir ANTES das rotas genéricas com parâmetros (:id)
router.get('/add-bot-url', integrationController.getAddBotUrl);
router.get('/telegram-link/:campaignId', integrationController.getTelegramLink);

// Rotas CRUD (ownership verification done in controller)
router.post('/', integrationController.create);
router.get('/', integrationController.list);
router.get('/:id', integrationController.getById);
router.put('/:id', integrationController.update);
router.delete('/:id', integrationController.delete);

// Rotas de ação (ownership verification done in controller)
router.post('/:id/activate', integrationController.activate);
router.post('/:id/deactivate', integrationController.deactivate);
router.post('/:id/regenerate-key', integrationController.regenerateApiKey);

// Rotas de autorização do Telegram (OAuth-like flow)
router.post('/telegram/authorize', integrationController.startTelegramAuth);
router.get('/telegram/authorize/:token', integrationController.checkTelegramAuth);

// Rota para apoiadores verificarem integração
router.get('/supporter/:campaignId', integrationController.getIntegrationForSupporter);

export default router;
