import '../../App.css';
import './stats.css'
import Navbar from "../../components/Navbar";
import Searchbar from '../../components/Searchbar';
import PlayerStats from '../../components/PlayerStats';
import ErrorScreen from '../../components/ErrorScreen';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../../components/Footer';
import Pattern from '../../components/Pattern';

export function Stats() {
    const [playerData, setPlayerData] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { username } = useParams();

    const fetchPlayer = (name) => {
        fetch(`http://localhost:8080/stats/${name}`)
            .then(res => {
                if (!res.ok) {
                    setPlayerData(null);
                    throw new Error("Couldn't find the player you're looking for. Try checking the spelling.");
                }
                setError(null);
                return res.json();
            })
            .then(data => setPlayerData(data))
            .catch(err => setError(err.message));
    };

    useEffect(() => {
        if (username) {
            fetchPlayer(username);
        }
    }, [username])

    const handleSearch = (name) => {
        navigate(`/stats/${name}`);
    };

    return(
        <div className="app dark-page">
            <Pattern />
            <Navbar />
            <div className="main stats-main">
                <div className="stats-header">
                    <h1>Player Stats</h1>
                    <p>Look up a player to view their stats</p>
                </div>
                <Searchbar onSearch={handleSearch}/>

                {error && <ErrorScreen title="Player not found" message={error} />}
                {playerData && <PlayerStats player={playerData}/>}
            </div>
            <Footer></Footer>
        </div>
    );
}