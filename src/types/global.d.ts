/**
 * Declaraciones de tipos globales para resolver errores del IDE WindSurf
 * Versión: 3.6.3
 * Fecha: 11 Nov 2025
 */

// Declaraciones globales para el entorno del navegador
declare global {
  interface Navigator {
    cpuClass?: string;
    deviceMemory?: number;
    javaEnabled?: () => boolean;
  }

  interface Window {
    chrome?: object;
    safari?: object;
    InstallTrigger?: object;
    webkitAudioContext?: typeof AudioContext;
    __supabaseUser?: import("@supabase/supabase-js").User;
    __supabaseSession?: import("@supabase/supabase-js").Session;
  }
}

// Declaracin mnima para uuid (evita errores de tipos en entornos bundler)
declare module "uuid" {
  export function v4(): string;
}

export {};
