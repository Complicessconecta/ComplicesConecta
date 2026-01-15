/**
 * Tipos e interfaces compartidos para páginas de administración
 * Este archivo centraliza los tipos para evitar duplicación entre Admin.tsx y AdminProduction.tsx
 */

export interface AdminProfile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  location: string | null;
  email: string;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  last_seen: string | null;
  avatar_url: string | null;
  bio: string | null;
  relationship_type: "single" | "couple" | null;
  gender: string | null;
  interested_in: string | null;
}

export interface AdminAppStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalMatches: number;
  apkDownloads: number;
  dailyVisits: number;
  totalTokens: number;
  stakedTokens: number;
  worldIdVerified: number;
  rewardsDistributed: number;
  totalNotifications?: number;
  unreadNotifications?: number;
  systemAlerts?: number;
  moderationQueue?: number;
}

export interface AdminInvitation {
  id: string;
  from_profile: string;
  to_profile: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
  decided_at: string | null;
}

export interface NotificationStats {
  id: string;
  type: string;
  title: string;
  message: string;
  user_id: string;
  read: boolean;
  created_at: string;
  user_email?: string;
}

export interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
  resolved: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  created_at: string;
}
