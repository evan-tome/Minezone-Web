import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home/Home'
import { Stats } from './pages/Stats/Stats'
import { Leaderboards } from './pages/Leaderboards/Leaderboards'
import { Store } from './pages/Store/Store'
import { Support } from './pages/Support/Support'
import { Analytics } from './pages/Analytics/Analytics'
import { Labs } from './pages/Labs/Labs'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/stats" element={<Stats />}/>
        <Route path="/stats/:username" element={<Stats />}/>
        <Route path="/leaderboards" element={<Leaderboards />}/>
        <Route path="/store" element={<Store />}/>
        <Route path="/support" element={<Support />}/>
        <Route path="/analytics" element={<Analytics />}/>
        <Route path="/labs" element={<Labs />}/>
      </Routes>
    </Router>
  )
}

export default App
