# 🚆 On The Way  
## Predictive Rail Disruption Intelligence for Klang Valley

**"Don't get stuck. Get Notified."**

On The Way is an AI-powered early warning system for Klang Valley rail commuters.  
Instead of discovering delays after arriving at the station, users receive personalized disruption alerts 15 to 30 minutes before official announcements are typically released.

The system transforms informal social media chatter into structured transit intelligence and notifies only the commuters whose saved routes are affected.

---

# 🎯 Problem

Rail disruption updates in Klang Valley are reactive. Most official notifications arrive only after commuters are already at the platform.

Meanwhile, social media platforms such as Reddit and X often contain early signals of breakdowns, delays, or signal issues before official confirmation.

Commuters lack:
- An early warning system
- Route-specific disruption filtering
- Predictive impact estimation
- Transparent disruption lifecycle tracking

---

# 💡 Solution

On The Way acts as a digital disruption intelligence engine.

It:

1. Aggregates public rail-related posts from social media.
2. Uses AI to extract structured incident data.
3. Matches incidents against user-defined routes.
4. Sends high-priority push notifications only to affected commuters.
5. Re-evaluates disruptions and updates users before predicted resolution times.

The result is proactive, personalized, and contextual rail alerts.

---

# 🏗️ System Architecture

The project uses a **monorepo architecture**, where both mobile and backend systems are maintained in a single repository for better synchronization and CI control.

Repository:  
https://github.com/SoarAway/donki-wonki  

Structure:

/app      → React Native mobile application  
/server   → FastAPI backend services  
/docs     → Technical documentation  

All components communicate through the backend, which acts as the central orchestrator.

---

# 📱 Frontend Layer

Built with:

- React Native 0.83  
- TypeScript  

Responsibilities:

- Route registration
- User authentication
- Receiving FCM alerts
- Rendering foreground and background notifications
- Displaying disruption summaries

The frontend is intentionally lightweight. All detection, AI reasoning, and routing logic remain server-side to allow rapid backend iteration without app store redeployments.

Notifications are handled using:

- Firebase Cloud Messaging  

---

# 🧠 Backend Orchestration

Built using:

- FastAPI  
- Python  
- Hosted live on Render[[https://donki-wonki.onrender.com  ]]

The backend:

- Receives API calls from the mobile app
- Orchestrates AI prediction workflows
- Performs route matching
- Manages alert lifecycle logic
- Dispatches notifications

Centralizing logic in the backend ensures scalability and clean separation of concerns.

### 🌐 Live Backend Deployment

Production API is deployed on Render:
👉 https://donki-wonki.onrender.com  

Health check endpoint:
👉 https://donki-wonki.onrender.com/health  

---
# Implementation Logic
## 🤖 AI Prediction Engine

The AI layer is powered by the Gemini API.

It processes unstructured social media posts and determines:

- Whether the incident is ongoing
- Which stations are affected
- Which rail lines are impacted
- Estimated resolution time
- Incident category
- Structured summary

This enables early detection before official operator announcements.

---

## 🚦 Alert Mechanism Logic

The alert lifecycle follows a structured chronological model:

### 1️⃣ Initial Detection
- AI detects a disruption.
- All users whose saved routes overlap with affected stations are notified immediately.

### 2️⃣ Extended Disruption Prediction
- 30 minutes before predicted recovery time:
  - If the disruption persists,
  - A new prediction is generated,
  - A follow-up notification is sent.

This ensures commuters do not rely on outdated resolution estimates.

### 3️⃣ Official Resolution
- Once service resumes,
- A recovery notification is sent,
- The alert lifecycle terminates.

---

## 🗺️ Route Intelligence

Route registration uses the Google Maps API to:

- Provide autofill suggestions
- Retrieve coordinates
- Compute nearest station
- Estimate arrival time

### Estimated Arrival Time Algorithm

Estimated Time = (2 minutes × number of stations) + 10 minute buffer

This simplified heuristic allows fast computation without heavy routing APIs while still providing practical time estimates.

---

## 🗄️ Database & Authentication

Implemented using Firebase Firestore.

Stores:

- User sessions
- Registered routes
- Disruption logs
- Alert engagement data

This supports analytics, monitoring, and future reinforcement learning improvements.

---

# 🔄 CI/CD & Git Workflow

Branching Strategy:

- main → Production-ready code
- server → Backend development
- docs → Documentation updates

Deployment:

- Push to server → Dev environment on Render
- Push to main → Production deployment

Documentation merges to main are automated to ensure consistency.

---

# 🚀 Quick Start

## Prerequisites

- Node.js >= 20
- Python 3.12+
- Android Studio or physical Android device

---

## Install All Workspaces

```bash
npm run install:all

## 🚦 Quick Start
1. Prerequisites
- Node.js >= 20
- Python 3.12+
- Android Studio (for mobile emulation) or physical device

2. Startup
- Root Workspace:

```bash
npm run install:all
npm run app
npm run server
Backend Setup:
```

```
Bash
cd server
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```
-- 
# 🌍 Vision & Roadmap
On The Way aims to evolve from a disruption alert system into a fully intelligent commuting companion.

**Future roadmap includes:**
- Real-time CRON orchestration
- Official data integrations
- Smart interchange rerouting
- One-click ride or solution execution
- Reinfrocement learning for alert personalization
- Google calendar integration
- Transparent alert chronology timeline

--
# Team Donki Wonki
- Tan Yi Jie
- Ashley Chan Li Ling
- Lam Yun Han
- Loo Tan Yu Xian
