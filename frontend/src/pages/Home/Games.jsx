import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../App.css';
import scbImg from '../../assets/scb.png';
import fishingImg from '../../assets/fishing.png';
import parkour2Img from '../../assets/parkour2.png';

const games = [
    {
        title: "Super Craft Bros",
        description: "The classic Minecraft PvP experience, rebuilt from the ground up. Choose from kits and fight to be the last one standing.",
        bullets: [
            "Over 60 unique classes and maps to master",
            "Pick up powerful items from lightning drops",
            "Duel your friends in 1v1 mode",
            "Get a random kit each life in Frenzy mode including ones you don't own",
        ],
        img: scbImg,
    },
    {
        title: "Fishing",
        description: "Take a break and discover rare fish and hidden treasures across the lobby.",
        bullets: [
            "100+ fish and treasures to discover",
            "Speed up your progression with EXP and Tokens from fishing",
            "Unique catches at every fishing spot",
            "Unlock exclsusive rewards and cosmetics",
            "Compete for the top spot on the fishing leaderboard",
        ],
        img: fishingImg,
    },
    {
        title: "Parkour",
        description: "Complete fun and challenging parkour courses to earn a spot on the leaderboard.",
        bullets: [
            "Compete for the fastest time on the leaderboard",
            "Race your friends to see who's the best",
            "Earn prizes for completions",
        ],
        img: parkour2Img,
    },
];

function GameCardCenter({ game }) {
    return (
        <div className="gc-card gc-card-center">
            <img src={game.img} alt={game.title} className="gc-img" />
            <div className="gc-content gc-content-center">
                <h2 className="gc-title">{game.title}</h2>
                <p className="gc-desc">{game.description}</p>
                <ul className="gc-bullets">
                    {game.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                    ))}
                </ul>
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
