import React from 'react';
import './CookiePolicyModal.css';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
        
        <div className="cookie-modal-footer">
          <button className="cookie-modal-accept" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyModal;
