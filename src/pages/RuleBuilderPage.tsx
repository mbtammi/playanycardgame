
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import RuleInput from '../components/RuleInput';

const RuleBuilderPage = () => {
  const { ruleBuilder, setCurrentPage } = useAppStore();

  const handleBack = () => {
    setCurrentPage('landing');
  };

  const handleNext = () => {
    // For now, just navigate to examples - in full implementation, this would handle the rule building flow
    setCurrentPage('examples');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-4/5 mx-auto py-8"> {/* 80% width container */}
      <div className="relative overflow-hidden">
        {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-32 right-16 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            x: [0, -15, 0]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-32 left-20 w-32 h-32 bg-green-200/15 rounded-full blur-2xl"
        />
      </div>

      <div className="max-w-3xl mx-auto relative">{/* Reduced from max-w-5xl */}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
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
          
          <motion.div 
            className="text-sm text-gray-600 font-medium bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-green-200/50 shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            Step {ruleBuilder.currentStep + 1} of {ruleBuilder.steps.length}
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            {ruleBuilder.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index <= ruleBuilder.currentStep ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <motion.div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                    index < ruleBuilder.currentStep
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-500 text-white shadow-xl'
                      : index === ruleBuilder.currentStep
                      ? 'bg-green-100 border-green-500 text-green-600 shadow-lg'
                      : 'bg-gray-100 border-gray-300 text-gray-400 shadow-sm'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  {index < ruleBuilder.currentStep ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {index + 1}
                    </motion.div>
                  )}
                </motion.div>
                {index < ruleBuilder.steps.length - 1 && (
                  <motion.div
                    className={`w-16 lg:w-24 h-2 mx-4 rounded-full transition-all duration-500 ${
                      index < ruleBuilder.currentStep 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gray-200'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  />
                )}
              </div>
            ))}
          </div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {ruleBuilder.steps[ruleBuilder.currentStep]?.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {ruleBuilder.steps[ruleBuilder.currentStep]?.description}
            </p>
          </motion.div>
        </motion.div>

        {/* Rule Builder Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          whileHover={{ y: -5 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 mb-12 shadow-2xl border border-green-100/50 hover:shadow-3xl transition-all duration-500"
        >
          <RuleInput />
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between gap-6 max-w-md mx-auto"
        >
          <motion.button
            onClick={handleBack}
            className="btn-secondary flex items-center justify-center gap-3 text-lg px-8 py-4 flex-1 sm:flex-none"
            whileHover={{ 
              scale: 1.05, 
              x: -5,
              transition: { type: "spring", stiffness: 400, damping: 17 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </motion.button>

          <motion.button
            onClick={handleNext}
            className="btn-primary flex items-center justify-center gap-3 text-lg px-8 py-4 shadow-xl hover:shadow-2xl flex-1 sm:flex-none"
            whileHover={{ 
              scale: 1.05, 
              x: 5,
              boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)",
              transition: { type: "spring", stiffness: 400, damping: 17 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            Try Examples Instead
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
      </div> {/* Close overflow container */}
      </div> {/* Close 80% width container */}
    </div>
  );
};

export default RuleBuilderPage;
