import { API_URL } from './config.js';

async function get(path) {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

export const fetchOverview            = () => get('/analytics/overview');
export const fetchLevelDistribution   = () => get('/analytics/distribution/levels');
export const fetchTopByStat           = (category) => get(`/leaderboard?category=${category}`);
export const fetchWinRates            = () => get('/analytics/winrates');
export const fetchAllClassStats       = () => get('/analytics/all-class-stats');
export const fetchKDRatios            = () => get('/analytics/kd-ratios');
export const fetchMapPopularity       = (gameType = 'classic') => get(`/analytics/maps?gameType=${gameType}`);
export const fetchGamesOverTime       = (range) => get(`/analytics/over-time?range=${range}`);
export const fetchGamesOverTimeByType = (range) => get(`/analytics/over-time-by-type?range=${range}`);
export const fetchPlayersOverTime     = (range) => get(`/analytics/players-over-time?range=${range}`);
export const fetchTotalPlaysOverTime  = (range) => get(`/analytics/total-plays-over-time?range=${range}`);
export const fetchNewPlayersOverTime  = (range) => get(`/analytics/new-players-over-time?range=${range}`);
export const fetchPeakHours           = () => get('/analytics/peak-hours');

export function fetchGamesByDay(date, gameType = '') {
    const params = new URLSearchParams({ date });
    if (gameType) params.set('gameType', gameType);
    return get(`/analytics/games-by-day?${params}`);
}

export function fetchMapClasses(mapName, gameType = '') {
    const params = new URLSearchParams({ map: mapName });
    if (gameType) params.set('gameType', gameType);
    return get(`/analytics/map-classes?${params}`);
}
