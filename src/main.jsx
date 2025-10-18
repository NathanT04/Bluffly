import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Homepage from './pages/Homepage'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Homepage />
  </React.StrictMode>
)