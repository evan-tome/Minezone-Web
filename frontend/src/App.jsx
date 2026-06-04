import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Home } from './pages/Home/home'
import { Stats } from './pages/Stats/stats'
import { Leaderboards } from './pages/Leaderboards/leaderboards'
import { Support } from './pages/Support/support'
import { Analytics } from './pages/Analytics/Analytics'
import { Labs } from './pages/Labs/Labs'
import { Match } from './pages/Match/Match'
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
        <Route path="/stats/:username?" element={<Stats />}/>
        <Route path="/leaderboards" element={<Leaderboards />}/>
        <Route path="/store" element={<ExternalRedirect to="https://minezone.tebex.io" />}/>
        <Route path="/support" element={<Support />}/>
        <Route path="/analytics" element={<Analytics />}/>
        <Route path="/labs/:module?" element={<Labs />}/>
        <Route path="/match/:id" element={<Match />}/>
      </Routes>
    </Router>
  )
}

export default App
