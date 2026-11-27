import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  MessageCircle,
  Video,
  MoreVertical,
  ArrowLeft,
  Heart,
  Send,
  Lock,
  Globe,
  UserPlus,
  Smile,
  Paperclip,
  Mic,
  X,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFeatures } from "@/hooks/useFeatures";
import { toast } from "@/hooks/useToast";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import {
  canSendMessageTo,
  canStartVideoCall,
  loadRecipientPrivacy,
  readRecipientPrivacySync,
} from "@/lib/chatLimits";
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
import { FriendRequestButton } from "@/components/profiles/shared/FriendRequestButton";
import { PhotoAccessRequestButton } from "@/components/profiles/shared/PhotoAccessRequestButton";
import {
  areFriendsSync,
  getPhotoAccessStatus,
  type PhotoAccessStatus,
} from "@/lib/friends";
import {
  findLocalDemoAccountById,
  isAnonymousDemoProfile,
} from "@/lib/demo-registration";
import { generateDemoProfiles } from "@/demo/demoData";
import { useConsentVerification } from "@/hooks/useConsentVerification";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { ChatFileUpload } from "@/components/chat/ChatFileUpload";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { useRealtimeChat } from "@/features/chat/useRealtimeChat";
import { matchService } from "@/services/social";
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

/**
 * Ronda 21 (stream B): inicial del avatar de una sala pública.
 * Los nombres empiezan por emoji (🌍, 💕, 💫, 🔒): `charAt(0)`
 * sobre un emoji devuelve media unidad sustituta y se pinta "?" —
 * por eso la pestaña Público mostraba "?" en diamante aunque las 4
 * salas SÍ tienen `image` (las 4 URLs devuelven HTTP 200,
 * verificadas con curl el 2026-11-26). Se toma la primera LETRA
 * del nombre.
 */
function publicRoomInitial(name: string): string {
  const firstLetter = name.replace(/^[^\p{L}\p{N}]+/u, "").charAt(0);
  return firstLetter ? firstLetter.toUpperCase() : "S";
}

/**
 * Ronda 21 (stream B): avatar de sala pública — la `image` de la
 * sala; si no carga (o no hay), las iniciales, nunca "?". Mismo
 * degradado del diamante anterior para no cambiar el diseño.
 */
function PublicRoomAvatar({
  chat,
  sizeClass,
  textClass,
}: {
  chat: ChatUser;
  sizeClass: string;
  textClass: string;
}) {
  const [imageError, setImageError] = useState(false);
  if (!chat.image || imageError) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-linear-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold ${textClass} border-2 border-slate-200 dark:border-white/20`}
      >
        {publicRoomInitial(chat.name)}
      </div>
    );
  }
  return (
    <img
      src={chat.image}
      alt={chat.name}
      onError={() => setImageError(true)}
      className={`${sizeClass} rounded-full object-cover border-2 border-slate-200 dark:border-white/20`}
    />
  );
}

// NOTA: estos arrays viven a nivel de módulo (no dentro del componente)
// para que su identidad sea estable entre renders. El efecto de
// sincronización de rooms depende de ellos; si se recrearan en cada
// render, el efecto dispararía _setRooms en bucle y las transiciones
// de navegación del Router nunca harían commit (la URL cambia pero
// la vista se queda atorada en el chat).
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
      "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=100&h=100&fit=crop&crop=faces",
    lastMessage: "Vienen al evento VIP del sábado? 🌟",
    timestamp: "3 h",
    isOnline: false,
    unreadCount: 0,
    isPrivate: true,
    roomType: "private",
  },
  {
    id: "4",
    name: "Raúl",
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
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=100&h=100&fit=crop&crop=faces",
    lastMessage: "Club exclusivo abre sus puertas",
    timestamp: "2 h",
    isOnline: true,
    unreadCount: 8,
    isPrivate: false,
    roomType: "public",
  },
];

// Nº de miembros ESTABLE por sala pública (antes: Math.random() en cada
// render, el contador cambiaba 30→57→37 sin motivo).
const PUBLIC_ROOM_MEMBERS: Record<string, number> = {
  "101": 42,
  "102": 57,
  "103": 28,
  "104": 19,
};

/**
 * Sala de chat → id del PERFIL del interlocutor (ronda 7, punto 12).
 *
 * Los ids de `privateChats` son de SALA ("1"-"4"), no de perfil: la
 * solicitud de ver fotos se guardaba con toId = id de sala, mientras
 * la misma solicitud desde el perfil se guarda con toId = id del
 * perfil (UUID o "demo-couple-456"). Eran dos llaves distintas para
 * la misma persona: la solicitud enviada en el chat no aparecía como
 * enviada al abrir el perfil (y viceversa), y /requests tampoco la
 * encontraba por perfil. La sala 3 es Carmen & Roberto, cuya ficha
 * demo usa el id "demo-couple-456" (el mismo que produce Compartir);
 * la sala 2 es Sofía, cuya ficha demo usa "demo-single-1". Las
 * demás salas no tienen ficha de perfil propia en el repo, así que
 * conservan su id de sala (consistencia interna del chat).
 *
 * Ronda 14 (stream A): faltaba la sala 2. Sin ella, la solicitud de
 * ver fotos (y la de amistad) enviada desde el chat de la pareja a
 * Sofía se guardaba con toId = "2": el remitente la veía como
 * enviada, pero la bandeja de Sofía —que lee con su UUID canónico—
 * nunca la encontraba (test de verificación ronda 13, 23:30–23:58).
 * Y como la solicitud real nunca llegaba, lo único aprobable en la
 * bandeja eran las 2 mock, cuya aprobación es solo estado local: sin
 * cuenta atrás HH:MM:SS y revertida a "2 pendientes" al remontar.
 */
const CHAT_ROOM_PROFILE_IDS: Record<string, string> = {
  "2": "demo-single-1",
  "3": "demo-couple-456",
};

export function resolveChatPartnerProfileId(chatId: string): string {
  return CHAT_ROOM_PROFILE_IDS[chatId] ?? chatId;
}

// Persistencia demo: mensajes enviados por sala en localStorage.
const chatMessagesKey = (chatId: string) => `chat_messages:${chatId}`;

const readPersistedChatMessages = (chatId: string): SimpleChatMessage[] => {
  try {
    // safeGetItem YA parsea el JSON cuando el valor empieza por "[" o
    // "{": lo que devuelve aquí ya es el array, no un string. El
    // JSON.parse(raw) anterior lo volvía a parsear ("[object Object]")
    // y siempre caía en el catch → []. Por eso los mensajes enviados
    // se veían al enviarlos (estado) pero desaparecían al navegar y
    // volver (la recarga leía []), y cada envío sobrescribía los
    // anteriores (persistía [último] sobre []). Verificado con
    // simulación en /tmp (prove_chat_persist.js).
    const stored: unknown = safeGetItem(chatMessagesKey(chatId), {
      defaultValue: "",
    });
    if (Array.isArray(stored)) return stored as SimpleChatMessage[];
    if (typeof stored === "string" && stored) {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as SimpleChatMessage[]) : [];
    }
    return [];
  } catch {
    return [];
  }
};

const writePersistedChatMessages = (
  chatId: string,
  msgs: SimpleChatMessage[],
): void => {
  safeSetItem(chatMessagesKey(chatId), JSON.stringify(msgs));
};

// Historial semilla de cada hilo demo (lo que ya veía el usuario antes de
// escribir nada). Los mensajes enviados se añaden encima desde localStorage.
const getSeedMessages = (chatId: string): SimpleChatMessage[] => [
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

const Chat = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { features } = useFeatures();
  const { user, profile, isAuthenticated } = useAuth();
  // Nombre del espectador para las solicitudes de amistad/fotos.
  // Ronda 11, stream C (iv): `user` es el Auth user de Supabase y NO
  // trae `first_name` (vive en `profile`): antes viewerName caía a
  // `user.email` ("single@outlook.es") y la comprobación de amistad
  // semilla (`getSocialDemoData(...).friendNames` trae "Sofía", no el
  // email) nunca casaba, así que el chat con Carmen & Roberto mostraba
  // "Enviar solicitud de amistad" aunque Sofía ya los tiene de amigos.
  // Se lee primero del perfil (first_name / display_name) y solo
  // después del email.
  const viewerName =
    (profile as { first_name?: string; display_name?: string } | null)
      ?.first_name ??
    (profile as { display_name?: string } | null)?.display_name ??
    (user as { first_name?: string } | null)?.first_name ??
    user?.email ??
    "Tú";
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
  // Estado persistido de la solicitud de ver fotos del hilo abierto
  // (punto 7): null = aún no leído. Se lee al abrir el hilo (ver
  // efecto abajo) desde el mismo almacén que la solicitud de amistad
  // (`friend_requests` kind='photo_access' en real, localStorage
  // `friend_requests_demo` en demo), para que al reabrir la
  // conversación no vuelva a "Solicitar ver fotos" cuando ya se envió.
  const [photoAccessStatus, setPhotoAccessStatus] =
    useState<PhotoAccessStatus | null>(null);
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [_realRooms, _setRealRooms] = useState<any[]>([]);
  const [_realMessages, _setRealMessages] = useState<SimpleChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [unlockedGalleries, setUnlockedGalleries] = useState<Set<string>>(
    new Set(),
  );
  const [galleryProcessing, setGalleryProcessing] = useState(false);
  const galleryPrice = 100;

  // Vista previa (lastMessage) por hilo: en demo se restaura desde los
  // mensajes enviados persistidos en localStorage, para que no se pierda
  // al navegar y volver.
  const [lastMessageByChat, setLastMessageByChat] = useState<
    Record<string, string>
  >(() => {
    const overrides: Record<string, string> = {};
    [...privateChats, ...publicChats].forEach((chat) => {
      const stored = readPersistedChatMessages(chat.id);
      const last = stored[stored.length - 1];
      if (last) overrides[chat.id] = last.content;
    });
    return overrides;
  });

  // Paneles del compositor (emoji / adjuntar / audio)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Galería privada del hilo: colapsada por defecto — antes se renderizaba
  // siempre entre el header y los mensajes y comía ~250 px del hilo (en la
  // captura se veía solapada con el primer mensaje). Los botones Galería /
  // Privada la abren; el panel tiene su propio cierre.
  const [showPrivateGallery, setShowPrivateGallery] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Clave de la última navegación a la que ya se le aplicó la
  // auto-selección de hilo (desde ProfileDetail o ?user=): sin este
  // guard, pulsar "Volver" en el hilo (setSelectedChat(null)) hacía
  // que el efecto de abajo volviera a correr con los mismos parámetros
  // y reabriera el hilo al instante — "Volver" parecía no navegar.
  const profileChatAppliedRef = useRef<string | null>(null);

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

      const ids = Array.isArray(data)
        ? data.map((r: any) => String(r.profile_id))
        : [];
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
    if (!selectedChat) return;

    // Demo: sin usuario real ni backend, el desbloqueo se simula — antes
    // el botón "Desbloquear (100 CMPX)" no hacía nada en demo (retorno
    // silencioso por falta de user).
    if (!isProduction) {
      setGalleryProcessing(true);
      try {
        setUnlockedGalleries((prev) => {
          const next = new Set(prev);
          next.add(itemId);
          return next;
        });
        toast({
          title: "Galería desbloqueada (demo)",
          description: "Desbloqueo simulado: 100 CMPX (demo, sin cargo real).",
        });
      } finally {
        setGalleryProcessing(false);
      }
      return;
    }

    if (!user) return;
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
          const matchId = await matchService.getMatchId(
            user.id,
            selectedChat.id.toString(),
          );
          if (matchId) {
            setActiveRoomId(matchId);
          } else {
            logger.warn("No match found for chat", {
              partnerId: selectedChat.id,
            });
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

  // Vista previa de un hilo en la lista: último mensaje enviado (demo, desde
  // localStorage) o último mensaje real (producción, sala seleccionada).
  const previewFor = (chat: ChatUser): string => {
    const sent = lastMessageByChat[chat.id];
    if (sent) return sent;
    if (
      isProduction &&
      selectedChat?.id === chat.id &&
      realtimeMessages.length > 0
    ) {
      const last = realtimeMessages[realtimeMessages.length - 1];
      if (last?.content) return String(last.content);
    }
    return chat.lastMessage;
  };

  // Un hilo con historial (semilla demo o mensajes reales) no se bloquea:
  // si ya hay conversación, el usuario es participante de ese hilo.
  const threadHasHistory = (chat: ChatUser): boolean => {
    if (!isProduction) {
      return (
        getSeedMessages(chat.id).length > 0 ||
        readPersistedChatMessages(chat.id).length > 0
      );
    }
    return realtimeMessages.length > 0 || _realMessages.length > 0;
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

  // Load messages for a specific chat (demo: semilla + enviados persistidos
  // en localStorage, para que sobrevivan a navegar y volver).
  const loadMessages = (chatId: string) => {
    setMessages([
      ...getSeedMessages(chatId),
      ...readPersistedChatMessages(chatId),
    ]);
  };

  // Check chat access permissions for private chats
  useEffect(() => {
    const checkChatAccess = async () => {
      // En demo el acceso es libre: no dejar que la verificación por
      // invitación (IDs mock sin invitación "chat" aceptada) pise a false
      // el mapa que el efecto de modo demo pone a true. Sin este guard,
      // todos los privados demo acababan bloqueados (p. ej. /chat/1).
      const demoAuth = safeGetItem<string>("demo_authenticated", {
        validate: true,
        defaultValue: "false",
      });
      if (demoAuth === "true") {
        const demoAccessMap: { [key: string]: boolean } = {};
        [...privateChats, ...publicChats].forEach((chat) => {
          demoAccessMap[chat.id] = true;
        });
        setHasChatAccess(demoAccessMap);
        return;
      }

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
  // La auto-selección de hilo solo se aplica UNA VEZ por navegación
  // (profileChatAppliedRef, clave = location.key). Sin el guard, al
  // pulsar "Volver" (setSelectedChat(null)) el efecto re-corría con
  // los mismos parámetros y reabría el hilo al instante.
  useEffect(() => {
    // Handle navigation from ProfileDetail
    if (chatPartnerId && location.state?.profile && !selectedChat) {
      if (profileChatAppliedRef.current === location.key) return;
      profileChatAppliedRef.current = location.key;
      const profile = location.state.profile;
      const chatUser: ChatUser = {
        id: String(profile.id),
        name: profile.name,
        image:
          profile.image ||
          "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=100&h=100&fit=crop&crop=face",
        lastMessage: "Inicio de conversación",
        timestamp: "Ahora",
        isOnline: profile.isOnline || false,
        unreadCount: 0,
        isPrivate: true,
        roomType: "private",
      };
      setSelectedChat(chatUser);
      // Ensure we are on the chats tab (if tabs exist)
      setActiveTab("private");
      return;
    }

    // Carga directa de /chat/<id> (ronda 6, punto 16): antes el hilo
    // solo se resolvía con location.state (navegación desde el perfil)
    // o ?user=, así que /chat/3 directo dejaba selectedChat en null y
    // la página mostraba la LISTA de chats en vez del hilo. Ahora el id
    // de la URL se resuelve contra las listas canónicas (privados 1-4,
    // públicos 101-104); si no existe, se queda en la lista.
    // NOTA DE ESPACIO DE IDS: estos ids son de SALA de chat, no de
    // perfil — /chat/3 es "Carmen & Roberto" (sala privada 3) mientras
    // /profile/3 es Ana (perfil legacy 3). No se pueden unificar sin
    // salas reales (Supabase) que mapeen sala ↔ perfil; ver reporte.
    if (chatPartnerId && !selectedChat) {
      if (profileChatAppliedRef.current === location.key) return;
      profileChatAppliedRef.current = location.key;
      const allChats = [...privateChats, ...publicChats];
      const found = allChats.find((chat) => chat.id === chatPartnerId);
      if (found) {
        setSelectedChat(found);
        setActiveTab(found.roomType);
        loadMessages(found.id);
        return;
      }
      // Ronda 21 (stream B, FAIL 8): el id no es de sala — resolverlo
      // como id de PERFIL contra el roster demo (`generateDemoProfiles(20)`,
      // el mismo que Discover). Cubre la navegación desde Discover sin
      // state y la recarga (el state se pierde al recargar). Si no
      // resuelve en ningún lado, quedarse en la lista (comportamiento
      // actual).
      const demoProfile = generateDemoProfiles(20).find(
        (p) => p.id === chatPartnerId,
      );
      if (demoProfile) {
        const chatUser: ChatUser = {
          id: demoProfile.id,
          name: demoProfile.name,
          image: demoProfile.image,
          lastMessage: "Inicio de conversación",
          timestamp: "Ahora",
          isOnline: demoProfile.isOnline,
          unreadCount: 0,
          isPrivate: true,
          roomType: "private",
        };
        setSelectedChat(chatUser);
        setActiveTab("private");
        loadMessages(chatUser.id);
        return;
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("user");
    // Solo imponer el tab desde la URL cuando viene explícito (?room=...).
    // Antes se forzaba "private" en cada cambio de selectedChat: el tab
    // Público necesitaba dos clics (el primero lo revertía este efecto)
    // y al abrir una sala pública la lista volvía a los privados.
    if (urlParams.has("room")) {
      const roomType =
        (urlParams.get("room") as "private" | "public") || "private";
      setActiveTab(roomType);
    }

    if (userId) {
      if (profileChatAppliedRef.current === location.key) return;
      profileChatAppliedRef.current = location.key;
      const allChats = [...privateChats, ...publicChats];
      const user = allChats.find((chat) => chat.id.toString() === userId);
      if (user) {
        setSelectedChat(user);
        loadMessages(user.id);
      }
    }
  }, [chatPartnerId, location.key, selectedChat]);

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

  // Solicitud de ver fotos (punto 7): al abrir un hilo privado se
  // lee el estado persistido, igual que `FriendRequestButton` hace
  // con la amistad al montar. Sin esta lectura, el botón de fotos
  // solo guardaba `sent` en su propio useState y al reabrir la
  // conversación volvía a "Solicitar ver fotos" aunque la solicitud
  // ya estaba guardada. El botón en sí (`PhotoAccessRequestButton`,
  // fuera del alcance de este stream) no se toca: es este padre el
  // que muestra la píldora "Solicitud de fotos enviada" cuando el
  // estado leído es pendiente, y oculta el botón cuando ya hay
  // acceso concedido.
  // Ronda 7, punto 12: el dueño NO es el id de sala
  // (`selectedChat.id` = "1"-"4") sino el id del PERFIL del
  // interlocutor (ver `resolveChatPartnerProfileId`): con el id de
  // sala, la solicitud del chat y la del perfil eran dos registros
  // distintos y el estado no persistía entre superficies.
  useEffect(() => {
    setPhotoAccessStatus(null);
    if (!selectedChat || selectedChat.roomType !== "private" || !user?.id) {
      return;
    }
    let cancelled = false;
    void getPhotoAccessStatus(
      String(user.id),
      resolveChatPartnerProfileId(String(selectedChat.id)),
      !isProduction,
    ).then((status) => {
      if (!cancelled) setPhotoAccessStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedChat, user?.id, isProduction]);

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
  }, [
    selectedChat,
    user?.id,
    isProduction,
    activeRoomId,
    startMonitoring,
    stopMonitoring,
  ]);

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    // Bloquear envio si el chat est pausado por bajo consenso
    if (isPaused) {
      toast({
        variant: "destructive",
        title: "Chat pausado",
        description:
          verification?.pauseReason ||
          "El chat está pausado por bajo consenso. Por favor, espera a que mejore el consenso antes de enviar mensajes.",
      });
      return;
    }

    // Ronda 9 (stream A, punto 4): si el remitente O el destinatario
    // es una cuenta anónima, no hay chat ni media hasta que el otro
    // lado acepte la amistad. Aplica siempre (no depende del toggle
    // de privacidad) y solo en hilos privados; las salas públicas
    // siempre permiten. El destinatario anónimo se resuelve en el
    // registro local demo; fuera de demo, sin registro, no se bloquea
    // por falta de datos (no hay falsos bloqueos).
    // Ronda 12 (stream A, punto 1): el gate comparaba la amistad con
    // el id de SALA ("3"), no con el id del PERFIL del interlocutor:
    // la amistad aceptada se guarda con ids canónicos de perfil (la
    // pareja es 48bb1f12-…), así que `areFriendsSync(anónimo, "3")`
    // siempre era false y el envío fallaba con "Sin permisos" aunque
    // /chat/3 mostrara "✓ Amigos" (ese botón SÍ usa el id de perfil
    // resuelto, ronda 11 stream C). Es el mismo puente
    // (`resolveChatPartnerProfileId`) que ya usan el estado de acceso
    // a fotos y los botones de este hilo; el nombre va como 4º
    // argumento para el fallback de la amistad semilla.
    if (selectedChat.roomType === "private") {
      const partnerProfileId = resolveChatPartnerProfileId(
        String(selectedChat.id),
      );
      const senderIsAnonymous =
        isAnonymousDemoProfile(user) ||
        findLocalDemoAccountById(user?.id ?? "")?.isAnonymous === true;
      const recipientIsAnonymous =
        findLocalDemoAccountById(partnerProfileId)?.isAnonymous === true;
      if (senderIsAnonymous || recipientIsAnonymous) {
        const friends = areFriendsSync(
          user?.id ?? "",
          partnerProfileId,
          undefined,
          selectedChat.name,
        );
        const limit = canSendMessageTo({
          recipientPrivacy: null,
          senderIsVerified: false,
          senderIsAnonymous,
          recipientIsAnonymous,
          areFriends: friends,
        });
        if (!limit.allowed) {
          toast({
            title: "Sin permisos",
            description: limit.reason,
          });
          return;
        }
      }
    }

    // Enforcement del toggle "Limitar el envío de mensajes" del
    // destinatario (antes: mockPrivacySettings, siempre "everyone").
    // Solo aplica a hilos privados; las salas públicas siempre permiten.
    // Sin datos de privacidad del destinatario se permite (sin falsos
    // bloqueos). El remitente se considera verificado solo si su perfil
    // lo indica (el usuario demo es verificado).
    // En demo la privacidad vive en localStorage: lectura síncrona. El
    // loader async hace un round-trip a Supabase en cada envío y el
    // primer toque parecía no hacer nada mientras esperaba la red.
    if (features.messagingPrivacy && selectedChat.roomType === "private") {
      const recipientPrivacy = isProduction
        ? await loadRecipientPrivacy(
            selectedChat.id.toString(),
            selectedChat.name.includes("&") ? "couple" : "single",
          )
        : readRecipientPrivacySync(
            selectedChat.id.toString(),
            selectedChat.name.includes("&") ? "couple" : "single",
          );
      const limit = canSendMessageTo({
        recipientPrivacy,
        senderIsVerified: Boolean(
          (user as { is_verified?: boolean } | null | undefined)?.is_verified,
        ),
      });
      if (!limit.allowed) {
        toast({
          title: "Sin permisos",
          description: limit.reason,
        });
        return;
      }
    }

    // Usar datos reales en produccin, mock en demo
    if (isProduction) {
      sendRealMessage(newMessage).catch((err) => {
        logger.error("Error en sendRealMessage:", { error: err });
      });
      return;
    }

    // Lgica para modo demo
    // Un hilo con historial no se bloquea por falta de invitación: si ya
    // hay conversación, el usuario es participante (mismo flujo en single
    // y en pareja; el bloqueo solo aplica a hilos privados sin historial).
    if (
      selectedChat.isPrivate &&
      !hasChatAccess[selectedChat.id] &&
      !threadHasHistory(selectedChat)
    ) {
      toast({
        title: "Acceso Denegado",
        description:
          "No tienes acceso a este chat privado. Necesitas una invitación aceptada.",
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

    // Persistir el mensaje enviado (demo): sobrevive a navegar y volver.
    // La vista previa del hilo se actualiza con el mismo mensaje.
    const persisted = [
      ...readPersistedChatMessages(selectedChat.id.toString()),
      message,
    ];
    writePersistedChatMessages(selectedChat.id.toString(), persisted);
    setLastMessageByChat((prev) => ({
      ...prev,
      [selectedChat.id]: message.content,
    }));

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    setShowEmojiPicker(false);
    setShowFileUpload(false);
    setShowVoiceRecorder(false);
  };

  // Galería privada del hilo: la abre/cierra de verdad. Antes el botón
  // "Galería" disparaba un desbloqueo silencioso (sin efecto en demo) y un
  // toast que afirmaba mostrar la galería sin mostrar nada; el botón
  // "Privada" solo mostraba ese mismo toast. En salas públicas no hay
  // galería privada: respuesta honesta en vez de no hacer nada.
  const togglePrivateGallery = () => {
    if (!selectedChat) return;
    if (selectedChat.roomType !== "private") {
      toast({
        title: "Sin galería privada",
        description:
          "Las salas públicas no tienen galería privada. Usa el chat privado de un match.",
      });
      return;
    }
    setShowPrivateGallery((v) => !v);
  };

  // Videollamada con el hilo seleccionado (o lobby si no hay hilo):
  // gate del toggle "Chat de video" del destinatario. Antes este
  // botón solo existía en la cabecera de la LISTA; dentro de la
  // conversación no había forma de iniciar video. Lo usan el botón
  // de la lista y el nuevo botón del header del hilo. En demo la
  // privacidad se lee síncrona de localStorage (sin round-trip a
  // Supabase en cada toque). El flujo real de videollamada (WebRTC)
  // no existe aún: el gate queda listo para cuando exista.
  const handleVideoCall = async () => {
    // Si hay un hilo privado seleccionado, la llamada es con ese
    // perfil. Estar dentro del hilo ya implica match (en producción
    // verifyMatch lo exige; en demo el acceso está concedido), por
    // eso hasMatch: true. Sin hilo seleccionado se abre el lobby.
    if (selectedChat?.roomType === "private") {
      const recipientPrivacy = isProduction
        ? await loadRecipientPrivacy(
            selectedChat.id.toString(),
            selectedChat.name.includes("&") ? "couple" : "single",
          )
        : readRecipientPrivacySync(
            selectedChat.id.toString(),
            selectedChat.name.includes("&") ? "couple" : "single",
          );
      const call = canStartVideoCall({
        recipientPrivacy,
        hasMatch: true,
      });
      if (!call.allowed) {
        toast({
          title: "Videollamada no disponible",
          description: call.reason,
        });
        return;
      }
    }
    navigate("/video-chat");
  };

  return (
    // embedded: dentro del dock flotante (ChatFab) el alto es el del dock
    // (420px); con h-screen el hilo se desbordaba y se solapaba/recortaba.
    <div
      className={`flex flex-col ${embedded ? "h-full" : "h-screen"} bg-linear-to-br from-purple-100 via-violet-50 to-blue-100 dark:from-purple-900 dark:via-purple-800 dark:to-blue-900 relative overflow-hidden`}
    >
      <DecorativeHearts />

      {/* Background decorativo uniforme: ABSOLUTE, no `fixed` (ronda 7,
          punto 6): `fixed inset-0` escapaba del contenedor del Chat y
          pintaba sobre TODA la página, incluido el encabezado propio
          de /chat-intimo ("Chat Íntimo" / "Cerrar" quedaban invisibles
          y sin clic bajo el degradado opaco). La raíz es `relative`,
          así que `absolute inset-0` cubre exactamente el Chat: el
          cuerpo del dock (420 px), la página /chat (h-screen) o el
          área de contenido de /chat-intimo (h-full). */}
      <div className="absolute inset-0 z-0 bg-linear-to-br from-purple-100 via-violet-50 to-blue-100 dark:from-purple-900 dark:via-purple-800 dark:to-blue-900">
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-violet-500/10 to-blue-500/10 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-blue-900/20"></div>
      </div>

      <div
        className={`relative z-10 flex ${embedded ? "h-full" : "h-screen"} ${hasActiveSession ? "pt-4" : "pt-16"} ${hasActiveSession ? "pb-4" : "pb-20"}`}
      >
        {/* Chat List Sidebar: en móvil es UN solo panel — lista O hilo,
            nunca los dos partidos. Con hilo abierto la lista se oculta. */}
        <div
          className={`${selectedChat ? "hidden sm:flex" : "flex"} w-full sm:w-80 shrink-0 bg-white/80 dark:bg-transparent dark:bg-linear-to-br dark:from-purple-900/40 dark:via-purple-800/40 dark:to-blue-900/40 backdrop-blur-sm border-r border-slate-200 dark:border-white/10 flex-col`}
        >
          <div className="p-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                // Visible siempre (antes sm:hidden): sin hilo es la salida
                // de la lista hacia el feed; en el hilo manda el botón del
                // header del hilo.
                className="text-slate-700 hover:bg-slate-900/10 dark:text-white dark:hover:bg-white/20 p-2"
                aria-label="Volver"
                onClick={() => {
                  // Dentro de un hilo: volver a la LISTA de conversaciones,
                  // no a /feed. Solo sin hilo abierto se sale al feed.
                  if (selectedChat) setSelectedChat(null);
                  else navigate("/feed");
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  Conversaciones
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10"
                    aria-label="Videollamada"
                    title="Videollamada"
                    onClick={handleVideoCall}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10"
                    aria-label="Más opciones"
                    title="Más opciones"
                    onClick={() =>
                      toast({
                        title: "Opciones del chat",
                        description:
                          "Más opciones (silenciar, archivar, bloquear) próximamente.",
                      })
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs para Private/Public */}
            <div className="flex gap-2 bg-white/70 dark:bg-transparent dark:bg-linear-to-r dark:from-purple-900/30 dark:to-blue-900/30 backdrop-blur-sm rounded-lg p-1 border border-purple-300/60 dark:border-purple-400/20">
              <Button
                variant={activeTab === "private" ? "default" : "ghost"}
                size="sm"
                className={`flex-1 flex items-center gap-2 transition-all duration-200 ${
                  activeTab === "private"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
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
                {/* Badge = nº real de hilos privados (antes sumaba los no
                    leídos: decía 3 y la lista muestra 4 hilos). */}
                {privateChats.length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {privateChats.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === "public" ? "default" : "ghost"}
                size="sm"
                className={`flex-1 flex items-center gap-2 transition-all duration-200 ${
                  activeTab === "public"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
                }`}
                onClick={() => {
                  setTabError(null);
                  setActiveTab("public");
                  setSelectedChat(null); // Limpiar chat seleccionado al cambiar tab
                  logger.info("Cambiando a tab público");
                }}
              >
                <Globe className="h-4 w-4" />
                Público
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
                <p className="text-red-700 dark:text-red-200 text-sm">
                  {tabError}
                </p>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === "private" && (
              <div className="mt-4">
                <div className="text-slate-900 dark:text-white font-semibold text-sm mb-3 px-2 dark:drop-shadow-lg">
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
                          ? "bg-purple-100 border border-purple-300 dark:bg-white/20 dark:border-white/30"
                          : "hover:bg-slate-900/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={chat.image}
                            alt={chat.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-white/20"
                          />
                          {chat.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-black/50"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                              {chat.name}
                              <Lock className="h-3 w-3 text-purple-600 dark:text-purple-300" />
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-white/90 font-medium">
                              {chat.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-white/90 truncate font-medium">
                            {previewFor(chat)}
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
                <div className="text-slate-900 dark:text-white font-semibold text-sm mb-3 px-2 dark:drop-shadow-lg">
                  Salas públicas de la comunidad
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
                          ? "bg-purple-100 border border-purple-300 dark:bg-white/20 dark:border-white/30"
                          : "hover:bg-slate-900/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <PublicRoomAvatar
                            chat={chat}
                            sizeClass="w-12 h-12"
                            textClass="text-lg"
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-black/50"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-2">
                              {chat.name}
                              <Globe className="h-3 w-3 text-green-600 dark:text-green-300" />
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-white/90 font-medium">
                              {chat.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-white/90 truncate font-medium">
                            {previewFor(chat)}
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
          // min-w-0: sin él, el panel no encoge por debajo del ancho de su
          // contenido y dentro del dock flotante (28-42rem) el texto de la
          // derecha ("Selecciona una conversación") quedaba recortado.
          className={`${selectedChat ? "block" : "hidden md:block"} flex-1 min-w-0 flex flex-col bg-white/60 dark:bg-transparent dark:bg-linear-to-br dark:from-purple-900/20 dark:via-purple-800/20 dark:to-blue-900/20 backdrop-blur-sm`}
        >
          {selectedChat ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-transparent dark:bg-linear-to-r dark:from-purple-900/30 dark:via-purple-800/30 dark:to-blue-900/30">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    // Visible siempre (antes md:hidden): en el hilo vuelve
                    // a la LISTA de conversaciones, también en escritorio.
                    className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10 mr-2"
                    aria-label="Volver a la lista de chats"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {selectedChat.roomType === "public" ? (
                    <PublicRoomAvatar
                      chat={selectedChat}
                      sizeClass="w-10 h-10"
                      textClass="text-base"
                    />
                  ) : (
                    <img
                      src={selectedChat.image}
                      alt={selectedChat.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-white/20"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {selectedChat.name}
                      </h3>
                      {selectedChat.roomType === "private" ? (
                        <Lock className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                      ) : (
                        <Globe className="h-4 w-4 text-green-600 dark:text-green-300" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-white/90 dark:drop-shadow-md">
                      {selectedChat.roomType === "public"
                        ? `Sala pública ${PUBLIC_ROOM_MEMBERS[selectedChat.id] ?? 24} miembros activos`
                        : selectedChat.isOnline
                          ? "En línea"
                          : `Última vez ${selectedChat.timestamp}`}
                    </p>
                  </div>
                  {/* Videollamada DENTRO de la conversación: antes el
                      botón de video solo existía en la cabecera de la
                      lista; en el hilo no había forma de llamar. Mismo
                      gate (toggle "Chat de video" del destinatario). */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10 shrink-0"
                    aria-label="Videollamada"
                    title="Videollamada"
                    onClick={handleVideoCall}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Solicitudes de amistad y de ver fotos (punto 4): solo en
                  chats privados (no en salas públicas). Son píldoras con
                  texto, por eso van en una fila bajo el encabezado y no
                  dentro de él: en móvil no caben junto al nombre y al
                  botón de video. */}
              {selectedChat.roomType === "private" && user?.id && (
                <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-2">
                  {/* Ronda 11, stream C (iv): el botón recibía el id de
                      SALA ("1"-"4"), no el del perfil del interlocutor:
                      `getFriendStatus` comparaba la amistad con "3" y
                      nunca casaba con el par guardado con el id del
                      perfil ("demo-couple-456"), así que el chat con
                      Carmen & Roberto mostraba "Enviar solicitud de
                      amistad" aunque Sofía ya los tiene de amigos. Se
                      pasa el id de perfil resuelto, igual que ya hace
                      `PhotoAccessRequestButton` justo debajo: con
                      amistad aceptada el botón muestra "Amigos ✓" y
                      el CTA desaparece. */}
                  <FriendRequestButton
                    profileId={resolveChatPartnerProfileId(
                      String(selectedChat.id),
                    )}
                    profileName={selectedChat.name}
                    viewerId={String(user.id)}
                    viewerName={viewerName}
                    isOwnProfile={String(selectedChat.id) === String(user.id)}
                    isDemo={!isProduction}
                  />
                  {/* Solicitud de ver fotos (punto 7): si el estado
                      persistido es "pending", se muestra la píldora
                      "Solicitud de fotos enviada" (misma que muestra
                      el botón tras enviar) en vez del botón; si es
                      "accepted" no se muestra nada (ya hay acceso, el
                      botón no debe ofrecerse). En "none"/"declined" o
                      mientras se lee (null), va el botón, que al
                      enviar muestra su propia píldora de enviado. */}
                  {photoAccessStatus === "pending" ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-white/10 dark:text-white/80 dark:border-white/25 px-4 py-2.5 text-sm"
                      title="Solicitud para ver las fotos enviada, pendiente de respuesta"
                    >
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      Solicitud de fotos enviada
                    </span>
                  ) : photoAccessStatus === "accepted" ? null : (
                    <PhotoAccessRequestButton
                      profileId={resolveChatPartnerProfileId(
                        String(selectedChat.id),
                      )}
                      profileName={selectedChat.name}
                      viewerId={String(user.id)}
                      isOwnProfile={String(selectedChat.id) === String(user.id)}
                      isDemo={!isProduction}
                      // Ronda 7, punto 12: al enviar, el padre pasa a
                      // "pending" de inmediato (confirmación visible
                      // aunque el botón se remonte); el estado
                      // persistido se re-lee al reabrir el hilo.
                      onSent={() => setPhotoAccessStatus("pending")}
                    />
                  )}
                </div>
              )}

              {/* Indicador de consentimiento */}
              {isProduction && selectedChat && user?.id && (
                <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-transparent dark:bg-linear-to-r dark:from-purple-900/30 dark:via-purple-800/30 dark:to-blue-900/30">
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

              {/* Galería privada: colapsada por defecto; la abren los
                  botones Galería / Privada del compositor. Acotada
                  (max-h + scroll interno) para que nunca empuje ni tape
                  los mensajes del hilo. */}
              {selectedChat?.roomType === "private" && showPrivateGallery && (
                <div
                  ref={galleryRef}
                  className="shrink-0 max-h-[38%] overflow-y-auto px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-purple-100/70 dark:bg-purple-950/40"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      Galería privada de {selectedChat.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 h-7 px-2 shrink-0"
                      aria-label="Cerrar galería"
                      onClick={() => setShowPrivateGallery(false)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cerrar
                    </Button>
                  </div>
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
                </div>
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
                              : "bg-white text-slate-900 shadow-md border border-slate-200 dark:bg-linear-to-r dark:from-blue-500/95 dark:to-purple-600/95 dark:text-white dark:border-blue-400/50 backdrop-blur-sm"
                          }`}
                        >
                          <p
                            className={`text-xs sm:text-sm leading-relaxed wrap-break-word whitespace-pre-wrap overflow-wrap-anywhere hyphens-auto font-medium ${message.sender_id === safeGetItem<string>("user_id", { validate: false, defaultValue: "" }) ? "text-white drop-shadow-md" : "text-slate-900 dark:text-white dark:drop-shadow-md"} chat-message-text`}
                          >
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
                                : "text-slate-500 dark:text-white/90 dark:drop-shadow-sm"
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
                              : "bg-white text-slate-900 shadow-md border border-slate-200 dark:bg-linear-to-r dark:from-blue-500/95 dark:to-purple-600/95 dark:text-white dark:border-blue-400/50 backdrop-blur-sm"
                          }`}
                        >
                          <p
                            className={`text-xs sm:text-sm leading-relaxed wrap-break-word whitespace-pre-wrap overflow-wrap-anywhere hyphens-auto font-medium ${String(message.sender_id) === "0" ? "text-white drop-shadow-md" : "text-slate-900 dark:text-white dark:drop-shadow-md"} chat-message-text word-break-break-all`}
                          >
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 font-medium ${
                              String(message.sender_id) === "0"
                                ? "text-purple-100 drop-shadow-sm"
                                : "text-slate-500 dark:text-white/90 dark:drop-shadow-sm"
                            }`}
                          >
                            {/* Igual que la rama de mensajes reales: hora
                              local HH:MM, no el ISO crudo. */}
                            {new Date(message.created_at).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>

              {/* Input para enviar mensajes */}
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/70 dark:bg-transparent dark:bg-linear-to-r dark:from-purple-900/30 dark:via-purple-800/30 dark:to-blue-900/30 chat-input relative">
                {/* El bloqueo solo aplica a hilos privados sin historial ni
                    acceso: con historial el usuario ya es participante y el
                    compositor debe aparecer (igual en single y en pareja). */}
                {selectedChat?.isPrivate &&
                !hasChatAccess[selectedChat.id] &&
                !threadHasHistory(selectedChat) ? (
                  <div className="text-center space-y-4 bg-white dark:bg-transparent dark:bg-linear-to-br dark:from-purple-900/50 dark:via-purple-800/50 dark:to-blue-900/50 rounded-lg p-6 border border-slate-200 dark:border-white/20">
                    <div className="flex items-center justify-center text-slate-900 dark:text-white mb-3">
                      <Lock className="h-6 w-6 mr-2" />
                      <span className="font-semibold text-lg">
                        Chat privado bloqueado
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-white/90 mb-6 leading-relaxed max-w-sm mx-auto">
                      Necesitas una invitación aceptada para chatear con{" "}
                      {selectedChat?.name}. Puedes enviar una invitación o
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
                        Aceptar invitación
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
                        className="border-red-300/50 text-red-600 hover:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Paneles del compositor: se abren sobre el input */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-2 mb-2 z-20 max-w-[calc(100vw-2rem)]">
                        <EmojiPicker
                          onEmojiSelect={(emoji) =>
                            setNewMessage((prev) => prev + emoji)
                          }
                          onClose={() => setShowEmojiPicker(false)}
                          className="max-w-[calc(100vw-2rem)]"
                        />
                      </div>
                    )}
                    {showFileUpload && (
                      <div className="absolute bottom-full left-2 mb-2 z-20 max-w-[calc(100vw-2rem)]">
                        <ChatFileUpload
                          onFileSelect={(files) => {
                            setShowFileUpload(false);
                            if (isProduction) {
                              toast({
                                title: "Subida no disponible",
                                description:
                                  "El envío de archivos aún no está conectado en producción.",
                              });
                            } else {
                              toast({
                                title: "Archivos recibidos (demo)",
                                description: `${files.length} archivo(s) seleccionado(s): ${files.map((f) => f.name).join(", ")}. Envío real pendiente.`,
                              });
                            }
                          }}
                          onCancel={() => setShowFileUpload(false)}
                          className="max-w-[calc(100vw-2rem)]"
                        />
                      </div>
                    )}
                    {showVoiceRecorder && (
                      <div className="absolute bottom-full left-2 mb-2 z-20 max-w-[calc(100vw-2rem)]">
                        <VoiceRecorder
                          onAudioReady={(_blob, duration) => {
                            setShowVoiceRecorder(false);
                            toast({
                              title: isProduction
                                ? "Nota de voz no disponible"
                                : "Nota de voz grabada (demo)",
                              description: isProduction
                                ? "El envío de audio aún no está conectado en producción."
                                : `Audio de ${duration}s listo. Envío real pendiente.`,
                            });
                          }}
                          onCancel={() => setShowVoiceRecorder(false)}
                          className="max-w-[calc(100vw-2rem)]"
                        />
                      </div>
                    )}
                    {/* Botones de galería y solicitudes */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        onClick={togglePrivateGallery}
                        aria-expanded={showPrivateGallery}
                        variant="outline"
                        className="flex-1 min-w-0 border-purple-400/50 text-purple-700 hover:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20 text-xs sm:text-sm py-2 px-2 sm:px-3"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        <span className="truncate">Galería</span>
                      </Button>
                      <Button
                        onClick={() => navigate("/requests")}
                        variant="outline"
                        className="flex-1 min-w-0 border-purple-400/50 text-purple-700 hover:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20 text-xs sm:text-sm py-2 px-2 sm:px-3"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        <span className="truncate">Solicitudes</span>
                      </Button>
                      <Button
                        onClick={togglePrivateGallery}
                        aria-expanded={showPrivateGallery}
                        variant="outline"
                        className="flex-1 border-green-400/50 text-green-700 hover:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20 text-xs py-2"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {selectedChat?.roomType === "private"
                          ? "Privada"
                          : "Pública"}
                      </Button>
                    </div>

                    {/* Barra de herramientas del compositor: emoji, adjuntar, audio */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Emojis"
                        title="Emojis"
                        disabled={isPaused}
                        className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => {
                          setShowFileUpload(false);
                          setShowVoiceRecorder(false);
                          setShowEmojiPicker((v) => !v);
                        }}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Adjuntar archivo"
                        title="Adjuntar archivo"
                        disabled={isPaused}
                        className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => {
                          setShowEmojiPicker(false);
                          setShowVoiceRecorder(false);
                          setShowFileUpload((v) => !v);
                        }}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Grabar audio"
                        title="Grabar audio"
                        disabled={isPaused}
                        className="text-slate-700 hover:bg-slate-900/5 dark:text-white dark:hover:bg-white/10 h-8 w-8 p-0"
                        onClick={() => {
                          setShowEmojiPicker(false);
                          setShowFileUpload(false);
                          setShowVoiceRecorder((v) => !v);
                        }}
                      >
                        <Mic className="h-4 w-4" />
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
                        className="flex-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-400 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder-white/50 dark:focus:border-white/40 text-sm sm:text-base"
                        disabled={isPaused}
                      />
                      <Button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isPaused}
                        gradient={true}
                        className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-3 sm:px-4 py-2"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {isPaused && (
                      <p className="text-xs text-slate-500 dark:text-white/70 mt-2 text-center">
                        El chat está pausado por bajo consenso. El envío de
                        mensajes está bloqueado.
                      </p>
                    )}
                  </div>
                )}
                {selectedChat?.roomType === "public" && (
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-2 px-1">
                    Los mensajes en salas públicas son visibles para todos los
                    miembros
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-900 dark:text-white">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-purple-500 dark:text-white opacity-80 dark:drop-shadow-lg" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white dark:drop-shadow-md">
                  Selecciona una conversación
                </h3>
                <p className="mb-4 text-slate-600 dark:text-white/90 dark:drop-shadow-md">
                  {activeTab === "private"
                    ? "Elige un chat privado para conversar de forma segura"
                    : "Únete a una sala pública para conocer la comunidad"}
                </p>
                <div className="flex items-center justify-center text-sm space-x-4">
                  <div className="flex items-center text-slate-600 dark:text-white/90">
                    <Lock className="h-4 w-4 mr-1 text-purple-600 dark:text-purple-300" />
                    <span className="dark:drop-shadow-md">
                      Chats privados encriptados
                    </span>
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-white/90">
                    <Globe className="h-4 w-4 mr-1 text-green-600 dark:text-green-300" />
                    <span className="dark:drop-shadow-md">
                      Salas públicas moderadas
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
