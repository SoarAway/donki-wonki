# Mobile App

React Native mobile application for Donki-Wonki.

## Setup

```bash
npm install

# Android
npx react-native run-android
```

## Structure

```
app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App screens
│   ├── services/       # API clients, Firebase
│   ├── models/         # TypeScript interfaces
│   ├── utils/          # Helper functions
│   └── navigation/     # React Navigation setup
├── android/            # Android native code
├── App.tsx             # Root component
└── package.json
```
