import { useLocation } from 'react-router-dom';
import { FaFlask } from 'react-icons/fa';
import './LabsEntry.css';

export default function LabsEntry() {
    const location = useLocation();
    if (location.pathname === '/labs') return null;

    return (
        <a href="/labs" className="labs-fab">
            <FaFlask className="labs-fab-icon" />
            <span className="labs-fab-label">Minezone Labs</span>
        </a>
    );
}
