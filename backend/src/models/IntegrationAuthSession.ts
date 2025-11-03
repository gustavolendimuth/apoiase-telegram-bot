import mongoose, { Schema, Document } from 'mongoose';

/**
 * Sessão de autorização OAuth-like para integração Telegram
 * Armazena informações temporárias durante o fluxo de autorização
 */
export interface IIntegrationAuthSession extends Document {
  stateToken: string; // Token único anti-CSRF
  campaignSlug: string; // Slug da campanha no APOIA.se
  redirectUri: string; // URL de callback do APOIA.se
  apoiaseApiKey: string; // Credenciais passadas pelo APOIA.se
  apoiaseBearerToken: string;
  telegramUserId?: number; // ID do usuário Telegram (após login)
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramPhotoUrl?: string;
  selectedGroupId?: string; // ID do grupo Telegram selecionado
  selectedGroupTitle?: string;
  status: 'pending' | 'telegram_auth_complete' | 'group_selected' | 'completed' | 'expired' | 'error';
  errorMessage?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  isValid(): boolean;
  markExpired(): Promise<IIntegrationAuthSession>;
  markCompleted(): Promise<IIntegrationAuthSession>;
  setError(message: string): Promise<IIntegrationAuthSession>;
}

const IntegrationAuthSessionSchema = new Schema<IIntegrationAuthSession>(
  {
    stateToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campaignSlug: {
      type: String,
      required: true,
    },
    redirectUri: {
      type: String,
      required: true,
    },
    apoiaseApiKey: {
      type: String,
      required: true,
    },
    apoiaseBearerToken: {
      type: String,
      required: true,
    },
    telegramUserId: {
      type: Number,
      required: false,
    },
    telegramUsername: {
      type: String,
      required: false,
    },
    telegramFirstName: {
      type: String,
      required: false,
    },
    telegramPhotoUrl: {
      type: String,
      required: false,
    },
    selectedGroupId: {
      type: String,
      required: false,
    },
    selectedGroupTitle: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'telegram_auth_complete', 'group_selected', 'completed', 'expired', 'error'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para buscar sessões válidas
IntegrationAuthSessionSchema.index({ stateToken: 1, status: 1, expiresAt: 1 });

// Método para verificar se sessão está válida
IntegrationAuthSessionSchema.methods.isValid = function (): boolean {
  return ['pending', 'telegram_auth_complete', 'group_selected'].includes(this.status) && this.expiresAt > new Date();
};

// Método para marcar sessão como expirada
IntegrationAuthSessionSchema.methods.markExpired = function (): Promise<IIntegrationAuthSession> {
  this.status = 'expired';
  return this.save();
};

// Método para marcar sessão como completa
IntegrationAuthSessionSchema.methods.markCompleted = function (): Promise<IIntegrationAuthSession> {
  this.status = 'completed';
  return this.save();
};

// Método para adicionar erro
IntegrationAuthSessionSchema.methods.setError = function (message: string): Promise<IIntegrationAuthSession> {
  this.status = 'error';
  this.errorMessage = message;
  return this.save();
};

// TTL index para auto-remover sessões expiradas após 1 dia
IntegrationAuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IIntegrationAuthSession>(
  'IntegrationAuthSession',
  IntegrationAuthSessionSchema
);
