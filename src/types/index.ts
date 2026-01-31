// Core application types for ComplicesConecta
// Replaces 'any' usage throughout the codebase

export type UserRole = "admin" | "user" | "demo";

export type Gender = "male" | "female" | "non-binary" | "other";
export type ProfileType = "single" | "couple";
export type Theme = "elegant" | "modern" | "vibrant";

export type InterestedIn = "men" | "women" | "both" | "non-binary";

// Profile types aligned with Supabase schema
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  age: number;
  bio: string | null;
  gender: Gender;
  interested_in: InterestedIn;
  is_premium: boolean | null;
  is_verified: boolean | null;
  is_demo?: boolean;
  relationship_type: ProfileType;
  profile_type?: string;
  role?: 'admin' | 'user' | 'demo';
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  location?: string | null;
  is_online?: boolean;
  privateImages?: string[];
  created_at: string;
  updated_at: string;
  user_id: string | null;
  latitude: number | null;
  longitude: number | null;
  share_location: boolean;
}

// Extended profile for UI components (includes non-Supabase fields)
export interface ExtendedProfile extends Profile {
  location?: string;
  profession?: string;
  interests?: string[];
  avatar?: string;
  photos?: string[];
  isOnline?: boolean;
  stats?: {
    matches: number;
    likes: number;
    views: number;
  };
}
