import '../../App.css';
import scbImg from '../../assets/scb.png';
import fishingImg from '../../assets/fishing.png';
import parkour2Img from '../../assets/parkour2.png';

const games = [
    {
        title: "Fishing",
        description: "Take a break and discover rare fish and hidden treasures across the lobby.",
        bullets: [
            "100+ fish and treasures to discover",
            "Earn EXP and Tokens as you fish to speed up progression",
            "Different fishing spots offer unique catches",
            "Unlock exclusive rewards and cosmetics",
            "Compete for the top spot on the fishing leaderboard",
        ],
        img: fishingImg,
    },
    {
        title: "Super Craft Bros",
        featured: true,
        description: "Fast-paced PvP where every class has unique abilities and playstyles. Outsmart your opponents, secure powerful drops, and be the last player standing.",
        bullets: [
            "Over 60 unique classes and maps to master",
            "Start with 5 lives and be the last one standing to win",
            "Collect powerful items from lightning drops",
            "Challenge friends in 1v1 duels",
            "Get a random kit each life in Frenzy mode, including ones you don't own",
        ],
        img: scbImg,
    },
    {
        title: "Parkour",
        description: "Take on challenging parkour courses and push for the fastest time on the leaderboard.",
        bullets: [
            "Compete for the fastest time on the leaderboard",
            "Race your friends to see who's best",
            "Earn prizes for completing courses",
        ],
        img: parkour2Img,
    },
];

export function Games() {
    return (
        <div className="gc-grid">
            {games.map((game, i) => (
                <div key={i} className={`gc-card${game.featured ? ' gc-card-featured' : ''}`}>
                    <img src={game.img} alt={game.title} className="gc-img" />
                    <div className="gc-content">
                        <h2 className="gc-title">{game.title}</h2>
                        <p className="gc-desc">{game.description}</p>
                        <ul className="gc-bullets">
                            {game.bullets.map((b, j) => (
                                <li key={j}>{b}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}
