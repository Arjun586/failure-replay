// client/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' 
import App from './App'
import './index.css'
import AuthProvider from '../core/context/AuthProvider'
import ThemeProvider from '../core/context/ThemeProvider'

// Mounts the React application to the DOM root element with necessary context providers
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Provides global theme configuration to the component tree */}
      <ThemeProvider> 
        {/* Manages authentication state and session persistence across the app */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)