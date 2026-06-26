import { API_URL } from './config.js';

export async function fetchOverview() {
    const res = await fetch(`${API_URL}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
}

export async function fetchLevelDistribution() {
    const res = await fetch(`${API_URL}/analytics/distribution/levels`);
    if (!res.ok) throw new Error('Failed to fetch level distribution');
    return res.json();
}

export async function fetchTopByStat(category) {
    const res = await fetch(`${API_URL}/leaderboard?category=${category}`);
    if (!res.ok) throw new Error(`Failed to fetch ${category}`);
    return res.json();
}


export async function fetchWinRates() {
    const res = await fetch(`${API_URL}/analytics/winrates`);
    if (!res.ok) throw new Error('Failed to fetch win rates');
    return res.json();
}

export async function fetchAllClassStats() {
    const res = await fetch(`${API_URL}/analytics/all-class-stats`);
    if (!res.ok) throw new Error('Failed to fetch class stats');
    return res.json();
}

export async function fetchKDRatios() {
    const res = await fetch(`${API_URL}/analytics/kd-ratios`);
    if (!res.ok) throw new Error('Failed to fetch K/D ratios');
    return res.json();
}

export async function fetchMapPopularity(gameType = 'classic') {
    const res = await fetch(`${API_URL}/analytics/maps?gameType=${gameType}`);
    if (!res.ok) throw new Error('Failed to fetch map popularity');
    return res.json();
}

export async function fetchGamesOverTime() {
    const res = await fetch(`${API_URL}/analytics/over-time`);
    if (!res.ok) throw new Error('Failed to fetch games over time');
    return res.json();
}

export async function fetchGamesOverTimeByType() {
    const res = await fetch(`${API_URL}/analytics/over-time-by-type`);
    if (!res.ok) throw new Error('Failed to fetch games over time by type');
    return res.json();
}

export async function fetchPlayersOverTime() {
    const res = await fetch(`${API_URL}/analytics/players-over-time`);
    if (!res.ok) throw new Error('Failed to fetch players over time');
    return res.json();
}

export async function fetchNewPlayersOverTime() {
    const res = await fetch(`${API_URL}/analytics/new-players-over-time`);
    if (!res.ok) throw new Error('Failed to fetch new players over time');
    return res.json();
}

export async function fetchPeakHours() {
    const res = await fetch(`${API_URL}/analytics/peak-hours`);
    if (!res.ok) throw new Error('Failed to fetch peak hours');
    return res.json();
}

export async function fetchGamesByDay(date, gameType = '') {
    const params = new URLSearchParams({ date });
    if (gameType) params.set('gameType', gameType);
    const res = await fetch(`${API_URL}/analytics/games-by-day?${params}`);
    if (!res.ok) throw new Error('Failed to fetch games for that day');
    return res.json();
}

export async function fetchMapClasses(mapName, gameType = '') {
    const params = new URLSearchParams({ map: mapName });
    if (gameType) params.set('gameType', gameType);
    const res = await fetch(`${API_URL}/analytics/map-classes?${params}`);
    if (!res.ok) throw new Error('Failed to fetch classes for that map');
    return res.json();
}
