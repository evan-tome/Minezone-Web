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
                    <p>Welcome to Minezone, the Minecraft server featuring Super Craft Bros.! Engage in fast-paced battles with unique kits across numerous maps. Enjoy smooth gameplay with regular updates and events. Whether you're experienced or new, Minezone's community offers endless fun and creativity. Join us for unforgettable adventures!</p>
                </span>
                <iframe className="trailer" width="384" height="315" 
                    src="https://www.youtube.com/embed/0phpMgu1mH0" 
                    title="Minezone Trailer - Super Craft Bros (SCB RECREATION/Super Craft Bros Recreation)" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen>
                </iframe>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}