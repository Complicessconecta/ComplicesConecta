/**
 * Declaraciones de tipos globales para resolver errores del IDE WindSurf
 * Versión: 3.6.3
 * Fecha: 11 Nov 2025
 */

// Declaraciones globales para el entorno del navegador
declare global {}

// Declaracin mnima para uuid (evita errores de tipos en entornos bundler)
declare module "uuid" {
  export function v4(): string;
}

export {};
