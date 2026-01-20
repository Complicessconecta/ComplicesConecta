import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Tipos para salas de chat
export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_private: boolean;
  participants: string[];
  token_cost: number;
  is_active: boolean;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  chat_room_id: string;
  user_id: string;
  is_owner: boolean;
  is_muted: boolean;
  is_hidden: boolean;
  last_seen?: string;
  is_online: boolean;
  joined_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
}

// Servicio para gestión de salas de chat
export class ChatRoomService {
  /**
   * Crear una nueva sala de chat privada
   * @param name Nombre de la sala
   * @param description Descripción de la sala
   * @param tokenCost Costo en tokens para acceder
   * @param maxMembers Número máximo de miembros
   * @param userId ID del usuario que crea la sala
   * @returns Sala de chat creada
   */
  static async createPrivateRoom(
    name: string,
    description: string,
    tokenCost: number = 1,
    maxMembers: number = 100,
    userId: string
  ): Promise<ChatRoom | null> {
    try {
      const { data, error } = await supabase
        .from("chat_rooms")
        .insert({
          name,
          description,
          created_by: userId,
          is_private: true,
          token_cost: tokenCost,
          max_members: maxMembers,
          is_active: true,
          participants: [userId],
        })
        .select()
        .single();

      if (error) throw error;

      // Agregar al creador como owner
      await this.addMemberToRoom(data.id, userId, true);

      logger.info("Sala privada creada exitosamente", { roomId: data.id, userId });
      return data;
    } catch (error) {
      logger.error("Error creando sala privada:", { error });
      return null;
    }
  }

  /**
   * Unirse a una sala de chat pública
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @returns true si se unió exitosamente
   */
  static async joinPublicRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      // Verificar si ya es miembro
      const { data: existingMember } = await supabase
        .from("chat_members")
        .select("id")
        .eq("chat_room_id", roomId)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        logger.warn("Usuario ya es miembro de la sala", { roomId, userId });
        return true;
      }

      // Verificar si la sala es pública y tiene espacio
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("is_private, max_members")
        .eq("id", roomId)
        .single();

      if (!room || room.is_private) {
        logger.warn("Sala no encontrada o es privada", { roomId });
        return false;
      }

      // Verificar número de miembros
      const { count } = await supabase
        .from("chat_members")
        .select("*", { count: "exact", head: true })
        .eq("chat_room_id", roomId);

      if (count !== null && count >= room.max_members) {
        logger.warn("Sala llena", { roomId, count, max: room.max_members });
        return false;
      }

      // Unirse a la sala
      await this.addMemberToRoom(roomId, userId, false);

      logger.info("Usuario unido a sala pública", { roomId, userId });
      return true;
    } catch (error) {
      logger.error("Error uniéndose a sala pública:", { error });
      return false;
    }
  }

  /**
   * Unirse a una sala de chat privada (deducir tokens)
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @param isPremium Si el usuario es premium
   * @returns true si se unió exitosamente
   */
  static async joinPrivateRoom(
    roomId: string,
    userId: string,
    isPremium: boolean = false
  ): Promise<boolean> {
    try {
      // Verificar si ya es miembro
      const { data: existingMember } = await supabase
        .from("chat_members")
        .select("id")
        .eq("chat_room_id", roomId)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        logger.warn("Usuario ya es miembro de la sala", { roomId, userId });
        return true;
      }

      // Obtener información de la sala
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("is_private, token_cost, max_members, participants")
        .eq("id", roomId)
        .single();

      if (!room || !room.is_private) {
        logger.warn("Sala no encontrada o no es privada", { roomId });
        return false;
      }

      // Verificar si el usuario está en la lista de participantes invitados
      if (!room.participants.includes(userId)) {
        logger.warn("Usuario no está invitado a la sala", { roomId, userId });
        return false;
      }

      // Verificar número de miembros
      const { count } = await supabase
        .from("chat_members")
        .select("*", { count: "exact", head: true })
        .eq("chat_room_id", roomId);

      if (count !== null && count >= room.max_members) {
        logger.warn("Sala llena", { roomId, count, max: room.max_members });
        return false;
      }

      // Deducir tokens si no es premium
      if (!isPremium && room.token_cost > 0) {
        const tokenDeducted = await this.deductTokensForAccess(userId, room.token_cost);
        if (!tokenDeducted) {
          logger.warn("No se pudieron deducir tokens", { userId, cost: room.token_cost });
          return false;
        }
      }

      // Unirse a la sala
      await this.addMemberToRoom(roomId, userId, false);

      logger.info("Usuario unido a sala privada", { roomId, userId, isPremium });
      return true;
    } catch (error) {
      logger.error("Error uniéndose a sala privada:", { error });
      return false;
    }
  }

  /**
   * Agregar miembro a sala
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @param isOwner Si es el propietario
   * @returns true si se agregó exitosamente
   */
  private static async addMemberToRoom(
    roomId: string,
    userId: string,
    isOwner: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("chat_members").insert({
        chat_room_id: roomId,
        user_id: userId,
        is_owner: isOwner,
        is_online: true,
        last_seen: new Date().toISOString(),
      });

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error("Error agregando miembro a sala:", { error });
      return false;
    }
  }

  /**
   * Deducir tokens por acceso a sala privada
   * @param userId ID del usuario
   * @param cost Costo en tokens
   * @returns true si se dedujeron exitosamente
   */
  private static async deductTokensForAccess(
    userId: string,
    cost: number
  ): Promise<boolean> {
    try {
      // Aquí se integraría con el sistema de tokens CMPX existente
      // Por ahora, simulamos la deducción
      logger.info("Deduciendo tokens por acceso", { userId, cost });
      // TODO: Integrar con TokenService real
      return true;
    } catch (error) {
      logger.error("Error deduciendo tokens:", { error });
      return false;
    }
  }

  /**
   * Obtener salas de chat públicas
   * @returns Lista de salas públicas
   */
  static async getPublicRooms(): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("is_private", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error("Error obteniendo salas públicas:", { error });
      return [];
    }
  }

  /**
   * Obtener salas de chat privadas del usuario
   * @param userId ID del usuario
   * @returns Lista de salas privadas
   */
  static async getUserPrivateRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .select("chat_rooms(*)")
        .eq("user_id", userId)
        .eq("is_owner", true);

      if (error) throw error;

      return data?.map((m: any) => m.chat_rooms).filter(Boolean) || [];
    } catch (error) {
      logger.error("Error obteniendo salas privadas del usuario:", { error });
      return [];
    }
  }

  /**
   * Obtener miembros de una sala
   * @param roomId ID de la sala
   * @returns Lista de miembros
   */
  static async getRoomMembers(roomId: string): Promise<ChatMember[]> {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .select("*")
        .eq("chat_room_id", roomId)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error("Error obteniendo miembros de sala:", { error });
      return [];
    }
  }

  /**
   * Silenciar sala (ocultar sin abandonar)
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @returns true si se silenció exitosamente
   */
  static async muteRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chat_members")
        .update({ is_muted: true })
        .eq("chat_room_id", roomId)
        .eq("user_id", userId);

      if (error) throw error;

      logger.info("Sala silenciada", { roomId, userId });
      return true;
    } catch (error) {
      logger.error("Error silenciando sala:", { error });
      return false;
    }
  }

  /**
   * Ocultar sala (no mostrar en lista)
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @returns true si se ocultó exitosamente
   */
  static async hideRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chat_members")
        .update({ is_hidden: true })
        .eq("chat_room_id", roomId)
        .eq("user_id", userId);

      if (error) throw error;

      logger.info("Sala ocultada", { roomId, userId });
      return true;
    } catch (error) {
      logger.error("Error ocultando sala:", { error });
      return false;
    }
  }

  /**
   * Abandonar sala
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @returns true si se abandonó exitosamente
   */
  static async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chat_members")
        .delete()
        .eq("chat_room_id", roomId)
        .eq("user_id", userId);

      if (error) throw error;

      logger.info("Sala abandonada", { roomId, userId });
      return true;
    } catch (error) {
      logger.error("Error abandonando sala:", { error });
      return false;
    }
  }

  /**
   * Eliminar sala privada (solo owner)
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @returns true si se eliminó exitosamente
   */
  static async deletePrivateRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      // Verificar si es el owner
      const { data: member } = await supabase
        .from("chat_members")
        .select("is_owner")
        .eq("chat_room_id", roomId)
        .eq("user_id", userId)
        .single();

      if (!member || !member.is_owner) {
        logger.warn("Usuario no es owner de la sala", { roomId, userId });
        return false;
      }

      // Eliminar sala
      const { error } = await supabase
        .from("chat_rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;

      logger.info("Sala privada eliminada", { roomId, userId });
      return true;
    } catch (error) {
      logger.error("Error eliminando sala privada:", { error });
      return false;
    }
  }

  /**
   * Actualizar estado online de usuario
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @param isOnline Estado online
   */
  static async updateOnlineStatus(
    roomId: string,
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("chat_members")
        .update({
          is_online: isOnline,
          last_seen: isOnline ? undefined : new Date().toISOString(),
        })
        .eq("chat_room_id", roomId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error actualizando estado online:", { error });
    }
  }

  /**
   * Obtener mensajes de una sala
   * @param roomId ID de la sala
   * @param limit Límite de mensajes
   * @returns Lista de mensajes
   */
  static async getRoomMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error("Error obteniendo mensajes de sala:", { error });
      return [];
    }
  }

  /**
   * Enviar mensaje a sala
   * @param roomId ID de la sala
   * @param userId ID del usuario
   * @param content Contenido del mensaje
   * @returns Mensaje enviado
   */
  static async sendMessage(
    roomId: string,
    userId: string,
    content: string
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_room_id: roomId,
          sender_id: userId,
          content,
          message_type: "text",
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Mensaje enviado", { roomId, userId });
      return data;
    } catch (error) {
      logger.error("Error enviando mensaje:", { error });
      return null;
    }
  }
}
