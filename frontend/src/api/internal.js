import { API_URL as BASE } from './config.js';

export async function fetchAnomalies() {
    const res = await fetch(`${BASE}/internal/anomalies`);
    if (!res.ok) throw new Error('Failed to load anomaly data.');
    return res.json();
}

export async function fetchPipelineHealth() {
    const res = await fetch(`${BASE}/internal/pipeline-health`);
    if (!res.ok) throw new Error('Failed to load pipeline health.');
    return res.json();
}

export async function fetchBalance() {
    const res = await fetch(`${BASE}/internal/balance`);
    if (!res.ok) throw new Error('Failed to load class balance data.');
    return res.json();
}
