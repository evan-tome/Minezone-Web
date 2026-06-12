import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PlayerStats from './PlayerStats';
import Searchbar from './Searchbar';
import ErrorScreen from '../../components/ErrorScreen';
import { fetchProfile } from '../../api/stats';
import { FaArrowLeft } from 'react-icons/fa';
import '../../App.css';
import '../Match/Match.css';

export function PlayerProfile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [playerData, setPlayerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchProfile(username)
            .then(({ player, favclass, parkour, games }) => {
                setPlayerData({
                    ...player,
                    FavClass: favclass?.ClassID ?? null,
                    BestClass: favclass?.BestClassID ?? null,
                    TotalTime: parkour?.[0]?.TotalTime ?? null,
                    RecentGames: games ?? [],
                });
                setLoading(false);
            })
            .catch(err => {
                setPlayerData(null);
                setError(err.message);
                setLoading(false);
            });
    }, [username]);

    return (
        <div className="app dark-page">
            <Navbar />
            <main className="main match-main">
                <div className="match-topbar">
                    <Link to="/stats" className="match-back-link">
                        <FaArrowLeft aria-hidden="true" />
                        Player Stats
                    </Link>
                </div>
                <Searchbar onSearch={(name) => navigate(`/stats/${name}`)} />
                {loading && !playerData && <p className="match-status">Loading player...</p>}
                {error && <ErrorScreen title="Player not found" message={error} />}
                {playerData && <PlayerStats player={playerData} loading={loading} />}
            </main>
            <Footer />
        </div>
    );
}
