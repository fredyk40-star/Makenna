import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

const CAPTION_VISIBLE_MS = 6000;

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
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setCaption(text);
      hideTimer.current = setTimeout(() => {
        setCaption('');
        hideTimer.current = null;
      }, CAPTION_VISIBLE_MS);
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

  if (CAPTION_FREE_ROUTES.has(pathname) || !captions || !caption) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] max-w-xl mx-4 px-5 py-3 rounded-2xl bg-gray-900/90 text-white text-center font-semibold shadow-xl"
    >
      {caption}
    </div>
  );
};

export default CaptionDisplay;
