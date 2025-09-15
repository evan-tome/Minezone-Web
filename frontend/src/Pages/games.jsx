import '../App.css'
import Navbar from "../components/Navbar";

export function Games() {
    return(
        <>
        <div className="app">
            <Navbar />
            <h1>Games</h1>
            <div className="info-cards">
                <div className="scb-info">
                    <h2>Super Craft Bros.</h2>
                    <p>SCB is a Minecraft minigame where you fight against other players using various kits. The last player standing wins!</p>
                    <div className="scb-content">
                        <ul>
                            <li>
                                <h2>Classic</h2>
                                <p>Choose a kit, 5 lives each, fight for #1, grab powerups from lightning!</p>
                            </li>
                            <li>
                                <h2>Duels</h2>
                                <p>Face off against a random player or friend to prove who's the best!</p>
                            </li>
                            <li>
                                <h2>Frenzy</h2>
                                <p>Random kits every life for a chaotic and fun experience!</p>
                            </li>
                        </ul>
                        <img src="bb"></img>
                    </div>
                </div>
                <div className="fishing-info">
                    <h2>Fishing</h2>
                    <p>Take a break from fighting and relax with some fishing, solo or with friends!</p>
                    <div className="scb-content">
                        <ul>
                            <li>
                                <h2>Catch Them All</h2>
                                <p>There are 100 different species of fish and treasures to catch!</p>
                            </li>
                            <li>
                                <h2>Discover New Areas</h2>
                                <p>Explore the lobby and discover new fishing spots. Each body of water has unique catches!</p>
                            </li>
                            <li>
                                <h2>Exclusive Rewards</h2>
                                <p>Speed up progression by fishing to earn EXP, Tokens, and exclusive rewards!</p>
                            </li>
                        </ul>
                        <img src="bb"></img>
                    </div>
                </div>
                <div className="parkour-info">
                    <h2>Parkour</h2>
                    <p>Complete fun and challenging parkour courses to earn a spot on the leaderboard</p>
                    <div className="scb-content">
                        <ul>
                            <li>
                                <h2>Jump to New Heights</h2>
                                <p>Test your parkour skills by completing parkour courses around the lobby!</p>
                            </li>
                            <li>
                                <h2>Reach the Top</h2>
                                <p>Each course has a leaderboard. Jump in now and see if you can claim a spot!</p>
                            </li>
                            <li>
                                <h2>Earn Rewards</h2>
                                <p>Gain rewards for completing parkour courses!</p>
                            </li>
                        </ul>
                        <img src="bb"></img>
                    </div>
                </div>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}