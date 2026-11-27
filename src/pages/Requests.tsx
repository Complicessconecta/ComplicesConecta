import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { Card } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  GalleryHorizontal,
  MessageSquare,
  MailQuestion,
  Send,
} from "lucide-react";
import { getAvatarInitials } from "@/lib/avatarFallback";
import { useFeatures } from "@/hooks/useFeatures";
import { invitationService, type Invitation } from "@/lib/invitations";
import { useAuth } from "@/features/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { usePersistedState } from "@/hooks/usePersistedState";
import { openIntimateChat } from "@/lib/intimateChat";
import {
  FRIEND_REQUESTS_CHANGED_EVENT,
  listIncomingRequestsSync,
  listSentRequestsSync,
  respondFriendRequest,
  resolveDemoDisplayName,
} from "@/lib/friends";
import { findLocalDemoAccountById } from "@/lib/demo-registration";
import { generateDemoProfiles, demoProfiles } from "@/demo/demoData";
import { getSocialDemoData } from "@/demo/socialDemoData";

/**
 * Id de destino de una solicitud local → nombre visible (ronda 7,
 * punto 12): las solicitudes de ver fotos se guardan con el id del
 * perfil o de la sala de chat ("1"-"4", "demo-couple-456", UUID...),
 * y /requests debe mostrar a quién se le envió, no el id crudo.
 */
const CHAT_ROOM_NAMES: Record<string, string> = {
  "1": "Anabella & Julio",
  "2": "Sofia",
  "3": "Carmen & Roberto",
  "4": "Raúl",
  "demo-couple-456": "Carmen & Roberto",
};

function resolveRequestTargetName(toId: string): string {
  if (CHAT_ROOM_NAMES[toId]) return CHAT_ROOM_NAMES[toId] as string;
  const roster = generateDemoProfiles(20).find((p) => p.id === toId);
  if (roster) return roster.name;
  const legacy = (demoProfiles as unknown as Record<string, unknown>[]).find(
    (p) => String(p.id) === toId,
  );
  if (legacy) {
    const name =
      (typeof legacy.display_name === "string" && legacy.display_name) ||
      [legacy.first_name, legacy.last_name]
        .filter((v) => typeof v === "string" && v)
        .join(" ");
    if (name) return name;
  }
  const social = getSocialDemoData(toId);
  if (social.displayName && social.displayName !== toId) {
    return social.displayName;
  }
  // Cuentas demo locales (TestR7, anonr8test, …) y canónicas: el
  // roster y los datos sociales no las conocen (ronda 9, stream D).
  // Ronda 12, stream C: versión SEGURA (nunca un UUID crudo: una
  // cuenta borrada u huérfana se etiqueta, no se enseña su id).
  return resolveDemoDisplayName(toId);
}

/**
 * Avatar de una tarjeta de solicitud (ronda 10, stream D).
 *
 * El nombre visible puede ser un id crudo sin resolver (UUID o id
 * numérico legacy: `resolveDemoProfileName` lo devuelve tal cual por
 * diseño). Ese texto NUNCA va dentro del círculo: si no hay iniciales
 * de un nombre de persona, el avatar es el icono de persona (antes el
 * test de verificación de la ronda 9 vio un glifo "101" en una tarjeta
 * de /requests en vez del icono).
 */
function RequestAvatar({
  displayName,
}: {
  displayName: string | null | undefined;
}) {
  const initials = getAvatarInitials(displayName);
  return (
    <div
      data-testid="request-avatar"
      aria-hidden="true"
      className="w-10 h-10 rounded-full bg-purple-500/20 dark:bg-purple-500/30 border border-purple-400/30 flex items-center justify-center shrink-0"
    >
      {initials ? (
        <span className="text-sm font-semibold text-purple-800 dark:text-purple-100">
          {initials}
        </span>
      ) : (
        <User className="h-5 w-5 text-purple-800 dark:text-purple-100" />
      )}
    </div>
  );
}

const Requests = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { features } = useFeatures();
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>(
    [],
  );
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  // Migracin localStorage ? usePersistedState
  const [demoAuth, _setDemoAuth] = usePersistedState(
    "demo_authenticated",
    "false",
  );
  const [demoUser, _setDemoUser] = usePersistedState<any>("demo_user", null);

  const currentUserId = useMemo(() => {
    // demoAuth viene de usePersistedState, que hace JSON.parse: el flag
    // guardado como "true" llega como boolean true, no como string.
    const isDemoMode = String(demoAuth) === "true" && demoUser;
    if (isDemoMode) {
      try {
        const parsedDemoUser =
          typeof demoUser === "string" ? JSON.parse(demoUser) : demoUser;
        return parsedDemoUser?.id || "demo-user-1";
      } catch {
        return "demo-user-1";
      }
    }
    return user?.id ?? null;
  }, [demoAuth, demoUser, user]);

  // Decisiones demo persistidas: antes loadDemoInvitations reconstruía
  // la lista estática con "pending" en cada carga y Aceptar solo vivía
  // en memoria (la tarjeta volvía a "Pendiente" al recargar el efecto
  // o al navegar y volver).
  const DEMO_DECISIONS_KEY = "demo_invitation_status";
  const loadDemoDecisions = (): Record<string, Invitation["status"]> => {
    try {
      const raw = window.localStorage.getItem(DEMO_DECISIONS_KEY);
      return raw
        ? (JSON.parse(raw) as Record<string, Invitation["status"]>)
        : {};
    } catch {
      return {};
    }
  };
  const saveDemoDecision = (id: string, status: Invitation["status"]) => {
    try {
      const map = loadDemoDecisions();
      map[id] = status;
      window.localStorage.setItem(DEMO_DECISIONS_KEY, JSON.stringify(map));
    } catch {
      // Sin localStorage la decisión solo vive en memoria.
    }
  };

  const loadDemoInvitations = () => {
    const decisions = loadDemoDecisions();
    const applyDecision = (inv: Invitation): Invitation =>
      decisions[inv.id]
        ? {
            ...inv,
            status: decisions[inv.id] as Invitation["status"],
            decided_at:
              decisions[inv.id] !== "pending"
                ? (inv.decided_at ?? new Date().toISOString())
                : null,
          }
        : inv;
    // Solicitudes demo recibidas
    const demoReceived: Invitation[] = [
      {
        id: "demo-inv-1",
        from_profile: "Anabella & Julio",
        to_profile: "Sofía",
        type: "chat",
        status: "pending",
        message:
          "¡Hola! Nos encantaría conocerte mejor. ¿Te gustaría chatear con nosotros?",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        decided_at: null,
      },
      {
        id: "demo-inv-2",
        from_profile: "Carmen & Roberto",
        to_profile: "Sofía",
        type: "gallery",
        status: "pending",
        message:
          "Hola guapa, nos gusta mucho tu perfil. ¿Nos permites ver tu galería privada?",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
        decided_at: null,
      },
      {
        id: "demo-inv-3",
        from_profile: "Raúl",
        to_profile: "Sofía",
        type: "profile",
        status: "accepted",
        message: "¿Qué tal si nos conocemos mejor?",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 da atrás
        decided_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Solicitudes demo enviadas
    const demoSent: Invitation[] = [
      {
        id: "demo-sent-1",
        from_profile: "Sofía",
        to_profile: "Miguel & Laura",
        type: "chat",
        status: "accepted",
        message: "Hola, me encanta su perfil. ¿Les gustaría platicar?",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
        decided_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "demo-sent-2",
        from_profile: "Sofía",
        to_profile: "Carlos",
        type: "profile",
        status: "pending",
        // Ronda 21 (stream C): era "¿Te gustaría conocernos?" (plural
        // de pareja) en una invitación de Sofía (single) a Carlos
        // (single). En singular.
        message: "Hola, me pareces muy interesante. ¿Te gustaría conocerme?",
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
        decided_at: null,
      },
    ];

    // Ronda 7, punto 12: las solicitudes REALES enviadas en esta
    // sesión (amistad y ver fotos, almacén local `friend_requests_demo`
    // de @/lib/friends) se suman a las enviadas. Antes solo se
    // mostraba la lista fija de arriba y una solicitud de ver fotos
    // recién enviada no dejaba ningún rastro en Enviadas.
    const senderName = (() => {
      try {
        const raw = window.localStorage.getItem("demo_user");
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const name =
            (typeof parsed.display_name === "string" && parsed.display_name) ||
            (typeof parsed.name === "string" && parsed.name) ||
            (typeof parsed.nickname === "string" && parsed.nickname);
          if (name) return name;
        }
      } catch {
        // demo_user corrupto: seguir con el resto de fuentes.
      }
      return "Tú";
    })();
    const localSent: Invitation[] = listSentRequestsSync(
      currentUserId ?? "",
    ).map((req) => ({
      id: req.id,
      from_profile: senderName,
      to_profile: resolveRequestTargetName(req.toId),
      type: req.kind === "photo_access" ? "gallery" : "profile",
      status: req.status,
      message:
        req.message ??
        (req.kind === "photo_access"
          ? "Solicitud para ver la galería privada"
          : null),
      created_at: req.createdAt,
      // Sin fecha de decisión guardada en el almacén local: null en
      // vez de inventar una (la tarjeta muestra el estado igual).
      decided_at: null,
    }));
    const mergedSent = [
      ...demoSent,
      ...localSent.filter((inv) => !demoSent.some((d) => d.id === inv.id)),
    ];

    // Ronda 9, stream D: las solicitudes REALES recibidas en esta
    // sesión (amistad y ver fotos, almacén local `friend_requests_demo`
    // de @/lib/friends) se suman a las recibidas. Antes solo se
    // mostraba la lista fija de arriba (3 invitaciones a Sofía) y una
    // solicitud enviada a esta cuenta —p. ej. la del perfil anónimo a
    // la pareja— nunca llegaba a la bandeja: no se podía aceptar y el
    // gate de perfil privado no se levantaba (test ronda 8).
    // Ronda 10, stream D: `listIncomingRequestsSync` filtra por
    // defecto solo `kind="friendship"`, así que una solicitud de
    // acceso a fotos nunca llegaba a Recibidas aunque el mapeo de
    // abajo ya la contemplaba (`type: "gallery"`). Se suman ambos
    // kinds (el lado Enviadas ya los traía todos: `listSentRequestsSync`
    // sin kind no filtra). Sin esto, la solicitud de ver fotos solo
    // existía en el gestor del perfil y no se podía responder aquí.
    // Ronda 12 (stream A, punto 2): `includeDecided: true` — la
    // bandeja se reconstruía SOLO con pendientes, así que una
    // solicitud aceptada desaparecía de Recibidas al recargar (y la
    // cuenta atrás de la concesión seguía viva: bandeja y galería en
    // desacuerdo). El almacén es la fuente de la decisión: aceptadas
    // y declinadas quedan visibles con su estado real y persistente.
    const localReceived: Invitation[] = [
      ...listIncomingRequestsSync(currentUserId ?? "", "friendship", {
        includeDecided: true,
      }),
      ...listIncomingRequestsSync(currentUserId ?? "", "photo_access", {
        includeDecided: true,
      }),
    ].map((req) => ({
      id: req.id,
      from_profile: resolveDemoDisplayName(req.fromId),
      // Ronda 10 (stream A, punto A2): insignia "Anónimo" al
      // remitente anónimo (el registro local sabe si lo es).
      fromIsAnonymous:
        findLocalDemoAccountById(req.fromId)?.isAnonymous === true,
      to_profile: senderName,
      type: req.kind === "photo_access" ? "gallery" : "profile",
      status: req.status,
      message:
        req.message ??
        (req.kind === "photo_access"
          ? "Solicitud para ver la galería privada"
          : "Solicitud de amistad"),
      created_at: req.createdAt,
      decided_at: req.respondedAt ?? null,
    }));
    const mergedReceived = [
      ...demoReceived,
      ...localReceived.filter(
        (inv) => !demoReceived.some((d) => d.id === inv.id),
      ),
    ];

    setReceivedInvitations(mergedReceived.map(applyDecision));
    setSentInvitations(mergedSent.map(applyDecision));
    logger.info("✅ Solicitudes demo cargadas:", {
      received: mergedReceived.length,
      sent: mergedSent.length,
    });
  };

  // demoAuth es boolean true tras JSON.parse (ver arriba): no comparar con "true" a secas.
  const isDemoMode = String(demoAuth) === "true" && demoUser;

  const loadInvitations = useCallback(async () => {
    if (!currentUserId) return;

    // Si es modo demo, no hacer llamadías reales
    if (isDemoMode) {
      loadDemoInvitations();
      return;
    }

    const { received, sent } =
      await invitationService.getInvitations(currentUserId);
    setReceivedInvitations(received);
    setSentInvitations(sent);
  }, [currentUserId, isDemoMode]);

  useEffect(() => {
    if (currentUserId) {
      loadInvitations();
    }
  }, [currentUserId, loadInvitations]);

  // Ronda 14 (stream F, F3): la bandeja cargaba una sola vez al montar.
  // Si la solicitud se enviaba desde un perfil de la misma sesión, la
  // bandeja no se enteraba hasta recargar. Ahora se recarga cuando el
  // almacén de solicitudes cambia (evento disparado en cada escritura).
  useEffect(() => {
    const reload = () => {
      void loadInvitations();
    };
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, reload);
    return () =>
      window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, reload);
  }, [loadInvitations]);

  useEffect(() => {
    if (isDemoMode) {
      loadDemoInvitations();
      return;
    }

    // Verificar autenticación real - solo redirigir si realmente no está autenticado
    try {
      if (!isAuthenticated()) {
        logger.info("Usuario no autenticado en Requests, redirigiendo a /auth");
        navigate("/auth");
        return;
      }
    } catch (error) {
      logger.error("Error verificando autenticación en Requests:", { error });
      toast({
        title: "Advertencia",
        description:
          "Hubo un problema verificando la autenticación. Si persiste, intenta cerrar y abrir sesión.",
        variant: "destructive",
      });
    }

    if (!user?.id) {
      logger.info("No se pudo obtener userId, redirigiendo a /auth");
      navigate("/auth");
    }
    // NOTA (ronda 9, stream D): `isAuthenticated` NO va en las deps.
    // `useAuth` la recrea en cada render (no es useCallback): listarla
    // hacía re-ejecutar este efecto en cada render y, en modo demo,
    // `loadDemoInvitations()` hace setState → bucle infinito de efectos
    // (en jsdom/act cuelga el test; en navegador quema CPU en /requests).
    // La comprobación de auth sigue corriendo al montar y cuando cambian
    // `isDemoMode` o `user?.id`, que es cuando importa.
  }, [isDemoMode, navigate, toast, user?.id]);

  const handleInvitationAction = async (
    invitationId: string,
    action: "accept" | "decline",
  ) => {
    try {
      // Actualización optimista PRIMERO: la tarjeta cambia de "Pendiente"
      // a aceptada/rechazada de inmediato, también en modo real (antes
      // solo se recargaba la lista tras el servicio y un fallo de
      // persistencia dejaba la tarjeta en "Pendiente" pese al toast).
      const nextStatus =
        action === "accept" ? "accepted" : ("declined" as const);
      setReceivedInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? {
                ...inv,
                status: nextStatus,
                decided_at: new Date().toISOString(),
              }
            : inv,
        ),
      );

      // Si es modo demo, simular la acción
      if (String(demoAuth) === "true") {
        // Ronda 9, stream D: las invitaciones locales (amistad / ver
        // fotos, ids `demo-req-*` / `demo-photo-*`) son solicitudes
        // reales del almacén local: aceptar crea la amistad
        // (`friendships_demo`) y levanta el gate de perfil privado;
        // antes solo se guardaba la decisión en `demo_invitation_status`
        // y la amistad nunca existía. Las 3 fijas (`demo-inv-*`) siguen
        // el camino simulado de siempre.
        if (
          invitationId.startsWith("demo-req-") ||
          invitationId.startsWith("demo-photo-")
        ) {
          const result = await respondFriendRequest(
            invitationId,
            action === "accept" ? "accepted" : "declined",
            true,
          );
          if (!result.ok) {
            setReceivedInvitations((prev) =>
              prev.map((inv) =>
                inv.id === invitationId
                  ? { ...inv, status: "pending", decided_at: null }
                  : inv,
              ),
            );
            toast({
              title: "Error",
              description: result.error ?? "No se pudo procesar la solicitud.",
              variant: "destructive",
            });
            logger.error("Error respondiendo solicitud local en Requests", {
              invitationId,
              error: result.error,
            });
            return;
          }
          toast({
            title: `Invitación ${action === "accept" ? "aceptada" : "rechazada"}`,
            description:
              action === "accept"
                ? "Ahora son amigos y el perfil privado queda visible."
                : "La invitación ha sido rechazada.",
          });
          logger.info("✅ Solicitud local respondida en Requests:", {
            invitationId,
            action,
          });
          return;
        }

        saveDemoDecision(invitationId, nextStatus);

        toast({
          title: `Invitación ${action === "accept" ? "aceptada" : "rechazada"}`,
          description: `La invitación ha sido procesada correctamente (modo demo).`,
        });

        logger.info("✅ Acción demo en invitación:", { invitationId, action });
        return;
      }

      // Modo real
      await invitationService.respondInvitation(invitationId, action);
      toast({
        title: `Invitación ${action === "accept" ? "aceptada" : "rechazada"}`,
        description: `La invitación ha sido procesada correctamente.`,
      });
      loadInvitations(); // Refresh the list
    } catch {
      // Revertir la actualización optimista si el servicio falló.
      setReceivedInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, status: "pending", decided_at: null }
            : inv,
        ),
      );
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getInvitationTypeIcon = (type: Invitation["type"]) => {
    switch (type) {
      case "gallery":
        return <GalleryHorizontal className="h-4 w-4 mr-2" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case "profile":
        return <UserPlus className="h-4 w-4 mr-2" />;
      default:
        return <MailQuestion className="h-4 w-4 mr-2" />;
    }
  };

  const getStatusBadge = (status: Invitation["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="text-yellow-700 border border-yellow-600/50 bg-transparent dark:text-yellow-400 dark:border-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="text-green-700 border border-green-600/50 bg-transparent dark:text-green-400 dark:border-green-400">
            <UserCheck className="h-3 w-3 mr-1" />
            Aceptada
          </Badge>
        );
      case "declined":
        return (
          <Badge className="text-red-700 border border-red-600/50 bg-transparent dark:text-red-400 dark:border-red-400">
            <UserX className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        );
      case "revoked":
        return (
          <Badge className="text-slate-600 border border-slate-400 bg-transparent dark:text-white dark:border-white/40">
            <UserX className="h-3 w-3 mr-1" />
            Revocada
          </Badge>
        );
      default:
        return null;
    }
  };

  const _pendingReceivedCount = receivedInvitations.filter(
    (inv) => inv.status === "pending",
  ).length;
  const _acceptedCount = [...receivedInvitations, ...sentInvitations].filter(
    (inv) => inv.status === "accepted",
  ).length;

  if (!features.requests) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900 flex items-center justify-center">
        <Card className="p-8 text-center bg-card/80 backdrop-blur-sm">
          <UserX className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Función no disponible</h2>
          <p className="text-muted-foreground">
            Las solicitudes de conexion no estn habilitadías en esta version.
          </p>
        </Card>
      </div>
    );
  }

  return (
    // RONDA 7 (punto 3): el hero era un gradiente morado oscuro fijo con
    // texto blanco en ambos temas: en tema claro la página entera se
    // quedaba morada oscura ("Invitaciones" no seguía al tema). Ahora el
    // fondo es claro en claro y el gradiente morado solo vive en `dark:`;
    // título, subtítulo y pestañas siguen al tema. Las tarjetas de
    // invitaciones y los estados vacíos SIGUEN con su cromo morado
    // oscuro propio (fondo oscuro + texto blanco = legible en ambos
    // temas): repintarlas es trabajo aparte, no se finge aquí.
    <div className="min-h-dvh bg-slate-100 dark:bg-linear-to-br dark:from-purple-900 dark:via-purple-800 dark:to-blue-900 relative overflow-x-hidden pb-20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header removido para usuarios demo - solo NavigationLegacy */}

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Invitaciones
            </h1>
            <p className="text-slate-600 dark:text-white/80 text-lg">
              Gestiona tus invitaciones recibidas y enviadas
            </p>
            {_acceptedCount > 0 && (
              <div className="mt-3">
                <Badge className="bg-green-500/15 text-green-800 border border-green-500/50 dark:bg-green-500/20 dark:text-green-100 dark:border-green-400/30">
                  Aceptadas: {_acceptedCount}
                </Badge>
              </div>
            )}
            {/* Entrada al Chat Íntimo: abre el dock "Chat Intimo" de
                MainLayout (mismo chat que el botón de chat, con su
                "Cerrar"). Antes /requests no tenía ninguna entrada y
                /chat-intimo era 404, así que la función no existía en
                la interfaz. */}
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                onClick={openIntimateChat}
                className="bg-linear-to-r from-fuchsia-600 to-purple-600 text-white hover:from-fuchsia-700 hover:to-purple-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat Íntimo
              </Button>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-linear-to-br dark:from-purple-900/40 dark:via-purple-800/30 dark:to-blue-900/40 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/10 p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "received" | "sent")
              }
              className="w-full"
            >
              {/* RONDA 10 (stream B, B2): la lista era translúcida
                  (`bg-slate-900/5 dark:bg-white/10` + blur) y la imagen
                  de fondo se transparentaba por ella: pestañas blancas
                  sobre lavanda en oscuro. Lista SÓLIDA opaca en ambos
                  temas; la activa, blanca sólida en claro y blanca/25
                  sobre pizarra sólida en oscuro. */}
              <TabsList className="grid w-full grid-cols-2 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-lg mb-6">
                {/* Punto 11 (ronda 7): el disparador es `whitespace-nowrap`
                    (tabs.tsx) y llevaba icono + 2 badges en una sola línea:
                    si el contenido superaba el 50% del grid, el badge de
                    pendientes ("🕐 2") se desbordaba sobre la pestaña
                    vecina. `min-w-0 flex-wrap` deja que los badges bajen a
                    una segunda línea en vez de invadir la otra pestaña. */}
                <TabsTrigger
                  value="received"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-white/25 dark:data-[state=active]:text-white text-slate-600 hover:text-slate-900 dark:text-white/75 dark:hover:text-white flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 sm:px-3"
                >
                  <MailQuestion className="h-4 w-4 shrink-0" />
                  Recibidas
                  {receivedInvitations.length > 0 && (
                    <Badge className="bg-red-500 text-white text-xs shrink-0">
                      {receivedInvitations.length}
                    </Badge>
                  )}
                  {_pendingReceivedCount > 0 && (
                    <Badge className="bg-yellow-500/15 text-yellow-800 border border-yellow-500/50 dark:bg-yellow-500/20 dark:text-yellow-100 dark:border-yellow-400/30 text-xs shrink-0 whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {_pendingReceivedCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="sent"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-white/25 dark:data-[state=active]:text-white text-slate-600 hover:text-slate-900 dark:text-white/75 dark:hover:text-white flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 sm:px-3"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  Enviadas
                  {sentInvitations.length > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs shrink-0">
                      {sentInvitations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="received" className="mt-6">
                <div className="space-y-4">
                  {receivedInvitations.length === 0 ? (
                    <Card className="p-8 text-center bg-white dark:bg-purple-950 dark:bg-linear-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-blue-900/30 backdrop-blur-sm border-slate-200 dark:border-white/10">
                      <UserPlus className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-white/50" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No hay invitaciones recibidas
                      </h3>
                      <p className="text-slate-600 dark:text-white/70">
                        Cuando alguien te envie una invitación, aparecer aqui.
                      </p>
                    </Card>
                  ) : (
                    receivedInvitations.map((inv) => (
                      <Card
                        key={inv.id}
                        className="p-4 bg-white dark:bg-purple-950 dark:bg-linear-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-blue-900/30 backdrop-blur-sm border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-start gap-4 card-accessible"
                      >
                        <RequestAvatar displayName={inv.from_profile} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center text-sm text-slate-700 dark:text-white/80">
                              {getInvitationTypeIcon(inv.type)}
                              <span>
                                Invitación de{" "}
                                <strong>{inv.from_profile}</strong>
                                {inv.fromIsAnonymous && (
                                  <Badge className="ml-2 bg-slate-500/25 text-slate-100 border-slate-400/40 align-middle">
                                    Anónimo
                                  </Badge>
                                )}
                              </span>
                            </div>
                            {getStatusBadge(inv.status)}
                          </div>
                          {inv.message && (
                            <p className="text-sm text-slate-900 dark:text-white bg-slate-900/5 dark:bg-black/30 p-3 rounded-md mb-3">
                              {inv.message}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-white/70">
                            Recibido:{" "}
                            {inv.created_at
                              ? new Date(inv.created_at).toLocaleString()
                              : "Fecha no disponible"}
                          </p>
                        </div>
                        {inv.status === "pending" && (
                          <div className="flex gap-2 self-stretch sm:self-center">
                            <Button
                              onClick={() =>
                                handleInvitationAction(inv.id, "accept")
                              }
                              className="bg-green-500 hover:bg-green-600 px-3 py-1 text-sm"
                            >
                              <UserCheck className="h-4 w-4 mr-1" /> Aceptar
                            </Button>
                            <Button
                              onClick={() =>
                                handleInvitationAction(inv.id, "decline")
                              }
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                            >
                              <UserX className="h-4 w-4 mr-1" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sent" className="mt-6">
                <div className="space-y-4">
                  {sentInvitations.length === 0 ? (
                    <Card className="p-8 text-center bg-white dark:bg-purple-950 dark:bg-linear-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-blue-900/30 backdrop-blur-sm border-slate-200 dark:border-white/10">
                      <Send className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-white/50" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No has enviado invitaciones
                      </h3>
                      <p className="text-slate-600 dark:text-white/70">
                        Explora perfiles y envia invitaciones para conectar.
                      </p>
                    </Card>
                  ) : (
                    sentInvitations.map((inv) => (
                      <Card
                        key={inv.id}
                        className="p-4 bg-white dark:bg-purple-950 dark:bg-linear-to-br dark:from-purple-900/30 dark:via-purple-800/20 dark:to-blue-900/30 backdrop-blur-sm border-slate-200 dark:border-white/10 card-accessible flex items-start gap-4"
                      >
                        <RequestAvatar displayName={inv.to_profile} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center text-sm text-slate-700 dark:text-white/80">
                              {getInvitationTypeIcon(inv.type)}
                              <span>
                                Invitación para{" "}
                                <strong>{inv.to_profile}</strong>
                              </span>
                            </div>
                            {getStatusBadge(inv.status)}
                          </div>
                          {inv.message && (
                            <p className="text-sm text-slate-900 dark:text-white bg-slate-900/5 dark:bg-black/30 p-3 rounded-md my-3">
                              {inv.message}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-white/70">
                            Enviado:{" "}
                            {inv.created_at
                              ? new Date(inv.created_at).toLocaleString()
                              : "Fecha no disponible"}
                          </p>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Requests;
