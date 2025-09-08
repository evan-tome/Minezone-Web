import '../App.css'
import Navbar from "../components/Navbar";
import Searchbar from '../components/Searchbar';
import PlayerStats from '../components/PlayerStats';
import { useState } from 'react'

export function Stats() {
    const [playerData, setPlayerData] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = (username) => {
        fetch(`http://localhost:8080/player?username=${username}`)
            .then(res => {
                if (!res.ok) {
                    setPlayerData(null);
                    throw new Error("Player not found!");
                }
                setError(null);
                return res.json();
            })
            .then(data => setPlayerData(data))
            .catch(err => setError(err.message));
    };

    return(
        <>
        <div className="app">
            <header>
                <img src="minezonelogo.svg" alt="logo" width="250" height="250"></img>
            </header>
            <Navbar />
            <div className="main">
                <h1>Stats Tracker</h1>
                <Searchbar onSearch={handleSearch}/>

                {error && <p style={{ color: "red" }}>{error}</p>}
                {playerData && <PlayerStats player={playerData}/>}
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}