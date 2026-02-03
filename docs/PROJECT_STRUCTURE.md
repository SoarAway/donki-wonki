# Donki-Wonki Monorepo Structure

## 📁 Project Overview

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
├── 🔧 server/                        # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                 # Cloud Functions entry point
│   │   │
│   │   ├── scrapers/                # Social media monitoring
│   │   │   ├── reddit.ts           # Reddit API integration
│   │   │   └── twitter.ts          # Twitter API (optional)
│   │   │
│   │   ├── ai/                      # AI processing
│   │   │   └── gemini.ts           # Gemini API for text extraction
│   │   │
│   │   ├── alerts/                  # Alert logic
│   │   │   ├── processor.ts        # Main alert processing
│   │   │   └── route-matcher.ts    # Route impact analysis
│   │   │
│   │   └── models/                  # Shared TypeScript interfaces
│   │       ├── Incident.ts
│   │       ├── Station.ts
│   │       ├── User.ts
│   │       └── Alert.ts
│   │
│   ├── lib/                         # Compiled JavaScript (auto-generated)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                         # Environment variables (not in git)
│   └── README.md
│
├── 📊 data/                          # Static data & scripts
│   ├── stations/
│   │   └── all-lines.json          # All ~100 stations data
│   │
│   └── scripts/
│       └── seed-database.ts        # Script to populate Firestore
│
├── 📚 docs/                          # Documentation
│   ├── implementation_plan.md
│   ├── api-design.md
│   └── architecture.md
│
├── .gitignore
├── package.json                     # Root package.json (workspace)
├── PRD.md                           # Product Requirements Document
└── README.md                        # Main README
```

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Firebase)                      │
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
# From root directory
npm run install:all
```

### 2. Setup Backend

```bash
cd server

# Create .env file
echo "GEMINI_API_KEY=your_key" > .env
echo "REDDIT_CLIENT_ID=your_id" >> .env
echo "REDDIT_CLIENT_SECRET=your_secret" >> .env

# Initialize Firebase
firebase login
firebase init
```

### 3. Setup Mobile

```bash
cd app

# Install dependencies (already done if you ran install:all)
npm install

# Run on Android
npx react-native run-android
```

## 📦 Shared Models

Both `app/src/models/` and `server/src/models/` contain the same TypeScript interfaces to ensure type safety across the stack:

- `Station.ts` - Rail station data structure
- `Incident.ts` - Disruption incident data
- `User.ts` - User profile and routes
- `Alert.ts` - Alert notification data

## 🔐 Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REFRESH_TOKEN=your_reddit_refresh_token
```

### Mobile (firebase config)
Configured via `google-services.json` (Android)

## 📝 Next Steps

1. ✅ Project structure created
2. ⏳ Implement backend Cloud Functions
3. ⏳ Create station data file
4. ⏳ Build mobile app UI
5. ⏳ Test end-to-end flow
