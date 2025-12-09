import React from 'react';
import { cn } from '@/shared/lib/cn';
import HeaderNav from '@/components/HeaderNav';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  containerClassName?: string;
}

/**
 * PageWrapper - Componente envolvente para todas las páginas públicas
 * Proporciona:
 * - HeaderNav automático
 * - Backgrounds adaptativos según dispositivo
 * - Transparencias dinámicas en contenedores
 * - Partículas y efectos visuales
 * - Estilos profesionales consistentes
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className,
  showHeader = true,
  title,
  subtitle,
  showBackButton = false,
  containerClassName,
}) => {
  const { enableTransparencies, enableFullAnimations, isHighEnd, deviceType } = useDeviceCapability();

  return (
    <div className={cn(
      'min-h-screen relative overflow-hidden',
      'bg-gradient-to-br from-purple-900 via-black to-blue-900',
      className
    )}>
      {/* Background Layer - FULL DESKTOP */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        {/* Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900" />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        
        {/* Animated Blobs - Desktop Full */}
        {deviceType === 'desktop' && (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/15 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
            <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000" />
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/15 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-4000" />
          </>
        )}

        {/* Transparencias dinámicas - Mobile/Tablet */}
        {enableTransparencies && deviceType !== 'desktop' && (
          <>
            <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
          </>
        )}
      </div>

      {/* Header Navigation */}
      {showHeader && (
        <div className="relative z-20">
          <HeaderNav />
        </div>
      )}

      {/* Page Title Section (Opcional) */}
      {title && (
        <div className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/20 py-8">
          <div className="container mx-auto px-4">
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="text-white/70 hover:text-white mb-4 transition-colors flex items-center gap-2"
              >
                <span>←</span>
                <span>Volver</span>
              </button>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-white/80 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content - Con transparencias en contenedores */}
      <div className={cn(
        'relative z-10 min-h-screen',
        containerClassName
      )}>
        {/* Aplicar transparencias a contenedores hijos */}
        <style>{`
          .page-wrapper-content > * {
            backdrop-filter: blur(10px);
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .page-wrapper-content > .card,
          .page-wrapper-content > div[class*="card"],
          .page-wrapper-content > [class*="Card"] {
            background: rgba(255, 255, 255, 0.08) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
        `}</style>
        
        <div className="page-wrapper-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
