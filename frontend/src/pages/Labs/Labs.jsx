import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ClassRecommender } from './ClassRecommender';
import { ArchetypePanel } from './ArchetypePanel';
import { WinPredictor } from './WinPredictor';
import { TrendPanel } from './TrendPanel';
import { MatchPredictor } from './MatchPredictor';
import { KMeansPanel } from './KMeansPanel';
import { PointField } from './PointField';
import './Labs.css';
import {
    FaFlask, FaLightbulb, FaChartLine, FaTrophy, FaCloud,
    FaChartArea, FaUser, FaLock, FaChevronDown,
} from 'react-icons/fa';

const ML_FEATURES = [
    { id: 'recommender', label: 'Class Recommender', icon: <FaLightbulb />, available: true },
    { id: 'predictor',   label: 'Win Predictor',     icon: <FaChartLine />, available: true },
    { id: 'match',       label: 'Match Predictor',   icon: <FaTrophy />,    available: true },
    { id: 'clusters',    label: 'Clusters',           icon: <FaCloud />,     available: true },
];

const TOOL_FEATURES = [
    { id: 'trend',     label: 'Performance Trend', icon: <FaChartArea />, available: true },
    { id: 'archetype', label: 'Player Archetype',  icon: <FaUser />,      available: true },
];

const ALL_FEATURES = [...ML_FEATURES, ...TOOL_FEATURES];

export function Labs() {
    const { module } = useParams();
    const navigate = useNavigate();
    const active = module || 'recommender';
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const activeFeature = ALL_FEATURES.find(f => f.id === active);

    const handleNav = (f) => {
        if (!f.available) return;
        navigate(`/labs/${f.id}`);
        setMobileNavOpen(false);
    };

    return (
        <div className="labs-page">
            <div className="labs-bg-grid" />
            <PointField />
            <div className="labs-glow labs-glow-cyan" />
            <div className="labs-glow labs-glow-purple" />

            <Navbar />

            <div className="labs-layout">
                <aside className="labs-sidebar">
                    <div className="labs-sidebar-sticky">
                        <div className="labs-sidebar-brand">
                            <FaFlask className="labs-sidebar-flask" />
                            <div className="labs-sidebar-brand-text">
                                <span className="labs-sidebar-name">LABS</span>
                                <span className="labs-sidebar-badge">BETA</span>
                            </div>
                        </div>

                        <p className="labs-sidebar-about">
                            Experimental features built on Minezone player data. Prediction tools retrain
                            daily as new matches are recorded.
                        </p>

                        <button
                            className="labs-mobile-nav-toggle"
                            onClick={() => setMobileNavOpen(o => !o)}
                        >
                            <span className="labs-mobile-nav-current">
                                <span className="labs-sidebar-item-icon">{activeFeature?.icon}</span>
                                {activeFeature?.label}
                            </span>
                            <FaChevronDown className={`labs-mobile-nav-chevron${mobileNavOpen ? ' open' : ''}`} />
                        </button>

                        <div className={`labs-sidebar-nav-wrap${mobileNavOpen ? ' open' : ''}`}>
                            <p className="labs-sidebar-section-label">Predictions</p>
                            <nav className="labs-sidebar-nav">
                                {ML_FEATURES.map(f => (
                                    <button
                                        key={f.id}
                                        className={`labs-sidebar-item${active === f.id ? ' active' : ''}${f.available ? '' : ' locked'}`}
                                        onClick={() => handleNav(f)}
                                    >
                                        <span className="labs-sidebar-item-icon">{f.icon}</span>
                                        <span className="labs-sidebar-item-label">{f.label}</span>
                                        {!f.available && <FaLock className="labs-sidebar-lock" />}
                                    </button>
                                ))}
                            </nav>

                            <p className="labs-sidebar-section-label" style={{ marginTop: '20px' }}>Tools</p>
                            <nav className="labs-sidebar-nav">
                                {TOOL_FEATURES.map(f => (
                                    <button
                                        key={f.id}
                                        className={`labs-sidebar-item${active === f.id ? ' active' : ''}${f.available ? '' : ' locked'}`}
                                        onClick={() => handleNav(f)}
                                    >
                                        <span className="labs-sidebar-item-icon">{f.icon}</span>
                                        <span className="labs-sidebar-item-label">{f.label}</span>
                                        {!f.available && <FaLock className="labs-sidebar-lock" />}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </aside>

                <main className="labs-content">
                    {active === 'recommender' && <ClassRecommender />}
                    {active === 'archetype'   && <ArchetypePanel />}
                    {active === 'predictor'   && <WinPredictor />}
                    {active === 'match'       && <MatchPredictor />}
                    {active === 'trend'       && <TrendPanel />}
                    {active === 'clusters'    && <KMeansPanel />}
                </main>
            </div>
            <Footer />
        </div>
    );
}
