import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import alphabetSpeech from '../../services/AlphabetSpeechService';

const VoiceButton = memo(({
  text,
  label = 'Listen',
  className = '',
  rate = 0.85,
  pitch = 1.05,
  slow = false,
  onPracticed = null,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (isSpeaking) {
      alphabetSpeech.cancel();
      if (mountedRef.current) setIsSpeaking(false);
      return;
    }

    if (mountedRef.current) setIsSpeaking(true);
    const spoken = await alphabetSpeech.speak(text, {
      rate: slow ? 0.55 : rate,
      pitch,
    });
    if (mountedRef.current) setIsSpeaking(false);
    if (onPracticed) onPracticed({ text, spoken });
  }, [isSpeaking, text, rate, pitch, slow, onPracticed]);

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isSpeaking ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className}`}
      aria-label={isSpeaking ? 'Stop speaking' : label}
      aria-pressed={isSpeaking}
      title={label}
      type="button"
    >
      {isSpeaking ? <FaVolumeMute className="text-xl" /> : <FaVolumeUp className="text-xl" />}
    </motion.button>
  );
});

VoiceButton.displayName = 'VoiceButton';

export default VoiceButton;
