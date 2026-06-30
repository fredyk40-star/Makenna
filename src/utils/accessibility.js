/**
 * Accessibility utility functions
 */

export const getFocusableElements = (container) => {
  if (!container) return [];
  
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  );
};

export const trapFocus = (container, event) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.key === 'Tab') {
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

export const announceToScreenReader = (message, priority = 'polite') => {
  // Remove any existing announcer
  const existingAnnouncer = document.querySelector('[data-announcer]');
  if (existingAnnouncer) {
    document.body.removeChild(existingAnnouncer);
  }

  const announcer = document.createElement('div');
  announcer.setAttribute('data-announcer', 'true');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  document.body.appendChild(announcer);
  
  // Use requestAnimationFrame to ensure DOM update
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
  
  // Clean up after announcement
  setTimeout(() => {
    if (announcer.parentNode) {
      document.body.removeChild(announcer);
    }
  }, 5000);
};

export const isElementVisible = (element, partiallyVisible = false) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const visible = partiallyVisible
    ? rect.top < windowHeight && rect.bottom > 0 && rect.left < windowWidth && rect.right > 0
    : rect.top >= 0 && rect.left >= 0 && rect.bottom <= windowHeight && rect.right <= windowWidth;
  
  return visible;
};

export const focusFirstElement = (container) => {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  return false;
};

export const setAriaExpanded = (element, expanded) => {
  if (element) {
    element.setAttribute('aria-expanded', expanded);
  }
};

export const createAriaLiveRegion = (id = 'aria-live-region') => {
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
  }
  return region;
};