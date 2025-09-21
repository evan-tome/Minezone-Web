import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './Pages/home'
import { Games } from './Pages/games'
import { Stats } from './Pages/Stats'
import { Leaderboards } from './Pages/leaderboards'
import { Store } from './Pages/store'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/games" element={<Games />}/>
        <Route path="/stats" element={<Stats />}/>
        <Route path="/stats/:username" element={<Stats />}/>
        <Route path="/leaderboards" element={<Leaderboards />}/>
        <Route path="/store" element={<Store />}/>
      </Routes>
    </Router>
  )
}

export default App
