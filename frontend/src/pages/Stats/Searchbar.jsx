import { useState } from "react"
import { FaTimes } from "react-icons/fa"
import './Searchbar.css'

const Searchbar = ({ onSearch }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() !== "")
            onSearch(input.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="search-bar">
            <div className="search-input-wrapper">
                <input
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
        </form>
    );
};

export default Searchbar;
