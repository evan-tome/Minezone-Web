import '../App.css'
import Navbar from "../components/Navbar";

export function Games() {
    return(
        <>
        <div className="app">
            <Navbar />
            <h1>Games</h1>
            <div className="scb-info">
                <h2>SCB</h2>
                <p>SUPER CRAFT BROS. is a Minecraft minigame where you fight against other players using various kits. The last player standing wins!</p>
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
                            <p>Random kits per life</p>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="fishing-info">
                <h2>Fishing</h2>
                <p>SUPER CRAFT BROS. is a Minecraft minigame where you fight against other players using various kits. The last player standing wins!</p>
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
                            <p>Random kits per life</p>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="parkour-info">
                <h2>Parkour</h2>
                <p>SUPER CRAFT BROS. is a Minecraft minigame where you fight against other players using various kits. The last player standing wins!</p>
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
                            <p>Random kits per life</p>
                        </li>
                    </ul>
                </div>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}