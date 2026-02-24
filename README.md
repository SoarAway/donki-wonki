# Donki-Wonki

Predictive rail disruption alerts for Klang Valley commuters.

Donki-Wonki helps people decide **before leaving home** whether their usual route is likely to be disrupted, delayed, or crowded.

## Why this exists

Most transit apps are reactive: they tell you about problems after they happen and often after you are already on your way.

Donki-Wonki is built to be proactive:
- detect incident signals early,
- interpret impact on commuter routes,
- notify affected users with clear actions.

## What users get

- Early warning notifications for potential rail incidents
- Route-aware alerts (not generic city-wide noise)
- Quick visibility of app/backend health during startup
- Foreground and background push notification handling on Android

## How it works (high-level)

1. Incident signals are collected (MVP focus: Reddit).
2. AI extraction converts posts/comments into structured incident details.
3. Route impact logic checks which commuters are likely affected.
4. Alerts are sent via Firebase Cloud Messaging (FCM).
5. The React Native app receives and displays notifications.

## Current implementation snapshot

This repository is a monorepo with active app work and partially implemented backend runtime.

- **Mobile app (`app/`)**: actively implemented.
  - React Native 0.83 + TypeScript
  - Firebase messaging integration (foreground + background)
  - API client with server wake-up handling for cold starts
  - UI component system (atoms/molecules + design tokens)
  - Login/registration screens in progress

- **Backend (`server/`)**: scaffolded in this current checkout.
  - Package boundaries and dependency/env contracts are present
  - Full target architecture is documented
  - Dedicated backend branch (`server`) includes partial FastAPI runtime (`/`, `/health`, `/test-alert`) and Firebase alert sending utilities

In short: the product direction is clear and app-side execution is active; backend runtime exists partially on the server branch and is still being expanded.

## Architecture overview

```text
Mobile App (React Native)
  -> Firebase Auth / Firestore / FCM client integration
  -> Calls backend health + token APIs
  -> Displays banner + system notifications

Backend (FastAPI target)
  -> Ingestion (Reddit)
  -> AI incident extraction
  -> Route impact matching
  -> Alert dispatch (FCM)
```

## Repository structure

```text
donki-wonki/
|- app/                      # React Native Android app
|  |- App.tsx                # Root startup flow (health, wake-up, FCM)
|  |- index.js               # AppRegistry + background FCM handler
|  `- src/
|     |- services/           # firebase + api client/endpoints/types
|     |- components/         # atoms, molecules, design tokens
|     |- screens/            # app screens (including auth)
|     `- navigation/state/models/utils/
|- server/                   # Python backend scaffold in this checkout
|  |- requirements.txt
|  |- .env.example
|  |- config/models/services/jobs/utils/  # package boundaries
|  `- README.md              # target backend architecture
|- docs/                     # PRD, implementation guide, structure, run docs
|- package.json              # npm workspace root
`- AGENTS.md                 # engineering conventions for contributors/agents
```

## Tech stack

- **Mobile**: React Native 0.83, TypeScript, `@react-native-firebase/*`, Notifee
- **Backend target**: FastAPI, Firebase Admin SDK, PRAW, Gemini API, APScheduler
- **Infra**: Firebase (Auth, Firestore, FCM), Render-style cold-start aware client behavior

## Quick start

### Root workspace

```bash
npm run install:all
npm run app
npm run server
```

### App (Android)

```bash
cd app
npm start
npm run android
```

### Server

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Roadmap direction

- Expand backend runtime from scaffold to full ingestion -> extraction -> matching -> alert pipeline
- Complete end-to-end route personalization and incident relevance ranking
- Improve operator/maintainer observability for incident and alert quality

## Documentation

- Product requirements: `docs/PRD.md`
- Implementation details: `docs/IMPLEMENTATION_GUIDE.md`
- Project map: `docs/PROJECT_STRUCTURE.md`
- Android run guide: `docs/RUN_APP.md`
