import { API_URL as BASE } from './config.js';

export async function fetchLeaderboard(category) {
    const res = await fetch(`${BASE}/leaderboard?category=${category}`);
    if (!res.ok) throw new Error("Failed to load leaderboard data.");
    return res.json();
}
