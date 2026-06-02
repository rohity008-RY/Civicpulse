# CivicsPulse — Complete Setup, Deploy & Play Store Guide
## Version 2.1 | April 2026

---

## WHAT YOU HAVE

```
civicpulse/
├── backend/          ← Node.js + Express API (deploy to Render.com)
│   ├── src/
│   │   ├── index.js          ← Server entry point
│   │   ├── config/
│   │   │   ├── schema.sql    ← Run in Supabase SQL Editor
│   │   │   ├── functions.sql ← Run AFTER schema.sql
│   │   │   └── supabase.js
│   │   ├── middleware/auth.js ← JWT + RBAC
│   │   ├── routes/           ← auth, issues, feed, voice, reps, admin, analytics
│   │   └── services/         ← escalation job, trending job, SLA, geo, media
├── frontend/         ← React + Vite web app (deploy to Vercel)
│   └── src/
│       ├── pages/    ← Login, Feed, Create, Detail, Escalated, Trending, Admin, Profile
│       └── components/
└── mobile/           ← React Native + Expo (publish to Play Store)
    └── src/screens/  ← Login, Home, CreateIssue (with voice)
```

---

## STEP 1 — SUPABASE SETUP (5 minutes)

1. Go to https://supabase.com → New project
2. Name: `civicpulse`, set a strong DB password, region: `Southeast Asia (Singapore)` or `South Asia`
3. Go to **SQL Editor** → **New Query**
4. Paste contents of `backend/src/config/schema.sql` → Run
5. Paste contents of `backend/src/config/functions.sql` → Run
6. Go to **Settings → API** → copy:
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_KEY`

---

## STEP 2 — AWS S3 SETUP (media uploads)

1. Go to https://console.aws.amazon.com → S3 → Create Bucket
2. Name: `civicpulse-media`, Region: `ap-south-1` (Mumbai)
3. Uncheck "Block all public access" → confirm
4. Bucket Policy → paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::civicpulse-media/*"
  }]
}
```
5. IAM → Create User `civicpulse-api` → Attach policy `AmazonS3FullAccess`
6. Create Access Key → copy `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

---

## STEP 3 — OPENAI SETUP (voice AI)

1. Go to https://platform.openai.com → API Keys → Create
2. Copy key → `OPENAI_API_KEY`
3. Ensure billing is set up (Whisper costs ~$0.006/min, GPT-4o-mini is very cheap)

---

## STEP 4 — BACKEND LOCAL SETUP

```bash
# Clone / navigate to project
cd civicpulse/backend

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env
# Edit .env with your Supabase, AWS, OpenAI keys

# Run locally
npm run dev
# → API running at http://localhost:5000
# → Test: curl http://localhost:5000/health
```

---

## STEP 5 — FRONTEND LOCAL SETUP

```bash
cd civicpulse/frontend

# Install
npm install

# Copy env
cp .env.example .env
# VITE_API_URL=http://localhost:5000

# Run
npm run dev
# → App at http://localhost:3000
```

**First login:**
- Click "Quick Demo" to auto-create a demo account
- OR register with your email

**Make yourself Admin:**
```sql
-- Run in Supabase SQL Editor
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@domain.com';
```

---

## STEP 6 — DEPLOY BACKEND TO RENDER.COM (free)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial CivicsPulse commit"
git remote add origin https://github.com/YOUR_USER/civicpulse.git
git push -u origin main
```

2. Go to https://render.com → New → Web Service
3. Connect GitHub → select repo → select `backend` folder
4. Settings:
   - **Name**: `civicpulse-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter $7/mo for always-on)

5. Environment Variables → Add all from `.env`:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `AWS_ACCESS_KEY_ID`, etc.

6. Deploy → copy your URL: `https://civicpulse-api.onrender.com`

---

## STEP 7 — DEPLOY FRONTEND TO VERCEL (free)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select repo → Framework: **Vite**
3. Root Directory: `frontend`
4. Environment Variables:
   - `VITE_API_URL` = `https://civicpulse-api.onrender.com`
5. Deploy → Your app is live at `https://civicpulse.vercel.app`

**Custom domain (optional):**
- Vercel → Settings → Domains → Add `civicpulse.in`
- Update DNS at your registrar: `CNAME www → cname.vercel-dns.com`

---

## STEP 8 — MOBILE APP SETUP

```bash
cd civicpulse/mobile

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Install dependencies
npm install

# Create .env
echo "EXPO_PUBLIC_API_URL=https://civicpulse-api.onrender.com" > .env

# Run on your phone (scan QR with Expo Go app)
npx expo start

# Run on Android emulator
npx expo start --android
```

---

## STEP 9 — PLAY STORE REGISTRATION & PUBLISH

### 9.1 — Google Play Console Account

1. Go to https://play.google.com/console
2. Sign in with Google account → **Get started**
3. Pay **$25 one-time registration fee** (USD, card required)
4. Fill developer profile: name, email, phone, address
5. Accept Developer Distribution Agreement
6. Account activated (usually instant, sometimes 24–48 hrs)

### 9.2 — Create App in Play Console

1. Play Console → **Create app**
2. Fill in:
   - **App name**: CivicsPulse
   - **Default language**: English (India)
   - **App or game**: App
   - **Free or paid**: Free
3. Click **Create app**

### 9.3 — Build APK / AAB with EAS

```bash
# Login to EAS
eas login

# Initialize EAS in your project
cd civicpulse/mobile
eas init

# Configure eas.json (created automatically, or create manually):
cat > eas.json << 'EOF'
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
EOF

# Build production AAB (Android App Bundle) — uploads to EAS servers
eas build --platform android --profile production
# Takes 10-15 minutes. Download the .aab file when done.
```

### 9.4 — App Store Listing Setup

In Play Console → your app:

**Store Listing:**
- Short description (80 chars): "Raise civic issues. Track resolutions. Hold reps accountable."
- Full description (4000 chars): Use the PRD's executive summary
- App icon: 512×512 PNG (use your CivicsPulse shield logo)
- Feature graphic: 1024×500 PNG
- Screenshots: minimum 2, recommended 8 (phone screenshots)
  - Take screenshots from your running app using Android emulator

**Content Rating:**
- Play Console → Content rating → Start questionnaire
- Answer: No violence, no adult content → Rating: Everyone

**App Content:**
- Privacy Policy URL: Create a simple page at `https://civicpulse.in/privacy`
  - Minimum required: what data you collect, how it's used
- Data Safety: Fill in location (yes, for issue mapping), name/email (yes, for account)
- Target audience: Everyone (13+)

**Pricing & Distribution:**
- Countries: India (select all Indian states)
- Free app

### 9.5 — Release to Internal Testing First

1. Play Console → Testing → Internal testing → Create release
2. Upload your `.aab` file
3. Add testers: your email + 2–3 others
4. Submit for review (internal = no review, instant)
5. Testers receive email → install via Play Store

### 9.6 — Move to Production

After testing:
1. Play Console → Release → Production → Create release
2. Upload same `.aab` or new build
3. Set rollout %: start with 10% → increase after monitoring
4. Submit for review → **Google takes 1–3 business days**
5. After approval → app is live on Play Store 🎉

---

## STEP 10 — POST-LAUNCH CHECKLIST

```
□ Backend health check: https://your-api.onrender.com/health
□ Register your own account → promote to ADMIN in Supabase
□ Inject first Corporator record via Admin Panel
□ Add first zone and ward via Supabase SQL (see functions.sql)
□ Test full flow: raise issue → check auto-assignment → SLA timer
□ Test voice submission (needs OpenAI key)
□ Set up custom domain (civicpulse.in)
□ Add Google Analytics to frontend (optional)
□ Monitor Render.com logs for errors
□ Set up Render.com alerts for downtime
```

---

## MONTHLY COSTS (Estimated)

| Service         | Free Tier                  | Paid (if needed)     |
|-----------------|----------------------------|----------------------|
| Supabase        | 500MB DB, 1GB storage      | $25/mo (Pro)         |
| Render.com      | 750hrs/mo (sleeps after 15min inactive) | $7/mo (Starter, always-on) |
| Vercel          | Unlimited for hobby        | $20/mo (Pro)         |
| AWS S3          | 5GB free (12 months)       | ~$0.023/GB           |
| OpenAI (voice)  | Pay per use, ~₹0.50/call   | ~₹500–2000/mo        |
| Domain (.in)    | ~₹800/year                 | —                    |
| **TOTAL LAUNCH**| **~₹0 for 3-6 months**     | **~₹2500/mo at scale** |

---

## TROUBLESHOOTING

**"Cannot connect to backend"**
→ Check Render.com logs → ensure all env vars are set → check CORS origin matches frontend URL

**"Ward not found for location"**
→ Ward geo_boundaries are not set yet. Run the seed SQL and add real boundaries from BMC shapefiles.

**"Voice transcription failed"**
→ Check OpenAI key is valid and has credits. Whisper requires audio/webm or audio/m4a.

**"JWT expired" errors**
→ Logout and login again. Token refresh is not yet implemented (Phase 2 feature).

**Escalation job not running**
→ On Render free tier, the server sleeps. Upgrade to Starter ($7/mo) for always-on.

---

*CivicsPulse v2.1 | Built for Mumbai, designed for India*
