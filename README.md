# Minezone Website

A full-stack web app for [Minezone](https://minezone.club), a Minecraft server running Super Craft Bros (a class-based PvP minigame). It turns the server's raw user and match data into player profiles, leaderboards, server-wide analytics, and ML-driven insights.

## The Problem

Minezone generated thousands of gameplay records across matches, player progression, classes, maps, and other systems, but that data was difficult to access and use.

For players, viewing their stats required navigating through multiple in-game menus, making it difficult to track overall performance, compare progress, or understand their playstyle. For developers, analyzing server activity required manually writing complex database queries, limiting their ability to identify usage patterns and make informed decisions about future updates.

This platform centralizes Minezone's gameplay data into a single web application accessible from anywhere. Players can view their complete profiles, track performance, explore leaderboards, and see active server activity directly from their browser. Developers can use aggregated analytics and insights to understand player behavior and make data-driven decisions for balancing and feature development.

## Tech Stack

- **Frontend:** React, JavaScript, HTML/CSS
- **Backend:** Node.js, Express, Python, Flask
- **Database:** MySQL
- **Data & ML:** Python, scikit-learn, pandas
- **DevOps & Cloud:** Docker, GitHub Actions, Azure

## Features

### Leaderboards
Server-wide rankings for wins, kills, winstreaks, fishing, and level.

<img width="900" alt="Leaderboards page showing sortable player rankings with avatars and rank badges" src="https://github.com/user-attachments/assets/91e50d0f-2070-4ed2-b5ff-a6e1bf60ae75" />

### Player Stats
A full profile for each player, with SCB stats, fishing and parkour records, and recent match history.

<img width="900" alt="Player profile page showing level progress, win/loss record, K/D ratio, and recent games feed" src="https://github.com/user-attachments/assets/071dc72c-7291-4b65-8720-1be5d5b01fd8" />

### Recent Match History
Browse and filter recent matches, with scoreboards for each game.

<img width="900" alt="Recent match history page with filterable list of matches and detailed scoreboards" src="https://github.com/user-attachments/assets/002f37b4-7ee4-4d2c-bbdf-49f4e0e3b3d3" />

### Performance Analysis
Tracks how a player's win rate and kills per game trend over their last 100 games, showing whether they're improving, declining, or holding steady.

<img width="900" alt="Performance trend chart showing a player's rolling win rate over their last 100 games" src="https://github.com/user-attachments/assets/0917d553-3059-4adf-a863-7b8235e71b39" />

### Machine Learning Insights (Labs)
ML-powered tools for class recommendations, win prediction, and playstyle clustering.

### Server Analytics Dashboards
A server-wide view of activity: map popularity, peak hours, player levels, and top players by category.

## Stack

- **Frontend:** React + Vite, Recharts, React Router
- **Backend:** Express.js, MySQL2
- **ML service:** Flask + scikit-learn (K-means clustering, win prediction, class recommendation)
- **Deployed on:** Azure Container Apps

## Project structure

```
frontend/   React app
backend/    Express API
ml/         Flask app
```

## Running locally

You'll need a `.env` in `backend/` with your DB credentials and `ML_URL`.

**Backend**
```bash
cd backend
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**ML service**
```bash
cd ml
pip install -r requirements.txt
python train.py   # builds models from DB, saves to disk
python main.py    # starts Flask on :8000
```

The frontend expects the backend at `http://localhost:3000` by default (set `VITE_API_URL` to override).

## Tests

```bash
cd backend
npm test
```

## Future improvements

- More analytics - deeper breakdowns and additional charts on the server analytics page
- User accounts with in-game integration, linking website logins to Minecraft accounts
- Wiki pages covering game modes, classes, and maps
- Fine-tuning the ML models for better accuracy
- A UI redesign
