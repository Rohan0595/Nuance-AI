# AI Contextual News App — Full Stack

A production-ready full-stack news application that fetches real-time news, enriches it with AI-generated context via Claude, and stores data in MongoDB.

```
Frontend (React + Vite)
        ↕  /api proxy (dev) / direct (prod)
Backend (Express + Node.js)
        ↕
  ┌─────┼──────────────────┐
  │     │                  │
Claude  NewsAPI/GNews/    MongoDB
  AI    Guardian API
```

---

## Quick Start (Local Dev, No Docker)

### Prerequisites
- Node.js 20+
- MongoDB running locally (`mongod`) **or** MongoDB Atlas URI
- API keys (see below)

### 1. Clone & install
```bash
git clone <repo>
cd ai-news-app

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your API keys
```

Required keys in `backend/.env`:
| Key | Where to get |
|-----|-------------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `NEWS_API_KEY` | https://newsapi.org (free: 100 req/day) |
| `MONGODB_URI` | Local: `mongodb://localhost:27017/ainews` |

Optional (alternative news providers):
| Key | Where to get |
|-----|-------------|
| `GNEWS_API_KEY` | https://gnews.io |
| `GUARDIAN_API_KEY` | https://open-platform.theguardian.com |

Set `NEWS_PROVIDER=newsapi` (or `gnews` or `guardian`) to choose the provider.

### 3. Run both servers
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Quick Start (Docker)

```bash
cp backend/.env.example .env   # edit .env at root
docker-compose up --build
```
- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000/api/health  
- MongoDB: localhost:27017

---

## API Reference

All endpoints return `{ success: boolean, ... }`.

### News

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/news` | Fetch news feed. Query: `?category=AI&pageSize=20` |
| `GET` | `/api/news/:id` | Get single article by ID |
| `GET` | `/api/search?q=` | Search real-time news |

### AI

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/context` | `{ article }` | Generate AI context (summary, implications, entities) |
| `POST` | `/api/summary` | `{ article }` | Generate bullet-point summary |
| `POST` | `/api/credibility` | `{ article }` | Compute credibility score (0–100) |
| `POST` | `/api/reel` | `{ article }` | Generate short-form reel script |

### Saved Articles

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/save` | Toggle save/unsave an article |
| `GET` | `/api/saved` | List saved articles for this session |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + DB/provider status |

---

## Project Structure

```
ai-news-app/
├── backend/
│   ├── server.js               # Express entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── models/
│   │   └── index.js            # Mongoose schemas
│   ├── routes/
│   │   └── api.js              # All API routes
│   ├── services/
│   │   ├── newsService.js      # NewsAPI / GNews / Guardian
│   │   ├── aiService.js        # Claude context/summary/reel
│   │   ├── credibilityService.js
│   │   └── reelService.js      # Reel pre-fetching
│   └── middleware/
│       └── errorHandler.js
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js          # /api proxy → backend
│   ├── .env.example
│   ├── Dockerfile.dev
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Full UI (unchanged look + feel)
│       ├── hooks/
│       │   └── useNews.js      # useNewsFeed, useSearch, useArticleContext, useReel
│       └── services/
│           └── api.js          # All fetch() calls centralised here
│
├── docker-compose.yml
├── package.json                # Monorepo root (concurrently)
└── README.md
```

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `newscaches` | Cached news feeds (TTL index auto-expires) |
| `savedarticles` | Per-session saved articles |
| `aicontexts` | Cached AI context to avoid duplicate Claude calls |
| `credibilityscores` | Cached credibility scores |
| `users` | Optional user profiles |

---

## Deployment

### Railway / Render / Fly.io (Backend)
1. Set all env vars from `backend/.env.example`
2. Set `NODE_ENV=production`
3. Deploy backend. Note the URL (e.g. `https://ainews-api.railway.app`)

### Vercel / Netlify (Frontend)
1. Set `VITE_API_URL=https://ainews-api.railway.app/api`
2. Deploy frontend from the `frontend/` directory

### MongoDB Atlas
Replace `MONGODB_URI` with your Atlas connection string:
```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ainews
```

---

## News Provider Comparison

| Provider | Free Tier | Category Filter | Full Text |
|----------|-----------|----------------|-----------|
| NewsAPI | 100 req/day | ✅ (US headlines) | ❌ truncated |
| GNews | 100 req/day | ✅ | ✅ |
| Guardian | ~5000 req/day | ✅ | ✅ |

**Recommendation:** Start with Guardian API (most generous free tier, great full-text).

---

## Environment Variables Reference

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ainews
ANTHROPIC_API_KEY=sk-ant-...
NEWS_API_KEY=...
GNEWS_API_KEY=...
GUARDIAN_API_KEY=...
NEWS_PROVIDER=newsapi
NEWS_CACHE_TTL=300
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=        # empty in dev (uses Vite proxy)
```
