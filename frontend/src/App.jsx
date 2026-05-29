import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home/home'
import { Stats } from './pages/Stats/stats'
import { Leaderboards } from './Pages/Leaderboards/leaderboards'
import { Store } from './pages/Store/store'
import { Support } from './pages/Support/support'
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
      </Routes>
    </Router>
  )
}

export default App
