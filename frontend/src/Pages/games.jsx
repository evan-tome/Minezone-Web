import { useState } from "react";
import '../App.css'
import './games.css'
import Navbar from "../components/Navbar";

export function Games() {
    const [selectedGame, setSelectedGame] = useState("scb");

    const games = {
        scb: {
            title: "Super Craft Blocks",
            description: "SCB is a Minecraft minigame where you fight against other players using various kits. The last player standing wins!",
            modes: [
                { title: "Classic", desc: "Choose a kit, 5 lives each, fight for #1, grab powerups from lightning!" },
                { title: "Duels", desc: "Face off against a random player or friend to prove who's the best!" },
                { title: "Frenzy", desc: "Random kits every life for a chaotic and fun experience!" },
            ],
            img: "./background.png"
        },
        fishing: {
            title: "Fishing",
            description: "Take a break from fighting and relax with some fishing, solo or with friends!",
            modes: [
                { title: "Catch Them All", desc: "There are 100 different species of fish and treasures to catch!" },
                { title: "Discover New Areas", desc: "Explore the lobby and discover new fishing spots. Each body of water has unique catches!" },
                { title: "Exclusive Rewards", desc: "Speed up progression by fishing to earn EXP, Tokens, and exclusive rewards!" },
            ],
            img: "./background.png"
        },
        parkour: {
            title: "Parkour",
            description: "Complete fun and challenging parkour courses to earn a spot on the leaderboard",
            modes: [
                { title: "Jump to New Heights", desc: "Test your parkour skills by completing parkour courses around the lobby!" },
                { title: "Reach the Top", desc: "Each course has a leaderboard. Jump in now and see if you can claim a spot!" },
                { title: "Earn Rewards", desc: "Gain rewards for completing parkour courses!" },
            ],
            img: "./background.png"
        }
    };
    return(
        <>
        <div className="app">
            <Navbar />
            <h1>Games</h1>

            <div className="game-buttons">
                <button onClick={() => setSelectedGame("scb")}>Super Craft Blocks</button>
                <button onClick={() => setSelectedGame("fishing")}>Fishing</button>
                <button onClick={() => setSelectedGame("parkour")}>Parkour</button>
            </div>
            {selectedGame && (
                <div className="game-info">
                    <div>
                        <h2>{games[selectedGame].title}</h2>
                        <p>{games[selectedGame].description}</p>
                        <ul>
                            {games[selectedGame].modes.map((mode, idx) => (
                                <li key={idx}>
                                    <h3>{mode.title}</h3>
                                    <p>{mode.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <img src={games[selectedGame].img} alt={games[selectedGame].title} />
                </div>
            )}
            <footer>© {new Date().getFullYear()} Minezone</footer>
        </div>
        </>
    );
}