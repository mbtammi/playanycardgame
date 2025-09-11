import React from 'react';
import './HowItWorksPage.css';

const HowItWorksPage: React.FC = () => {
  return (
    <div className="how-it-works-page">
      <div className="how-it-works-container">
        <header className="how-it-works-header">
          <h1 className="how-it-works-title">How It Works</h1>
          <p className="how-it-works-subtitle">
            Discover how AI transforms your card game ideas into playable experiences
          </p>
        </header>

        <div className="how-it-works-steps">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3 className="step-title">Describe Your Game</h3>
              <p className="step-description">
                Simply describe your card game idea in plain English. Tell us about the players, 
                rules, objectives, and any special mechanics you want. Our AI understands natural language!
              </p>
              <div className="step-example">
                <strong>Example:</strong> "A game for 3 players where I have 5 cards, bots have 10 cards. 
                Play cards that are 3, 6, or 9 numbers higher or lower than the previous card."
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">AI Creates Your Game</h3>
              <p className="step-description">
                Our advanced AI analyzes your description and automatically generates a complete 
                game schema including rules, win conditions, turn structure, and card mechanics.
              </p>
              <div className="step-features">
                <div className="feature-item">✅ Validates game logic</div>
                <div className="feature-item">✅ Fixes potential issues</div>
                <div className="feature-item">✅ Balances gameplay</div>
                <div className="feature-item">✅ Creates smart bot opponents</div>
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3 className="step-title">Play Instantly</h3>
              <p className="step-description">
                Your game comes to life instantly! Play against intelligent AI bots with smooth 
                animations, card interactions, and a polished gaming experience.
              </p>
              <div className="step-features">
                <div className="feature-item">🎮 Animated card gameplay</div>
                <div className="feature-item">🤖 Smart AI opponents</div>
                <div className="feature-item">📱 Responsive design</div>
                <div className="feature-item">⚡ Instant game creation</div>
              </div>
            </div>
          </div>
        </div>

        <div className="how-it-works-features">
          <h2 className="features-title">Powerful AI Features</h2>
          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon">🧠</div>
              <h4>Smart Game Logic</h4>
              <p>AI understands complex card game mechanics and creates balanced, playable experiences.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🔧</div>
              <h4>Auto-Fix Issues</h4>
              <p>Automatically detects and fixes logical problems to ensure your game always works.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🎯</div>
              <h4>Asymmetric Gameplay</h4>
              <p>Supports different starting conditions, card counts, and special rules for each player.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🃏</div>
              <h4>Flexible Card Rules</h4>
              <p>Create games with any combination of suits, ranks, special cards, and interactions.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🎲</div>
              <h4>Multiple Game Types</h4>
              <p>From simple matching games to complex strategy games - the possibilities are endless.</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">⚡</div>
              <h4>Instant Creation</h4>
              <p>Go from idea to playable game in seconds, not hours of programming and testing.</p>
            </div>
          </div>
        </div>

        <div className="how-it-works-cta">
          <h2>Ready to Create Your Own Game?</h2>
          <p>Join thousands of players creating unique card games with AI assistance.</p>
          <a href="/rule-builder" className="cta-button">
            Start Creating Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
