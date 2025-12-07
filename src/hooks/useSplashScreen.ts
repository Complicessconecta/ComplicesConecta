import { useState, useEffect } from 'react';

export const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('cc_splash_shown');
  });
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    if (!showSplash) return;

    const img = new Image();
    img.src = '/backgrounds/logo-animated.webp';
    
    const handleLoad = () => setLogoReady(true);
    const handleError = () => {
      console.warn("Error cargando logo splash");
      setLogoReady(true);
    };

    img.onload = handleLoad;
    img.onerror = handleError;

    const minTime = 2500;
    const maxTime = 7000;

    const mainTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('cc_splash_shown', '1');
    }, minTime);

    const safetyTimer = setTimeout(() => {
      setShowSplash(false);
    }, maxTime);

    return () => {
      clearTimeout(mainTimer);
      clearTimeout(safetyTimer);
      img.onload = null;
      img.onerror = null;
    };
  }, [showSplash]);

  return { showSplash, logoReady };
};
