// Service Worker para notificaciones push
// Este archivo debe estar en la carpeta public del proyecto

const CACHE_NAME = "notifications-v1";
const NOTIFICATION_TAG = "complices-conecta-notification";

// Instalar Service Worker
self.addEventListener("install", () => {
  console.log("🔧 Service Worker instalado");
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activado");
  event.waitUntil(self.clients.claim());
});

// Manejar notificaciones push
self.addEventListener("push", (event) => {
  console.log("📱 Push notification recibida:", event);

  if (!event.data) {
    console.log("No hay datos en la notificación push");
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.message || "Nueva notificación",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: data.id || NOTIFICATION_TAG,
      data: {
        url: data.action_url || "/",
        notificationId: data.id,
        type: data.type,
      },
      requireInteraction: data.priority === "urgent",
      silent: data.priority === "low",
      vibrate: data.priority === "urgent" ? [200, 100, 200] : undefined,
      actions: [
        {
          action: "view",
          title: "Ver",
          icon: "/icons/view.png",
        },
        {
          action: "dismiss",
          title: "Descartar",
          icon: "/icons/dismiss.png",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "Nueva notificación",
        options,
      ),
    );
  } catch (error) {
    console.error("Error procesando notificación push:", error);

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification("Nueva notificación", {
        body: "Tienes una nueva notificación",
        icon: "/icon-192x192.png",
        tag: NOTIFICATION_TAG,
      }),
    );
  }
});

// Manejar clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Click en notificación:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    console.log("Notificación descartada");
    return;
  }

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Buscar ventana existente
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }

        // Abrir nueva ventana si no hay ninguna abierta
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});

// Manejar cierre de notificaciones
self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notificación cerrada:", event);

  // Opcional: marcar como leída en el servidor
  if (event.notification.data?.notificationId) {
    // Aquí podrías enviar una petición al servidor para marcar como leída
    console.log(
      "Notificación cerrada:",
      event.notification.data.notificationId,
    );
  }
});

// Manejar mensajes del cliente
self.addEventListener("message", (event) => {
  console.log("📨 Mensaje recibido en Service Worker:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Manejar errores
self.addEventListener("error", (event) => {
  console.error("❌ Error en Service Worker:", event.error);
});

// Manejar promesas rechazadas
self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Promesa rechazada en Service Worker:", event.reason);
});

// Función para limpiar notificaciones antiguas
function cleanupOldNotifications() {
  self.registration
    .getNotifications({ tag: NOTIFICATION_TAG })
    .then((notifications) => {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      notifications.forEach((notification) => {
        const notificationTime = new Date(notification.timestamp).getTime();
        if (now - notificationTime > maxAge) {
          notification.close();
        }
      });
    });
}

// Limpiar notificaciones cada hora
setInterval(cleanupOldNotifications, 60 * 60 * 1000);

console.log("🚀 Service Worker cargado correctamente");
