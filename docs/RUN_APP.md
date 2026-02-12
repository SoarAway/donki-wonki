# How to Run the Mobile App (Frontend Only)

This guide covers how to run the React Native app on an Android device or emulator without the backend.

## Prerequisites

1.  **Node.js & npm** installed.
2.  **Android SDK** installed (usually via Android Studio).
3.  **Java (JDK)**: You can use the JDK bundled with Android Studio.
4.  **Android Device**: Enable "USB Debugging" in Developer Options.

## Quick Start (Git Bash)

1.  **Terminal 1:** Start the Metro Bundler
    ```bash
    cd app
    npm start
    ```
    *Keep this terminal running.*

2.  **Terminal 2:** Build & Install App
    ```bash
    cd app
    
    # Set JAVA_HOME to Android Studio's bundled JDK (adjust path if needed)
    export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
    
    # Run the build
    npm run android
    ```

3.  **Connecting to Bundler (If Stuck on White Screen)**
    If the app installs but doesn't load:
    ```bash
    # Bridge the port so phone can reach computer
    adb reverse tcp:8081 tcp:8081
    ```
    Then shake the phone and select **Reload**.

---

## Troubleshooting Guide

### 1. `Could not move temporary workspace` (File Lock)
This is a Windows-specific file locking issue with Gradle.
**Fix:**
```bash
# Kill stuck Java processes
taskkill //F //IM java.exe

# Run with single worker to prevent race conditions
cd android
./gradlew clean assembleDebug --no-daemon --no-parallel --max-workers=1
```

### 2. `SDK location not found`
Ensure you have a `local.properties` file in `app/android/` with your SDK path:
```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### 3. `Plugin not found` or Gradle Errors
We use **Gradle 8.13** and specific repositories.
*   Ensure `android/gradle/wrapper/gradle-wrapper.properties` uses `gradle-8.13-bin.zip`.
*   Ensure `android/settings.gradle` includes `google()` and `mavenCentral()` in `pluginManagement`.

### 4. `JAVA_HOME is not set`
Run this before your commands in Git Bash:
```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
```

---

## Permanent Setup (Git Bash)

Add this to your `~/.bashrc` to avoid setting exports every time:

```bash
# Add to ~/.bashrc
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$PATH:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools"
```
Then run `source ~/.bashrc`.
