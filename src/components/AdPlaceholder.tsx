import React from 'react';
import './AdPlaceholder.css';

// Deprecated static placeholder. Prefer using <AdSlot slotId="..." /> for dynamic providers.
const AdPlaceholder: React.FC<{ position?: string; }> = ({ position = 'landing-top' }) => (
  <div className={`ad-slot ad-slot-${position}`} aria-label="Ad placeholder" role="complementary">
    <div className="ad-inner">
      <span className="ad-tag">Future Ad</span>
      <span className="ad-desc">Monetize here without layout shift</span>
    </div>
  </div>
);

export default AdPlaceholder;
