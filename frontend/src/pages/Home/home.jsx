import '../../App.css';
import './home.css'
import Navbar from "../../components/Navbar";
import CopyLinkButton from '../../components/CopyLinkButton';
import NewsCard from '../../components/NewsCard';
import Footer from '../../components/Footer';
import { Games } from '../../components/Games';
import Pattern from '../../components/Pattern';
import { FaDiscord, FaYoutube, FaInstagram, FaTwitter, FaTiktok, FaMap, FaUser, FaMedal, FaTrophy, FaUsers, FaSync, FaStar } from 'react-icons/fa';

const features = [
    { icon: <FaMap />,    title: "60+ Classes & Maps",  desc: "Dozens of unique kits and battle arenas to master" },
    { icon: <FaUser />,   title: "Singleplayer Modes",   desc: "Reel in rare catches while fishing or race through parkour courses" },
    { icon: <FaMedal />,  title: "Progression",         desc: "Level up, earn rewards, and track your growth over time" },
    { icon: <FaTrophy />, title: "Leaderboards",        desc: "Compete for the top spot in every game mode" },
    { icon: <FaStar />,  title: "Cosmetics",            desc: "Unlock skins, effects, and more to stand out" },
    { icon: <FaSync />,   title: "Updates",             desc: "Regular content drops and improvements" },
];

export function Home() {
    const newsPosts = [
        {
            title: "Welcome to Our Website!",
            date: "May 8, 2026",
            content: "We're thrilled to announce the official launch of the Minezone website!",
            image: "../src/assets/cosmetics.png"
        }
    ];

    return (
        <div className="app">
                <div className="img-bg-container">
                    <Navbar />
                    <div className="hero">
                        <img src="/minezonebanner.png" width="800px" height="auto" alt="Minezone Logo" />
                        <div>
                            <p id="big-desc">
                                HOME OF <br />
                                SUPER CRAFT BROS
                            </p>
                            <CopyLinkButton />
                        </div>
                    </div>
                </div>

                <Pattern />

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
                                <a href="https://discord.com/invite/3J32tT9Zhp" target="_blank" rel="noopener noreferrer"><FaDiscord /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
                            </div>
                        </div>
                        <div className="trailer-wrapper">
                            <iframe
                                src="https://www.youtube.com/embed/0phpMgu1mH0"
                                title="Minezone Trailer - Super Craft Bros (SCB RECREATION)"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            ></iframe>
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
                        {features.map((f, i) => (
                            <div className="feature-card" key={i}>
                                <span className="feature-card-icon">{f.icon}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* === Games Section === */}
                <section id="games" className="page-section">
                    <section className="gamemodes-section">
                        <div className="section-header">
                            <h2>Games</h2>
                            <p>Jump into one of our exciting game modes</p>
                        </div>
                        <div className="gamemode-cards">
                            <Games></Games>
                        </div>
                    </section>
                </section>

                {/* === News Posts === */}
                <section className="page-section news-section">
                    <div className="section-header">
                        <h2>Latest News</h2>
                        <p>Stay up to date with what's happening on Minezone</p>
                    </div>
                    <ul className="news-cards">
                        {newsPosts.map((post, i) => (
                            <NewsCard key={i} {...post} reverse={i % 2 !== 0} />
                        ))}
                    </ul>
                </section>

                <Footer />
            </div>
    );
}
