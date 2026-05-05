import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const DevModeBanner = () => (
  <div
    style={{
      background: '#0f172a',
      color: '#e2e8f0',
      borderBottom: '1px solid rgba(59, 130, 246, 0.4)',
      padding: '8px 16px',
      fontSize: '12px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <strong style={{ color: '#60a5fa' }}>DEV MODE:</strong>{' '}
    Set <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
    in <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>.env</code> to enable auth.
    The app will run without auth.
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));

if (PUBLISHABLE_KEY) {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>,
  );
} else {
  // No Clerk key — render the app directly so devs can still use it
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <DevModeBanner />
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
