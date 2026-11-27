import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import {
  ensureSeededPhotoAccessRequests,
  getAnonymousPhotoAccessRemainingMs,
  listIncomingRequestsSync,
  respondFriendRequest,
  resolveDemoDisplayName,
} from "@/lib/friends";
import { LiveCountdown } from "@/components/profiles/shared/PhotoAccessCountdown";

/**
 * Ronda 15 (stream A): solicitudes semilla de la bandeja
 * ("Solicitudes de Acceso"). Antes eran objetos hardcodeados con
 * `isLocal` ausente: aprobarlas era solo `setState` — no escribía
 * la concesión de 24 h (sin cuenta atrás HH:MM:SS) y al remontar
 * volvían a "pendiente". Ahora son SOLO los datos de presentación
 * (nombre/avatar/mensaje/antigüedad) de filas REALES del almacén
 * `friend_requests_demo`: `ensureSeededPhotoAccessRequests` las
 * escribe ahí (una por dueño, idempotente) y la bandeja se lee del
 * almacén, igual que una solicitud creada desde el chat. El nombre
 * y el avatar se superponen por `fromId` porque el almacén solo
 * guarda ids y estos solicitantes semilla no son cuentas demo
 * conocidas (`resolveDemoDisplayName("user-123")` no los resuelve).
 */
const SEEDED_PHOTO_ACCESS_REQUESTS = [
  {
    fromId: "user-123",
    name: "María García",
    avatar: "/assets/people/single/1.jpg",
    message: "Hola, me gustaría ver tus fotos privadas para conocerte mejor.",
    createdMinutesAgo: 60,
  },
  {
    fromId: "user-456",
    name: "Carlos López",
    avatar: "/assets/people/single/2.jpg",
    message: "Me interesa tu perfil, ¿podrías compartir tus fotos?",
    createdMinutesAgo: 120,
  },
];

interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string | undefined;
  message: string;
  timestamp: number;
  status: "pending" | "approved" | "denied";
  /**
   * Ronda 15 (stream A): TODAS las filas vienen del almacén local
   * (`friend_requests_demo`, kind `photo_access`) — incluidas las
   * semillas, que `loadRequests` siembra ahí. Sin la marca (o sin
   * fila en el almacén) aprobar/denegar no escribe nada y el acceso
   * nunca se concedería de verdad.
   */
  isLocal?: boolean;
}

interface PrivateImageRequestsManagerProps {
  profileId: string;
  profileName: string;
  onAccessGranted?: (requesterId: string) => void;
  onAccessDenied?: (requesterId: string) => void;
  className?: string;
}

export const PrivateImageRequestsManager: React.FC<
  PrivateImageRequestsManagerProps
> = ({ profileId, onAccessGranted, onAccessDenied, className = "" }) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Simular carga de solicitudes (en producción sería una llamada a la API)
  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        // Simular carga de solicitudes pendientes
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Ronda 15 (stream A): las 2 solicitudes semilla (María
        // García / Carlos López) se escriben en el MISMO almacén
        // local que una solicitud real (`friend_requests_demo`,
        // kind `photo_access`); antes eran objetos hardcodeados
        // fuera del almacén y aprobarlas era solo estado local: sin
        // concesión de 24 h (sin cuenta atrás HH:MM:SS) y revertida
        // a "pendiente" al remontar. La siembra es idempotente: si
        // la fila ya existe (pendiente, aceptada o declinada) no se
        // duplica; solo una aceptada ya expirada vuelve a pendiente.
        ensureSeededPhotoAccessRequests(
          profileId,
          SEEDED_PHOTO_ACCESS_REQUESTS,
        );

        // Solicitudes REALES de ver fotos enviadas a este perfil
        // (almacén local `friend_requests_demo`, kind
        // `photo_access`) — incluidas las semillas ya sembradas.
        // Ronda 12 (stream A, punto 2): `includeDecided: true` —
        // el gestor se reconstruía SOLO con pendientes, así que una
        // solicitud aceptada desaparecía al recargar mientras la
        // cuenta atrás de la concesión seguía viva (bandeja y
        // galería en desacuerdo). Aceptadas y declinadas quedan
        // visibles con su estado real del almacén.
        const localRequests: AccessRequest[] = listIncomingRequestsSync(
          profileId,
          "photo_access",
          { includeDecided: true },
        ).map((req) => {
          const seed = SEEDED_PHOTO_ACCESS_REQUESTS.find(
            (s) => s.fromId === req.fromId,
          );
          return {
            id: req.id,
            requesterId: req.fromId,
            requesterName: seed?.name ?? resolveDemoDisplayName(req.fromId),
            requesterAvatar: seed?.avatar,
            message:
              req.message ??
              seed?.message ??
              "Solicitud para ver la galería privada.",
            timestamp: Date.parse(req.createdAt) || Date.now(),
            status:
              req.status === "accepted"
                ? "approved"
                : req.status === "declined"
                  ? "denied"
                  : "pending",
            isLocal: true,
          };
        });
        // Orden visible: las semillas primero (en su orden fijo) y
        // luego las reales en orden del almacén. Antes las mock se
        // pintaban primero y las reales se añadían después; sin
        // esto una solicitud real enviada ANTES de la primera
        // siembra quedaría por encima de las semillas y cambiaría
        // el orden que el test de la ronda 14 asume.
        const seedOrder = (requesterId: string): number => {
          const idx = SEEDED_PHOTO_ACCESS_REQUESTS.findIndex(
            (s) => s.fromId === requesterId,
          );
          return idx === -1 ? SEEDED_PHOTO_ACCESS_REQUESTS.length : idx;
        };
        localRequests.sort(
          (a, b) => seedOrder(a.requesterId) - seedOrder(b.requesterId),
        );
        setRequests(localRequests);
      } catch (error) {
        logger.error("Error cargando solicitudes de acceso", {
          error,
          profileId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [profileId]);

  const handleApprove = async (requestId: string, requesterId: string) => {
    // Ronda 15 (stream A): TODAS las solicitudes de la bandeja son
    // filas reales del almacén (`friend_requests_demo`) — incluidas
    // las semillas, que `loadRequests` siembra ahí. Aprobar responde
    // en el almacén (`respondFriendRequest`): aceptar escribe la
    // concesión de 24 h (`respondedAt`) que lee la cuenta atrás.
    // El camino anterior simulaba la aprobación de las mock con solo
    // `setState` (sin escribir nada): sin contador HH:MM:SS y
    // revertida a "pendiente" al remontar. Ese camino ya no existe:
    // una fila sin almacén es un error, no una aprobación fingida.
    const localRequest = requests.find((r) => r.id === requestId && r.isLocal);
    if (!localRequest) {
      logger.error("Error aprobando solicitud de acceso: sin almacén", {
        requestId,
      });
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
      return;
    }
    const result = await respondFriendRequest(requestId, "accepted", true);
    if (!result.ok) {
      logger.error("Error aprobando solicitud local de acceso", {
        error: result.error,
        requestId,
      });
      toast({
        title: "Error",
        description: result.error ?? "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
      return;
    }
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "approved" } : req,
      ),
    );
    toast({
      title: "Solicitud aprobada",
      description: "El usuario ahora puede ver tus imágenes privadas.",
    });
    onAccessGranted?.(requesterId);
  };

  const handleDeny = async (requestId: string, requesterId: string) => {
    // Ronda 15 (stream A): mismo camino real que en handleApprove —
    // la denegación simulada con solo `setState` se perdía al
    // remontar igual que la aprobación fingida.
    const localRequest = requests.find((r) => r.id === requestId && r.isLocal);
    if (!localRequest) {
      logger.error("Error denegando solicitud de acceso: sin almacén", {
        requestId,
      });
      toast({
        title: "Error",
        description: "No se pudo denegar la solicitud.",
        variant: "destructive",
      });
      return;
    }
    const result = await respondFriendRequest(requestId, "declined", true);
    if (!result.ok) {
      logger.error("Error denegando solicitud local de acceso", {
        error: result.error,
        requestId,
      });
      toast({
        title: "Error",
        description: result.error ?? "No se pudo denegar la solicitud.",
        variant: "destructive",
      });
      return;
    }
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "denied" } : req,
      ),
    );
    toast({
      title: "Solicitud denegada",
      description: "El usuario no podrá ver tus imágenes privadas.",
    });
    onAccessDenied?.(requesterId);
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return "hace un momento";
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} días`;
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const deniedRequests = requests.filter((r) => r.status === "denied");

  if (isLoading) {
    return (
      <Card
        className={`bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 ${className}`}
      >
        <CardContent className="p-6">
          <div className="text-center text-slate-500 dark:text-white/60">
            Cargando solicitudes...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card
        className={`bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 ${className}`}
      >
        <CardContent className="p-6">
          <div className="text-center text-slate-500 dark:text-white/60">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay solicitudes de acceso pendientes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 ${className}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            Solicitudes de Acceso
          </CardTitle>
          <Badge className="bg-purple-500/15 text-purple-800 border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
            {pendingRequests.length} pendientes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Solicitudes Pendientes */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/70 uppercase tracking-wider">
              Pendientes
            </p>
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-slate-900/5 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0 overflow-hidden">
                    {request.requesterAvatar && !avatarErrors[request.id] ? (
                      <img
                        src={request.requesterAvatar}
                        alt={request.requesterName}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setAvatarErrors((prev) => ({
                            ...prev,
                            [request.id]: true,
                          }))
                        }
                        draggable={false}
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {request.requesterName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {request.requesterName}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/60">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(request.timestamp)}
                      </div>
                    </div>
                    {request.message && (
                      <p className="text-xs text-slate-600 dark:text-white/70 mb-3 line-clamp-2">
                        {request.message}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleApprove(request.id, request.requesterId)
                        }
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() =>
                          handleDeny(request.id, request.requesterId)
                        }
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Denegar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Solicitudes Aprobadas */}
        {approvedRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
              Aprobadas
            </p>
            {approvedRequests.map((request) => {
              // Ronda 12 (stream A, punto 2): la concesión vive 24 h
              // desde la aceptación: la fila aprobada muestra su
              // cuenta atrás en vivo, igual que la galería del dueño.
              // Sin ms restantes (concesión vencida) solo queda la
              // insignia: el acceso ya no es vigente.
              const remainingMs = getAnonymousPhotoAccessRemainingMs(
                request.requesterId,
                profileId,
              );
              return (
                <div
                  key={request.id}
                  className="bg-green-500/5 rounded-xl p-3 border border-green-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {request.requesterName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {formatTimeAgo(request.timestamp)}
                          {remainingMs !== null && (
                            <>
                              {" · "}
                              <LiveCountdown remainingMs={remainingMs} />
                              {" · expira a las 24 h de concedido"}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/15 text-green-700 border-green-500/30 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30 text-xs">
                      Acceso concedido
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Solicitudes Denegadas */}
        {deniedRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Denegadas
            </p>
            {deniedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-red-500/5 rounded-xl p-3 border border-red-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {request.requesterName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {formatTimeAgo(request.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-red-500/15 text-red-700 border-red-500/30 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 text-xs">
                    Acceso denegado
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivateImageRequestsManager;
