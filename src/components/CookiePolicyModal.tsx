import React, { useState, useEffect } from 'react';
import './CookiePolicyModal.css';
import { getConsent, updateConsent } from '../ads/consent';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const existing = getConsent();
  const [ads, setAds] = useState(existing.ads);
  const [analytics, setAnalytics] = useState(existing.analytics);

  useEffect(() => {
    setAds(existing.ads);
    setAnalytics(existing.analytics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className="cookie-modal-overlay" onClick={onClose}>
      <div className="cookie-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cookie-modal-header">
          <h2 className="cookie-modal-title">🍪 Cookie Policy</h2>
          <button className="cookie-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="cookie-modal-body">
          <p className="cookie-modal-intro">
            We use cookies to enhance your experience on Play Any Card Game. Here's what you need to know:
          </p>
          
          <div className="cookie-section">
            <h3>What are cookies?</h3>
            <p>
              Cookies are small text files stored on your device that help us provide a better 
              user experience and analyze how our service is used.
            </p>
          </div>
          
          <div className="cookie-section">
            <h3>Types of cookies we use:</h3>
            <div className="cookie-types">
              <div className="cookie-type">
                <strong>🔧 Essential Cookies</strong>
                <p>Required for the website to function properly. Cannot be disabled.</p>
              </div>
              <div className="cookie-type">
                <strong>📊 Analytics Cookies</strong>
                <p>Help us understand how visitors interact with our website.</p>
              </div>
              <div className="cookie-type">
                <strong>⚙️ Functional Cookies</strong>
                <p>Remember your preferences and settings.</p>
              </div>
            </div>
          </div>
          
          <div className="cookie-section">
            <h3>Managing cookies</h3>
            <p>
              You can control cookies through your browser settings. Note that disabling cookies 
              may affect website functionality.
            </p>
          </div>
          
          <div className="cookie-section">
            <h3>Third-party cookies</h3>
            <p>
              We may use services like Google Analytics that set their own cookies. These are 
              governed by their respective privacy policies.
            </p>
          </div>
        </div>
        
        <div className="cookie-section">
          <h3>Your Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} />
              <span>Allow Analytics</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} />
              <span>Allow Personalized Ads (house + external)</span>
            </label>
          </div>
        </div>

        <div className="cookie-modal-footer" style={{ display: 'flex', gap: '.75rem' }}>
          <button
            className="cookie-modal-accept"
            onClick={() => { setAnalytics(false); setAds(false); updateConsent({ analytics: false, ads: false }); onClose(); }}
          >
            Reject All
          </button>
          <button
            className="cookie-modal-accept"
            onClick={() => { updateConsent({ analytics, ads }); onClose(); }}
          >
            Save Preferences
          </button>
          <button
            className="cookie-modal-accept"
            onClick={() => { setAnalytics(true); setAds(true); updateConsent({ analytics: true, ads: true }); onClose(); }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyModal;
