import '../App.css'
import './home.css'
import Navbar from "../components/Navbar";
import CopyLinkButton from '../components/CopyLinkButton';
import NewsCard from '../components/NewsCard';
import Footer from '../components/Footer';
import { Games } from '../components/Games';

export function Home() {
    const newsPosts = [
        {
            title: "Welcome to Our Website!",
            date: "May 8, 2026",
            content: "We're thrilled to announce the official launch of the Minezone website!",
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
                    <div className="section-header">
                        <h2>Server Trailer</h2>
                        <p>See what Minezone has to offer</p>
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
                </section>

                {/* === Gamemodes Section === */}
                <section id="games">
                    <section className="gamemodes-section">
                        <div className="section-header">
                            <h2>What We Offer</h2>
                            <p>Jump into one of our exciting game modes</p>
                        </div>
                        <div className="gamemode-cards">
                            <Games></Games>
                        </div>
                    </section>
                </section>

                {/* === News Posts === */}
                <section className="news-section">
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
        </>
    );
}
