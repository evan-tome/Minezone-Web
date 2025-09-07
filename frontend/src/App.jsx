import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Home } from './Pages/Home'
import { Stats } from './Pages/Stats'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/stats" element={<Stats />}/>
      </Routes>
    </Router>
  )
}

export default App
