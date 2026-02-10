# Donki-Wonki Monorepo Structure

## 📁 Project Overview

Note: The tree below is the target structure for implementation. Some modules are planned and may not exist yet in the current repository state.

```
donki-wonki/                          # Root monorepo
│
├── 📱 app/                           # React Native Mobile App
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── StationPicker.tsx
│   │   │   ├── LocationInput.tsx
│   │   │   ├── IncidentCard.tsx
│   │   │   └── RouteStatusCard.tsx
│   │   │
│   │   ├── screens/                 # App screens
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── RouteSetupScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   │
│   │   ├── services/                # API & Firebase clients
│   │   │   ├── firebase.ts
│   │   │   ├── firestore.ts
│   │   │   └── notifications.ts
│   │   │
│   │   ├── models/                  # TypeScript interfaces
│   │   │   ├── Station.ts
│   │   │   ├── Incident.ts
│   │   │   ├── User.ts
│   │   │   └── Alert.ts
│   │   │
│   │   ├── utils/                   # Helper functions
│   │   │   ├── distance.ts
│   │   │   └── time.ts
│   │   │
│   │   └── navigation/              # React Navigation
│   │       └── AppNavigator.tsx
│   │
│   ├── android/                     # Android native code
│   ├── App.tsx                      # Root component
│   ├── package.json
│   └── README.md
│
├── 🔧 server/                        # FastAPI backend (Python)
│   ├── main.py                      # FastAPI entry point
│   ├── config/
│   │   ├── settings.py              # Environment variable loading
│   │   └── firebase.py              # Firebase Admin initialization
│   ├── models/
│   │   ├── station.py
│   │   ├── incident.py
│   │   ├── user.py
│   │   └── alert.py
│   ├── services/
│   │   ├── reddit_scraper.py
│   │   ├── gemini_ai.py
│   │   ├── route_matcher.py
│   │   └── alert_service.py
│   ├── jobs/
│   │   └── monitor_social.py        # APScheduler jobs
│   ├── requirements.txt
│   ├── .env                         # Environment variables (not in git)
│   └── README.md
│
├── 📊 data/                          # Static data & scripts
│   ├── stations/
│   │   └── all-lines.json          # All ~100 stations data
│   │
│   └── scripts/
│       └── seed_firestore.py       # Script to populate Firestore
│
├── 📚 docs/                          # Documentation
│   ├── PROJECT_STRUCTURE.md
│   ├── PRD.md
│   ├── IMPLEMENTATION_GUIDE.md
│   └── CICD_PIPELINE.md
│
├── .gitignore
├── PRD.md                           # Product Requirements Document (optional root copy)
└── README.md                        # Main README
```

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                       │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Reddit     │      │   Twitter    │                   │
│  │   Scraper    │      │   Scraper    │                   │
│  └──────┬───────┘      └──────┬───────┘                   │
│         │                     │                            │
│         └──────────┬──────────┘                            │
│                    │                                       │
│                    ▼                                       │
│         ┌──────────────────────┐                          │
│         │   Gemini AI          │                          │
│         │   (Text Extraction)  │                          │
│         └──────────┬───────────┘                          │
│                    │                                       │
│                    ▼                                       │
│         ┌──────────────────────┐                          │
│         │   Incident Storage   │                          │
│         │   (Firestore)        │                          │
│         └──────────┬───────────┘                          │
│                    │                                       │
│                    ▼                                       │
│         ┌──────────────────────┐                          │
│         │   Route Matcher      │                          │
│         │   (Impact Analysis)  │                          │
│         └──────────┬───────────┘                          │
│                    │                                       │
│                    ▼                                       │
│         ┌──────────────────────┐                          │
│         │   Alert Generator    │                          │
│         └──────────┬───────────┘                          │
│                    │                                       │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Push Notification  │
          │   (FCM)              │
          └──────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  MOBILE APP (React Native)                  │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Onboarding  │──────▶│  Home Screen │                   │
│  │  (Setup)     │      │  (Dashboard) │                   │
│  └──────────────┘      └──────┬───────┘                   │
│                               │                            │
│                               ▼                            │
│                    ┌──────────────────┐                   │
│                    │  Incident List   │                   │
│                    │  (Real-time)     │                   │
│                    └──────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Backend dependencies
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Mobile dependencies
cd ..\app
npm install
```

### 2. Setup Backend

```bash
cd server

# Create .env from template and fill credentials
copy .env.example .env

# Run API
uvicorn main:app --reload
```

### 3. Setup Mobile

```bash
cd app

# Install dependencies
npm install

# Run on Android
npx react-native run-android
```

## 📦 Shared Data Contract

The app and backend share one domain contract, implemented in two languages:

- `app/src/models/*.ts` - TypeScript app models
- `server/models/*.py` - Python backend models

Keep fields aligned across both sides (`Station`, `Incident`, `User`, `Alert`).

## 🔐 Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REFRESH_TOKEN=your_reddit_refresh_token
```

### Mobile (firebase config)
Configured via `google-services.json` (Android)

## 📝 Next Steps

1. ✅ Baseline project folders created
2. ⏳ Implement backend FastAPI services
3. ⏳ Create station data file
4. ⏳ Build mobile app UI
5. ⏳ Test end-to-end flow
