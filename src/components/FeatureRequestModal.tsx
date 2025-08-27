import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FeatureRequestModal.css';

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeatureRequestModal: React.FC<FeatureRequestModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [feature, setFeature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !feature) {
      alert('Please fill in both fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit to your backend API
      const response = await fetch('/api/feature-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, feature })
      });

      if (response.ok) {
        setIsSubmitted(true);
        setEmail('');
        setFeature('');
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="feature-modal-backdrop"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="feature-modal"
          >
            <div className="feature-modal-header">
              <h2>🚀 Request a Feature</h2>
              <button className="feature-modal-close" onClick={onClose}>
                ✕
              </button>
            </div>
            
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="feature-modal-success"
              >
                <div className="success-icon">✅</div>
                <h3>Thank you!</h3>
                <p>Your feature request has been submitted. We'll review it and get back to you!</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="feature-modal-form">
                <div className="feature-modal-body">
                  <p className="feature-modal-description">
                    Have an idea for a new feature or improvement? We'd love to hear from you!
                  </p>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="feature">Feature Request</label>
                    <textarea
                      id="feature"
                      value={feature}
                      onChange={(e) => setFeature(e.target.value)}
                      placeholder="Describe the feature you'd like to see..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
                
                <div className="feature-modal-footer">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="feature-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="feature-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '📤 Submitting...' : '🚀 Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeatureRequestModal;
