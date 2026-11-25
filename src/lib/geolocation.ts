/**
 * Geolocalización aproximada para matching (punto 3).
 *
 * Reglas de Wacko:
 * - La distancia que se muestra es APROXIMADA en km, nunca la exacta.
 * - Rango mínimo 1 km: aunque dos perfiles estén a 200 m, se muestra
 *   "A ~1 km".
 * - El usuario puede desactivar la geolocalización en Privacidad: si
 *   está desactivada, su distancia NO se muestra a nadie.
 *
 * Aproximación: por debajo de 10 km se redondea al km entero; a partir
 * de 10 km se redondea al múltiplo de 5 más cercano. Así la cifra
 * visible nunca es la distancia real calculada.
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/** Distancia exacta en km (Haversine). Solo para cálculo interno. */
export function haversineKm(
  a: GeoCoordinates | null | undefined,
  b: GeoCoordinates | null | undefined,
): number | null {
  if (!a || !b) return null;
  if (
    !Number.isFinite(a.latitude) ||
    !Number.isFinite(a.longitude) ||
    !Number.isFinite(b.latitude) ||
    !Number.isFinite(b.longitude)
  ) {
    return null;
  }
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Distancia APROXIMADA a mostrar. null si no hay coordenadas.
 * Mínimo 1 km; <10 km al entero, >=10 km al múltiplo de 5.
 */
export function approximateDistanceKm(
  exactKm: number | null | undefined,
): number | null {
  if (exactKm === null || exactKm === undefined) return null;
  if (!Number.isFinite(exactKm) || exactKm < 0) return null;
  if (exactKm < 10) return Math.max(1, Math.round(exactKm));
  return Math.max(1, Math.round(exactKm / 5) * 5);
}

/** "A ~12 km". "" si no hay distancia que mostrar. */
export function formatApproximateDistance(
  exactKm: number | null | undefined,
): string {
  const approx = approximateDistanceKm(exactKm);
  if (approx === null) return "";
  return `A ~${approx} km`;
}

/**
 * Ajuste "compartir mi ubicación para matching" del usuario.
 *
 * Fuente: columna `location_sharing_enabled` (migración
 * 20261124050000, aún sin aplicar en producción) con respaldo en
 * localStorage `geo_sharing:<userId>` (por defecto: activada).
 * Este lib NO toca `src/lib/visibility.ts`: la opción vive aquí
 * porque la columna es nueva y su dueño es este flujo.
 */
export function locationSharingStorageKey(userId: string): string {
  return `geo_sharing:${userId}`;
}

export function readLocationSharingLocal(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return true;
  try {
    const raw = window.localStorage.getItem(locationSharingStorageKey(userId));
    if (raw === null) return true;
    return raw !== "false";
  } catch {
    return true;
  }
}

export function writeLocationSharingLocal(
  userId: string,
  enabled: boolean,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(
      locationSharingStorageKey(userId),
      enabled ? "true" : "false",
    );
  } catch {
    // Sin almacenamiento: el cambio solo vive en esta sesión.
  }
}

/**
 * ¿Se puede mostrar la distancia de este perfil a este espectador?
 * Ambas partes deben tener la geolocalización activada; si el
 * perfil listado la tiene desactivada, su distancia no se muestra.
 */
export function canShowDistance(
  profileSharesLocation: boolean,
  viewerSharesLocation: boolean,
): boolean {
  return profileSharesLocation === true && viewerSharesLocation === true;
}
