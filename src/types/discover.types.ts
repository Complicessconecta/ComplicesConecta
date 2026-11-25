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
}
