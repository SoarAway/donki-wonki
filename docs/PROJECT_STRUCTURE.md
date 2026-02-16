# 🏗️ Project Structure

The repository is a monorepo containing both the React Native mobile app and the Python FastAPI backend.

```
donki-wonki/
│
├── app/                          # React Native Mobile App
│   ├── android/                  # Native Android Code
│   │   └── app/src/main/java/com/donkiwonki/ontheway/  # Main Kotlin Sources
│   ├── src/                      # TypeScript Source Code
│   │   ├── components/           # Reusable UI Components
│   │   │   └── atoms/            # Basic building blocks (Buttons, Inputs)
│   │   ├── models/               # Data Models (Shared Contract)
│   │   ├── navigation/           # Navigation Configuration (Stack/Tabs)
│   │   ├── screens/              # Full Screen Components
│   │   ├── services/             # API & External Services
│   │   │   └── firebase.ts       # Firebase Integration
│   │   ├── state/                # Global State Management
│   │   └── utils/                # Helper Functions
│   ├── App.tsx                   # Main Application Component
│   ├── index.js                  # App Registry Entry
│   └── package.json              # NPM Dependencies
│
├── server/                       # Python FastAPI Backend
│   ├── config/                   # Configuration & Settings
│   ├── jobs/                     # Scheduled Background Jobs
│   ├── models/                   # Pydantic Data Models
│   ├── services/                 # Business Logic Services
│   ├── utils/                    # Utility Functions
│   ├── requirements.txt          # Python Dependencies
│   └── .env                      # Environment Variables
│
└── docs/                         # Documentation
    ├── APP_GUIDE.md              # Mobile App Guide (Run & Troubleshoot)
    └── PROJECT_STRUCTURE.md      # This File
```

## � Service Responsibilities

### Mobile (`app/`)
- **Frontend Logic**: React Native with TypeScript.
- **State Management**: React Context or local state.
- **Firebase**: Handles user authentication and FCM notifications directly on part of the client.
- **API Communication**: Calls the `server/` endpoints for business logic.

### Backend (`server/`)
- **API Framework**: FastAPI (Python).
- **Database**: Connects to database (TBD).
- **Integrations**: Reddit API, Gemini AI.
- **Notifications**: Triggers FCM notifications to mobile devices via Firebase Admin SDK.

## 🔐 Key Configuration Files

- **Mobile**: `app/android/app/google-services.json` (Firebase Config for Android)
- **Backend**: `server/firebaseServiceAccountKey.json` (Firebase Admin Config)
- **Environment**: `server/.env` (API Keys & Secrets)
