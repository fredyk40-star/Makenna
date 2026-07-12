import { memo } from 'react';
import { motion } from 'framer-motion';

const MemoizedCard = memo(({ children, className = '', ...props }) => {
  return (
    <motion.div
      className={`card-soft ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

MemoizedCard.displayName = 'MemoizedCard';

export default MemoizedCard;