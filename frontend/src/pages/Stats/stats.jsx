import '../../App.css';
import './Stats.css'
import Navbar from "../../components/Navbar";
import Searchbar from './Searchbar';
import PlayerStats from './PlayerStats';
import RecentMatches from './RecentMatches';
import ErrorScreen from '../../components/ErrorScreen';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../../components/Footer';
import { fetchPlayer, fetchFavClass, fetchParkour, fetchRecentGames, fetchRecentMatches } from '../../api/stats.js';

export function Stats() {
    const [tab, setTab] = useState('players');
    const [playerData, setPlayerData] = useState(null);
    const [error, setError] = useState(null);
    const [recentMatches, setRecentMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [matchesError, setMatchesError] = useState(null);

    const navigate = useNavigate();
    const { username } = useParams();

    useEffect(() => {
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
        try {
            const player = await fetchPlayer(name);
            setPlayerData(player);
            setError(null);

            const [favClassData, parkourData, gamesData] = await Promise.all([
                fetchFavClass(name),
                fetchParkour(name),
                fetchRecentGames(name),
            ]);

            setPlayerData(prev => ({
                ...prev,
                FavClass: favClassData?.ClassID ?? null,
                TotalTime: parkourData.parkour?.[0]?.TotalTime ?? null,
                RecentGames: gamesData?.games ?? [],
            }));
        } catch (err) {
            setPlayerData(null);
            setError(err.message);
        }
    };

    useEffect(() => {
        if (username) {
            setTab('players');
            loadPlayer(username);
        }
    }, [username]);

    const handleSearch = (name) => {
        navigate(`/stats/${name}`);
    };

    return(
        <div className="app dark-page">
            <Navbar />
            <div className="main stats-main">
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
                    {error && <ErrorScreen title="Player not found" message={error} />}
                    {playerData && <PlayerStats player={playerData} />}
                </>}

                {tab === 'games' && <RecentMatches matches={recentMatches} loading={matchesLoading} error={matchesError} />}
            </div>
            <Footer></Footer>
        </div>
    );
}
