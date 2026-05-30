import { useState } from 'react';
import './OnlineIndicator.css';

const OnlineIndicator = () => {
    const [online] = useState(4);

    return (
        <div className="online">
            <p>Online players: {online}</p>
        </div>
    );
};

export default OnlineIndicator;