import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaBook, FaGamepad, FaUser, FaCog } from 'react-icons/fa';
import { ROUTES, NAV_ITEMS, isActiveRoute } from '../../routes';

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-4 pt-2"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-md mx-auto">
        <div className="glassmorphism rounded-2xl px-2 py-2 flex items-center justify-around shadow-soft">
          {NAV_ITEMS.map(({ path, label, icon: Icon, ariaLabel }) => {
            const isActive = isActiveRoute(location.pathname, path);
            
            return (
              <NavLink
                key={path}
                to={path}
                className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={ariaLabel || label}
                aria-current={isActive ? 'page' : undefined}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  className="relative flex flex-col items-center"
                >
                  <Icon 
                    className={`text-xl md:text-2xl transition-colors duration-200 ${
                      isActive 
                        ? 'text-primary dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} 
                    aria-hidden="true"
                  />
                  
                  <span className={`text-[10px] font-medium mt-0.5 transition-colors duration-200 ${
                    isActive 
                      ? 'text-primary dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-2 w-6 h-1 bg-primary dark:bg-blue-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;