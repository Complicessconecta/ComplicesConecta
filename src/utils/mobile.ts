export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getAnimationConfig = () => {
  return {
    duration: 0.3,
    ease: 'easeInOut'
  };
};

export const addTouchSupport = (element: HTMLElement) => {
  // Placeholder for touch support logic
  if (!element) return;
  element.classList.add('touch-supported');
};
