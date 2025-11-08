import '../App.css'
import './home.css'
import Navbar from "../components/Navbar";
import CopyLinkButton from '../components/CopyLinkButton';
import NewsCard from '../components/NewsCard';
import Footer from '../components/Footer';
import { FaDiscord, FaTwitter, FaYoutube } from "react-icons/fa";

export function Home() {
    const newsPosts = [
        {
            title: "Halloween Event 2025 🎃",
            date: "October 25, 2025",
            content: "The Halloween event is live! Explore the spooky lobby, collect candy, and unlock limited-time cosmetics and rewards.",
            image: "../src/assets/halloween.png"
        },
        {
            title: "Fishing Update 🎣",
            date: "September 10, 2025",
            content: "Our new fishing system has arrived! Discover rare fish, earn EXP, and complete your collection for exclusive prizes.",
            image: "../src/assets/fishing.png"
        },
        {
            title: "Welcome to Minezone!",
            date: "August 1, 2025",
            content: "We’re thrilled to announce the launch of Minezone, featuring our flagship gamemode Super Craft Blocks. Join the fun today!",
            image: "../src/assets/scb.png"
        }
    ];

    return (
        <>
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

                {/* === Server Trailer === */}
                <section className="trailer-section">
                    <h1>Server Trailer</h1>
                    <div className="trailer-wrapper">
                        <iframe
                            className="trailer"
                            src="https://www.youtube.com/embed/0phpMgu1mH0"
                            title="Minezone Trailer - Super Craft Bros (SCB RECREATION)"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                    </div>
                </section>

                {/* === News Posts === */}
                <section className="news-section">
                    <h1>Latest News</h1>
                    <ul className="news-cards">
                        {newsPosts.map((post, i) => (
                            <NewsCard key={i} {...post} reverse={i % 2 !== 0} />
                        ))}
                    </ul>
                </section>
                <Footer></Footer>
            </div>
        </>
    );
}
