# Railway Deploy Guide

Guia completo para fazer deploy do APOIA.se Telegram Bot no Railway.

## 🚀 Quick Start (5 minutos)

### 1. Conectar Repositório

1. Acesse [railway.app](https://railway.app)
2. Clique em **New Project**
3. Selecione **Deploy from GitHub repo**
4. Escolha este repositório

### 2. Configurar Serviços

O Railway detectará automaticamente o `docker-compose.yml`. Configure 3 serviços:

#### Backend Service

**Build Configuration:**
- Root Directory: `backend`
- Dockerfile Path: `Dockerfile`

**Environment Variables:**
```env
NODE_ENV=production
PORT=3001

# MongoDB (Railway Plugin)
MONGODB_URI=${{MongoDB.MONGO_URL}}

# Redis (Railway Plugin)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}

# JWT
JWT_SECRET=<gerar-string-aleatoria-segura-aqui>
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=<seu-bot-token-do-botfather>
TELEGRAM_BOT_USERNAME=<seu_bot_username>
TELEGRAM_WEBHOOK_URL=https://seu-backend.railway.app/webhook/telegram

# APOIA.se (opcional)
APOIASE_API_KEY=
APOIASE_WEBHOOK_SECRET=<gerar-string-aleatoria>
APOIASE_API_URL=https://api.apoia.se

# Frontend URL
FRONTEND_URL=https://seu-frontend.railway.app

# Auto Seed (deixe vazio para habilitar seed automático)
# AUTO_SEED=false
```

#### Frontend Service

**Build Configuration:**
- Root Directory: `frontend`
- Dockerfile Path: `Dockerfile`

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<seu_bot_username>
```

#### MongoDB (Plugin)

1. Clique em **New** → **Database** → **Add MongoDB**
2. O Railway criará automaticamente
3. Use a variável `${{MongoDB.MONGO_URL}}` no backend

#### Redis (Plugin)

1. Clique em **New** → **Database** → **Add Redis**
2. O Railway criará automaticamente
3. Use as variáveis `${{Redis.REDIS_HOST}}` e `${{Redis.REDIS_PORT}}` no backend

## 🌱 Seed Automático

O banco de dados será automaticamente populado no primeiro deploy!

### O que acontece:

1. Railway executa `npm install` no backend
2. O hook `postinstall` executa `npm run seed:auto`
3. O script [backend/scripts/autoSeed.ts](backend/scripts/autoSeed.ts):
   - Verifica se o banco está vazio
   - Se vazio: cria 5 usuários e 6 campanhas
   - Se não vazio: pula o seed

### Verificar se funcionou:

Nos logs do backend (aba **Deployments** → último deploy):

```
🌱 Iniciando seed automático...
✅ Seed automático concluído com sucesso!
📊 Resumo:
   5 usuários criados
   6 campanhas criadas
```

### Credenciais de teste:

```
maker@example.com / test123
joao.silva@example.com / senha123
maria.santos@example.com / senha123
pedro.oliveira@example.com / senha123
admin@example.com / admin123 (admin)
```

### Desabilitar seed:

Se não quiser o seed automático:

```env
AUTO_SEED=false
```

## 📝 Configurar Telegram Bot

### 1. Criar Bot

```bash
# Falar com @BotFather no Telegram
/newbot
# Seguir instruções e copiar o token
```

### 2. Configurar Webhook

Após o deploy do backend:

```bash
# Substituir <TOKEN> e <URL>
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://seu-backend.railway.app/webhook/telegram"
```

**Resposta esperada:**
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### 3. Verificar Webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## 🔧 Variáveis de Ambiente Obrigatórias

### Backend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONGODB_URI` | URL do MongoDB | `${{MongoDB.MONGO_URL}}` |
| `REDIS_HOST` | Host do Redis | `${{Redis.REDIS_HOST}}` |
| `REDIS_PORT` | Porta do Redis | `${{Redis.REDIS_PORT}}` |
| `JWT_SECRET` | Secret para JWT | `gerar-aleatorio-64-chars` |
| `TELEGRAM_BOT_TOKEN` | Token do bot | `123456:ABC-DEF...` |
| `TELEGRAM_BOT_USERNAME` | Username do bot | `seu_bot` |
| `TELEGRAM_WEBHOOK_URL` | URL do webhook | `https://backend.railway.app/webhook/telegram` |
| `FRONTEND_URL` | URL do frontend | `https://frontend.railway.app` |

### Frontend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL do backend | `https://backend.railway.app` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username do bot | `seu_bot` |

## 🧪 Testar Deploy

### 1. Health Check do Backend

```bash
curl https://seu-backend.railway.app/health
```

**Resposta esperada:**
```json
{"status":"ok","mongodb":"connected","redis":"connected"}
```

### 2. Listar Campanhas

```bash
curl https://seu-backend.railway.app/api/campaigns/all
```

Deve retornar as 6 campanhas criadas pelo seed.

### 3. Login

```bash
curl -X POST https://seu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"test123"}'
```

Deve retornar um token JWT.

### 4. Acessar Frontend

Abra `https://seu-frontend.railway.app` e:
- ✅ Página inicial carrega
- ✅ Mostra 6 campanhas
- ✅ Login funciona com `maker@example.com / test123`

## 🐛 Troubleshooting

### Seed não rodou

**Sintoma:** Banco vazio após deploy

**Solução:**
```bash
# Nos logs do Railway, procurar por:
"🌱 Iniciando seed automático..."

# Se não aparecer, verificar:
1. Variable AUTO_SEED não está como 'false'
2. package.json tem: "postinstall": "npm run seed:auto"
3. Rodar manualmente: railway run npm run seed:auto
```

### MongoDB connection failed

**Sintoma:** Erro ao conectar no MongoDB

**Solução:**
1. Verificar se plugin MongoDB está instalado
2. Verificar variável `MONGODB_URI` = `${{MongoDB.MONGO_URL}}`
3. Verificar se serviços estão na mesma região

### Telegram webhook não funciona

**Sintoma:** Bot não responde

**Solução:**
```bash
# 1. Verificar webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# 2. Reconfigurar webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://seu-backend.railway.app/webhook/telegram"

# 3. Verificar logs do backend
# Deve aparecer: POST /webhook/telegram
```

### Frontend não conecta no backend

**Sintoma:** Erros de CORS ou 404 nas chamadas API

**Solução:**
1. Verificar `NEXT_PUBLIC_API_URL` no frontend
2. Verificar `FRONTEND_URL` no backend
3. Verificar se backend está rodando: `curl https://backend.railway.app/health`

## 📊 Monitoramento

### Métricas no Railway

- **CPU**: ~100-200m normal
- **Memory**: ~512MB backend, ~256MB frontend
- **Requests**: Verificar aba Metrics

### Logs Importantes

**Backend startup:**
```
✅ Servidor rodando na porta 3001
✅ MongoDB conectado
✅ Redis conectado
🤖 Bot conectado: @seu_bot
```

**Seed executado:**
```
✅ Seed automático concluído com sucesso!
📊 Resumo:
   5 usuários criados
   6 campanhas criadas
```

## 🔄 Redeploy e Updates

### Fazer um novo deploy

```bash
# Commit e push
git add .
git commit -m "feat: nova feature"
git push

# Railway faz deploy automático
```

### Seed em redeploy

- ✅ O seed **não** roda em redeployments
- ✅ Apenas roda se o banco estiver vazio
- ✅ Seus dados estão seguros

### Resetar banco (cuidado!)

Se quiser limpar o banco e repovoar:

```bash
# Via Railway CLI
railway run mongosh $MONGODB_URI --eval "db.dropDatabase()"
railway run npm run seed:auto
```

## 🚨 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET gerado aleatoriamente (64+ chars)
- [ ] APOIASE_WEBHOOK_SECRET gerado aleatoriamente
- [ ] NODE_ENV=production
- [ ] TELEGRAM_BOT_TOKEN mantido secreto
- [ ] MongoDB/Redis acessíveis apenas dentro do Railway
- [ ] CORS configurado apenas para FRONTEND_URL

### Gerar Secrets

```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Online (use apenas em dev)
# https://www.random.org/strings/
```

## 📚 Referências

- [Railway Docs](https://docs.railway.app)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (alternativa ao plugin)
- [Redis Cloud](https://redis.com/cloud/) (alternativa ao plugin)

## 🆘 Suporte

Se tiver problemas:

1. Verificar logs no Railway (aba Deployments)
2. Verificar variáveis de ambiente
3. Testar health check: `curl https://backend.railway.app/health`
4. Verificar [Issues do projeto](https://github.com/seu-repo/issues)
