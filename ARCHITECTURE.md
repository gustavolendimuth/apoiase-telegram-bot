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

### Autenticação
```
POST   /api/auth/login                 # Login (mock)
POST   /api/auth/validate-apoiase      # Validar token APOIA.se
GET    /api/auth/me                    # Info do usuário (protegida)
POST   /api/auth/logout                # Logout (protegida)
```

### Integrações [TODO]
```
POST   /api/integrations               # Criar integração (maker)
GET    /api/integrations               # Listar integrações (maker)
GET    /api/integrations/:id           # Buscar integração (maker)
PUT    /api/integrations/:id           # Atualizar integração (maker)
DELETE /api/integrations/:id           # Deletar integração (maker)
POST   /api/integrations/:id/activate  # Ativar integração
POST   /api/integrations/:id/deactivate # Desativar integração
```

### Membros [TODO]
```
GET    /api/members                    # Listar membros (maker)
GET    /api/members/:id                # Buscar membro
POST   /api/members/:id/verify         # Verificar membro
DELETE /api/members/:id                # Remover membro
GET    /api/members/stats              # Estatísticas
```

### Webhooks [TODO]
```
POST   /webhook/apoiase                # Webhook APOIA.se
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
| campaignId         | String   | ID da campanha APOIA.se      | ✓      |
| telegramGroupId    | String   | ID do grupo Telegram         | ✓      |
| telegramGroupType  | Enum     | Tipo do grupo                |        |
| telegramGroupTitle | String   | Nome do grupo                |        |
| apiKey             | String   | Chave API única              | ✓      |
| rewardLevels       | Array    | Níveis de recompensa         |        |
| isActive           | Boolean  | Status ativo/inativo         | ✓      |
| createdBy          | String   | ID do fazedor                |        |
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

---

**Última atualização**: Janeiro 2025
