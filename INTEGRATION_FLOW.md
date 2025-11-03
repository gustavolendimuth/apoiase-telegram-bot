# Fluxo de Integração APOIA.se + Telegram

Este documento descreve o fluxo completo de integração OAuth-like entre o APOIA.se e o Telegram Bot.

## Visão Geral

A integração permite que makers do APOIA.se conectem seus grupos/canais do Telegram às suas campanhas, automatizando o controle de acesso baseado no status de pagamento dos apoiadores.

## Arquitetura

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  APOIA.se   │────1───▶│  Nossa Aplicação │────2───▶│  Telegram   │
│  (Maker)    │         │  (Authorization) │         │  (Login)    │
└─────────────┘         └──────────────────┘         └─────────────┘
       ▲                          │                          │
       │                          │                          │
       └──────────────4───────────┘◀──────────3──────────────┘
                 (Callback)              (Group Selection)
```

## Fluxo Detalhado

### 1. Inicialização (APOIA.se → Nossa App)

O maker clica em "Conectar Telegram" na página de edição da campanha no APOIA.se.

**URL de redirecionamento:**
```
https://seu-dominio.com/integration/authorize
  ?campaign_slug=minha-campanha
  &api_key=xxx
  &bearer_token=yyy
  &redirect_uri=https://apoia.se/campaigns/slug/integrations/callback
```

**Backend processa:**
- `GET /api/integration/authorize` (integrationAuthController.ts:22)
- Valida credenciais com API do APOIA.se
- Cria sessão temporária (IntegrationAuthSession)
- Gera state token único (segurança anti-CSRF)
- Retorna state token para o frontend

**Modelos:**
- [IntegrationAuthSession](backend/src/models/IntegrationAuthSession.ts) - Sessão temporária (expira em 30min)

### 2. Autenticação Telegram (Telegram Login Widget)

O usuário faz login com sua conta do Telegram.

**Frontend:**
- Carrega Telegram Login Widget
- Widget callback: `onTelegramAuth(user)`
- Dados retornados: `{ id, first_name, username, photo_url, auth_date, hash }`

**Backend processa:**
- `POST /api/integration/telegram-auth` (integrationAuthController.ts:57)
- Valida hash do Telegram (verifica autenticidade)
- Atualiza sessão com dados do usuário Telegram
- Muda status da sessão: `pending` → `telegram_auth_complete`

**Validação de Hash:**
```typescript
// Calcula hash esperado usando bot token
const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
const calculatedHash = crypto.createHmac('sha256', secretKey)
  .update(dataCheckString)
  .digest('hex');

// Compara com hash recebido
return calculatedHash === receivedHash;
```

### 3. Seleção do Grupo Telegram

O usuário seleciona qual grupo do Telegram será integrado.

**Frontend:**
- [TelegramGroupSelector](frontend/src/components/TelegramGroupSelector.tsx)
- Usuário insere ID e nome do grupo
- Instruções para obter ID usando @RawDataBot

**Backend processa:**
- `POST /api/integration/select-group` (integrationAuthController.ts:91)
- Valida formato do ID do grupo (-100 para supergrupos)
- Atualiza sessão com grupo selecionado
- Muda status: `telegram_auth_complete` → `group_selected`

### 4. Finalização e Callback

O usuário confirma e a integração é criada.

**Backend processa:**
- `POST /api/integration/complete` (integrationAuthController.ts:120)
- **Requer autenticação** (JWT token)
- Busca ou cria Campaign local
- Verifica se grupo já não está integrado
- Cria Integration com credenciais criptografadas
- Muda status da sessão: `group_selected` → `completed`
- Retorna URL de callback

**Integration criada:**
```typescript
{
  campaignId: ObjectId,
  campaignSlug: 'minha-campanha',
  telegramGroupId: '-1001234567890',
  telegramGroupType: 'supergroup',
  telegramGroupTitle: 'Apoiadores VIP',
  apiKey: 'generated-key',
  apoiaseApiKey: 'xxx', // Criptografado (select: false)
  apoiaseBearerToken: 'yyy', // Criptografado (select: false)
  rewardLevels: [],
  isActive: true,
  createdBy: ObjectId(userId)
}
```

**Redirecionamento:**
```
https://apoia.se/campaigns/slug/integrations/callback
  ?state=abc123
  &status=success
  &integration_id=xyz789
```

## Arquivos Criados/Modificados

### Backend

**Novos arquivos:**
- [backend/src/services/apoiaseApiService.ts](backend/src/services/apoiaseApiService.ts) - Cliente API do APOIA.se
- [backend/src/services/integrationAuthService.ts](backend/src/services/integrationAuthService.ts) - Lógica de autorização
- [backend/src/controllers/integrationAuthController.ts](backend/src/controllers/integrationAuthController.ts) - Endpoints REST
- [backend/src/routes/integrationAuthRoutes.ts](backend/src/routes/integrationAuthRoutes.ts) - Rotas
- [backend/src/models/IntegrationAuthSession.ts](backend/src/models/IntegrationAuthSession.ts) - Modelo de sessão

**Arquivos modificados:**
- [backend/src/models/Integration.ts](backend/src/models/Integration.ts) - Adicionado campos: `campaignSlug`, `apoiaseApiKey`, `apoiaseBearerToken`
- [backend/src/services/verificationService.ts](backend/src/services/verificationService.ts) - Integrado com API real do APOIA.se
- [backend/src/index.ts](backend/src/index.ts) - Registrado rotas de autorização

### Frontend

**Novos arquivos:**
- [frontend/src/app/integration/authorize/page.tsx](frontend/src/app/integration/authorize/page.tsx) - Página de autorização
- [frontend/src/components/TelegramGroupSelector.tsx](frontend/src/components/TelegramGroupSelector.tsx) - Seletor de grupo

## API Endpoints

### Fluxo de Autorização

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| GET | `/api/integration/authorize` | Público | Inicia autorização |
| POST | `/api/integration/telegram-auth` | Público | Processa login Telegram |
| POST | `/api/integration/select-group` | State token | Seleciona grupo |
| POST | `/api/integration/complete` | JWT required | Finaliza integração |
| GET | `/api/integration/session/:stateToken` | State token | Busca sessão |
| POST | `/api/integration/cancel` | Público | Cancela autorização |
| GET | `/api/integration/callback` | Público | Callback para APOIA.se |

### API do APOIA.se

**Endpoint usado:**
```
GET https://api.apoia.se/backers/charges/{email}

Headers:
  x-api-key: {campaign_api_key}
  authorization: Bearer {campaign_bearer_token}

Response:
{
  isBacker: boolean,
  isPaidThisMonth: boolean,
  thisMonthPaidValue?: number
}
```

## Variáveis de Ambiente

### Backend (.env)

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username  # Usado no Telegram Login Widget

# APOIA.se API
APOIASE_API_URL=https://api.apoia.se

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Telegram Bot (para Login Widget)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

## Segurança

### State Token
- Gerado com `crypto.randomBytes(32)` (256 bits)
- Base64url encoded
- Expira em 30 minutos
- Previne CSRF attacks

### Telegram Hash Validation
- Valida autenticidade dos dados do Telegram Login Widget
- Usa HMAC-SHA256 com bot token como chave
- Verifica timestamp (máximo 5 minutos)

### Credenciais APOIA.se
- Armazenadas com `select: false` no Mongoose
- Não retornadas por padrão em queries
- Devem ser explicitamente selecionadas: `.select('+apoiaseApiKey +apoiaseBearerToken')`
- Recomendado: criptografar antes de salvar no banco (TODO)

### Rate Limiting
- API do APOIA.se: 5 req/s, 5000 req/mês
- Implementar cache para reduzir chamadas

## Tratamento de Erros

| Erro | Status | Descrição |
|------|--------|-----------|
| Credenciais inválidas | 401 | API key ou Bearer token incorretos |
| Sessão expirada | 400 | State token inválido ou expirado |
| Grupo já integrado | 400 | Grupo pertence a outra campanha |
| Telegram hash inválido | 400 | Dados do Telegram não autênticos |

## Fluxo de Verificação de Apoiador

Após a integração estar ativa:

1. Apoiador envia `/start` no bot
2. Bot solicita email
3. Bot busca Integration
4. `verificationService.verifySupporterStatus()` chama API do APOIA.se
5. Se `isPaidThisMonth === true`, cria Member e gera link de convite
6. Apoiador entra no grupo

## Próximos Passos (TODO)

- [ ] Implementar criptografia das credenciais (AES-256)
- [ ] Adicionar cache Redis para verificações (reduzir API calls)
- [ ] Implementar sincronização de reward levels do APOIA.se
- [ ] Adicionar listagem automática de grupos via Bot API
- [ ] Implementar webhooks do Telegram para detectar remoções manuais
- [ ] Adicionar testes automatizados

## Referências

- [Telegram Login Widget](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [APOIA.se API Docs](https://apoiase.notion.site/APOIA-se-API-4b87651821884061a7532abfd7f26087)
