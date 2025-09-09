
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="header"
    >
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <motion.div
            className="header-logo"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/landing')}
            style={{ cursor: 'pointer' }}
          >
            <div className="header-logo-icon">
              <Sparkles />
            </div>
            <div className="header-logo-text">
              <h1>Play Any Card Game</h1>
              <p>AI-Powered Game Creator</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="header-nav">
            <Link to="/examples">
              Examples
            </Link>
            <Link to="/rule-builder">
              Create Game
            </Link>
            <a href="#features">
              Features
            </a>
          </nav>

          {/* CTA Button */}
          <motion.button
            className="btn-primary header-cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/game')}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
