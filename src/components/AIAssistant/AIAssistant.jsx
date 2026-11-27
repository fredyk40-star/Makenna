import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChildAccount } from '../../context/ChildAccountContext';
import { ROUTES } from '../../routes';

/**
 * A small launcher that opens the full-screen Makenna Tutor route. The chat UI
 * lives on /tutor so it never covers the page the child was using.
 */
const AIAssistant = () => {
  const navigate = useNavigate();
  const { activeChild } = useChildAccount();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const showTimeoutRef = useRef(null);

  // Hide while scrolling down, then bring the launcher back after scrolling stops.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollYRef.current) {
        setIsVisible(true);
      }
      lastScrollYRef.current = currentScrollY;

      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  if (!activeChild?.childId) return null;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(ROUTES.TUTOR)}
      initial={{ opacity: 0, scale: 0.5, x: -20 }}
      animate={{
        y: [0, -10, 0],
        opacity: isVisible ? 1 : 0,
        scale: 1,
        x: isVisible ? 0 : -20,
      }}
      exit={{ opacity: 0, scale: 0.5, x: -20 }}
      transition={{
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        x: { duration: 0.3 },
      }}
      whileTap={{ scale: 0.9 }}
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      className="assistant-root fixed left-4 z-[45] flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/30 shadow-lg backdrop-blur-md hover:scale-105 dark:bg-gray-800/30"
      aria-label="Open Makenna Tutor"
      title="Makenna Tutor"
    >
      {/* Animated character face */}
      <div className="relative">
        <div className="mb-1 flex justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        </div>
        <div className="mx-auto h-2 w-4 rounded-full border-b-2 border-white" />
        <div className="absolute -left-1 top-2 h-1 w-1 rounded-full bg-pink-200 opacity-50" />
        <div className="absolute -right-1 top-2 h-1 w-1 rounded-full bg-pink-200 opacity-50" />
      </div>
      <span className="absolute inset-0 rounded-full bg-purple-300 opacity-20 blur-md" />
    </motion.button>
  );
};

export default AIAssistant;
