import '../App.css'
import Navbar from "./Navbar";
import Footer from './Footer';

export function Games() {

    const games = [
        {
            title: "Super Craft Blocks",
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
            img: "../src/assets/fishing.png"
        },
        {
            title: "Parkour",
            description: "Test your movement skills on challenging courses with global leaderboards.",
            features: [
                { label: "Courses", desc: "Varying difficulty levels" },
                { label: "Leaderboards", desc: "Compete for fastest time" },
                { label: "Rewards", desc: "Earn prizes for completions" },
            ],
            img: "../src/assets/parkour.png"
        }
    ];

    return (
        <div className="game-grid">
            {games.map((game, index) => (
                <div className="game-pane" key={index}>
                    <img src={game.img} alt={game.title} />

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
            ))}
        </div>
    );
}