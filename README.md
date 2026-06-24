# ShipFlow AI

> AI-powered feature lifecycle management — from customer request to production.

## Architecture

```
apps/
  web/          → Next.js frontend (dashboard, PRD editor, kanban, billing)
  api/          → Express + tRPC backend (business logic, auth, webhooks)
packages/
  db/           → Drizzle schema + migrations (PostgreSQL + pgvector)
  trpc/         → Shared tRPC router definitions + client types
  auth/         → BetterAuth configuration (org plugin, session middleware)
  events/       → Shared event/type contracts (Inngest events, status enums)
  ai/           → Vercel AI SDK wrappers (model factory, agent stubs)
  mem0/         → Mem0 Cloud client (AI context memory)
  github/       → Octokit client + webhook verification
  inngest/      → Background workflow function definitions
  ui/           → Shared Shadcn-based component library
  services/     → Business logic layer
  logger/       → Winston logger
  eslint-config/     → ESLint configuration
  typescript-config/ → TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js >= 18
- pnpm 9+
- Docker (for local Postgres, Redis, Inngest)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Fill in your secrets (see .env.example for docs)

# 3. Start infrastructure
docker-compose up -d

# 4. Run database migrations
pnpm db:migrate

# 5. Start development servers
pnpm dev
```

### Services (dev)
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Auth | http://localhost:8000/api/auth |
| Inngest Dashboard | http://localhost:8288 |
| Drizzle Studio | `pnpm db:studio` |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js + Shadcn UI |
| Backend | Express + tRPC |
| Monorepo | pnpm + Turborepo |
| Database | PostgreSQL + Drizzle ORM + pgvector |
| Auth | BetterAuth (with organization plugin) |
| AI Memory | Mem0 Cloud |
| AI SDK | Vercel AI SDK |
| Async Workflows | Self-hosted Inngest |
| GitHub | Octokit + Webhooks |
| Cache | Redis (Upstash in prod) |

## License

Proprietary — ShipFlow AI
