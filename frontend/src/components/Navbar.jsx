import { useLocation } from "react-router-dom";
import './Navbar.css';
import { FaShoppingCart } from "react-icons/fa";

const Navbar = () => {
    const isHomePage = useLocation().pathname === "/";
    return (
        <nav className="navbar" 
        style={{
        backgroundColor: isHomePage ? "transparent" : "rgb(224, 147, 4)",
        }}>
            <div className="navbar-left">
                <a href="/">
                    <img src="/minezonelogo.png" alt="logo" className="logo" width="64" height="64"></img>
                </a>
            </div>
            <div className="navbar-center">
                <ul className="nav-links">
                    <li>
                        <a href="/">Home</a>
                    </li>
                    <li>
                        <a href="/games">Games</a>
                    </li>
                    <li>
                        <a href="/leaderboards">Leaderboards</a>
                    </li>
                    <li>
                        <a href="/stats">Stats</a>
                    </li>
                    <li>
                        <a href="https://discord.com/invite/3J32tT9Zhp" target="_blank">Discord</a>
                    </li>
                    <li>
                        <a href="/stats">Support</a>
                    </li>
                    <li>
                        <a href="https://minezone.tebex.io" target="_blank">Store</a>
                    </li>
                </ul>
            </div>
            <div className="navbar-right">
                <a href="https://minezone.tebex.io" target="_blank"><FaShoppingCart /></a>
                {/*<a href="/profile">Profile</a>*/}
            </div>
        </nav>
    );
};

export default Navbar;