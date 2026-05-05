import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './Pages/Home'
import { Stats } from './Pages/Stats'
import { Leaderboards } from './Pages/leaderboards'
import { Store } from './Pages/store'
import { Support } from './Pages/support'
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
