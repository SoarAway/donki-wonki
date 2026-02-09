# Donki-Wonki

**Hyperlocal Predictive Rail Alerts for Klang Valley** | Hackathon MVP

> Empowering daily train commuters to reclaim control of their time by predicting and alerting them about rail network disruptions **before they happen**.

---

## 🚆 What is Donki-Wonki?

Unlike reactive apps that tell you "the train is delayed" when you're already at the platform, **Donki-Wonki tells you BEFORE you leave home**:

- 🔔 **"Leave 15 minutes early - KJ Line signal fault at Bangsar"**
- 🔔 **"Take MRT instead of LRT today - Ampang Line overcrowded"**
- 🔔 **"All clear on your route - normal commute time"**

By monitoring social media (Reddit, Twitter) and using AI to extract incident details, we provide **proactive, personalized alerts** tailored to your specific route and schedule.

---

## 🏗️ Architecture

**Backend:** FastAPI (Python) - Scraping, AI processing, alert logic  
**Services:** Firebase (Auth, Firestore, FCM) - User management, database, notifications  
**Mobile:** React Native - Direct Firebase SDK integration

```
Mobile App (React Native)
    ↓
    ├─→ Firebase Auth (login/signup)
    ├─→ Firestore (real-time incidents)
    └─→ FCM (push notifications)

FastAPI Server (Python)
    ├─ Background Scheduler (every 30 mins)
    ├─ Reddit Scraper (PRAW)
    ├─ Gemini AI (extract incidents)
    └─ Alert Processor
```

---

## 📁 Project Structure

```
donki-wonki/
├── app/             # 📱 React Native mobile app (Android)
├── server/          # 🐍 FastAPI backend (Python)
├── data/            # 📊 Static station data
├── docs/            # 📚 Documentation
└── README.md
```

---

## 🗺️ Supported Rail Lines

All **8 major Klang Valley rail lines** (~100 stations):

- LRT Kelana Jaya Line (37 stations)
- LRT Ampang/Sri Petaling Line (36 stations)
- MRT Kajang Line (31 stations)
- MRT Putrajaya Line (36 stations)
- KL Monorail (11 stations)
- KTM Komuter (Port Klang/Tanjung Malim lines)

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** and pip
- **Node.js 18+** and npm
- **Android Studio** with Android SDK
- **Firebase account**

### Installation

```bash
# Clone repository
git clone https://github.com/soaraway/donki-wonki.git
cd donki-wonki

# Install all dependencies
npm run install:all
```

### Running the Backend

```bash
cd server

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your API keys

# Run server
uvicorn main:app --reload
```

### Running the Mobile App

```bash
cd app

# Start Metro
npm start

# Run on Android (in another terminal)
npx react-native run-android
```

---

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python web framework)
- PRAW (Reddit API)
- Google Gemini 1.5 Flash (AI)
- Firebase Admin SDK (Firestore, FCM)
- APScheduler (background jobs)

**Mobile:**
- React Native 0.73
- Firebase SDK (Auth, Firestore, Messaging)
- TypeScript

**Services:**
- Firebase Auth (user authentication)
- Cloud Firestore (real-time database)
- Firebase Cloud Messaging (push notifications)

**Cost:** $0/month (all free tiers)

---

## 📚 Documentation

- **[Implementation Guide (FastAPI)](./docs/IMPLEMENTATION_GUIDE_FASTAPI.md)** - Step-by-step implementation
- **[Backend Comparison](./docs/backend_comparison.md)** - Firebase vs FastAPI analysis
- **[PRD](./docs/PRD.md)** - Product requirements
- **[Project Structure](./docs/PROJECT_STRUCTURE.md)** - Detailed architecture

---

## 🎯 Key Features

✅ All 8 rail lines supported (~100 stations)  
✅ AI-powered incident extraction from social media  
✅ Real-time updates via Firestore  
✅ Time-window based alerts  
✅ Cross-line route support  
✅ Push notifications  
✅ Zero cost (free tiers)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- MyRapid for public station data
- Reddit & Twitter communities for real-time reports
- Google Gemini for AI-powered extraction
- Firebase for backend infrastructure

---

**Built with ❤️ for Klang Valley commuters**
