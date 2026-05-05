import { FaExclamationCircle } from "react-icons/fa";
import './ErrorScreen.css';

export default function ErrorScreen({ message }) {
    return (
        <div className="error-screen">
            <div className="error-box">
                <FaExclamationCircle className="error-icon" />
                <h2>Something went wrong</h2>
                <p>{message}</p>
            </div>
        </div>
    );
}
