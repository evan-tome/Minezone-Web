import '../../App.css';
import './stats.css'
import { FaFlask, FaUsers, FaGamepad } from 'react-icons/fa';
import Navbar from "../../components/Navbar";
import Searchbar from './Searchbar';
import PlayerStats from './PlayerStats';
import RecentMatches from './RecentMatches';
import ErrorScreen from '../../components/ErrorScreen';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../../components/Footer';
import { fetchProfile, fetchRecentMatches } from '../../api/stats.js';
import { fetchOverview } from '../../api/analytics.js';

export function Stats() {
    const [tab, setTab] = useState('players');
    const [playerData, setPlayerData] = useState(null);
    const [error, setError] = useState(null);
    const [recentMatches, setRecentMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [matchesError, setMatchesError] = useState(null);
    const [overview, setOverview] = useState(null);

    const navigate = useNavigate();
    const { username } = useParams();
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

    const loadPlayer = async (name) => {
        setPlayerData(null);
        setError(null);
        try {
            const { player, favclass, parkour, games } = await fetchProfile(name);
            setPlayerData({
                ...player,
                FavClass: favclass?.ClassID ?? null,
                TotalTime: parkour?.[0]?.TotalTime ?? null,
                RecentGames: games ?? [],
            });
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (username) {
            setTab('players');
            loadPlayer(username);
        } else {
            setPlayerData(null);
            setError(null);
        }
    }, [username]);

    const handleSearch = (name) => {
        navigate(`/stats/${name}`);
    };

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
                </div>

                <div className="stats-header">
                    <h1>{tab === 'players' ? 'Player Stats' : 'Game Stats'}</h1>
                    <p>{tab === 'players' ? 'Look up a player to view their stats' : 'Recent match history'}</p>
                </div>

                {tab === 'players' && <>
                    <Searchbar onSearch={handleSearch}/>
                    <div>
                        {error && <ErrorScreen title="Player not found" message={error} />}
                        {playerData && <PlayerStats player={playerData} />}
                    </div>
                    {!playerData && !error && (
                        <>
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
                        </>
                    )}
                </>}

                {tab === 'games' && <RecentMatches matches={recentMatches} loading={matchesLoading} error={matchesError} />}
            </main>
            <Footer />
        </div>
    );
}
