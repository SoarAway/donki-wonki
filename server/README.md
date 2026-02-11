# FastAPI Backend (Python)

Backend server for Donki-Wonki using FastAPI + Firebase Services.

## Architecture

- **FastAPI**: REST API and background jobs
- **Firebase Services**: Auth, Firestore (database), FCM (notifications)
- **Python**: Reddit scraping (PRAW), AI processing (Gemini)

## Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy example env file
copy .env.example .env

# Edit .env and add your credentials:
# - Firebase service account key path
# - Reddit API credentials
# - Gemini API key
```

### 4. Get Firebase Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in `/server` folder

### 5. Run Development Server

```bash
uvicorn main:app --reload
```

Server will start at `http://localhost:8000`

## Project Structure

```
server/
├── main.py                # FastAPI app entry point
├── config/
│   ├── settings.py        # Environment variables
│   └── firebase.py        # Firebase initialization
├── models/
│   ├── station.py         # Station data model
│   ├── incident.py        # Incident data model
│   ├── user.py            # User profile model
│   └── alert.py           # Alert model
├── services/
│   ├── reddit_scraper.py  # Reddit monitoring
│   ├── gemini_ai.py       # AI extraction
│   ├── route_matcher.py   # Route impact analysis
│   └── alert_service.py   # Alert generation
├── jobs/
│   └── monitor_social.py  # Background scheduler
├── utils/
│   └── helpers.py         # Utility functions
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables (not in git)
```

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `POST /trigger-monitoring` - Manual trigger for testing

## Background Jobs

- **Social Media Monitoring**: Runs every 30 minutes
  - Scrapes Reddit for rail-related posts
  - Extracts incidents using Gemini AI
  - Saves to Firestore
  - Sends alerts to affected users

## Deployment

### Render (Recommended)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Add environment variables
5. Deploy

### Railway

1. Connect GitHub repo
2. Railway auto-detects Python
3. Add environment variables
4. Deploy

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run background job manually
python -c "from jobs.monitor_social import monitor_social_media; monitor_social_media()"
```

## Testing

```bash
# Test Reddit scraper
python -c "from services.reddit_scraper import scrape_reddit; print(scrape_reddit())"

# Test Gemini AI
python -c "from services.gemini_ai import extract_incident; print(extract_incident(test_post))"
```
