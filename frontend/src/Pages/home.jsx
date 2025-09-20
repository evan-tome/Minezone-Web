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
                            SUPER CRAFT BLOCKS
                        </p>
                        <p>Join in on the fun!</p>
                        <CopyLinkButton />
                    </div>
                    <img src="/minezonelogo.png" width="500px" height="500px" />
                    {/* <OnlineIndicator /> */}
                </div>
            </div>
            <div className="info">
                <h1>About</h1>
                <span>
                    <p>Welcome to Minezone, the Minecraft server featuring Super Craft Blocks! Engage in fast-paced battles with unique kits across numerous maps. Enjoy smooth gameplay with regular updates and events. Whether you're experienced or new, Minezone's community offers endless fun and creativity. Join us for unforgettable adventures!</p>
                </span>
                <ul className="info-cards">
                    <li>
                        <div>
                            <h3>A Classic Gamemode Recreated</h3>
                            <p>Super Craft Blocks is a faithful recreation of SethBling and Minecade’s classic gamemode, Super Craft Brothers We've expanded on the original with brand-new classes, maps, and content to keep the gameplay fresh and exciting.</p>
                        </div>
                        <iframe className="trailer" width="384" height="315" 
                            src="https://www.youtube.com/embed/0phpMgu1mH0" 
                            title="Minezone Trailer - Super Craft Bros (SCB RECREATION/Super Craft Bros Recreation)" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            referrerPolicy="strict-origin-when-cross-origin" 
                            allowFullScreen>
                        </iframe>
                    </li>
                    <li>
                        <img src="bb"></img>
                        <div>
                            <h3>Level Up Your Game</h3>
                            <p>Support the server and unlock exclusive perks! Donor ranks come with unique cosmetics, quality-of-life features, and increased rewards to speed up progression.</p>
                        </div>
                    </li>
                    <li>
                        <div>
                            <h3>Singleplayer Modes</h3>
                            <p>Relax with a peaceful fishing session or test your skills on challenging parkour courses, all designed for solo play.</p>
                        </div>
                        <img src="bb"></img>
                    </li>
                </ul>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}