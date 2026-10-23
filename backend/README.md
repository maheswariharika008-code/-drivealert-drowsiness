# Backend (Phase 2)

Node.js + Express + TypeScript API. Owns auth, MongoDB persistence, the
Socket.IO relay to the dashboard, and FCM push dispatch to the mobile app.

## Verified in this session

- `npx tsc --noEmit` → **0 type errors**
- App boots standalone and `/health` returns `200` with real JSON
- `POST /api/auth/register` with bad input → `422` with field-level errors
  (empty name, invalid email, weak password, missing phone/vehicle — all
  caught)
- `POST /api/alerts` without `x-api-key` → `401` (AI service auth works)

Not yet verified here (needs real infra, no network egress to MongoDB Atlas
or Firebase in this sandbox): live MongoDB writes, Socket.IO round-trip, and
FCM delivery. Structurally correct and ready to test against your own Atlas
cluster + Firebase project.

## Folder structure

```
backend/
├── src/
│   ├── config/       # env, MongoDB connection, Firebase Admin init
│   ├── models/        # User, Session, Alert, Notification (Mongoose)
│   ├── middleware/     # JWT auth, AI-service API-key auth, rate limiting, errors
│   ├── controllers/    # auth, session, alert business logic
│   ├── routes/         # Express routers
│   ├── services/       # fcmService (push notifications)
│   ├── sockets/        # Socket.IO server + per-driver rooms
│   ├── utils/          # jwt helpers, validators, apiResponse
│   ├── app.ts           # Express app assembly
│   └── server.ts         # Boots DB + Firebase + HTTP + Socket.IO
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGODB_URI (MongoDB Atlas connection string), JWT secrets,
# AI_SERVICE_API_KEY (must match ai-service/.env), SMTP creds (optional
# in dev — reset tokens just get logged to console if SMTP isn't set)
npm run dev
```

Server starts on `http://localhost:5000`. `GET /health` for a liveness check.

### Firebase Cloud Messaging setup

1. Firebase Console → Project Settings → Service Accounts → Generate new
   private key → save the JSON as `backend/firebase-service-account.json`
   (or wherever `FIREBASE_SERVICE_ACCOUNT_PATH` points).
2. **Never commit this file** — it's already excluded via `.gitignore`.
3. If it's missing, the server still runs — FCM sends are skipped and
   logged as a `Notification` with `delivered: false` instead of crashing.

## API Reference

### Auth — `/api/auth`
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/register` | — | `name, email, password, phone, vehicleNumber, profilePhoto?` |
| POST | `/login` | — | `email, password` |
| POST | `/forgot-password` | — | `email` |
| POST | `/reset-password` | — | `token, newPassword` |
| GET | `/profile` | JWT | — |
| PUT | `/profile` | JWT | `name?, phone?, vehicleNumber?, profilePhoto?` |
| POST | `/device-token` | JWT | `fcmToken` — mobile app calls this after login to register for push |

Auth endpoints are rate-limited to 20 requests / 15 min per IP.

### Sessions — `/api/sessions` (all JWT-protected)
| Method | Path | Purpose |
|---|---|---|
| POST | `/start` | Begin a driving session (idempotent — returns existing active session if one exists) |
| POST | `/:sessionId/stop` | End session, computes avg/max fatigue score + total alerts from stored Alert docs |
| GET | `/` | Paginated session history (`?page=&limit=`) |
| GET | `/:sessionId` | Session detail + all its alerts |

### Alerts — `/api/alerts`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/` | `x-api-key` (AI service) | Ingest a Warning/Drowsy event: saves to Mongo, emits `alert:new` to the driver's dashboard via Socket.IO, and — only for `status: "Drowsy"` — sends the FCM push to their phone |
| GET | `/` | JWT | `?range=today\|week\|month\|all` alert history |
| GET | `/stats` | JWT | Today/week/month drowsy counts + daily breakdown for dashboard charts |

### Real-time — Socket.IO
Dashboard connects with `io(URL, { auth: { token: JWT } })`. Server verifies
the JWT, joins the socket to a private `driver:<userId>` room, and the alert
controller emits `alert:new` into that room the moment an alert is ingested
— so the dashboard updates without polling.

## How the pieces connect

```
AI service --POST /api/alerts (x-api-key)--> Backend
                                                 │
                                    ┌────────────┼─────────────┐
                                    ▼            ▼              ▼
                              MongoDB (Alert)  Socket.IO      FCM (Drowsy only)
                                                 │                │
                                                 ▼                ▼
                                          Web Dashboard     Mobile App (alarm+vibrate)
```

## Security checklist (implemented)

- [x] Passwords hashed with bcrypt (12 rounds), never returned in API responses
- [x] JWT auth on all driver-facing routes
- [x] Separate shared-secret auth for the AI service (never shares JWT auth path)
- [x] `helmet()` for standard security headers
- [x] CORS locked to `CLIENT_ORIGIN`
- [x] Rate limiting (global + stricter on auth endpoints)
- [x] `express-validator` on all auth inputs
- [x] Password reset tokens are short-lived signed JWTs + a server-side expiry check

## Next phase

Phase 3: React + TypeScript + Tailwind dashboard — login/register forms,
live status via Socket.IO + the AI service's `/ws/monitor` feed, Recharts
for the daily/weekly/monthly stats this backend already computes.
