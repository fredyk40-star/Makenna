import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CARD_COLORS } from '../../../constants';
import { ROUTES } from '../../../routes';

const Card = memo(({ card, index }) => {
  const isComingSoon = card.status === 'coming-soon';

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        scale: isComingSoon ? 1 : 1.05,
        y: isComingSoon ? 0 : -4,
        boxShadow: isComingSoon ? 'none' : '0 12px 48px rgba(0,0,0,0.12)'
      }}
      whileTap={{ scale: isComingSoon ? 1 : 0.95 }}
      className={`relative bg-gradient-to-br ${card.color} rounded-2xl p-4 md:p-5 shadow-soft transition-all duration-300 group ${isComingSoon ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      role={isComingSoon ? 'none' : 'button'}
      tabIndex={isComingSoon ? -1 : 0}
      aria-label={isComingSoon ? `${card.title} (Coming Soon)` : `Navigate to ${card.title}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl md:text-4xl mb-2 group-hover:rotate-6 transition-transform duration-300" aria-hidden="true">
          {card.emoji}
        </div>
        <h3 className="text-xs md:text-sm font-bold text-white leading-tight">
          {card.title}
        </h3>
      </div>
      {isComingSoon && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
          <span className="text-white text-xs font-bold">Coming Soon</span>
        </div>
      )}
    </motion.div>
  );

  if (isComingSoon || !card.path) {
    return cardContent;
  }

  return (
    <Link to={card.path} aria-hidden="true" tabIndex={-1}>
      {cardContent}
    </Link>
  );
});

Card.displayName = 'Card';

const NavigationCards = memo(() => {
  const cards = [
    { id: 1, title: 'Alphabet Adventure', emoji: '📚', color: CARD_COLORS[0], path: ROUTES.ALPHABET },
    { id: 2, title: 'Numbers Kingdom', emoji: '👑', color: CARD_COLORS[1], path: ROUTES.NUMBERS },
    { id: 3, title: 'Animal Safari', emoji: '🦁', color: CARD_COLORS[2], path: ROUTES.ANIMAL_SAFARI },
    { id: 4, title: 'Story Time', emoji: '📖', color: CARD_COLORS[3], path: ROUTES.STORIES },
    { id: 5, title: 'Music', emoji: '🎵', color: CARD_COLORS[4], path: ROUTES.MUSIC },
    { id: 6, title: 'Drawing', emoji: '🎨', color: CARD_COLORS[5], path: ROUTES.DRAWING },
    { id: 7, title: 'Bible Time', emoji: '🙏', color: CARD_COLORS[6], path: ROUTES.BIBLE_TIME },
    { id: 8, title: 'Science Lab', emoji: '🔬', color: CARD_COLORS[7], path: ROUTES.SCIENCE_LAB },
    { id: 9, title: 'Ghana Explorer', emoji: '🌍', color: CARD_COLORS[0], path: ROUTES.GHANA_EXPLORER },
    { id: 10, title: 'Games', emoji: '🎮', color: CARD_COLORS[2], path: ROUTES.GAMES },
    { id: 11, title: 'Rewards', emoji: '🎁', color: CARD_COLORS[4], path: ROUTES.GRADUATION },
    { id: 12, title: 'Parent Zone', emoji: '👨‍👧', color: CARD_COLORS[6], path: ROUTES.PARENT_ZONE },
  ];

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-baloo font-bold text-gray-800 dark:text-white mb-4">
        Explore & Learn
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card, index) => (
          <Card card={card} index={index} key={card.id} />
        ))}
      </div>
    </section>
  );
});

NavigationCards.displayName = 'NavigationCards';

export default NavigationCards;
