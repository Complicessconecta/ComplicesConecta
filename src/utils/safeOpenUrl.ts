/**
 * safeOpenUrl - Helper function para abrir URLs de forma segura
 *
 * Previene:
 * - Tabnapping (la nueva ventana puede acceder a la ventana opener)
 * - Phishing (la nueva ventana puede manipular la URL de la ventana opener)
 * - XSS (la nueva ventana puede ejecutar código en el contexto de la ventana opener)
 *
 * @param url - La URL a abrir
 * @param target - El target de la ventana (por defecto "_blank")
 * @returns void
 */
export function safeOpenUrl(url: string, target: string = "_blank"): void {
  window.open(url, target, "noopener,noreferrer");
}
