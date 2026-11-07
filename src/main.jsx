import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// HashRouter: Apache serves only index.html, so routes live after the # (no rewrite rules needed).
import { HashRouter as BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
// Vercel Web Analytics (visitors/page views). This is a Vite app, so it uses the /react entry, not /next.
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
