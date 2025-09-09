
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import RuleInput from '../components/RuleInput';
import './RuleBuilderPage.css';

const RuleBuilderPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/landing');
  };

  const handleNext = () => {
    // For now, just navigate to examples - in full implementation, this would handle the rule building flow
    navigate('/examples');
  };

  return (
    <div className="rule-builder-container">
      <div className="rule-builder-content">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rule-builder-header"
        >
          <button
            onClick={handleBack}
            className="rule-builder-back-button"
          >
            <ArrowLeft size={24} />
            <span>Back to Home</span>
          </button>
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rule-builder-title-section"
        >
          <div className="rule-builder-title-header">
            <Sparkles />
            <h1 className="rule-builder-title">
              Build Your Game
            </h1>
          </div>
          <p className="rule-builder-description">
            Describe your card game rules and let AI create the perfect game for you
          </p>
        </motion.div>

        {/* Rule Builder Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="rule-builder-form"
        >
          <RuleInput />
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="rule-builder-navigation"
        >
          <button
            onClick={handleNext}
            className="btn-primary rule-builder-nav-button"
          >
            Try Examples Instead
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default RuleBuilderPage;
