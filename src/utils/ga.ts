// Google Analytics 4 lightweight loader with consent gating.
import { hasAnalyticsConsent, onConsentChange } from '../ads/consent';

const MEASUREMENT_ID = process.env.GA_TRACKING_ID;
let initialized = false;

declare global { interface Window { dataLayer?: any[]; gtag?: (...args: any[]) => void; } }

function injectScript() {
  if (document.getElementById('ga4-lib')) return;
  const s = document.createElement('script');
  s.id = 'ga4-lib';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

export function initGA() {
  if (initialized) return;
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
  window.gtag('event', name, params);
}