import { createRoot } from 'react-dom/client'
import App from './App'
import './app.css'

const root = document.getElementById('app')
if (!root) throw new Error('App-Element fehlt')
createRoot(root).render(<App />)
