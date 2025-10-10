import { Router } from 'express';
import integrationController from '../controllers/integrationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Todas as rotas de integração requerem autenticação
router.use(authenticateToken);

// Rotas CRUD
router.post('/', requireRole('maker', 'admin'), integrationController.create);
router.get('/', integrationController.list);
router.get('/:id', integrationController.getById);
router.put('/:id', requireRole('maker', 'admin'), integrationController.update);
router.delete('/:id', requireRole('maker', 'admin'), integrationController.delete);

// Rotas de ação
router.post('/:id/activate', requireRole('maker', 'admin'), integrationController.activate);
router.post('/:id/deactivate', requireRole('maker', 'admin'), integrationController.deactivate);
router.post('/:id/regenerate-key', requireRole('maker', 'admin'), integrationController.regenerateApiKey);

export default router;
