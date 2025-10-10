import jwt from 'jsonwebtoken';
import axios from 'axios';
import logger from '../config/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: 'maker' | 'supporter' | 'admin';
}

/**
 * Serviço de autenticação
 * Integra com a API da APOIA.se para validar usuários
 */
export class AuthService {
  private apoiaseApiUrl: string;
  private apoiaseApiKey: string;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.apoiaseApiUrl = process.env.APOIASE_API_URL || 'https://api.apoia.se';
    this.apoiaseApiKey = process.env.APOIASE_API_KEY || '';
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Valida credenciais na API da APOIA.se
   */
  async validateApoiaseUser(email: string, token: string): Promise<AuthUser | null> {
    try {
      // TODO: Implementar integração real com API da APOIA.se
      // Por enquanto, mock para desenvolvimento
      logger.info('Validando usuário na APOIA.se:', email);

      const response = await axios.get(`${this.apoiaseApiUrl}/users/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': this.apoiaseApiKey,
        },
      });

      if (response.data && response.data.user) {
        return {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role || 'supporter',
        };
      }

      return null;
    } catch (error) {
      logger.error('Erro ao validar usuário na APOIA.se:', error);
      return null;
    }
  }

  /**
   * Gera token JWT para o usuário
   */
  generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret,
      {
        expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
      }
    );
  }

  /**
   * Verifica e decodifica token JWT
   */
  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthUser;
      return decoded;
    } catch (error) {
      logger.error('Erro ao verificar token:', error);
      return null;
    }
  }

  /**
   * Autentica usuário (mock para desenvolvimento)
   */
  async authenticateUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    try {
      // TODO: Integração real com APOIA.se
      // Por enquanto, aceitar qualquer email/senha para desenvolvimento
      logger.warn('Usando autenticação mock - apenas para desenvolvimento!');

      const user: AuthUser = {
        id: 'mock-user-id',
        email,
        role: email.includes('maker') ? 'maker' : 'supporter',
      };

      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      logger.error('Erro ao autenticar usuário:', error);
      return null;
    }
  }
}

export default new AuthService();
