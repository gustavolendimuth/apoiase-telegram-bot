# 🚀 Guia de Deploy

Este guia cobre deploy em produção, configuração de banco de dados, e seed automático.

---

## 📋 Índice

- [Deploy no Railway](#-deploy-no-railway-quick-start)
- [Seed Automático](#-seed-automático)
- [Configurar Telegram Bot](#-configurar-telegram-bot)
- [Backup e Restore Manual](#-backup-e-restore-manual)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Deploy no Railway (Quick Start)

### 1. Conectar Repositório

1. Acesse [railway.app](https://railway.app)
2. Clique em **New Project**
3. Selecione **Deploy from GitHub repo**
4. Escolha este repositório

### 2. Configurar Serviços

O Railway detectará automaticamente o `docker-compose.yml`. Configure 4 serviços:

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
JWT_SECRET=<gerar-string-aleatoria-segura-64-chars>
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

---

## 🌱 Seed Automático

O banco de dados será automaticamente populado no primeiro deploy!

### Como Funciona

1. Railway executa `npm install` no backend
2. O hook `postinstall` executa `npm run seed:auto`
3. O script [backend/scripts/autoSeed.ts](backend/scripts/autoSeed.ts):
   - Verifica se o banco está vazio
   - Se vazio: cria 5 usuários e 6 campanhas
   - Se não vazio: pula o seed (seus dados estão seguros)

### Credenciais de Teste

```
maker@example.com / test123
joao.silva@example.com / senha123
maria.santos@example.com / senha123
pedro.oliveira@example.com / senha123
admin@example.com / admin123 (admin)
```

### Verificar se Funcionou

Nos logs do backend (aba **Deployments** → último deploy):

```
🌱 Iniciando seed automático...
✅ Seed automático concluído com sucesso!
📊 Resumo:
   5 usuários criados
   6 campanhas criadas
```

### Desabilitar Seed Automático

Se não quiser o seed automático:

```env
AUTO_SEED=false
```

### Rodar Seed Manualmente

```bash
# Via npm script
npm run seed:auto

# Via Railway CLI
railway run npm run seed:auto
```

---

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

---

## 🔐 Variáveis de Ambiente

### Backend (Obrigatórias)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Porta do servidor | `3001` |
| `MONGODB_URI` | URL do MongoDB | `${{MongoDB.MONGO_URL}}` |
| `REDIS_HOST` | Host do Redis | `${{Redis.REDIS_HOST}}` |
| `REDIS_PORT` | Porta do Redis | `${{Redis.REDIS_PORT}}` |
| `JWT_SECRET` | Secret para JWT (64+ chars) | `gerar-aleatorio-64-chars` |
| `JWT_EXPIRES_IN` | Expiração do JWT | `7d` |
| `TELEGRAM_BOT_TOKEN` | Token do bot | `123456:ABC-DEF...` |
| `TELEGRAM_BOT_USERNAME` | Username do bot | `seu_bot` |
| `TELEGRAM_WEBHOOK_URL` | URL do webhook | `https://backend.railway.app/webhook/telegram` |
| `FRONTEND_URL` | URL do frontend | `https://frontend.railway.app` |
| `APOIASE_WEBHOOK_SECRET` | Secret do webhook | `gerar-aleatorio` |

### Frontend (Obrigatórias)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL do backend | `https://backend.railway.app` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username do bot | `seu_bot` |

### Gerar Secrets

```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

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

---

## 💾 Backup e Restore Manual

Para casos onde você precisa migrar dados específicos entre ambientes.

### Estrutura

```
backend/
├── scripts/
│   ├── exportDatabase.ts    # Script de exportação
│   └── importDatabase.ts    # Script de importação
└── database-exports/         # Diretório de backups (criado automaticamente)
    └── backup-YYYY-MM-DDTHH-mm-ss/
        ├── metadata.json
        ├── users.json
        ├── campaigns.json
        └── ...
```

### Exportar Dados (Backup)

```bash
# No diretório backend/
npm run db:export
# ou
npm run db:backup
```

**O que faz:**
- Conecta no banco configurado em `MONGODB_URI`
- Exporta todas as coleções para JSON
- Cria diretório com timestamp

### Importar Dados (Restore)

```bash
# No diretório backend/
npm run db:import
# ou
npm run db:restore

# Importar backup específico:
npm run db:import backup-2025-11-04T14-30-00
```

**⚠️ ATENÇÃO**: `db:import` DELETA todos os dados existentes antes de importar!

### Workflow: Local → Servidor

```bash
# 1. Exportar dados locais
cd backend
npm run db:export

# 2. Comprimir backup
cd database-exports
tar -czf backup-2025-11-04.tar.gz backup-2025-11-04T14-30-00/

# 3. Transferir para servidor
scp backup-2025-11-04.tar.gz user@servidor:/path/to/backend/database-exports/

# 4. No servidor, descomprimir e importar
ssh user@servidor
cd /path/to/backend/database-exports
tar -xzf backup-2025-11-04.tar.gz
cd ../
npm run db:import backup-2025-11-04T14-30-00
```

### Automatizar Backups em Produção

```bash
# Cron job diário (adicionar ao servidor)
0 3 * * * cd /path/to/backend && npm run db:export
```

### Boas Práticas

1. **Sempre faça backup antes de importar:**
   ```bash
   npm run db:export  # Backup de segurança
   npm run db:import backup-from-local
   ```

2. **Teste em staging primeiro** antes de produção

3. **Verifique os dados após importação:**
   ```bash
   docker exec -it apoiase-mongodb mongosh
   use apoiase-telegram-bot
   db.users.countDocuments()
   db.campaigns.countDocuments()
   ```

4. **Adicione ao .gitignore:**
   ```
   database-exports/
   *.tar.gz
   ```

---

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

---

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

---

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

### Backup connection refused

```bash
# Verifique MONGODB_URI no .env
cat backend/.env | grep MONGODB_URI

# Teste conexão manual
docker exec -it apoiase-mongodb mongosh
```

---

## 🚨 Checklist de Segurança

- [ ] JWT_SECRET gerado aleatoriamente (64+ chars)
- [ ] APOIASE_WEBHOOK_SECRET gerado aleatoriamente
- [ ] NODE_ENV=production
- [ ] TELEGRAM_BOT_TOKEN mantido secreto
- [ ] MongoDB/Redis acessíveis apenas dentro do Railway
- [ ] CORS configurado apenas para FRONTEND_URL
- [ ] Backups não comitados no Git público
- [ ] Cron job de backup diário configurado

---

## 🌐 Alternativas ao Railway

### Backend
- **Render**: Similar ao Railway, free tier disponível
- **DigitalOcean App Platform**: $5/mês
- **AWS Elastic Beanstalk**: Escalável
- **Heroku**: Tradicional, pago

### Frontend
- **Vercel**: Ideal para Next.js, free tier generoso
- **Netlify**: Alternativa ao Vercel
- **Cloudflare Pages**: Rápido e global

### Database
- **MongoDB Atlas**: Free tier 512MB, recomendado
- **DigitalOcean Managed MongoDB**: $15/mês

### Redis
- **Upstash**: Free tier generoso, serverless
- **Redis Cloud**: Free tier 30MB
- **DigitalOcean Managed Redis**: $15/mês

---

## 📚 Referências

- [Railway Docs](https://docs.railway.app)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Redis Cloud](https://redis.com/cloud/)
- [Vercel Docs](https://vercel.com/docs)

---

**Última atualização**: Novembro 2024
