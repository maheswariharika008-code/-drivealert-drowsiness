# Frontend Dashboard (Phase 3)

React 19 + TypeScript + Tailwind. Cockpit/instrument-cluster themed dashboard
for the driver — live camera feed, real-time fatigue gauge, session control,
alert history, and charts.

## Verified in this session

- `npx tsc --noEmit` → **0 type errors** (including fixing every
  `verbatimModuleSyntax` type-import violation, not just suppressing the check)
- `npm run build` → **clean production build** (705 modules, dist output
  generated — the "chunk > 500kB" note is just Recharts' bundle size, not an error)
- Dev server boots and serves the real `index.html` with fonts wired up

Not verified here (needs the running backend + AI service, which this
sandbox can't reach): live Socket.IO round-trip, the AI service WebSocket
feed rendering actual frames, and FCM-triggered UI state. Structurally
wired and ready to test once Phases 1–2 are running.

## Design direction

Chose a cockpit/instrument-cluster aesthetic over a generic SaaS dashboard
look, since this is a safety tool a driver glances at, not a data app they
study: dark charcoal background (`#0A0E13`), glassmorphic panels, JetBrains
Mono for live telemetry (EAR/MAR/fatigue score) so numbers read like
instrument readouts, Sora for display type. The signature element is the
**Vigilance Gauge** — a radial arc around the fatigue score that sweeps and
shifts color teal → amber → red, read at a glance like a speedometer.

## Folder structure

```
frontend/
├── src/
│   ├── api/            # axios client (JWT interceptor), authApi, alertApi
│   ├── components/       # Navbar, ProtectedRoute, VigilanceGauge (signature),
│   │                      # LiveFeed, StatCard, SessionTimer, DrowsyPopup,
│   │                      # RecentAlertsTable, ChartsPanel
│   ├── context/          # AuthContext (JWT + driver profile)
│   ├── hooks/            # useAiMonitor (AI service WebSocket),
│   │                      # useAlertSocket (backend Socket.IO),
│   │                      # useAlarmSound (Web Audio synthesized alarm)
│   ├── pages/             # Login, Register, Forgot/ResetPassword, Dashboard,
│   │                       # Profile, SessionHistory
│   ├── types/              # Shared TS types matching backend API contracts
│   ├── App.tsx               # Router
│   └── main.tsx
├── tailwind.config.js
├── package.json
└── .env.example
```

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # point at your running backend + AI service
npm run dev
```

Opens on `http://localhost:5173`.

## How the dashboard gets its live data

Two independent real-time channels, both connected only while a session is active:

1. **AI service WebSocket** (`useAiMonitor` → `ws://<ai-service>/ws/monitor`)
   — the fast path. Streams the annotated camera frame + full metrics
   (EAR, MAR, head pose, fatigue score, status) at ~15fps directly from the
   Python service. This is what powers the Vigilance Gauge, live feed, and
   the alarm sound — no backend round-trip in the loop, so the alarm fires
   as fast as the camera detects it.

2. **Backend Socket.IO** (`useAlertSocket` → `<backend>` with JWT auth)
   — the persisted path. Fires `alert:new` only when the AI service has
   POSTed an alert to the backend (i.e. it's been saved to MongoDB and, for
   `Drowsy`, already triggered the FCM push). This feeds the Recent Alerts
   table and stats so the history matches exactly what's in the database.

The full-screen "Wake Up!" popup and the alarm both key off the AI
service's live `status` field, not the backend event, for the fastest
possible response to real drowsiness.

## Next phase

Phase 4: React Native mobile app — FCM listener, full-screen alarm +
vibration on push, alert history, profile.
