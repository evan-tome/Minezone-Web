import { API_URL as BASE } from './config.js';

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
