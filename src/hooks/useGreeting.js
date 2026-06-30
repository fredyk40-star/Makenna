import { useState, useEffect } from 'react';
import { GREETINGS } from '../constants';

export const useGreeting = () => {
  const [greeting, setGreeting] = useState(GREETINGS.MORNING);

  useEffect(() => {
    let intervalId = null;
    
    const updateGreeting = () => {
      const hour = new Date().getHours();
      
      let currentGreeting = GREETINGS.MORNING;
      
      if (hour >= GREETINGS.MORNING.timeRange[0] && hour < GREETINGS.MORNING.timeRange[1]) {
        currentGreeting = GREETINGS.MORNING;
      } else if (hour >= GREETINGS.AFTERNOON.timeRange[0] && hour < GREETINGS.AFTERNOON.timeRange[1]) {
        currentGreeting = GREETINGS.AFTERNOON;
      } else if (hour >= GREETINGS.EVENING.timeRange[0] && hour < GREETINGS.EVENING.timeRange[1]) {
        currentGreeting = GREETINGS.EVENING;
      } else {
        currentGreeting = GREETINGS.NIGHT;
      }
      
      setGreeting(currentGreeting);
    };

    updateGreeting();
    intervalId = setInterval(updateGreeting, 60000);

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, []);

  return greeting;
};