import "./CopyLinkButton.css"

const CopyLinkButton = () => {
    const copyLink = () => {
        navigator.clipboard.writeText("minezone.club");
    }

    return (
        <div className="tooltip">
            <button onClick={copyLink}>Join Now!</button>
            <span className="tooltip-text">minezone.club</span>
        </div>
    )
}

export default CopyLinkButton;