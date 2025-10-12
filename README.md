# 🤖 APOIA.se Telegram Bot

Sistema completo de integração entre **APOIA.se** e **Telegram** que automatiza o controle de acesso a grupos/canais exclusivos baseado no status de apoio dos usuários.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#%EF%B8%8F-stack-tecnológica)
- [Instalação](#-instalação)
- [Configuração](#%EF%B8%8F-configuração)
- [Uso](#-uso)
- [Documentação](#-documentação)
- [Arquitetura](#-arquitetura)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **APOIA.se Telegram Bot** resolve o problema de gerenciar manualmente o acesso de apoiadores a grupos/canais exclusivos do Telegram. Através de webhooks e sincronização automática, o sistema:

- ✅ Adiciona automaticamente novos apoiadores
- ✅ Remove membros com pagamento em atraso
- ✅ Verifica status de apoio em tempo real
- ✅ Envia avisos antes de remover membros
- ✅ Gera links de convite com expiração

### 📊 Status do Projeto

🟢 **MVP COMPLETO** - Todas as 3 fases de desenvolvimento concluídas (75% do roadmap original)

- ✅ **Fase 1**: Fundação (Backend + Frontend + Infraestrutura)
- ✅ **Fase 2**: MVP Backend (API + Webhooks + Jobs)
- ✅ **Fase 3**: Frontend Dashboard (UI + Integração)
- ⏳ **Fase 4**: Deploy (Pendente)

Veja [PROJECT_STATUS.md](PROJECT_STATUS.md) para detalhes completos.

---

## ✨ Funcionalidades

### Para Fazedores

- 🎛️ **Dashboard Completo**: Interface web para gerenciar integrações
- 🔗 **Vincular Campanhas**: Conecte campanhas APOIA.se a grupos Telegram
- 📊 **Métricas em Tempo Real**: Visualize membros ativos e status
- 🔑 **API Keys**: Sistema de autenticação seguro
- ⚙️ **Configuração Flexível**: Defina níveis de recompensa e regras

### Para Apoiadores

- ⚡ **Acesso Instantâneo**: Link de convite gerado automaticamente
- 📧 **Verificação Simples**: Confirme identidade via email
- 🔔 **Avisos Automáticos**: Notificações antes de remoção
- 🔄 **Sincronização**: Status atualizado diariamente

### Automação

- 🤖 **Bot Telegram Inteligente**: Verificação automática de novos membros
- 📅 **Jobs Recorrentes**: Sincronização diária às 02:00
- 🔍 **Verificação de Status**: Consulta APOIA.se API em tempo real
- 🚫 **Remoção Automática**: Remove membros inativos após 7 dias
- ⚠️ **Avisos Preventivos**: Notifica 48h antes da remoção

---

## 🛠️ Stack Tecnológica

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Linguagem**: TypeScript 5.3
- **Database**: MongoDB 7+ (Mongoose 8)
- **Cache/Queue**: Redis 7+ (IORedis 5, Bull 4)
- **Bot**: Telegraf 4.15
- **Auth**: JWT (jsonwebtoken 9)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Logs**: Winston 3

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Linguagem**: TypeScript 5.3
- **Styling**: TailwindCSS 3.4
- **HTTP Client**: Axios 1.6
- **State**: Context API + Custom Hooks

### DevOps

- **Containerização**: Docker + Docker Compose
- **Node Version**: 18-alpine
- **Gerenciador**: npm workspaces

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- Docker e Docker Compose ([Download](https://www.docker.com/))
- Conta Telegram e Bot Token ([Tutorial](https://core.telegram.org/bots#3-how-do-i-create-a-bot))
- Conta APOIA.se com acesso à API

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/gustavolendimuth/apoiase-telegram-bot.git
cd apoiase-telegram-bot

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edite os arquivos .env com suas credenciais
nano backend/.env
nano frontend/.env.local

# 4. Inicie a aplicação em modo desenvolvimento (com hot reload)
npm run docker:dev

# Alternativa: desenvolvimento sem Docker
docker-compose up -d mongodb redis  # Apenas infra
npm run dev                          # Backend + Frontend local
```

Acesse:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

Veja [GETTING_STARTED.md](GETTING_STARTED.md) para guia detalhado.

---

## ⚙️ Configuração

### Backend (.env)

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

# JWT
JWT_SECRET=seu-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d

# Telegram
TELEGRAM_BOT_TOKEN=seu-bot-token-aqui
TELEGRAM_WEBHOOK_URL=https://seu-dominio.com/webhook/telegram

# APOIA.se
APOIASE_API_KEY=sua-api-key-aqui
APOIASE_WEBHOOK_SECRET=seu-webhook-secret-aqui
APOIASE_API_URL=https://apoia.se/api
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🚀 Uso

### 1. Registrar e Fazer Login

**Registro:**
Acesse http://localhost:3000/register e crie sua conta

```bash
# Via API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maker@example.com",
    "password": "senha123",
    "name": "Seu Nome"
  }'
```

**Login:**
Acesse http://localhost:3000/login

```bash
# Via API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maker@example.com",
    "password": "senha123"
  }'
```

O sistema retorna um JWT token que deve ser incluído em todas as requisições autenticadas:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Modo Produção**: Use `/api/auth/validate-apoiase` com token da APOIA.se

### 2. Criar uma Campanha

Acesse http://localhost:3000/criar-campanha e preencha o wizard de 3 etapas:
1. **Informações Básicas**: Título, slug, categoria, descrição
2. **Meta e Mídia**: Valor da meta, imagem de capa, vídeo (opcional)
3. **Níveis de Apoio**: Defina os tiers de recompensa e benefícios

### 3. Criar Integração

No dashboard, clique em **"Nova Integração"** e preencha:
- **ID da Campanha APOIA.se**
- **ID do Grupo Telegram** (formato: `-100XXXXXXXXXX`)
- **Níveis de Recompensa** (opcional)

O sistema irá:
1. Validar se o bot tem permissões no grupo
2. Gerar uma API Key única
3. Ativar a integração

### 4. Configurar Webhook na APOIA.se

Configure o webhook na plataforma APOIA.se:

```
URL: https://seu-dominio.com/webhook/apoiase
Secret: [use o valor de APOIASE_WEBHOOK_SECRET]
```

### 5. Novo Apoiador

Quando alguém apoiar sua campanha:
1. Webhook será recebido automaticamente
2. Sistema cria o membro
3. Gera link de convite (válido por 24h)
4. Link é enviado ao apoiador (via email ou sistema APOIA.se)

### 6. Apoiador Entra no Grupo

1. Apoiador clica no link de convite
2. Entra no grupo Telegram
3. Bot envia mensagem solicitando email
4. Apoiador envia email no chat privado com o bot
5. Bot verifica status na APOIA.se
6. Se ativo: libera acesso ✅
7. Se inativo: remove do grupo ❌

---

## 📚 Documentação

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Status detalhado e resumo do projeto
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Guia de início rápido
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Documentação da arquitetura
- **[COMMANDS.md](COMMANDS.md)** - Comandos úteis
- **[DOCKER_MODES.md](DOCKER_MODES.md)** - Modos desenvolvimento vs produção

### Endpoints da API

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/validate-apoiase` - Validar token APOIA.se (produção)
- `GET /api/auth/me` - Dados do usuário autenticado
- `POST /api/auth/logout` - Logout

#### Campanhas
- `POST /api/campaigns` - Criar campanha (requer auth)
- `GET /api/campaigns/all` - Listar campanhas públicas
- `GET /api/campaigns/search` - Buscar campanhas
- `GET /api/campaigns/my/campaigns` - Minhas campanhas (requer auth)
- `GET /api/campaigns/slug/:slug` - Buscar por slug
- `GET /api/campaigns/:id` - Detalhes da campanha
- `PUT /api/campaigns/:id` - Atualizar campanha (requer auth)
- `DELETE /api/campaigns/:id` - Remover campanha (requer auth)

#### Apoios
- `POST /api/supports` - Criar apoio (requer auth)
- `GET /api/supports/my/supports` - Meus apoios (requer auth)
- `GET /api/supports/campaign/:campaignId` - Apoios de uma campanha
- `POST /api/supports/:id/pause` - Pausar apoio (requer auth)
- `POST /api/supports/:id/resume` - Retomar apoio (requer auth)
- `POST /api/supports/:id/cancel` - Cancelar apoio (requer auth)

#### Integrações
- `POST /api/integrations` - Criar integração (requer auth)
- `GET /api/integrations` - Listar integrações (requer auth)
- `GET /api/integrations/telegram-link/:campaignId` - Link do Telegram (requer auth)
- `GET /api/integrations/:id` - Detalhes da integração (requer auth)
- `PUT /api/integrations/:id` - Atualizar integração (requer auth)
- `DELETE /api/integrations/:id` - Remover integração (requer auth)
- `POST /api/integrations/:id/activate` - Ativar integração (requer auth)
- `POST /api/integrations/:id/deactivate` - Desativar integração (requer auth)
- `POST /api/integrations/:id/regenerate-key` - Regenerar API key (requer auth)

#### Webhooks
- `POST /webhook/apoiase` - Webhook da APOIA.se
- `POST /webhook/telegram` - Webhook do Telegram

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
apoiase-telegram-bot/
├── backend/               # API Node.js + Express
│   ├── src/
│   │   ├── config/       # Configurações (DB, Redis, Logger)
│   │   ├── controllers/  # Controladores REST
│   │   ├── middleware/   # Middlewares (auth, error, rate limit)
│   │   ├── models/       # Models Mongoose
│   │   ├── routes/       # Rotas Express
│   │   ├── services/     # Lógica de negócio
│   │   ├── jobs/         # Jobs recorrentes (Bull)
│   │   └── index.ts      # Entry point
│   └── Dockerfile
├── frontend/             # App Next.js
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities (API client)
│   └── Dockerfile
├── shared/              # Tipos compartilhados
│   └── types/
└── docker-compose.yml   # Orquestração
```

### Fluxo de Dados

```
APOIA.se → Webhook → Backend → MongoDB
                              ↓
Telegram Bot ← telegramService ← Jobs (Bull + Redis)
                              ↓
Frontend Dashboard ← API REST ← Auth JWT
```

Veja [ARCHITECTURE.md](ARCHITECTURE.md) para detalhes completos.

---

## 🧪 Desenvolvimento

### Comandos Úteis

```bash
# Desenvolvimento (backend + frontend)
npm run dev

# Apenas backend
npm run dev:backend

# Apenas frontend
npm run dev:frontend

# Build para produção
npm run build

# Iniciar produção
npm start

# Logs do Docker
docker-compose logs -f

# Resetar banco de dados
docker-compose down -v
docker-compose up -d mongodb redis
```

Veja [COMMANDS.md](COMMANDS.md) para lista completa.

---

## 🧪 Testes

> ⚠️ **Em desenvolvimento** - Sistema de testes será implementado em versão futura

Planejado:
- [ ] Testes unitários (Jest)
- [ ] Testes de integração (Supertest)
- [ ] Testes E2E (Playwright)
- [ ] Coverage mínimo de 80%

---

## 🚀 Deploy

> ⚠️ **Fase 4 pendente** - Instruções detalhadas de deploy serão adicionadas

Opções sugeridas:
- **Backend**: Railway, Render, DigitalOcean, AWS
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Redis**: Upstash, Redis Cloud

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Use TypeScript
- Siga o padrão ESLint
- Escreva testes para novas features
- Atualize a documentação

---

## 📝 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.

---

## 📧 Contato

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/apoiase-telegram-bot/issues)
- **Documentação**: Arquivos MD na raiz do projeto

---

## 🙏 Agradecimentos

- [APOIA.se](https://apoia.se) - Plataforma de apoio recorrente
- [Telegram](https://telegram.org) - API e Bot Platform
- [Telegraf](https://telegraf.js.org) - Framework para Telegram Bots
- Comunidade open source

---

## 📊 Estatísticas do Projeto (Atualizadas 2025-10-12)

- **60+ arquivos** TypeScript/TSX criados
- **~8.000+ linhas** de código (excluindo dependências)
- **28 endpoints** de API REST
- **9 componentes** UI React reutilizáveis
- **2 custom hooks** (useAuth, useIntegrations)
- **10+ páginas** (Home, Login, Register, Campaigns, Campaign Detail, My Campaigns, Create Campaign, My Supports, Profile)
- **6 eventos** de webhook processados
- **6 Models** MongoDB (Integration, Member, EventLog, Campaign, Support, User)
- **5 Controllers** (auth, integration, webhook, campaign, support)
- **7 Services** (auth, integration, member, telegram, verification, campaign, support)
- **1 Job** com 2 tarefas recorrentes (sync diário + verificação 6h)
- **100% TypeScript** (type-safe)

### Funcionalidades Implementadas Recentemente
- ✅ Sistema completo de campanhas (CRUD)
- ✅ Gerenciamento de apoios/assinaturas
- ✅ Autenticação com banco de dados real (bcrypt)
- ✅ Registro de novos usuários
- ✅ Landing page moderna com showcase de campanhas
- ✅ Wizard de criação de campanhas (3 etapas)
- ✅ Dashboard "Minhas Campanhas"
- ✅ Dashboard "Meus Apoios"
- ✅ Navbar e Footer globais

---

**Versão**: 1.0.0
**Data**: Janeiro 2025
**Status**: ✅ MVP Completo
