# 🚀 Guia de Início Rápido

> **Status**: ✅ **MVP COMPLETO** - Todas as 3 fases de desenvolvimento concluídas

Este guia irá ajudá-lo a configurar e executar o APOIA.se Telegram Bot localmente em poucos minutos.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **Docker e Docker Compose** ([Download](https://www.docker.com/))
- ✅ **Git** ([Download](https://git-scm.com/))

Você também precisará:

- 🤖 **Telegram Bot Token** - Obtenha com [@BotFather](https://t.me/BotFather)
- 🔑 **APOIA.se API Key** (opcional para desenvolvimento, use mock)

---

## ⚡ Quick Start (5 minutos)

### 1. Clone e Instale

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/apoiase-telegram-bot.git
cd apoiase-telegram-bot

# Instale as dependências
npm install
```

### 2. Configure Ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edite `backend/.env`:

```env
# Servidor
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/apoiase-telegram-bot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (gere uma chave aleatória segura)
JWT_SECRET=minha-chave-super-secreta-123456
JWT_EXPIRES_IN=7d

# Telegram (obtenha com @BotFather)
TELEGRAM_BOT_TOKEN=seu-bot-token-aqui

# APOIA.se (opcional para desenvolvimento - API mock está disponível)
APOIASE_API_KEY=sua-api-key-aqui
APOIASE_WEBHOOK_SECRET=seu-webhook-secret-aqui
APOIASE_API_URL=https://apoia.se/api
```

Edite `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Inicie a Infraestrutura

```bash
# Suba MongoDB e Redis com Docker
docker-compose up -d mongodb redis

# Verifique se os containers estão rodando
docker ps
```

### 4. Inicie a Aplicação

```bash
# Na raiz do projeto
npm run dev
```

✅ **Pronto!** Acesse:

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:3001
- 🏥 **Health Check**: http://localhost:3001/health

---

## 🤖 Configurar Bot do Telegram

### Criar o Bot

1. Abra o Telegram e procure [@BotFather](https://t.me/BotFather)
2. Envie `/newbot`
3. Escolha um nome: `APOIA.se Integration Bot`
4. Escolha um username: `apoiase_integration_bot` (deve terminar com `_bot`)
5. Copie o token fornecido
6. Cole no arquivo `backend/.env` em `TELEGRAM_BOT_TOKEN`

### Configurar Comandos

No @BotFather, envie `/setcommands` e escolha seu bot:

```
start - Iniciar verificação
help - Ajuda
verify - Verificar status de apoio
```

### Dar Permissões ao Bot

Para que o bot funcione em grupos:

1. Adicione o bot como **administrador** no seu grupo de teste
2. Dê as seguintes permissões:
   - ✅ Gerenciar membros (adicionar/remover)
   - ✅ Criar links de convite
   - ✅ Ler mensagens

---

## 👤 Primeiro Acesso

### 1. Criar Conta de Fazedor

Você pode criar uma conta via API ou diretamente pelo frontend.

**Via API:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fazedor@example.com",
    "password": "senha123",
    "name": "Meu Nome"
  }'
```

**Via Frontend:**

1. Acesse http://localhost:3000
2. Clique em "Painel do Fazedor"
3. Clique em "Criar Conta"
4. Preencha o formulário

### 2. Fazer Login

1. Acesse http://localhost:3000/login
2. Use as credenciais criadas
3. Você será redirecionado para o Dashboard

### 3. Criar Primeira Integração

No Dashboard:

1. Clique em **"Nova Integração"**
2. Preencha:
   - **Nome**: `Minha Primeira Integração`
   - **Campaign ID**: `minha-campanha` (qualquer ID para teste)
   - **Telegram Group ID**: `-100XXXXXXXXXX` (ID do seu grupo de teste)
   - **Níveis de Recompensa**: `basico,premium` (opcional)
3. Clique em **"Criar"**

**Como obter o ID do grupo Telegram?**

1. Adicione [@RawDataBot](https://t.me/rawdatabot) ao seu grupo
2. O bot enviará uma mensagem com o `chat.id`
3. Use esse ID (formato: `-100XXXXXXXXXX`)
4. Remova o @RawDataBot do grupo

### 4. Testar o Sistema

#### Testar Verificação Manual

1. Entre no grupo Telegram onde adicionou o bot
2. O bot enviará uma mensagem de boas-vindas
3. Envie seu email no chat privado com o bot
4. O bot verificará na API (mock) e liberará ou negará acesso

#### Testar Webhook (Novo Apoiador)

```bash
# Simular webhook da APOIA.se para novo apoiador
curl -X POST http://localhost:3001/webhook/apoiase \
  -H "Content-Type: application/json" \
  -d '{
    "event": "supporter.created",
    "data": {
      "id": "sup_123",
      "email": "apoiador@example.com",
      "campaign_id": "minha-campanha",
      "status": "active",
      "reward_level": "basico"
    }
  }'
```

O sistema irá:
1. Criar o membro no banco
2. Gerar link de convite (válido 24h)
3. Retornar o link na resposta

#### Testar Sincronização Manual

No Dashboard, clique em **"Sincronizar Agora"** na integração criada.

---

## 📂 Estrutura do Projeto

```
apoiase-telegram-bot/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── config/            # Configurações (DB, Redis, Logger)
│   │   ├── controllers/       # Controladores REST
│   │   │   ├── authController.ts
│   │   │   ├── integrationController.ts
│   │   │   └── webhookController.ts
│   │   ├── middleware/        # Middlewares
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/            # Models Mongoose
│   │   │   ├── Integration.ts
│   │   │   ├── Member.ts
│   │   │   ├── EventLog.ts
│   │   │   └── User.ts
│   │   ├── routes/            # Rotas Express
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── integrationService.ts
│   │   │   ├── memberService.ts
│   │   │   ├── telegramService.ts
│   │   │   └── verificationService.ts
│   │   ├── jobs/              # Jobs recorrentes
│   │   │   └── syncMembers.ts
│   │   └── index.ts           # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/                   # App Next.js
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   │   ├── page.tsx       # Home
│   │   │   ├── login/         # Login
│   │   │   └── dashboard/     # Dashboard
│   │   ├── components/        # Componentes React
│   │   │   └── ui/            # Componentes UI
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useIntegrations.ts
│   │   └── lib/               # Utilities
│   │       └── api.ts         # Cliente API
│   ├── .env.example
│   └── package.json
├── shared/                     # Tipos compartilhados
│   └── types/
├── docker-compose.yml          # Orquestração
└── package.json                # Root workspace
```

---

## 🧪 Testes

### Testar API

```bash
# Health check
curl http://localhost:3001/health

# Criar conta
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'

# Listar integrações (precisa do token do login)
curl http://localhost:3001/api/integrations \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Testar Bot

1. Procure seu bot no Telegram pelo username
2. Envie `/start`
3. Envie `/help`
4. Envie `/verify`
5. Envie seu email

### Testar Frontend

1. Abra http://localhost:3000
2. Navegue pelas páginas:
   - Home → Login → Dashboard
3. Crie uma integração
4. Visualize membros
5. Sincronize manualmente

---

## 🐛 Troubleshooting

### ❌ Erro: "Port 6379 already in use"

**Problema**: Outro container Redis está usando a porta 6379.

**Solução**:
```bash
# Parar outros containers Redis
docker ps | grep redis
docker stop <container_id>

# Ou mudar a porta no docker-compose.yml
```

### ❌ MongoDB não conecta

**Problema**: MongoDB não está rodando.

**Solução**:
```bash
# Verificar containers
docker ps

# Reiniciar
docker-compose restart mongodb

# Ver logs
docker-compose logs -f mongodb
```

### ❌ Bot não responde no Telegram

**Problema**: Token incorreto ou bot não iniciado.

**Solução**:
1. Verifique o token em `backend/.env`
2. Teste o token:
   ```bash
   curl https://api.telegram.org/bot<SEU_TOKEN>/getMe
   ```
3. Verifique os logs:
   ```bash
   tail -f backend/logs/combined.log
   ```

### ❌ Frontend retorna 404 na API

**Problema**: Backend não está rodando ou URL incorreta.

**Solução**:
1. Verifique se backend está rodando: `curl http://localhost:3001/health`
2. Verifique `NEXT_PUBLIC_API_URL` em `frontend/.env.local`
3. Limpe o cache: `rm -rf frontend/.next && npm run dev:frontend`

### ❌ "Cannot find module '@config/...'"

**Problema**: Path aliases não configurados corretamente.

**Solução**:
```bash
# Limpar e reinstalar
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

---

## 📊 Funcionalidades Implementadas

### ✅ Fase 1 - Fundação
- Backend Express.js + TypeScript
- Frontend Next.js 14 + React
- MongoDB + Mongoose
- Redis + Bull
- Bot Telegram básico
- Autenticação JWT
- Docker Compose

### ✅ Fase 2 - MVP Backend
- CRUD de Integrações (8 endpoints)
- Gestão de Membros
- Verificação de Apoiadores (mock + produção)
- Webhooks bidirecionais (6 eventos)
- Jobs recorrentes (sincronização diária, remoções automáticas)
- Bot inteligente com verificação por email

### ✅ Fase 3 - Frontend Dashboard
- 7 Componentes UI (Button, Input, Card, Badge, Modal, Toast, Loading)
- 2 Custom Hooks (useAuth, useIntegrations)
- 3 Páginas (Home, Login, Dashboard)
- Sistema de autenticação completo
- Interface de gerenciamento de integrações
- Notificações em tempo real com ToastProvider

### ⏳ Fase 4 - Deploy (Pendente)
- CI/CD
- Deploy em produção
- Monitoramento

---

## 🎯 Próximos Passos

Agora que o MVP está completo, você pode:

1. **Integrar com API real da APOIA.se**
   - Substitua o mock em `verificationService.ts`
   - Configure webhook real na plataforma APOIA.se

2. **Testar com usuários reais**
   - Convide apoiadores para testar o fluxo
   - Colete feedback

3. **Adicionar funcionalidades**
   - Sistema de notificações por email
   - Dashboard com gráficos e métricas
   - Área completa do apoiador
   - Multi-idioma

4. **Preparar para deploy**
   - Configurar CI/CD
   - Escolher provedor (Railway, Render, etc.)
   - Configurar domínio

5. **Implementar testes**
   - Testes unitários
   - Testes de integração
   - Testes E2E

---

## 📚 Documentação Adicional

- **[README.md](README.md)** - Visão geral do projeto
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Status detalhado e resumo executivo
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura técnica
- **[COMMANDS.md](COMMANDS.md)** - Comandos úteis

### Recursos Externos

- [Telegraf Framework](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Bull Queue](https://optimalbits.github.io/bull/)

---

## 🤝 Contribuindo

Quer contribuir? Ótimo!

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Faça suas alterações
4. Teste localmente
5. Commit: `git commit -m 'Adiciona MinhaFeature'`
6. Push: `git push origin feature/MinhaFeature`
7. Abra um Pull Request

---

## ✉️ Suporte

Precisa de ajuda?

- 📖 Consulte a [documentação](README.md)
- 🐛 Abra uma [issue](https://github.com/seu-usuario/apoiase-telegram-bot/issues)
- 💬 Entre em contato com a equipe

---

**Status**: ✅ **MVP COMPLETO - Pronto para Testes e Deploy**

**Versão**: 1.0.0
**Data**: Janeiro 2025
