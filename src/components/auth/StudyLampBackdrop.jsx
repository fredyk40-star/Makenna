import { useTheme } from '../../context/ThemeContext';
import { motion, useReducedMotion } from 'framer-motion';

const StudyLampBackdrop = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const reducedMotion = useReducedMotion();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };

  const lampVariants = {
    on: { opacity: 1, transition: { duration: 0.6 } },
    off: { opacity: 0, transition: { duration: 0.4 } },
  };

  const fireflies = Array.from({ length: 10 }, (_, i) => {
    const delay = i * 0.8;
    const color = i % 2 === 0 ? '#FBBF24' : '#22D3EE';
    const x = 10 + i * 8;
    const y = 20 + i * 6;
    return (
      <motion.span
        key={i}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 4,
          height: 4,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          left: `${x}%`,
          top: `${y}%`,
          opacity: reducedMotion ? 0.5 : 0,
        }}
        animate={
          reducedMotion
            ? {}
            : {
                opacity: [0, 0.6, 0],
                y: [y, y - 30, y],
                x: [x, x + 15, x],
                transition: {
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay,
                },
              }
        }
      />
    );
  });

  return (
    <div className="relative w-full max-w-[640px] mx-auto lg:max-w-none lg:px-0">
      {!reducedMotion && isDark && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-10 left-4 lg:hidden z-0 pointer-events-none"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient id="lampGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            <rect x="24" y="48" width="16" height="12" fill="#94A3B8" rx="2" />
            <path
              d="M32 48 L32 24 L16 20 L16 16 L32 12 L48 16 L48 20 L32 24 Z"
              fill="url(#lampGrad)"
            />
            <circle cx="32" cy="20" r="10" fill="#FDE047" opacity="0.9" />
            <motion.div
              animate={{ y: [0, -8, 0], transition: { duration: 3, repeat: Infinity } }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"
            />
          </svg>
        </motion.div>
      )}

      {isDark && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 left-0 w-64 lg:w-80 z-0 pointer-events-none hidden lg:block"
        >
          <motion.div
            animate={lampVariants.on}
            className="absolute top-24 left-60 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-200/30 via-teal-300/10 to-transparent blur-2xl pointer-events-none"
            style={{
              transformOrigin: 'right center',
              transform: 'rotate(-15deg) translateX(-40px)',
            }}
          />

          <svg
            width="200"
            height="320"
            viewBox="0 0 200 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-10 left-10 drop-shadow-lg"
          >
            <defs>
              <linearGradient id="lampShadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="lampPoleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>
            <rect x="60" y="280" width="80" height="24" fill="url(#lampPoleGrad)" rx="4" />
            <rect x="94" y="160" width="12" height="120" fill="url(#lampPoleGrad)" rx="4" />
            <path d="M100 160 L130 120 L160 130" stroke="url(#lampPoleGrad)" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M140 110 L170 90 L130 80 L100 100 Z"
              fill="url(#lampShadeGrad)"
              stroke="#B45309"
              strokeWidth="2"
            />
            <circle cx="145" cy="95" r="14" fill="#FDE047" opacity="0.9">
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <g cursor="pointer">
              <line x1="110" y1="80" x2="110" y2="40" stroke="#CBD5E1" strokeWidth="3" />
              <circle cx="110" cy="30" r="8" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
            </g>
          </svg>

          <button
            onClick={toggleTheme}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            aria-label={isDark ? 'Turn off study lamp' : 'Turn on study lamp'}
            className="absolute top-16 left-28 w-12 h-12 rounded-full bg-white/90 border-2 border-amber-300 shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <motion.span whileTap={{ scale: 0.85, y: -4 }} className="text-amber-500 text-xl">
              💡
            </motion.span>
          </button>
        </motion.div>
      )}

      {!reducedMotion && isDark && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden lg:hidden">
          {fireflies}
        </div>
      )}
    </div>
  );
};

export default StudyLampBackdrop;