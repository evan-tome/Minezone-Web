import { API_URL } from './config.js';

export async function fetchServerStatus() {
    const res = await fetch(`${API_URL}/server/status`);
    if (!res.ok) throw new Error('Failed to fetch server status');
    return res.json();
}
