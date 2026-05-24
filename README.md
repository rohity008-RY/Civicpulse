# CivicPulse 🛡️
### Civic Accountability Platform — Mumbai & Beyond

> Raise issues. Track resolutions. Hold your representative accountable.

---

## Quick Start

```bash
# 1. Setup (see SETUP_GUIDE.md for full details)
cp backend/.env.example backend/.env
# Fill in Supabase, AWS, OpenAI keys

# 2. Run backend
cd backend && npm install && npm run dev

# 3. Run frontend (new terminal)
cd frontend && npm install && npm run dev

# 4. Open http://localhost:3000 → Click "Quick Demo"
```

## Stack
- **Frontend**: React + Vite + Zustand + React Query
- **Backend**: Node.js + Express + Supabase (PostgreSQL + PostGIS)
- **Mobile**: React Native + Expo
- **AI Voice**: OpenAI Whisper (STT) + GPT-4o-mini (NLP extraction)
- **Media**: AWS S3 + CloudFront
- **Auth**: JWT + RBAC (6 roles: Citizen, Corporator, MLA, MP, Moderator, Admin)
- **Background Jobs**: node-cron (escalation every 15min, trending every 15min)

## Key Features
- 📢 Issue reporting with photo/video/GPS
- 🎤 AI Voice submission (English, Hindi, Marathi)
- 🗺️ Auto GPS → Ward → Corporator → MLA → MP routing
- ⏱️ Flexible SLA (Hours/Days/Months) with auto-escalation
- 🔥 Trending engine with Pressure Index
- 👥 Social engagement (upvote, comment, share)
- 🛡️ RBAC — Analytics/Config locked to Admin only
- 📊 Monthly public report cards per representative

## Folder Structure
```
civicpulse/
├── backend/     → Express API
├── frontend/    → React web app
├── mobile/      → Expo React Native app
└── SETUP_GUIDE.md → Full deployment + Play Store guide
```

## Deploy
- Backend → [Render.com](https://render.com) (free tier available)
- Frontend → [Vercel](https://vercel.com) (free tier available)
- Mobile → Google Play Store (see SETUP_GUIDE.md §9)

---
*See SETUP_GUIDE.md for complete step-by-step instructions.*
