import type { DashboardStats } from "@/app/(admin)/hooks/useAdminDashboard";
import { Card, CardContent } from "@/components/ui/Card";
import { Users, UserCheck, Heart, MessageSquare, Mail, Shield } from 'lucide-react';

interface StatsPanelProps {
  stats: DashboardStats;
}

const StatCard = ({ title, value, change, icon: Icon, changeColor, iconColor }: { title: string, value: string | number, change: string, icon: React.ElementType, changeColor: string, iconColor: string }) => (
  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs sm:text-sm">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
          <p className={`text-xs ${changeColor}`}>{change}</p>
        </div>
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
      </div>
    </CardContent>
  </Card>
);

export const StatsPanel = ({ stats }: StatsPanelProps) => {
  const statsCards = [
    { title: "Total Usuarios", value: stats.totalUsers, change: `+${stats.newUsersToday} hoy`, icon: Users, changeColor: "text-green-400", iconColor: "text-blue-400" },
    { title: "Usuarios Activos", value: stats.activeUsers, change: "Última semana", icon: UserCheck, changeColor: "text-blue-400", iconColor: "text-green-400" },
    { title: "Total Matches", value: stats.totalMatches, change: `+${stats.matchesToday} hoy`, icon: Heart, changeColor: "text-pink-400", iconColor: "text-pink-400" },
    { title: "Mensajes", value: stats.totalMessages, change: "Total enviados", icon: MessageSquare, changeColor: "text-blue-400", iconColor: "text-blue-400" },
    { title: "Solicitudes Carrera", value: stats.careerApplications, change: "Pendientes revisión", icon: Mail, changeColor: "text-orange-400", iconColor: "text-orange-400" },
    { title: "Solicitudes Moderador", value: stats.moderatorRequests, change: "En evaluación", icon: Shield, changeColor: "text-purple-400", iconColor: "text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
      {statsCards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
};

