import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { predefinedGames, getFeaturedGames } from '../utils/predefinedGames';
import { Play, Users, Clock, ArrowLeft, Star, Mail } from 'lucide-react';
import { isDevelopment } from '../utils/environment';
import './ExamplesPage.css';

const ExamplesPage = () => {
  const navigate = useNavigate();
  const { createNewGame } = useAppStore();

  const handlePlayGame = (gameId: string) => {
    const game = predefinedGames.find(g => g.id === gameId);
    if (game) {
      createNewGame(game.rules);
      navigate('/game');
    }
  };

  const handleBack = () => {
    navigate('/landing');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'difficulty-default';
    }
  };

  const featuredGames = getFeaturedGames();

  return (
    <div className="examples-container">
      <div className="examples-content">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="examples-header"
        >
          <button
            onClick={handleBack}
            className="examples-back-button"
          >
            <ArrowLeft size={24} />
            <span>Back to Home</span>
          </button>
          
          {/* Development: Newsletter Preview */}
          {isDevelopment && (
            <button
              onClick={() => navigate('/newsletter')}
              className="dev-newsletter-button"
              title="Preview Newsletter Page"
            >
              <Mail size={20} />
              <span>Newsletter</span>
            </button>
          )}
        </motion.div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="examples-title-section"
        >
          <h1 className="examples-title">
            Game Library
          </h1>
          <p className="examples-description">
            Choose from our collection of classic and modern card games
          </p>
        </motion.div>

        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="featured-games-section"
          >
            <div className="featured-games-header">
              <Star />
              <h2 className="featured-games-title">Featured Games</h2>
            </div>
            <div className="featured-games-grid">
              {featuredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="game-card"
                  whileHover={{ y: -4 }}
                >
                  <div className="game-card-header">
                    <h3 className="game-card-title">
                      {game.name}
                    </h3>
                    <Star className="game-card-star" />
                  </div>
                  
                  <p className="game-card-description">
                    {game.description}
                  </p>
                  
                  <div className="game-card-meta">
                    <div className="game-card-meta-item">
                      <Users />
                      <span>{game.playerCount}</span>
                    </div>
                    <div className="game-card-meta-item">
                      <Clock />
                      <span>{game.duration}</span>
                    </div>
                    <span className={`game-card-difficulty ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handlePlayGame(game.id)}
                    className="game-card-button"
                  >
                    <Play />
                    Play Now
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Games */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="all-games-section"
        >
          <h2 className="all-games-title">All Games</h2>
          <div className="all-games-grid">
            {predefinedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.05 }}
                className="game-card"
                whileHover={{ y: -4 }}
              >
                <div className="game-card-header">
                  <h3 className="game-card-title">
                    {game.name}
                  </h3>
                  {game.featured && (
                    <Star className="game-card-star" />
                  )}
                </div>
                
                <p className="game-card-description">
                  {game.description}
                </p>
                
                <div className="game-card-meta">
                  <div className="game-card-meta-item">
                    <Users />
                    <span>{game.playerCount}</span>
                  </div>
                  <div className="game-card-meta-item">
                    <Clock />
                    <span>{game.duration}</span>
                  </div>
                  <span className={`game-card-difficulty ${getDifficultyColor(game.difficulty)}`}>
                    {game.difficulty}
                  </span>
                </div>
                
                <button
                  onClick={() => handlePlayGame(game.id)}
                  className="game-card-button"
                >
                  <Play />
                  Play Now
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="examples-cta-section"
        >
          <div className="examples-cta-container">
            <h3 className="examples-cta-title">
              Don't see your favorite game?
            </h3>
            <p className="examples-cta-description">
              Create your own custom card game with our AI-powered rule builder
            </p>
            <button
              onClick={() => navigate('/rule-builder')}
              className="btn-primary examples-cta-button"
            >
              Create Your Own Game
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamplesPage;
