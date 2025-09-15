import type { AdProvider, AdRenderOptions } from '../AdProvider';
import { analytics } from '../../utils/analytics';

function injectScript(client: string) {
  if (typeof window === 'undefined') return;
  if (window.__adsenseScriptLoaded) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  s.crossOrigin = 'anonymous';
  s.onload = () => { window.__adsenseScriptLoaded = true; analytics.adScriptLoaded('adsense'); };
  document.head.appendChild(s);
}

export class AdsenseProvider implements AdProvider {
  key = 'adsense';
  private client: string;
  constructor(client: string) { this.client = client; }

  async init() {
    injectScript(this.client);
  }

  render(container: HTMLElement, opts: AdRenderOptions) {
    container.innerHTML = '';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', this.client);
    ins.setAttribute('data-ad-slot', opts.meta?.slot || '');
    ins.setAttribute('data-full-width-responsive', 'true');
    container.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      analytics.adImpression('adsense', opts.slotId, { slot: opts.meta?.slot });
    } catch {}
  }
}

export function createAdsenseProvider(): AdsenseProvider | null {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  if (!client) return null;
  return new AdsenseProvider(client);
}
