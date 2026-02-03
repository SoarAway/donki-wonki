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

### 1.1 Python Models (`/server/models/`)

```python
# station.py
from pydantic import BaseModel
from typing import Optional, List

class Station(BaseModel):
    id: str
    name: str
    code: str
    line: str
    lat: float
    lng: float
    interchanges: Optional[List[str]] = []

# incident.py
class Incident(BaseModel):
    id: Optional[str]
    line: str
    station: Optional[str]
    type: str  # signal-fault, breakdown, overcrowding, gate-malfunction, other
    severity: str  # low, medium, high, critical
    confidence: int  # 0-100
    summary: str
    source: str  # reddit, twitter
    source_url: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

# user.py
class UserProfile(BaseModel):
    id: str
    fcm_token: Optional[str]
    routes: List[CommuteRoute]
    settings: UserSettings

class CommuteRoute(BaseModel):
    origin_station_id: str
    destination_station_id: str
    schedule: Schedule
    active: bool = True

class Schedule(BaseModel):
    days: List[str]  # ["monday", "tuesday", ...]
    arrive_by: str  # "09:00"
    alert_window_minutes: int = 60
```

### 1.2 TypeScript Models (`/app/src/models/`)

Mirror the Python models in TypeScript for the mobile app.

### 1.3 Station Data (`/data/stations/all-lines.json`)

```json
{
  "lines": [
    {
      "id": "kelana-jaya",
      "name": "LRT Kelana Jaya Line",
      "color": "#E42313",
      "stations": [
        {
          "id": "kj1",
          "name": "Gombak",
          "code": "KJ1",
          "lat": 3.2133,
          "lng": 101.7292,
          "interchanges": []
        }
        // ... 36 more stations
      ]
    }
    // ... 7 more lines
  ],
  "interchanges": [
    {
      "stationIds": ["kj10", "ag10"],
      "name": "Masjid Jamek",
      "lines": ["kelana-jaya", "ampang"],
      "transferTimeMinutes": 5
    }
  ]
}
```

**Data sources:** MyRapid, OpenStreetMap, Wikipedia

### 1.4 Seed Script (`/data/scripts/seed_firestore.py`)

```python
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

### 2.1 Setup

```bash
cd server
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**`requirements.txt`:**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
praw==7.7.1
google-generativeai==0.3.2
firebase-admin==6.4.0
apscheduler==3.10.4
python-dotenv==1.0.0
```

**`.env`:**
```
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
REDDIT_REFRESH_TOKEN=xxx
GEMINI_API_KEY=xxx
SCRAPE_INTERVAL_MINUTES=30
```

### 2.2 Firebase Config (`/server/config/firebase.py`)

```python
import firebase_admin
from firebase_admin import credentials, firestore, messaging
import os

cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
firebase_admin.initialize_app(cred)
db = firestore.client()

def get_db():
    return db

def send_notification(token: str, title: str, body: str, data: dict = None):
    message = messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        token=token
    )
    return messaging.send(message)
```

### 2.3 Settings (`/server/config/settings.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    firebase_credentials_path: str
    reddit_client_id: str
    reddit_client_secret: str
    reddit_refresh_token: str
    reddit_user_agent: str = "DonkiWonki/1.0"
    gemini_api_key: str
    scrape_interval_minutes: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 2.4 Reddit Scraper (`/server/services/reddit_scraper.py`)

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
    posts = []
    for subreddit_name in ["malaysia", "kualalumpur"]:
        subreddit = reddit.subreddit(subreddit_name)
        for submission in subreddit.new(limit=100):
            text = f"{submission.title} {submission.selftext}".lower()
            if any(keyword in text for keyword in KEYWORDS):
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

### 2.5 Gemini AI (`/server/services/gemini_ai.py`)

```python
import google.generativeai as genai
from config.settings import settings
from models.incident import Incident
from typing import Optional
import json
from datetime import datetime

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

PROMPT = """
Extract incident from this post:
Title: {title}
Text: {text}
Comments: {comments}

Respond with JSON only:
{{
  "isRelevant": boolean,
  "line": "kelana-jaya"|"ampang"|"sri-petaling"|"mrt-kajang"|"mrt-putrajaya"|"monorail"|"ktm-port-klang"|"ktm-tanjung-malim"|null,
  "station": "station name"|null,
  "type": "signal-fault"|"train-breakdown"|"overcrowding"|"gate-malfunction"|"other"|null,
  "severity": "low"|"medium"|"high"|"critical",
  "confidence": 0-100,
  "summary": "brief description"
}}

Rules:
- Extract if about Klang Valley rail
- Common stations: KLCC, Pasar Seni, KL Sentral, Bukit Bintang, Masjid Jamek
- If no station mentioned, set to null (line-wide)
- Use comments for clarification
- Confidence based on specificity
"""

def extract_incident(post: Dict) -> Optional[Incident]:
    try:
        prompt = PROMPT.format(
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
        print(f"Error: {e}")
        return None
```

### 2.6 Route Matcher (`/server/services/route_matcher.py`)

```python
from typing import List, Dict, Set
from models.incident import Incident
from models.user import CommuteRoute
from config.firebase import get_db

class RouteMatcher:
    def __init__(self):
        self.db = get_db()
        self.stations = self._load_stations()
        self.graph = self._build_graph()
    
    def _load_stations(self) -> Dict:
        stations = {}
        docs = self.db.collection('stations').stream()
        for doc in docs:
            stations[doc.id] = doc.to_dict()
        return stations
    
    def _build_graph(self) -> Dict[str, Set[str]]:
        # Build adjacency list from line sequences + interchanges
        graph = {}
        # Implementation: connect stations on same line + interchange stations
        return graph
    
    def get_stations_on_route(self, origin: str, destination: str) -> List[str]:
        # BFS to find all stations between origin and destination
        return []
    
    def is_route_affected(self, incident: Incident, route: CommuteRoute) -> Dict:
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
        
        # Station-specific
        affected = incident.station in route_stations
        return {
            'affected': affected,
            'reason': f"{incident.type} at {incident.station}" if affected else None
        }
```

### 2.7 Alert Service (`/server/services/alert_service.py`)

```python
from datetime import datetime
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
        # Save to Firestore
        incident_ref = self.db.collection('incidents').add(incident.dict())
        incident.id = incident_ref[1].id
        
        # Find affected users
        affected_users = self.find_affected_users(incident)
        
        # Send alerts
        for user in affected_users:
            self.send_alert(user, incident)
    
    def find_affected_users(self, incident: Incident) -> List[UserProfile]:
        affected = []
        now = datetime.now()
        users = self.db.collection('users').stream()
        
        for user_doc in users:
            user = UserProfile(**user_doc.to_dict())
            for route in user.routes:
                if not route.active:
                    continue
                
                # Check day
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
                
                # Check route affected
                impact = self.matcher.is_route_affected(incident, route)
                if impact['affected']:
                    affected.append(user)
                    break
        
        return affected
    
    def send_alert(self, user: UserProfile, incident: Incident):
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
        
        self.db.collection('users').document(user.id).collection('alerts').add({
            'incident_id': incident.id,
            'title': title,
            'body': body,
            'sent_at': datetime.now(),
            'read': False
        })
```

### 2.8 Background Job (`/server/jobs/monitor_social.py`)

```python
from apscheduler.schedulers.background import BackgroundScheduler
from services.reddit_scraper import scrape_reddit
from services.gemini_ai import extract_incident
from services.alert_service import AlertService
from config.settings import settings
from datetime import datetime

alert_service = AlertService()

def monitor_social_media():
    print(f"[{datetime.now()}] Monitoring...")
    posts = scrape_reddit()
    print(f"Found {len(posts)} posts")
    
    for post in posts:
        incident = extract_incident(post)
        if incident:
            print(f"Incident: {incident.summary}")
            alert_service.process_incident(incident)
    
    print("Complete")

def start_scheduler():
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

### 2.9 FastAPI App (`/server/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from jobs.monitor_social import start_scheduler, monitor_social_media
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler()
    print("Scheduler started")
    yield
    scheduler.shutdown()

app = FastAPI(title="Donki-Wonki API", lifespan=lifespan)

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

## Phase 3: Mobile App

### 3.1 Firebase Setup

```bash
cd app
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/messaging
```

Download `google-services.json` → `/app/android/app/`

**`/app/src/services/firebase.ts`:**
```typescript
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

export { firestore, auth, messaging };

export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    return await messaging().getToken();
  }
  return null;
}
```

### 3.2 Real-Time Listener

**`/app/src/screens/HomeScreen.tsx`:**
```typescript
import React, { useEffect, useState } from 'react';
import { firestore } from '../services/firebase';
import { Incident } from '../models/Incident';

export default function HomeScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    // Real-time listener - NO API CALLS
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
    // UI
  );
}
```

---

## Phase 4: Deployment

### FastAPI (Render)

**`render.yaml`:**
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

Push to GitHub → Connect to Render → Deploy

### Firebase

1. Create project
2. Enable Auth (Email/Password)
3. Create Firestore database
4. Download service account key
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
