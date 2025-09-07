import '../App.css'
import Navbar from "../components/Navbar";

export function Home() {
    return(
        <>
        <div className="app">
            <header>
                <img src="minezonelogo.svg" alt="logo" width="250" height="250"></img>
            </header>
            <Navbar />
            <div className="main">
                <h1>Minezone</h1>
            </div>
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}