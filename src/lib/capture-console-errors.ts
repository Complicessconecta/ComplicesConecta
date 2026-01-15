/**
 * Utilidad para capturar y mostrar errores de consola
 * Versión: 3.5.1
 *
 * Uso: Importar y llamar startErrorCapture() en la consola del navegador
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

class ConsoleErrorCapture {
  private errors: ConsoleError[] = [];
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;

  constructor() {
    this.originalError = console.error;
    this.originalWarn = console.warn;
  }

  startCapture(): void {
    if (typeof window === "undefined") return;

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
  }
}

const errorCapture = new ConsoleErrorCapture();

export const startErrorCapture = () => errorCapture.startCapture();
