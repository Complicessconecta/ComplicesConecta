import React from 'react';
import { cn } from '@/lib/utils';
import { useAdaptiveBackground } from './AdaptiveBackground';

/**
 * GlassContainer Component
 * 
 * Contenedor con Glassmorphism condicional basado en el Tier del dispositivo.
 * 
 * - LOW Tier: Fondos sólidos (sin glassmorphism)
 * - MID Tier: Glassmorphism moderado (bg-white/10 backdrop-blur-md)
 * - HIGH Tier: Glassmorphism premium (bg-white/15 backdrop-blur-xl)
 */

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'card' | 'modal' | 'panel';
  showBorder?: boolean;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className,
  variant = 'card',
  showBorder = true,
}) => {
  const { tier, isLow, isMid, isHigh } = useAdaptiveBackground();

  // Determinar clases basadas en Tier
  const glassClasses = React.useMemo(() => {
    if (isLow) {
      // LOW Tier: Fondos sólidos sin glassmorphism
      return cn(
        'bg-white dark:bg-gray-900',
        showBorder && 'border border-gray-200 dark:border-gray-800'
      );
    }

    if (isMid) {
      // MID Tier: Glassmorphism moderado
      return cn(
        'bg-white/10 dark:bg-black/20',
        'backdrop-blur-md',
        showBorder && 'border border-white/20 dark:border-white/10'
      );
    }

    // HIGH Tier: Glassmorphism premium
    return cn(
      'bg-white/15 dark:bg-black/30',
      'backdrop-blur-xl',
      showBorder && 'border border-white/30 dark:border-white/20'
    );
  }, [tier, isLow, isMid, isHigh, showBorder]);

  // Clases específicas por variante
  const variantClasses = {
    card: 'rounded-2xl shadow-2xl',
    modal: 'rounded-3xl shadow-2xl',
    panel: 'rounded-xl shadow-lg',
  };

  return (
    <div
      className={cn(
        glassClasses,
        variantClasses[variant],
        'transition-all duration-300',
        className
      )}
      data-tier={tier}
    >
      {children}
    </div>
  );
};

/**
 * GlassButton Component
 * 
 * Botón con Glassmorphism condicional
 */

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'primary',
  ...props
}) => {
  const { tier, isLow } = useAdaptiveBackground();

  const buttonClasses = React.useMemo(() => {
    if (isLow) {
      // LOW Tier: Botones sólidos
      return {
        primary: 'bg-purple-600 hover:bg-purple-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-900',
      };
    }

    // MID/HIGH Tier: Botones con glassmorphism
    return {
      primary: 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white',
      secondary: 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white',
      ghost: 'bg-transparent hover:bg-white/10 backdrop-blur-sm border border-white/10 text-white',
    };
  }, [tier, isLow]);

  return (
    <button
      className={cn(
        'px-6 py-2 rounded-lg font-medium transition-all duration-200',
        'hover:scale-105 active:scale-95',
        buttonClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * GlassText Component
 * 
 * Texto con contraste mejorado para fondos transparentes
 */

interface GlassTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'heading' | 'body' | 'caption';
}

export const GlassText: React.FC<GlassTextProps> = ({
  children,
  className,
  variant = 'body',
}) => {
  const { isLow } = useAdaptiveBackground();

  const textClasses = {
    heading: 'text-3xl font-bold',
    body: 'text-base font-normal',
    caption: 'text-sm font-medium',
  };

  return (
    <div
      className={cn(
        textClasses[variant],
        isLow
          ? 'text-gray-900 dark:text-white'
          : 'text-white drop-shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
};
