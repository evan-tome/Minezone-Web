# Minezone Web

Website for [Minezone](https://minezone.club), a Minecraft server running Super Craft Bros.

## What it does

The server generates a lot of data across thousands of matches: kills, wins, map picks, class selections, parkour times, fishing records. Without a way to actually look at that data, it just sits in a database. This site changes that. Players can look up their own stats (K/D, win rate, favorite classes, parkour times, fishing records), browse leaderboards, and review recent match history. The analytics page gives a server-wide view of game data: map popularity, peak hours, class usage, and player level distribution. The Labs section adds ML features on top of that, including player clustering, archetype detection, class recommendations, and win prediction.

## Stack

- **Frontend:** React + Vite, Recharts, React Router
- **Backend:** Express.js, MySQL2
- **ML service:** Flask + scikit-learn (K-means clustering, archetypes, win prediction)
- **Deployed on:** Azure Container Apps

## Project structure

```
frontend/   React app
backend/    Express API (routes for stats, analytics, leaderboards)
ml/         Flask app - trained models, cluster map, win predictor
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
