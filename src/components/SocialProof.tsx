import React, { useEffect } from 'react';
import './SocialProof.css';
import { analytics } from '../utils/analytics';

interface SocialProofProps { playerCountApprox?: number }

const formatApprox = (n: number | undefined) => {
  if (!n || n < 100) return '100+';
  if (n < 250) return '250+';
  if (n < 500) return '500+';
  if (n < 1000) return '1K+';
  if (n < 5000) return '5K+';
  return '10K+';
};

const SocialProof: React.FC<SocialProofProps> = ({ playerCountApprox = 137 }) => {
  useEffect(() => {
    analytics.socialProofImpression();
  }, []);
  const approx = formatApprox(playerCountApprox);
  return (
    <div className="social-proof" aria-label="Platform adoption notice">
      <p className="social-proof-line">Join <strong>{approx}</strong> players creating AI‑powered card games.</p>
    </div>
  );
};

export default SocialProof;
