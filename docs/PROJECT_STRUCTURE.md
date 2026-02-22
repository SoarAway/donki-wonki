# Project Structure

This repository is a monorepo with a React Native app and a FastAPI backend.

```
donki-wonki/
|
|-- app/                                 # React Native mobile app
|   |-- android/                         # Native Android project
|   |-- src/
|   |   |-- components/                  # Reusable UI building blocks
|   |   |-- config/                      # App configuration constants
|   |   |-- models/                      # Shared client-side models
|   |   |-- navigation/                  # Navigator and route definitions
|   |   |-- screens/                     # Feature screens
|   |   |-- services/                    # API and Firebase service clients
|   |   |-- state/                       # State management
|   |   |-- utils/                       # Utility helpers
|   |-- App.tsx                          # App root component
|   |-- index.js                         # React Native entrypoint
|   |-- package.json
|   `-- tsconfig.json
|
|-- server/                              # FastAPI backend
|   |-- api/
|   |   |-- schemas/                     # Pydantic request/response schemas (for api endpoints)
|   |   `-- v1/                          # Versioned route modules consisting of current api endpoints
|   |-- core/                            # Core infra and app wiring (settings with external services)
|   |-- jobs/                            # Scheduled/background jobs
|   |-- scripts/                         # Helper scripts (currently consisting of social media scraping scripts)
|   |-- services/                        # Business logic layer / ETL layer (layer to process data)
|   |-- utils/                           # Shared backend utilities
|   |-- main.py                          # FastAPI application entrypoint
|   |-- requirements.txt
|   `-- .env.example
|
|-- docs/                                # Documentation
|   |-- APP_GUIDE.md
|   |-- CICD_PIPELINE.md
|   `-- PROJECT_STRUCTURE.md             # This file
|
|-- README.md
|-- package.json
`-- AGENTS.md
```

## Layer Responsibilities

### App (`app/`)
- Frontend implementation in React Native + TypeScript.
- Firebase client SDK integration lives in app services.
- UI/navigation/state live under `app/src/*`.

### Server (`server/`)
- HTTP routing lives in `server/api/v1/*`.
- API contracts live in `server/api/schemas/*`.
- Business logic stays in `server/services/*`.
- Infra/bootstrap belongs in `server/core/*` and `server/main.py`.

## Key Configuration Files

- App Firebase config: `app/android/app/google-services.json`
- Server Firebase admin credentials: `server/firebaseServiceAccountKey.json`
- Server environment template: `server/.env.example`
- Local server secrets: `server/.env` (do not commit)
