import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  RefreshCw,
  ArrowLeft,
  Users,
  AlertTriangle,
  Activity,
} from "lucide-react";

import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { StatsPanel } from "@/components/admin/dashboard/StatsPanel";
import { OverviewPanel } from "@/components/admin/dashboard/OverviewPanel";
import { RecentActivityList } from "@/components/admin/dashboard/RecentActivityList";
import { ReportsPanel } from "@/components/admin/dashboard/ReportsPanel";
import { SystemHealthWidget } from "@/components/admin/dashboard/SystemHealthWidget";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState("7d");

  const {
    stats,
    userActivity,
    systemReports,
    loading,
    refreshing,
    loadDashboardData,
    setSystemReports,
  } = useAdminDashboard(dateRange);

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl mx-auto gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Volver
              </Button>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                Dashboard Administrativo v3.2
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadDashboardData}
                disabled={refreshing}
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 text-sm px-3 py-1.5"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
          <StatsPanel stats={stats} />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/10 backdrop-blur-md border-white/20">
              <TabsTrigger
                value="overview"
                className="text-white data-[state=active]:bg-white/20"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="text-white data-[state=active]:bg-white/20"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Usuarios</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="text-white data-[state=active]:bg-white/20"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reportes</span>
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="text-white data-[state=active]:bg-white/20"
              >
                <Activity className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sistema</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <OverviewPanel stats={stats} systemReports={systemReports} />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-end gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Hoy</SelectItem>
                    <SelectItem value="7d">7 días</SelectItem>
                    <SelectItem value="30d">30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <RecentActivityList activity={userActivity} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <ReportsPanel
                reports={systemReports}
                setSystemReports={setSystemReports}
              />
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <SystemHealthWidget />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

