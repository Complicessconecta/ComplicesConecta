/**
 * DismissibleBanner - Componente de Banner Desechable
 * =====================================================
 * Descripción: Banner reutilizable con opción de cerrar y persistencia en localStorage
 * Fecha: 12 Dic 2025
 * Versión: v3.8.0
 * 
 * Características:
 * - Cierre persistente (localStorage)
 * - Botón X personalizable
 * - Estilos glassmorphism
 * - Type-safe con TypeScript
 * 
 * Uso:
 * <DismissibleBanner storageKey="banner-news" className="bg-gradient-to-r from-purple-600 to-blue-600">
 *   <p>Contenido del banner</p>
 * </DismissibleBanner>
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { safeGetItem, safeSetItem } from '@/utils/safeLocalStorage';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface DismissibleBannerProps {
  /** Contenido del banner */
  children: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Clave para persistencia en localStorage */
  storageKey?: string;
  /** Mostrar botón de cierre */
  showCloseButton?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const DismissibleBanner = ({ 
  children, 
  className = '', 
  storageKey,
  showCloseButton = true 
}: DismissibleBannerProps) => {
  // Estado: visibilidad del banner (persistente en localStorage)
  const [isVisible, setIsVisible] = useState(() => {
    if (!storageKey) return true;
    return safeGetItem<string>(`dismissed_${storageKey}`, { validate: true, defaultValue: 'false' }) !== 'true';
  });

  // Manejador: cerrar banner y guardar en localStorage
  const handleDismiss = () => {
    setIsVisible(false);
    if (storageKey) {
      safeSetItem(`dismissed_${storageKey}`, 'true', { validate: true });
    }
  };

  // No renderizar si está cerrado
  if (!isVisible) return null;

  return (
    <div className={`relative ${className}`}>
      {showCloseButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          onClick={handleDismiss}
          aria-label="Cerrar banner"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </div>
  );
};

