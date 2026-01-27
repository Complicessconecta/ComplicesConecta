/**
 * Tipos para Datadog RUM
 * Definiciones de tipos para evitar uso de 'any'
 */

export interface DatadogRUM {
  clearUser(): void;
  setUser(user: {
    id: string;
    name?: string;
    email?: string;
    [key: string]: unknown;
  }): void;
  addAction(action: {
    name: string;
    context?: Record<string, unknown>;
  }): void;
  addError(error: Error | unknown, context?: Record<string, unknown>): void;
  startView(name: string, context?: Record<string, unknown>): void;
  stopView(name: string, context?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    DD_RUM?: DatadogRUM;
  }
}

export {};
