import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import '../../App.css';
import "./Leaderboards.css";
import Navbar from "../../components/Navbar";
import Leaderboard from "./Leaderboard";
import Footer from "../../components/Footer";
import { fetchLeaderboard } from '../../api/leaderboards.js';

export function Leaderboards() {
  const categories = [
    "Wins",
    "FlawlessWins",
    "Kills",
    "BestWinstreak",
    "TotalCaught",
    "Level",
  ];

  const categoryLabels = {
    Wins: "Wins",
    FlawlessWins: "Flawless Wins",
    Kills: "Kills",
    BestWinstreak: "Best Winstreak",
    TotalCaught: "Fish Caught",
    Level: "Level",
  };

  const [playersData, setPlayersData] = useState([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [error, setError] = useState(null);
  const categoryData = categories[categoryIndex];

  useEffect(() => {
    setError(null);
    fetchLeaderboard(categoryData)
      .then(data => setPlayersData(data))
      .catch(() => setError("We couldn't reach the server. Please try again later."));
  }, [categoryData]);

  const nextCategory = () => {
    setCategoryIndex((prev) => (prev + 1) % categories.length);
  };

  const prevCategory = () => {
    setCategoryIndex((prev) =>
      prev === 0 ? categories.length - 1 : prev - 1
    );
  };

  return (
    <div className="app dark-page">
      <Navbar />
      <div className="main">
        <h1>Leaderboards</h1>

        <div className="category-nav">
          <button className="arrow-btn" onClick={prevCategory}>
            <FaChevronLeft />
          </button>

          <div className="category-buttons">
            {categories.map((cat, index) => (
              <button
                key={cat}
                className={`category-btn ${categoryIndex === index ? "active" : ""}`}
                onClick={() => setCategoryIndex(index)}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          <button className="arrow-btn" onClick={nextCategory}>
            <FaChevronRight />
          </button>
        </div>

        <Leaderboard
          players={playersData}
          categoryKey={categoryData}
          error={error}
        />

        <p className="lb-disclaimer">Stats refresh every minute.</p>
      </div>

      <Footer />
    </div>
  );
}
