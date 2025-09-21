import '../App.css'
import Navbar from "../components/Navbar";
import Searchbar from '../components/Searchbar';
import PlayerStats from '../components/PlayerStats';
import ErrorScreen from '../components/ErrorScreen';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';

export function Stats() {
    const [playerData, setPlayerData] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { username } = useParams();

    const fetchPlayer = (name) => {
        fetch(`http://localhost:8080/player?username=${name}`)
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
        <>
        <div className="app">
            <Navbar />
            <div className="main">
                <h1>Player Search</h1>
                <Searchbar onSearch={handleSearch}/>

                {error && <ErrorScreen message={error} />}
                {playerData && <PlayerStats player={playerData}/>}
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}