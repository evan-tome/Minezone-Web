import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../App.css';

export function Games() {
    const [current, setCurrent] = useState(0);

    const games = [
        {
            title: "Super Craft Bros",
            description: "The classic Minecraft PvP experience, rebuilt from the ground up. Choose from kits and fight to be the last one standing.",
            features: [
                { label: "Classic Mode", desc: "5 lives, last player standing wins" },
                { label: "Duels", desc: "1v1 any player or a friend" },
                { label: "Frenzy", desc: "Random kits every life" },
            ],
            img: "../src/assets/scb.png",
        },
        {
            title: "Fishing",
            description: "Take a break and discover rare fish and hidden treasures across the lobby.",
            features: [
                { label: "100+ Species", desc: "Fish and treasures to discover" },
                { label: "Explore", desc: "Unique catches at every spot" },
                { label: "Rewards", desc: "Earn EXP, Tokens, and more" },
            ],
            img: "../src/assets/fishing.png",
        },
        {
            title: "Parkour",
            description: "Complete fun and challenging parkour courses to earn a spot on the leaderboard.",
            features: [
                { label: "Courses", desc: "Varying difficulty levels" },
                { label: "Leaderboards", desc: "Compete for fastest time" },
                { label: "Rewards", desc: "Earn prizes for completions" },
            ],
            img: "../src/assets/parkour2.png",
        },
    ];

    const prev = () => setCurrent(i => (i === 0 ? games.length - 1 : i - 1));
    const next = () => setCurrent(i => (i + 1) % games.length);
    const game = games[current];

    return (
        <div className="game-carousel">
            <div className="game-carousel-track">
                <button className="carousel-btn" onClick={prev}><FaChevronLeft /></button>

                <div className="game-pane">
                    <img src={game.img} alt={game.title} />
                    <div className="game-content">
                        <h2>{game.title}</h2>
                        <p className="game-desc">{game.description}</p>
                        <div className="game-features">
                            {game.features.map((f, i) => (
                                <div className="feature" key={i}>
                                    <span className="bullet">›</span>
                                    <div className="feature-text">
                                        <strong>{f.label}</strong>
                                        <span>{f.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button className="carousel-btn" onClick={next}><FaChevronRight /></button>
            </div>

            <div className="carousel-tabs">
                {games.map((g, i) => (
                    <button
                        key={i}
                        className={`carousel-tab${i === current ? ' active' : ''}`}
                        onClick={() => setCurrent(i)}
                    >
                        {g.title}
                    </button>
                ))}
            </div>
        </div>
    );
}
