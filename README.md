# Medium Auto Publisher 🤖✍️

> An AI-powered SaaS platform that researches topics, generates human-quality blog content, plans playlists, and publishes directly to Medium using Playwright Stealth.

## 🚀 Features

- **Automated Topic Discovery**: Background workers scrape top content from Dev.to and HackerNews to find trending topics for you.
- **AI Content Planner**: Feed it a topic, and it will analyze whether it's best suited for a deep-dive **Single Blog** or a multi-part **Playlist/Series**.
- **Granular Generation**: Review the AI's proposed plan and generate blogs one-by-one to save API costs and maintain full control.
- **5-Stage AI Content Pipeline**: Every blog passes through Research → Outline → Writer → Humanizer → Editor.
- **Human-Quality Writing**: The Humanizer Agent removes AI patterns ("delve into", "leverage", etc.), adjusts burstiness, and adds real examples.
- **Medium Playwright Publisher**: Publishes directly to Medium using browser automation with stealth plugins and session cookies (bypassing the need for deprecated Integration Tokens).
- **Dashboard & Analytics**: Manage your topics, review drafts, schedule posts, and view basic analytics.

---

## 🏗️ Architecture

```
apps/
├── web/        # Next.js 15 Dashboard (port 3000)
├── api/        # NestJS REST API (port 3001)
└── worker/     # BullMQ background workers (Trending, Discovery, Publish, etc.)

packages/
├── database/   # Prisma schema + PostgreSQL client
├── types/      # Shared TypeScript types
└── ai/         # 5-stage AI content pipeline and Discovery Agent
```

---

## 🛠️ Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker Desktop (for Postgres & Redis)

### 1. Clone & Install
```bash
git clone <repo>
cd medium-auto-publisher
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

**Required keys in `.env`:**
| Key | Where to Get |
|-----|-------------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `JWT_SECRET` | Generate via: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Generate via: `openssl rand -hex 16` |
| `DATABASE_URL` | Default: `postgresql://postgres:postgres@localhost:5432/medium_publisher` |
| `REDIS_HOST` | Default: `localhost` |
| `REDIS_PORT` | Default: `6379` |

### 3. Start Database & Redis
Ensure Docker Desktop is running, then start the containers:
```bash
docker-compose up -d
```

### 4. Database Setup
Push the schema to the database and generate the Prisma Client:
```bash
pnpm --filter @medium-publisher/database db:push
pnpm --filter @medium-publisher/database db:generate
```

### 5. Start All Services
```bash
pnpm dev
```

**What this starts:**
- **Frontend Dashboard:** http://localhost:3000
- **NestJS API:** http://localhost:3001
- **Background Workers:** Runs silently to process queues

---

## 📝 How to Use the Platform

### 1. Setup Medium Authentication
Since Medium no longer issues Integration Tokens, this app uses **Playwright Stealth** to publish on your behalf.
1. Log into Medium in your normal browser.
2. Open Developer Tools -> Application -> Cookies.
3. Copy the values of the `uid` and `sid` cookies.
4. Format them as `uid=YOUR_UID; sid=YOUR_SID;`.
5. Go to **Settings** in the dashboard and save this as your Medium Cookie.

### 2. Discover & Evaluate Topics
1. Navigate to the **Topics** tab.
2. Click **Trending** to see topics automatically fetched from Dev.to and HackerNews.
3. Alternatively, click **Add Topic** to insert your own idea.
4. The backend `DiscoveryAgent` will automatically evaluate your topic and propose a content plan (Single Blog vs. Playlist).

### 3. Generate Content
1. Click on a topic to view its details.
2. Review the **AI Content Plan**.
3. Click **Run Deep Research**. The AI will scour the web for statistics, FAQs, and real examples.
4. Once research completes, click **Generate** next to any proposed blog piece.
5. The `blog-gen-queue` will route it through the 5-stage pipeline.

### 4. Review and Publish
1. Go to the **Blogs** tab to review the generated drafts.
2. Click **Publish to Medium** when you are satisfied, or click **Schedule** to have the background worker publish it later.

---

## 🤖 Content Quality Metrics

Every generated blog is evaluated internally against specific thresholds before marking it as complete:
- **AI Probability Score** (lower = more human): target < 60
- **Burstiness Score** (higher = more human): target > 0.4
- **Lexical Richness**: target > 45%
- **Readability Score** (Flesch): target 50-70

## 📄 License
Yaksh Bhesaniya @IIT-Bombay
