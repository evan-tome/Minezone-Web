import { useState } from "react"
import { FaTimes, FaSearch } from "react-icons/fa"
import './Searchbar.css'

const Searchbar = ({ onSearch }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (trimmed) onSearch(trimmed);
    };

    return (
        <form onSubmit={handleSubmit} className="search-bar">
            <div className="search-input-wrapper">
                <label htmlFor="player-search" className="sr-only">Search player username</label>
                <input
                    id="player-search"
                    type="text"
                    placeholder="Enter username"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                {input && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={() => setInput("")}
                        aria-label="Clear"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>
            <button type="submit" className="search-submit" aria-label="Search">
                <FaSearch />
            </button>
        </form>
    );
};

export default Searchbar;
