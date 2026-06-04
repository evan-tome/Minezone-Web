import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home/home'
import { Stats } from './pages/Stats/stats'
import { Leaderboards } from './pages/Leaderboards/leaderboards'
import { Store } from './pages/Store/store'
import { Support } from './pages/Support/support'
import { Analytics } from './pages/Analytics/Analytics'
import { Labs } from './pages/Labs/Labs'
import { Match } from './pages/Match/Match'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/stats/:username?" element={<Stats />}/>
        <Route path="/leaderboards" element={<Leaderboards />}/>
        <Route path="/store" element={<Store />}/>
        <Route path="/support" element={<Support />}/>
        <Route path="/analytics" element={<Analytics />}/>
        <Route path="/labs/:module?" element={<Labs />}/>
        <Route path="/match/:id" element={<Match />}/>
      </Routes>
    </Router>
  )
}

export default App
