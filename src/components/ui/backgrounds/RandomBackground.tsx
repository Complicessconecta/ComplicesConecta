import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

// Imágenes de fondo por ruta
const BACKGROUND_IMAGES = [
  '/backgrounds/bg1.jpg',
  '/backgrounds/bg2.jpg',
  '/backgrounds/bg3.jpg',
  '/backgrounds/bg4.jpg',
  '/backgrounds/bg5.webp',
];

const getBackgroundImageByPath = (pathname: string): string => {
  const pathHash = pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = pathHash % BACKGROUND_IMAGES.length;
  return BACKGROUND_IMAGES[index];
};

export const PageBackground: React.FC<PageBackgroundProps> = ({ children, className }) => {
  const location = useLocation();
  const [backgroundImage, setBackgroundImage] = useState(getBackgroundImageByPath(location.pathname));

  useEffect(() => {
    setBackgroundImage(getBackgroundImageByPath(location.pathname));
  }, [location.pathname]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${className || ''}`}>
      {/* Fondo imagen */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* Overlay gradiente oscuro para mejor legibilidad */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />

      {/* Partículas animadas - 55% opacidad (10% más visibles) */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {Array.from({ length: 75 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              backgroundColor: '#a855f7',
              opacity: 0.55,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* Contenido */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};

export const RandomBackground = PageBackground;
export const MasterBackground = PageBackground;

