# Minezone Website

Website for [Minezone](https://minezone.club), a Minecraft server running Super Craft Bros.

## What it does

The server generates a lot of data across thousands of matches: kills, wins, map picks, class selections, parkour times, fishing records. Without a way to actually look at that data, it just sits in a database. This site changes that. Players can look up their own stats (K/D, win rate, favorite classes, parkour times, fishing records), browse leaderboards, and review recent match history. The analytics page gives a server-wide view of game data: map popularity, peak hours, class usage, and player level distribution. The Labs section adds ML features on top of that, including player clustering, archetype detection, class recommendations, and win prediction.

## Features

Leaderboards
<img width="1849" height="874" alt="image" src="https://github.com/user-attachments/assets/91e50d0f-2070-4ed2-b5ff-a6e1bf60ae75" />

Player Stats
<img width="1846" height="877" alt="image" src="https://github.com/user-attachments/assets/071dc72c-7291-4b65-8720-1be5d5b01fd8" />

Recent Match History
<img width="1849" height="877" alt="image" src="https://github.com/user-attachments/assets/002f37b4-7ee4-4d2c-bbdf-49f4e0e3b3d3" />

Performance Analysis
<img width="1843" height="873" alt="image" src="https://github.com/user-attachments/assets/0917d553-3059-4adf-a863-7b8235e71b39" />

Machine Learning Insights
<img width="1846" height="875" alt="image" src="https://github.com/user-attachments/assets/b04c34fc-06e4-453a-a6c1-3ec0f1884625" />

Server Analytics Dashboards
<img width="1848" height="874" alt="image" src="https://github.com/user-attachments/assets/b1765a79-19a9-4313-91b7-3787d99e3e2f" />
<img width="1841" height="846" alt="image" src="https://github.com/user-attachments/assets/484e75aa-5373-43a8-92fa-37e8785365f6" />


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
