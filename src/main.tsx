import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import IndexPage from './pages/IndexPage'
import Direction1 from './pages/Direction1'
import DcPulse from './pages/DcPulse'
import WalmartPilot from './pages/WalmartPilot'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/d/walmart-pilot" element={<WalmartPilot />} />
        <Route path="/d/control-tower" element={<Direction1 />} />
        <Route path="/d/dc-pulse" element={<DcPulse />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
