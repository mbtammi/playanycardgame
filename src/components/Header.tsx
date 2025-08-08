
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../store';

const Header = () => {
  const { setCurrentPage } = useAppStore();
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Play Any Card Game</h1>
              <p className="text-xs text-gray-500">AI-Powered Game Creator</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
            >
              How it Works
            </a>
            <a
              href="#games"
              className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
            >
              Example Games
            </a>
          </nav>

          {/* CTA Button */}
          <motion.button
            className="btn-primary text-sm px-6 py-2"
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
