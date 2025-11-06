# 🏗️ Arquitetura do Sistema

## 📐 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         APOIA.se Platform                        │
│                    (API + Webhook Events)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Webhooks
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend API (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │ Integrations │  │   Members    │         │
│  │ Controllers  │  │  Controllers │  │ Controllers  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐        │
│  │              Services Layer                         │        │
│  │  • authService  • integrationService               │        │
│  │  • telegramService  • verificationService          │        │
│  └────────────────────────┬────────────────────────────┘        │
│                           │                                      │
│  ┌────────────────────────▼────────────────────────────┐        │
│  │              Models (Mongoose)                      │        │
│  │  • Integration  • Member  • EventLog                │        │
│  └────────────────────────┬────────────────────────────┘        │
└───────────────────────────┼──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   MongoDB    │    │    Redis     │    │   Telegram   │
│  (Database)  │    │   (Cache)    │    │  Bot API     │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   Grupos/    │
                                        │   Canais     │
                                        │  Telegram    │
                                        └──────────────┘
```

---

## 🔄 Fluxo de Dados Principal

### 1. Criação de Integração (Fazedor)

```
Frontend                Backend               MongoDB          Telegram
   │                       │                    │                │
   │  POST /integrations   │                    │                │
   ├──────────────────────►│                    │                │
   │                       │                    │                │
   │                       │ Validate Bot       │                │
   │                       │ Permissions        │                │
   │                       ├───────────────────────────────────►│
   │                       │                    │                │
   │                       │◄───────────────────────────────────┤
   │                       │                    │                │
   │                       │ Generate API Key   │                │
   │                       │                    │                │
   │                       │ Save Integration   │                │
   │                       ├───────────────────►│                │
   │                       │                    │                │
   │                       │◄───────────────────┤                │
   │                       │                    │                │
   │  Response (API Key)   │                    │                │
   │◄──────────────────────┤                    │                │
```

### 2. Novo Apoio (APOIA.se → Sistema)

```
APOIA.se              Backend               MongoDB          Telegram
   │                     │                     │                │
   │ Webhook Event       │                     │                │
   │ (new supporter)     │                     │                │
   ├────────────────────►│                     │                │
   │                     │                     │                │
   │                     │ Validate Signature  │                │
   │                     │                     │                │
   │                     │ Create Member       │                │
   │                     ├────────────────────►│                │
   │                     │                     │                │
   │                     │ Generate Invite     │                │
   │                     │ Link                │                │
   │                     ├────────────────────────────────────►│
   │                     │                     │                │
   │                     │◄────────────────────────────────────┤
   │                     │                     │                │
   │                     │ Send Email/Telegram │                │
   │                     │ with Link           │                │
   │  200 OK             │                     │                │
   │◄────────────────────┤                     │                │
```

### 3. Verificação de Apoiador (Bot)

```
User (Telegram)      Bot Service          Backend API        MongoDB
      │                   │                    │                │
      │ /verify           │                    │                │
      ├──────────────────►│                    │                │
      │                   │                    │                │
      │ "Informe email"   │                    │                │
      │◄──────────────────┤                    │                │
      │                   │                    │                │
      │ email@test.com    │                    │                │
      ├──────────────────►│                    │                │
      │                   │                    │                │
      │                   │ Verify Supporter   │                │
      │                   ├───────────────────►│                │
      │                   │                    │                │
      │                   │                    │ Check Status   │
      │                   │                    ├───────────────►│
      │                   │                    │                │
      │                   │                    │◄───────────────┤
      │                   │                    │                │
      │                   │◄───────────────────┤                │
      │                   │                    │                │
      │                   │ Update Member      │                │
      │                   │ Status             │                │
      │                   ├───────────────────►│                │
      │                   │                    │                │
      │ "Verificado!"     │                    │                │
      │◄──────────────────┤                    │                │
```

### 4. Sincronização Diária (Job Automático)

```
Cron Job              Backend               MongoDB          Telegram
   │                     │                     │                │
   │ Trigger             │                     │                │
   │ (02:00 AM)          │                     │                │
   ├────────────────────►│                     │                │
   │                     │                     │                │
   │                     │ Get All Active      │                │
   │                     │ Members             │                │
   │                     ├────────────────────►│                │
   │                     │                     │                │
   │                     │◄────────────────────┤                │
   │                     │                     │                │
   │                     │ For Each Member:    │                │
   │                     │ Check Payment       │                │
   │                     │ Status (APOIA.se)   │                │
   │                     │                     │                │
   │                     │ If Overdue:         │                │
   │                     │ - Send Warning      │                │
   │                     ├────────────────────────────────────►│
   │                     │                     │                │
   │                     │ If >7 days:         │                │
   │                     │ - Remove from Group │                │
   │                     ├────────────────────────────────────►│
   │                     │                     │                │
   │                     │ Update Status       │                │
   │                     ├────────────────────►│                │
   │  Done               │                     │                │
   │◄────────────────────┤                     │                │
```

### 5. Fluxo OAuth-like de Integração (APOIA.se → Telegram) - Detalhado

Este fluxo permite que makers conectem seus grupos Telegram sem configuração manual.

#### Arquitetura

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

#### Fluxo Simplificado

```
APOIA.se              Integration Service    Telegram API      MongoDB
   │                          │                     │               │
   │ 1. POST /campaigns/      │                     │               │
   │    :slug/integrations/   │                     │               │
   │    telegram              │                     │               │
   ├─────────────────────────►│                     │               │
   │                          │                     │               │
   │                          │ Create temp         │               │
   │                          │ credentials (Redis) │               │
   │                          │ Generate state token│               │
   │                          │                     │               │
   │ 2. Redirect URL          │                     │               │
   │◄─────────────────────────┤                     │               │
   │                          │                     │               │
   │                                                                 │
   │                    User Browser                                │
   │                          │                     │               │
   │ 3. GET /integration/     │                     │               │
   │    authorize?state=xxx   │                     │               │
   ├─────────────────────────►│                     │               │
   │                          │                     │               │
   │                          │ Create session      │               │
   │                          ├────────────────────────────────────►│
   │                          │                     │               │
   │ 4. Show Telegram         │                     │               │
   │    Login Widget          │                     │               │
   │◄─────────────────────────┤                     │               │
   │                          │                     │               │
   │ 5. User logs in          │                     │               │
   │    with Telegram         │                     │               │
   ├──────────────────────────┼────────────────────►│               │
   │                          │                     │               │
   │                          │◄────────────────────┤               │
   │                          │  (auth data + hash) │               │
   │                          │                     │               │
   │ 6. POST /integration/    │                     │               │
   │    telegram-auth         │                     │               │
   ├─────────────────────────►│                     │               │
   │                          │                     │               │
   │                          │ Validate hash       │               │
   │                          │ Update session      │               │
   │                          ├────────────────────────────────────►│
   │                          │                     │               │
   │ 7. GET /integration/     │                     │               │
   │    available-groups      │                     │               │
   ├─────────────────────────►│                     │               │
   │                          │                     │               │
   │                          │ List bot's groups   │               │
   │                          ├────────────────────►│               │
   │                          │                     │               │
   │                          │◄────────────────────┤               │
   │                          │  (groups list)      │               │
   │                          │                     │               │
   │ 8. Groups list           │                     │               │
   │◄─────────────────────────┤                     │               │
   │                          │                     │               │
   │ 9. POST /integration/    │                     │               │
   │    select-group          │                     │               │
   ├─────────────────────────►│                     │               │
   │                          │                     │               │
   │                          │ Update session      │               │
   │                          ├────────────────────────────────────►│
   │                          │                     │               │
   │ 10. POST /integration/   │                     │               │
   │     complete             │                     │               │
   ├─────────────────────────►│                     │               │
   │                          │                     │               │
   │                          │ Create Integration  │               │
   │                          ├────────────────────────────────────►│
   │                          │                     │               │
   │                          │ Mark session        │               │
   │                          │ as completed        │               │
   │                          ├────────────────────────────────────►│
   │                          │                     │               │
   │ 11. Callback redirect    │                     │               │
   │     to APOIA.se          │                     │               │
   │◄─────────────────────────┤                     │               │
   │                          │                     │               │
APOIA.se                      │                     │               │
   │                          │                     │               │
   │ GET /campaigns/:slug/    │                     │               │
   │ integrations/telegram/   │                     │               │
   │ callback?status=success  │                     │               │
   │                          │                     │               │
   │ Show success message     │                     │               │
```

**Segurança do Fluxo OAuth:**
- State token único (256 bits, base64url) previne CSRF
- Credenciais temporárias armazenadas em Redis (expira em 1h)
- Sessão expira em 30 minutos
- Hash do Telegram validado com HMAC-SHA256
- Credenciais do APOIA.se armazenadas com `select: false` no Mongoose

---

## 🗂️ Estrutura de Diretórios

```
apoiase-telegram-bot/
│
├── backend/                    # API e lógica de negócio
│   ├── src/
│   │   ├── config/            # Configurações (DB, Redis, Logger)
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── logger.ts
│   │   │
│   │   ├── controllers/       # Controllers (lógica de requisição/resposta)
│   │   │   ├── authController.ts
│   │   │   ├── integrationController.ts  # ✅ COMPLETO
│   │   │   └── webhookController.ts      # ✅ COMPLETO
│   │   │
│   │   ├── middleware/        # Middlewares Express
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── errorHandler.ts
│   │   │
│   │   ├── models/            # Models Mongoose
│   │   │   ├── Integration.ts
│   │   │   ├── Member.ts
│   │   │   └── EventLog.ts
│   │   │
│   │   ├── routes/            # Rotas da API
│   │   │   ├── authRoutes.ts
│   │   │   ├── integrationRoutes.ts     # ✅ COMPLETO
│   │   │   └── webhookRoutes.ts         # ✅ COMPLETO
│   │   │
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── authService.ts
│   │   │   ├── telegramService.ts
│   │   │   ├── integrationService.ts    # ✅ COMPLETO
│   │   │   ├── memberService.ts         # ✅ COMPLETO
│   │   │   └── verificationService.ts   # ✅ COMPLETO
│   │   │
│   │   ├── jobs/              # Jobs agendados (Bull)
│   │   │   └── syncMembers.ts           # ✅ COMPLETO (sync diário + verificação 6h)
│   │   │
│   │   ├── scripts/           # Scripts de manutenção
│   │   │   └── initDb.ts
│   │   │
│   │   └── index.ts           # Entry point
│   │
│   ├── logs/                  # Logs (gerado em runtime)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                  # Interface web (Next.js)
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # ✅ Landing page
│   │   │   ├── login/                # ✅ Login page
│   │   │   └── dashboard/            # ✅ Dashboard completo
│   │   │
│   │   ├── components/       # Componentes React
│   │   │   └── ui/                   # ✅ 7 componentes (Button, Input, Card, Badge, Modal, Toast, Loading)
│   │   │
│   │   ├── lib/              # Bibliotecas e utils
│   │   │   └── api.ts
│   │   │
│   │   ├── hooks/            # Custom hooks
│   │   │   ├── useAuth.tsx           # ✅ COMPLETO
│   │   │   └── useIntegrations.ts    # ✅ COMPLETO
│   │   │
│   │   └── styles/           # Estilos
│   │       └── globals.css
│   │
│   ├── public/               # Arquivos estáticos
│   ├── .env.example
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── shared/                   # Código compartilhado
│   ├── types.ts
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
├── package.json
└── README.md
```

---

## 🔗 Endpoints da API

### Autenticação (`/api/auth`)
```
POST   /api/auth/register              # Registrar novo usuário
POST   /api/auth/login                 # Login com email/senha
POST   /api/auth/validate-apoiase      # Validar token APOIA.se
GET    /api/auth/me                    # Info do usuário (protegida)
POST   /api/auth/logout                # Logout (protegida)
```

### Campanhas (`/api/campaigns`)
```
POST   /api/campaigns                  # Criar campanha (auth)
GET    /api/campaigns/all              # Listar campanhas públicas
GET    /api/campaigns/search           # Buscar campanhas
GET    /api/campaigns/my/campaigns     # Minhas campanhas (auth)
GET    /api/campaigns/slug/:slug       # Buscar por slug
GET    /api/campaigns/:id              # Detalhes da campanha
PUT    /api/campaigns/:id              # Atualizar (auth + ownership)
DELETE /api/campaigns/:id              # Deletar (auth + ownership)
```

### Apoios (`/api/supports`)
```
POST   /api/supports                   # Criar apoio (auth)
GET    /api/supports/my/supports       # Meus apoios (auth)
GET    /api/supports/campaign/:id      # Apoios de uma campanha
POST   /api/supports/:id/pause         # Pausar apoio (auth)
POST   /api/supports/:id/resume        # Retomar apoio (auth)
POST   /api/supports/:id/cancel        # Cancelar apoio (auth)
```

### Integrações (`/api/integrations`)
```
POST   /api/integrations               # Criar integração (auth)
GET    /api/integrations               # Listar integrações (auth)
GET    /api/integrations/telegram-link/:campaignId  # Link do Telegram
GET    /api/integrations/:id           # Detalhes (auth)
PUT    /api/integrations/:id           # Atualizar (auth + ownership)
DELETE /api/integrations/:id           # Deletar (auth + ownership)
POST   /api/integrations/:id/activate  # Ativar integração
POST   /api/integrations/:id/deactivate # Desativar integração
POST   /api/integrations/:id/regenerate-key # Regenerar API key
```

### Autorização de Integração OAuth (`/api/integration`)
```
GET    /api/integration/authorize      # Iniciar fluxo OAuth
POST   /api/integration/telegram-auth  # Callback Telegram Widget
GET    /api/integration/available-groups # Listar grupos do bot
POST   /api/integration/select-group   # Selecionar grupo
POST   /api/integration/complete       # Completar integração (auth)
GET    /api/integration/session/:token # Status da sessão
POST   /api/integration/cancel         # Cancelar fluxo
GET    /api/integration/callback       # Callback para APOIA.se
```

### Rotas APOIA.se (`/api/campaigns/:slug/integrations/telegram`)
```
POST   /api/campaigns/:slug/integrations/telegram     # Iniciar do APOIA.se
GET    /api/campaigns/:slug/integrations/telegram/callback # Callback
GET    /api/campaigns/:slug/integrations/telegram     # Listar integrações
DELETE /api/campaigns/:slug/integrations/telegram/:id # Remover
```

### Webhooks
```
POST   /webhook/apoiase                # Webhook APOIA.se (6 eventos)
POST   /webhook/telegram               # Webhook Telegram
```

### Health Check
```
GET    /health                         # Status do servidor
```

---

## 🗄️ Schemas do Banco de Dados

### Collection: `integrations`

| Campo              | Tipo     | Descrição                    | Índice |
|--------------------|----------|------------------------------|--------|
| _id                | ObjectId | ID único                     | ✓      |
| campaignId         | ObjectId | Ref: campaigns               | ✓      |
| campaignSlug       | String   | Slug da campanha             |        |
| telegramGroupId    | String   | ID do grupo Telegram         | ✓      |
| telegramGroupType  | Enum     | Tipo do grupo                |        |
| telegramGroupTitle | String   | Nome do grupo                |        |
| apiKey             | String   | Chave API única              | ✓      |
| apoiaseApiKey      | String   | API key do APOIA.se (select: false) |  |
| apoiaseBearerToken | String   | Bearer token do APOIA.se (select: false) | |
| rewardLevels       | Array    | Níveis de recompensa         |        |
| isActive           | Boolean  | Status ativo/inativo         | ✓      |
| createdBy          | ObjectId | Ref: users                   |        |
| createdAt          | Date     | Data de criação              |        |
| updatedAt          | Date     | Data de atualização          |        |

### Collection: `members`

| Campo              | Tipo     | Descrição                    | Índice |
|--------------------|----------|------------------------------|--------|
| _id                | ObjectId | ID único                     | ✓      |
| integrationId      | ObjectId | Ref: integrations            | ✓      |
| supporterEmail     | String   | Email do apoiador            | ✓      |
| supporterId        | String   | ID APOIA.se                  | ✓      |
| telegramUserId     | String   | ID Telegram                  | ✓      |
| telegramUsername   | String   | Username Telegram            |        |
| status             | Enum     | Status do membro             | ✓      |
| joinedAt           | Date     | Data de entrada              |        |
| verifiedAt         | Date     | Data de verificação          |        |
| lastPaymentCheck   | Date     | Última verificação           |        |
| removalWarningAt   | Date     | Data do aviso                |        |
| removedAt          | Date     | Data de remoção              |        |
| inviteToken        | String   | Token do convite             | ✓      |
| inviteExpiresAt    | Date     | Expiração do convite         |        |
| createdAt          | Date     | Data de criação              |        |
| updatedAt          | Date     | Data de atualização          |        |

### Collection: `eventlogs`

| Campo          | Tipo     | Descrição               | Índice |
|----------------|----------|-------------------------|--------|
| _id            | ObjectId | ID único                | ✓      |
| eventType      | Enum     | Tipo do evento          | ✓      |
| integrationId  | ObjectId | Ref: integrations       | ✓      |
| memberId       | ObjectId | Ref: members            | ✓      |
| userId         | String   | ID Telegram             |        |
| metadata       | Object   | Dados adicionais        |        |
| errorMessage   | String   | Mensagem de erro        |        |
| createdAt      | Date     | Data do evento          | ✓      |

### Collection: `integrationauthsessions` (Temporárias - expiram em 30min)

| Campo                  | Tipo     | Descrição               | Índice |
|------------------------|----------|-------------------------|--------|
| _id                    | ObjectId | ID único                | ✓      |
| stateToken             | String   | Token único anti-CSRF   | ✓      |
| campaignSlug           | String   | Slug da campanha        |        |
| apiKey                 | String   | Credencial temporária   |        |
| bearerToken            | String   | Token temporário        |        |
| redirectUri            | String   | URL de callback         |        |
| telegramUserId         | String   | ID do usuário Telegram  |        |
| telegramUsername       | String   | Username Telegram       |        |
| telegramGroupId        | String   | ID do grupo selecionado |        |
| telegramGroupTitle     | String   | Nome do grupo           |        |
| status                 | Enum     | Estado do fluxo OAuth   | ✓      |
| expiresAt              | Date     | Expiração (30min)       | ✓      |
| createdAt              | Date     | Data de criação         |        |
| updatedAt              | Date     | Data de atualização     |        |

**Status possíveis**: `pending` | `telegram_auth_complete` | `group_selected` | `completed` | `expired` | `cancelled`

### Collection: `campaigns`

| Campo          | Tipo     | Descrição               | Índice |
|----------------|----------|-------------------------|--------|
| _id            | ObjectId | ID único                | ✓      |
| makerId        | ObjectId | Ref: users              | ✓      |
| title          | String   | Título da campanha      |        |
| slug           | String   | Slug único              | ✓      |
| description    | String   | Descrição               |        |
| category       | String   | Categoria               | ✓      |
| goal           | Number   | Meta financeira         |        |
| raised         | Number   | Valor arrecadado        |        |
| currency       | String   | Moeda (BRL, USD, etc)   |        |
| imageUrl       | String   | Imagem de capa          |        |
| videoUrl       | String   | Vídeo (opcional)        |        |
| rewardLevels   | Array    | Níveis de recompensa    |        |
| supporters     | Number   | Número de apoiadores    |        |
| status         | Enum     | Status da campanha      | ✓      |
| createdAt      | Date     | Data de criação         |        |
| updatedAt      | Date     | Data de atualização     |        |

### Collection: `supports`

| Campo          | Tipo     | Descrição               | Índice |
|----------------|----------|-------------------------|--------|
| _id            | ObjectId | ID único                | ✓      |
| userId         | ObjectId | Ref: users              | ✓      |
| campaignId     | ObjectId | Ref: campaigns          | ✓      |
| rewardLevelId  | String   | ID do tier escolhido    |        |
| amount         | Number   | Valor do apoio          |        |
| status         | Enum     | Status do apoio         | ✓      |
| recurring      | Boolean  | Assinatura recorrente   |        |
| nextPaymentDate| Date     | Próximo pagamento       |        |
| lastPaymentDate| Date     | Último pagamento        |        |
| createdAt      | Date     | Data de criação         |        |
| updatedAt      | Date     | Data de atualização     |        |

### Collection: `users`

| Campo          | Tipo     | Descrição               | Índice |
|----------------|----------|-------------------------|--------|
| _id            | ObjectId | ID único                | ✓      |
| email          | String   | Email do usuário        | ✓      |
| password       | String   | Hash bcrypt             |        |
| name           | String   | Nome completo           |        |
| roles          | Array    | Roles (user, admin)     |        |
| createdAt      | Date     | Data de criação         |        |
| updatedAt      | Date     | Data de atualização     |        |

---

## 🔐 Segurança

### Implementado
- ✅ HTTPS (recomendado em produção)
- ✅ Helmet.js (headers de segurança)
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ JWT para autenticação
- ✅ Logs de auditoria (EventLog)
- ✅ Error handling sem expor dados sensíveis

### A Implementar
- [ ] Webhook signature validation
- [ ] Input sanitization (Joi/Zod)
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Blacklist de tokens JWT
- [ ] 2FA (opcional)

---

## 📊 Performance e Escalabilidade

### Otimizações Implementadas
- ✅ Índices no MongoDB
- ✅ Redis para cache
- ✅ Conexão persistente com DB
- ✅ Logs assíncronos

### Otimizações Planejadas
- [ ] Cache de queries frequentes
- [ ] Paginação de resultados
- [ ] Compressão de respostas (gzip)
- [ ] CDN para assets estáticos
- [ ] Load balancing
- [ ] Horizontal scaling (múltiplas instâncias)

---

## 🚀 Deploy

### Desenvolvimento
- Local (npm run dev)
- Docker Compose

### Produção (Sugestões)
- **Backend**: Railway, Render, DigitalOcean
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **Monitoring**: Sentry, LogRocket
- **CI/CD**: GitHub Actions, GitLab CI
- **Containerization**: Kubernetes
- **Load Balancer**: Nginx, Traefik
- **CDN**: Cloudflare, AWS CloudFront
- **Documentação**: Notion, Confluence

---

## 🔗 Guia de Integração para APOIA.se

Esta seção descreve como integrar este serviço ao backend real do APOIA.se.

### Para a Equipe do APOIA.se

#### 1. Adicionar Endpoints ao Backend

Adicione as rotas de integração ao backend do APOIA.se:

```typescript
// backend/routes/apoiaseIntegrationRoutes.ts
import apoiaseIntegrationRoutes from './routes/apoiaseIntegrationRoutes';

app.use('/api/campaigns', apoiaseIntegrationRoutes);
```

**Endpoints disponíveis:**
- `POST /api/campaigns/:slug/integrations/telegram` - Inicia integração
- `GET /api/campaigns/:slug/integrations/telegram/callback` - Recebe callback
- `GET /api/campaigns/:slug/integrations/telegram` - Lista integrações
- `DELETE /api/campaigns/:slug/integrations/telegram/:id` - Remove integração

#### 2. Criar Página de Integrações

Adicione uma página de integrações na interface do maker:

```typescript
// pages/campaigns/[slug]/edit/integrations.tsx

export default function CampaignIntegrationsPage() {
  const { slug } = useParams();
  const [integrations, setIntegrations] = useState([]);

  const handleConnectTelegram = async () => {
    const res = await fetch(
      `/api/campaigns/${slug}/integrations/telegram`,
      { method: 'POST' }
    );

    const { redirectUrl } = await res.json();
    window.location.href = redirectUrl;  // Redireciona para nosso serviço
  };

  return (
    <div>
      <h2>Integrações</h2>

      <div>
        <h3>Telegram</h3>
        <p>Conecte um grupo do Telegram para acesso exclusivo aos apoiadores</p>
        <button onClick={handleConnectTelegram}>
          Conectar Telegram
        </button>
      </div>

      {/* Lista de integrações ativas */}
      {integrations.map(int => (
        <div key={int.id}>
          <p>{int.groupTitle}</p>
          <button onClick={() => removeIntegration(int.id)}>Remover</button>
        </div>
      ))}
    </div>
  );
}
```

#### 3. Configurar Variáveis de Ambiente

No backend do APOIA.se:

```env
TELEGRAM_INTEGRATION_SERVICE_URL=https://telegram-integration.apoia.se
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### 4. Fluxo de Segurança

O sistema usa credenciais temporárias no Redis (1h de validade):

```typescript
// Backend do APOIA.se gera credenciais temporárias
const apiKey = crypto.randomBytes(32).toString('base64url');
const bearerToken = crypto.randomBytes(32).toString('base64url');

await redis.setex(
  `telegram:integration:${apiKey}`,
  3600, // 1 hora
  JSON.stringify({
    campaignSlug,
    campaignId,
    makerId,
    bearerToken,
    createdAt: new Date(),
  })
);
```

Nosso serviço valida essas credenciais antes de criar a integração.

#### 5. Deploy do Serviço de Integração

```bash
# Docker
docker build -t telegram-integration .
docker run -p 3001:3001 telegram-integration

# DNS
telegram-integration.apoia.se → IP do serviço

# Nginx
server {
  listen 443 ssl;
  server_name telegram-integration.apoia.se;

  location / {
    proxy_pass http://localhost:3001;
  }
}
```

### Arquivos Importantes

**Backend:**
- [backend/src/routes/apoiaseIntegrationRoutes.ts](backend/src/routes/apoiaseIntegrationRoutes.ts) - Rotas para APOIA.se
- [backend/src/services/integrationAuthService.ts](backend/src/services/integrationAuthService.ts) - Lógica OAuth
- [backend/src/services/apoiaseApiService.ts](backend/src/services/apoiaseApiService.ts) - Cliente API APOIA.se
- [backend/src/models/IntegrationAuthSession.ts](backend/src/models/IntegrationAuthSession.ts) - Sessões temporárias

**Frontend:**
- [frontend/src/app/integration/authorize/page.tsx](frontend/src/app/integration/authorize/page.tsx) - Página de autorização
- [frontend/src/components/TelegramGroupSelector.tsx](frontend/src/components/TelegramGroupSelector.tsx) - Seletor de grupo

### Segurança

- ✅ State tokens anti-CSRF (256 bits)
- ✅ Credenciais temporárias (expira em 1h)
- ✅ Sessões com timeout (30min)
- ✅ Hash validation do Telegram (HMAC-SHA256)
- ✅ Credenciais protegidas (`select: false` no Mongoose)

### API do APOIA.se

O serviço está preparado para integração com a API real:

```typescript
// Endpoint para verificar apoiadores
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

**Rate Limits:** 5 req/s, 5000 req/mês (recomendado implementar cache Redis)

---

## 📝 Histórico de Atualizações

### Novembro 2024
- ✅ Implementado fluxo OAuth-like completo com APOIA.se
- ✅ Integração com Telegram Login Widget
- ✅ Auto-descoberta de grupos Telegram
- ✅ Sistema completo de campanhas e apoios
- ✅ Dashboard web com Next.js 14
- ✅ Autenticação JWT completa
- ✅ 35+ endpoints REST API
- ✅ 8 modelos de dados (MongoDB)
- ✅ Deploy preparado para Railway/Render

**Última atualização**: Novembro 2025
