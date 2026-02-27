# Backend Setup Guide: Python venv + FastAPI

Complete guide for setting up the Donki-Wonki FastAPI backend server.

---

## Prerequisites

- **Python 3.11+** (tested on Python 3.13.2)
- **Git** installed
- **Windows PowerShell** or Command Prompt

---

## Quick Start

```bash
# Navigate to server directory (from root of repo)
cd server

# Create virtual environment
python -m venv venv

# Activate venv
.\venv\Scripts\Activate.ps1 (PowerShell)
.\venv\Scripts\activate.bat (Command Prompt)
source venv/Scripts/activate (Git Bash)

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Note: Download service account key from Whatsapp group then put inside server folder
/server/firebaseServiceAccountKey.json

# Run FastAPI server
uvicorn main:app --reload
```

**Access API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)  
**Interactive Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Detailed Setup

### 1. Create Virtual Environment

Virtual environments isolate project dependencies from your system Python.

```bash
python -m venv venv
```

This creates a `venv/` folder containing:
- Standalone Python installation
- Isolated package directory
- pip package manager

### 2. Activate Virtual Environment

**PowerShell:**
```bash
.\venv\Scripts\Activate.ps1
```

**Command Prompt:**
```bash
.\venv\Scripts\activate.bat
```

**Verify:** Your prompt should show `(venv)` prefix:
```
(venv) PS D:\...\donki-wonki\server>
```

### 3. Upgrade pip

Always upgrade pip to avoid compatibility issues:

```bash
python -m pip install --upgrade pip
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

**Installed packages:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `praw` - Reddit API
- `google-generativeai` - Gemini AI
- `firebase-admin` - Firebase integration
- `apscheduler` - Background jobs
- `python-dotenv` - Environment variables

**Verify installation:**
```bash
pip list
```

---

## Environment Configuration

### Create .env File

```bash
copy .env.example .env
```

### Required API Keys

Edit `.env` with your credentials:

```env
# Firebase
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
```
---

## Running the Server

### Development Mode (auto-reload)

```bash
uvicorn main:app --reload
```

### Custom Host/Port

```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Expected Output

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345]
INFO:     Application startup complete.
```

### Test the API

**Browser:** Navigate to [http://127.0.0.1:8000](http://127.0.0.1:8000)

**Expected Response:**
```json
{
  "message": "Donki-Wonki API",
  "version": "1.0.0"
}
```

**Interactive Docs:**
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Troubleshooting

### Issue: PowerShell script execution disabled

**Error:** `cannot be loaded because running scripts is disabled`

**Fix:**
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Python command not found

**Fix:** Try using `py` instead:
```bash
py -m venv venv
```

### Issue: Port 8000 already in use

**Fix:** Use a different port:
```bash
uvicorn main:app --port 8080 --reload
```

### Issue: Firebase initialization fails

**Check:**
- `serviceAccountKey.json` exists in `server/` folder
- `.env` has correct path: `FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json`

### Issue: Package installation fails on Python 3.13

**Solution:** This is already handled. `requirements.txt` uses `>=` instead of `==` for compatibility.

If still failing, downgrade to Python 3.11 or 3.12.

---

## Project Structure

```
server/
├── venv/                      # Virtual environment
├── .env                       # Environment variables
├── serviceAccountKey.json     # Firebase credentials
├── main.py                    # FastAPI entry point
├── requirements.txt           # Dependencies
├── config/
│   ├── settings.py           # Settings loader
│   └── firebase.py           # Firebase config
├── models/                    # Data models
├── services/                  # Business logic
│   ├── reddit_scraper.py
│   ├── gemini_ai.py
│   ├── route_matcher.py
│   └── alert_service.py
├── jobs/                      # Background tasks
│   └── monitor_social.py
└── utils/                     # Helper functions
```

---

## Daily Workflow

```bash
# 1. Navigate to server
cd "d:\Ash Stuff\Coding\KitaHack 2026\donki-wonki\server"

# 2. Activate venv
.\venv\Scripts\activate

# 3. Run server
uvicorn main:app --reload
```

### Adding New Packages

```bash
# Activate venv
.\venv\Scripts\activate

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt
```

### Deactivate venv

```bash
deactivate
```

---

## Production Deployment (Render)

### Deploy Steps

1. Push code to GitHub
2. Create Web Service on [Render](https://render.com)
3. Connect GitHub repository
4. Add environment variables in Render dashboard
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy!

> **Note:** Remove `--reload` flag in production for better performance.

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Guide](https://www.uvicorn.org/)
- [Python venv](https://docs.python.org/3/library/venv.html)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [PRAW (Reddit API)](https://praw.readthedocs.io/)