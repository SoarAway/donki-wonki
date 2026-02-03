# Implementation Plan: FastAPI + Firebase Services

## Architecture Overview

**Backend:** FastAPI (Python) - Scraping, AI processing, alert logic  
**Services:** Firebase (Auth, Firestore, FCM) - User management, database, notifications  
**Mobile:** React Native - Direct Firebase SDK integration

```
Mobile App (React Native)
    ↓
    ├─→ Firebase Auth (login/signup)
    ├─→ Firestore (real-time incidents, user routes)
    └─→ FCM (push notifications)

FastAPI Server (Python)
    ├─ Background Scheduler (every 30 mins)
    │  ├─ Reddit Scraper (PRAW)
    │  ├─ Gemini AI (extract incidents)
    │  ├─ Write to Firestore
    │  ├─ Find affected users
    │  └─ Send FCM notifications
    └─ Optional REST endpoints
```

---

## Phase 1: Foundation & Data Models

### 1.1 Create Shared Models ⏱️ 30 mins

**Mobile App:** `/app/src/models/` (TypeScript)
```typescript
// Station.ts, Incident.ts, User.ts, Alert.ts
```

**Backend:** `/server/models/` (Python)
```python
# station.py, incident.py, user.py, alert.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Station(BaseModel):
    id: str
    name: str
    code: str
    line: str
    lat: float
    lng: float
    interchanges: Optional[List[str]] = []

class Incident(BaseModel):
    id: Optional[str]
    line: str
    station: Optional[str]
    type: str  # signal-fault, breakdown, overcrowding, etc.
    severity: str  # low, medium, high, critical
    confidence: int  # 0-100
    summary: str
    source: str  # reddit, twitter
    source_url: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
```

### 1.2 Station Data ⏱️ 2 hours

- [ ] `/data/stations/all-lines.json` - All ~100 stations
- [ ] Include coordinates, interchanges, line info

### 1.3 Database Seed Script ⏱️ 1 hour

```python
# /data/scripts/seed_firestore.py
import json
from firebase_admin import firestore, credentials, initialize_app

cred = credentials.Certificate('serviceAccountKey.json')
initialize_app(cred)
db = firestore.client()

with open('../stations/all-lines.json') as f:
    data = json.load(f)
    
for line in data['lines']:
    for station in line['stations']:
        db.collection('stations').document(station['id']).set(station)
```

---

## Phase 2: FastAPI Backend

### 2.1 Project Setup ⏱️ 30 mins

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn pydantic
pip install praw  # Reddit API
pip install google-generativeai  # Gemini AI
pip install firebase-admin  # Firebase services
pip install apscheduler  # Background jobs
pip install python-dotenv  # Environment variables
```

**Create `/server/requirements.txt`:**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
praw==7.7.1
google-generativeai==0.3.2
firebase-admin==6.4.0
apscheduler==3.10.4
python-dotenv==1.0.0
```

### 2.2 Project Structure

```
server/
├── main.py                 # FastAPI app entry point
├── config/
│   ├── __init__.py
│   ├── settings.py        # Environment variables
│   └── firebase.py        # Firebase initialization
├── models/
│   ├── __init__.py
│   ├── station.py
│   ├── incident.py
│   ├── user.py
│   └── alert.py
├── services/
│   ├── __init__.py
│   ├── reddit_scraper.py  # Reddit monitoring
│   ├── gemini_ai.py       # AI extraction
│   ├── route_matcher.py   # Route impact analysis
│   └── alert_service.py   # Alert generation & sending
├── jobs/
│   ├── __init__.py
│   └── monitor_social.py  # Scheduled background job
├── utils/
│   ├── __init__.py
│   └── helpers.py
├── requirements.txt
└── .env
```

### 2.3 Firebase Configuration ⏱️ 30 mins

**File:** `/server/config/firebase.py`

```python
import firebase_admin
from firebase_admin import credentials, firestore, messaging
import os

# Initialize Firebase Admin SDK
cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

def get_db():
    return db

def send_notification(token: str, title: str, body: str, data: dict = None):
    """Send FCM notification"""
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        token=token
    )
    return messaging.send(message)
```

**File:** `/server/config/settings.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Firebase
    firebase_credentials_path: str
    
    # Reddit
    reddit_client_id: str
    reddit_client_secret: str
    reddit_refresh_token: str
    reddit_user_agent: str = "DonkiWonki/1.0"
    
    # Gemini
    gemini_api_key: str
    
    # App
    scrape_interval_minutes: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 2.4 Reddit Scraper ⏱️ 2 hours

**File:** `/server/services/reddit_scraper.py`

```python
import praw
from typing import List, Dict
from config.settings import settings

reddit = praw.Reddit(
    client_id=settings.reddit_client_id,
    client_secret=settings.reddit_client_secret,
    refresh_token=settings.reddit_refresh_token,
    user_agent=settings.reddit_user_agent
)

KEYWORDS = [
    "lrt", "mrt", "monorail", "ktm", "komuter", "rapid kl",
    "kelana jaya", "kj line", "ampang", "sri petaling",
    "mrt kajang", "mrt putrajaya", "klcc", "pasar seni",
    "rosak", "delay", "stuck", "breakdown", "signal fault"
]

def scrape_reddit() -> List[Dict]:
    """Scrape Reddit for rail-related posts"""
    posts = []
    
    for subreddit_name in ["malaysia", "kualalumpur"]:
        subreddit = reddit.subreddit(subreddit_name)
        
        # Get recent posts (last 24 hours)
        for submission in subreddit.new(limit=100):
            # Check if post contains keywords
            text = f"{submission.title} {submission.selftext}".lower()
            
            if any(keyword in text for keyword in KEYWORDS):
                # Get top comments for context
                submission.comments.replace_more(limit=0)
                comments = [c.body for c in submission.comments.list()[:5]]
                
                posts.append({
                    'id': submission.id,
                    'title': submission.title,
                    'text': submission.selftext,
                    'comments': comments,
                    'url': submission.url,
                    'created_utc': submission.created_utc,
                    'source': 'reddit'
                })
    
    return posts
```

### 2.5 Gemini AI Integration ⏱️ 2 hours

**File:** `/server/services/gemini_ai.py`

```python
import google.generativeai as genai
from config.settings import settings
from models.incident import Incident
from typing import Optional
import json

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

EXTRACTION_PROMPT = """
You are analyzing social media posts about Kuala Lumpur's rail network.

Extract incident information from this post (including comments):
Title: {title}
Text: {text}
Comments: {comments}

Respond ONLY with valid JSON (no markdown):
{{
  "isRelevant": boolean,
  "line": "kelana-jaya" | "ampang" | "sri-petaling" | "mrt-kajang" | "mrt-putrajaya" | "monorail" | "ktm-port-klang" | "ktm-tanjung-malim" | null,
  "station": "station name" | null,
  "type": "signal-fault" | "train-breakdown" | "overcrowding" | "gate-malfunction" | "other" | null,
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": 0-100,
  "summary": "brief description"
}}

Rules:
- Extract if post is about ANY Klang Valley rail line
- Common stations: KLCC, Pasar Seni, KL Sentral, Bukit Bintang, Masjid Jamek
- If no specific station mentioned, set station to null (line-wide issue)
- Check COMMENTS for clarification if main post is ambiguous
- Confidence based on specificity and clarity
"""

def extract_incident(post: Dict) -> Optional[Incident]:
    """Extract incident from social media post using Gemini"""
    try:
        prompt = EXTRACTION_PROMPT.format(
            title=post['title'],
            text=post['text'],
            comments='\n'.join(post['comments'])
        )
        
        response = model.generate_content(prompt)
        data = json.loads(response.text)
        
        if not data['isRelevant'] or data['confidence'] < 50:
            return None
        
        return Incident(
            line=data['line'],
            station=data['station'],
            type=data['type'],
            severity=data['severity'],
            confidence=data['confidence'],
            summary=data['summary'],
            source=post['source'],
            source_url=post['url'],
            created_at=datetime.fromtimestamp(post['created_utc'])
        )
    except Exception as e:
        print(f"Error extracting incident: {e}")
        return None
```

### 2.6 Route Matcher ⏱️ 3 hours

**File:** `/server/services/route_matcher.py`

```python
from typing import List, Dict, Set
from models.incident import Incident
from models.user import CommuteRoute
from config.firebase import get_db

class RouteMatcher:
    def __init__(self):
        self.db = get_db()
        self.stations = self._load_stations()
        self.station_graph = self._build_graph()
    
    def _load_stations(self) -> Dict:
        """Load all stations from Firestore"""
        stations = {}
        docs = self.db.collection('stations').stream()
        for doc in docs:
            stations[doc.id] = doc.to_dict()
        return stations
    
    def _build_graph(self) -> Dict[str, Set[str]]:
        """Build station connectivity graph"""
        graph = {}
        # Build graph based on line sequences and interchanges
        # ... implementation
        return graph
    
    def get_stations_on_route(self, origin: str, destination: str) -> List[str]:
        """Get all stations between origin and destination (BFS)"""
        # BFS traversal
        # ... implementation
        return []
    
    def is_route_affected(self, incident: Incident, route: CommuteRoute) -> Dict:
        """Check if incident affects user's route"""
        route_stations = self.get_stations_on_route(
            route.origin_station_id,
            route.destination_station_id
        )
        
        # Line-wide incident
        if not incident.station:
            affected = any(
                self.stations[s]['line'] == incident.line 
                for s in route_stations
            )
            return {
                'affected': affected,
                'reason': f"Line-wide {incident.type} on {incident.line}"
            }
        
        # Station-specific incident
        affected = incident.station in route_stations
        return {
            'affected': affected,
            'reason': f"{incident.type} at {incident.station}" if affected else None
        }
```

### 2.7 Alert Service ⏱️ 2 hours

**File:** `/server/services/alert_service.py`

```python
from datetime import datetime, timedelta
from typing import List
from models.incident import Incident
from models.user import UserProfile
from config.firebase import get_db, send_notification
from services.route_matcher import RouteMatcher

class AlertService:
    def __init__(self):
        self.db = get_db()
        self.matcher = RouteMatcher()
    
    def process_incident(self, incident: Incident):
        """Process incident and send alerts to affected users"""
        # Save incident to Firestore
        incident_ref = self.db.collection('incidents').add(incident.dict())
        incident.id = incident_ref[1].id
        
        # Find affected users
        affected_users = self.find_affected_users(incident)
        
        # Send alerts
        for user in affected_users:
            self.send_alert(user, incident)
    
    def find_affected_users(self, incident: Incident) -> List[UserProfile]:
        """Find users whose routes are affected"""
        affected = []
        now = datetime.now()
        
        # Get all users
        users = self.db.collection('users').stream()
        
        for user_doc in users:
            user = UserProfile(**user_doc.to_dict())
            
            for route in user.routes:
                if not route.active:
                    continue
                
                # Check if user commutes today
                today = now.strftime('%A').lower()
                if today not in route.schedule.days:
                    continue
                
                # Check time window
                arrive_time = datetime.strptime(route.schedule.arrive_by, '%H:%M')
                arrive_time = arrive_time.replace(
                    year=now.year, month=now.month, day=now.day
                )
                minutes_until = (arrive_time - now).total_seconds() / 60
                
                if minutes_until < 0 or minutes_until > route.schedule.alert_window_minutes:
                    continue
                
                # Check if route is affected
                impact = self.matcher.is_route_affected(incident, route)
                if impact['affected']:
                    affected.append(user)
                    break
        
        return affected
    
    def send_alert(self, user: UserProfile, incident: Incident):
        """Send push notification to user"""
        if not user.fcm_token:
            return
        
        title = f"{incident.line.upper()} Alert"
        body = f"{incident.summary}. Consider leaving early."
        
        send_notification(
            token=user.fcm_token,
            title=title,
            body=body,
            data={'incident_id': incident.id}
        )
        
        # Save alert to Firestore
        self.db.collection('users').document(user.id).collection('alerts').add({
            'incident_id': incident.id,
            'title': title,
            'body': body,
            'sent_at': datetime.now(),
            'read': False
        })
```

### 2.8 Background Scheduler ⏱️ 1 hour

**File:** `/server/jobs/monitor_social.py`

```python
from apscheduler.schedulers.background import BackgroundScheduler
from services.reddit_scraper import scrape_reddit
from services.gemini_ai import extract_incident
from services.alert_service import AlertService
from config.settings import settings

alert_service = AlertService()

def monitor_social_media():
    """Background job to monitor social media"""
    print(f"[{datetime.now()}] Starting social media monitoring...")
    
    # Scrape Reddit
    posts = scrape_reddit()
    print(f"Found {len(posts)} relevant posts")
    
    # Process each post
    for post in posts:
        incident = extract_incident(post)
        if incident:
            print(f"Extracted incident: {incident.summary}")
            alert_service.process_incident(incident)
    
    print("Monitoring complete")

def start_scheduler():
    """Start background scheduler"""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        monitor_social_media,
        'interval',
        minutes=settings.scrape_interval_minutes,
        id='monitor_social_media'
    )
    scheduler.start()
    return scheduler
```

### 2.9 FastAPI Main App ⏱️ 1 hour

**File:** `/server/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from jobs.monitor_social import start_scheduler, monitor_social_media
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background scheduler
    scheduler = start_scheduler()
    print("Background scheduler started")
    yield
    # Shutdown: Stop scheduler
    scheduler.shutdown()

app = FastAPI(title="Donki-Wonki API", lifespan=lifespan)

# CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Donki-Wonki API", "status": "running"}

@app.post("/trigger-monitoring")
def trigger_monitoring():
    """Manual trigger for testing"""
    monitor_social_media()
    return {"status": "completed"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Phase 3: Mobile App (React Native)

### 3.1 Firebase Setup ⏱️ 1 hour

**Install dependencies:**
```bash
cd app
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/messaging
```

**Configure Firebase:**
1. Download `google-services.json` from Firebase Console
2. Place in `/app/android/app/`
3. Update `android/build.gradle` and `android/app/build.gradle`

**File:** `/app/src/services/firebase.ts`

```typescript
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

export { firestore, auth, messaging };

// Initialize FCM
export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    return token;
  }
  return null;
}
```

### 3.2 Real-Time Incident Listener ⏱️ 1 hour

**File:** `/app/src/screens/HomeScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { firestore } from '../services/firebase';
import { Incident } from '../models/Incident';

export default function HomeScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    // Real-time listener - NO API CALLS NEEDED!
    const unsubscribe = firestore()
      .collection('incidents')
      .where('resolvedAt', '==', null)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Incident[];
        setIncidents(data);
      });

    return unsubscribe;
  }, []);

  return (
    // UI to display incidents
  );
}
```

**That's it! No REST API calls needed for real-time data!**

---

## Phase 4: Deployment

### 4.1 Deploy FastAPI ⏱️ 1 hour

**Option 1: Render (Recommended)**

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: donki-wonki-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: FIREBASE_CREDENTIALS_PATH
        sync: false
      - key: REDDIT_CLIENT_ID
        sync: false
      - key: GEMINI_API_KEY
        sync: false
```

2. Push to GitHub
3. Connect to Render
4. Deploy

**Option 2: Railway**
- Connect GitHub repo
- Railway auto-detects Python
- Add environment variables
- Deploy

### 4.2 Firebase Setup ⏱️ 30 mins

1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Download service account key for FastAPI
5. Enable Cloud Messaging

---

## Timeline

| Phase | Time |
|-------|------|
| Phase 1: Foundation | 3.5 hours |
| Phase 2: FastAPI Backend | 12 hours |
| Phase 3: Mobile App | 15 hours |
| Phase 4: Deployment | 1.5 hours |
| **Total** | **32 hours** |

**10 hours faster than Firebase Cloud Functions approach!**

---

## Next Steps

Ready to start? Pick one:
1. **Setup FastAPI project** - Create virtual env, install dependencies
2. **Create data models** - Python Pydantic models
3. **Build Reddit scraper** - Test with real Reddit data
4. **Setup Firebase** - Create project, get credentials

Let me know where to start!
