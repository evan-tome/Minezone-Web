import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <img src="/minezonelogo.svg" alt="logo" className="logo" width="64" height="64"></img>
            </div>
            <div className="navbar-center">
                <ul className="nav-links">
                    <li>
                        <a href="/">Home</a>
                    </li>
                    <li>
                        <a href="/about">About</a>
                    </li>
                    <li>
                        <a href="/leaderboards">Leaderboards</a>
                    </li>
                    <li>
                        <a href="/stats">Stats</a>
                    </li>
                </ul>
            </div>
            <div className="navbar-right">
                <a href="https://minezone.tebex.io" target="_blank">
                    <img src="/cart.svg" alt="store" width="32" height="32"></img>
                </a>
                <a href="/profile">Profile</a>
            </div>
        </nav>
    );
};

export default Navbar;