import { API_URL as BASE } from './config.js';

async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) { const err = new Error('Failed to fetch'); err.status = res.status; throw err; }
    return res.json();
}

export async function fetchProfile(name) {
    const [playerRes, favclassRes, parkourRes, gamesRes] = await Promise.all([
        fetch(`${BASE}/stats/${name}`),
        fetch(`${BASE}/stats/${name}/favclass`),
        fetch(`${BASE}/stats/${name}/parkour`),
        fetch(`${BASE}/stats/${name}/games`),
    ]);
    if (!playerRes.ok) throw new Error(playerRes.status === 404
        ? "Couldn't find the player you're looking for. Try checking the spelling."
        : "Failed to load player profile.");
    const [player, favclass, parkourData, gamesData] = await Promise.all([
        playerRes.json(),
        favclassRes.ok ? favclassRes.json() : Promise.resolve(null),
        parkourRes.ok ? parkourRes.json() : Promise.resolve(null),
        gamesRes.ok ? gamesRes.json() : Promise.resolve(null),
    ]);
    return {
        player,
        favclass,
        parkour: parkourData?.parkour ?? null,
        games: gamesData?.games ?? [],
    };
}

export async function fetchMatch(id) {
    const res = await fetch(`${BASE}/stats/match/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(res.status === 404 ? 'Match not found.' : 'Failed to load match.');
    return res.json();
}

export async function fetchRecentMatches() {
    const res = await fetch(`${BASE}/stats/recent-matches`);
    if (!res.ok) throw new Error("Failed to load recent matches.");
    return res.json();
}

export const fetchArchetype      = (name) => get(`/stats/${name}/archetype`);
export const fetchRecommendation = (name) => get(`/stats/${name}/recommend`);
export const fetchPlayerCluster  = (name) => get(`/stats/${encodeURIComponent(name)}/cluster`);
export const fetchWinPrediction  = (name) => get(`/stats/${name}/predict-win`);
export const fetchClusterMap     = () => get('/stats/cluster-map');

export const fetchTrend = (name, classId = null) =>
    get(`/stats/${name}/trend${classId ? `?class_id=${classId}` : ''}`);

export async function fetchGamePrediction(players) {
    const res = await fetch(`${BASE}/stats/predict-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.error || res.statusText || String(res.status));
        err.status = res.status;
        throw err;
    }
    return res.json();
}

export async function fetchClassStats() {
    const res = await fetch(`${BASE}/stats/class-stats`);
    if (!res.ok) throw new Error('Failed to load class stats.');
    return res.json();
}
