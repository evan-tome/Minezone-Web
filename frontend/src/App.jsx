import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './Pages/Home'
import { Stats } from './Pages/Stats'
import { Leaderboards } from './Pages/leaderboards'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/about" element={<Home />}/>
        <Route path="/stats" element={<Stats />}/>
        <Route path="/leaderboards" element={<Leaderboards />}/>
      </Routes>
    </Router>
  )
}

export default App
