"use client";

import { useEffect } from "react";
import type { ReactNode, FC } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { logger } from "@/lib/logger";
import { PushNotifications } from "@capacitor/push-notifications";
import { Button } from "@/components/ui/buttons/Button";

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
  const { isLoading, permissionStatus, requestPermission } = useAppPermissions();

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
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        logger.warn(
          "PushNotifications: skipping register() on Android because Firebase is not configured",
        );
        return;
      }

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

  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const hasLocationPermission = permissionStatus.geolocation === "granted";

  if (isAndroidNative && (isLoading || !hasLocationPermission)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-linear-to-br from-purple-900 via-black to-blue-900">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-6">
          <h1 className="text-white text-lg font-semibold">Permiso de ubicación requerido</h1>
          <p className="text-white/80 text-sm mt-2">
            Para continuar, necesitas autorizar la ubicación.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button
              variant="love"
              className="w-full"
              onClick={async () => {
                await requestPermission("geolocation");
              }}
              disabled={isLoading}
            >
              Autorizar ubicación
            </Button>
            <Button
              variant="outline"
              className="w-full bg-white/5 text-white border-white/20 hover:bg-white/10"
              onClick={async () => {
                await requestPermission("geolocation");
              }}
              disabled={isLoading}
            >
              Volver a intentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
