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

export async function fetchTopClasses() {
    const res = await fetch(`${API_URL}/analytics/top-classes`);
    if (!res.ok) throw new Error('Failed to fetch class stats');
    return res.json();
}

export async function fetchBottomClasses() {
    const res = await fetch(`${API_URL}/analytics/bottom-classes`);
    if (!res.ok) throw new Error('Failed to fetch bottom class stats');
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
