
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
    <div className="min-h-screen py-12 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div className="text-sm text-gray-500 font-medium bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
            Step {ruleBuilder.currentStep + 1} of {ruleBuilder.steps.length}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            {ruleBuilder.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index <= ruleBuilder.currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    index < ruleBuilder.currentStep
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                      : index === ruleBuilder.currentStep
                      ? 'bg-primary-100 border-primary-600 text-primary-600 shadow-md'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {index < ruleBuilder.currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < ruleBuilder.steps.length - 1 && (
                  <div
                    className={`w-20 lg:w-32 h-1 mx-4 rounded-full transition-all duration-300 ${
                      index < ruleBuilder.currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {ruleBuilder.steps[ruleBuilder.currentStep]?.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {ruleBuilder.steps[ruleBuilder.currentStep]?.description}
            </p>
          </div>
        </motion.div>

        {/* Rule Builder Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-12 lg:p-16 mb-12 shadow-2xl"
        >
          <RuleInput />
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-between gap-4"
        >
          <motion.button
            onClick={handleBack}
            className="btn-secondary flex items-center justify-center gap-3 text-lg px-8 py-4"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </motion.button>

          <motion.button
            onClick={handleNext}
            className="btn-primary flex items-center justify-center gap-3 text-lg px-8 py-4 shadow-lg"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Examples Instead
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default RuleBuilderPage;
