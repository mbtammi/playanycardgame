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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-4/5 mx-auto py-8"> {/* 80% width container */}
      <div className="relative overflow-hidden">
        {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -25, 0],
            rotate: [0, 8, 0]
          }}
          transition={{ 
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-24 right-12 w-28 h-28 bg-purple-200/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 35, 0],
            x: [0, -20, 0]
          }}
          transition={{ 
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-40 left-16 w-36 h-36 bg-emerald-200/15 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -8, 0]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/4 w-20 h-20 bg-blue-200/25 rounded-full blur-xl"
        />
      </div>

      <div className="max-w-5xl mx-auto relative">{/* Reduced from max-w-7xl */}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold group transition-colors bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200/50 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Example{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Games
            </span>
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Try these games or use them as inspiration for your own creations
          </motion.p>
        </motion.div>

        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-4 mb-12"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Star className="w-8 h-8 text-yellow-500" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Games</h2>
            </motion.div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto"> {/* Further reduced from max-w-2xl and removed lg:grid-cols-3 */}
              {featuredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + 0.1 * index, duration: 0.6 }}
                  whileHover={{ 
                    y: -10,
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-purple-100/50 hover:shadow-2xl hover:border-purple-200 transition-all duration-500 group"
                >
                  <div className="text-center mb-6">
                    <motion.div 
                      className="text-6xl mb-6"
                      whileHover={{ 
                        scale: 1.2,
                        rotate: [0, -10, 10, 0]
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {game.thumbnail}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {game.description}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between text-sm">
                      <motion.div 
                        className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-full"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{game.playerCount}</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-full"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{game.duration}</span>
                      </motion.div>
                    </div>
                    
                    <div className="flex justify-center">
                      <motion.span 
                        className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(game.difficulty)}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {game.difficulty}
                      </motion.span>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handlePlayGame(game.id)}
                    className="w-full btn-primary flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-5 h-5" />
                    Play Now
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Other Games */}
        {otherGames.length > 0 && (
          <section className="mb-20">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center"
            >
              More Games
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">{/* Reduced from max-w-6xl */}
              {otherGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + 0.1 * index, duration: 0.5 }}
                  whileHover={{ 
                    y: -8,
                    scale: 1.03,
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100/50 hover:shadow-xl hover:border-green-200 transition-all duration-400 group"
                >
                  <div className="text-center">
                    <motion.div 
                      className="text-4xl mb-4"
                      whileHover={{ 
                        scale: 1.3,
                        rotate: [0, -15, 15, 0]
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {game.thumbnail}
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                      {game.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <motion.div 
                        className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full"
                        whileHover={{ scale: 1.05 }}
                      >
                        {game.playerCount} • {game.duration}
                      </motion.div>
                      <motion.span 
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {game.difficulty}
                      </motion.span>
                    </div>

                    <motion.button
                      onClick={() => handlePlayGame(game.id)}
                      className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
                      whileHover={{ 
                        scale: 1.05,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-4 h-4" />
                      Play
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-center mt-20"
        >
          <motion.div
            className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm rounded-3xl p-12 lg:p-16 border-2 border-purple-200/50 shadow-2xl max-w-3xl mx-auto"
            whileHover={{ 
              y: -5,
              scale: 1.02,
              boxShadow: "0 40px 80px -20px rgba(147, 51, 234, 0.2)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.h3 
              className="text-3xl md:text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              Don't see your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                favorite game?
              </span>
            </motion.h3>
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              Create your own custom card game with our AI-powered rule builder
            </motion.p>
            <motion.button
              onClick={() => {
                setCurrentPage('rule-builder');
              }}
              className="btn-primary text-lg px-12 py-4 shadow-xl hover:shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your Own Game
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      </div> {/* Close overflow container */}
      </div> {/* Close 80% width container */}
    </div>
  );
};

export default ExamplesPage;
