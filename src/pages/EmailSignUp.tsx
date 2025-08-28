import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import { useAppStore } from '../store';
import { addEmailToFirestore } from '../utils/firebase';
import './EmailSignUp.css';

interface EmailSignUpProps {
  onComplete?: () => void;
}

const EmailSignUp: React.FC<EmailSignUpProps> = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const { setCurrentPage } = useAppStore();

  // Show status message
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Submit email to Firebase
  const submitToFirebase = async (email: string): Promise<boolean> => {
    try {
      return await addEmailToFirestore(email);
    } catch (error) {
      console.error('Firebase submission error:', error);
      return false;
    }
  };

  // Submit email to backend (fallback)
  const submitToBackend = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      showMessage('Please enter your email address.', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showMessage('Please enter a valid email address.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Try Firebase first, then backend, then localStorage as final fallback
    let success = await submitToFirebase(trimmedEmail);
    
    if (!success) {
      success = await submitToBackend(trimmedEmail);
    }
    
    if (success) {
      showMessage('🎉 Thanks! We\'ll notify you when the game launches!', 'success');
      setEmail('');
      // Also save to localStorage as backup
      const localEmails = JSON.parse(localStorage.getItem('gameEmails') || '[]');
      if (!localEmails.includes(trimmedEmail)) {
        localEmails.push(trimmedEmail);
        localStorage.setItem('gameEmails', JSON.stringify(localEmails));
      }
      onComplete?.();
    } else {
      // Final fallback to localStorage if both Firebase and backend fail
      const localEmails = JSON.parse(localStorage.getItem('gameEmails') || '[]');
      
      if (localEmails.includes(trimmedEmail)) {
        showMessage('You\'re already on the list! 🎮', 'success');
      } else {
        localEmails.push(trimmedEmail);
        localStorage.setItem('gameEmails', JSON.stringify(localEmails));
        showMessage('✅ We\'ll notify you at launch.', 'success');
        setEmail('');
        onComplete?.();
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="email-signup-page">
      <div className="email-signup-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="signup-card"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="logo-section"
          >
            <div className="game-icon">🃏</div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1>Play Any Card Game</h1>
            <p className="subtitle">
              Create and play any playing card game with AI-powered rules interpretation.
              Be the first to know when we launch!
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="signup-form"
          >
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="email-input"
                disabled={isSubmitting}
                required
              />
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="submit-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <span className="loading">
                    <span className="spinner"></span>
                    Subscribing...
                  </span>
                ) : (
                  'Notify Me at Launch! 🚀'
                )}
              </motion.button>
            </div>

            {/* Message Display */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`message ${messageType}`}
              >
                {message}
              </motion.div>
            )}
          </motion.form>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="features-preview"
          >
            <h3>What's Coming:</h3>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Create any card game</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI-powered bots</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Play anywhere</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎮</span>
                <span>Beautiful animations</span>
              </div>
            </div>
            
            {/* Development: Skip to Game */}
            {/* <motion.button
              onClick={() => setCurrentPage('examples')}
              className="skip-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🎮 Try the Game Now (Preview)
            </motion.button> */}
            
            {/* Admin access (hidden) */}
            <div 
              style={{ 
                marginTop: '15px', 
                textAlign: 'center', 
                opacity: 0.3,
                fontSize: '0.8rem'
              }}
            >
              {/* <button
                onClick={() => setCurrentPage('admin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                admin
              </button> */}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailSignUp;