# Mobile App (Android MVP)

This app is a bare React Native project for the Donki-Wonki Android MVP.

## Prerequisites

- Node.js 20+
- Android Studio with Android SDK
- One Android emulator or USB-connected Android device

## Setup

```bash
npm install
```

### Firebase (Required)

1. Download `google-services.json` from Firebase Console.
2. Place it at `android/app/google-services.json`.

## Run (Android)

Terminal 1:

```bash
npm start
```

Terminal 2:

```bash
npm run android
```

## Current Scope

- Android only for MVP
- Firestore/Auth/FCM client integration via `@react-native-firebase/*`
