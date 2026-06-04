import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaDiscord } from 'react-icons/fa';
import '../../App.css';
import './support.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const FAQ_ITEMS = [
    {
        question: "How do I join the server?",
        answer: "Open Minecraft Java Edition and add minezone.club to your server list. We support versions 1.8 through 1.21. Once connected, you'll be placed in the lobby where you can join any game."
    },
    {
        question: "What game modes are available?",
        answer: "Minezone currently features Super Craft Bros (Classic, Duels, and Frenzy), Fishing, and Parkour. We're constantly working on exciting new features. Join our Discord for announcements."
    },
    {
        question: "How do I report a player?",
        answer: "The fastest way to report a player or bug is through our Discord server. Open a ticket in the #all-forms channel and a staff member will assist you."
    },
    {
        question: "How do I report a bug or get support?",
        answer: "The fastest way to report a bug or get support is through our Discord server. Create a post in the support-bugs forum and a staff member will assist you."
    },
    {
        question: "How do I make a suggestion?",
        answer: "Create a post in the suggestion forum on our Discord and a staff member will read it. We look forward to hearing your ideas!"
    },
    {
        question: "How do I purchase a rank?",
        answer: "Visit our store at minezone.tebex.io to browse available ranks and the perks they offer. All purchases are processed securely through Tebex and applied to your account automatically."
    },
    {
        question: "Can I appeal a ban?",
        answer: "Yes. If you believe your ban was issued in error, please open a ban appeal ticket in our Discord server. Include your username, the date of the ban, and any relevant context. Appeals are reviewed by senior staff."
    },
    {
        question: "How does the EXP / leveling system work?",
        answer: "You earn EXP by playing games on the server. Each match rewards EXP based on your performance. Leveling up unlocks classes and other rewards. Your current EXP and level can be viewed on your stats page."
    },
    {
        question: "Are there events or seasonal content?",
        answer: "Yes! We run tournaments and seasonal events with limited-time rewards and special game modes. Keep an eye on our Discord and the Latest News section on the homepage to stay informed."
    },
];

function FaqItem({ question, answer }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`faq-item ${open ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
                <span>{question}</span>
                {open ? <FaChevronUp className="faq-chevron" /> : <FaChevronDown className="faq-chevron" />}
            </button>
            {open && <div className="faq-answer">{answer}</div>}
        </div>
    );
}

export function Support() {
    return (
        <div className="app dark-page">
            <Navbar />
            <main className="main support-main">

                <div className="support-header">
                    <h1>Support</h1>
                    <p>Find answers below or get in touch with our team</p>
                </div>

                <a
                    href="https://discord.com/invite/3J32tT9Zhp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="discord-cta"
                >
                    <FaDiscord className="discord-cta-icon" />
                    <div>
                        <strong>Get help faster on Discord</strong>
                        <span>Join our server and open a support ticket for the quickest response.</span>
                    </div>
                </a>

                <div className="support-columns">
                    <section className="faq-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="faq-list">
                            {FAQ_ITEMS.map((item) => (
                                <FaqItem key={item.question} {...item} />
                            ))}
                        </div>
                    </section>
                </div>

            </main>
            <Footer />
        </div>
    );
}
