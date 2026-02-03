# Implementation Guide: Donki-Wonki

FastAPI (Python) backend + React Native mobile app + Firebase services.

---

## Architecture

```
Mobile App (React Native)
    ├─→ Firebase Auth (login/signup)
    ├─→ Firestore (real-time incidents, user routes)
    └─→ FCM (push notifications)

FastAPI Server (Python)
    ├─ Background Scheduler (every 30 mins)
    ├─ Reddit Scraper (PRAW)
    ├─ Gemini AI (extract incidents)
    ├─ Route Matcher (BFS graph traversal)
    └─ Alert Service (Firestore + FCM)
```

---

## Phase 1: Data Models & Station Data

### 1.1 Python Models

**Location:** `/server/models/`

**Files to create:**
- `station.py` - Station model (id, name, code, line, lat, lng, interchanges)
- `incident.py` - Incident model (line, station, type, severity, confidence, summary, source, timestamps)
- `user.py` - UserProfile, CommuteRoute, Schedule models
- `alert.py` - Alert model

**Key fields:**
- Station: id, name, code, line, lat/lng, interchanges list
- Incident: line, station (optional), type, severity, confidence (0-100), summary, source, timestamps
- CommuteRoute: origin_station_id, destination_station_id, schedule, active flag
- Schedule: days list, arrive_by time, alert_window_minutes

### 1.2 TypeScript Models

**Location:** `/app/src/models/`

**Files to create:**
- `Station.ts`
- `Incident.ts`
- `User.ts`
- `Alert.ts`

Mirror the Python models in TypeScript.

### 1.3 Station Data

**Location:** `/data/stations/all-lines.json`

**Structure:**
- Lines array (8 lines: KJ, Ampang, Sri Petaling, MRT Kajang, MRT Putrajaya, Monorail, KTM Port Klang, KTM Tanjung Malim)
- Each line: id, name, color, stations array
- Each station: id, name, code, lat, lng, interchanges
- Interchanges array: stationIds, name, lines, transferTimeMinutes

**Data sources:** MyRapid, OpenStreetMap, Wikipedia

### 1.4 Seed Script

**Location:** `/data/scripts/seed_firestore.py`

**Purpose:** Load station data from JSON into Firestore

**Dependencies:** firebase-admin

---

## Phase 2: FastAPI Backend

### 2.1 Setup

**Commands:**
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Dependencies (requirements.txt):**
- fastapi, uvicorn, pydantic, pydantic-settings
- praw (Reddit)
- google-generativeai (Gemini)
- firebase-admin
- apscheduler
- python-dotenv

**Environment variables (.env):**
- FIREBASE_CREDENTIALS_PATH
- REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REFRESH_TOKEN
- GEMINI_API_KEY
- SCRAPE_INTERVAL_MINUTES

### 2.2 Firebase Config

**Location:** `/server/config/firebase.py`

**Purpose:** Initialize Firebase Admin SDK, provide db client and send_notification function

**Location:** `/server/config/settings.py`

**Purpose:** Load environment variables using Pydantic BaseSettings

### 2.3 Reddit Scraper

**Location:** `/server/services/reddit_scraper.py`

**Function:** `scrape_reddit() -> List[Dict]`

**Purpose:** 
- Monitor r/malaysia and r/kualalumpur
- Filter posts by keywords (lrt, mrt, monorail, ktm, rosak, delay, etc.)
- Fetch post + top 5 comments
- Return structured post data

**Keywords:** lrt, mrt, monorail, ktm, komuter, rapid kl, kelana jaya, kj line, ampang, sri petaling, mrt kajang, mrt putrajaya, klcc, pasar seni, rosak, delay, stuck, breakdown, signal fault

### 2.4 Gemini AI

**Location:** `/server/services/gemini_ai.py`

**Function:** `extract_incident(post: Dict) -> Optional[Incident]`

**Purpose:**
- Send post (title + text + comments) to Gemini
- Extract: line, station, type, severity, confidence, summary
- Return Incident object or None if not relevant/low confidence

**Prompt requirements:**
- JSON response only
- Support all 8 rail lines
- Handle ambiguous posts using comments
- Set confidence based on specificity
- Return null for station if line-wide issue

### 2.5 Route Matcher

**Location:** `/server/services/route_matcher.py`

**Class:** `RouteMatcher`

**Methods:**
- `_load_stations()` - Load from Firestore
- `_build_graph()` - Build adjacency list from lines + interchanges
- `get_stations_on_route(origin, destination)` - BFS traversal
- `is_route_affected(incident, route)` - Check if incident affects route

**Logic:**
- Line-wide incident: check if any route station is on that line
- Station-specific: check if incident station is on route
- Return: {affected: boolean, reason: string}

### 2.6 Alert Service

**Location:** `/server/services/alert_service.py`

**Class:** `AlertService`

**Methods:**
- `process_incident(incident)` - Save to Firestore, find affected users, send alerts
- `find_affected_users(incident)` - Query users, check routes, time windows, days
- `send_alert(user, incident)` - Send FCM notification, save to user's alerts collection

**Logic:**
- Check if user commutes today (day of week)
- Check time window (minutes until arrival)
- Check route affected (using RouteMatcher)
- Send FCM notification
- Save alert to Firestore

### 2.7 Background Job

**Location:** `/server/jobs/monitor_social.py`

**Functions:**
- `monitor_social_media()` - Scrape Reddit, extract incidents, process alerts
- `start_scheduler()` - Start APScheduler with interval job

**Schedule:** Every 30 minutes

### 2.8 FastAPI App

**Location:** `/server/main.py`

**Endpoints:**
- `GET /` - API info
- `POST /trigger-monitoring` - Manual trigger for testing
- `GET /health` - Health check

**Startup:** Start background scheduler

**CORS:** Allow all origins (for mobile app)

---

## Phase 3: Mobile App

### 3.1 Firebase Setup

**Dependencies:**
- @react-native-firebase/app
- @react-native-firebase/auth
- @react-native-firebase/firestore
- @react-native-firebase/messaging

**Configuration:**
- Download google-services.json from Firebase Console
- Place in /app/android/app/
- Update android/build.gradle and android/app/build.gradle

**Location:** `/app/src/services/firebase.ts`

**Exports:** firestore, auth, messaging, requestNotificationPermission()

### 3.2 Screens

**Location:** `/app/src/screens/`

**Files to create:**
- `HomeScreen.tsx` - Dashboard with real-time incidents, route status, recent alerts
- `OnboardingScreen.tsx` - First-time setup (home/work locations, route, schedule)
- `RouteSetupScreen.tsx` - Add/edit/delete routes
- `SettingsScreen.tsx` - Quiet hours, severity threshold, notifications

**HomeScreen:**
- Real-time Firestore listener for incidents (where resolvedAt == null)
- Display route status
- Show active incidents
- Show recent alerts

**OnboardingScreen:**
- Location input (manual or geolocation)
- Find nearest station
- Select origin/destination
- Set arrival time and days
- Save to Firestore

### 3.3 Components

**Location:** `/app/src/components/`

**Files to create:**
- `StationPicker.tsx` - Dropdown for station selection
- `LocationInput.tsx` - Manual address + geolocation button
- `TimePicker.tsx` - Time selection
- `IncidentCard.tsx` - Display incident info
- `RouteStatusCard.tsx` - Show route status
- `AlertItem.tsx` - Alert history item

### 3.4 Utils

**Location:** `/app/src/utils/`

**Files to create:**
- `distance.ts` - Haversine distance calculation
- `time.ts` - Time parsing and formatting
- `station-finder.ts` - Find nearest station logic

**Functions:**
- `calculateDistance(coord1, coord2)` - Haversine formula
- `findNearestStation(coords, stations)` - Find closest station
- `parseTime(timeStr)` - Parse "HH:MM" to Date
- `formatTime(date)` - Format Date to "HH:MM"

### 3.5 Navigation

**Location:** `/app/src/navigation/AppNavigator.tsx`

**Stack:**
- Onboarding
- Home
- RouteSetup
- Settings

---

## Phase 4: Deployment

### 4.1 FastAPI (Render)

**File:** `render.yaml`

**Configuration:**
- Service type: web
- Environment: python
- Build command: pip install -r requirements.txt
- Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
- Environment variables: FIREBASE_CREDENTIALS_PATH, REDDIT_CLIENT_ID, GEMINI_API_KEY

**Steps:**
1. Push to GitHub
2. Connect to Render
3. Add environment variables
4. Deploy

### 4.2 Firebase

**Setup:**
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Download service account key for FastAPI
5. Enable Cloud Messaging

---

## Timeline

| Phase | Time |
|-------|------|
| Phase 1: Foundation | 3.5h |
| Phase 2: FastAPI Backend | 12h |
| Phase 3: Mobile App | 15h |
| Phase 4: Deployment | 1.5h |
| **Total** | **32h** |
