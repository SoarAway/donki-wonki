# 🚆 On The Way: Predictive Rail Alerts

**"Don't get stuck, get notified."** On The Way is a proactive transit companion for Klang Valley commuters that predicts rail disruptions **before** they hit the official news cycle. While other apps tell you that you're already late, On The Way helps you decide whether to take your usual route or find an alternative before you even leave home.
---

## 💡 The Problem
Most transit apps are **reactive**. You often find out a line is down only after you have reached the platform. In the Klang Valley, social media chatter on platforms like Reddit and X is usually 15–30 minutes ahead of official announcements.

## 🌟 The Solution
This project is an AI-powered rail disruption intelligence and personalized alert system designed to provide proactive, contextual, and predictive notifications to commuters.
Instead of relying solely on official announcements from Rapid KL, the system detects ongoing service disruptions using multiple data sources, predicts their impact, estimates resolution timelines, and alerts only affected users based on their registered commuting routes.

On The Way acts as a digital "early warning system":
1.  **Aggregates** real-time signals from social media like Reddit and XiaoHongShu.
2.  **Analyzes** intent and sentiment using **Gemini AI** to extract structured incident details from informal posts.
3.  **Predicts** route-specific impacts by matching incidents against user-defined commuter paths.
4.  **Notifies** affected users via high-priority Firebase Cloud Messaging (FCM) alerts with clear calls to action.

---

## 🛠️ Tech Stack
* **Mobile**: React Native 0.83 (TypeScript).
* **Backend**: FastAPI (Python).
* **AI Intelligence**: Gemini API for structured data extraction and incident validation.
* **Cloud/Infra**: Firebase (Auth, Firestore, Cloud Messaging).
* **Notifications**: Notifee for advanced foreground and background alert handling.

---

## 🏗️ Architecture

[ Social Signals ] -> [ FastAPI Ingestion ] -> [ Gemini AI Extraction ]
                                                       |
[ Mobile App ] <--- [ Firebase Cloud Messaging ] <--- [ Route Matching Logic ]
      |
( Personalized Alerts + Real-time Service Health Monitoring )

---

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
