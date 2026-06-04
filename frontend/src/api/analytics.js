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

export async function fetchMapPopularity() {
    const res = await fetch(`${API_URL}/analytics/maps`);
    if (!res.ok) throw new Error('Failed to fetch map popularity');
    return res.json();
}

export async function fetchGamesOverTime() {
    const res = await fetch(`${API_URL}/analytics/over-time`);
    if (!res.ok) throw new Error('Failed to fetch games over time');
    return res.json();
}

export async function fetchPeakHours() {
    const res = await fetch(`${API_URL}/analytics/peak-hours`);
    if (!res.ok) throw new Error('Failed to fetch peak hours');
    return res.json();
}
