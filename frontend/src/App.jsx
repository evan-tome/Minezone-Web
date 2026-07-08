import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Home } from './pages/Home/Home'
import { Stats } from './pages/Stats/Stats'
import { PlayerProfile } from './pages/Stats/PlayerProfile'
import { Leaderboards } from './pages/Leaderboards/Leaderboards'
import { Support } from './pages/Support/Support'
import { Analytics } from './pages/Analytics/Analytics'
import { Labs } from './pages/Labs/Labs'
import { Match } from './pages/Match/Match'
import { Internal } from './pages/Internal/Internal'
import './App.css'

function ExternalRedirect({ to }) {
  useEffect(() => { window.location.href = to; }, [to]);
  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/stats" element={<Stats />}/>
        <Route path="/stats/:username" element={<PlayerProfile />}/>
        <Route path="/leaderboards" element={<Leaderboards />}/>
        <Route path="/store" element={<ExternalRedirect to="https://minezone.tebex.io" />}/>
        <Route path="/support" element={<Support />}/>
        <Route path="/analytics" element={<Analytics />}/>
        <Route path="/labs/:module?" element={<Labs />}/>
        <Route path="/match/:id" element={<Match />}/>
        <Route path="/internal" element={<Internal />}/>
      </Routes>
    </Router>
  )
}

export default App
