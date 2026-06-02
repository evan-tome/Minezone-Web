import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../App.css';

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

function GameCardCenter({ game }) {
    return (
        <div className="gc-card gc-card-center">
            <img src={game.img} alt={game.title} className="gc-img" />
            <div className="gc-content gc-content-center">
                <h2 className="gc-title">{game.title}</h2>
                <p className="gc-desc">{game.description}</p>
                <div className="gc-features">
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
    );
}

function GameCardSide({ game, onClick }) {
    return (
        <button type="button" className="gc-card gc-card-side" onClick={onClick} aria-label={`View ${game.title}`}>
            <img src={game.img} alt="" className="gc-img" />
            <div className="gc-content gc-content-side">
                <h3 className="gc-title-side">{game.title}</h3>
                <p className="gc-desc gc-desc-side">{game.description}</p>
            </div>
        </button>
    );
}

export function Games() {
    const [current, setCurrent] = useState(0);

    const n = games.length;
    const prevIdx = (current - 1 + n) % n;
    const nextIdx = (current + 1) % n;

    return (
        <div className="game-carousel">
            <div className="gc-track-wrapper">
                <button className="carousel-btn gc-btn-left" onClick={() => setCurrent(prevIdx)} aria-label="Previous game">
                    <FaChevronLeft aria-hidden="true" />
                </button>
                <div className="gc-track">
                    <div className="gc-slot gc-slot-side">
                        <GameCardSide key={prevIdx} game={games[prevIdx]} onClick={() => setCurrent(prevIdx)} />
                    </div>
                    <div className="gc-slot gc-slot-center">
                        <GameCardCenter key={current} game={games[current]} />
                    </div>
                    <div className="gc-slot gc-slot-side">
                        <GameCardSide key={nextIdx} game={games[nextIdx]} onClick={() => setCurrent(nextIdx)} />
                    </div>
                </div>
                <button className="carousel-btn gc-btn-right" onClick={() => setCurrent(nextIdx)} aria-label="Next game">
                    <FaChevronRight aria-hidden="true" />
                </button>
            </div>

            <div className="gc-dots">
                {games.map((_, i) => (
                    <button
                        key={i}
                        className={`gc-dot${i === current ? ' gc-dot-active' : ''}`}
                        onClick={() => setCurrent(i)}
                        aria-label={games[i].title}
                        aria-current={i === current ? 'true' : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
