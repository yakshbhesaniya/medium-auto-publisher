# Medium Auto Publisher 🤖✍️

> An AI-powered SaaS platform that researches topics, generates human-quality blog content, and publishes to Medium — using the **official Medium API** (zero bot risk).

## Architecture

```
apps/
├── web/        # Next.js 15 Dashboard (port 3000)
├── api/        # NestJS REST API (port 3001)
└── worker/     # BullMQ background workers

packages/
├── database/   # Prisma schema + PostgreSQL client
├── types/      # Shared TypeScript types
└── ai/         # 5-stage AI content pipeline
```

## AI Content Pipeline

Every blog goes through 5 quality stages before it reaches you:

```
Topic → Research → Outline → Write → Humanize → Edit → SEO → Cover Image
         (GPT-4o)  (Claude)  (Claude) (Claude)  (Claude) (GPT-4o) (DALL-E 3)
```

**Humanizer Agent** removes all AI patterns:
- Strips forbidden phrases ("dive into", "leverage", "transformative", etc.)
- Increases sentence burstiness (variance)
- Adds opinions, rhetorical questions, real examples
- Rejects content if AI probability score > 60%

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker Desktop

### 1. Clone & Install
```bash
git clone <repo>
cd medium-auto-publisher
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys
```

Required keys:
| Key | Where to Get |
|-----|-------------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `MEDIUM_INTEGRATION_TOKEN` | Medium → Settings → Integration Tokens |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Generate: `openssl rand -hex 16` |

### 3. Start Database & Redis
```bash
docker-compose up -d
```

### 4. Database Setup
```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start All Services
```bash
pnpm dev
```

This starts:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- pgAdmin: http://localhost:5050
- Redis UI: http://localhost:8081

Default login: `admin@mediumpublisher.com` / `admin123!`

## Medium Integration (No Bot Risk!)

This platform uses Medium's **official Integration Token API** — not Playwright automation. This means:
- ✅ Fully compliant with Medium's ToS
- ✅ No bot detection issues
- ✅ Stable and reliable
- ✅ Get your token at: Medium → Settings → Security → Integration Tokens

## Features

| Feature | Status |
|---------|--------|
| 5-stage AI blog pipeline | ✅ |
| Human-quality writing | ✅ |
| Topic management | ✅ |
| Blog editor with AI toolbar | ✅ |
| Medium API publishing | ✅ |
| Scheduled publishing | ✅ |
| Blog playlists/series | ✅ |
| Cover image generation | ✅ |
| Analytics dashboard | ✅ |
| Version history | ✅ |
| SEO optimization | ✅ |
| Internal linking | ✅ |

## Project Structure

```
.
├── apps/
│   ├── api/                    # NestJS REST API
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/       # JWT authentication
│   │       │   ├── users/      # User management
│   │       │   ├── topics/     # Topic CRUD + approval
│   │       │   ├── blogs/      # Blog CRUD + AI trigger
│   │       │   ├── playlists/  # Blog series
│   │       │   ├── analytics/  # Stats & charts
│   │       │   ├── publisher/  # Medium API
│   │       │   └── schedules/  # Scheduled publishing
│   │       └── workers/        # BullMQ workers (in API)
│   ├── web/                    # Next.js 15 Frontend
│   │   └── src/
│   │       ├── app/            # App router pages
│   │       ├── components/     # React components
│   │       ├── hooks/          # React Query hooks
│   │       └── lib/            # API client, utils
│   └── worker/                 # Standalone BullMQ workers
│       └── src/workers/
├── packages/
│   ├── database/               # Prisma schema
│   ├── types/                  # Shared TS types
│   └── ai/                     # AI agents + pipeline
│       └── src/
│           ├── agents/         # Research, Outline, Writer, Humanizer, Editor, SEO, Image
│           ├── providers/      # OpenAI + Anthropic
│           └── pipeline/       # BlogPipeline orchestrator
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Content Quality Metrics

Every generated blog is scored on:
- **AI Probability Score** (lower = more human): target < 60
- **Burstiness Score** (higher = more human): target > 0.4
- **Lexical Richness**: target > 45%
- **Readability Score** (Flesch): target 50-70
- **Word Count**: minimum 1300 (5 min read)

## License

MIT
