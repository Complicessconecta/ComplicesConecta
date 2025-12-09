    import React from 'react';

interface GlobalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ children, className }) => {
  return (
    <div className={`w-full h-full ${className || ''}`}>
      {children}
    </div>
  );
};

export default GlobalBackground;
