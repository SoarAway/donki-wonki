# Product Requirements Document: Donki-Wonki (Hyperlocal Predictive Rail Alerts)

**Product Name:** Donki-Wonki  
**Version:** 1.2 (Rail-Focused Merge)  
**Last Updated:** 2026-01-28  
**Target City:** Klang Valley (Kuala Lumpur & Selangor), Malaysia
**Scope:** Public Transportation (Trains/Rail) Only

---

## 1. Overview

### 1.1 Product Vision

A background mobile platform that empowers daily train commuters to reclaim control of their time by predicting and alerting them about rail network disruptions before they happen. By aggregating and analyzing social media reports, official transport data, and public feeds, the app transforms scattered information into proactive, personalized alerts tailored to each user's routine.

Unlike reactive apps that tell you "the train is delayed" when you're already at the platform, Donki-Wonki tells you **"leave 15 minutes early because the Kelana Jaya line is experiencing signal faults"** or **"take the MRT instead of LRT today"** by monitoring what real commuters are reporting online.

### 1.2 Problem Statement

**Daily train commuters in Klang Valley face three critical pain points:**

1. **Unpredictability:** Signal faults, trackmaster issues, and overcrowding disrupt fixed routines without warning.
2. **Information Overload:** Official apps often update late, while social media (Twitter/Reddit) has the news first but is noisy and scattered.
3. **Lack of Personalization:** Generic navigation apps don't monitor *your* specific commute window or *your* specific line proactively.

**The result:** Missed meetings, platform overcrowding, stress, and lateness.

### 1.3 Target Users

#### Primary Users
- **Daily Train Commuters**: Students and office workers relying on LRT, MRT, Monorail, or KTM.
- **Passive Users**: Users who want "set and forget" monitoring of their daily route.

#### Geographic Focus
- Klang Valley Rail Network (Kelana Jaya Line, Ampang/Sri Petaling Line, MRT Kajang/Putrajaya, Monorail, KTM Komuter).

### 1.4 Key Differentiators

| Feature | Donki-Wonki | Official Apps / Google Maps |
|---------|--------------|---------------|
| **Data Sources** | Social media (Reddit, Twitter) + Official feeds + Community | Official data + basic crowd signals |
| **Prediction Focus** | Alerts BEFORE you leave home | Shows delays when you check the app |
| **Personalization** | Learns YOUR specific stations and transfer points | Generic route planning |
| **Rail Intelligence** | Understands "Signal Fault", "Platform Crowded", "Gate Malfunction" | Mostly understands "Delayed" or "Stopped" |
| **Low Noise** | Only alerts if YOUR line/direction is affected | General service announcements |
| **Community Validation** | Users on platform can vote/confirm status | Passive GPS data only |

---

## 2. Core Concept

### 2.1 How It Works (High-Level)

The platform operates as an **intelligent aggregator and predictor** that sits between scattered disruption data and the individual commuter. It continuously monitors sources, extracts relevant signals for rail lines, and proactively alerts only when a disruption affects the user's specific route and schedule.

**The User Flow:**
1. **Set & Forget**: User inputs "Home Station: Subang Jaya", "Work Station: KLCC", "Arrive by 9:00 AM".
2. **Background Monitor**: App scans Twitter/Reddit for "LRT", "Kelana Jaya", "Subang", "Delay" keywords.
3. **Incident Detect**: "Signal fault reported at Bangsar" (on user's route).
4. **Proactive Alert**: "Alert: LRT Signal Fault at Bangsar. Recommend leaving 15 min early."

### 2.2 three-Layer Intelligence Model

#### **Layer 1: Historical Baseline** (The Foundation)
**Contents:**
- Standard timetables (frequency) for each line.
- Station graph (Nodes = Stations, Edges = Rail Lines).
- Typical transfer times (e.g., Masjid Jamek platform transfer = 5 mins).

#### **Layer 2: External Social & Official Monitoring** (The Core Intelligence)
**Sources:**
- **Social Media:** Twitter/X, Reddit (r/malaysia). Keywords: "LRT rosak", "KJ line stuck", "MRT delay".
- **Official Channels:** @askrapidkl, @myrapidkl, @ktmkomuter.
- **Inference:** High volume of complaints about "hot" or "crowded" often precedes official delay announcements.

#### **Layer 3: In-App Community Reporting** (The Validation Layer)
**Features:**
- **Quick Report:** Users at station tapping "Train Stopped", "Crowded", "AC Broken".
- **Verification:** Users can upvote "True" or downvote reports.
- **Station Geofencing:** Only allows certain detailed reports if GPS shows user is at a station.

### 2.3 Intelligence Flow: From Data to Alert

**Step-by-step process:**
1. **Input**: Twitter user posts "Kelana Jaya line stuck at Abdullah Hukum for 10 mins!". Timestamp: 7:45 AM.
2. **AI Extraction (Gemini)**:
    - **Line**: Kelana Jaya Line.
    - **Location**: Abdullah Hukum.
    - **Issue**: "Stuck" (Delay).
    - **Severity**: Moderate (10 mins).
3. **Correlation**: Matches "Abdullah Hukum" to the station graph.
4. **Impact Analysis**: User A travels Subang -> KLCC. This route passes Abdullah Hukum. Disruption is relevant.
5. **Alert Decision**: Is User A commuting now? Yes (Target 9:00 AM). Alert User A.

---

## 3. User Personas & Scenarios

### 3.1 Primary Personas

#### **Persona 1: Sarah - The LRT Commuter**
*   **Routine**: Subang Jaya (LRT) → Pasar Seni → KL Sentral. Leaves 7:45 AM.
*   **Pain Point**: Often walks to station only to find gates closed or platform packed due to downstream fault.
*   **Donki-Wonki Value**: Gets a notification at breakfast (7:30 AM): "LRT delayed at Bangsar. Expect +20 min crowd." She orders a Grab from home instead.

#### **Persona 2: Ahmad - The Intercity Connector**
*   **Routine**: KTM (Klang) → KL Sentral → MRT (Bukit Bintang).
*   **Pain Point**: KTM frequency is low. If he misses one or it's cancelled, he's very late.
*   **Donki-Wonki Value**: "KTM Technical Issue reported at Padang Jawa." Advises him to drive to a nearby LRT station instead of waiting for the uncertain KTM.

### 3.2 User Scenarios

#### **Scenario 1: Morning Signal Fault**
1.  **7:15 AM**: Official RapidKL tweet: "Trains moving slowly due to signal fault."
2.  **7:20 AM**: Donki-Wonki parses tweet, identifies "Systemwide Delay" for Kelana Jaya Line.
3.  **7:21 AM**: User's phone vibrates. "Alert: Signal Fault on your line. Travel time +25 mins."
4.  **Action**: User leaves earlier or takes alternative transport.

#### **Scenario 2: The "Ghost" Train**
1.  **6:00 PM**: Rush hour. User checking app shows "Good Service" on official screens.
2.  **6:05 PM**: 50 users on Twitter posting "Train not moving at KLCC for 15 mins".
3.  **6:10 PM**: App calculates "High Confidence" of delay despite lack of official statement.
4.  **Action**: Notification "Possible Service Interruption detected at KLCC. 50+ reports." User decides to have dinner first instead of queuing.

---

## 4. Features

### 4.1 User-Facing Features

#### **Onboarding & Route Setup**
*   **Route Definition**: Select "Home Station" and "Office Station".
*   **Schedule**: "Monday-Friday, Arrive by 9 AM".
*   **Calendar Link**: Sync Google Calendar for one-off trips (e.g., "Meeting at TRX Exchange"). App suggests departure based on MRT TRX status.

#### **Alert System**
*   **Proactive Notification**: "Leave by 7:40 AM to reach by 9:00 AM (Delay detected)."
*   **Content**: Incident cause, predicted delay, relevance (why am I seeing this?).
*   **Credibility Score**: "High (Official Confirmed)" vs "Medium (Crowd Reported)".

### 4.2 Community Features

#### **Incident Reporting**
*   **Station Check-in**: Detects user is at station. Prompts: "How is the crowd?"
*   **Quick Buttons**: [Train Stopped] [Skipping Station] [Gate Broken].
*   **Karma System**: Points for accurate reports. "Trusted Reporter" badge.

---

## 5. Technical Architecture

### 5.1 System Components

**Serverless Mobile-First Architecture**

```mermaid
graph TB
    subgraph "Client Layer"
        A[Mobile App - React Native]
        A1[Push Notifications]
    end
    
    subgraph "Intelligence Layer"
        D1[Gemini API - Text Extraction]
        D2[Rail Graph Engine]
        D3[Geofence Service]
    end
    
    subgraph "Data Sources"
        C1[Social Media (Reddit/Twitter) Scraper]
        C2[Official Rail APIs (Prasarana/KTM)]
        C3[Community Reports]
    end
    
    subgraph "Backend"
        B[Firebase Cloud Functions]
        E[(Firestore Database)]
    end
    
    C1 -->|Raw Text| D1
    D1 -->|Structured Incident| B
    B -->|Store/Update| E
    E -->|Route Match| D2
    D2 -->|Targeted Alert| A1
    A -->|Report Incident| C3
    C3 --> B
```

### 5.2 Tech Stack (Free/Low Cost)

*   **App**: React Native (Cross-platform).
*   **Backend**: Firebase (Auth, Firestore, Cloud Functions).
*   **AI**: Gemini 1.5 Flash (Text extraction from social posts).
*   **Maps**: OpenStreetMap (Station locations).
*   **Notification**: Firebase Cloud Messaging (FCM).

### 5.3 Data Strategy

*   **Extraction**:
    *   **Prompt**: "Extract rail line (e.g., KJ), station, and issue from: '{tweet}'."
*   **Route Matching**:
    *   Graph logic: If delay at Node C, affects path A->B->C->D.
*   **Geospatial**:
    *   Stations mapped as Geofences (Radius 200m).
    *   Users inside geofence prompted for validation.
