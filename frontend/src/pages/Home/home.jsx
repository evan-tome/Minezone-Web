import '../../App.css';
import './home.css'
import cosmeticsImg from '../../assets/cosmetics.png';
import homeImg from '../../assets/homepage.png';
import Navbar from "../../components/Navbar";
import CopyLinkButton from './CopyLinkButton';
import NewsCard from './NewsCard';
import Footer from '../../components/Footer';
import { Games } from './Games';
import OnlineIndicator from '../../components/OnlineIndicator';
import { FaDiscord, FaYoutube, FaInstagram, FaTwitter, FaTiktok, FaMap, FaUser, FaMedal, FaTrophy, FaStar, FaBolt } from 'react-icons/fa';

const features = [
    { icon: <FaMap />,    title: "60+ Classes & Maps",  desc: "Various different playstyles available with each class & map" },
    { icon: <FaMedal />,  title: "Progression",         desc: "Level up, unlock classes, and earn rewards" },
    { icon: <FaTrophy />, title: "Leaderboards",        desc: "Compete for the top spot in our modes with daily/weekly/monthly/lifetime leaderboards" },
    { icon: <FaStar />,   title: "Cosmetics",           desc: "Unlock gadgets, win effects, titles, and more to stand out" },
    { icon: <FaUser />,   title: "Singleplayer Modes",  desc: "Reel in rare catches while fishing or race through parkour courses" },
    { icon: <FaBolt />,   title: "Updates",             desc: "Frequent and consistent updates providing a fresh, fun & seamless experience" },
];

const newsPosts = [
    {
        title: "Welcome to Our Website!",
        date: "June 5, 2026",
        content: "Welcome to the official Minezone website! Explore our gamemodes, track your progress with detailed stats and leaderboards, and stay up to date with the latest news and updates. More features are coming soon, so join the community and start playing today.",
        image: homeImg
    }
];

export function Home() {

    return (
        <div className="app">
            <div className="img-bg-container">
                <Navbar />
                <div className="hero">
                    <img src="/minezonebanner.png" className="hero-logo" alt="Minezone" />
                    <p className="hero-tagline">The Home of Super Craft Bros</p>
                    <CopyLinkButton />
                    <div className="hero-indicator">
                        <OnlineIndicator />
                    </div>
                </div>
            </div>

            {/* === About Section === */}
            <section className="page-section about-section">
                <div className="about-container">
                    <div className="about-description">
                        <h2>Welcome to Minezone</h2>
                        <p>
                            Minezone is home to Super Craft Bros, one of Minecraft's most unique and fast-paced PvP experiences. With over 60 classes and maps, there's always a new challenge waiting. We also offer singleplayer modes where you can take a break from the action with activities like fishing and parkour. Whether you're a longtime fan of Super Craft Bros or discovering it for the first time, join the community and start playing today!
                        </p>
                        <p className="about-socials-label">Follow us on social media</p>
                        <div className="about-socials">
                            <a href="https://discord.gg/FS2pmY9FZB" target="_blank" rel="noopener noreferrer" aria-label="Join our Discord"><FaDiscord aria-hidden="true" /></a>
                            <a href="https://www.youtube.com/@minezone6480" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube aria-hidden="true" /></a>
                            <a href="https://www.instagram.com/minezonemc" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram aria-hidden="true" /></a>
                            <a href="https://www.twitter.com/MinezoneMC" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"><FaTwitter aria-hidden="true" /></a>
                            <a href="https://www.tiktok.com/@minezonenc" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok aria-hidden="true" /></a>
                        </div>
                    </div>
                    <div className="trailer-wrapper">
                        <iframe
                            src="https://www.youtube.com/embed/0phpMgu1mH0"
                            title="Minezone Trailer - Super Craft Bros (SCB RECREATION)"
                            style={{ border: 0 }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>

            {/* === What We Offer === */}
            <section className="page-section">
                <div className="section-header">
                    <h2>What We Offer</h2>
                    <p>Everything available on Minezone</p>
                </div>
                <div className="features-grid">
                    {features.map((f) => (
                        <div className="feature-card" key={f.title}>
                            <span className="feature-card-icon">{f.icon}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* === Games Section === */}
            <section id="games" className="page-section">
                <div className="section-header">
                    <h2>Games</h2>
                    <p>Jump into one of our exciting game modes</p>
                </div>
                <div className="gamemode-cards">
                    <Games />
                </div>
            </section>

            {/* === Community CTA === */}
            <section className="page-section cta-section">
                <div className="community-cta">
                    <div className="cta-text">
                        <h3>Join the Community</h3>
                        <p>Connect with players, get notified about events and updates, and find your next match.</p>
                    </div>
                    <a
                        href="https://discord.com/invite/3J32tT9Zhp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cta-btn"
                    >
                        <FaDiscord /> Join our Discord
                    </a>
                </div>
            </section>

            {/* === News Posts === */}
            <section className="page-section news-section">
                <div className="section-header">
                    <h2>Latest News</h2>
                    <p>Stay up to date with what's happening on Minezone</p>
                </div>
                <ul className="news-cards">
                    {newsPosts.map((post, i) => (
                        <NewsCard key={post.title} {...post} reverse={i % 2 !== 0} />
                    ))}
                </ul>
            </section>

            <Footer />
        </div>
    );
}
