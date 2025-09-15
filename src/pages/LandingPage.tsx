import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Play, BookOpen, Sparkles, Users, Trophy } from 'lucide-react';
import './LandingPage.css';
import AdSlot from '../components/AdSlot';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setGameMode } = useAppStore();

  const handlePlayNow = () => {
    setGameMode('create');
    navigate('/rule-builder');
  };

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Creation',
      description: 'Describe your game in plain English and watch AI build it instantly.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart Opponents',
      description: 'Play against intelligent AI bots that adapt to your game rules.'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Endless Possibilities',
      description: 'From classic games to wild inventions - create anything you can imagine.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Describe Your Game',
      description: 'Tell us the rules using our simple form'
    },
    {
      number: '2', 
      title: 'AI Creates Magic',
      description: 'Our AI builds the complete game instantly'
    },
    {
      number: '3',
      title: 'Play & Share',
      description: 'Enjoy your game with friends and AI opponents'
    }
  ];

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-content"
          >
            <h1 className="hero-title">
              Create Any Card Game
              <br />
              <span className="hero-title-accent">with AI</span>
            </h1>
            <p className="hero-description">
              Describe your dream card game in plain English and watch AI bring it to life instantly. 
              Play with smart opponents and share with friends.
            </p>
            <p className="hero-subnote">Join 100+ players experimenting with AI‑generated card games.</p>
            <div className="hero-buttons">
              <motion.button
                onClick={handlePlayNow}
                className="btn-primary text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play size={20} />
                Start Creating
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/examples')}
                className="btn-secondary text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BookOpen size={20} />
                Browse Examples
              </motion.button>
            </div>
          </motion.div>
        </section>

  {/* Features and Leaderboard Section */}
        <section className="features-section">
          <div className="features-container">
            <div className="features-grid">
              {/* Features - Left Side */}
              <div className="features-card">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="features-header"
                >
                  <h2 className="features-title">
                    Why Choose Our Platform?
                  </h2>
                  <p className="features-subtitle">
                    Built for creators, gamers, and anyone who loves card games
                  </p>
                </motion.div>

                <div className="features-list">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="feature-item"
                      whileHover={{ x: 4 }}
                    >
                      <div className="feature-icon">
                        {feature.icon}
                      </div>
                      <div className="feature-content">
                        <h3>
                          {feature.title}
                        </h3>
                        <p>
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Leaderboard Placeholder - Right Side */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="leaderboard-card"
              >
                <div className="leaderboard-header">
                  <Trophy className="leaderboard-icon" />
                  <h3 className="leaderboard-title">Leaderboard</h3>
                </div>
                
                <div className="leaderboard-list">
                  {/* Placeholder leaderboard entries */}
                  {[1, 2, 3, 4, 5].map((position) => (
                    <div key={position} className="leaderboard-item">
                      <div className="leaderboard-player">
                        <span className="leaderboard-position">
                          {position}
                        </span>
                        <div className="leaderboard-name-placeholder"></div>
                      </div>
                      <div className="leaderboard-score-placeholder"></div>
                    </div>
                  ))}
                </div>
                
                <div className="leaderboard-footer">
                  <p className="leaderboard-coming-soon">Coming Soon!</p>
                  <p className="leaderboard-subtitle">
                    Compete with players worldwide
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Monetization Slot (below the fold) */}
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '1rem 1.25rem 0' }}>
          <AdSlot slotId="landing_below_fold" />
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works-section">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="how-it-works-header"
          >
            <h2 className="how-it-works-title">
              How It Works
            </h2>
            <p className="how-it-works-description">
              Create your dream card game in 3 simple steps
            </p>
          </motion.div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="step-item"
              >
                <div className="step-number">
                  {step.number}
                </div>
                <h3 className="step-title">
                  {step.title}
                </h3>
                <p className="step-description">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="final-cta"
          >
            <button
              onClick={handlePlayNow}
              className="btn-primary text-lg final-cta-button"
            >
              Start Building Your Game
            </button>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
