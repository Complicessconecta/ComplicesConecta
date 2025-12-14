import React from 'react';

/**
 * Wrapper simple para GlobalBackground que garantiza renderización
 * sin dependencias de hooks complejos
 */
export const GlobalBackgroundWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      {/* Fondo de respaldo */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none" 
          style={{ backgroundColor: '#1a0033' }}
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
