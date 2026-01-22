import { useMemo } from "react";

type Phase = "beta" | "premium" | "vip";

export function useFeatures() {
  // Detectar fase desde variable de entorno
  const phase = (import.meta.env.VITE_APP_PHASE as Phase) || "beta";

  return useMemo(() => {
    return {
      phase,
      isBeta: phase === "beta",
      isPremium: phase === "premium" || phase === "vip",
      isVIP: phase === "vip",

      // Funciones avanzadías
      features: {
        requests: true, // Solicitudes habilitadías siempre
        chatPublic: true, // Chat público habilitado
        chatPrivate: true, // Chat privado habilitado
        profileVisibility: true, // Control de visibilidad habilitado
        galleryPublicPrivate: true, // Galerías habilitadías
        messagingPrivacy: true, // Restricción de mensajes

        // 🚀 Funciones premium - HABILITAdías DURANTE BETA
        // Todías las funciones premium están disponibles hasta el cierre de beta
        // Después se manejará con suscripciones
        eventsVIP: true, // Habilitado durante beta
        ghostMode: true, // Habilitado durante beta
        virtualGifts: true, // Habilitado durante beta
        superLikes: true, // Habilitado durante beta
        stories: true, // Habilitado durante beta
        privateMatches: true, // Habilitado durante beta
      },
    };
  }, [phase]);
}

export default useFeatures;

