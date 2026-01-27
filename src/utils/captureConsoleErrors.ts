/**
 * Utilidad para capturar y mostrar errores de consola
 * Versión: 3.5.1
 *
 * Uso: Importar y llamar captureConsoleErrors() en la consola del navegador
 */

interface ConsoleError {
  type: "error" | "warning" | "log";
  message: string;
  timestamp: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
}

interface ResourceError {
  url: string;
  type: "chunk" | "stylesheet" | "font" | "image" | "script" | "other";
  status: number;
  statusText: string;
  timestamp: string;
}

interface PerformanceIssue {
  type: "slow-load" | "large-chunk" | "missing-resource" | "cors-error";
  message: string;
  details: any;
  timestamp: string;
}

class ConsoleErrorCapture {
  private errors: ConsoleError[] = [];
  private resourceErrors: ResourceError[] = [];
  private performanceIssues: PerformanceIssue[] = [];
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private originalLog: typeof console.log;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null =
    null;
  private resourceErrorHandler: ((event: Event) => void) | null = null;

  constructor() {
    this.originalError = console.error;
    this.originalWarn = console.warn;
    this.originalLog = console.log;
  }

  startCapture(): void {
    // Capturar console.error
    console.error = (...args: any[]) => {
      const message = args
        .map((arg) => {
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(" ");

      this.errors.push({
        type: "error",
        message,
        timestamp: new Date().toISOString(),
        stack: args.find((arg) => arg?.stack)?.stack,
      });

      this.originalError.apply(console, args);
    };

    // Capturar console.warn
    console.warn = (...args: any[]) => {
      const message = args.map((arg) => String(arg)).join(" ");

      this.errors.push({
        type: "warning",
        message,
        timestamp: new Date().toISOString(),
      });

      this.originalWarn.apply(console, args);
    };

    // Capturar errores globales
    this.errorHandler = (event: ErrorEvent) => {
      this.errors.push({
        type: "error",
        message: event.message || "Unknown error",
        timestamp: new Date().toISOString(),
        source: event.filename || "unknown",
        line: event.lineno || 0,
        column: event.colno || 0,
        stack: event.error?.stack,
      });
    };

    window.addEventListener("error", this.errorHandler, true);

    // Capturar promise rejections
    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason?.message || reason?.toString() || "Unhandled promise rejection";

      this.errors.push({
        type: "error",
        message: `Unhandled Promise Rejection: ${message}`,
        timestamp: new Date().toISOString(),
        stack: reason?.stack,
      });
    };

    window.addEventListener("unhandledrejection", this.rejectionHandler);

    // Capturar errores de recursos (chunks, CSS, imágenes, etc.)
    this.resourceErrorHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "LINK" ||
          target.tagName === "SCRIPT" ||
          target.tagName === "IMG")
      ) {
        const element = target as
          | HTMLLinkElement
          | HTMLScriptElement
          | HTMLImageElement;
        const url =
          (element as HTMLLinkElement).href ||
          (element as HTMLScriptElement).src ||
          (element as HTMLImageElement).src;

        if (url) {
          let resourceType: ResourceError["type"] = "other";
          if (target.tagName === "SCRIPT") {
            resourceType =
              url.includes("chunk") || url.includes("assets/js")
                ? "chunk"
                : "script";
          } else if (target.tagName === "LINK") {
            resourceType = url.includes(".css") ? "stylesheet" : "other";
          } else if (target.tagName === "IMG") {
            resourceType = "image";
          }

          this.resourceErrors.push({
            url,
            type: resourceType,
            status: 0,
            statusText: "Failed to load",
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    // Capturar errores de recursos usando Performance API
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "resource") {
              const resourceEntry = entry as PerformanceResourceTiming;
              if (
                resourceEntry.transferSize === 0 &&
                resourceEntry.decodedBodySize === 0 &&
                resourceEntry.duration > 100
              ) {
                // Posible recurso no cargado
                let resourceType: ResourceError["type"] = "other";
                const url = resourceEntry.name;

                if (url.includes("chunk") || url.includes("assets/js")) {
                  resourceType = "chunk";
                } else if (url.includes(".css")) {
                  resourceType = "stylesheet";
                } else if (
                  url.includes(".woff") ||
                  url.includes(".ttf") ||
                  url.includes(".otf")
                ) {
                  resourceType = "font";
                } else if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)/i)) {
                  resourceType = "image";
                }

                this.resourceErrors.push({
                  url,
                  type: resourceType,
                  status: 0,
                  statusText: "Possible failed load",
                  timestamp: new Date().toISOString(),
                });
              }

              // Detectar chunks grandes
              const resourceUrl = resourceEntry.name;
              if (
                resourceEntry.transferSize > 500 * 1024 &&
                resourceUrl.includes("assets/js")
              ) {
                this.performanceIssues.push({
                  type: "large-chunk",
                  message: `Chunk grande detectado: ${resourceUrl.split("/").pop()}`,
                  details: {
                    url: resourceUrl,
                    size: `${(resourceEntry.transferSize / 1024).toFixed(2)} KB`,
                    loadTime: `${resourceEntry.duration.toFixed(2)} ms`,
                  },
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        });

        observer.observe({ entryTypes: ["resource"] });
      } catch {
        // PerformanceObserver no disponible o error
      }
    }

    // Capturar errores de red usando fetch
    const originalFetch = window.fetch;
    (window as any).__originalFetch = originalFetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && args[0]) {
          const url = (() => {
            const input = args[0];
            if (typeof input === "string") return input;
            if (input instanceof URL) return input.toString();
            if (input instanceof Request) return input.url;
            return "";
          })();
          let resourceType: ResourceError["type"] = "other";

          if (url.includes("chunk") || url.includes("assets/js")) {
            resourceType = "chunk";
          } else if (url.includes(".css")) {
            resourceType = "stylesheet";
          }

          this.resourceErrors.push({
            url,
            type: resourceType,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
          });
        }
        return response;
      } catch (error) {
        const url = (() => {
          const input = args[0];
          if (typeof input === "string") return input;
          if (input instanceof URL) return input.toString();
          if (input instanceof Request) return input.url;
          return "";
        })();
        this.resourceErrors.push({
          url,
          type: "other",
          status: 0,
          statusText: error instanceof Error ? error.message : "Network error",
          timestamp: new Date().toISOString(),
        });

        const isInternalIntegrationRequest = (() => {
          if (!url) return false;
          return (
            url.includes("cascade-browser-integration") ||
            url.includes("windsurf") ||
            url.includes("127.0.0.1") ||
            url.includes("localhost")
          );
        })();

        if (isInternalIntegrationRequest) {
          return new Response(null, { status: 204, statusText: "No Content" });
        }

        throw error;
      }
    };

    // Capturar errores de carga de recursos HTML
    document.addEventListener("error", this.resourceErrorHandler, true);

    console.log("✅ Captura de errores de consola iniciada");
    console.log("💡 Comandos disponibles en la consola:");
    console.log("   - showErrorReport() - Ver reporte completo de errores");
    console.log("   - getConsoleErrors() - Obtener array de errores");
    console.log(
      "   - exportConsoleErrors() - Exportar errores como JSON (se copia al portapapeles)",
    );
    console.log("   - clearConsoleErrors() - Limpiar errores capturados");
    console.log("   - stopErrorCapture() - Detener captura");
    console.log("   - startErrorCapture() - Reiniciar captura");

    // Detectar si se accede vía túnel
    if (
      window.location.hostname.includes(".loca.lt") ||
      window.location.hostname.includes(".ngrok-free.app") ||
      window.location.hostname.includes(".trycloudflare.com")
    ) {
      console.log("🌐 Acceso detectado vía túnel:", window.location.href);
      console.log(
        "📊 Los errores se capturan automáticamente. Usa showErrorReport() para ver el resumen.",
      );
      console.log(
        "💾 Usa exportConsoleErrors() para exportar todos los errores como JSON.",
      );

      // Mostrar errores automáticamente después de 3 segundos si hay errores
      setTimeout(() => {
        const errors = this.getErrorsByType("error");
        if (errors.length > 0) {
          console.warn(
            `⚠️ Se detectaron ${errors.length} error(es). Ejecuta showErrorReport() para ver detalles.`,
          );
        }
      }, 3000);
    }
  }

  stopCapture(): void {
    console.error = this.originalError;
    console.warn = this.originalWarn;
    console.log = this.originalLog;

    if (this.errorHandler) {
      window.removeEventListener("error", this.errorHandler, true);
    }

    if (this.rejectionHandler) {
      window.removeEventListener("unhandledrejection", this.rejectionHandler);
    }

    if (this.resourceErrorHandler) {
      document.removeEventListener("error", this.resourceErrorHandler, true);
    }

    // Restaurar fetch original
    if ((window as any).__originalFetch) {
      window.fetch = (window as any).__originalFetch;
    }

    console.log("🛑 Captura de errores de consola detenida");
  }

  getErrors(): ConsoleError[] {
    return [...this.errors];
  }

  getErrorsByType(type: "error" | "warning" | "log"): ConsoleError[] {
    return this.errors.filter((e) => e.type === type);
  }

  clearErrors(): void {
    this.errors = [];
    console.log("🗑️ Errores de consola limpiados");
  }

  exportErrors(): string {
    // Obtener chunks y stylesheets cargados
    const chunks: any[] = [];
    const stylesheets: any[] = [];

    if ("PerformanceObserver" in window) {
      try {
        const resources = performance.getEntriesByType(
          "resource",
        ) as PerformanceResourceTiming[];

        resources.forEach((resource) => {
          const url = resource.name;
          if (url.includes("assets/js") || url.includes("chunk")) {
            chunks.push({
              url: url.split("/").pop() || url,
              fullUrl: url,
              size: `${(resource.transferSize / 1024).toFixed(2)} KB`,
              loadTime: `${resource.duration.toFixed(2)} ms`,
              cached:
                resource.transferSize === 0 && resource.decodedBodySize > 0,
            });
          } else if (url.includes(".css")) {
            stylesheets.push({
              url: url.split("/").pop() || url,
              fullUrl: url,
              size: `${(resource.transferSize / 1024).toFixed(2)} KB`,
              loadTime: `${resource.duration.toFixed(2)} ms`,
              cached:
                resource.transferSize === 0 && resource.decodedBodySize > 0,
            });
          }
        });
      } catch {
        // Performance API no disponible
      }
    }

    const report = {
      errors: this.getErrorsByType("error"),
      warnings: this.getErrorsByType("warning"),
      logs: this.getErrorsByType("log"),
      resourceErrors: this.resourceErrors,
      performanceIssues: this.performanceIssues,
      chunks,
      stylesheets,
      total:
        this.errors.length +
        this.resourceErrors.length +
        this.performanceIssues.length,
      url: window.location.href,
      isTunnel:
        window.location.hostname.includes(".loca.lt") ||
        window.location.hostname.includes(".ngrok-free.app") ||
        window.location.hostname.includes(".trycloudflare.com"),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      environment: {
        mode: import.meta.env?.MODE || "unknown",
        dev: import.meta.env?.DEV || false,
        prod: import.meta.env?.PROD || false,
      },
    };

    const json = JSON.stringify(report, null, 2);

    // Copiar al portapapeles si es posible
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(json)
        .then(() => {
          console.log("✅ Errores exportados y copiados al portapapeles");
        })
        .catch(() => {
          console.log(
            "⚠️ No se pudo copiar al portapapeles, pero los errores están en la consola",
          );
        });
    }

    return json;
  }

  showReport(): {
    errors: ConsoleError[];
    warnings: ConsoleError[];
    logs: ConsoleError[];
    resourceErrors: ResourceError[];
    performanceIssues: PerformanceIssue[];
    chunks: any[];
    stylesheets: any[];
    total: number;
    url: string;
    isTunnel: boolean;
    timestamp: string;
  } {
    console.group("📊 Reporte Completo de Errores y Debug");

    // Información del entorno
    const isTunnel =
      window.location.hostname.includes(".loca.lt") ||
      window.location.hostname.includes(".ngrok-free.app") ||
      window.location.hostname.includes(".trycloudflare.com");

    if (isTunnel) {
      console.log("🌐 Acceso vía túnel:", window.location.href);
    }
    console.log("📍 URL actual:", window.location.href);
    console.log("⏰ Reporte generado:", new Date().toISOString());
    console.log("🖥️ User Agent:", navigator.userAgent);

    const errors = this.getErrorsByType("error");
    const warnings = this.getErrorsByType("warning");
    const logs = this.getErrorsByType("log");

    // Análisis de chunks cargados
    const chunks: any[] = [];
    const stylesheets: any[] = [];

    if ("PerformanceObserver" in window) {
      try {
        const resources = performance.getEntriesByType(
          "resource",
        ) as PerformanceResourceTiming[];

        resources.forEach((resource) => {
          const url = resource.name;
          if (url.includes("assets/js") || url.includes("chunk")) {
            chunks.push({
              url: url.split("/").pop() || url,
              fullUrl: url,
              size: `${(resource.transferSize / 1024).toFixed(2)} KB`,
              loadTime: `${resource.duration.toFixed(2)} ms`,
              cached:
                resource.transferSize === 0 && resource.decodedBodySize > 0,
            });
          } else if (url.includes(".css")) {
            stylesheets.push({
              url: url.split("/").pop() || url,
              fullUrl: url,
              size: `${(resource.transferSize / 1024).toFixed(2)} KB`,
              loadTime: `${resource.duration.toFixed(2)} ms`,
              cached:
                resource.transferSize === 0 && resource.decodedBodySize > 0,
            });
          }
        });
      } catch {
        // Performance API no disponible
      }
    }

    // Chunks faltantes (404)
    const chunkErrors = this.resourceErrors.filter((e) => e.type === "chunk");
    const stylesheetErrors = this.resourceErrors.filter(
      (e) => e.type === "stylesheet",
    );
    const fontErrors = this.resourceErrors.filter((e) => e.type === "font");
    const imageErrors = this.resourceErrors.filter((e) => e.type === "image");

    console.log(`\n🔴 Errores de Consola: ${errors.length}`);
    if (errors.length > 0) {
      console.table(errors);
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.substring(0, 200)}...`);
        }
        if (error.source) {
          console.log(
            `   Source: ${error.source}:${error.line}:${error.column}`,
          );
        }
        if (error.timestamp) {
          console.log(`   Timestamp: ${error.timestamp}`);
        }
      });
    } else {
      console.log("✅ No se encontraron errores de consola");
    }

    console.log(`\n⚠️ Warnings: ${warnings.length}`);
    if (warnings.length > 0) {
      console.table(warnings);
    } else {
      console.log("✅ No se encontraron warnings");
    }

    console.log(`\n📦 Chunks Cargados: ${chunks.length}`);
    if (chunks.length > 0) {
      console.table(chunks);

      // Detectar chunks grandes
      const largeChunks = chunks.filter((c) => parseFloat(c.size) > 500);
      if (largeChunks.length > 0) {
        console.warn(`\n⚠️ Chunks grandes detectados (${largeChunks.length}):`);
        largeChunks.forEach((chunk) => {
          console.warn(`   - ${chunk.url}: ${chunk.size} (${chunk.loadTime})`);
        });
      }
    } else {
      console.warn("⚠️ No se detectaron chunks cargados");
    }

    console.log(`\n🎨 Stylesheets Cargados: ${stylesheets.length}`);
    if (stylesheets.length > 0) {
      console.table(stylesheets);
    } else {
      console.warn("⚠️ No se detectaron stylesheets cargados");
    }

    console.log(`\n❌ Errores de Recursos: ${this.resourceErrors.length}`);
    if (this.resourceErrors.length > 0) {
      console.group("Detalles de Errores de Recursos");

      if (chunkErrors.length > 0) {
        console.error(`\n📦 Chunks Faltantes (${chunkErrors.length}):`);
        chunkErrors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error.url}`);
          console.error(`      Status: ${error.status} ${error.statusText}`);
          console.error(`      Timestamp: ${error.timestamp}`);
        });
      }

      if (stylesheetErrors.length > 0) {
        console.error(
          `\n🎨 Stylesheets Faltantes (${stylesheetErrors.length}):`,
        );
        stylesheetErrors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error.url}`);
          console.error(`      Status: ${error.status} ${error.statusText}`);
        });
      }

      if (fontErrors.length > 0) {
        console.error(`\n🔤 Fuentes Faltantes (${fontErrors.length}):`);
        fontErrors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error.url}`);
        });
      }

      if (imageErrors.length > 0) {
        console.error(`\n🖼️ Imágenes Faltantes (${imageErrors.length}):`);
        imageErrors.forEach((error, index) => {
          console.error(`   ${index + 1}. ${error.url}`);
        });
      }

      console.groupEnd();
    } else {
      console.log("✅ No se encontraron errores de recursos");
    }

    console.log(
      `\n⚡ Problemas de Performance: ${this.performanceIssues.length}`,
    );
    if (this.performanceIssues.length > 0) {
      console.table(this.performanceIssues);
    } else {
      console.log("✅ No se encontraron problemas de performance");
    }

    // Análisis de estilos
    console.log(`\n🎨 Análisis de Estilos:`);
    const computedStyles = window.getComputedStyle(document.body);
    const fontFamily = computedStyles.fontFamily;
    const backgroundColor = computedStyles.backgroundColor;
    const color = computedStyles.color;

    console.log(`   Font Family: ${fontFamily}`);
    console.log(`   Background Color: ${backgroundColor}`);
    console.log(`   Text Color: ${color}`);

    // Verificar si Tailwind está cargado
    const tailwindLoaded =
      document.querySelector('style[data-vite-dev-id*="index"]') ||
      Array.from(document.styleSheets).some((sheet) => {
        try {
          return sheet.href?.includes("style.css") || false;
        } catch {
          return false;
        }
      });

    if (tailwindLoaded) {
      console.log("   ✅ Tailwind CSS detectado");
    } else {
      console.warn("   ⚠️ Tailwind CSS no detectado");
    }

    // Verificar fuentes cargadías
    if ("fonts" in document) {
      (document as any).fonts.ready
        .then(() => {
          const loadedFonts = (document as any).fonts.values();
          console.log(`   Fuentes cargadías: ${Array.from(loadedFonts).length}`);
        })
        .catch(() => {
          console.warn("   ⚠️ No se pudo verificar fuentes");
        });
    }

    console.log(`\n📝 Logs capturados: ${logs.length}`);
    if (logs.length > 0 && logs.length <= 50) {
      console.table(logs);
    } else if (logs.length > 50) {
      console.log(
        `⚠️ Hay ${logs.length} logs (mostrando solo los primeros 50)`,
      );
      console.table(logs.slice(0, 50));
    }

    console.log(`\n📊 Total de eventos capturados: ${this.errors.length}`);
    console.log(
      `📊 Total de errores de recursos: ${this.resourceErrors.length}`,
    );
    console.log(
      `📊 Total de problemas de performance: ${this.performanceIssues.length}`,
    );
    console.groupEnd();

    return {
      errors,
      warnings,
      logs,
      resourceErrors: this.resourceErrors,
      performanceIssues: this.performanceIssues,
      chunks,
      stylesheets,
      total:
        this.errors.length +
        this.resourceErrors.length +
        this.performanceIssues.length,
      url: window.location.href,
      isTunnel,
      timestamp: new Date().toISOString(),
    };
  }
}

// Instancia global
let errorCapture: ConsoleErrorCapture | null = null;

export function startErrorCapture(): void {
  if (!errorCapture) {
    errorCapture = new ConsoleErrorCapture();
  }
  errorCapture.startCapture();
}

export function stopErrorCapture(): void {
  if (errorCapture) {
    errorCapture.stopCapture();
  }
}

export function getConsoleErrors(): ConsoleError[] {
  return errorCapture?.getErrors() || [];
}

export function showErrorReport(): {
  errors: ConsoleError[];
  warnings: ConsoleError[];
  logs: ConsoleError[];
  resourceErrors: ResourceError[];
  performanceIssues: PerformanceIssue[];
  chunks: any[];
  stylesheets: any[];
  total: number;
  url: string;
  isTunnel: boolean;
  timestamp: string;
} | null {
  return errorCapture?.showReport() || null;
}

export function clearConsoleErrors(): void {
  errorCapture?.clearErrors();
}

export function exportConsoleErrors(): string | null {
  return errorCapture?.exportErrors() || null;
}

/**
 * Muestra información del entorno de desarrollo en la consola.
 * Incluye URL, User Agent, modo de Vite, y estado de Tailwind/fuentes.
 */
export function showEnvInfo(): void {
  if (typeof window === "undefined") {
    console.log("Esta función solo está disponible en el navegador.");
    return;
  }

  console.group("ℹ️ Información de Entorno");
  console.log("📍 URL actual:", window.location.href);
  console.log("⏰ Fecha:", new Date().toISOString());
  console.log("🖥️ User Agent:", navigator.userAgent);

  const isTunnel =
    window.location.hostname.includes(".loca.lt") ||
    window.location.hostname.includes(".ngrok-free.app") ||
    window.location.hostname.includes(".trycloudflare.com");
  if (isTunnel) {
    console.log("🌐 Acceso vía túnel detectado.");
  }

  try {
    console.log("🔧 Modo:", import.meta.env?.MODE || "unknown");
    console.log("   - DEV:", import.meta.env?.DEV ?? false);
    console.log("   - PROD:", import.meta.env?.PROD ?? false);
  } catch {
    console.warn("⚠️ No se pudo acceder a import.meta.env");
  }

  // Verificar si Tailwind está cargado
  const tailwindLoaded =
    document.querySelector('style[data-vite-dev-id*="index"]') ||
    Array.from(document.styleSheets).some((sheet) => {
      try {
        return sheet.href?.includes("style.css") || false;
      } catch {
        return false;
      }
    });

  if (tailwindLoaded) {
    console.log("   ✅ Tailwind CSS detectado");
  } else {
    console.warn("   ⚠️ Tailwind CSS no detectado");
  }

  // Verificar fuentes cargadías
  if ("fonts" in document) {
    (document as any).fonts.ready
      .then(() => {
        const loadedFonts = Array.from((document as any).fonts.values());
        console.log(`   ✅ Fuentes cargadías: ${loadedFonts.length}`);
        if (loadedFonts.length > 0) {
          const fontFamilies = loadedFonts.map((font: any) => font.family);
          const uniqueFamilies = [...new Set(fontFamilies)];
          console.log("      - " + uniqueFamilies.join("\n      - "));
        }
      })
      .catch(() => {
        console.warn("   ⚠️ No se pudo verificar el estado de las fuentes.");
      });
  }

  console.groupEnd();
}

// Hacer disponible globalmente para uso en consola
// CRÍTICO: Asegurar que las funciones estén disponibles inmediatamente
if (typeof window !== "undefined") {
  // Función para exponer todías las funciones de forma robusta
  const exposeFunctions = () => {
    const functionsToExpose = {
      startErrorCapture,
      stopErrorCapture,
      getConsoleErrors,
      showErrorReport,
      clearConsoleErrors,
      exportConsoleErrors,
      showEnvInfo, // <-- Nueva función
    };

    for (const [name, func] of Object.entries(functionsToExpose)) {
      try {
        // Asignación directa es más robusta contra configuraciones de propiedad existentes
        (window as any)[name] = func;
      } catch {
        // Silenciar errores (pueden ser de extensiones de wallet que congelan el objeto window)
        console.warn(`No se pudo exponer la función '${name}' en window.`);
      }
    }
  };

  // Exponer inmediatamente
  exposeFunctions();

  // Re-exponer en momentos clave del ciclo de vida para máxima robustez
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", exposeFunctions);
  }

  window.addEventListener("load", exposeFunctions);

  // Reintentos para asegurar la disponibilidad
  setTimeout(exposeFunctions, 100);
  setTimeout(exposeFunctions, 500);
  setTimeout(exposeFunctions, 1500);

  // Iniciar captura automáticamente en desarrollo
  try {
    const isDev = import.meta.env?.DEV ?? false;

    if (isDev) {
      startErrorCapture();

      // Verificar y re-exponer después de iniciar captura
      setTimeout(() => {
        if (!(window as any).showErrorReport || !(window as any).showEnvInfo) {
          console.warn(
            "⚠️ Funciones de debug no disponibles, reintentando exposición...",
          );
          exposeFunctions();
        } else {
          console.log(
            "✅ Funciones de debug (showErrorReport, showEnvInfo) listas.",
          );
        }
      }, 200);
    }
  } catch {
    // Si import.meta no está disponible, no hacer nada.
  }
}

