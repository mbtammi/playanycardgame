import { useState } from 'react';
import FeatureRequestModal from './FeatureRequestModal';
import CookiePolicyModal from './CookiePolicyModal';
import './Footer.css';

const Footer = () => {
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  return (
    <>
      <footer className="footer">
        <div className="footer-branding">
          <h2 className="footer-brand-name">Play Any Card Game</h2>
          <p className="footer-tagline">Create, play, and enjoy card games powered by AI</p>
        </div>

        <div className="footer-links">
          <h3 className="footer-section-title">Quick Links</h3>
          <ul className="footer-link-list">
            <li><a href="/rule-builder" className="footer-link">Create Game</a></li>
            <li><a href="/examples" className="footer-link">Example Games</a></li>
            <li><a href="/how-it-works" className="footer-link">How It Works</a></li>
            <li><a href="/landing" className="footer-link">Features</a></li>
          </ul>
        </div>

        <div className="footer-about">
          <h3 className="footer-section-title">Contact</h3>
          <ul className="footer-link-list">
            <li>
              <a href="mailto:mirotammi44@gmail.com" className="footer-link">
                <span className="footer-emoji">📧</span> mirotammi44@gmail.com
              </a>
            </li>
            <li>
              <a href="https://mteif.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                <span className="footer-emoji">🌐</span> Portfolio: mteif.com
              </a>
            </li>
            <li>
              <a href="https://github.com/mbtammi" target="_blank" rel="noopener noreferrer" className="footer-link">
                <span className="footer-emoji">💻</span> GitHub
              </a>
            </li>
            <li>
              <button 
                onClick={() => setIsFeatureModalOpen(true)} 
                className="footer-link footer-button"
              >
                <span className="footer-emoji">�</span> Request a Feature
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-legal">
          <h3 className="footer-section-title">Legal</h3>
          <ul className="footer-link-list">
            <li><a href="/privacy-policy" className="footer-link">Privacy Policy</a></li>
            <li><a href="/terms-of-service" className="footer-link">Terms of Service</a></li>
            <li>
              <button 
                onClick={() => setIsCookieModalOpen(true)} 
                className="footer-link footer-button"
              >
                Cookie Policy
              </button>
            </li>
          </ul>
          <p className="footer-about-text" style={{ marginTop: '15px' }}>
            © 2025 Play Any Card Game. All rights reserved.
          </p>
        </div>
      </footer>

      <FeatureRequestModal 
        isOpen={isFeatureModalOpen} 
        onClose={() => setIsFeatureModalOpen(false)} 
      />
      
      <CookiePolicyModal 
        isOpen={isCookieModalOpen} 
        onClose={() => setIsCookieModalOpen(false)} 
      />
    </>
  );
};

export default Footer;
