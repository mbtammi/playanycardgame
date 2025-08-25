import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-branding">
        <h2 className="footer-brand-name">Play Any Card Game</h2>
        <p className="footer-tagline">Create, play, and enjoy card games powered by AI</p>
      </div>

      <div className="footer-links">
        <h3 className="footer-section-title">Quick Links</h3>
        <ul className="footer-link-list">
          <li><a href="#" className="footer-link">Create Game</a></li>
          <li><a href="#" className="footer-link">Example Games</a></li>
          <li><a href="#" className="footer-link">How It Works</a></li>
          <li><a href="#" className="footer-link">Features</a></li>
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
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              <span className="footer-emoji">💻</span> GitHub
            </a>
          </li>
          <li>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              <span className="footer-emoji">📝</span> Report a Bug/Feature
            </a>
          </li>
        </ul>
      </div>

      <div className="footer-legal">
        <h3 className="footer-section-title">Legal</h3>
        <ul className="footer-link-list">
          <li><a href="#" className="footer-link">Privacy Policy</a></li>
          <li><a href="#" className="footer-link">Terms of Service</a></li>
          <li><a href="#" className="footer-link">Cookie Policy</a></li>
        </ul>
        <p className="footer-about-text" style={{ marginTop: '15px' }}>
          © 2025 Play Any Card Game. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
