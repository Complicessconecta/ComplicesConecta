import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { ChatRoomService, ChatMember } from "@/services/chat/ChatRoomService";

interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string | undefined;
}

interface UseOnlineStatusOptions {
  enabled?: boolean;
  interval?: number;
}

/**
 * Hook para gestionar el estado online/offline de usuarios en salas de chat
 * @param roomId ID de la sala de chat
 * @param userId ID del usuario actual
 * @param options Opciones de configuración
 * @returns Estado online de los miembros
 */
export const useOnlineStatus = (
  roomId: string,
  userId: string,
  options: UseOnlineStatusOptions = {}
) => {
  const { enabled = true, interval = 30000 } = options;
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Actualizar estado online del usuario actual
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    try {
      await ChatRoomService.updateOnlineStatus(roomId, userId, isOnline);
      logger.info("Estado online actualizado", { roomId, userId, isOnline });
    } catch (error) {
      logger.error("Error actualizando estado online:", { error });
    }
  }, [roomId, userId]);

  // Cargar miembros de la sala
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const roomMembers = await ChatRoomService.getRoomMembers(roomId);
      setMembers(roomMembers);
    } catch (error) {
      logger.error("Error cargando miembros:", { error });
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Calcular tiempo offline
  const getOfflineTime = useCallback((lastSeen?: string): string => {
    if (!lastSeen) return "Desconocido";

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return `Hace ${Math.floor(diffDays / 7)} semanas`;
  }, []);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!enabled || !supabase) return;

    // Cargar miembros iniciales
    loadMembers();

    // Suscribirse a cambios en chat_members
    const channel = supabase
      .channel(`chat_members:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_members",
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          logger.info("Cambio en miembros detectado", { payload });
          loadMembers();
        }
      )
      .subscribe();

    // Marcar usuario como online al montar
    updateOnlineStatus(true);

    // Intervalo para mantener estado online
    const intervalId = setInterval(() => {
      updateOnlineStatus(true);
    }, interval);

    return () => {
      // Marcar usuario como offline al desmontar
      updateOnlineStatus(false);
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, enabled, interval, loadMembers, updateOnlineStatus]);

  // Obtener estado online de un usuario específico
  const getUserStatus = useCallback(
    (targetUserId: string): OnlineStatus => {
      const member = members.find((m) => m.user_id === targetUserId);
      return {
        userId: targetUserId,
        isOnline: member?.is_online || false,
        lastSeen: member?.last_seen,
      };
    },
    [members]
  );

  // Obtener lista de usuarios online
  const getOnlineUsers = useCallback((): string[] => {
    return members.filter((m) => m.is_online).map((m) => m.user_id);
  }, [members]);

  // Obtener lista de usuarios offline
  const getOfflineUsers = useCallback((): string[] => {
    return members.filter((m) => !m.is_online).map((m) => m.user_id);
  }, [members]);

  return {
    members,
    loading,
    getOfflineTime,
    getUserStatus,
    getOnlineUsers,
    getOfflineUsers,
    updateOnlineStatus,
    loadMembers,
  };
};

// Hook original para estado online del sistema
export const useSystemOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};
