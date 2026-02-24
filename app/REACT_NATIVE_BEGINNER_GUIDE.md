# React Native Beginner Guide (Donki-Wonki)

This guide explains React Native in plain terms for someone starting from zero.

## 1) What React Native is

React Native lets you build mobile apps using JavaScript/TypeScript and React.

- You write UI with React components.
- The app runs on a real Android/iOS app container.
- UI is rendered as native views (not a browser page).

Think of it as:

1. React for app logic and screen updates
2. Native mobile runtime for actual app behavior

## 2) How a React Native app runs

At a high level:

1. App starts from `index.js`
2. `index.js` registers `App.tsx` as the root
3. `App.tsx` renders your first screen / navigator
4. User actions trigger state updates
5. React re-renders changed parts of the UI

In this repo:

- Entry: `app/index.js`
- Root UI: `app/App.tsx`
- Current architecture folders (placeholders):
  - `app/src/components`
  - `app/src/models`
  - `app/src/navigation`
  - `app/src/screens`
  - `app/src/state`
  - `app/src/utils`

## 3) Typical folder responsibilities

- `screens/`: full pages (Home, Settings, Onboarding)
- `components/`: reusable UI blocks (cards, buttons, inputs)
- `navigation/`: screen-to-screen flow
- `state/`: app state (Context/Redux/Zustand/etc.)
- `models/`: TypeScript data shapes
- `utils/`: pure helper functions (time, distance, formatters)

Rule of thumb:

- Screen = page orchestration
- Component = reusable UI piece
- Utility = no UI, no side effects if possible

## 4) Navigation: how it should be structured

For most apps, use `react-navigation` with two levels:

1. Root Stack (auth/onboarding/main app)
2. Main Tab or Stack (Home, Route, Settings)

Example idea:

- `Onboarding` (first run)
- `MainTabs`
  - `Home`
  - `RouteSetup`
  - `Settings`

Recommended flow:

1. Keep route names centralized in `navigation/`
2. Keep navigation logic in screens, not in small dumb components
3. Do not mix data fetching + complex nav + large UI in one file

## 5) Components: how to think about them

Start by splitting UI into:

- Container screens (load data, handle actions)
- Presentational components (receive props, render UI)

Good component traits:

- Small and focused
- Reusable in multiple screens
- Gets data via props
- Avoids direct global state access unless necessary

## 6) State layer: beginner approach

Use this progression:

1. Local state with `useState` for simple screen-only values
2. Context + reducer for shared app state
3. Optional later: dedicated library when scale grows

For this project, a practical split is:

- `state/` handles user profile, current route, incidents, alerts
- `services/` handles Firebase reads/writes
- `screens/` trigger actions, display results

## 7) Services and Firebase imports

Keep Firebase imports centralized in one place:

- `app/src/services/firebase.ts`

Then import from there in other files.

Example:

```ts
import {auth, firestore, messaging} from '../services/firebase';
```

This avoids duplicated setup and keeps migration easier later.

## 8) Suggested first implementation order

If you are building from this current baseline:

1. Add domain models in `models/`
2. Add navigation skeleton in `navigation/`
3. Create screen shells in `screens/`
4. Build reusable cards/forms in `components/`
5. Add state provider in `state/`
6. Connect to Firebase via `services/firebase.ts`

## 9) Common beginner mistakes to avoid

- Putting everything in `App.tsx`
- Hardcoding data in many files
- Mixing UI, API calls, and navigation in one giant component
- Creating duplicate model types in multiple places
- Importing Firebase directly from many screens

## 10) Local workflow commands

From `app/`:

```bash
npm install
npm start
npm run android
npm run lint
npm test
```

## 11) Quick mental model

- `App.tsx` = app shell
- `navigation/` = where user can go
- `screens/` = what user sees per page
- `components/` = reusable UI pieces
- `state/` = shared app memory
- `services/` = external systems (Firebase)
- `models/` = data contracts
- `utils/` = small pure helpers

If you keep these boundaries clean, React Native projects stay easy to grow and debug.
