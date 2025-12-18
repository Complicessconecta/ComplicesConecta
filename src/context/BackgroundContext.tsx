import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const STATIC_BACKGROUNDS = [
  '/backgrounds/bg1.jpg',
  '/backgrounds/bg2.jpg',
  '/backgrounds/bg3.jpg',
  '/backgrounds/bg4.jpg',
  '/backgrounds/bg5.webp',
];

interface BackgroundContextValue {
  backgroundImage: string;
  backgroundIndex: number;
  setBackgroundIndex: (index: number) => void;
  availableBackgrounds: readonly string[];
}

const BackgroundContext = createContext<BackgroundContextValue | undefined>(undefined);

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({ children }) => {
  // Calcular índice aleatorio UNA SOLA VEZ al montar el componente
  const [backgroundIndex, setBackgroundIndex] = useState<number>(() => {
    // Intentar recuperar del sessionStorage primero
    const stored = sessionStorage.getItem('bgIndex');
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < STATIC_BACKGROUNDS.length) {
        return parsed;
      }
    }
    // Si no hay almacenado o es inválido, generar aleatorio
    return Math.floor(Math.random() * STATIC_BACKGROUNDS.length);
  });

  // Persistir en sessionStorage cuando cambie (para refrescos de página)
  useEffect(() => {
    sessionStorage.setItem('bgIndex', backgroundIndex.toString());
  }, [backgroundIndex]);

  const backgroundImage = useMemo(() => {
    return STATIC_BACKGROUNDS[backgroundIndex] || STATIC_BACKGROUNDS[0];
  }, [backgroundIndex]);

  const value = useMemo<BackgroundContextValue>(
    () => ({
      backgroundImage,
      backgroundIndex,
      setBackgroundIndex,
      availableBackgrounds: STATIC_BACKGROUNDS,
    }),
    [backgroundImage, backgroundIndex]
  );

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackgroundContext = (): BackgroundContextValue => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackgroundContext debe usarse dentro de BackgroundProvider');
  }
  return context;
};
