import { useCallback, useEffect, useRef } from 'react';
import { getFocusableElements } from '../utils/accessibility';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Adds arrow-key navigation and optional switch scanning to a group of
 * buttons/links. A switch device only needs to send Space/Enter to activate
 * whichever control the scanner has highlighted.
 */
export const useAdaptiveInput = (containerRef) => {
  const { settings } = useAccessibility();
  const activeIndexRef = useRef(0);

  const paint = useCallback(() => {
    const container = containerRef.current;
    if (!container) return [];
    const items = getFocusableElements(container);
    if (activeIndexRef.current >= items.length) activeIndexRef.current = 0;

    items.forEach((item, index) => {
      item.classList.toggle('adaptive-focus', index === activeIndexRef.current);
    });
    return items;
  }, [containerRef]);

  const move = useCallback((delta) => {
    const items = paint();
    if (items.length === 0) return;
    activeIndexRef.current = (activeIndexRef.current + delta + items.length) % items.length;
    const target = paint()[activeIndexRef.current];
    target?.focus({ preventScroll: true });
  }, [paint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const handleKeyDown = (event) => {
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        move(1);
      } else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        move(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        activeIndexRef.current = 0;
        paint()[0]?.focus({ preventScroll: true });
      } else if (event.key === 'End') {
        const items = paint();
        activeIndexRef.current = Math.max(items.length - 1, 0);
        items[activeIndexRef.current]?.focus({ preventScroll: true });
      } else if (event.target === container && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        paint()[activeIndexRef.current]?.click();
      }
    };

    const handleFocusIn = (event) => {
      const index = paint().indexOf(event.target);
      if (index >= 0) {
        activeIndexRef.current = index;
        paint();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusin', handleFocusIn);
    paint();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusin', handleFocusIn);
    };
  }, [containerRef, move, paint]);

  useEffect(() => {
    if (!settings.switchControl) return undefined;

    const timer = window.setInterval(() => {
      const items = paint();
      if (items.length === 0) return;
      activeIndexRef.current = (activeIndexRef.current + 1) % items.length;
      const target = paint()[activeIndexRef.current];
      target?.focus({ preventScroll: true });
    }, settings.switchInterval);

    return () => window.clearInterval(timer);
  }, [paint, settings.switchControl, settings.switchInterval]);

  return { move, focusFirst: () => paint()[0]?.focus({ preventScroll: true }) };
};

export default useAdaptiveInput;
