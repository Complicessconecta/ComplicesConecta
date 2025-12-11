import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Download,
  Users,
  Heart,
  AlertTriangle,
} from "lucide-react";
import type {
  DashboardStats,
  SystemReport,
} from "@/app/(admin)/hooks/useAdminDashboard";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

interface OverviewPanelProps {
  stats: DashboardStats;
  systemReports: SystemReport[];
}

export const OverviewPanel = ({ stats, systemReports }: OverviewPanelProps) => {
  const { toast } = useToast();

  const exportData = async (type: string) => {
    try {
      if (!supabase) {
        logger.error("Supabase no está disponible");
        toast({
          title: "Error",
          description: "Supabase no está disponible",
          variant: "destructive",
        });
        return;
      }

      let data: unknown[] = [];
      let filename = "";

      switch (type) {
        case "users": {
          const { data: usersData } = await supabase
            .from("profiles")
            .select("*");
          data = usersData || [];
          filename = "usuarios_export.json";
          break;
        }
        case "matches": {
          const { data: matchesData } = await supabase
            .from("matches")
            .select("*");
          data = matchesData || [];
          filename = "matches_export.json";
          break;
        }
        case "reports": {
          data = systemReports;
          filename = "reportes_export.json";
          break;
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a") as HTMLAnchorElement;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a as unknown as Node);
      a.click();
      document.body.removeChild(a as unknown as Node);
      URL.revokeObjectURL(url);

      toast({
        title: "Éxito",
        description: `Datos exportados como ${filename}`,
      });
    } catch (error) {
      logger.error("Error exporting data:", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estadísticas Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/80">Reportes Pendientes</span>
            <Badge className="bg-red-500 text-white">
              {stats.reportsCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">Moderadores Activos</span>
            <Badge className="bg-green-500 text-white">
              {stats.moderatorsCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/80">Tasa de Conversión</span>
            <Badge className="bg-blue-500">
              {stats.totalUsers > 0
                ? ((stats.totalMatches / stats.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => exportData("users")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Exportar Usuarios
          </Button>
          <Button
            onClick={() => exportData("matches")}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Heart className="h-4 w-4 mr-2" />
            Exportar Matches
          </Button>
          <Button
            onClick={() => exportData("reports")}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Exportar Reportes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

