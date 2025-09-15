// Google Analytics 4 lightweight loader with consent gating.
import { hasAnalyticsConsent, onConsentChange } from '../ads/consent';

// Use Vite style env var; fallback to the known ID if not overridden.
const MEASUREMENT_ID: string | undefined = (import.meta.env.VITE_GA_ID as string) || 'G-GQFT1ET7LR';
let initialized = false;

declare global { interface Window { dataLayer?: any[]; gtag?: (...args: any[]) => void; } }

function injectScript() {
  if (!MEASUREMENT_ID) return; // nothing to load
  if (document.getElementById('ga4-lib')) return;
  const s = document.createElement('script');
  s.id = 'ga4-lib';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

export function initGA() {
  if (initialized) return;
  if (!MEASUREMENT_ID) return; // abort silently if not configured
  if (!hasAnalyticsConsent()) return; // wait until consent given
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(){ window.dataLayer!.push(arguments); };
  injectScript();
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { anonymize_ip: true });
}

// React to consent changes
onConsentChange(() => { if (!initialized && hasAnalyticsConsent()) initGA(); });

export function gaEvent(name: string, params: Record<string, any>) {
  if (!initialized || !window.gtag) return;
  try { window.gtag('event', name, params); } catch { /* swallow */ }
}