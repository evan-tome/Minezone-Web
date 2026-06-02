import "./Footer.css";
import { FaDiscord, FaYoutube, FaInstagram, FaTwitter, FaTiktok, FaShoppingCart } from "react-icons/fa";

export default function Footer() {

  const copyLink = async () => {
    await navigator.clipboard.writeText("minezone.club");
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-container">

          {/* About Section */}
          <div className="footer-column about">
            <h2>About Minezone</h2>
            <p>
              Minezone is a Minecraft server recreating the classic Super Craft Bros experience,
              along with new minigames, events, and a friendly player community.
              Join us and be part of something awesome!
            </p>
            <button className="copy-button" onClick={copyLink}>minezone.club</button>
          </div>

          {/* Navigation Section */}
          <div className="footer-column">
            <h2>Navigate</h2>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/games">Games</a></li>
              <li><a href="/leaderboards">Leaderboards</a></li>
              <li><a href="/stats">Stats</a></li>
              <li><a href="/analytics">Analytics</a></li>
              <li><a href="/support">Support</a></li>

            </ul>
          </div>

          {/* Social Media Section */}
          <div className="footer-column">
            <h2>Stay Updated</h2>
            <p>
                Follow our social medias to stay up to date!
            </p>
            <div className="social-icons">
              <a href="https://discord.com/invite/3J32tT9Zhp" target="_blank" rel="noopener noreferrer" aria-label="Join our Discord"><FaDiscord aria-hidden="true" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube aria-hidden="true" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram aria-hidden="true" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X"><FaTwitter aria-hidden="true" /></a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok aria-hidden="true" /></a>
            </div>
          </div>

          {/* Store Section */}
          <div className="footer-column store">
            <h2>Store</h2>
            <p>
              Support Minezone by purchasing ranks and exclusive items.
              Every contribution helps us deliver more content!
            </p>
            <a href="/store" className="store-button"><FaShoppingCart style={{ marginRight: "0.5rem" }} />Visit Store</a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} Minezone
      </div>
    </footer>
  );
}
