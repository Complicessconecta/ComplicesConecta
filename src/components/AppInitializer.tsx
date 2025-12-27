'use client';

import { useEffect } from 'react';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import { logger } from '@/lib/logger';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Este componente se encarga de ejecutar hooks de inicializaciÃ³n
 * que requieren correr en el lado del cliente al cargar la aplicaciÃ³n.
 * No renderiza ningÃºn UI, solo activa la lÃ³gica de los hooks.
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  // Hook para gestionar y solicitar permisos nativos en el arranque.
  const { isLoading, permissionStatus } = useAppPermissions();

  useEffect(() => {
    if (!isLoading) {
      logger.info('AppInitializer: Permissions check complete.', { status: permissionStatus });
      // AquÃ­ se podrÃ­an aÃ±adir otras lÃ³gicas que dependan de los permisos.
    }
  }, [isLoading, permissionStatus]);

  // Mientras se verifican los permisos, podrÃ­amos mostrar un loader global,
  // pero por ahora, simplemente renderizamos la app para no bloquear la UI.
  // El hook se encarga de mostrar los diÃ¡logos de permisos nativos.

  return <>{children}</>;
};

