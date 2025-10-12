# Frontend Upgrade - Simulação Real do APOIA.se

## 🎯 Objetivo

Transformar o frontend em uma simulação mais realista do site APOIA.se, com dados dinâmicos do banco de dados e páginas de campanhas funcionais.

## ✨ Mudanças Implementadas

### Backend

#### 1. **Novos Modelos** (`backend/src/models/`)

- **User.ts**: Modelo de usuário com autenticação
  - Campos: email, password (hash), name, role (maker/supporter)
  - Indexes: email (unique)

- **Campaign.ts**: Modelo de campanha com todos os detalhes
  - Campos: makerId, title, slug, description, goal, raised, currency, category, imageUrl, videoUrl, rewardLevels, supporters, status
  - Categories: art, music, technology, education, social, games, podcasts, videos, other
  - Status: draft, active, paused, completed
  - Indexes: slug (unique), makerId, status, category

#### 2. **Serviços**

- **campaignService.ts**: CRUD completo de campanhas
  - createCampaign, getCampaignById, getCampaignBySlug
  - getCampaignsByMaker, getAllCampaigns (com filtros)
  - updateCampaign, deleteCampaign
  - updateCampaignStats, searchCampaigns

- **authService.ts**: Autenticação atualizada
  - authenticateUser (com bcrypt)
  - registerUser (novo método)
  - Passwords são hash com bcrypt

#### 3. **Controllers**

- **campaignController.ts**: 8 endpoints
  - POST /api/campaigns - Criar campanha
  - GET /api/campaigns/:id - Buscar por ID
  - GET /api/campaigns/slug/:slug - Buscar por slug
  - GET /api/campaigns/my/campaigns - Campanhas do maker
  - GET /api/campaigns/all - Listar com filtros
  - PUT /api/campaigns/:id - Atualizar
  - DELETE /api/campaigns/:id - Deletar
  - GET /api/campaigns/search - Buscar por texto

- **authController.ts**: Endpoint de registro adicionado
  - POST /api/auth/register - Registrar novo usuário

#### 4. **Rotas**

- **campaignRoutes.ts**: Rotas públicas e protegidas
  - Rotas públicas: search, all, slug/:slug, :id
  - Rotas protegidas: create, my/campaigns, update, delete

#### 5. **Script de Seed**

- **seedCampaigns.ts**: Popula banco com dados de exemplo
  - 3 usuários makers (maker@example.com, etc)
  - 6 campanhas de diferentes categorias
  - Todos com senha: senha123
  - Comando: `npm run seed` (no diretório backend)

#### 6. **Modelo de Integração Atualizado**

- **Integration.ts**: Referencias ObjectId
  - campaignId agora é ObjectId referenciando Campaign
  - createdBy agora é ObjectId referenciando User

### Frontend

#### 1. **Novas Páginas**

- **page.tsx** (Home): Atualizada para buscar campanhas reais da API
  - Filtros por categoria funcionais
  - Cards de campanha com dados reais
  - Links para páginas de detalhes

- **campanhas/page.tsx**: Listagem completa de campanhas
  - Filtros: busca por texto e categoria
  - Paginação
  - Cards clicáveis que levam para detalhes

- **campanha/[slug]/page.tsx**: Página de detalhes da campanha
  - Rota dinâmica baseada no slug
  - Informações completas: imagem, descrição, progresso
  - Níveis de recompensa detalhados
  - Botão de apoio (UI ready, pagamento pendente)

- **register/page.tsx**: Página de registro
  - Seleção de tipo de conta (Apoiador/Fazedor)
  - Validação de formulário
  - Integração com API de registro
  - Redirecionamento após registro

#### 2. **Componentes Atualizados**

- **Navbar.tsx**: Navegação dinâmica baseada em autenticação
  - Mostra "Entrar" e "Criar conta" quando não autenticado
  - Mostra avatar e menu dropdown quando autenticado
  - Menu diferenciado por role (maker/supporter)
  - Links para páginas específicas do usuário

- **Footer.tsx**: Mantido (já existente)

#### 3. **Hooks**

- **useAuth.tsx**: Hook já existente, funcional

## 📊 Dados de Exemplo (Seed)

### Usuários

```
Email: joao.silva@example.com | Senha: senha123 | Role: maker
Email: maria.santos@example.com | Senha: senha123 | Role: maker
Email: pedro.oliveira@example.com | Senha: senha123 | Role: maker
```

### Campanhas

1. **Podcast Histórias do Brasil** (podcasts)
2. **Canal de Programação Web Moderna** (technology)
3. **Arte Digital: Ilustrações Semanais** (art)
4. **Gamedev Indie: Criando Meu Primeiro Jogo** (games)
5. **Educação Financeira para Todos** (education)
6. **Música Autoral Brasileira** (music)

Cada campanha tem:
- 3 níveis de recompensa (Bronze/Prata/Ouro)
- Imagens do Unsplash
- Progresso variado (algumas completaram meta)
- Entre 45 e 156 apoiadores

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
# Backend (adicionar bcrypt)
cd backend
npm install

# Frontend (já tem tudo)
cd frontend
npm install
```

### 2. Popular o Banco de Dados

```bash
cd backend
npm run seed
```

Isso irá:
- Limpar dados existentes
- Criar 3 usuários makers
- Criar 6 campanhas de exemplo

### 3. Iniciar o Sistema

**Modo Development (com hot reload):**
```bash
npm run docker:dev
```

Ou manualmente:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Acessar

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MongoDB: localhost:27017

## 🔑 Endpoints da API

### Campanhas (Públicas)

```
GET  /api/campaigns/all              # Listar campanhas (filtros: status, category, limit, skip)
GET  /api/campaigns/:id              # Buscar por ID
GET  /api/campaigns/slug/:slug       # Buscar por slug (usado nas páginas)
GET  /api/campaigns/search?q=termo   # Buscar por texto
```

### Campanhas (Protegidas - requer token JWT)

```
POST   /api/campaigns                # Criar campanha
GET    /api/campaigns/my/campaigns   # Minhas campanhas (maker)
PUT    /api/campaigns/:id            # Atualizar campanha
DELETE /api/campaigns/:id            # Deletar campanha
```

### Autenticação

```
POST /api/auth/register              # Registrar (campos: name, email, password, role)
POST /api/auth/login                 # Login (campos: email, password)
GET  /api/auth/me                    # Info do usuário atual
POST /api/auth/logout                # Logout
```

## 🎨 Fluxos de Usuário

### Visitante

1. Acessa home → vê campanhas em destaque
2. Clica em categoria → filtra campanhas
3. Clica em "Ver todas" → vai para página de listagem completa
4. Clica em campanha → vê detalhes completos
5. Clica em "Apoiar" → é redirecionado para login

### Apoiador (Supporter)

1. Registra conta (role: supporter)
2. Login automático após registro
3. Navega campanhas
4. Clica em "Apoiar" → (UI ready, fluxo de pagamento pendente)
5. Acessa "Meus Apoios" no menu

### Fazedor (Maker)

1. Registra conta (role: maker)
2. Login automático após registro
3. Acessa "Minhas Campanhas"
4. Cria nova campanha (UI pendente)
5. Gerencia campanhas existentes
6. Cria integrações com Telegram

## 🔗 Integração com Telegram

O sistema de integração com Telegram continua funcional:

1. Maker cria campanha no site
2. Maker acessa "Integrações" (dashboard existente)
3. Vincula grupo do Telegram com campanha (usando campaignId)
4. Sistema agora usa o ID real da campanha do banco de dados

## ⚠️ Pendências

### Alta Prioridade

1. **Página de criação/edição de campanhas** (makers)
2. **Fluxo de pagamento** (integração com gateway)
3. **Página "Minhas Campanhas"** completa (manage campaigns)
4. **Página "Meus Apoios"** completa (supporter dashboard)

### Média Prioridade

1. **Validação robusta** nos formulários
2. **Mensagens de erro** mais específicas
3. **Loading states** melhores
4. **Responsividade** mobile otimizada
5. **Imagens** placeholder melhores
6. **SEO** metadata para páginas de campanhas

### Baixa Prioridade

1. **Busca avançada** (mais filtros)
2. **Ordenação** (por data, popularidade, progresso)
3. **Compartilhamento** social
4. **Métricas** e analytics
5. **Notificações** push

## 📝 Notas Técnicas

### Migrations

Não há migrations automáticas. Se você já tem dados no banco:

1. **Opção 1 (limpar tudo)**: `npm run docker:clean` e rodar seed
2. **Opção 2 (manual)**: Atualizar integrações existentes para usar ObjectId

### Performance

- Indexes criados nos campos mais consultados
- Populate usado estrategicamente
- Limite padrão de 20 campanhas na listagem

### Segurança

- Passwords com bcrypt (10 rounds)
- JWT tokens (7 dias de expiração)
- Validação de ownership em updates/deletes
- Rate limiting nas rotas de auth

### TypeScript

- 100% type-safe
- Interfaces compartilhadas entre modelos e DTOs
- No `any` types (exceto em error handlers)

## 🐛 Troubleshooting

**Erro: "Campaign not found"**
→ Rode o seed: `npm run seed`

**Erro: "User already exists"**
→ Normal se já rodou seed antes. Use emails diferentes ou limpe o banco.

**Erro: bcrypt não compila**
→ Instale build tools: `apt-get install build-essential` (Linux) ou Xcode (Mac)

**Frontend não carrega campanhas**
→ Verifique se NEXT_PUBLIC_API_URL está correta no `.env.local`

**Token inválido**
→ Limpe localStorage: `localStorage.clear()` no console do browser
