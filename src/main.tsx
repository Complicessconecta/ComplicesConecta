import { suppressWalletErrors } from "@/lib/wallet-silencer";
import { startErrorCapture } from "@/lib/capture-console-errors";
import { createRoot } from "react-dom/client";
import * as React from "react";
import type { WindowWithReact } from "@/types/react.types";
import { SpeedInsights } from "@vercel/speed-insights/react";

// CRÍTICO: Iniciar la captura de errores de consola lo antes posible.
startErrorCapture();

// CRÍTICO: Silenciar errores de wallet ANTES de cualquier otra cosa.
suppressWalletErrors();

const { StrictMode } = React;

// CRÍTICO: Verificar que React esté completamente disponible
if (!React || !React.createElement || !React.useEffect || !React.useState) {
  console.error("🚨 React is not properly loaded:", {
    hasReact: !!React,
    hasCreateElement: !!(React && React.createElement),
    hasUseEffect: !!(React && React.useEffect),
    hasUseState: !!(React && React.useState),
    hasUseLayoutEffect: !!(React && React.useLayoutEffect),
  });
  throw new Error("React is not properly loaded - critical hooks missing");
}

// CRÍTICO: Asegurar useLayoutEffect está disponible ANTES de cualquier componente
if (!React.useLayoutEffect) {
  console.warn("⚠️ useLayoutEffect not available, using useEffect fallback");
  // No podemos reasignar React directamente, se maneja en window.React
}

// CRÍTICO: Asegurar React disponible globalmente INMEDIATAMENTE, ANTES DE CUALQUIER OTRA COSA
// Esto debe estar ANTES de cualquier otro import o código que pueda cargar chunks
if (typeof window !== "undefined") {
  const win = window as WindowWithReact;

  // Logging para diagnóstico
  const debugLog = (event: string, data?: unknown) => {
    if (win.__LOADING_DEBUG__) {
      win.__LOADING_DEBUG__.log(event, data);
    }
  };

  debugLog("MAIN_TSX_START", {
    hasReact: !!React,
    hasCreateContext: !!React.createContext,
  });

  // Forzar React disponible globalmente de forma inmediata
  win.React = React;
  win.ReactDOM = { createRoot: createRoot as any };

  // CRÍTICO: Asegurar que useLayoutEffect esté disponible en window.React
  if (!React.useLayoutEffect && win.React) {
    // Fallback a useEffect si useLayoutEffect no está disponible
    win.React.useLayoutEffect = React.useEffect;
    debugLog("REACT_USELAYOUTEFFECT_FALLBACK", { fallbackToUseEffect: true });
  }

  // Asegurar que React.createContext esté disponible inmediatamente
  if (!React.createContext) {
    debugLog("REACT_CREATECONTEXT_MISSING", { React });
    throw new Error(
      "React.createContext is not available - React version incompatible",
    );
  }

  debugLog("REACT_GLOBAL_SET", {
    hasReact: !!win.React,
    hasCreateContext: !!win.React?.createContext,
    reactVersion: React.version,
  });

  // Verificar que React esté correctamente configurado
  try {
    const testContext = React.createContext(null);
    debugLog("REACT_CONTEXT_TEST_SUCCESS", { testContext });
  } catch (error) {
    debugLog("REACT_CONTEXT_TEST_FAILED", { error });
    throw new Error(`React context test failed: ${error}`);
  }

  const isIgnoredWalletError = (message: unknown): boolean => {
    if (!message) return false;
    const text = String(message).toLowerCase();
    return (
      text.includes("chainid") ||
      text.includes("ethereum") ||
      text.includes("solana") ||
      text.includes("tronlink") ||
      text.includes("metamask")
    );
  };

  // Configurar React DevTools si está disponible
  if (win.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    debugLog("REACT_DEVTOOLS_DETECTED");
  }

  // Verificar que no haya conflictos de versiones
  if (win.React && win.React !== React) {
    debugLog("REACT_VERSION_CONFLICT", {
      globalReact: win.React.version,
      importedReact: React.version,
    });
  }

  // Configurar error boundaries globales para React
  win.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    if (isIgnoredWalletError(event.reason)) {
      // Silenciar errores de extensiones de wallet para la demo
      event.preventDefault();
      return;
    }
    debugLog("UNHANDLED_PROMISE_REJECTION", {
      reason: event.reason,
      promise: event.promise,
    });
  });

  win.addEventListener("error", (event: ErrorEvent) => {
    if (isIgnoredWalletError(event.message || event.error?.message)) {
      // Silenciar errores de chainId/ethereum/solana/TronLink/MetaMask
      event.preventDefault();
      return;
    }
    debugLog("GLOBAL_ERROR", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });
}

// Ahora sí, importar el resto de las dependencias
import App from "./App";
import "./index.css"; // Estilos con Tailwind CSS (consolidados)
import ErrorBoundary from "@/components/ErrorBoundary";
import { BackgroundProvider } from "@/context/BackgroundContext";
import { AppInitializer } from "@/components/AppInitializer"; // <-- IMPORTADO
import { initSentry } from "@/config/sentry.config";
import { initializeDatadogRUM } from "@/config/datadog-rum.config";
import { initPostHog } from "@/config/posthog.config";
import { oneSignalService } from "@/services/notifications/OneSignalService";
import { DebugInfo } from "@/debug";
import { logger } from "@/lib/logger";

// Debug info for development only
if (import.meta.env.DEV) {
  logger.info("ComplicesConecta v3.6.3 starting...");
}

// Initialize Datadog RUM for frontend monitoring
try {
  initializeDatadogRUM();
  if (import.meta.env.DEV) logger.info("Datadog RUM initialized");
} catch (error) {
  logger.error("Datadog RUM initialization failed", { error });
}

// Initialize PostHog Analytics (async, no bloquea)
initPostHog()
  .then(() => {
    if (import.meta.env.DEV) logger.info("PostHog initialized");
  })
  .catch((error) => {
    logger.error("PostHog initialization failed", { error });
  });

// Initialize OneSignal Push Notifications (async, no bloquea)
oneSignalService
  .requestPermission()
  .then(() => {
    if (import.meta.env.DEV) logger.info("OneSignal initialized");
  })
  .catch((error) => {
    logger.error("OneSignal initialization failed", { error });
  });

// Initialize Sentry for error monitoring
try {
  if (import.meta.env.VITE_SENTRY_DSN) {
    initSentry();
    if (import.meta.env.DEV) logger.info("Sentry initialized");
  } else {
    if (import.meta.env.DEV) logger.debug("Sentry DSN not configured");
  }
} catch (error) {
  logger.error("Sentry initialization failed", { error });
}

// Service Worker registration (if available)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration: ServiceWorkerRegistration) => {
      logger.info("SW registered: ", registration);
    })
    .catch((error: Error) => {
      logger.error("SW registration failed: ", error);
    });
}

// Función principal de inicialización
async function initializeApp() {
  try {
    // Verificar que el DOM esté listo
    if (document.readyState === "loading") {
      await new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve);
      });
    }

    // Obtener el elemento root
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Root element not found");
    }

    // Crear la raíz de React
    const root = createRoot(container as any);

    // Renderizar la aplicación
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <BackgroundProvider>
            <AppInitializer>
              <App />
              {import.meta.env.DEV && <DebugInfo />}
              <SpeedInsights />
            </AppInitializer>
          </BackgroundProvider>
        </ErrorBoundary>
      </StrictMode>,
    );

    logger.info("ComplicesConecta v3.6.3 initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize app:", error as any);

    // Mostrar error en el DOM si es posible
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; color: red; font-family: monospace;">
          <h2>Error al inicializar la aplicación</h2>
          <p>${error instanceof Error ? error.message : "Error desconocido"}</p>
          <p>Por favor, recarga la página o contacta soporte.</p>
        </div>
      `;
    }
  }
}

// Inicializar la aplicación
initializeApp();
