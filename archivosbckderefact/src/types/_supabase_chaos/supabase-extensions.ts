import type { Database as DB } from './supabase-generated';

// Helper types
export type Tables<T extends keyof DB['public']['Tables']> = DB['public']['Tables'][T]['Row'];
export type Enums<T extends keyof DB['public']['Enums']> = DB['public']['Enums'][T];

// Exported table types
export type Profile = Tables<'profiles'>;
export type CoupleProfile = Tables<'couple_profiles'>;
export type Match = Tables<'matches'>;
export type Message = Tables<'messages'>;
export type Report = Tables<'reports'>;
export type UserRole = Tables<'user_roles'>;
export type CareerApplication = Tables<'career_applications'>;
export type ModeratorRequest = Tables<'moderator_requests'>;
export type Story = Tables<'stories'>;
export type Club = Tables<'clubs'>;

// Extended or custom types can be defined here as well.
// For example, if a profile needs to be combined with user data:
export interface ProfileWithUser extends Profile {
  email?: string;
}
