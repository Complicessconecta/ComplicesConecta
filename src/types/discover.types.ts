import type { ProfileType, Gender } from "@/lib/media";

export interface Profile {
  id: string;
  name: string;
  age: number;
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
