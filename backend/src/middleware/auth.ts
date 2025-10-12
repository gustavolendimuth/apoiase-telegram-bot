import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: Array<'admin' | 'user'>;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      roles: Array<'admin' | 'user'>;
    };

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Erro ao verificar token:', error);
    res.status(403).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles: Array<'admin' | 'user'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Check if user has at least one of the required roles
    const hasRequiredRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({ error: 'Permissão negada' });
      return;
    }

    next();
  };
};
