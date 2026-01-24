/**
 * Logger simple para romper dependencia circular
 * No depende de supabase-logger ni sentry
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: LogContext;
  timestamp: string;
}

class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, metadata?: LogContext) {
    const entry = {
      level,
      message,
      metadata: metadata || undefined,
      timestamp: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
      console.log(`[${level.toUpperCase()}]`, message, entry.metadata);
    }
  }

  info(message: string, metadata?: LogContext) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: LogContext) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: LogContext) {
    this.log("error", message, metadata);
  }

  debug(message: string, metadata?: LogContext) {
    this.log("debug", message, metadata);
  }
}

export const logger = Logger.getInstance();

// Funciones de logging para compatibilidad
export const logError = (error: Error, context?: LogContext) => {
  logger.error(error.message, { ...context, stack: error.stack });
};

export const logApiCall = (endpoint: string, method: string, metadata?: LogContext) => {
  logger.info(`API ${method} ${endpoint}`, metadata);
};

export const logDatabaseOperation = (operation: string, metadata?: LogContext) => {
  logger.debug(`DB ${operation}`, metadata);
};
