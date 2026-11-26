import type { ProfileType, Gender } from "@/lib/media";

export interface Profile {
  id: string;
  name: string;
  age: number;
  // Edad del segundo miembro (parejas demo): se muestra "25 y 28 años".
  partnerAge?: number;
  location: string;
  distance: number;
  interests: string[];
  image: string;
  bio: string;
  isOnline: boolean;
  lastActive: string;
  isVerified: boolean;
  isPremium: boolean;
  /**
   * Ronda 9 (stream A, punto 3): perfil anónimo (columna real
   * `is_anonymous`). Solo visible en Discover para espectadores
   * verificados, con insignia "Anónimo".
   */
  isAnonymous?: boolean;
  rating: number;
  matchScore: number;
  profileType: ProfileType;
  gender?: Gender;
}

export interface Filters {
  ageRange: [number, number];
  distance: number;
  interests: string[];
  verified: boolean;
  premium: boolean;
  online: boolean;
  relationshipType: string[];
  /**
   * Ronda 13 (stream B, B2): compatibilidad mínima exigida (0–100,
   * contra `Profile.matchScore` / `DemoProfile.matchScore`). El
   * control no existía en ningún panel de filtros (la cadena
   * "Compatibilidad mínima" no estaba en el árbol): 0 = sin filtro.
   */
  minCompatibility: number;
}
