import { useState } from 'react';
import { FaChevronRight, FaArrowUp, FaArrowDown } from 'react-icons/fa';
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

function getRequirement(cls) {
    if (!cls) return null;
    if (cls.rank) return `${cls.rank} Rank`;
    if (cls.level > 0) return `Level ${cls.level}`;
    if (cls.cost > 0) return `${cls.cost.toLocaleString()} Tokens`;
    return null;
}

function ClassCard({ entry, category }) {
    const { class_id, games, wins } = entry;
    const cls  = CLASSES.get(class_id);
    const name = cls?.name ?? `Class ${class_id}`;
    const wr   = games > 0 ? Math.round((wins / games) * 100) : null;
    const req  = getRequirement(cls);

    return (
        <div className={`cs-card cs-card--${category.toLowerCase()}`}>
            <div className="cs-name">{name}</div>
            <div className="cs-winrate-row">
                <span className="cs-winrate-value">{wr === null ? '—' : `${wr}%`}</span>
                <span className="cs-winrate-label">Win Rate</span>
            </div>
            <div className="cs-substats">
                <span><strong>{games.toLocaleString()}</strong> games</span>
                <span><strong>{wins.toLocaleString()}</strong> wins</span>
            </div>
            {req && (
                <div className="cs-req">
                    <span className="cs-req-label">Requires</span>
                    <span className="cs-req-value">{req}</span>
                </div>
            )}
        </div>
    );
}

function requirementValue(entry) {
    const cls = CLASSES.get(entry.class_id);
    return cls?.cost ?? cls?.level ?? 0;
}

// Each comparator's "natural" direction, i.e. what it returns before any flipping —
// win rate reads best-first by default, A–Z and cost/level read lowest-first.
const SORT_FNS = {
    winrate:     (a, b) => (b.games > 0 ? b.wins / b.games : 0) - (a.games > 0 ? a.wins / a.games : 0),
    alpha:       (a, b) => (CLASSES.get(a.class_id)?.name ?? '').localeCompare(CLASSES.get(b.class_id)?.name ?? ''),
    requirement: (a, b) => requirementValue(a) - requirementValue(b),
};
const NATURAL_DIR = { winrate: 'desc', alpha: 'asc', requirement: 'asc' };

const CATEGORY_SORT_OPTIONS = {
    Token: [['winrate', 'Win Rate'], ['alpha', 'A–Z'], ['requirement', 'Cost']],
    Level: [['winrate', 'Win Rate'], ['alpha', 'A–Z'], ['requirement', 'Level']],
};
const DEFAULT_SORT_OPTIONS = [['winrate', 'Win Rate'], ['alpha', 'A–Z']];

function CategoryGroup({ name, entries }) {
    const [open, setOpen] = useState(true);
    const [sort, setSort] = useState('winrate');
    // Direction is tracked per sort key so switching keys doesn't carry over a flip
    // that made sense for the old key (e.g. Desc on Win Rate) but not the new one.
    const [dirBySort, setDirBySort] = useState(NATURAL_DIR);
    const sortOptions = CATEGORY_SORT_OPTIONS[name] ?? DEFAULT_SORT_OPTIONS;
    const dir = dirBySort[sort];
    const comparator = (a, b) => {
        const base = SORT_FNS[sort](a, b);
        return dir === NATURAL_DIR[sort] ? base : -base;
    };

    return (
        <div className="cs-category">
            <div className="cs-category-header">
                <button className="cs-category-toggle" onClick={() => setOpen(o => !o)}>
                    <FaChevronRight className={`cs-chevron${open ? ' cs-chevron-open' : ''}`} />
                    <span className="cs-category-name">{name}</span>
                    <span className="cs-category-count">{entries.length} class{entries.length !== 1 ? 'es' : ''}</span>
                </button>
                <div className="cs-category-sort-btns">
                    {sortOptions.map(([key, label]) => (
                        <button
                            key={key}
                            className={`cs-sort-btn${sort === key ? ' active' : ''}`}
                            onClick={() => setSort(key)}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        className="cs-sort-dir-btn"
                        aria-label={dir === 'asc' ? 'Sorted ascending, click for descending' : 'Sorted descending, click for ascending'}
                        onClick={() => setDirBySort(d => ({ ...d, [sort]: dir === 'asc' ? 'desc' : 'asc' }))}
                    >
                        {dir === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
                    </button>
                </div>
            </div>
            {open && (
                <div className="cs-grid">
                    {[...entries].sort(comparator).map(e => <ClassCard key={e.class_id} entry={e} category={name} />)}
                </div>
            )}
        </div>
    );
}

function ClassStats({ data, loading, error }) {
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
            </div>
            <div className="cs-categories">
                {categories.map(cat => (
                    <CategoryGroup key={cat} name={cat} entries={grouped[cat]} />
                ))}
            </div>
        </div>
    );
}

export default ClassStats;
