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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-4/5 mx-auto"> {/* 80% width container */}
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-20 h-20 bg-green-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-40 right-20 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-40 left-1/4 w-24 h-24 bg-green-300/25 rounded-full blur-xl"
        />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-6 lg:px-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Reduced from max-w-4xl */}{/* Reduced from max-w-4xl */}
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              PLAY ANY{' '}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                CARD GAME
              </motion.span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-xl mx-auto leading-relaxed"
            >
              Create, customize, and play any card game with AI-powered opponents and stunning animations
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <motion.button
                onClick={handlePlayNow}
                className="btn-primary text-lg px-10 py-4 flex items-center gap-3 shadow-xl hover:shadow-2xl m-4"
                whileHover={{ 
                  scale: 1.05, 
                  y: -3,
                  boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Play className="w-5 h-5" />
                Start Creating
              </motion.button>

              <motion.button
                onClick={handleHowItWorks}
                className="btn-secondary text-lg px-10 py-4 flex items-center gap-3 shadow-lg hover:shadow-xl"
                whileHover={{ 
                  scale: 1.05, 
                  y: -3 
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <BookOpen className="w-5 h-5" />
                How it Works
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Feature Cards Section */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">{/* Reduced from max-w-5xl */}
            {/* Left Card - Description */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-green-100/50 h-full flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group-hover:border-green-200">
                <div>
                  <motion.h2 
                    className="text-3xl font-bold text-gray-900 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Create Any Card Game with AI
                  </motion.h2>
                  <div className="space-y-4 text-gray-700">
                    <motion.p 
                      className="text-lg leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      Tell us your game rules, and our AI will instantly create a playable version with smart bots and beautiful animations.
                    </motion.p>
                    <motion.p 
                      className="text-lg leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      From classic games to your wildest inventions - if you can describe it, we can build it.
                    </motion.p>
                  </div>
                </div>
                <motion.div 
                  className="grid grid-cols-2 gap-4 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div 
                    className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl mb-3">⚡</div>
                    <div className="text-sm font-semibold text-gray-700">Instant Creation</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl mb-3">🤖</div>
                    <div className="text-sm font-semibold text-gray-700">Smart AI Bots</div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Card - Popular Games */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-green-100/50 h-full flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group-hover:border-green-200">
                <div>
                  <motion.div 
                    className="flex items-center gap-3 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Most Played This Week</h3>
                  </motion.div>
                  <div className="space-y-3">
                    {popularGames.map((game, index) => (
                      <motion.div
                        key={game.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                        whileHover={{ 
                          scale: 1.02, 
                          x: 10,
                          transition: { type: "spring", stiffness: 400, damping: 17 }
                        }}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 border border-transparent hover:border-green-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            {index + 1}
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-900">{game.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {game.players} players
                            </div>
                          </div>
                        </div>
                        <motion.div 
                          className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full"
                          whileHover={{ scale: 1.1 }}
                        >
                          {game.trend}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <motion.div 
                  className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl text-center group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-700">
                    Join the community and create your own hit game!
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 bg-gradient-to-br from-white to-green-50/30">
        <div className="max-w-4xl mx-auto">{/* Reduced from max-w-6xl */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              How It Works
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Create your dream card game in 3 simple steps
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">{/* Reduced from max-w-5xl */}
            {[
              {
                step: '1',
                title: 'Describe Your Game',
                description: 'Tell us the rules using our intuitive form builder',
                icon: '📝',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '2',
                title: 'AI Creates Magic',
                description: 'Our AI builds the complete game logic instantly',
                icon: '✨',
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '3',
                title: 'Play Instantly',
                description: 'Enjoy your game with smart AI opponents',
                icon: '🎮',
                color: 'from-green-500 to-emerald-500'
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ 
                  y: -10,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
                viewport={{ once: true }}
                className="text-center relative group"
              >
                <motion.div 
                  className={`bg-gradient-to-r ${step.color} text-white w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.step}
                </motion.div>
                <motion.div 
                  className="text-5xl mb-6"
                  whileHover={{ 
                    scale: 1.2,
                    rotate: [0, -10, 10, 0]
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.icon}
                </motion.div>
                <motion.h3 
                  className="text-2xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {step.title}
                </motion.h3>
                <motion.p 
                  className="text-gray-600 text-lg leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {step.description}
                </motion.p>

                {/* Connection line to next step */}
                {index < 2 && (
                  <motion.div
                    className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-green-300 to-emerald-300"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 + index * 0.3 }}
                    viewport={{ once: true }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <motion.button
              onClick={handlePlayNow}
              className="btn-primary text-lg px-12 py-4 shadow-xl hover:shadow-2xl"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Start Building Your Game
            </motion.button>
          </motion.div>
        </div>
      </section>
      </div> {/* Close 80% width container */}
    </div>
  );
};

export default LandingPage;
