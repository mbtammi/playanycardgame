interface ConsentState { ads: boolean; analytics: boolean; updated: number; }
const KEY = 'consent_prefs_v1';
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function load(): ConsentState {
  try { return JSON.parse(localStorage.getItem(KEY) || ''); } catch { /* noop */ }
  return { ads: false, analytics: false, updated: 0 };
}
function save(state: ConsentState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* noop */ }
}

let state = load();

export function getConsent(): ConsentState { return state; }
export function hasAdConsent(): boolean { return !!state.ads; }
export function hasAnalyticsConsent(): boolean { return !!state.analytics; }

export function updateConsent(partial: Partial<Pick<ConsentState, 'ads' | 'analytics'>>) {
  state = { ...state, ...partial, updated: Date.now() };
  save(state);
  listeners.forEach(l => { try { l(); } catch {} });
}

export function onConsentChange(cb: Listener) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}