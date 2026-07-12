import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import { loginSteps, registerSteps } from '../../data/loginGuidance';

const LoginGuidance = ({ pageType = 'login', autoPlay = false }) => {
   const [currentStep, setCurrentStep] = useState(0);
   const [isMinimized, setIsMinimized] = useState(false);
   const { speak, cancel, isSpeaking, isMuted } = useVoiceGuide();
   
   const steps = pageType === 'login' ? loginSteps : registerSteps;

   // Auto-play guidance on mount - requires user interaction first
   // Note: Browser autoplay policies block speech until user clicks/taps
   useEffect(() => {
     if (autoPlay && !isMuted && steps.length > 0) {
       const timer = setTimeout(() => {
         speak(steps[0].voiceText, { rate: 0.9 });
       }, 2000); // Wait 2 seconds after page load
       return () => clearTimeout(timer);
     }
   }, [autoPlay, isMuted, speak, steps]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      speak(steps[nextStep].voiceText, { rate: 0.9 });
    }
  }, [currentStep, speak, steps]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      speak(steps[prevStep].voiceText, { rate: 0.9 });
    }
  }, [currentStep, speak, steps]);

  const handleStop = useCallback(() => {
    cancel();
  }, [cancel]);

  const stepVariants = {
    enter: { opacity: 0, x: 50, scale: 0.9 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -50, scale: 0.9 }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      {/* Guidance Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-label="AI Assistant">🤖</span>
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">
            AI Helper: {pageType === 'login' ? 'How to Log In' : 'How to Create Account'}
          </h2>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={isMinimized ? 'Expand guidance' : 'Minimize guidance'}
        >
          {isMinimized ? '📖' : '✋'}
        </button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl p-4 shadow-lg"
          >
            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep 
                      ? 'bg-purple-500 scale-125' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Step ${index + 1} ${index === currentStep ? 'active' : ''}`}
                />
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="text-5xl mb-3" aria-hidden="true">
                  {steps[currentStep].illustration}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentStep === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700'
                }`}
                aria-label="Previous step"
              >
                👈 Previous
              </button>

              <button
                onClick={handleStop}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                aria-label="Stop reading"
              >
                {isSpeaking ? '🔇 Stop' : '🔊 Read'}
              </button>

              <button
                onClick={currentStep === steps.length - 1 ? () => {} : handleNext}
                disabled={currentStep === steps.length - 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentStep === steps.length - 1
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-600 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                aria-label={currentStep === steps.length - 1 ? 'Done' : 'Next step'}
              >
                {currentStep === steps.length - 1 ? '✅ Done!' : 'Next 👉'}
              </button>
            </div>

            {/* Helpful Tip */}
            <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                💡 Tip: Your parent can help you find your Child ID on the previous screen!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginGuidance;