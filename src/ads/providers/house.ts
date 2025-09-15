import type { AdProvider, AdRenderOptions } from '../AdProvider';
import houseData from '../houseAds.json';
import { analytics } from '../../utils/analytics';
import { shouldRecordImpression, recordImpression } from '../frequency';

interface HouseAdItem { id: string; heading: string; subtext: string; ctaText: string; url: string; bg?: string; }

const rotate = (list: HouseAdItem[]): HouseAdItem => {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
};

export class HouseAdsProvider implements AdProvider {
  key = 'house';
  async init() { /* no-op */ }
  render(container: HTMLElement, opts: AdRenderOptions) {
    container.innerHTML = '';
    const item = rotate(houseData.items as HouseAdItem[]);
    const wrap = document.createElement('a');
    wrap.href = item.url;
    wrap.target = '_blank';
    wrap.rel = 'noopener noreferrer';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '4px';
    wrap.style.textDecoration = 'none';
    wrap.style.padding = '14px 16px';
    wrap.style.border = '1px solid #e5e7eb';
    wrap.style.background = item.bg || 'linear-gradient(135deg,#ffffff,#f5f7fa)';
    wrap.style.borderRadius = '12px';
    wrap.style.fontFamily = 'system-ui, sans-serif';
    wrap.style.minHeight = '120px';
    wrap.style.boxShadow = '0 4px 12px -4px rgba(0,0,0,0.08)';

    const h = document.createElement('div');
    h.textContent = item.heading;
    h.style.fontSize = '15px';
    h.style.fontWeight = '600';
    h.style.color = '#111827';

    const p = document.createElement('div');
    p.textContent = item.subtext;
    p.style.fontSize = '12px';
    p.style.color = '#374151';
    p.style.lineHeight = '1.4';

    const cta = document.createElement('div');
    cta.textContent = item.ctaText + ' →';
    cta.style.marginTop = 'auto';
    cta.style.fontSize = '12px';
    cta.style.fontWeight = '600';
    cta.style.color = '#2563eb';

    wrap.appendChild(h); wrap.appendChild(p); wrap.appendChild(cta);
    container.appendChild(wrap);

    if (shouldRecordImpression(opts.slotId)) {
      analytics.adImpression('house', opts.slotId, { id: item.id });
      recordImpression(opts.slotId);
    }

    wrap.addEventListener('click', () => {
      analytics.adClick('house', opts.slotId, { id: item.id });
    }, { once: true });
  }
}

export const houseAdsProvider = new HouseAdsProvider();
