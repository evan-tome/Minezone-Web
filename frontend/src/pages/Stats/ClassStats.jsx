import { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { CLASSES } from '../../utils/classes.js';
import ErrorScreen from '../../components/ErrorScreen';
import './ClassStats.css';

const CLASS_CATEGORIES = ['Free', 'Token', 'Level', 'Donor'];

function getCategory(id, cls) {
    if (id >= 101) return 'Holiday';
    if (!cls) return null;
    if (cls.rank) return 'Donor';
    if (cls.level > 0) return 'Level';
    if (cls.cost > 0) return 'Token';
    return 'Free';
}

function ClassCard({ entry }) {
    const { class_id, games, wins } = entry;
    const cls  = CLASSES.get(class_id);
    const name = cls?.name ?? `Class ${class_id}`;
    const wr   = games > 0 ? `${Math.round((wins / games) * 100)}%` : '—';

    return (
        <div className="cs-card">
            <div className="cs-name">{name}</div>
            <div className="cs-stats">
                <div className="cs-stat-row"><span className="cs-stat-label">Games Played</span><span className="cs-stat-value">{games.toLocaleString()}</span></div>
                <div className="cs-stat-row"><span className="cs-stat-label">Games Won</span><span className="cs-stat-value">{wins.toLocaleString()}</span></div>
                <div className="cs-stat-row"><span className="cs-stat-label">Win Rate</span><span className="cs-stat-value">{wr}</span></div>
            </div>
            {(cls?.cost > 0 || cls?.level > 0 || cls?.rank) && (
                <div className="cs-req-section">
                    {cls?.cost > 0 && (
                        <div className="cs-stat-row"><span className="cs-stat-label">Tokens</span><span className="cs-stat-value">{cls.cost.toLocaleString()}</span></div>
                    )}
                    {cls?.level > 0 && (
                        <div className="cs-stat-row"><span className="cs-stat-label">Level</span><span className="cs-stat-value">{cls.level}</span></div>
                    )}
                    {cls?.rank && (
                        <div className="cs-stat-row"><span className="cs-stat-label">Rank</span><span className="cs-stat-value">{cls.rank}</span></div>
                    )}
                </div>
            )}
        </div>
    );
}

const SORT_FNS = {
    winrate: (a, b) => (b.games > 0 ? b.wins / b.games : 0) - (a.games > 0 ? a.wins / a.games : 0),
    alpha:   (a, b) => (CLASSES.get(a.class_id)?.name ?? '').localeCompare(CLASSES.get(b.class_id)?.name ?? ''),
};

function CategoryGroup({ name, entries, sort }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="cs-category">
            <button className="cs-category-header" onClick={() => setOpen(o => !o)}>
                <FaChevronRight className={`cs-chevron${open ? ' cs-chevron-open' : ''}`} />
                <span className="cs-category-name">{name}</span>
                <span className="cs-category-count">{entries.length} class{entries.length !== 1 ? 'es' : ''}</span>
            </button>
            {open && (
                <div className="cs-grid">
                    {[...entries].sort(SORT_FNS[sort]).map(e => <ClassCard key={e.class_id} entry={e} />)}
                </div>
            )}
        </div>
    );
}

function ClassStats({ data, loading, error }) {
    const [sort, setSort] = useState('winrate');

    if (loading) return <p className="cs-status">Loading class stats...</p>;
    if (error)   return <ErrorScreen title="Failed to load class stats" message={error} />;
    if (!data?.length) return <p className="cs-status">No class data available.</p>;

    const grouped = {};
    for (const entry of data) {
        const cls = CLASSES.get(entry.class_id);
        if (cls?.vaulted) continue;
        const cat = getCategory(entry.class_id, cls);
        if (!cat) continue;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(entry);
    }

    const categories = CLASS_CATEGORIES.filter(c => grouped[c]?.length > 0);

    return (
        <div className="cs-section">
            <div className="cs-section-header">
                <h2>Class Stats</h2>
                <div className="cs-sort-btns">
                    <button className={`cs-sort-btn${sort === 'winrate' ? ' active' : ''}`} onClick={() => setSort('winrate')}>Win Rate</button>
                    <button className={`cs-sort-btn${sort === 'alpha' ? ' active' : ''}`} onClick={() => setSort('alpha')}>A–Z</button>
                </div>
            </div>
            <div className="cs-categories">
                {categories.map(cat => (
                    <CategoryGroup key={cat} name={cat} entries={grouped[cat]} sort={sort} />
                ))}
            </div>
        </div>
    );
}

export default ClassStats;
