/**
 * Performance monitoring utilities
 */

export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export const measurePerformance = (label) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(`${label}-start`);
    return () => {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`${label}: ${measure.duration}ms`);
      performance.clearMarks();
      performance.clearMeasures();
    };
  }
  return () => {};
};

export const lazyLoadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const optimizeImage = (url, width, height, quality = 80) => {
  // Check if URL is already optimized
  if (url.includes('optimized=true')) return url;
  
  // Add optimization parameters
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&h=${height}&q=${quality}&optimized=true`;
};

export const shouldLazyLoad = (element) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  
  // Lazy load if element is more than 2 viewports away
  return rect.top > windowHeight * 2;
};