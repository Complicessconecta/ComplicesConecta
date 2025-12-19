import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveNavigation } from '@/components/navigation/ResponsiveNavigation';
import { cn } from '@/shared/lib/cn';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  currentPath,
  onNavigate,
  className
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={cn("min-h-screen bg-gray-50 relative z-10", className)}>
      <ResponsiveNavigation
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "transition-all duration-300 safe-area-inset",
          isMobile 
            ? "pt-[calc(4rem+var(--sat))] pb-[calc(5rem+var(--sab))] pl-[calc(1rem+var(--sal))] pr-[calc(1rem+var(--sar))]" // Mobile: top bar + bottom nav spacing + safe areas
            : "ml-20 hover:ml-64 p-6" // Desktop: sidebar spacing
        )}
      >
        {children}
      </motion.main>
    </div>
  );
};
