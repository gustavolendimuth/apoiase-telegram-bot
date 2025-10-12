import jwt from 'jsonwebtoken';
import axios from 'axios';
import bcrypt from 'bcrypt';
import logger from '../config/logger';
import User from '../models/User';

export interface AuthUser {
  id: string;
  email: string;
  roles: Array<'admin' | 'user'>;
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
          roles: response.data.user.roles || ['user'],
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
        roles: user.roles,
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
   * Autentica usuário com banco de dados local
   */
  async authenticateUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    try {
      const userDoc = await User.findOne({ email });

      if (!userDoc) {
        logger.warn(`Login failed - user not found: ${email}`);
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userDoc.password);
      if (!isPasswordValid) {
        logger.warn(`Login failed - invalid password: ${email}`);
        return null;
      }

      const user: AuthUser = {
        id: (userDoc._id as any).toString(),
        email: userDoc.email,
        roles: userDoc.roles,
      };

      const token = this.generateToken(user);

      logger.info(`User authenticated: ${email}`);
      return { user, token };
    } catch (error) {
      logger.error('Erro ao autenticar usuário:', error);
      return null;
    }
  }

  /**
   * Registra novo usuário
   */
  async registerUser(
    email: string,
    password: string,
    name: string,
    roles?: Array<'admin' | 'user'>
  ): Promise<{ user: AuthUser; token: string } | null> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.warn(`Registration failed - user already exists: ${email}`);
        return null;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with default roles ['user'] if not provided
      const userDoc = new User({
        email,
        password: hashedPassword,
        name,
        roles: roles || ['user'],
      });

      await userDoc.save();

      const user: AuthUser = {
        id: (userDoc._id as any).toString(),
        email: userDoc.email,
        roles: userDoc.roles,
      };

      const token = this.generateToken(user);

      logger.info(`User registered: ${email}`);
      return { user, token };
    } catch (error) {
      logger.error('Erro ao registrar usuário:', error);
      return null;
    }
  }
}

export default new AuthService();
