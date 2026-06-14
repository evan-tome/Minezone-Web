import '../../App.css';
import './stats.css'
import { FaFlask, FaUsers, FaGamepad } from 'react-icons/fa';
import Navbar from "../../components/Navbar";
import Searchbar from './Searchbar';
import RecentMatches from './RecentMatches';
import ClassStats from './ClassStats';
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../../components/Footer';
import { fetchRecentMatches, fetchClassStats } from '../../api/stats.js';
import { fetchOverview } from '../../api/analytics.js';

const TAB_HEADERS = {
    players: { title: 'Player Stats',  sub: 'Look up a player to view their stats' },
    games:   { title: 'Game Stats',    sub: 'Recent match history' },
    classes: { title: 'Class Stats',   sub: 'Win rates and balance across all classes' },
};

export function Stats() {
    const location = useLocation();
    const [tab, setTab] = useState(location.state?.tab ?? 'players');
    const [recentMatches, setRecentMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [matchesError, setMatchesError] = useState(null);
    const [classData, setClassData] = useState(null);
    const [classLoading, setClassLoading] = useState(false);
    const [classError, setClassError] = useState(null);
    const [overview, setOverview] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchOverview().then(setOverview).catch(() => {});
        fetchRecentMatches()
            .then(data => {
                setRecentMatches(data?.matches ?? []);
                setMatchesLoading(false);
            })
            .catch(err => {
                console.error('Recent matches fetch failed:', err);
                setMatchesError(err.message);
                setMatchesLoading(false);
            });
    }, []);

    useEffect(() => {
        if (tab === 'classes' && !classData && !classLoading && !classError) {
            setClassLoading(true);
            fetchClassStats()
                .then(data => { setClassData(data); setClassLoading(false); })
                .catch(err => { setClassError(err.message); setClassLoading(false); });
        }
    }, [tab, classData, classLoading, classError]);

    const handleSearch = (name) => {
        navigate(`/stats/${name}`);
    };

    const { title, sub } = TAB_HEADERS[tab];

    return(
        <div className="app dark-page">
            <Navbar />
            <main className="main stats-main">
                <div className="stats-tabs">
                    <button className={`stats-tab-btn${tab === 'players' ? ' active' : ''}`} onClick={() => setTab('players')}>
                        Player Stats
                    </button>
                    <button className={`stats-tab-btn${tab === 'games' ? ' active' : ''}`} onClick={() => setTab('games')}>
                        Game Stats
                    </button>
                    <button className={`stats-tab-btn${tab === 'classes' ? ' active' : ''}`} onClick={() => setTab('classes')}>
                        Class Stats
                    </button>
                </div>

                <div className="stats-header">
                    <h1>{title}</h1>
                    <p>{sub}</p>
                </div>

                {tab === 'players' && <>
                    <Searchbar onSearch={handleSearch}/>
                    {overview && (
                        <div className="stats-overview-grid">
                            <div className="stat-card">
                                <span className="stat-card-icon"><FaUsers /></span>
                                <span className="stat-card-value">{Number(overview.totalPlayers).toLocaleString()}</span>
                                <span className="stat-card-label">Total Players</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-card-icon"><FaGamepad /></span>
                                <span className="stat-card-value">{Number(overview.totalGames).toLocaleString()}</span>
                                <span className="stat-card-label">Games Played</span>
                            </div>
                        </div>
                    )}
                    <div className="stats-labs-callout">
                        <div className="stats-labs-callout-inner">
                            <FaFlask className="stats-labs-callout-icon" />
                            <h2>Want deeper insights?</h2>
                            <p>Explore AI tools that analyze real match data to help you understand how you play and make recommendations.</p>
                            <a href="/labs" className="stats-labs-callout-btn">Try Labs</a>
                        </div>
                    </div>
                </>}

                {tab === 'games' && <RecentMatches matches={recentMatches} loading={matchesLoading} error={matchesError} />}

                {tab === 'classes' && <ClassStats data={classData} loading={classLoading} error={classError} />}
            </main>
            <Footer />
        </div>
    );
}
