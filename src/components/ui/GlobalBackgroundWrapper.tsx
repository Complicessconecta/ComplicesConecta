import React, { useState, useEffect } from 'react';

/**
 * Wrapper simple para GlobalBackground que garantiza renderizaci├│n
 * con carga de im├ígenes de fondo
 */
export const GlobalBackgroundWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [bgImage, setBgImage] = useState('/backgrounds/bg1.jpg');
  
  useEffect(() => {
    // Intentar cargar la imagen de fondo
    const img = new Image();
    img.onload = () => {
      setBgImage('/backgrounds/bg1.jpg');
    };
    img.onerror = () => {
      // Si falla, usar gradiente de fallback
      console.warn('Failed to load background image');
    };
    img.src = '/backgrounds/bg1.jpg';
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900">
      {/* Fondo de respaldo */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none" 
          style={{ 
            backgroundImage: `url(${bgImage})`,
            backgroundColor: '#1a0033'
          }}
        />
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* Contenido */}
      <div className="relative z-20 w-full h-full overflow-auto pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

export default GlobalBackgroundWrapper;
