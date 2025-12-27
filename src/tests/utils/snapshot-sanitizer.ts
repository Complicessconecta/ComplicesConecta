/**
 * Snapshot Path Sanitizer
 * 
 * Sanitiza nombres de archivos de snapshots para evitar caracteres invÃ¡lidos
 * en sistemas de archivos (especialmente Windows).
 * 
 * Previene errores como "invalid path" o archivos corruptos por caracteres
 * como :, ", *, ?, <, >, |, etc.
 */

/**
 * Caracteres invÃ¡lidos en Windows: < > : " | ? * \ /
 * AdemÃ¡s evitamos nombres reservados y secuencias problemÃ¡ticas
 */
const INVALID_CHARS_REGEX = /[<>:"|?*\\/]/g;
const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
const WHITESPACE_REGEX = /\s+/g;
const MULTIPLE_DASHES = /-+/g;

/**
 * Sanitiza un nombre de archivo o ruta para que sea vÃ¡lido en todos los sistemas
 * 
 * @param filename - Nombre de archivo o ruta a sanitizar
 * @returns Nombre sanitizado seguro para el sistema de archivos
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed-snapshot';
  }

  let sanitized = filename
    // Reemplazar caracteres invÃ¡lidos por guiones
    .replace(INVALID_CHARS_REGEX, '-')
    // Reemplazar espacios mÃºltiples por un solo guiÃ³n
    .replace(WHITESPACE_REGEX, '-')
    // Eliminar puntos al inicio/final (problemÃ¡tico en Windows)
    .replace(/^\.+|\.+$/g, '')
    // Colapsar mÃºltiples guiones en uno solo
    .replace(MULTIPLE_DASHES, '-')
    // Eliminar guiones al inicio/final
    .replace(/^-+|-+$/g, '')
    // Limitar longitud (Windows tiene lÃ­mite de 260 caracteres para path completo)
    .slice(0, 200);

  // Verificar nombres reservados de Windows
  const nameWithoutExt = sanitized.replace(/\.[^.]+$/, '');
  if (RESERVED_NAMES.test(nameWithoutExt)) {
    sanitized = `_${sanitized}`;
  }

  // Fallback si quedÃ³ vacÃ­o
  return sanitized || 'unnamed-snapshot';
}

/**
 * Sanitiza la ruta completa de un snapshot, preservando la estructura de directorios
 * 
 * @param snapshotPath - Ruta completa del snapshot
 * @returns Ruta sanitizada
 */
export function sanitizeSnapshotPath(snapshotPath: string): string {
  if (!snapshotPath) {
    return snapshotPath;
  }

  // Separar en partes de ruta
  const isWin = process.platform === 'win32';
  const separator = isWin ? '\\' : '/';
  const parts = snapshotPath.split(/[/\\]/);

  // Sanitizar cada parte excepto la raÃ­z (drive letter en Windows)
  const sanitizedParts = parts.map((part, index) => {
    // En Windows, preservar drive letter (C:, D:, etc.)
    if (isWin && index === 0 && /^[a-zA-Z]:$/.test(part)) {
      return part;
    }
    // Sanitizar el resto de partes
    return sanitizeFilename(part);
  });

  return sanitizedParts.join(separator);
}

