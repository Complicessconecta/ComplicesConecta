// Servicio de geolocalización con privacidad (offset de 1km)
// Fase 7: Geolocalización con Privacidad

import { logger } from "@/lib/logger";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrivacyProtectedLocation extends Coordinates {
  originalLatitude: number;
  originalLongitude: number;
  offsetKm: number;
}

export class GeolocationService {
  private static instance: GeolocationService;

  // Radio de offset en kilómetros (1km para privacidad)
  private readonly PRIVACY_OFFSET_KM = 1;

  // Radio de la Tierra en kilómetros
  private readonly EARTH_RADIUS_KM = 6371;

  private constructor() {}

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Aplicar offset aleatorio de 1km para proteger privacidad
   */
  applyPrivacyOffset(
    latitude: number,
    longitude: number
  ): PrivacyProtectedLocation {
    // Generar ángulo aleatorio (0-360 grados)
    const angle = Math.random() * 2 * Math.PI;

    // Calcular offset en grados
    // 1 km = 1/6371 grados aproximadamente
    const offsetDegrees = this.PRIVACY_OFFSET_KM / this.EARTH_RADIUS_KM;

    // Aplicar offset
    const offsetLatitude = latitude + offsetDegrees * Math.cos(angle);
    const offsetLongitude = longitude + offsetDegrees * Math.sin(angle);

    return {
      latitude: offsetLatitude,
      longitude: offsetLongitude,
      originalLatitude: latitude,
      originalLongitude: longitude,
      offsetKm: this.PRIVACY_OFFSET_KM,
    };
  }

  /**
   * Calcular distancia entre dos coordenadas (Haversine formula)
   */
  calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
  ): number {
    const R = this.EARTH_RADIUS_KM;
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Obtener clubes dentro de un radio específico
   */
  async getClubsWithinRadius(
    center: Coordinates,
    radiusKm: number,
    limit: number = 20
  ): Promise<Array<{ id: string; name: string; latitude: number; longitude: number }>> {
    try {
      // Convertir radio a grados
      const radiusDegrees = radiusKm / this.EARTH_RADIUS_KM;

      // Buscar clubes en el área
      const { data, error } = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/clubs?select=id,name,latitude,longitude&latitude=gte.${center.latitude - radiusDegrees}&latitude=lte.${center.latitude + radiusDegrees}&longitude=gte.${center.longitude - radiusDegrees}&longitude=lte.${center.longitude + radiusDegrees}&limit=${limit}`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        }
      ).then((res) => res.json());

      if (error) throw error;

      // Filtrar por distancia exacta y ordenar
      const clubs = (data || [])
        .map((club: { id: string; name: string; latitude: number; longitude: number }) => ({
          id: club.id,
          name: club.name,
          latitude: club.latitude,
          longitude: club.longitude,
        }))
        .filter((club: { id: string; name: string; latitude: number; longitude: number }) => {
          const distance = this.calculateDistance(center, club);
          return distance <= radiusKm;
        })
        .sort(
          (
            a: { id: string; name: string; latitude: number; longitude: number },
            b: { id: string; name: string; latitude: number; longitude: number }
          ) => {
          const distanceA = this.calculateDistance(center, a);
          const distanceB = this.calculateDistance(center, b);
          return distanceA - distanceB;
          }
        );

      return clubs;
    } catch (error) {
      logger.error('Error obteniendo clubes dentro del radio:', {
        error: error instanceof Error ? error.message : String(error),
        center,
        radiusKm,
      });
      throw error;
    }
  }

  /**
   * Buscar clubes en un bounding box
   */
  async searchClubsInBoundingBox(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    limit: number = 20
  ): Promise<Array<{ id: string; name: string; latitude: number; longitude: number }>> {
    try {
      const { data, error } = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/clubs?select=id,name,latitude,longitude&latitude=gte.${bounds.south}&latitude=lte.${bounds.north}&longitude=gte.${bounds.west}&longitude=lte.${bounds.east}&limit=${limit}`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        }
      ).then((res) => res.json());

      if (error) throw error;

      return (data || []).map(
        (club: { id: string; name: string; latitude: number; longitude: number }) => ({
          id: club.id,
          name: club.name,
          latitude: club.latitude,
          longitude: club.longitude,
        })
      );
    } catch (error) {
      logger.error('Error buscando clubes en bounding box:', {
        error: error instanceof Error ? error.message : String(error),
        bounds,
      });
      throw error;
    }
  }

  /**
   * Convertir grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcular bounding box para un centro y radio
   */
  calculateBoundingBox(
    center: Coordinates,
    radiusKm: number
  ): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const radiusDegrees = radiusKm / this.EARTH_RADIUS_KM;

    return {
      north: center.latitude + radiusDegrees,
      south: center.latitude - radiusDegrees,
      east: center.longitude + radiusDegrees,
      west: center.longitude - radiusDegrees,
    };
  }
}

export const geolocationService = GeolocationService.getInstance();
