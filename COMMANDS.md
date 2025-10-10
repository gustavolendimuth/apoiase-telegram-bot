# 🛠️ Comandos Úteis

## 📦 Instalação e Setup

```bash
# Instalar todas as dependências (root + workspaces)
npm install

# Instalar dependências apenas do backend
npm install --workspace=backend

# Instalar dependências apenas do frontend
npm install --workspace=frontend

# Adicionar nova dependência ao backend
npm install express --workspace=backend

# Adicionar nova dependência de desenvolvimento
npm install -D @types/express --workspace=backend
```

## 🚀 Execução

```bash
# Desenvolvimento - Todos os serviços
npm run dev

# Desenvolvimento - Apenas backend
npm run dev:backend

# Desenvolvimento - Apenas frontend
npm run dev:frontend

# Produção - Build de tudo
npm run build

# Produção - Build apenas backend
npm run build:backend

# Produção - Build apenas frontend
npm run build:frontend
```

## 🐳 Docker

```bash
# Iniciar tudo (MongoDB, Redis, Backend, Frontend)
docker-compose up -d

# Iniciar apenas infraestrutura (MongoDB + Redis)
docker-compose up -d mongodb redis

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco!)
docker-compose down -v

# Rebuild de um serviço
docker-compose build backend

# Restart de um serviço
docker-compose restart backend

# Ver status dos containers
docker-compose ps
```

## 💾 MongoDB

```bash
# Conectar ao MongoDB via Docker
docker exec -it apoiase-mongodb mongosh

# Conectar ao MongoDB local
mongosh mongodb://localhost:27017/apoiase-telegram-bot

# Comandos úteis no mongosh
show dbs                              # Listar bancos
use apoiase-telegram-bot             # Usar banco
show collections                      # Listar collections
db.integrations.find()               # Listar integrações
db.members.find()                    # Listar membros
db.eventlogs.find().sort({createdAt: -1}).limit(10)  # Últimos 10 eventos
db.integrations.deleteMany({})       # Limpar integrations (CUIDADO!)

# Backup do banco
docker exec apoiase-mongodb mongodump --out /backup

# Restore do banco
docker exec apoiase-mongodb mongorestore /backup
```

## 🔴 Redis

```bash
# Conectar ao Redis via Docker
docker exec -it apoiase-redis redis-cli

# Conectar ao Redis local
redis-cli

# Comandos úteis no redis-cli
KEYS *                  # Listar todas as chaves
GET chave               # Obter valor de uma chave
DEL chave               # Deletar uma chave
FLUSHALL                # Limpar tudo (CUIDADO!)
INFO                    # Informações do Redis
```

## 🤖 Telegram Bot

```bash
# Testar se o token do bot é válido
curl https://api.telegram.org/bot<SEU_TOKEN>/getMe

# Ver atualizações recentes do bot
curl https://api.telegram.org/bot<SEU_TOKEN>/getUpdates

# Configurar webhook (produção)
curl -X POST https://api.telegram.org/bot<SEU_TOKEN>/setWebhook \
  -d "url=https://seu-dominio.com/webhook/telegram"

# Remover webhook (desenvolvimento - usar polling)
curl -X POST https://api.telegram.org/bot<SEU_TOKEN>/deleteWebhook

# Ver informações do webhook
curl https://api.telegram.org/bot<SEU_TOKEN>/getWebhookInfo
```

## 🧪 Testes de API

```bash
# Health check
curl http://localhost:3001/health

# Login (mock)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@test.com","password":"123456"}'

# Obter informações do usuário (substituir TOKEN)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# Validar token APOIA.se
curl -X POST http://localhost:3001/api/auth/validate-apoiase \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","apoiaseToken":"TOKEN_APOIA_SE"}'
```

## 🔍 Logs e Debug

```bash
# Ver logs do backend
tail -f backend/logs/combined.log

# Ver apenas erros
tail -f backend/logs/error.log

# Ver logs do Docker
docker-compose logs -f backend

# Ver logs em tempo real com filtro
docker-compose logs -f backend | grep ERROR
```

## 🧹 Limpeza

```bash
# Limpar builds do Next.js
rm -rf frontend/.next

# Limpar builds do backend
rm -rf backend/dist

# Limpar node_modules de tudo
rm -rf node_modules backend/node_modules frontend/node_modules shared/node_modules

# Limpar logs
rm -rf backend/logs/*.log

# Limpar tudo e reinstalar (FRESH START)
rm -rf node_modules backend/node_modules frontend/node_modules shared/node_modules
rm -rf backend/dist frontend/.next
npm install
```

## 🗂️ Git

```bash
# Ver status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: adiciona funcionalidade X"

# Push
git push origin main

# Ver branches
git branch

# Criar nova branch
git checkout -b feature/nome-da-feature

# Voltar para main
git checkout main

# Merge de branch
git merge feature/nome-da-feature

# Ver histórico
git log --oneline --graph
```

## 📊 Monitoramento

```bash
# Ver uso de CPU/Memória dos containers
docker stats

# Ver processos Node.js rodando
ps aux | grep node

# Ver portas em uso
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Matar processo em uma porta
kill -9 $(lsof -t -i:3001)
```

## 🔧 TypeScript

```bash
# Verificar erros de tipo (backend)
cd backend && npx tsc --noEmit

# Verificar erros de tipo (frontend)
cd frontend && npx tsc --noEmit

# Watch mode para compilação
cd backend && npx tsc --watch
```

## 🎨 Linting e Formatação

```bash
# Lint do backend
npm run lint --workspace=backend

# Lint do frontend
npm run lint --workspace=frontend

# Lint de tudo
npm run lint --workspaces
```

## 📝 Banco de Dados - Scripts Úteis

```bash
# Inicializar/criar índices do banco
cd backend
npm run dev
# Ou diretamente:
npx tsx src/scripts/initDb.ts

# Seed do banco (quando implementado)
npx tsx src/scripts/seed.ts

# Drop do banco (CUIDADO!)
mongosh mongodb://localhost:27017/apoiase-telegram-bot --eval "db.dropDatabase()"
```

## 🔐 Geração de Secrets

```bash
# Gerar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou com OpenSSL
openssl rand -hex 64

# Gerar API Key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🌐 Produção

```bash
# Build otimizado de tudo
npm run build

# Iniciar em produção (backend)
cd backend && npm start

# Iniciar em produção (frontend)
cd frontend && npm start

# Variáveis de ambiente em produção
export NODE_ENV=production
export PORT=3001
export MONGODB_URI=mongodb://...
# etc...
```

## 📱 Utilitários do Projeto

```bash
# Ver versão do Node.js
node --version

# Ver versão do npm
npm --version

# Ver todas as dependências instaladas
npm list --depth=0

# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências (com cuidado!)
npm update

# Audit de segurança
npm audit

# Corrigir vulnerabilidades automáticas
npm audit fix
```

## 🚨 Troubleshooting Rápido

```bash
# Backend não inicia?
# 1. Verificar se MongoDB está rodando
docker ps | grep mongodb

# 2. Verificar logs
tail -f backend/logs/error.log

# 3. Verificar porta
lsof -i :3001

# Frontend não carrega?
# 1. Limpar cache
rm -rf frontend/.next

# 2. Reinstalar dependências
cd frontend && npm install

# Bot não responde?
# 1. Testar token
curl https://api.telegram.org/bot<TOKEN>/getMe

# 2. Ver logs do backend
docker-compose logs -f backend | grep telegram
```

---

**Dica**: Salve este arquivo e use-o como referência rápida durante o desenvolvimento!
