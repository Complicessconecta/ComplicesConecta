import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";

interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  message: string;
  timestamp: number;
  status: "pending" | "approved" | "denied";
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

        // Solicitudes mock para demo
        const mockRequests: AccessRequest[] = [
          {
            id: "req-1",
            requesterId: "user-123",
            requesterName: "María García",
            requesterAvatar: "/assets/people/single/1.jpg",
            message: "Hola, me gustaría ver tus fotos privadías para conocerte mejor.",
            timestamp: Date.now() - 3600000, // Hace 1 hora
            status: "pending",
          },
          {
            id: "req-2",
            requesterId: "user-456",
            requesterName: "Carlos López",
            requesterAvatar: "/assets/people/single/2.jpg",
            message: "Me interesa tu perfil, ¿podrías compartir tus fotos?",
            timestamp: Date.now() - 7200000, // Hace 2 horas
            status: "pending",
          },
        ];

        setRequests(mockRequests);
      } catch (error) {
        logger.error("Error cargando solicitudes de acceso", { error, profileId });
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [profileId]);

  const handleApprove = async (requestId: string, requesterId: string) => {
    try {
      // Simular aprobación (en producción sería una llamada a la API)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );

      toast({
        title: "Solicitud aprobada",
        description: "El usuario ahora puede ver tus imágenes privadías.",
      });

      onAccessGranted?.(requesterId);
    } catch (error) {
      logger.error("Error aprobando solicitud", { error, requestId });
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud.",
        variant: "destructive",
      });
    }
  };

  const handleDeny = async (requestId: string, requesterId: string) => {
    try {
      // Simular denegación (en producción sería una llamada a la API)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "denied" } : req
        )
      );

      toast({
        title: "Solicitud denegada",
        description: "El usuario no podrá ver tus imágenes privadías.",
      });

      onAccessDenied?.(requesterId);
    } catch (error) {
      logger.error("Error denegando solicitud", { error, requestId });
      toast({
        title: "Error",
        description: "No se pudo denegar la solicitud.",
        variant: "destructive",
      });
    }
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
      <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-white/60">Cargando solicitudes...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-white/60">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay solicitudes de acceso pendientes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            Solicitudes de Acceso
          </CardTitle>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            {pendingRequests.length} pendientes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Solicitudes Pendientes */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Pendientes
            </p>
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0 overflow-hidden">
                    {request.requesterAvatar && !avatarErrors[request.id] ? (
                      <img
                        src={request.requesterAvatar}
                        alt={request.requesterName}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setAvatarErrors((prev) => ({ ...prev, [request.id]: true }))
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
                      <p className="text-sm font-semibold text-white truncate">
                        {request.requesterName}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(request.timestamp)}
                      </div>
                    </div>
                    {request.message && (
                      <p className="text-xs text-white/70 mb-3 line-clamp-2">
                        {request.message}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request.id, request.requesterId)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => handleDeny(request.id, request.requesterId)}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
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

        {/* Solicitudes Aprobadías */}
        {approvedRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
              Aprobadías
            </p>
            {approvedRequests.map((request) => (
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
                      <p className="text-sm font-medium text-white">
                        {request.requesterName}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatTimeAgo(request.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                    Acceso concedido
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Solicitudes Denegadías */}
        {deniedRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Denegadías
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
                      <p className="text-sm font-medium text-white">
                        {request.requesterName}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatTimeAgo(request.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
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

