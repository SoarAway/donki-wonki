# Implementation Plan: Donki-Wonki App & Server

## Overview

This document outlines the step-by-step implementation plan for both the **mobile app** (`/app`) and **backend server** (`/server`).

---

## 🎯 Implementation Strategy

We'll use a **phased approach** that allows for incremental testing:

1. **Phase 1**: Foundation & Data Models
2. **Phase 2**: Backend Core (AI + Scrapers)
3. **Phase 3**: Mobile App UI
4. **Phase 4**: Integration & Testing

---

## Phase 1: Foundation & Data Models

### 📊 Data Layer (Shared)

Both app and server need the same TypeScript interfaces.

#### Tasks:

**1.1 Create Shared Models** ⏱️ 30 mins

Create these files in **both** `/app/src/models/` and `/server/src/models/`:

- [ ] `Station.ts` - Station data structure
- [ ] `Incident.ts` - Incident/disruption data
- [ ] `User.ts` - User profile and routes
- [ ] `Alert.ts` - Alert notification data
- [ ] `RailLine.ts` - Rail line types enum

**1.2 Create Station Data** ⏱️ 2 hours

- [ ] `/data/stations/all-lines.json` - All ~100 stations with coordinates
  - Use existing datasets: MyRapid, OpenStreetMap, Wikipedia
  - Include: station ID, name, code, coordinates, line, connections
  - Define interchange stations

**1.3 Database Seed Script** ⏱️ 1 hour

- [ ] `/data/scripts/seed-database.ts` - Script to populate Firestore with station data
- [ ] Test script with Firebase emulator

---

## Phase 2: Backend Server (`/server`)

### 🔧 Server Implementation Order

#### 2.1 Firebase Setup ⏱️ 30 mins

- [ ] Initialize Firebase project (`firebase init`)
- [ ] Configure Firestore database
- [ ] Set up environment variables (`.env`)
- [ ] Configure Cloud Functions

#### 2.2 Core Models & Utils ⏱️ 1 hour

**Files to create:**

```
server/src/
├── models/           # Copy from Phase 1
├── utils/
│   ├── logger.ts     # Logging utility
│   └── helpers.ts    # Common helper functions
└── config/
    └── firebase.ts   # Firebase admin initialization
```

- [ ] Set up Firebase Admin SDK
- [ ] Create logging utility
- [ ] Create helper functions (ID generation, time parsing, etc.)

#### 2.3 Reddit Scraper ⏱️ 2 hours

**File:** `/server/src/scrapers/reddit.ts`

**Functions:**
- [ ] `monitorReddit()` - Fetch recent posts from r/malaysia, r/kualalumpur
- [ ] `getPostWithComments()` - Fetch post + top 5 comments
- [ ] Keyword filtering (lrt, mrt, monorail, ktm, rosak, delay, etc.)
- [ ] Return structured Post[] array

**Dependencies:**
```bash
cd server
npm install snoowrap
```

**Environment variables needed:**
```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=
```

#### 2.4 Gemini AI Integration ⏱️ 2 hours

**File:** `/server/src/ai/gemini.ts`

**Functions:**
- [ ] `extractIncidentFromText(text: string)` - Main extraction function
- [ ] Parse Gemini JSON response
- [ ] Handle errors gracefully
- [ ] Return `Incident | null`

**Prompt engineering:**
- Extract: line, station, type, severity, confidence
- Handle ambiguous posts using comments
- Support all 8 rail lines

**Dependencies:**
```bash
npm install @google/generative-ai
```

**Environment variables:**
```
GEMINI_API_KEY=
```

#### 2.5 Route Matcher ⏱️ 3 hours

**File:** `/server/src/alerts/route-matcher.ts`

**Class:** `RouteMatcher`

**Methods:**
- [ ] `isRouteAffected(incident, route)` - Check if incident affects user route
- [ ] `getStationsBetween(origin, destination)` - BFS graph traversal
- [ ] Handle line-wide incidents
- [ ] Handle station-specific incidents
- [ ] Support cross-line routes (interchanges)

**Logic:**
- Load station graph from Firestore
- Traverse graph to find all stations on route
- Check if incident station is on route
- Return `{ affected: boolean, reason?: string }`

#### 2.6 Alert Processor ⏱️ 3 hours

**File:** `/server/src/alerts/processor.ts`

**Functions:**
- [ ] `processIncident(incident, source)` - Main processing function
- [ ] `findAffectedUsers(incident)` - Find users whose routes are affected
- [ ] `generateAlert(incident, user)` - Create alert object
- [ ] `shouldSendAlert(alert, user)` - Check quiet hours, severity, time window
- [ ] `sendPushNotification(userId, alert)` - Send FCM notification

**Logic:**
- Time-window check: only alert if commute is within X minutes
- Quiet hours check
- Severity threshold check
- Confidence threshold (60%+)

#### 2.7 Cloud Functions Entry Point ⏱️ 1 hour

**File:** `/server/src/index.ts`

**Functions to export:**
- [ ] `monitorSocialMedia` - Scheduled function (every 30 mins)
  - Calls Reddit scraper
  - Processes each post through Gemini
  - Saves incidents to Firestore
  - Triggers alert processor
- [ ] `reportIncident` - HTTP callable function (for future community reports)

**Scheduler:**
```typescript
export const monitorSocialMedia = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(async (context) => {
    // Implementation
  });
```

#### 2.8 Testing ⏱️ 2 hours

- [ ] Unit tests for route matcher
- [ ] Test Gemini extraction with sample posts
- [ ] Test alert logic with mock data
- [ ] Run Firebase emulators locally
- [ ] Test end-to-end flow

---

## Phase 3: Mobile App (`/app`)

### 📱 App Implementation Order

#### 3.1 React Native Setup ⏱️ 1 hour

- [ ] Initialize React Native project (if not done)
- [ ] Install dependencies
- [ ] Configure Firebase SDK
- [ ] Set up React Navigation
- [ ] Configure Android build settings

**Dependencies:**
```bash
cd app
npm install @react-navigation/native @react-navigation/stack
npm install @react-native-firebase/app @react-native-firebase/auth
npm install @react-native-firebase/firestore @react-native-firebase/messaging
npm install react-native-geolocation-service
```

#### 3.2 Firebase Configuration ⏱️ 30 mins

**Files:**
- [ ] `/app/src/services/firebase.ts` - Firebase initialization
- [ ] `/app/src/services/firestore.ts` - Firestore helper functions
- [ ] `/app/src/services/notifications.ts` - FCM setup

**Setup:**
- [ ] Download `google-services.json` from Firebase Console
- [ ] Place in `/app/android/app/`
- [ ] Configure AndroidManifest.xml for notifications

#### 3.3 Utility Functions ⏱️ 1 hour

**Files:**
- [ ] `/app/src/utils/distance.ts` - Haversine distance calculation
- [ ] `/app/src/utils/time.ts` - Time parsing and formatting
- [ ] `/app/src/utils/station-finder.ts` - Find nearest station logic

**Functions:**
- `calculateDistance(coord1, coord2)` - Haversine formula
- `findNearestStation(coords, stations)` - Find closest station
- `parseTime(timeStr)` - Parse "HH:MM" to Date
- `formatTime(date)` - Format Date to "HH:MM"

#### 3.4 Reusable Components ⏱️ 3 hours

**Files to create:**

```
app/src/components/
├── StationPicker.tsx      # Dropdown to select station
├── LocationInput.tsx      # Manual location entry + geolocation
├── TimePicker.tsx         # Time selection for arrival
├── IncidentCard.tsx       # Display incident info
├── RouteStatusCard.tsx    # Show route status (good/delayed)
└── AlertItem.tsx          # Alert history item
```

**Each component:**
- [ ] TypeScript interfaces for props
- [ ] Clean, responsive UI
- [ ] Proper error handling
- [ ] Loading states

#### 3.5 Navigation Setup ⏱️ 1 hour

**File:** `/app/src/navigation/AppNavigator.tsx`

**Screens:**
- Onboarding (first-time setup)
- Home (dashboard)
- Route Setup (add/edit routes)
- Settings (preferences, quiet hours)

**Stack:**
```typescript
const Stack = createStackNavigator();

<Stack.Navigator>
  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="RouteSetup" component={RouteSetupScreen} />
  <Stack.Screen name="Settings" component={SettingsScreen} />
</Stack.Navigator>
```

#### 3.6 Onboarding Screen ⏱️ 3 hours

**File:** `/app/src/screens/OnboardingScreen.tsx`

**Flow:**
1. Welcome message
2. Location input for home
3. Find nearest station (show on map/list)
4. Confirm home station
5. Location input for work
6. Find nearest work station
7. Confirm work station
8. Select arrival time
9. Select commute days (Mon-Fri default)
10. Save route → Navigate to Home

**Features:**
- [ ] Manual address entry
- [ ] "Use current location" button
- [ ] Display nearest station with distance
- [ ] Allow manual station override
- [ ] Validate inputs
- [ ] Save to Firestore

#### 3.7 Home Screen (Dashboard) ⏱️ 4 hours

**File:** `/app/src/screens/HomeScreen.tsx`

**Sections:**
1. **Route Status Card**
   - Show user's route (Home → Work)
   - Status: "All Clear" or "Disruption Detected"
   - Next commute time
   
2. **Active Incidents**
   - Real-time list from Firestore
   - Filter by relevant lines
   - Show: line, station, type, severity, time
   
3. **Recent Alerts**
   - Alert history for user
   - Mark as read/helpful

**Real-time listeners:**
```typescript
useEffect(() => {
  const unsubscribe = firestore()
    .collection('incidents')
    .where('resolvedAt', '==', null)
    .onSnapshot(snapshot => {
      // Update incidents
    });
  
  return unsubscribe;
}, []);
```

#### 3.8 Route Setup Screen ⏱️ 2 hours

**File:** `/app/src/screens/RouteSetupScreen.tsx`

**Features:**
- [ ] Add new route
- [ ] Edit existing route
- [ ] Delete route
- [ ] Toggle route active/inactive
- [ ] Set alert window (default 60 mins)

#### 3.9 Settings Screen ⏱️ 2 hours

**File:** `/app/src/screens/SettingsScreen.tsx`

**Settings:**
- [ ] Quiet hours (start/end time)
- [ ] Minimum severity for alerts
- [ ] Enable/disable notifications
- [ ] Account management
- [ ] About/version info

#### 3.10 Push Notifications ⏱️ 2 hours

**Setup:**
- [ ] Request notification permissions
- [ ] Save FCM token to Firestore (user document)
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Handle notification tap (navigate to incident)

**File:** `/app/src/services/notifications.ts`

```typescript
export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  // Save token
}

export function setupNotificationListeners() {
  // Foreground handler
  messaging().onMessage(async remoteMessage => {
    // Show in-app notification
  });
  
  // Background handler
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // Handle background notification
  });
}
```

---

## Phase 4: Integration & Testing

### 🔗 End-to-End Integration ⏱️ 4 hours

#### 4.1 Backend Testing

- [ ] Deploy Cloud Functions to Firebase
- [ ] Manually trigger `monitorSocialMedia` function
- [ ] Verify Reddit scraping works
- [ ] Verify Gemini extraction works
- [ ] Check Firestore for incidents
- [ ] Verify alerts are generated
- [ ] Test FCM notifications

#### 4.2 Mobile App Testing

- [ ] Test onboarding flow
- [ ] Test route creation
- [ ] Test real-time incident display
- [ ] Test push notifications
- [ ] Test settings changes
- [ ] Test edge cases (no internet, etc.)

#### 4.3 Integration Testing

**Test Scenarios:**

1. **Happy Path:**
   - User sets up route: Subang Jaya → KLCC
   - Backend detects incident at Pasar Seni (on route)
   - User receives alert within commute window
   - Alert shows in app

2. **Time Window:**
   - User commutes at 9 AM
   - Incident detected at 7 AM (2 hours before)
   - User should receive alert
   - Incident detected at 11 AM (2 hours after)
   - User should NOT receive alert

3. **Quiet Hours:**
   - User sets quiet hours: 10 PM - 7 AM
   - Incident detected at 11 PM
   - User should NOT receive alert

4. **Cross-Line Route:**
   - User route: KJ Line → MRT Kajang (via interchange)
   - Incident on KJ Line
   - User should receive alert
   - Incident on MRT Kajang
   - User should receive alert
   - Incident on Ampang Line
   - User should NOT receive alert

---

## 📅 Estimated Timeline

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| **Phase 1: Foundation** | Data models, station data, seed script | 3.5 hours |
| **Phase 2: Backend** | Firebase, scrapers, AI, alerts, functions | 14.5 hours |
| **Phase 3: Mobile App** | Setup, components, screens, notifications | 19.5 hours |
| **Phase 4: Integration** | Testing, debugging, deployment | 4 hours |
| **Total** | | **~42 hours** |

**For a hackathon (2-3 days):**
- Day 1: Phase 1 + Phase 2 (Backend)
- Day 2: Phase 3 (Mobile App)
- Day 3: Phase 4 (Integration & Polish)

---

## 🚀 Quick Start Implementation Order

If you want to start coding **right now**, here's the recommended order:

### Start with Backend (Server)

1. ✅ **Setup Firebase project**
   ```bash
   cd server
   firebase login
   firebase init
   ```

2. ✅ **Create models** (`/server/src/models/`)
   - Copy TypeScript interfaces from implementation plan

3. ✅ **Create Reddit scraper** (`/server/src/scrapers/reddit.ts`)
   - Test with real Reddit posts

4. ✅ **Create Gemini integration** (`/server/src/ai/gemini.ts`)
   - Test extraction with sample posts

5. ✅ **Create route matcher** (`/server/src/alerts/route-matcher.ts`)
   - Test with mock station data

6. ✅ **Create alert processor** (`/server/src/alerts/processor.ts`)
   - Test with mock users

7. ✅ **Create Cloud Functions** (`/server/src/index.ts`)
   - Deploy and test

### Then Mobile App

8. ✅ **Setup React Native** + Firebase
   
9. ✅ **Create utility functions** (`/app/src/utils/`)

10. ✅ **Create components** (`/app/src/components/`)

11. ✅ **Create screens** (`/app/src/screens/`)

12. ✅ **Setup navigation**

13. ✅ **Test end-to-end**

---

## 📝 Next Steps

**Ready to start?** Pick one:

1. **Start with Backend** - I'll help you implement the Reddit scraper first
2. **Start with Mobile** - I'll help you set up React Native and create the onboarding screen
3. **Create Station Data** - I'll help you compile the station dataset
4. **Setup Firebase** - I'll guide you through Firebase project setup

Let me know which part you'd like to tackle first!
