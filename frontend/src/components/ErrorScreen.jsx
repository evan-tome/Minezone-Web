import './ErrorScreen.css';

export default function ErrorScreen({ message }) {
    return (
        <div className="error-screen">
            <div className="error-box">
                <h2>Error</h2>
                <p>{message}</p>
            </div>
        </div>
    );
}
