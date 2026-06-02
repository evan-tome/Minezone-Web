import '../../App.css';
import './Home.css'
import Navbar from "../../components/Navbar";
import CopyLinkButton from './CopyLinkButton';
import NewsCard from './NewsCard';
import Footer from '../../components/Footer';
import { Games } from './Games';
import { FaDiscord, FaYoutube, FaInstagram, FaTwitter, FaTiktok, FaMap, FaUser, FaMedal, FaTrophy, FaStar, FaBolt } from 'react-icons/fa';

const features = [
    { icon: <FaMap />,    title: "60+ Classes & Maps",  desc: "Dozens of unique kits and battle arenas to master" },
    { icon: <FaMedal />,  title: "Progression",         desc: "Level up, earn rewards, and track your growth over time" },
    { icon: <FaTrophy />, title: "Leaderboards",        desc: "Compete for the top spot in every game mode" },
    { icon: <FaStar />,   title: "Cosmetics",           desc: "Unlock skins, effects, and more to stand out" },
    { icon: <FaUser />,   title: "Singleplayer Modes",  desc: "Reel in rare catches while fishing or race through parkour courses" },
    { icon: <FaBolt />,   title: "Updates",             desc: "Regular content drops and improvements" },
];

const newsPosts = [
    {
        title: "Welcome to Our Website!",
        date: "May 8, 2026",
        content: "We're thrilled to announce the official launch of the Minezone website!",
        image: "../src/assets/cosmetics.png"
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
                </div>
            </div>

            {/* === About Section === */}
            <section className="page-section about-section">
                <div className="about-container">
                    <div className="about-description">
                        <h2>About Us</h2>
                        <p>
                            Minezone is a Minecraft server recreating the classic Super Craft Bros experience, along with new minigames, events, and a friendly player community. Join us and be part of something awesome!
                        </p>
                        <p className="about-socials-label">Follow us on social media</p>
                        <div className="about-socials">
                            <a href="https://discord.com/invite/3J32tT9Zhp" target="_blank" rel="noopener noreferrer" aria-label="Join our Discord"><FaDiscord aria-hidden="true" /></a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube aria-hidden="true" /></a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram aria-hidden="true" /></a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"><FaTwitter aria-hidden="true" /></a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok aria-hidden="true" /></a>
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
                    <p>Everything you need for a great Minecraft experience</p>
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
                        <p>Connect with thousands of players, get notified about events and updates, and find your next match.</p>
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
