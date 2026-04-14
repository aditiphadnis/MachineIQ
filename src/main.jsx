import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// This is the entry point — it mounts your React app into the HTML page.
// The <div id="root"> in index.html is where everything gets injected.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
