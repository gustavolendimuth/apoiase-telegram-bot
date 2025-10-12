import { Router } from 'express';
import integrationController from '../controllers/integrationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas de integração requerem autenticação
router.use(authenticateToken);

// Rotas CRUD (ownership verification done in controller)
router.post('/', integrationController.create);
router.get('/', integrationController.list);
router.get('/telegram-link/:campaignId', integrationController.getTelegramLink);
router.get('/:id', integrationController.getById);
router.put('/:id', integrationController.update);
router.delete('/:id', integrationController.delete);

// Rotas de ação (ownership verification done in controller)
router.post('/:id/activate', integrationController.activate);
router.post('/:id/deactivate', integrationController.deactivate);
router.post('/:id/regenerate-key', integrationController.regenerateApiKey);

export default router;
