# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Keep Documentation Updated

**ALWAYS update ALL relevant .md files after making significant changes to the project**, including:
- Adding new models, controllers, services, or routes
- Creating new API endpoints
- Implementing new features or workflows
- Changing project structure or architecture
- Updating dependencies or tech stack
- Adding new environment variables
- Modifying key flows or business logic

### Files to Update:

1. **CLAUDE.md** (this file)
   - Project Stats - File counts, endpoints, components
   - Backend/Frontend Structure - New files/directories
   - Data Models - New models or schema changes
   - Key Flows - Workflow descriptions
   - API Endpoints - New or changed endpoints
   - Environment Variables - Required variables
   - Recent Updates - Dated changelog entries

2. **README.md**
   - Project statistics
   - Feature lists
   - Quick start guide
   - API endpoint summaries

3. **ARCHITECTURE.md**
   - System flows and diagrams
   - Database schemas
   - API endpoint documentation
   - Security patterns
   - Integration guides

4. **DEVELOPMENT.md**
   - Development commands
   - Docker workflows
   - Troubleshooting guides

5. **DEPLOY.md**
   - Deployment instructions
   - Environment variables
   - Production setup

### Creating New .md Files:

**ONLY create a new .md file if:**
- No existing documentation file covers the topic
- The new content is substantial and warrants a dedicated document
- It adds value that can't be incorporated into existing files

**DO NOT create new .md files for:**
- Minor features that can be documented in existing files
- Temporary documentation
- Content that belongs in code comments

This ensures documentation stays comprehensive, current, and organized.

---

## Project Overview

APOIA.se Telegram Bot - An integration system between APOIA.se (crowdfunding platform) and Telegram that automates access control to exclusive groups/channels based on supporter payment status. The system handles automatic verification, member synchronization, and removal of inactive supporters.

**Status**: ✅ MVP Complete (Phases 1-3 done, Deploy pending)

**Project Stats** (Updated 2025-11-03):
- 70+ TypeScript/TSX files (~10,000+ lines of code)
- 35+ REST API endpoints
- 8 Models (Integration, Member, EventLog, Campaign, Support, User, IntegrationAuthSession, TelegramAuthToken)
- 6 Controllers (auth, integration, integrationAuth, webhook, campaign, support)
- 10 Services (auth, integration, integrationAuth, member, telegram, telegramGroupDiscovery, verification, campaign, support, apoiaseApi)
- 10 UI Components (Button, Input, Card, Badge, Modal, Toast, Loading, Navbar, Footer, TelegramGroupSelector)
- 2 Custom Hooks (useAuth, useIntegrations)
- 11+ Pages (Home, Login, Register, Campaigns, Campaign Detail, My Campaigns, Create Campaign, My Supports, Profile, Integration Authorize, Campaign Integrations)

## Development Commands

### Core Commands
```bash
# Install dependencies (root + workspaces)
npm install

# Development - all services (backend + frontend)
npm run dev

# Development - individual services
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only

# Production build
npm run build
npm run build:backend
npm run build:frontend
```

### Docker Commands (Development & Production)
```bash
# DEVELOPMENT MODE (with hot reload - recommended for local dev)
npm run docker:dev          # Start all services in dev mode
npm run docker:dev:logs     # View logs

# PRODUCTION MODE (optimized build - for deploy)
npm run docker:prod         # Start all services in prod mode

# MANAGEMENT
npm run docker:down         # Stop all containers
npm run docker:clean        # Stop and remove volumes (WARNING: deletes DB data)

# LEGACY COMMANDS (still work, but prefer npm scripts above)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d  # Dev mode
docker-compose up -d                                                   # Prod mode
docker-compose logs -f                                                 # View logs
docker-compose down -v                                                 # Clean all
```

**Development vs Production:**
- **Dev mode**: Hot reload enabled, changes reflect instantly, no rebuild needed
- **Prod mode**: Optimized build, requires rebuild after code changes, smaller images

### Database Access
```bash
# Connect to MongoDB
docker exec -it apoiase-mongodb mongosh

# Useful mongosh commands
use apoiase-telegram-bot
db.integrations.find()
db.members.find()
db.eventlogs.find().sort({createdAt: -1}).limit(10)

# Connect to Redis
docker exec -it apoiase-redis redis-cli
```

### Testing API
```bash
# Health check
curl http://localhost:3001/health

# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"test123","name":"Test Maker"}'

# Login with registered user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"test123"}'

# Create a campaign (requires authentication token)
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"My Campaign","slug":"my-campaign","description":"Description","category":"technology","goal":1000,"currency":"BRL","imageUrl":"https://example.com/image.jpg","rewardLevels":[{"id":"1","title":"Basic","amount":10,"description":"Basic tier","benefits":["Benefit 1"]}]}'
```

## Architecture

### Tech Stack
- **Backend**: Node.js 18+, Express.js, TypeScript 5.3
- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Database**: MongoDB (Mongoose), Redis (IORedis, Bull)
- **Bot**: Telegraf 4.15
- **Auth**: JWT

### Monorepo Structure
```
apoiase-telegram-bot/
├── backend/           # Express API + Telegram Bot
├── frontend/          # Next.js Dashboard
├── shared/            # Shared TypeScript types
└── docker-compose.yml
```

### Backend Structure (Service-Controller-Route Pattern)
```
backend/src/
├── config/            # Database, Redis, Logger
├── models/            # Mongoose models
│   ├── Integration.ts             # Telegram integrations
│   ├── Member.ts                  # Group members
│   ├── EventLog.ts                # Audit logs
│   ├── Campaign.ts                # Crowdfunding campaigns
│   ├── Support.ts                 # User supports/subscriptions
│   ├── User.ts                    # User accounts
│   ├── IntegrationAuthSession.ts  # OAuth-like auth sessions (temp)
│   └── TelegramAuthToken.ts       # Telegram auth tokens
├── services/          # Business logic
│   ├── integrationService.ts           # CRUD, API key generation
│   ├── integrationAuthService.ts       # OAuth-like authorization flow
│   ├── memberService.ts                # Member management, invite links
│   ├── verificationService.ts          # APOIA.se API verification (real)
│   ├── telegramService.ts              # Bot logic, commands
│   ├── telegramGroupDiscoveryService.ts # Auto-discover Telegram groups
│   ├── apoiaseApiService.ts            # APOIA.se API client
│   ├── authService.ts                  # Authentication, JWT, user registration
│   ├── campaignService.ts              # Campaign CRUD operations
│   └── supportService.ts               # Support management
├── controllers/       # REST controllers
│   ├── authController.ts           # Login, register, logout
│   ├── integrationController.ts    # Integrations CRUD
│   ├── integrationAuthController.ts # OAuth-like authorization endpoints
│   ├── webhookController.ts        # APOIA.se & Telegram webhooks
│   ├── campaignController.ts       # Campaigns CRUD
│   └── supportController.ts        # Supports CRUD
├── routes/            # Express routes
│   ├── authRoutes.ts
│   ├── integrationRoutes.ts
│   ├── integrationAuthRoutes.ts      # Authorization flow routes
│   ├── apoiaseIntegrationRoutes.ts   # APOIA.se-specific integration routes
│   ├── webhookRoutes.ts
│   ├── campaignRoutes.ts
│   └── supportRoutes.ts
├── middleware/        # Auth, rate limiting, error handling
├── jobs/              # Bull jobs (syncMembers.ts)
├── scripts/           # Utility scripts (seedCampaigns.ts)
└── index.ts           # Entry point
```

### Frontend Structure
```
frontend/src/
├── app/              # Next.js App Router pages
│   ├── page.tsx              # Landing page (campaigns showcase)
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── campanhas/            # All campaigns list
│   ├── campanha/[slug]/      # Campaign detail page
│   ├── criar-campanha/       # Create campaign wizard
│   ├── minhas-campanhas/     # My campaigns dashboard
│   ├── meus-apoios/          # My supports/subscriptions
│   ├── profile/              # User profile
│   ├── campaigns/[slug]/integrations/ # Campaign integrations management
│   ├── integration/authorize/ # OAuth-like authorization page
│   └── layout.tsx            # Root layout with Navbar & Footer
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Loading.tsx
│   ├── Navbar.tsx             # Global navigation bar
│   ├── Footer.tsx             # Global footer
│   └── TelegramGroupSelector.tsx # Telegram group selection component
├── hooks/            # Custom hooks (useAuth, useIntegrations)
├── lib/api.ts        # Axios API client with interceptors
└── styles/globals.css # TailwindCSS styles
```

### Data Models

**User** (user accounts with authentication)
- email, password (bcrypt hashed), name, roles (admin | user)
- Created when users register via `/api/auth/register`

**Campaign** (crowdfunding campaigns)
- makerId (ref to User), title, slug, description, category, goal, raised, currency
- imageUrl, videoUrl, rewardLevels[], supporters, status (draft | active | paused | completed)
- Full campaign management with CRUD operations

**Support** (user subscriptions to campaigns)
- userId (ref to User), campaignId (ref to Campaign), rewardLevelId, amount
- status (active | cancelled | paused | payment_failed), payment dates, recurring
- Tracks user's active supports and payment status

**Integration** (links campaigns to Telegram groups)
- campaignId (ref to Campaign), telegramGroupId, telegramGroupType, apiKey
- rewardLevels[], isActive, createdBy (ref to User)
- Now uses proper ObjectId references instead of strings

**Member** (supporter in a Telegram group)
- integrationId, supporterEmail, supporterId, telegramUserId
- status: pending_verification | active | payment_overdue | removed
- inviteToken, inviteExpiresAt (24h validity)

**EventLog** (audit trail)
- eventType, integrationId, memberId, metadata

**IntegrationAuthSession** (temporary OAuth-like sessions)
- stateToken (unique, 30min expiry), campaignSlug, apiKey, bearerToken
- telegramUserId, telegramUsername, telegramGroupId, telegramGroupTitle
- status: pending | telegram_auth_complete | group_selected | completed | expired | cancelled
- Used for OAuth-like flow between APOIA.se and this service

**TelegramAuthToken** (stores validated Telegram auth data)
- userId, username, firstName, photoUrl, authDate, hash
- Validated using HMAC-SHA256 with bot token

### Key Flows

1. **OAuth-like Integration (APOIA.se → Telegram)**:
   - Maker clicks "Connect Telegram" on APOIA.se → redirects to our service with temp credentials
   - User sees preliminary instructions to create new empty Telegram group
   - User authenticates with Telegram Login Widget → validates hash
   - System auto-discovers Telegram groups where bot is admin → displays with member count
   - Groups with >1 member show yellow warning; empty groups show green "Recomendado" badge
   - User selects group → backend validates and warns if group has existing members
   - Integration created → redirects back to APOIA.se with success status

2. **Create Integration (Legacy)**: Maker links campaign → validates bot permissions → generates API key

3. **New Supporter**: APOIA.se webhook → creates member → generates invite link (24h)

4. **Verification**: User joins → bot requests email → verifies with APOIA.se API (real) → grants/denies access

5. **Daily Sync**: Cron job (02:00) → checks all members → sends warnings (48h) → removes inactive (7 days)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (email, password, name)
- `POST /login` - Login with email/password (returns JWT token)
- `POST /validate-apoiase` - Validate APOIA.se token (production authentication)
- `GET /me` - Get current user info (requires auth)
- `POST /logout` - Logout (requires auth)

### Campaigns (`/api/campaigns`)
- `POST /` - Create new campaign (requires auth)
- `GET /all` - List all public campaigns (with filters: category, status, search)
- `GET /search` - Search campaigns by query
- `GET /my/campaigns` - List current user's campaigns (requires auth)
- `GET /slug/:slug` - Get campaign by slug (public)
- `GET /:id` - Get campaign by ID (public)
- `PUT /:id` - Update campaign (requires auth + ownership)
- `DELETE /:id` - Delete campaign (requires auth + ownership)

### Supports (`/api/supports`)
- `POST /` - Create new support/subscription (requires auth)
- `GET /my/supports` - List current user's supports (requires auth)
- `GET /campaign/:campaignId` - List supports for a campaign
- `POST /:id/pause` - Pause support (requires auth + ownership)
- `POST /:id/resume` - Resume support (requires auth + ownership)
- `POST /:id/cancel` - Cancel support (requires auth + ownership)

### Integrations (`/api/integrations`)
- `POST /` - Create integration (requires auth)
- `GET /` - List user integrations (requires auth)
- `GET /telegram-link/:campaignId` - Get Telegram link for campaign (requires auth)
- `GET /:id` - Get integration details (requires auth)
- `PUT /:id` - Update integration (requires auth + ownership)
- `DELETE /:id` - Delete integration (requires auth + ownership)
- `POST /:id/activate` - Activate integration (requires auth + ownership)
- `POST /:id/deactivate` - Deactivate integration (requires auth + ownership)
- `POST /:id/regenerate-key` - Regenerate API key (requires auth + ownership)

### Integration Authorization (`/api/integration`) - OAuth-like Flow
- `GET /authorize` - Initiate authorization flow (accepts: campaign_slug, api_key, bearer_token, redirect_uri)
- `POST /telegram-auth` - Process Telegram Login Widget callback
- `GET /available-groups` - List Telegram groups where bot is admin
- `POST /select-group` - Select Telegram group for integration
- `POST /complete` - Complete authorization and create integration (requires auth)
- `GET /session/:stateToken` - Get session status
- `POST /cancel` - Cancel authorization flow
- `GET /callback` - Callback endpoint for APOIA.se

### APOIA.se Integration Routes (`/api/campaigns/:campaignSlug/integrations/telegram`)
- `POST /` - Start integration from APOIA.se (creates temp credentials, returns redirect URL)
- `GET /callback` - Callback from integration service
- `GET /` - List integrations for campaign
- `DELETE /:id` - Remove integration

### Webhooks
- `POST /webhook/apoiase` - APOIA.se webhook (6 events)
- `POST /webhook/telegram` - Telegram webhook

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/apoiase-telegram-bot
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username  # For Telegram Login Widget
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram

APOIASE_API_KEY=your-api-key  # Optional, for legacy integration
APOIASE_WEBHOOK_SECRET=your-webhook-secret
APOIASE_API_URL=https://api.apoia.se  # Real API endpoint
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username  # For Telegram Login Widget
```

## Important Patterns and Conventions

### Git Commit Messages
**IMPORTANT**: When creating git commits, **DO NOT** include the following lines in the commit message:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Keep commit messages clean and focused on the actual changes made. Use conventional commit format:
- `feat: description` for new features
- `fix: description` for bug fixes
- `refactor: description` for code refactoring
- `docs: description` for documentation changes
- `style: description` for formatting changes

### TypeScript Strict Mode
- All code is 100% TypeScript (type-safe)
- Shared types in [shared/types.ts](shared/types.ts)
- Use interfaces from shared types for consistency

### Error Handling
- All errors go through [errorHandler middleware](backend/src/middleware/errorHandler.ts)
- Use Winston logger for logging ([backend/src/config/logger.ts](backend/src/config/logger.ts))
- Never expose sensitive data in error responses

### Authentication Flow
- **User Registration**: Users register via `/api/auth/register` with email, password, and name
- **Password Security**: Passwords are hashed using bcrypt (10 rounds) before storing
- **JWT Tokens**: Login returns JWT token in Authorization header format: `Bearer <token>`
- **Token Storage**: Frontend stores token in localStorage, automatically included in all API requests
- **Role System**: Users have roles array (`['admin', 'user']`), checked via `requireRole()` middleware
- **Auth Middleware**: [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts) - validates JWT and populates `req.user`
- **Frontend Hook**: [frontend/src/hooks/useAuth.tsx](frontend/src/hooks/useAuth.tsx) - manages auth state and token

### API Key Generation
- Integration API keys are base64-encoded random bytes (32 bytes)
- Generated in [integrationService.ts:22](backend/src/services/integrationService.ts)

### Bot Commands
- `/start` - Start verification
- `/help` - Help message
- `/verify` - Verify supporter status

### Jobs (Bull + Redis)
- Daily sync job: 02:00 (cron: `0 2 * * *`)
- Removal check job: Every 6 hours
- Configured in [backend/src/jobs/syncMembers.ts](backend/src/jobs/syncMembers.ts)

## Common Development Tasks

### Adding a New API Endpoint
1. Create/update service in `backend/src/services/`
2. Create/update controller in `backend/src/controllers/`
3. Add route in `backend/src/routes/`
4. Register route in `backend/src/index.ts`

### Adding a New Frontend Component
1. Create component in `frontend/src/components/ui/`
2. Export from `frontend/src/components/ui/index.ts`
3. Use TailwindCSS for styling

### Adding a New Telegram Bot Command
1. Add command handler in [telegramService.ts](backend/src/services/telegramService.ts)
2. Update `/help` command text
3. Set command in @BotFather (`/setcommands`)

### Adding a New Job
1. Create job in `backend/src/jobs/`
2. Register in `setupRecurringJobs()` in [syncMembers.ts](backend/src/jobs/syncMembers.ts)

## Database Indexes

Critical indexes for performance:
- Integration: `campaignId`, `telegramGroupId` (unique), `apiKey` (unique)
- Member: `integrationId + status`, `supporterEmail + integrationId`, `inviteToken`
- EventLog: `eventType`, `integrationId`, `createdAt`

## Security Considerations

- Rate limiting on all `/api/*` routes (express-rate-limit)
- Helmet.js for HTTP headers
- CORS configured for frontend origin only
- JWT tokens expire in 7 days
- Webhook signature validation (TODO: implement for APOIA.se webhooks)
- Input validation with Joi (partially implemented)

## Testing Telegram Bot

1. Get bot token from @BotFather
2. Add bot as admin to test group with permissions: manage members, create invite links
3. Get group ID using @RawDataBot (format: `-100XXXXXXXXXX`)
4. Test commands: `/start`, `/verify`, then send email

## Known Issues & TODOs

- Webhook signature validation not implemented for APOIA.se
- Test suite not implemented (Jest configured but no tests)
- Email notification service not implemented
- Payment integration not implemented (supports are created but payment flow is TODO)
- Image upload service not implemented (currently using external URLs)
- Profile page UI not fully implemented

## Recent Updates

### November 2025 (Latest)
1. **Group Creation Guidance and Member Validation** (2025-11-07)
   - Added backend validation to detect and warn about groups with existing members
   - Groups with >1 member flagged with `hasExistingMembers` in API responses
   - Warning message returned when selecting group with existing members
   - Updated `listAvailableGroups()` to include real-time member count from Telegram
   - Added preliminary instructions before Telegram auth step
   - Step-by-step guide for creating new empty group in TelegramGroupSelector
   - Visual indicators: Green "Recomendado" badge for empty groups, Yellow "Tem membros" warning for populated groups
   - Inline warning messages explaining risks of using groups with existing members
   - Improved UX to prevent access control issues from non-verified members

2. **OAuth-like Integration Flow with APOIA.se**
   - Created full OAuth-like authorization flow for seamless integration
   - Added IntegrationAuthSession model for temporary session management
   - Implemented Telegram Login Widget authentication with hash validation
   - Added automatic Telegram group discovery (lists groups where bot is admin)
   - Created integration authorization page with step-by-step UI
   - APOIA.se can now redirect makers to our service for one-click Telegram integration

3. **Real APOIA.se API Integration**
   - Implemented apoiaseApiService for real API communication
   - Verification now uses actual APOIA.se API endpoint (`/backers/charges/{email}`)
   - Campaign-specific API credentials stored securely (select: false in model)
   - Support for real-time payment status verification

4. **New Services & Controllers**
   - integrationAuthService - OAuth-like flow logic
   - integrationAuthController - Authorization endpoints
   - telegramGroupDiscoveryService - Auto-discover bot's Telegram groups
   - apoiaseApiService - APOIA.se API client

5. **New Frontend Pages**
   - `/integration/authorize` - OAuth authorization page with Telegram widget
   - `/campaigns/[slug]/integrations` - Campaign integrations management
   - TelegramGroupSelector component for group selection UI

6. **Documentation**
   - Added INTEGRATION_FLOW.md - Complete OAuth flow documentation
   - Added APOIA_SE_INTEGRATION_GUIDE.md - Integration guide for APOIA.se team

### October 2025
1. **Authentication System Overhaul**
   - Removed mock authentication, implemented real database-backed auth
   - Added user registration endpoint (`POST /api/auth/register`)
   - Passwords now properly hashed with bcrypt
   - Changed role system from single `role` to `roles` array

2. **Campaign & Support Systems**
   - Created complete Campaign model with reward levels
   - Added full CRUD for campaigns and supports
   - Campaign creation wizard with 3-step form
   - Public campaign discovery with filters

3. **Frontend Revamp**
   - Built modern UI with Navbar and Footer
   - Landing page with campaign showcase
   - Multiple dashboards (My Campaigns, My Supports)

4. **Database Schema Updates**
   - All models now use proper ObjectId references
   - Added indexes for performance

## Troubleshooting

**MongoDB connection fails**: Check if container is running (`docker ps`), restart with `docker-compose restart mongodb`

**Bot doesn't respond**: Verify token with `curl https://api.telegram.org/bot<TOKEN>/getMe`, check logs in `backend/logs/`

**Frontend 404 on API calls**: Verify backend is running (`curl http://localhost:3001/health`), check `NEXT_PUBLIC_API_URL`

**Port conflicts**: Check ports 3000 (frontend), 3001 (backend), 27017 (MongoDB), 6379 (Redis) are available

## Documentation Files

- **[README.md](README.md)** - Complete project overview with quick start guide (5 min)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture, flows, schemas, and APOIA.se integration guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development commands, Docker modes, workflows, and troubleshooting
- **[DEPLOY.md](DEPLOY.md)** - Deploy guide (Railway), database seed, backup/restore, and production setup
- **[CLAUDE.md](CLAUDE.md)** - This file (project instructions for Claude Code AI)
