
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import './Header.css';

const Header = () => {
  const { setCurrentPage } = useAppStore();
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
            <a href="#features">
              Features
            </a>
            <a href="#how-it-works">
              How it Works
            </a>
            <a href="#games">
              Example Games
            </a>
          </nav>

          {/* CTA Button */}
          <motion.button
            className="btn-primary header-cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('game')}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
