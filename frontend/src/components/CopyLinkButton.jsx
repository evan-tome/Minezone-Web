import { useState } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import "./CopyLinkButton.css";

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText("minezone.club");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="join-btn" onClick={copyLink}>
      <span className="join-text">
        {copied ? "Copied!" : "minezone.club"}
      </span>
      <span className="join-icon">
        {copied ? "" : <FaRegCopy />}
      </span>
    </button>
  );
};

export default CopyLinkButton;
