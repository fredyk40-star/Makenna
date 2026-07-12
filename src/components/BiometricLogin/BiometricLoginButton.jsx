import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BiometricService } from '../../services/BiometricService';
import { useChildAccount } from '../../context/ChildAccountContext';
import { useVoiceGuide } from '../../context/VoiceGuideContext';

const BiometricLoginButton = () => {
  const { childId, childName } = useChildAccount();
  const { speak } = useVoiceGuide();
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = BiometricService.isSupported();
      setIsSupported(supported);
      
      if (supported) {
        const available = await BiometricService.isAvailable();
        setIsAvailable(available);
      }
      
      if (childId) {
        setIsEnabled(BiometricService.isEnabled(childId));
      }
    };
    checkSupport();
  }, [childId]);

  const handleEnable = async () => {
    if (!childId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await BiometricService.enableBiometric(childId, childName);
      if (success) {
        setIsEnabled(true);
        speak('Biometric login enabled! You can now log in with your face or fingerprint.');
      }
    } catch (err) {
      setError(err.message);
      speak('Sorry, could not enable biometric login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = () => {
    if (window.confirm('Disable biometric login?')) {
      BiometricService.disableBiometric(childId);
      setIsEnabled(false);
    }
  };

  const handleLogin = async () => {
    if (!childId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await BiometricService.authenticate(childId);
      if (result.success) {
        speak(`Welcome back, ${childName}!`);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          📱 Biometric login is not supported on this device
        </p>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🔐 This device doesn't have biometric capabilities
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span>👆</span>
          Biometric Login
        </h3>
        <button
          onClick={() => setShowGuidance(true)}
          className="text-xs text-purple-600 dark:text-purple-400 underline"
        >
          How does it work?
        </button>
      </div>

      {isEnabled ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600 dark:text-green-400">✅ Enabled for {childName}</p>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login with Biometrics'}
          </button>
          <button
            onClick={handleDisable}
            className="w-full py-1 text-xs text-gray-500 hover:text-red-500"
          >
            Disable Biometric Login
          </button>
        </div>
      ) : (
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : 'Enable Biometric Login'}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      {/* Guidance Modal */}
      {showGuidance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {BiometricService.getParentGuidance().title}
            </h3>
            <ol className="space-y-2 mb-4">
              {BiometricService.getParentGuidance().steps.map((step, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold mb-1">Supported Devices:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400">
                {BiometricService.getSupportedPlatforms().map((platform, index) => (
                  <li key={index}>{platform.icon} {platform.platform}: {platform.support}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setShowGuidance(false)}
              className="w-full py-2 bg-purple-500 text-white rounded-lg"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BiometricLoginButton;