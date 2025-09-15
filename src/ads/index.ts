import { houseAdsProvider } from './providers/house';
import { createAdsenseProvider } from './providers/adsense';
import type { AdProvider, AdRenderOptions } from './AdProvider';
import { analytics } from '../utils/analytics';

let provider: AdProvider | null = null;

export function getAdProvider(): AdProvider | null {
  if (provider) return provider;
  const key = (import.meta.env.VITE_ADS_PROVIDER || 'house').toLowerCase();
  if (key === 'adsense') {
    provider = createAdsenseProvider();
  } else if (key === 'none') {
    provider = null;
  } else {
    provider = houseAdsProvider;
  }
  if (provider) {
    Promise.resolve(provider.init()).then(() => {
      analytics.adScriptLoaded(provider!.key);
    }).catch(() => {/* swallow */});
  }
  return provider;
}

export function renderAd(container: HTMLElement, opts: AdRenderOptions) {
  const p = getAdProvider();
  if (!p) return;
  p.render(container, opts);
}
