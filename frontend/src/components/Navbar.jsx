import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import './Navbar.css';
import { FaShoppingCart } from "react-icons/fa";
import OnlineIndicator from "./OnlineIndicator";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isHomePage = location.pathname === "/";

    const scrollToGames = () => {
        const el = document.getElementById("games");
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleGamesClick = (e) => {
        e.preventDefault();

        if (!isHomePage) {
            navigate("/");
            sessionStorage.setItem("scrollToGames", "true");
        } else {
            scrollToGames();
        }
    };

    useEffect(() => {
        if (isHomePage && sessionStorage.getItem("scrollToGames") === "true") {
            sessionStorage.removeItem("scrollToGames");
            scrollToGames();
        }
    }, [isHomePage]);

    return (
        <nav
            className="navbar"
            style={{
                backgroundColor: isHomePage
                    ? "transparent"
                    : "rgb(224, 147, 4)",
            }}
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
                    <li>
                        <a href="/">Home</a>
                    </li>

                    <li>
                        <a href="/#games" onClick={handleGamesClick}>
                            Games
                        </a>
                    </li>

                    <li>
                        <a href="/leaderboards">Leaderboards</a>
                    </li>

                    <li>
                        <a href="/stats">Stats</a>
                    </li>

                    <li>
                        <a
                            href="https://discord.com/invite/3J32tT9Zhp"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Discord
                        </a>
                    </li>

                    {/* <li>
                        <a href="/support">Support</a>
                    </li> */}

                    <li>
                        <a
                            href="https://minezone.tebex.io"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Store
                        </a>
                    </li>
                </ul>
            </div>

            <div className="navbar-right">
                <a>
                    <OnlineIndicator />
                </a>
            </div>
        </nav>
    );
};

export default Navbar;