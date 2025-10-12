import { Request, Response } from 'express';
import authService from '../services/authService';
import logger from '../config/logger';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Controller de autenticação
 */
export class AuthController {
  /**
   * Login de usuário
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      const result = await authService.authenticateUser(email, password);

      if (!result) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      logger.info('Usuário autenticado com sucesso:', email);

      res.json({
        message: 'Login realizado com sucesso',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      logger.error('Erro ao fazer login:', error);
      res.status(500).json({ error: 'Erro ao processar login' });
    }
  }

  /**
   * Valida token da APOIA.se
   * POST /api/auth/validate-apoiase
   */
  async validateApoiase(req: Request, res: Response): Promise<void> {
    try {
      const { email, apoiaseToken } = req.body;

      if (!email || !apoiaseToken) {
        res.status(400).json({ error: 'Email e token da APOIA.se são obrigatórios' });
        return;
      }

      const user = await authService.validateApoiaseUser(email, apoiaseToken);

      if (!user) {
        res.status(401).json({ error: 'Token inválido ou usuário não encontrado' });
        return;
      }

      const token = authService.generateToken(user);

      logger.info('Token APOIA.se validado com sucesso:', email);

      res.json({
        message: 'Token validado com sucesso',
        user,
        token,
      });
    } catch (error) {
      logger.error('Erro ao validar token APOIA.se:', error);
      res.status(500).json({ error: 'Erro ao validar token' });
    }
  }

  /**
   * Retorna informações do usuário autenticado
   * GET /api/auth/me
   */
  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      res.json({
        user: req.user,
      });
    } catch (error) {
      logger.error('Erro ao buscar informações do usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar informações' });
    }
  }

  /**
   * Logout (invalidar token - implementar blacklist se necessário)
   * POST /api/auth/logout
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // TODO: Implementar blacklist de tokens se necessário
      logger.info('Usuário deslogado:', req.user?.email);

      res.json({
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao fazer logout:', error);
      res.status(500).json({ error: 'Erro ao processar logout' });
    }
  }

  /**
   * Registra novo usuário
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
        return;
      }

      const result = await authService.registerUser(email, password, name, role);

      if (!result) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
      }

      logger.info('Usuário registrado com sucesso:', email);

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      logger.error('Erro ao registrar usuário:', error);
      res.status(500).json({ error: 'Erro ao processar registro' });
    }
  }
}

export default new AuthController();
