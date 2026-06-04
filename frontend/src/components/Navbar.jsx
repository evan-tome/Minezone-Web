import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaFlask, FaChartBar, FaBars, FaTimes } from 'react-icons/fa';
import '../App.css';
import './Navbar.css';
import OnlineIndicator from "./OnlineIndicator";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const isHomePage = location.pathname === "/";
    const ariaCurrent = (path) => location.pathname === path ? 'page' : undefined;

    const close = () => setMenuOpen(false);

    const scrollToGames = () => {
        const el = document.getElementById("games");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    const handleGamesClick = (e) => {
        e.preventDefault();
        close();
        if (isHomePage) {
            scrollToGames();
        } else {
            navigate("/");
            sessionStorage.setItem("scrollToGames", "true");
        }
    };

    useEffect(() => {
        if (isHomePage && sessionStorage.getItem("scrollToGames") === "true") {
            sessionStorage.removeItem("scrollToGames");
            scrollToGames();
        }
    }, [isHomePage]);

    useEffect(() => {
        close();
    }, [location.pathname]);

    return (
        <nav
            className="navbar"
            style={isHomePage ? { background: 'transparent', borderBottom: 'none' } : undefined}
        >
            <div className="navbar-left">
                <a href="/">
                    <img
                        src="/minezonelogo.png"
                        alt="logo"
                        className="logo"
                        width="80"
                        height="80"
                    />
                </a>
            </div>

            <div className="navbar-center">
                <ul className="nav-links">
                    <li><a href="/" aria-current={ariaCurrent('/')}>Home</a></li>
                    <li><a href="/#games" onClick={handleGamesClick}>Games</a></li>
                    <li><a href="/leaderboards" aria-current={ariaCurrent('/leaderboards')}>Leaderboards</a></li>
                    <li><a href="/stats" aria-current={ariaCurrent('/stats')}>Stats</a></li>
                    <li><a href="https://discord.com/invite/3J32tT9Zhp" target="_blank" rel="noreferrer">Discord</a></li>
                    <li><a href="https://minezone.tebex.io" target="_blank" rel="noreferrer">Store</a></li>
                </ul>
            </div>

            <div className="navbar-right">
                <a href="/labs" className="navbar-tool-btn" aria-current={ariaCurrent('/labs')}>
                    <FaFlask />
                    <span>Labs</span>
                </a>
                <a href="/analytics" className="navbar-tool-btn" aria-current={ariaCurrent('/analytics')}>
                    <FaChartBar />
                    <span>Analytics</span>
                </a>
                <OnlineIndicator />
            </div>

            <button
                className="navbar-hamburger"
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
                {menuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {menuOpen && (
                <div className="navbar-mobile-menu">
                    <ul className="mobile-nav-links">
                        <li><a href="/" onClick={close} aria-current={ariaCurrent('/')}>Home</a></li>
                        <li><a href="/#games" onClick={handleGamesClick}>Games</a></li>
                        <li><a href="/leaderboards" onClick={close} aria-current={ariaCurrent('/leaderboards')}>Leaderboards</a></li>
                        <li><a href="/stats" onClick={close} aria-current={ariaCurrent('/stats')}>Stats</a></li>
                        <li><a href="https://discord.com/invite/3J32tT9Zhp" target="_blank" rel="noreferrer" onClick={close}>Discord</a></li>
                        <li><a href="https://minezone.tebex.io" target="_blank" rel="noreferrer" onClick={close}>Store</a></li>
                        <li><a href="/labs" onClick={close} aria-current={ariaCurrent('/labs')}>Labs</a></li>
                        <li><a href="/analytics" onClick={close} aria-current={ariaCurrent('/analytics')}>Analytics</a></li>
                    </ul>
                    <div className="mobile-nav-indicator">
                        <OnlineIndicator />
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
