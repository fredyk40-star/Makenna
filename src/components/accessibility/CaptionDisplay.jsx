import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';
import AccessibilityService from '../../services/AccessibilityService';

// Captions belong to the screen that produced them. Auth screens must never
// inherit a stale caption (for example a single letter from an alphabet game).
const CAPTION_FREE_ROUTES = new Set([
  '/login',
  '/register',
  '/support',
  '/reset-credential',
  '/developer-login',
  '/developer-forgot-password',
  '/developer-reset-password',
]);

const CaptionDisplay = () => {
  const { captions } = useAccessibility();
  const { pathname } = useLocation();
  const [caption, setCaption] = useState('');
  const hideTimer = useRef(null);

  const hideCaption = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setCaption('');
  }, []);

  useEffect(() => {
    const unsubscribe = AccessibilityService.subscribeCaptions((text) => {
      const clean = typeof text === 'string' ? text.trim() : '';
      // Single characters (e.g. isolated letter sounds like "C" from phonics/alphabet games)
      // are part of visual game cards and should not spawn a floating caption banner.
      if (clean.length <= 1) return;

      if (hideTimer.current) clearTimeout(hideTimer.current);
      setCaption(clean);

      const visibleMs = Math.min(6000, Math.max(2500, clean.length * 60 + 1000));
      hideTimer.current = setTimeout(() => {
        setCaption('');
        hideTimer.current = null;
      }, visibleMs);
    });

    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Clear any previous caption when navigating so it cannot follow the user.
  useEffect(() => {
    hideCaption();
  }, [pathname, hideCaption]);

  if (CAPTION_FREE_ROUTES.has(pathname) || !captions || !caption || caption.length <= 1) {
    return null;
  }

  const isKaraoke = pathname.startsWith('/music/karaoke/');

  return (
    <AnimatePresence>
      {caption && (
        <motion.div
          key={caption}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className={`fixed left-4 right-4 z-[90] mx-auto w-auto max-w-xl px-5 py-3 rounded-2xl bg-gray-900/90 text-white text-center font-semibold shadow-xl pointer-events-none backdrop-blur-sm ${
            isKaraoke ? 'bottom-[19rem]' : 'bottom-24'
          }`}
        >
          {caption}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CaptionDisplay;
