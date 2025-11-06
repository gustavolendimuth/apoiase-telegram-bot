# 🛠️ Guia de Desenvolvimento

Este guia contém todos os comandos, workflows e melhores práticas para desenvolvimento local do APOIA.se Telegram Bot.

---

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

---

## 🚀 Execução

### Desenvolvimento Local

```bash
# Desenvolvimento - Todos os serviços (backend + frontend)
npm run dev

# Desenvolvimento - Apenas backend
npm run dev:backend

# Desenvolvimento - Apenas frontend
npm run dev:frontend
```

### Build para Produção

```bash
# Build de tudo
npm run build

# Build apenas backend
npm run build:backend

# Build apenas frontend
npm run build:frontend

# Iniciar em produção (após build)
cd backend && npm start
cd frontend && npm start
```

---

## 🐳 Docker - Modos Desenvolvimento vs Produção

### 🔧 Modo Desenvolvimento (Recomendado para desenvolvimento local)

**Características:**
- ✅ **Hot Reload**: Alterações no código refletidas automaticamente
- ✅ **Volumes montados**: Código local sincronizado com container
- ✅ **Dev dependencies**: Todas as ferramentas de desenvolvimento
- ✅ **Sem rebuild**: Não precisa reconstruir imagem a cada mudança

**Comandos npm (Recomendado):**

```bash
# MODO DESENVOLVIMENTO (com hot reload)
npm run docker:dev          # Inicia todos os serviços em modo dev
npm run docker:dev:logs     # Ver logs em tempo real

# GERENCIAMENTO
npm run docker:down         # Para todos os containers
npm run docker:clean        # Para e remove volumes (⚠️ CUIDADO: apaga dados!)
```

**Comandos docker-compose diretos:**

```bash
# Modo desenvolvimento (hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ CUIDADO: apaga dados do banco!)
docker-compose down -v

# Rebuild de um serviço (quando mudar package.json)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build backend

# Restart de um serviço
docker-compose restart backend

# Ver status dos containers
docker-compose ps
```

**Acesso:**
- Frontend: http://localhost:3000 (Next.js com hot reload)
- Backend: http://localhost:3001 (Nodemon com hot reload)
- MongoDB: localhost:27017
- Redis: localhost:6379

---

### 🚀 Modo Produção (Para deploy)

**Características:**
- ✅ **Build otimizado**: Código compilado e minificado
- ✅ **Sem dev dependencies**: Imagem menor
- ✅ **Melhor performance**: Código otimizado
- ⚠️ **Requer rebuild**: Precisa reconstruir imagem após mudanças

**Comandos npm:**

```bash
# MODO PRODUÇÃO (build otimizado)
npm run docker:prod         # Inicia todos os serviços em modo prod
```

**Comandos docker-compose:**

```bash
# Modo produção
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Rebuild (necessário após qualquer mudança no código)
docker-compose build
docker-compose up -d
```

---

### 📝 Comparação Desenvolvimento vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| Hot Reload | ✅ Sim | ❌ Não |
| Rebuild necessário | ❌ Não | ✅ Sim |
| Tamanho da imagem | Maior | Menor |
| Performance | Normal | Otimizada |
| Dev tools | Disponíveis | Removidas |
| Use quando | Desenvolvendo | Deploy |

---

### 🔄 Migrando de Produção para Desenvolvimento

Se você estava rodando em modo produção:

```bash
# Parar containers atuais
docker-compose down

# Iniciar em modo desenvolvimento
npm run docker:dev

# Ou manualmente:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

---

### Apenas Infraestrutura (MongoDB + Redis)

```bash
# Iniciar apenas MongoDB e Redis (sem backend/frontend)
docker-compose up -d mongodb redis

# Útil quando quiser rodar backend/frontend localmente fora do Docker
```

💡 **Dica**: Prefira os atalhos npm (`npm run docker:dev`) para facilitar o desenvolvimento!

---

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
db.integrations.deleteMany({})       # Limpar integrations (⚠️ CUIDADO!)

# Backup do banco
docker exec apoiase-mongodb mongodump --out /backup

# Restore do banco
docker exec apoiase-mongodb mongorestore /backup

# Drop do banco (⚠️ CUIDADO!)
mongosh mongodb://localhost:27017/apoiase-telegram-bot --eval "db.dropDatabase()"
```

---

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
FLUSHALL                # Limpar tudo (⚠️ CUIDADO!)
INFO                    # Informações do Redis
```

---

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

---

## 🧪 Testes de API

```bash
# Health check
curl http://localhost:3001/health

# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"senha123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"senha123"}'

# Obter informações do usuário (substituir TOKEN)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# Validar token APOIA.se
curl -X POST http://localhost:3001/api/auth/validate-apoiase \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","apoiaseToken":"TOKEN_APOIA_SE"}'
```

---

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

---

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

---

## 🗂️ Git

```bash
# Ver status
git status

# Adicionar arquivos
git add .

# Commit (use conventional commits)
git commit -m "feat: adiciona funcionalidade X"
git commit -m "fix: corrige bug Y"
git commit -m "docs: atualiza documentação"

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

---

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

---

## 🔧 TypeScript

```bash
# Verificar erros de tipo (backend)
cd backend && npx tsc --noEmit

# Verificar erros de tipo (frontend)
cd frontend && npx tsc --noEmit

# Watch mode para compilação
cd backend && npx tsc --watch
```

---

## 🎨 Linting e Formatação

```bash
# Lint do backend
npm run lint --workspace=backend

# Lint do frontend
npm run lint --workspace=frontend

# Lint de tudo
npm run lint --workspaces
```

---

## 📝 Banco de Dados - Scripts Úteis

```bash
# Seed do banco de dados (criar campanhas de exemplo)
cd backend
npm run seed
# Ou diretamente:
npx tsx src/scripts/seedCampaigns.ts

# Seed automático (usado no deploy - Railway)
npm run seed:auto
# Ou diretamente:
npx tsx src/scripts/autoSeed.ts

# Inicializar/criar índices do banco
npx tsx src/scripts/initDb.ts

# Exportar dados do banco (backup)
npm run db:export
# ou
npm run db:backup

# Importar dados no banco (restore)
npm run db:import [backup-name]
# ou
npm run db:restore [backup-name]
```

---

## 🔐 Geração de Secrets

```bash
# Gerar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou com OpenSSL
openssl rand -hex 64

# Gerar API Key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

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

---

## 🚨 Troubleshooting

### ❌ Backend não inicia

```bash
# 1. Verificar se MongoDB está rodando
docker ps | grep mongodb

# 2. Verificar logs
tail -f backend/logs/error.log

# 3. Verificar porta
lsof -i :3001

# 4. Reiniciar backend
docker-compose restart backend
```

### ❌ Frontend não carrega

```bash
# 1. Limpar cache
rm -rf frontend/.next

# 2. Reinstalar dependências
cd frontend && npm install

# 3. Verificar variável de ambiente
cat frontend/.env.local  # Deve ter NEXT_PUBLIC_API_URL=http://localhost:3001

# 4. Reiniciar frontend
docker-compose restart frontend
```

### ❌ Bot não responde no Telegram

```bash
# 1. Testar token
curl https://api.telegram.org/bot<TOKEN>/getMe

# 2. Ver logs do backend
docker-compose logs -f backend | grep telegram

# 3. Verificar variável de ambiente
cat backend/.env | grep TELEGRAM_BOT_TOKEN
```

### ❌ MongoDB connection fails

```bash
# Verificar containers
docker ps

# Reiniciar MongoDB
docker-compose restart mongodb

# Ver logs
docker-compose logs -f mongodb
```

### ❌ Port conflicts

```bash
# Verificar portas em uso
lsof -i :3000
lsof -i :3001
lsof -i :27017
lsof -i :6379

# Parar containers conflitantes
docker ps
docker stop <container_id>
```

### ❌ Docker volumes permissions (Linux)

```bash
# Ajustar permissões dos volumes
sudo chown -R $USER:$USER ./frontend ./backend
```

### ❌ Limpar tudo e recomeçar

```bash
# Remove containers, volumes, images e rebuilda tudo
docker-compose down -v
npm run docker:clean
npm run docker:dev
```

---

## 🎯 Workflow de Desenvolvimento Recomendado

1. **Iniciar ambiente de desenvolvimento:**
   ```bash
   npm run docker:dev
   ```

2. **Fazer alterações no código** (hot reload automático!)

3. **Testar mudanças:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Bot Telegram: Teste diretamente no Telegram

4. **Ver logs em tempo real:**
   ```bash
   docker-compose logs -f
   ```

5. **Commit e push:**
   ```bash
   git add .
   git commit -m "feat: minha feature"
   git push
   ```

---

## 📚 Recursos Adicionais

- **[README.md](README.md)** - Visão geral do projeto
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura técnica
- **[DEPLOY.md](DEPLOY.md)** - Guia de deploy
- **[Telegraf Docs](https://telegraf.js.org/)** - Framework do bot
- **[Next.js Docs](https://nextjs.org/docs)** - Framework frontend
- **[Express.js Guide](https://expressjs.com/)** - Framework backend

---

💡 **Dica**: Salve este arquivo e use-o como referência rápida durante o desenvolvimento!

**Última atualização**: Novembro 2024
