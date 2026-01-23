import { useState, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import { MessageCircle, Video, MoreVertical, ArrowLeft, Heart, Send, Lock, Globe, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFeatures } from "@/hooks/useFeatures";
import { toast } from "@/hooks/useToast";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { mockPrivacySettings } from "@/lib/data";
import { invitationService } from "@/lib/invitations";
// Tipos reemplazados con tipos locales para compatibilidad
export interface SimpleChatRoom {
  id: string;
  name: string;
  type: "private" | "public";
  last_message?: string;
  updated_at?: string;
}

export interface SimpleChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  room_id: string;
  content: string;
  created_at: string;
  message_type: "text" | "image";
}
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { ConsentIndicator } from "@/components/chat/ConsentIndicator";
import { useConsentVerification } from "@/hooks/useConsentVerification";
import { safeGetItem } from "@/lib/safe-storage";
import { useRealtimeChat } from "@/features/chat/useRealtimeChat";
import { matchService } from "@/services/social/MatchService";
import { tokenService } from "@/services/payments/TokenService";
import { recordGalleryCommission } from "@/services/payments/galleryCommission";
import { supabase } from "@/integrations/supabase/client";
import { PrivateGallery } from "@/components/chat/PrivateGallery";

export interface ChatUser {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  unreadCount: number;
  isPrivate: boolean;
  roomType: "private" | "public";
}

export interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  type: "text" | "image";
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { features } = useFeatures();
  const { user, isAuthenticated } = useAuth();
  const { id: chatPartnerId } = useParams<{ id: string }>();
  const [_rooms, _setRooms] = useState<SimpleChatRoom[]>([]);
  const [_selectedRoom, _setSelectedRoom] = useState<SimpleChatRoom | null>(
    null,
  );
  const [messages, setMessages] = useState<SimpleChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [_isLoading, _setIsLoading] = useState(false);
  const [_isConnected, _setIsConnected] = useState(true);
  const [_connectionStatus, _setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connected");
  const [tabError, setTabError] = useState<string | null>(null);
  const [hasChatAccess, setHasChatAccess] = useState<Record<string, boolean>>(
    {},
  );
  const [isProduction, setIsProduction] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [_realRooms, _setRealRooms] = useState<any[]>([]);
  const [_realMessages, _setRealMessages] = useState<SimpleChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [unlockedGalleries, setUnlockedGalleries] = useState<Set<string>>(
    new Set(),
  );
  const [galleryProcessing, setGalleryProcessing] = useState(false);
  const galleryPrice = 100;

  const getGalleryOwnerId = (): string | null => {
    // Producción: el dueño del contenido privado del chat 1:1 es el partner
    if (isProduction && chatPartnerId) return chatPartnerId;
    // Fallback (demo / mocks)
    if (selectedChat?.id !== undefined && selectedChat?.id !== null) {
      return String(selectedChat.id);
    }
    return null;
  };

  const loadUnlockedGalleries = async (): Promise<void> => {
    try {
      if (!isProduction) return;
      if (!user?.id) return;
      if (!supabase) return;

      const { data, error } = await (supabase as any)
        .from("gallery_unlocks")
        .select("profile_id")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      const ids = Array.isArray(data) ? data.map((r: any) => String(r.profile_id)) : [];
      setUnlockedGalleries(new Set(ids));

      // Mantener un espejo en estado legacy (compatibilidad/telemetría)
      _setRealRooms((prev) => prev);
    } catch (error) {
      logger.warn("No se pudieron cargar desbloqueos de galerías", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleUnlockGalleryItem = async (itemId: string): Promise<void> => {
    if (!user || !selectedChat) return;
    try {
      setGalleryProcessing(true);
      const ownerId = getGalleryOwnerId();
      if (!ownerId) {
        throw new Error("No se pudo determinar el dueño de la galería.");
      }

      const balance = await tokenService.getBalance(user.id);
      if (!balance || balance.cmpx < galleryPrice) {
        toast({
          title: "CMPX insuficientes",
          description: "Compra tokens en el Shop.",
          variant: "destructive",
        });
        return;
      }

      const metadata: Record<string, string | number | boolean> = {
        gallery_owner_id: ownerId,
        gallery_item_id: itemId,
      };
      if (chatPartnerId) {
        metadata.chat_partner_id = chatPartnerId;
      }
      const spent = await tokenService.spendTokens(
        user.id,
        "cmpx",
        galleryPrice,
        "Desbloqueo galería privada",
        metadata,
      );
      if (!spent) throw new Error("No se pudo realizar el cobro");

      if (supabase) {
        const { error } = await (supabase as any)
          .from("gallery_unlocks")
          .insert({ user_id: user.id, profile_id: itemId });
        if (error && error.code !== "23505") {
          throw error;
        }
      }

      await recordGalleryCommission({
        galleryId: `profile-${ownerId}`,
        creatorId: ownerId,
        transactionType: "purchase",
        amountCMPX: galleryPrice,
      });

      setUnlockedGalleries((prev) => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });

      toast({
        title: "Galería desbloqueada",
        description: "Disfruta el contenido privado.",
      });
    } catch (error) {
      logger.error("Error desbloqueando galería", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error",
        description: "No se pudo desbloquear la galería.",
        variant: "destructive",
      });
    } finally {
      setGalleryProcessing(false);
    }
  };

  // Determinar ID de sala activo
  useEffect(() => {
    const resolveRoomId = async () => {
      if (!selectedChat) {
        setActiveRoomId(null);
        return;
      }

      // Si es demo o chat público, usar ID directo
      if (!isProduction || selectedChat.roomType === "public") {
        setActiveRoomId(selectedChat.id.toString());
        return;
      }

      // En producción y chat privado: buscar Match ID real
      if (user?.id && selectedChat.id) {
        try {
          const matchId = await matchService.getMatchId(user.id, selectedChat.id.toString());
          if (matchId) {
             setActiveRoomId(matchId);
          } else {
             logger.warn("No match found for chat", { partnerId: selectedChat.id });
             setActiveRoomId(null);
          }
        } catch (err) {
          logger.error("Error resolving match ID", { error: err });
          setActiveRoomId(null);
        }
      }
    };

    resolveRoomId();
  }, [selectedChat?.id, selectedChat?.roomType, isProduction, user?.id]);

  // Hook de chat en tiempo real (solo se activará cuando haya userId y chatRoomId)
  const { messages: realtimeMessages, sendMessage: sendRealtimeMessage } =
    useRealtimeChat({
      ...(user?.id ? { userId: user.id } : {}),
      ...(activeRoomId ? { chatRoomId: activeRoomId } : {}),
      onError: (error) => {
        logger.error("Error en chat en tiempo real:", { error: String(error) });
      },
    });

  // Mantener espejo de mensajes en estado legacy (compatibilidad)
  useEffect(() => {
    if (!isProduction) return;
    if (!Array.isArray(realtimeMessages)) return;

    const mapped: SimpleChatMessage[] = realtimeMessages.map((m: any) => ({
      id: String(m.id),
      sender_id: String(m.sender_id),
      sender_name: "",
      room_id: String(activeRoomId ?? ""),
      content: String(m.content ?? ""),
      created_at: String(m.created_at ?? new Date().toISOString()),
      message_type: "text",
    }));

    _setRealMessages(mapped);
  }, [realtimeMessages, isProduction, activeRoomId]);

  const handleUnlockGallery = async () => {
    if (!user || !selectedChat) return;
    try {
      setGalleryProcessing(true);
      const ownerId = getGalleryOwnerId();
      if (!ownerId) {
        throw new Error("No se pudo determinar el dueño de la galería.");
      }

      const balance = await tokenService.getBalance(user.id);
      if (!balance || balance.cmpx < galleryPrice) {
        toast({
          title: "CMPX insuficientes",
          description: "Compra tokens en el Shop.",
          variant: "destructive",
        });
        return;
      }
      const metadata: Record<string, string | number | boolean> = {
        gallery_owner_id: ownerId,
      };
      if (chatPartnerId) {
        metadata.chat_partner_id = chatPartnerId;
      }
      const spent = await tokenService.spendTokens(
        user.id,
        "cmpx",
        galleryPrice,
        "Desbloqueo galería privada",
        metadata,
      );
      if (!spent) throw new Error("No se pudo realizar el cobro");

      // Persistir desbloqueo para este usuario y el perfil dueño
      if (supabase) {
        const { error } = await (supabase as any)
          .from("gallery_unlocks")
          .insert({ user_id: user.id, profile_id: ownerId });
        if (error && error.code !== "23505") {
          throw error;
        }
      }

      await recordGalleryCommission({
        galleryId: `profile-${ownerId}`,
        creatorId: ownerId,
        transactionType: "purchase",
        amountCMPX: galleryPrice,
      });
      setUnlockedGalleries((prev) => {
        const next = new Set(prev);
        next.add(ownerId);
        return next;
      });
      toast({
        title: "Galería desbloqueada",
        description: "Disfruta el contenido privado.",
      });
    } catch (error) {
      logger.error("Error desbloqueando galería", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error",
        description: "No se pudo desbloquear la galería.",
        variant: "destructive",
      });
    } finally {
      setGalleryProcessing(false);
    }
  };

  // Cargar desbloqueos persistidos (producción)
  useEffect(() => {
    void loadUnlockedGalleries();
  }, [isProduction, user?.id]);

  // Hook de verificación de consentimiento
  const currentRoomId = activeRoomId || undefined;
  const { verification, isPaused, startMonitoring, stopMonitoring } =
    useConsentVerification(currentRoomId);

  // Verificar si hay sesión activa (demo o produccin)
  const hasActiveSession =
    typeof isAuthenticated === "function"
      ? isAuthenticated()
      : !!isAuthenticated;

  // Detectar modo de operacin (demo vs produccin)
  useEffect(() => {
    const demoAuth = safeGetItem<string>("demo_authenticated", {
      validate: true,
      defaultValue: "false",
    });
    const isDemo = demoAuth === "true";
    setIsProduction(!isDemo);

    const verifyMatch = async () => {
      if (!isDemo && user && chatPartnerId) {
        const hasMatch = await matchService.checkExistingMatch(
          user.id,
          chatPartnerId,
        );
        if (!hasMatch) {
          toast({
            title: "Acceso denegado",
            description: "Necesitas un match mutuo para poder chatear.",
            variant: "destructive",
          });
          navigate("/discover");
        }
      }
    };

    verifyMatch();

    if (!isDemo) {
      // Modo produccin - cargar datos reales
      loadRealChatData();
    } else {
      // Modo demo - usar datos mock SIEMPRE
      logger.info("Chat demo cargado - acceso libre");
      // Forzar acceso a todos los chats demo
      const demoAccessMap: { [key: string]: boolean } = {};
      [...privateChats, ...publicChats].forEach((chat) => {
        demoAccessMap[chat.id] = true;
      });
      setHasChatAccess(demoAccessMap);
      _setIsLoading(false);
    }
  }, [navigate, user, chatPartnerId]);

  // Cargar datos reales de chat para produccin
  const loadRealChatData = async () => {
    _setIsLoading(true);
    try {
      // Los mensajes y presencia ahora se manejan con useRealtimeChat
      logger.info("Chat data loading - useRealtimeChat activo");
    } catch (error) {
      logger.error("Error cargando datos de chat:", { error: String(error) });
    } finally {
      _setIsLoading(false);
    }
  };

  // Cargar mensajes reales de una sala
  const loadRealMessages = async (_roomId: string) => {
    _setIsLoading(true);
    try {
      // useRealtimeChat se encarga de cargar mensajes al cambiar chatRoomId
      logger.info("Loading messages con useRealtimeChat", { roomId: _roomId });
    } catch (_error) {
      logger.error("Error cargando mensajes:", { error: String(_error) });
    } finally {
      _setIsLoading(false);
    }
  };

  // Enviar mensaje real
  const sendRealMessage = async (_content: string) => {
    try {
      if (!selectedChat || !_content.trim()) return;
      await sendRealtimeMessage(_content.trim(), "text");
      setNewMessage("");
    } catch (_error) {
      logger.error("Error enviando mensaje:", { error: String(_error) });
      toast({ title: "Error", description: "Error al enviar mensaje" });
    }
  };

  // Load messages for a specific chat
  const loadMessages = (chatId: string) => {
    const mockMessages: SimpleChatMessage[] = [
      {
        id: "1",
        sender_id: chatId,
        sender_name: "Demo User",
        room_id: chatId,
        content: "Hola! Cómo están?",
        created_at: new Date().toISOString(),
        message_type: "text",
      },
      {
        id: "2",
        sender_id: "0",
        sender_name: "Tú",
        room_id: chatId,
        content: "Muy bien! Y ustedes?",
        created_at: new Date().toISOString(),
        message_type: "text",
      },
      {
        id: "3",
        sender_id: chatId,
        sender_name: "Demo User",
        room_id: chatId,
        content: "Genial, les interesa conocernos mejor?",
        created_at: new Date().toISOString(),
        message_type: "text",
      },
    ];
    setMessages(mockMessages);
  };

  // Check chat access permissions for private chats
  useEffect(() => {
    const checkChatAccess = async () => {
      const currentUserId = "1"; // Mock current user ID
      const accessMap: { [key: string]: boolean } = {};

      for (const chat of privateChats) {
        if (chat.isPrivate) {
          const access = await invitationService.hasChatAccess(
            currentUserId,
            chat.id.toString(),
          );
          accessMap[chat.id] = access;
        } else {
          accessMap[chat.id] = true; // Public chats are always accessible
        }
      }

      setHasChatAccess(accessMap);
    };

    checkChatAccess();
  }, []);

  // Get user from URL params or Navigation State
  useEffect(() => {
    // Handle navigation from ProfileDetail
    if (chatPartnerId && location.state?.profile && !selectedChat) {
      const profile = location.state.profile;
      const chatUser: ChatUser = {
        id: String(profile.id),
        name: profile.name,
        image: profile.image || "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Inicio de conversación",
        timestamp: "Ahora",
        isOnline: profile.isOnline || false,
        unreadCount: 0,
        isPrivate: true,
        roomType: "private"
      };
      setSelectedChat(chatUser);
      // Ensure we are on the chats tab (if tabs exist)
      setActiveTab("private");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("user");
    const roomType =
      (urlParams.get("room") as "private" | "public") || "private";

    setActiveTab(roomType);

    if (userId) {
      const allChats = [...privateChats, ...publicChats];
      const user = allChats.find((chat) => chat.id.toString() === userId);
      if (user) {
        setSelectedChat(user);
        loadMessages(user.id);
      }
    }
  }, [chatPartnerId, location.key, selectedChat]);

  // Private chats - conexiones verificadías
  const privateChats: ChatUser[] = [
    {
      id: "1",
      name: "Anabella & Julio",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop&crop=faces",
      lastMessage: "Están libres este fin de semana? 🔥💕",
      timestamp: "5 min",
      isOnline: true,
      unreadCount: 2,
      isPrivate: true,
      roomType: "private",
    },
    {
      id: "2",
      name: "Sofia",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Me encantó conocerlos en la fiesta 🎉✨",
      timestamp: "1 h",
      isOnline: true,
      unreadCount: 0,
      isPrivate: true,
      roomType: "private",
    },
    {
      id: "3",
      name: "Carmen & Roberto",
      image:
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop&crop=faces",
      lastMessage: "Vienen al evento VIP del sábado? 🌟",
      timestamp: "3 h",
      isOnline: false,
      unreadCount: 0,
      isPrivate: true,
      roomType: "private",
    },
    {
      id: "4",
      name: "Ral",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Qué tal si nos vemos para tomar algo? 🍷",
      timestamp: "2 h",
      isOnline: false,
      unreadCount: 1,
      isPrivate: true,
      roomType: "private",
    },
  ];

  // Public chats - salas comunitarias
  const publicChats: ChatUser[] = [
    {
      id: "101",
      name: "🌍 Sala General Lifestyle",
      image:
        "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Bienvenidos a la comunidad swinger!",
      timestamp: "10 min",
      isOnline: true,
      unreadCount: 5,
      isPrivate: false,
      roomType: "public",
    },
    {
      id: "102",
      name: "💕 Parejas CDMX",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop&crop=faces",
      lastMessage: "Evento swinger este sábado en Polanco 🎊",
      timestamp: "30 min",
      isOnline: true,
      unreadCount: 12,
      isPrivate: false,
      roomType: "public",
    },
    {
      id: "103",
      name: "💫 Singles Lifestyle",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Alguien para intercambio hoy?",
      timestamp: "1 h",
      isOnline: true,
      unreadCount: 3,
      isPrivate: false,
      roomType: "public",
    },
    {
      id: "104",
      name: "🔒 Eventos Privados",
      image:
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop&crop=faces",
      lastMessage: "Club exclusivo abre sus puertas",
      timestamp: "2 h",
      isOnline: true,
      unreadCount: 8,
      isPrivate: false,
      roomType: "public",
    },
  ];

  useEffect(() => {
    const sourceChats = activeTab === "private" ? privateChats : publicChats;
    const mappedRooms: SimpleChatRoom[] = sourceChats.map((chat) => ({
      id: String(chat.id),
      name: chat.name,
      type: chat.roomType,
      last_message: chat.lastMessage,
      updated_at: new Date().toISOString(),
    }));
    _setRooms(mappedRooms);
    if (isProduction) {
      _setRealRooms(mappedRooms);
      logger.info("Rooms sync", { count: mappedRooms.length });
    }
  }, [activeTab, privateChats, publicChats]);

  useEffect(() => {
    if (!selectedChat) {
      _setSelectedRoom(null);
      return;
    }

    _setSelectedRoom({
      id: String(selectedChat.id),
      name: selectedChat.name,
      type: selectedChat.roomType,
      last_message: selectedChat.lastMessage,
      updated_at: new Date().toISOString(),
    });
  }, [selectedChat]);

  useEffect(() => {
    if (!hasActiveSession) {
      _setIsConnected(false);
      _setConnectionStatus("disconnected");
      return;
    }

    if (!isProduction) {
      _setIsConnected(true);
      _setConnectionStatus("connected");
      return;
    }

    if (!activeRoomId) {
      _setIsConnected(false);
      _setConnectionStatus("connecting");
      return;
    }

    _setIsConnected(true);
    _setConnectionStatus("connected");
  }, [hasActiveSession, isProduction, activeRoomId]);

  useEffect(() => {
    if (selectedChat) {
      if (isProduction) {
        loadRealMessages(selectedChat.id.toString());
      } else {
        loadMessages(selectedChat.id);
      }
    }
  }, [selectedChat, isProduction]);

  // Iniciar monitoreo de consentimiento cuando se selecciona un chat
  useEffect(() => {
    if (!selectedChat || !user?.id || !isProduction || !activeRoomId) return;

    const roomId = activeRoomId;
    // El ID del otro usuario es el ID del chat seleccionado (partner)
    const otherUserId = selectedChat.id.toString();

    // Iniciar monitoreo de consentimiento
    if (roomId && user.id && otherUserId) {
      startMonitoring(roomId, user.id, otherUserId).catch((err) => {
        logger.error("Error iniciando monitoreo de consentimiento", {
          error: err,
        });
      });
    }

    // Cleanup: detener monitoreo al cambiar de chat
    return () => {
      if (roomId) {
        stopMonitoring(roomId).catch((err) => {
          logger.error("Error deteniendo monitoreo de consentimiento", {
            error: err,
          });
        });
      }
    };
  }, [selectedChat, user?.id, isProduction, activeRoomId, startMonitoring, stopMonitoring]);

  const handleSendMessage = () => {
    if (!selectedChat || !newMessage.trim()) return;

    // Bloquear envio si el chat est pausado por bajo consenso
    if (isPaused) {
      toast({
        variant: "destructive",
        title: "Chat pausado",
        description:
          verification?.pauseReason ||
          "El chat est pausado por bajo consenso. Por favor, espera a que mejore el consenso antes de enviar mensajes.",
      });
      return;
    }

    // Usar datos reales en produccin, mock en demo
    if (isProduction) {
      sendRealMessage(newMessage).catch((err) => {
        logger.error("Error en sendRealMessage:", { error: err });
      });
      return;
    }

    // Lgica para modo demo
    if (selectedChat.isPrivate && !hasChatAccess[selectedChat.id]) {
      toast({
        title: "Acceso Denegado",
        description:
          "No tienes acceso a este chat privado. Necesitas una invitación aceptada.",
      });
      return;
    }

    // Verificar permisos de mensajera segn configuracin de privacidad
    const canSendMessage = checkMessagePermissions(selectedChat);
    if (!canSendMessage) {
      toast({
        title: "Sin Permisos",
        description:
          "No puedes enviar mensajes a este usuario según su configuración de privacidad.",
      });
      return;
    }

    const message: SimpleChatMessage = {
      id: (Date.now() + Math.random()).toString(),
      sender_id: "0",
      sender_name: "Tú",
      room_id: selectedChat.id.toString(),
      content: newMessage,
      created_at: new Date().toISOString(),
      message_type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const checkMessagePermissions = (chat: ChatUser) => {
    if (!features.messagingPrivacy) return true;

    // Para chats pblicos, siempre permitir
    if (chat.roomType === "public") return true;

    // Para chats privados, verificar configuracin
    const userPrivacySettings = mockPrivacySettings; // En produccin, obtener del usuario especfico

    switch (userPrivacySettings.allowMessages) {
      case "everyone":
        return true;
      case "connections_only":
        // Verificar si hay conexin aceptada (simulado)
        return true; // Por ahora siempre true para demo
      case "none":
        return false;
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 relative overflow-hidden">
      <DecorativeHearts />

      {/* Background decorativo uniforme */}
      <div className="fixed inset-0 z-0 bg-linear-to-br from-purple-900 via-purple-800 to-blue-900">
        <div className="absolute inset-0 bg-linear-to-br from-purple-900/20 via-purple-800/20 to-blue-900/20"></div>
      </div>

      <div
        className={`relative z-10 flex h-screen ${hasActiveSession ? "pt-4" : "pt-16"} ${hasActiveSession ? "pb-4" : "pb-20"}`}
      >
        {/* Chat List Sidebar */}
        <div className="w-full sm:w-80 shrink-0 bg-linear-to-br from-purple-900/40 via-purple-800/40 to-blue-900/40 backdrop-blur-sm border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2 sm:hidden"
                onClick={() => navigate("/feed")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  Conversaciones
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 md:hidden"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs para Private/Public */}
            <div className="flex gap-2 bg-linear-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-lg p-1 border border-purple-400/20">
              <Button
                variant={activeTab === "private" ? "default" : "ghost"}
                size="sm"
                className={`flex-1 flex items-center gap-2 transition-all duration-200 ${
                  activeTab === "private"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  setTabError(null);
                  setActiveTab("private");
                  setSelectedChat(null); // Limpiar chat seleccionado al cambiar tab
                  logger.info("Cambiando a tab privado");
                }}
              >
                <Lock className="h-4 w-4" />
                Privado
                {privateChats.reduce((acc, chat) => acc + chat.unreadCount, 0) >
                  0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {privateChats.reduce(
                      (acc, chat) => acc + chat.unreadCount,
                      0,
                    )}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === "public" ? "default" : "ghost"}
                size="sm"
                className={`flex-1 flex items-center gap-2 transition-all duration-200 ${
                  activeTab === "public"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  setTabError(null);
                  setActiveTab("public");
                  setSelectedChat(null); // Limpiar chat seleccionado al cambiar tab
                  logger.info("Cambiando a tab público");
                }}
              >
                <Globe className="h-4 w-4" />
                Pblico
                {publicChats.reduce((acc, chat) => acc + chat.unreadCount, 0) >
                  0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {publicChats.reduce(
                      (acc, chat) => acc + chat.unreadCount,
                      0,
                    )}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Error display */}
            {tabError && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-200 text-sm">{tabError}</p>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === "private" && (
              <div className="mt-4">
                <div className="text-white font-semibold text-sm mb-3 px-2 drop-shadow-lg">
                  🔒 Chats privados con tus conexiones
                </div>
                <div className="space-y-2">
                  {privateChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        logger.info("Chat clicked", {
                          chatName: chat.name,
                          isProduction,
                        });
                        setSelectedChat(chat);
                        if (isProduction) {
                          loadRealMessages(chat.id.toString());
                        } else {
                          loadMessages(chat.id);
                        }
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedChat?.id === chat.id
                          ? "bg-white/20 border border-white/30"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={chat.image}
                            alt={chat.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                          />
                          {chat.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black/50"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white truncate flex items-center gap-2">
                              {chat.name}
                              <Lock className="h-3 w-3 text-purple-300" />
                            </h3>
                            <span className="text-xs text-white/90 font-medium">
                              {chat.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-white/90 truncate font-medium">
                            {chat.lastMessage}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "public" && (
              <div className="mt-4">
                <div className="text-white font-semibold text-sm mb-3 px-2 drop-shadow-lg">
                  Salas plicas de la comunidad
                </div>
                <div className="space-y-2">
                  {publicChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        logger.info("Chat clicked", {
                          chatName: chat.name,
                          isProduction,
                        });
                        setSelectedChat(chat);
                        if (isProduction) {
                          loadRealMessages(chat.id.toString());
                        } else {
                          loadMessages(chat.id);
                        }
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedChat?.id === chat.id
                          ? "bg-white/20 border border-white/30"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-linear-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                            {chat.name.charAt(0)}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black/50"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white truncate flex items-center gap-2">
                              {chat.name}
                              <Globe className="h-3 w-3 text-green-300" />
                            </h3>
                            <span className="text-xs text-white/90 font-medium">
                              {chat.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-white/90 truncate font-medium">
                            {chat.lastMessage}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* rea de chat */}
        <div
          className={`${selectedChat ? "block" : "hidden md:block"} flex-1 flex flex-col bg-linear-to-br from-purple-900/20 via-purple-800/20 to-blue-900/20 backdrop-blur-sm`}
        >
          {selectedChat ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b border-white/10 bg-linear-to-r from-purple-900/30 via-purple-800/30 to-blue-900/30">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden text-white hover:bg-white/10 mr-2"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {selectedChat.roomType === "public" ? (
                    <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold border-2 border-white/20">
                      {selectedChat.name.charAt(0)}
                    </div>
                  ) : (
                    <img
                      src={selectedChat.image}
                      alt={selectedChat.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {selectedChat.name}
                      </h3>
                      {selectedChat.roomType === "private" ? (
                        <Lock className="h-4 w-4 text-purple-300" />
                      ) : (
                        <Globe className="h-4 w-4 text-green-300" />
                      )}
                    </div>
                    <p className="text-sm text-white/90 drop-shadow-md">
                      {selectedChat.roomType === "public"
                        ? `Sala pblica  ${Math.floor(Math.random() * 50) + 10} miembros activos`
                        : selectedChat.isOnline
                          ? "En lnea"
                          : `ltima vez ${selectedChat.timestamp}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Indicador de consentimiento */}
              {isProduction && selectedChat && user?.id && (
                <div className="px-4 py-2 border-b border-white/10 bg-linear-to-r from-purple-900/30 via-purple-800/30 to-blue-900/30">
                  <ConsentIndicator
                    chatId={selectedChat.id.toString()}
                    userId1={user.id}
                    userId2={selectedChat.id.toString()} // TODO: Obtener el ID real del otro usuario
                    currentUserId={user.id}
                    onPauseChange={(paused) => {
                      if (paused) {
                        logger.warn("Chat pausado por bajo consenso", {
                          chatId: selectedChat.id,
                        });
                      }
                    }}
                  />
                </div>
              )}

              {selectedChat?.roomType === "private" && (
                <PrivateGallery
                  galleryItems={[
                    {
                      id: "1",
                      url: selectedChat.image,
                      thumbnail_url: selectedChat.image,
                      caption: "Foto privada 1",
                    },
                  ]}
                  creatorId={getGalleryOwnerId() ?? ""}
                  currentUserId={user?.id ?? ""}
                  unlockedItems={unlockedGalleries}
                  unlockingItemId={galleryProcessing ? "1" : null}
                  onUnlock={handleUnlockGalleryItem}
                />
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 chat-messages scroll-container btn-animated chat-scroll-smooth">
                {isProduction
                  ? // Renderizar mensajes reales de Supabase mediante useRealtimeChat
                    realtimeMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === safeGetItem<string>("user_id", { validate: false, defaultValue: "" }) ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-xs lg:max-w-sm px-3 sm:px-4 py-2 sm:py-3 rounded-2xl transition-all duration-300 hover:scale-102 ${
                            message.sender_id ===
                            safeGetItem<string>("user_id", {
                              validate: false,
                              defaultValue: "",
                            })
                              ? "bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                              : "bg-linear-to-r from-blue-500/95 to-purple-600/95 text-white shadow-md border border-blue-400/50 backdrop-blur-sm"
                          }`}
                        >
                          <p className="text-xs sm:text-sm leading-relaxed wrap-break-word whitespace-pre-wrap overflow-wrap-anywhere hyphens-auto font-medium text-white drop-shadow-md chat-message-text">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 font-medium ${
                              message.sender_id ===
                              safeGetItem<string>("user_id", {
                                validate: false,
                                defaultValue: "",
                              })
                                ? "text-purple-100 drop-shadow-sm"
                                : "text-white/90 drop-shadow-sm"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  : // Renderizar mensajes mock para demo
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${String(message.sender_id) === "0" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl transition-all duration-300 hover:scale-102 ${
                            String(message.sender_id) === "0"
                              ? "bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                              : "bg-linear-to-r from-blue-500/95 to-purple-600/95 text-white shadow-md border border-blue-400/50 backdrop-blur-sm"
                          }`}
                        >
                          <p className="text-xs sm:text-sm leading-relaxed wrap-break-word whitespace-pre-wrap overflow-wrap-anywhere hyphens-auto font-medium text-white drop-shadow-md chat-message-text word-break-break-all">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 font-medium ${
                              String(message.sender_id) === "0"
                                ? "text-purple-100 drop-shadow-sm"
                                : "text-white/90 drop-shadow-sm"
                            }`}
                          >
                            {message.created_at}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>

              {/* Input para enviar mensajes */}
              <div className="p-4 border-t border-white/10 bg-linear-to-r from-purple-900/30 via-purple-800/30 to-blue-900/30 chat-input">
                {selectedChat?.isPrivate && !hasChatAccess[selectedChat.id] ? (
                  <div className="text-center space-y-4 bg-linear-to-br from-purple-900/50 via-purple-800/50 to-blue-900/50 rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-center text-white mb-3">
                      <Lock className="h-6 w-6 mr-2" />
                      <span className="font-semibold text-lg">
                        Chat privado bloqueado
                      </span>
                    </div>
                    <p className="text-sm text-white/90 mb-6 leading-relaxed max-w-sm mx-auto">
                      Necesitas una invitacin aceptada para chatear con{" "}
                      {selectedChat?.name}. Puedes enviar una invitacin o
                      esperar a que te enven una.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => {
                          logger.info("Enviando invitacin...");
                          // Simulate invitation sent
                          if (!selectedChat?.id) return;
                          setHasChatAccess((prev) => ({
                            ...prev,
                            [selectedChat.id]: true,
                          }));
                          toast({
                            title: "¡Éxito!",
                            description:
                              "¡Invitación aceptada! Ahora puedes chatear.",
                          });
                        }}
                        className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Aceptar invitacin
                      </Button>
                      <Button
                        onClick={() => {
                          logger.info("Rechazando invitación...");
                          // Properly reject the invitation and navigate back
                          setSelectedChat(null);
                          toast({
                            title: "Invitación Rechazada",
                            description: "Has vuelto a la lista de chats.",
                          });
                        }}
                        variant="outline"
                        className="border-red-300/50 text-red-300 hover:bg-red-500/20 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Botones de galera y solicitudes */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        onClick={() => {
                          if (selectedChat?.roomType === "private") {
                            handleUnlockGallery().catch((err) => {
                              logger.error("Error en handleUnlockGallery", {
                                error: err,
                              });
                            });
                            toast({
                              title: "Galería Privada",
                              description: `Ver galería privada de ${selectedChat.name}`,
                            });
                          } else {
                            toast({
                              title: "Galería Pública",
                              description: "Ver galería pública de la sala",
                            });
                          }
                        }}
                        variant="outline"
                        className="flex-1 min-w-0 border-purple-400/50 text-purple-300 hover:bg-purple-500/20 text-xs sm:text-sm py-2 px-2 sm:px-3"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        <span className="truncate">Galería</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/requests")}
                        variant="outline"
                        className="flex-1 min-w-0 border-purple-400/50 text-purple-300 hover:bg-purple-500/20 text-xs sm:text-sm py-2 px-2 sm:px-3"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        <span className="truncate">Solicitudes</span>
                      </Button>
                      <Button
                        onClick={() => {
                          if (selectedChat?.roomType === "private") {
                            toast({
                              title: "Galera Privada",
                              description:
                                "Accediendo a galera privada con " +
                                selectedChat.name,
                            });
                          } else {
                            toast({
                              title: "Galera Pblica",
                              description:
                                "Accediendo a galera pblica de la sala",
                            });
                          }
                        }}
                        variant="outline"
                        className="flex-1 border-green-400/50 text-green-300 hover:bg-green-500/20 text-xs py-2"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {selectedChat?.roomType === "private"
                          ? "Privada"
                          : "Pblica"}
                      </Button>
                    </div>

                    {/* Input de mensaje */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Escribe tu mensaje..."
                        value={newMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setNewMessage(e.target.value)
                        }
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter" && !isPaused) {
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 text-sm sm:text-base"
                        disabled={isPaused}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isPaused}
                        gradient={true}
                        className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-3 sm:px-4 py-2"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {isPaused && (
                      <p className="text-xs text-white/70 mt-2 text-center">
                        El chat est pausado por bajo consenso. El envo de
                        mensajes est bloqueado.
                      </p>
                    )}
                  </div>
                )}
                {selectedChat?.roomType === "public" && (
                  <p className="text-xs text-white/50 mt-2 px-1">
                    Los mensajes en salas plicas son visibles para todos los
                    miembros
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-white opacity-80 drop-shadow-lg" />
                <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-md">
                  Selecciona una conversacin
                </h3>
                <p className="mb-4 text-white/90 drop-shadow-md">
                  {activeTab === "private"
                    ? "Elige un chat privado para conversar de forma segura"
                    : "nete a una sala pblica para conocer la comunidad"}
                </p>
                <div className="flex items-center justify-center text-sm space-x-4">
                  <div className="flex items-center text-white/90">
                    <Lock className="h-4 w-4 mr-1 text-purple-300" />
                    <span className="drop-shadow-md">
                      Chats privados encriptados
                    </span>
                  </div>
                  <div className="flex items-center text-white/90">
                    <Globe className="h-4 w-4 mr-1 text-green-300" />
                    <span className="drop-shadow-md">
                      Salas pblicas moderadías
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Estilos simplificados - sin animaciones blob */
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        .chat-container::-webkit-scrollbar {
          width: 6px;
        }

        .chat-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .chat-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Chat;

