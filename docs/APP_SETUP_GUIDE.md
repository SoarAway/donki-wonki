# Donki-Wonki App Guide (React Native)

This is the single guide for working on the mobile app. It combines app architecture basics, local run steps, and troubleshooting.

## 1) What React Native is (for this project)

React Native lets us build the app UI with React while running inside a native Android app container.

In this repo:

- Entry file: `app/index.js`
- Root UI shell: `app/App.tsx`
- Shared Firebase wrapper: `app/src/services/firebase.ts`

## 2) App structure and responsibilities

Current folders under `app/src/`:

- `components/`: reusable UI blocks
- `screens/`: full page-level screens
- `navigation/`: screen-to-screen flow
- `state/`: shared app state
- `models/`: TypeScript data contracts
- `services/`: external system access (Firebase)
- `utils/`: helper functions

Rule of thumb:

- Screen orchestrates page behavior
- Component renders reusable UI
- Service handles external APIs/SDKs
- Utility stays small and pure

## 3) Prerequisites

1. Node.js and npm installed
2. Android Studio with Android SDK
3. Java (JDK), usually Android Studio bundled JDK
4. Android emulator or USB-connected Android device with USB debugging enabled

## 4) Quick start (Git Bash)

### Terminal 1: start Metro

```bash
cd app
npm start
```

Keep this terminal running.

### Terminal 2: build and install Android app

```bash
cd app

# Set JAVA_HOME to Android Studio's bundled JDK (adjust path if needed)
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"

# Build and install
npm run android
```

### If app opens but stays on white screen (Connection Issue)

1.  Run this command to bridge the port:
    ```bash
    adb reverse tcp:8081 tcp:8081
    ```
2.  Shake your phone (or press `R` twice in Metro terminal) and select **Reload**.

## 5) Local development commands

From `app/`:

```bash
npm install
npm start
npm run android
npm run lint
npm test
```

## 6) Suggested implementation order (from current baseline)

1. Define data models in `models/`
2. Build navigation skeleton in `navigation/`
3. Add screen shells in `screens/`
4. Build reusable UI in `components/`
5. Add shared state in `state/`
6. Wire reads/writes through `services/firebase.ts`

## 7) Common mistakes to avoid

- Putting most logic inside `App.tsx`
- Mixing UI, API calls, and navigation in one large component
- Duplicating model definitions across files
- Importing Firebase SDK directly from many screens instead of `services/firebase.ts`

## 8) Troubleshooting

### `Could not move temporary workspace` (Windows file lock)
This is a Windows-specific file locking issue with Gradle.

```bash
# Kill stuck Java processes
taskkill //F //IM java.exe

# Rebuild with single worker
cd android
./gradlew clean assembleDebug --no-daemon --no-parallel --max-workers=1
```

### `SDK location not found`

Ensure `app/android/local.properties` exists:

```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### `Plugin not found` or Gradle Errors

- Ensure `android/gradle/wrapper/gradle-wrapper.properties` uses `gradle-8.13-bin.zip`
- Ensure `android/settings.gradle` includes `google()` and `mavenCentral()` in `pluginManagement`

### `JAVA_HOME is not set`

Run this before your commands in Git Bash:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
```

## 9) Optional permanent shell setup (Git Bash)

Add to `~/.bashrc`:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$PATH:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools"
```

Then run:

```bash
source ~/.bashrc
```
