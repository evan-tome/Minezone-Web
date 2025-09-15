import '../App.css'
import Navbar from "../components/Navbar";
import OnlineIndicator from '../components/OnlineIndicator';
import CopyLinkButton from '../components/CopyLinkButton';

export function Home() {
    return(
        <>
        <div className="app">
            <div className="img-bg-container">
                <Navbar />
                <div className="hero">
                    <div>
                        <h1>Welcome to Minezone</h1>
                        <p id="big-desc">
                            HOME OF <br />
                            SUPER CRAFT BROS.
                        </p>
                        <p>Engage in fast-paced battles with unique kits across numerous maps. Enjoy smooth gameplay with regular updates and events. Whether you're experienced or new, Minezone's community offers endless fun and creativity. Join us for unforgettable adventures!</p>
                        <CopyLinkButton />
                    </div>
                    <img src="/minezonelogo.svg" width="500px" height="500px" />
                    {/* <OnlineIndicator /> */}
                </div>
            </div>
            <div id="games">
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
                        <iframe width="384" height="315" 
                            src="https://www.youtube.com/embed/0phpMgu1mH0" 
                            title="Minezone Trailer - Super Craft Bros (SCB RECREATION/Super Craft Bros Recreation)" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            referrerPolicy="strict-origin-when-cross-origin" 
                            allowFullScreen>
                        </iframe>
                    </div>
                </div>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}