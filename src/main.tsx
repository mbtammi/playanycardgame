import { useEffect } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initGA } from './utils/ga'
import { hasAnalyticsConsent, onConsentChange } from './ads/consent'

function RootWithAnalytics() {
  useEffect(() => {
    if (hasAnalyticsConsent()) initGA();
    const off = onConsentChange(() => { if (hasAnalyticsConsent()) initGA(); });
    return () => off();
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootWithAnalytics />
  </StrictMode>,
)
