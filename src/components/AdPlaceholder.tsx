import React from 'react';
import './AdPlaceholder.css';

/**
 * Non-intrusive reserved ad slot (no network calls yet).
 * Keeps layout stable (CLS safe) and can be progressively enhanced later.
 */
const AdPlaceholder: React.FC<{ position?: string; }> = ({ position = 'landing-top' }) => {
  return (
    <div className={`ad-slot ad-slot-${position}`} aria-label="Ad placeholder" role="complementary">
      <div className="ad-inner">
        <span className="ad-tag">Future Ad</span>
        <span className="ad-desc">Monetize here without layout shift</span>
      </div>
    </div>
  );
};

export default AdPlaceholder;
