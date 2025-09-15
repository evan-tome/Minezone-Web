import { useState, useEffect } from 'react'
import '../App.css'
import Navbar from "../components/Navbar";
import Leaderboard from '../components/Leaderboard';

export function Leaderboards() {
    const [playersData, setPlayers] = useState([]);
    const [categoryData, setCategory] = useState("Wins");

    useEffect(() => {
        fetch(`http://localhost:8080/leaderboard?category=${categoryData}`)
            .then((res) => res.json())
            .then((data) => {
                setPlayers(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [categoryData]);


    return(
        <>
        <div className="app">
            <Navbar />
            <div className="main">
                <h1>Minezone</h1>
                <div class="category-selector">
                    <label for="category">Category: </label>
                    <select id="category" value={categoryData} onChange={(e) => setCategory(e.target.value)}>
                        <option value="Wins">Wins</option>
                        <option value="FlawlessWins">Flawless Wins</option>
                        <option value="Kills">Kills</option>
                        <option value="BestWinstreak">Best Winstreak</option>
                        <option value="TotalCaught">Fish Caught</option>
                    </select>
                </div>
                <Leaderboard players={playersData} category={categoryData}/>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}