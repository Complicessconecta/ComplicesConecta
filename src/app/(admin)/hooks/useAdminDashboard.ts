import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/useToast";
import type { Profile, Match } from "@/types/supabase-extensions";

// Interfaces para los datos del dashboard
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalMessages: number;
  reportsCount: number;
  moderatorsCount: number;
  newUsersToday: number;
  matchesToday: number;
  careerApplications: number;
  moderatorRequests: number;
}

export interface UserActivity extends Profile {
  is_active: boolean;
  email?: string;
}

// NOTE: This is simulated data and does not match the 'reports' table schema.
// Keeping it as a local type for now.
export interface SystemReport {
  id: string;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
  resolved: boolean;
}

export const useAdminDashboard = (dateRange: string) => {
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    reportsCount: 0,
    moderatorsCount: 0,
    newUsersToday: 0,
    matchesToday: 0,
    careerApplications: 0,
    moderatorRequests: 0,
  });

  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [systemReports, setSystemReports] = useState<SystemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      if (!supabase) {
        logger.error("Supabase no está disponible");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalUsers = usersData?.length || 0;
      const newUsersToday =
        usersData?.filter((u) => u.created_at && new Date(u.created_at) >= today).length || 0;
      const activeUsers =
        usersData?.filter(
          (u) => u.updated_at && new Date(u.updated_at) >= weekAgo,
        ).length || 0;

      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id, created_at");
      if (matchesError) throw matchesError;

      const matches = (matchesData || []) as Match[];
      const totalMatches = matches.length;
      const matchesToday = matches.filter(
        (m) => m.created_at && new Date(m.created_at) >= today,
      ).length;

      const { count: messagesCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true });
      const totalMessages = messagesCount || 0;

      const { count: reportsCount } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false);
      const { count: moderatorsCount } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "moderator");
      const { count: careerApplications } = await supabase
        .from("career_applications")
        .select("id", { count: "exact", head: true });
      const { count: moderatorRequests } = await supabase
        .from("moderator_requests")
        .select("id", { count: "exact", head: true });

      setStats({
        totalUsers,
        activeUsers,
        totalMatches,
        totalMessages,
        reportsCount: reportsCount || 0,
        moderatorsCount: moderatorsCount || 0,
        newUsersToday,
        matchesToday,
        careerApplications: careerApplications || 0,
        moderatorRequests: moderatorRequests || 0,
      });

      const { data: recentUsers, error: recentUsersError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (!recentUsersError && recentUsers) {
        const recentProfiles = (recentUsers || []) as Profile[];
        setUserActivity(
          recentProfiles.map((u) => ({
            ...u,
            full_name: u.full_name || "Usuario",
            email: "", // Email is not available on the profiles table
            is_active: u.updated_at ? new Date(u.updated_at) >= weekAgo : false,
          })),
        );
      }

      // Datos simulados para reportes del sistema
      setSystemReports([
        {
          id: "1",
          type: "security",
          message: "Múltiples intentos de login fallidos detectados",
          severity: "medium",
          created_at: new Date().toISOString(),
          resolved: false,
        },
        {
          id: "2",
          type: "performance",
          message: "Tiempo de respuesta de la base de datos elevado",
          severity: "low",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          resolved: false,
        },
        {
          id: "3",
          type: "content",
          message: "Contenido inapropiado reportado por usuarios",
          severity: "high",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          resolved: false,
        },
      ]);
    } catch (error) {
      logger.error("Error loading dashboard data:", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    stats,
    userActivity,
    systemReports,
    loading,
    refreshing,
    loadDashboardData,
    setSystemReports,
  };
};
