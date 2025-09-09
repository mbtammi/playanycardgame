import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Play, BookOpen, Sparkles, Users, Trophy } from 'lucide-react';

const LandingPage = () => {
  const { setGameMode } = useAppStore();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-8">
        {/* Hero Section */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Create Any Card Game
              <br />
              <span className="text-gray-600">with AI</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Describe your dream card game in plain English and watch AI bring it to life instantly. 
              Play with smart opponents and share with friends.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
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

        {/* Features Section */}
        <section className="py-20 bg-gray-50 -mx-8 px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for creators, gamers, and anyone who loves card games
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-8 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center mx-auto mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create your dream card game in 3 simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
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
            className="text-center mt-16"
          >
            <button
              onClick={handlePlayNow}
              className="btn-primary text-lg"
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
