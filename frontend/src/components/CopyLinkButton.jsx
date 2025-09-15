import "./CopyLinkButton.css"

const CopyLinkButton = () => {
    const copyLink = () => {
        navigator.clipboard.writeText("minezone.club");
    }

    return (
        <div className="tooltip">
            <button onClick={copyLink}>minezone.club</button>
            <span className="tooltip-text">Copy to clipboard</span>
        </div>
    )
}

export default CopyLinkButton;