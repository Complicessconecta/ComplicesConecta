"use client";

import { useEffect } from "react";
import type { ReactNode, FC } from "react";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { logger } from "@/lib/logger";
import { PushNotifications } from "@capacitor/push-notifications";

interface AppInitializerProps {
  children: ReactNode;
}

/**
 * Este componente se encarga de ejecutar hooks de inicialización
 * que requieren correr en el lado del cliente al cargar la aplicación.
 * No renderiza ningún UI, solo activa la lógica de los hooks.
 */
export const AppInitializer: FC<AppInitializerProps> = ({ children }) => {
  // Hook para gestionar y solicitar permisos nativos en el arranque.
  const { isLoading, permissionStatus } = useAppPermissions();

  useEffect(() => {
    if (!isLoading) {
      logger.info("AppInitializer: Permissions check complete.", {
        status: permissionStatus,
      });
      // Aquí se podrían añadir otras lógicas que dependan de los permisos.
    }
  }, [isLoading, permissionStatus]);

  // Registrar notificaciones push cuando el permiso esté concedido
  useEffect(() => {
    if (permissionStatus.notifications === "granted") {
      try {
        void PushNotifications.register();
        logger.info("PushNotifications: register() called");
      } catch (e) {
        logger.error("PushNotifications: error on register()", {
          e: String(e),
        });
      }
    }
  }, [permissionStatus.notifications]);

  // Mientras se verifican los permisos, podríamos mostrar un loader global,
  // pero por ahora, simplemente renderizamos la app para no bloquear la UI.
  // El hook se encarga de mostrar los diálogos de permisos nativos.

  return <>{children}</>;
};
