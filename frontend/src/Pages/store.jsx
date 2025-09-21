import '../App.css'
import './store.css'
import Navbar from "../components/Navbar";

export function Store() {
    const ranks = [
        {
            name: "VIP",
            price: 9.99,
            link: "https://minezone.tebex.io/package/6614381",
            desc: "Receive the VIP Rank on the Minezone Minecraft Server and Minezone Discord",
            perks: [
                "In-game & Discord tag",
                "All donor SCB classes",
                "SCB token bonus",
                "/nick",
            ]
        },
        {
            name: "Captain",
            price: 19.99,
            link: "https://minezone.tebex.io/package/6614382",
            desc: "Receive the Captain Rank on the Minezone Minecraft Server and Minezone Discord. Includes all VIP Rank perks.",
            perks: [
                "In-game & Discord tag",
                "All donor SCB classes",
                "SCB token bonus",
                "/nick",
                "/fly",
                "/invite",
                "/color",
                "Custom win messages",
                "Custom kill & death messages",
                "Custom death particles",
                "Magic Broom in Lobby",
                "Exclusive win effects"
            ]
        }
    ];

    const allPerks = Array.from(new Set(ranks.flatMap(r => r.perks)));

    return (
        <>
            <div className="app">
                <Navbar />
                <h1>Store</h1>

                <div className="rank-cards">
                    {ranks.map((rank, idx) => (
                        <div className="rank-card" key={idx}>
                            <h2>{rank.name} Rank</h2>
                            <p className="rank-desc">{rank.desc}</p>
                            <p className="rank-price">{rank.price} USD</p>
                            <a 
                                href={rank.link} 
                                target="_blank" 
                                className="buy-button"
                            >
                                Buy
                            </a>
                        </div>
                    ))}
                </div>

                <p>
                    Compare ranks side-by-side to see what each includes:
                </p>

                <div className="rank-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Perk</th>
                                {ranks.map((rank, idx) => (
                                    <th key={idx}>
                                        {rank.name}<br />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allPerks.map((perk, idx) => (
                                <tr key={idx}>
                                    <td className="perk-name">{perk}</td>
                                    {ranks.map((rank, colIdx) => (
                                        <td key={colIdx}>
                                            {rank.perks.includes(perk) ? "✓" : "—"}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="store-button">
                    <a 
                        href="https://minezone.tebex.io" 
                        target="_blank" 
                        className="buy-button"
                    >
                        Visit Store
                    </a>
                </div>

                <div className="bottom">
                    <h2>About Ranks</h2>
                    <p>Donating helps keep our server running and we greatly appreciate everyone who supports us. By donating, you also receive a rank and the many exciting perks that come with them.<br /> <br />
                        If you already have a rank, the value of your current rank is deducted from future rank upgrades.
                    </p>
                </div>

                <footer>© {new Date().getFullYear()} Minezone</footer>
            </div>
        </>
    );
}
