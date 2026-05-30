import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaDiscord, FaPaperPlane } from 'react-icons/fa';
import '../../App.css';
import './support.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Pattern from '../../components/Pattern';

const FAQ_ITEMS = [
    {
        question: "How do I join the server?",
        answer: "Open Minecraft Java Edition and add minezone.club to your server list. We support versions 1.8 through 26.1.2. Once connected, you'll be placed in the lobby where you can join any game."
    },
    {
        question: "What game modes are available?",
        answer: "Minezone currently features Super Craft Bros (Classic, Duels, and Frenzy), Fishing, and Parkour. We're constantly working on exciting new features. Join our Discord for announcements."
    },
    {
        question: "How do I report a player?",
        answer: "The fastest way to report a player or bug is through our Discord server. Open a ticket in the #all-forms channel and a staff member will assist you. You can also use the contact form on this page."
    },
    {
        question: "How do I report a bug or get support?",
        answer: "The fastest way to report a bug or get support is through our Discord server. Create a post in the support-bugs forum and a staff member will assist you. You can also use the contact form on this page."
    },
     {
        question: "How do I make a suggestion?",
        answer: "The fastest way to make a suggestion is through our Discord server. Create a post in the suggestion forum and a staff member will read it. You can also use the contact form on this page. We look forward to hearing your ideas!"
    },
    {
        question: "How do I purchase a rank",
        answer: "Visit our store at minezone.tebex.io to browse available ranks and the perks they offer. All purchases are processed securely through Tebex. Purchased items are applied to your account automatically."
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
            <button className="faq-question" onClick={() => setOpen(o => !o)}>
                <span>{question}</span>
                {open ? <FaChevronUp className="faq-chevron" /> : <FaChevronDown className="faq-chevron" />}
            </button>
            {open && <div className="faq-answer">{answer}</div>}
        </div>
    );
}

export function Support() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Placeholder - wire up to backend or email service later
        setSubmitted(true);
    };

    return (
        <div className="app dark-page">
            <Pattern />
            <Navbar />
            <div className="main support-main">

                {/* Page header */}
                <div className="support-header">
                    <h1>Support</h1>
                    <p>Find answers below or get in touch with our team</p>
                </div>

                {/* Discord CTA */}
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

                    {/* FAQ */}
                    <section className="faq-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="faq-list">
                            {FAQ_ITEMS.map((item, i) => (
                                <FaqItem key={i} {...item} />
                            ))}
                        </div>
                    </section>

                    {/* Contact form
                    <section className="contact-section">
                        <h2>Contact Us</h2>
                        {submitted ? (
                            <div className="form-success">
                                <FaPaperPlane className="form-success-icon" />
                                <h3>Message sent!</h3>
                                <p>We'll get back to you as soon as possible. For urgent issues, reach out on Discord.</p>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder="Your name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={form.subject}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>Select a topic</option>
                                        <option value="bug">Bug Report</option>
                                        <option value="player-report">Player Report</option>
                                        <option value="ban-appeal">Ban Appeal</option>
                                        <option value="store">Store / Purchase Issue</option>
                                        <option value="suggestion">Suggestion</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        placeholder="Describe your issue in detail..."
                                        value={form.message}
                                        onChange={handleChange}
                                        rows={6}
                                        required
                                    />
                                </div>
                                <button type="submit" className="form-submit">
                                    <FaPaperPlane />
                                    Send Message
                                </button>
                            </form>
                        )}
                    </section> */}

                </div>
            </div>
            <Footer />
        </div>
    );
}
