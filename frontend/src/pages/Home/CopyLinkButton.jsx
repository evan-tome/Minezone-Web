import { useState } from "react";
import { FaRegCopy } from "react-icons/fa";
import "./CopyLinkButton.css";

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText("minezone.club");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button className="join-btn" onClick={copyLink}>
      {copied && <span className="join-tooltip">Copied!</span>}
      <span className="join-text">minezone.club</span>
      <span className="join-icon"><FaRegCopy /></span>
    </button>
  );
};

export default CopyLinkButton;
