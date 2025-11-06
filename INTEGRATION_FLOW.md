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

### Verificação de Apoiadores

> **⚠️ IMPORTANTE - IMPLEMENTAÇÃO ATUAL:**
>
> Atualmente existem **dois modos de verificação** implementados no projeto:

**1. Verificação por Banco de Dados Interno (EM USO ATUALMENTE)**

O sistema usa o banco de dados local (models `User` e `Support`) para verificar apoiadores:

```typescript
// backend/src/services/verificationService.ts
async verifySupporterStatus(email: string, campaignId: string) {
  // Busca User pelo email no banco local
  // Busca Support ativo para a campanha
  // Retorna status baseado nos dados internos
}
```

**Vantagens:**
- Não depende de API externa
- Mais rápido (sem latência de rede)
- Útil para desenvolvimento e testes

**Desvantagens:**
- Não reflete mudanças em tempo real do APOIA.se
- Requer sincronização manual dos dados via webhooks

**2. API do APOIA.se (IMPLEMENTADA, PRONTA PARA USO)**

O serviço `apoiaseApiService` está implementado e configurado:

```typescript
// backend/src/services/apoiaseApiService.ts
async checkBacker(email: string, credentials: CampaignCredentials) {
  // GET ${APOIASE_API_URL}/backers/charges/${email}
  // Headers: x-api-key, authorization: Bearer
}
```

**Endpoint da API Real:**
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

**Para migrar para API do APOIA.se:**
1. Modificar `verificationService.ts` para usar `apoiaseApiService` ao invés do banco local
2. Garantir `APOIASE_API_URL=https://api.apoia.se` no `.env` (já configurado)
3. Implementar cache Redis para otimizar e respeitar rate limits (5 req/s, 5000 req/mês)

## Variáveis de Ambiente

### Backend (.env)

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username  # Usado no Telegram Login Widget

# APOIA.se API
APOIASE_API_URL=https://api.apoia.se  # URL da API real (já configurado)
APOIASE_API_KEY=your-apoiase-api-key  # API key global (opcional)
APOIASE_WEBHOOK_SECRET=your-webhook-secret  # Para validar webhooks

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

## Arquitetura de Verificação

**Implementação Atual:**

O projeto atualmente usa **verificação por banco de dados interno** (não usa a API do APOIA.se):

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Telegram   │────1───▶│  Backend         │────2───▶│  MongoDB    │
│  Bot        │         │  (verification)  │         │  (Support)  │
└─────────────┘         └──────────────────┘         └─────────────┘
                                 │
                                 └──────3──────▶ Resposta (hasAccess)
```

**Fluxo:**
1. Bot recebe email do apoiador
2. `verificationService.verifySupporterStatus()` consulta models `User` e `Support`
3. Retorna status baseado nos dados locais

**Quando migrar para API do APOIA.se:**

O `apoiaseApiService` já está implementado e pronto. Para ativá-lo:

1. Modificar `verificationService.ts`:
```typescript
// Trocar de:
const supporterData = await this.verifySupporterStatus(email, campaignId);

// Para:
const accessCheck = await apoiaseApiService.checkAccess(email, credentials);
```

2. O serviço já está configurado para usar `APOIASE_API_URL=https://api.apoia.se`
3. Adicionar cache Redis para otimizar chamadas

## Fluxo de Verificação de Apoiador

Após a integração estar ativa:

1. Apoiador envia `/start` no bot do Telegram
2. Bot solicita email do apoiador
3. Bot busca Integration associada à campanha
4. `verificationService.verifySupporterStatus()` consulta banco de dados local (User + Support)
5. Se apoio estiver ativo (`status === 'active'` e `paymentStatus === 'up_to_date'`):
   - Cria Member no banco
   - Gera link de convite único para o grupo (válido por 24h)
   - Envia link para o apoiador
6. Apoiador clica no link e entra no grupo Telegram

## Próximos Passos (TODO)

- [ ] **Migrar verificação do banco local para API do APOIA.se**
  - Modificar `verificationService.ts` para usar `apoiaseApiService`
  - O serviço já está implementado e configurado
- [ ] Implementar cache Redis para verificações (respeitar rate limits: 5 req/s, 5000 req/mês)
- [ ] Implementar criptografia das credenciais (AES-256)
- [ ] Implementar sincronização de reward levels do APOIA.se
- [ ] Adicionar listagem automática de grupos via Bot API
- [ ] Implementar webhooks do Telegram para detectar remoções manuais
- [ ] Adicionar testes automatizados

## Referências

- [Telegram Login Widget](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [APOIA.se API Docs](https://apoiase.notion.site/APOIA-se-API-4b87651821884061a7532abfd7f26087)
