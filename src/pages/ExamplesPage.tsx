import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { predefinedGames, getFeaturedGames } from '../utils/predefinedGames';
import { Play, Users, Clock, ArrowLeft, Star } from 'lucide-react';

const ExamplesPage = () => {
  const { setCurrentPage, createNewGame } = useAppStore();

  const handlePlayGame = (gameId: string) => {
    const game = predefinedGames.find(g => g.id === gameId);
    if (game) {
      createNewGame(game.rules);
    }
  };

  const handleBack = () => {
    setCurrentPage('landing');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const featuredGames = getFeaturedGames();
  const otherGames = predefinedGames.filter(game => !game.featured);

  return (
    <div className="min-h-screen py-12 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Example Games
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Try these games or use them as inspiration for your own creations
          </p>
        </motion.div>

        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-10"
            >
              <Star className="w-7 h-7 text-yellow-500" />
              <h2 className="text-3xl font-bold text-gray-900">Featured Games</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {featuredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="card p-8 group hover:shadow-2xl transform hover:-translate-y-3 transition-all duration-300"
                >
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {game.thumbnail}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {game.description}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">{game.playerCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{game.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlayGame(game.id)}
                    className="w-full btn-primary flex items-center justify-center gap-3 group-hover:scale-105 transition-transform"
                  >
                    <Play className="w-5 h-5" />
                    Play Now
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Other Games */}
        {otherGames.length > 0 && (
          <section className="mb-20">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-gray-900 mb-10"
            >
              More Games
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {otherGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + 0.1 * index }}
                  className="card p-6 group hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {game.thumbnail}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {game.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="text-sm text-gray-500 font-medium">
                        {game.playerCount} • {game.duration}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayGame(game.id)}
                      className="w-full btn-secondary py-3 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform"
                    >
                      <Play className="w-4 h-4" />
                      Play
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-24"
        >
          <div className="card p-12 lg:p-16 bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-100 shadow-xl">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Don't see your favorite game?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create your own custom card game with our AI-powered rule builder
            </p>
            <motion.button
              onClick={() => {
                setCurrentPage('rule-builder');
              }}
              className="btn-primary text-lg px-10 py-4 shadow-lg"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your Own Game
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamplesPage;
