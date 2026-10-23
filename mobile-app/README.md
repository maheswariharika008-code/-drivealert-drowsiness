# Mobile App (Phase 4)

React Native (Expo) app. Driver login, FCM push notifications, full-screen
alarm on drowsiness detection, alert history, profile.

## Verified in this session

- `npx tsc --noEmit` → **0 type errors**
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` → **0 issues**
  (no dead imports/params anywhere)
- `npm install` → all Expo/React Native/navigation/audio packages resolve
  and install cleanly together (933 packages, no dependency conflicts)

Not verified here (needs a physical device / Expo Go / EAS build, which
this sandbox can't run): actual push delivery, audio/vibration on a real
device, and the `expo-notifications` native module behavior. The
`assets/icon.png`, `notification-icon.png`, and `alarm.wav` are placeholder
empty files — **replace these with real assets before building** (see
below).

## Why Expo instead of bare React Native

Your spec asked for React Native specifically, and this *is* React Native —
Expo is the standard tooling layer on top of it (used by a large share of
production RN apps). It gets you FCM-ready push notifications, background
audio, and vibration with a fraction of the native-config work bare RN
needs, without giving up anything the spec asked for. If you'd rather eject
to bare RN later, `expo prebuild` generates the native `ios/`/`android`
projects at any time.

## Folder structure

```
mobile-app/
├── App.tsx                    # Root: auth gate, nav container, alert overlay
├── app.json                    # Expo config — permissions, notification channel, FCM
├── src/
│   ├── api/                     # axios client (SecureStore token), authApi, alertApi
│   ├── context/                  # AuthContext, AlertContext (drives the alarm)
│   ├── navigation/                # Bottom tab navigator
│   ├── screens/                    # Login, Home, History, Profile, AlertOverlay
│   ├── services/                    # notifications.ts (FCM), alarmService.ts (sound+vibrate)
│   └── theme.ts                      # Colors matching the web dashboard's cockpit palette
└── package.json
```

## Setup

```bash
cd mobile-app
npm install
npx expo install   # aligns native module versions with your Expo SDK
```

1. **Firebase**: download `google-services.json` from your Firebase project
   (Android) and place it at `mobile-app/google-services.json` (already
   referenced in `app.json`). For iOS you'll additionally need
   `GoogleService-Info.plist` and the `@react-native-firebase` config if you
   go past Expo's managed push service.
2. **Backend URL**: edit `app.json` → `expo.extra.backendUrl` to your
   backend's LAN IP (dev) or deployed URL (prod). See `.env.example` for notes.
3. **Real assets**: replace the placeholder files in `assets/` —
   `icon.png` (1024×1024), `notification-icon.png` (96×96, white-on-transparent
   for Android status bar), and `alarm.wav` (a loud, unmistakable alarm tone,
   a few seconds long — it will loop).
4. Run on a **physical device** (push notifications don't work in most
   simulators): `npx expo start`, then scan the QR code with Expo Go, or
   build a dev client with `eas build --profile development`.

## How the alarm actually fires

```
Backend (Drowsy alert) --FCM push--> Device OS
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    ▼ App foregrounded     ▼ App backgrounded/locked
        notifications.ts listener    OS notification channel itself
        fires → AlertContext sets    (configured in app.json + 
        activeAlert → AlertOverlay   notifications.ts with sound:
        (full-screen modal) shows +  "alarm.wav", priority: MAX,
        alarmService plays looping   bypassDnd: true) plays the sound
        sound + vibration pattern    and vibrates at the OS level —
                                      this is what actually wakes a
                                      driver whose phone is locked
```

Two layers are intentional: the in-app overlay is the richer, dismissible
experience when the app is open; the OS-level channel is the reliable
fallback that works even if the app was killed, which is the realistic
case for a phone in a cup holder.

## Screens

- **Login** — email/password against the same backend as the web dashboard
- **Home** — confirms push registration status, shows driver + vehicle
- **History** — last 7 days of alerts (pull to refresh)
- **Profile** — driver details + logout
- **AlertOverlay** — the full-screen "Wake Up! You appear to be sleepy."
  modal, rendered at the app root so it can appear over any tab

## Security

- JWT stored in `expo-secure-store` (Keychain/Keystore-backed), not
  AsyncStorage — never plaintext on disk
- Same backend auth contract as the web dashboard (`/api/auth/login`,
  `/api/auth/device-token`)

## This completes the four planned phases

1. ✅ AI Service (Python/OpenCV/MediaPipe)
2. ✅ Backend (Node/Express/MongoDB/Socket.IO/FCM)
3. ✅ Web Dashboard (React/TypeScript/Tailwind)
4. ✅ Mobile App (React Native/Expo)

Remaining from your original spec that we haven't built: PDF reports,
deployment configs (Vercel/Render/Railway), and the bonus features (night
mode, emotion detection, voice warnings). Happy to pick any of those up
next if you want to keep going.
