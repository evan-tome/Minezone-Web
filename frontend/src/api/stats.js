import { API_URL as BASE } from './config.js';

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

export async function fetchPlayer(name) {
    const res = await fetch(`${BASE}/stats/${name}`);
    if (!res.ok) throw new Error("Couldn't find the player you're looking for. Try checking the spelling.");
    return res.json();
}

export async function fetchFavClass(name) {
    const res = await fetch(`${BASE}/stats/${name}/favclass`);
    if (!res.ok) throw new Error("Failed to load favorite class.");
    return res.json();
}

export async function fetchParkour(name) {
    const res = await fetch(`${BASE}/stats/${name}/parkour`);
    if (!res.ok) throw new Error("Failed to load parkour data.");
    return res.json();
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

export async function fetchRecentGames(name) {
    const res = await fetch(`${BASE}/stats/${name}/games`);
    if (!res.ok) throw new Error("Failed to load recent games.");
    return res.json();
}

export async function fetchArchetype(name) {
    const res = await fetch(`${BASE}/stats/${name}/archetype`);
    if (!res.ok) {
        const err = new Error(res.statusText || String(res.status));
        err.status = res.status;
        throw err;
    }
    return res.json();
}

export async function fetchRecommendation(name) {
    const res = await fetch(`${BASE}/stats/${name}/recommend`);
    if (!res.ok) {
        const err = new Error(res.statusText || String(res.status));
        err.status = res.status;
        throw err;
    }
    return res.json();
}

export async function fetchTrend(name, classId = null) {
    const url = classId
        ? `${BASE}/stats/${name}/trend?class_id=${classId}`
        : `${BASE}/stats/${name}/trend`;
    const res = await fetch(url);
    if (!res.ok) {
        const err = new Error(res.statusText || String(res.status));
        err.status = res.status;
        throw err;
    }
    return res.json();
}

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

export async function fetchWinPrediction(name) {
    const res = await fetch(`${BASE}/stats/${name}/predict-win`);
    if (!res.ok) {
        const err = new Error(res.statusText || String(res.status));
        err.status = res.status;
        throw err;
    }
    return res.json();
}
