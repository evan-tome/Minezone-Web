import { useState } from "react"
import './Searchbar.css'

const Searchbar = ({ onSearch }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() !== "")
            onSearch(input.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="search-bar">
            <input 
                type="text"
                placeholder="Enter username"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
        </form>
    );
}

export default Searchbar;