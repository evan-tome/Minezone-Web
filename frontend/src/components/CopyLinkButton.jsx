import { useState } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import "./CopyLinkButton.css";

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);
  const [playersOnline] = useState(328); // replace with dynamic count if you want later

  const copyLink = async () => {
    await navigator.clipboard.writeText("minezone.club");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="join-btn" onClick={copyLink}>
      <span className="join-text">
        {copied
          ? "Copied to clipboard"
          : `Join ${playersOnline.toLocaleString()} playing on minezone.club`}
      </span>
      <span className="join-icon">
        {copied ? <FaCheck /> : <FaRegCopy />}
      </span>
    </button>
  );
};

export default CopyLinkButton;
