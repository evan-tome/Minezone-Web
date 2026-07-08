import { useState, useEffect } from "react";
import '../../App.css';
import "./Leaderboards.css";
import Navbar from "../../components/Navbar";
import LeaderboardTable from "./LeaderboardTable";
import Footer from "../../components/Footer";
import { fetchLeaderboard } from '../../api/leaderboards.js';

const CATEGORIES = [
    { key: "Wins",          label: "Wins" },
    { key: "FlawlessWins",  label: "Flawless Wins" },
    { key: "Kills",         label: "Kills" },
    { key: "BestWinstreak", label: "Best Winstreak" },
    { key: "TotalCaught",   label: "Fish Caught" },
    { key: "Level",         label: "Level" },
];

export function Leaderboards() {
    const [playersData, setPlayersData] = useState([]);
    const [categoryKey, setCategoryKey] = useState("Wins");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchLeaderboard(categoryKey)
            .then(data => {
                setPlayersData(data);
                setLoading(false);
            })
            .catch(() => {
                setError("We couldn't reach the server. Please try again later.");
                setLoading(false);
            });
    }, [categoryKey]);

    return (
        <div className="app dark-page">
            <Navbar />
            <main className="main">
                <h1>Leaderboards</h1>
                <LeaderboardTable
                    players={playersData}
                    categoryKey={categoryKey}
                    onCategoryChange={setCategoryKey}
                    categories={CATEGORIES}
                    loading={loading}
                    error={error}
                />
                <p className="lb-disclaimer">Stats refresh every minute.</p>
            </main>
            <Footer />
        </div>
    );
}
