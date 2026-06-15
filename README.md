# Minezone Website

A full-stack web app for [Minezone](https://minezone.club), a Minecraft server running Super Craft Bros (a class-based PvP minigame). It turns the server's raw user and match data into player profiles, leaderboards, server-wide analytics, and ML-driven insights.

## What it does

The server generates a lot of data across thousands of matches: kills, wins, map picks, class selections, parkour times, fishing records. Without a way to look at that data, it just sits in a database. This site changes that:

- **Player stats** - K/D, win rate, favorite classes, parkour times, and fishing records for every player
- **Leaderboards** - server-wide rankings across all of the above
- **Match history** - browse recent games and review what happened
- **Analytics** - a server-wide view of game data: map popularity, peak hours, class usage, and player level distribution
- **Labs** - tools built on top of that data, including ML-driven class recommendations, win prediction, and playstyle clustering, plus performance trend tracking and player archetypes

## Features

### Leaderboards
Server-wide rankings for wins, kills, winstreaks, fishing, and level.

<img width="900" alt="Leaderboards page showing sortable player rankings with avatars and rank badges" src="https://github.com/user-attachments/assets/91e50d0f-2070-4ed2-b5ff-a6e1bf60ae75" />

### Player Stats
A full profile for each player, with SCB stats, fishing and parkour records, and recent match history.

<img width="900" alt="Player profile page showing level progress, win/loss record, K/D ratio, and recent games feed" src="https://github.com/user-attachments/assets/071dc72c-7291-4b65-8720-1be5d5b01fd8" />

### Recent Match History
Browse and filter recent matches, with full scoreboards for each game.

<img width="900" alt="Recent match history page with filterable list of matches and detailed scoreboards" src="https://github.com/user-attachments/assets/002f37b4-7ee4-4d2c-bbdf-49f4e0e3b3d3" />

### Performance Analysis
Tracks how a player's win rate and kills per game trend over their last 100 games, showing whether they're improving, declining, or holding steady.

<img width="900" alt="Performance trend chart showing a player's rolling win rate over their last 100 games" src="https://github.com/user-attachments/assets/0917d553-3059-4adf-a863-7b8235e71b39" />

### Machine Learning Insights (Labs)
ML-powered tools for class recommendations, win prediction, and playstyle clustering.

<img width="900" alt="Labs page showing ML-driven win prediction, class recommendations, and playstyle clustering" src="https://github.com/user-attachments/assets/b04c34fc-06e4-453a-a6c1-3ec0f1884625" />

### Server Analytics Dashboards
A server-wide view of activity: map popularity, peak hours, player levels, and top players by category.

<img width="900" alt="Server analytics dashboard with overview cards and charts for map popularity and peak hours" src="https://github.com/user-attachments/assets/b1765a79-19a9-4313-91b7-3787d99e3e2f" />
<img width="900" alt="Server analytics dashboard continued, showing player level distribution and top players by category" src="https://github.com/user-attachments/assets/484e75aa-5373-43a8-92fa-37e8785365f6" />


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
