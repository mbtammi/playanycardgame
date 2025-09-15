import React, { useEffect, useRef, useState } from 'react';
import { renderAd } from '../ads';
import { hasAdConsent, onConsentChange } from '../ads/consent';
import './AdSlot.css';

interface AdSlotProps {
  slotId: string; // logical placement id
  providerMeta?: Record<string, any>; // provider-specific data (e.g. AdSense slot)
  className?: string;
  lazy?: boolean; // if true, waits until in viewport
}

/**
 * Progressive ad slot: keeps same skeleton styling as placeholder but hydrates with provider content.
 * Falls back silently if provider not configured.
 */
const AdSlot: React.FC<AdSlotProps> = ({ slotId, providerMeta, className = '', lazy = true }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const hydrate = () => {
      if (hydrated) return;
      if (!hasAdConsent()) return; // wait until consent granted
      try {
        renderAd(el, { slotId, meta: providerMeta });
        setHydrated(true);
      } catch {
        /* swallow */
      }
    };

    if (!lazy) {
      hydrate();
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { hydrate(); obs.disconnect(); } });
    }, { rootMargin: '120px 0px' });
    obs.observe(el);

    // Subscribe to consent changes (noop now, functional later)
    const off = onConsentChange(() => hydrate());
    return () => { obs.disconnect(); off(); };
  }, [slotId, providerMeta, lazy, hydrated]);

  return (
    <div ref={ref} className={`ad-slot ${className}`} data-slot-id={slotId} aria-label="Advertisement" role="complementary">
      {!hydrated && (
        <div className="ad-inner" data-placeholder>
          <span className="ad-tag">Loading Ad</span>
          <span className="ad-desc">Preparing slot...</span>
        </div>
      )}
    </div>
  );
};

export default AdSlot;
