# Deployment Guide

Two pieces, two platforms:

- **Frontend** → Vercel (free, automatic on push)
- **Backend** → Railway (free tier, long-running Python + WebSocket)

Total time: ~10 minutes.

---

## Step 1 — Deploy the backend to Railway

1. Go to **https://railway.com/new**, sign in with GitHub.
2. Click **"Deploy from GitHub repo"** → pick `Louis-XWB/darwin-meme`.
3. When Railway asks which service to deploy, choose **"Add a service" → "GitHub Repo"** → same repo.
4. Click the service, open **Settings**:
   - **Root Directory**: `backend`
   - **Start Command**: *(leave blank — `railway.json` handles it)*
   - Ensure **Build** is set to Nixpacks.
5. Open the **Variables** tab and add:

   | Name | Value |
   |------|-------|
   | `OPENAI_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` *(Zhipu)* or omit for OpenAI |
   | `OPENAI_API_KEY` | your Zhipu or OpenAI key |
   | `ALLOWED_ORIGIN_REGEX` | `^https://.*\.vercel\.app$` *(allows all Vercel preview URLs; narrow later)* |
   | `DATABASE_PATH` | `/data/darwin_meme.db` *(only if you mount a Volume — see below)* |

6. **(Optional, recommended)** Click **"+ New" → "Volume"**, attach to the service with mount path `/data`. This keeps SQLite history across deploys.
7. Open **Settings → Networking**, click **"Generate Domain"**. Copy the URL — something like `darwin-meme-production.up.railway.app`. This is your backend URL.

### Sanity check

Open `https://<your-railway-domain>/api/health` in a browser — you should see `{"status":"ok","sim_running":false}`.

---

## Step 2 — Deploy the frontend to Vercel

1. Go to **https://vercel.com/new**, sign in with GitHub.
2. Click **"Import"** next to `Louis-XWB/darwin-meme`.
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: click **Edit** → set to `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
4. Expand **Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_BACKEND_URL` | `https://darwin-meme-production.up.railway.app` *(your Railway domain from step 1.7, no trailing slash)* |

5. Click **Deploy**. Wait ~60 seconds.
6. When done, click **"Visit"** — your landing page appears at `https://darwin-meme-<hash>.vercel.app`.

### Tighten CORS (optional, do this once everything works)

Back in Railway → Variables, change `ALLOWED_ORIGINS` to your Vercel production URL and remove `ALLOWED_ORIGIN_REGEX`:

```
ALLOWED_ORIGINS=https://darwin-meme.vercel.app,https://your-custom-domain.com
```

---

## Step 3 — Smoke test

1. Open the Vercel URL.
2. Click **Launch Evolution** on the landing page.
3. The top bar should show **● Connected**.
4. Press **Start Evolution**. Within a few seconds tokens/agents should appear.
5. Try **Genome Lab** → distill a wallet (use `0x3e57efef507b4db7acfa2ee79ceca6b19e18d106`).
6. Try **Live Analysis** from a KOL card — should pull tokens from Four.meme.

If connection fails, check:
- Railway service is running (Dashboard → Deployments → Latest should be green)
- `NEXT_PUBLIC_BACKEND_URL` in Vercel matches the Railway domain exactly
- No trailing `/` on the backend URL

---

## Local development (unchanged)

```bash
# Terminal 1 — backend
cd backend
export OPENAI_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
export OPENAI_API_KEY=your_key
python main.py

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

---

## Custom domain (optional)

- Vercel: **Settings → Domains** → add `darwin.meme` → follow DNS instructions.
- Railway: **Settings → Networking → Add Custom Domain** → `api.darwin.meme`. Update `NEXT_PUBLIC_BACKEND_URL` accordingly.

---

## Why not all on Vercel?

Vercel Serverless Functions cap at 10–60s runtime and don't hold persistent WebSocket connections. Darwin.meme's evolution loop runs for minutes and streams state over Socket.IO — a long-lived Railway service is the right fit.
