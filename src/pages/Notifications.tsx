import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Bell, Check, Mail, UserPlus, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import {
  NotificationService,
  getDemoNotifications,
  markDemoNotificationAsRead,
  markAllDemoNotificationsAsRead,
  deleteDemoNotification,
  DEMO_NOTIFICATIONS_CHANGED_EVENT,
  type DemoNotification,
} from "@/lib/notifications";

interface PageNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string | null;
  sender_name?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4 text-blue-500" />;
    case "request":
      return <UserPlus className="w-4 h-4 text-purple-500" />;
    case "alert":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Sin fecha";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );
  if (diffInMinutes < 1) return "Ahora";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isDemo } = useAuth();
  const [notifications, setNotifications] = useState<PageNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Misma señal demo que NotificationBell: `isDemo()` (flags de sesión
  // demo) o `profile.is_demo`.
  const isDemoUser =
    (typeof isDemo === "function" && isDemo()) ||
    (profile as { is_demo?: boolean } | null)?.is_demo === true;

  const loadDemo = useCallback(() => {
    const demo: PageNotification[] = getDemoNotifications().map(
      (n: DemoNotification) => ({ ...n }),
    );
    setNotifications(demo);
    setLoading(false);
  }, []);

  const loadReal = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { notifications: loaded } =
        await NotificationService.getUserNotifications(user.id);
      const mapped: PageNotification[] = (
        loaded as unknown as Array<Record<string, unknown>>
      ).map((item) => ({
        id: String(item.id ?? ""),
        type: typeof item.type === "string" ? item.type : "system",
        title: typeof item.title === "string" ? item.title : "Notificación",
        message: typeof item.message === "string" ? item.message : "",
        read: item.read === true,
        created_at:
          typeof item.created_at === "string" ? item.created_at : null,
        // Ronda 21 (coordinador): con `exactOptionalPropertyTypes`
        // no se puede asignar `sender_name: undefined` explícito a
        // `sender_name?: string`: solo se incluye cuando es string.
        ...(typeof item.sender_name === "string"
          ? { sender_name: item.sender_name }
          : {}),
      }));
      setNotifications(mapped);
    } catch (error) {
      logger.error("Error loading notifications:", { error });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    if (isDemoUser) {
      loadDemo();
      return;
    }
    void loadReal();
  }, [user, isDemoUser, loadDemo, loadReal]);

  // Ronda 21 (stream C): si la campana marca/borra una demo mientras
  // la página está montada, refrescar sin recargar.
  useEffect(() => {
    if (!isDemoUser) return;
    const onChanged = () => loadDemo();
    window.addEventListener(DEMO_NOTIFICATIONS_CHANGED_EVENT, onChanged);
    return () =>
      window.removeEventListener(DEMO_NOTIFICATIONS_CHANGED_EVENT, onChanged);
  }, [isDemoUser, loadDemo]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    if (isDemoUser) {
      markDemoNotificationAsRead(notificationId);
    } else if (user) {
      void NotificationService.markAsRead(notificationId, user.id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    if (isDemoUser) {
      markAllDemoNotificationsAsRead();
    } else if (user) {
      void NotificationService.markAllAsRead(user.id).then((ok) => {
        if (!ok) {
          toast({
            title: "Error",
            description: "No se pudieron marcar las notificaciones como leídas",
            variant: "destructive",
          });
        }
      });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: "Éxito",
      description: "Todas las notificaciones marcadas como leídas",
    });
  };

  const deleteNotification = (notificationId: string) => {
    if (isDemoUser) {
      deleteDemoNotification(notificationId);
    } else {
      void NotificationService.deleteNotification(notificationId);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  return (
    <div className="min-h-[60vh] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Ronda 21 (stream C): el título y el subtítulo eran `text-white`
            fijos: en tema claro el fondo es claro y el blanco era
            ilegible. Ahora van por tema. */}
        {/* Ronda 22 (stream B): la cabecera era `flex` de una sola fila
            con dos bloques que no encogen: el h1 (icono + título + badge)
            y el botón (`whitespace-nowrap` en Button). En móvil (~360 px)
            la suma supera el ancho y el botón se salía por la derecha
            recortado por el badge («…todas com…»). Con `flex-wrap` el
            botón baja a su propia línea con ancho completo, y `shrink-0`
            impide que se comprima cuando sí cabe en la misma fila. */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 min-w-0">
            <Bell className="w-8 h-8 text-purple-500 shrink-0" />
            Notificaciones
            {unreadCount > 0 && (
              <span className="text-sm font-semibold bg-red-500 text-white rounded-full px-2 py-0.5 shrink-0">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="shrink-0"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-purple-500/20 p-6 rounded-full mb-6">
              <Bell className="w-16 h-16 text-purple-400" />
            </div>
            <p className="text-slate-600 dark:text-white/70 mb-8 max-w-md">
              No tienes notificaciones nuevas en este momento.
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Volver
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/15 transition-colors ${
                  !notification.read ? "ring-1 ring-blue-500/40" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-medium ${
                          !notification.read
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {notification.message}
                    </p>
                    {notification.sender_name && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        De: {notification.sender_name}
                      </p>
                    )}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 h-7 w-7"
                        aria-label="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 h-7 w-7 text-red-500 hover:text-red-700"
                      aria-label="Eliminar notificación"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => navigate(-1)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Volver
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
