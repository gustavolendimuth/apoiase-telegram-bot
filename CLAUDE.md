# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

APOIA.se Telegram Bot - An integration system between APOIA.se (crowdfunding platform) and Telegram that automates access control to exclusive groups/channels based on supporter payment status. The system handles automatic verification, member synchronization, and removal of inactive supporters.

**Status**: ✅ MVP Complete (Phases 1-3 done, Deploy pending)

**Project Stats** (Verified):
- 39 TypeScript/TSX files (~4,433 lines of code)
- 18 REST API endpoints
- 3 Models (Integration, Member, EventLog)
- 3 Controllers (auth, integration, webhook)
- 5 Services (auth, integration, member, telegram, verification)
- 7 UI Components (Button, Input, Card, Badge, Modal, Toast, Loading)
- 2 Custom Hooks (useAuth, useIntegrations)
- 3 Pages (Home, Login, Dashboard)

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

### Infrastructure (Docker)
```bash
# Start infrastructure only (MongoDB + Redis)
docker-compose up -d mongodb redis

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop and remove volumes (WARNING: deletes DB data)
docker-compose down -v
```

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

# Login (accepts any email/password in development mode)
# Use "maker" in email for maker role, otherwise gets supporter role
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maker@example.com","password":"anypassword"}'
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
├── models/            # Mongoose models (Integration, Member, EventLog)
├── services/          # Business logic
│   ├── integrationService.ts  # CRUD, API key generation
│   ├── memberService.ts       # Member management, invite links
│   ├── verificationService.ts # APOIA.se API verification (mock + real)
│   └── telegramService.ts     # Bot logic, commands
├── controllers/       # REST controllers
├── routes/            # Express routes
├── middleware/        # Auth, rate limiting, error handling
├── jobs/              # Bull jobs (syncMembers.ts)
└── index.ts           # Entry point
```

### Frontend Structure
```
frontend/src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Landing page
│   ├── login/        # Login page
│   └── dashboard/    # Dashboard (integrations management)
├── components/ui/    # Reusable UI components
├── hooks/            # Custom hooks (useAuth, useIntegrations)
└── lib/api.ts        # Axios API client
```

### Data Models

**Integration** (links APOIA.se campaign to Telegram group)
- campaignId, telegramGroupId, apiKey, rewardLevels, isActive

**Member** (supporter in a group)
- integrationId, supporterEmail, supporterId, telegramUserId
- status: pending_verification | active | payment_overdue | removed
- inviteToken, inviteExpiresAt (24h validity)

**EventLog** (audit trail)
- eventType, integrationId, memberId, metadata

### Key Flows

1. **Create Integration**: Maker links campaign → validates bot permissions → generates API key
2. **New Supporter**: APOIA.se webhook → creates member → generates invite link (24h)
3. **Verification**: User joins → bot requests email → verifies with APOIA.se API → grants/denies access
4. **Daily Sync**: Cron job (02:00) → checks all members → sends warnings (48h) → removes inactive (7 days)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - Login (development mode: accepts any email/password. Email with "maker" gets maker role, otherwise supporter)
- `POST /validate-apoiase` - Validate APOIA.se token (production authentication)
- `GET /me` - Get current user
- `POST /logout` - Logout

### Integrations (`/api/integrations`)
- `POST /` - Create integration
- `GET /` - List user integrations
- `GET /:id` - Get integration details
- `PUT /:id` - Update integration
- `DELETE /:id` - Delete integration
- `POST /:id/toggle` - Activate/deactivate
- `GET /:id/members` - List members
- `POST /:id/sync` - Trigger sync now

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
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram

APOIASE_API_KEY=your-api-key
APOIASE_WEBHOOK_SECRET=your-webhook-secret
APOIASE_API_URL=https://apoia.se/api
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Important Patterns and Conventions

### TypeScript Strict Mode
- All code is 100% TypeScript (type-safe)
- Shared types in [shared/types.ts](shared/types.ts)
- Use interfaces from shared types for consistency

### Error Handling
- All errors go through [errorHandler middleware](backend/src/middleware/errorHandler.ts)
- Use Winston logger for logging ([backend/src/config/logger.ts](backend/src/config/logger.ts))
- Never expose sensitive data in error responses

### Authentication Flow
- JWT tokens in Authorization header: `Bearer <token>`
- Auth middleware in [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)
- Frontend uses useAuth hook ([frontend/src/hooks/useAuth.tsx](frontend/src/hooks/useAuth.tsx))

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

## Verification Service (Mock vs Production)

The verification service ([backend/src/services/verificationService.ts](backend/src/services/verificationService.ts)) supports both mock and production modes:
- Mock mode returns `active` for testing (when APOIA.se API not configured)
- Production mode calls real APOIA.se API

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
- Dashboard metrics/charts not implemented

## Troubleshooting

**MongoDB connection fails**: Check if container is running (`docker ps`), restart with `docker-compose restart mongodb`

**Bot doesn't respond**: Verify token with `curl https://api.telegram.org/bot<TOKEN>/getMe`, check logs in `backend/logs/`

**Frontend 404 on API calls**: Verify backend is running (`curl http://localhost:3001/health`), check `NEXT_PUBLIC_API_URL`

**Port conflicts**: Check ports 3000 (frontend), 3001 (backend), 27017 (MongoDB), 6379 (Redis) are available

## Documentation Files

- [README.md](README.md) - Complete project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture and flows
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Development progress and status
- [GETTING_STARTED.md](GETTING_STARTED.md) - Quick start guide (5 minutes)
- [COMMANDS.md](COMMANDS.md) - Comprehensive command reference
