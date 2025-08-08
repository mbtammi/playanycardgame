import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { Play, BookOpen, TrendingUp, Users, Trophy } from 'lucide-react';

const LandingPage = () => {
  const { setCurrentPage, setGameMode } = useAppStore();

  const handlePlayNow = () => {
    setGameMode('create');
    setCurrentPage('rule-builder');
  };

  const handleHowItWorks = () => {
    // Scroll to how it works section
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const popularGames = [
    { name: 'Poker', players: '2,341', trend: '+12%' },
    { name: 'Blackjack', players: '1,892', trend: '+8%' },
    { name: 'Go Fish', players: '1,654', trend: '+15%' },
    { name: 'Crazy 8s', players: '1,234', trend: '+5%' },
    { name: 'War', players: '987', trend: '+18%' },
    { name: 'Old Maid', players: '756', trend: '+9%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 lg:px-8">
        <div className="mx-auto" style={{ width: '70%' }}>
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 tracking-tight">
              PLAY ANY{' '}
              <span className="text-green-600">
                CARD GAME
              </span>
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <motion.button
                onClick={handlePlayNow}
                className="btn-primary text-xl px-12 py-5 flex items-center gap-3 shadow-lg"
                style={{ marginBottom: '1rem' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-6 h-6 inline" />
                Play Now
              </motion.button>

              <motion.button
                onClick={handleHowItWorks}
                className="btn-secondary text-xl px-12 py-5 flex items-center gap-3 shadow-lg"
                style={{ marginBottom: '2rem' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-6 h-6 inline" />
                How it Works
              </motion.button>
            </div>
          </motion.div>

          {/* Side-by-side Cards Section */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
            {/* Left Card - Description */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full lg:w-1/2"
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-green-100 w-full flex flex-col justify-between">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Create Any Card Game with AI
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg leading-relaxed">
                    Tell us your game rules, and our AI will instantly create a playable version with smart bots and beautiful animations.
                  </p>
                  <p className="text-lg leading-relaxed">
                    From classic games to your wildest inventions - if you can describe it, we can build it.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">⚡</div>
                    <div className="text-sm font-semibold text-gray-700 mt-2">Instant Creation</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">🤖</div>
                    <div className="text-sm font-semibold text-gray-700 mt-2">Smart AI Bots</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vertical Divider for large screens */}
            <div className="hidden lg:block h-full w-px bg-green-100 mx-4 self-stretch" aria-hidden="true"></div>

            {/* Right Card - Popular Games */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full lg:w-1/2"
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-green-100 w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Most Played This Week</h3>
                  </div>
                  <div className="space-y-3">
                    {popularGames.map((game, index) => (
                      <motion.div
                        key={game.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-green-50 transition-colors duration-200 border border-gray-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{game.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {game.players} players
                            </div>
                          </div>
                        </div>
                        <div className="text-green-600 font-bold text-sm">
                          {game.trend}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-xl text-center">
                  <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-700">
                    Join the community and create your own hit game!
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-8" >
        <div className="mx-auto" style={{ width: '70%' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Create your game in 3 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Describe Your Game',
                description: 'Tell us the rules using our simple form',
                icon: '📝',
              },
              {
                step: '2',
                title: 'AI Creates Magic',
                description: 'Our AI builds the complete game logic',
                icon: '✨',
              },
              {
                step: '3',
                title: 'Play Instantly',
                description: 'Enjoy your game with smart AI opponents',
                icon: '🎮',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg">
                  {step.step}
                </div>
                <div className="text-4xl mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
