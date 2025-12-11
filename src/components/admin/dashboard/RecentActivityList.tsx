import type { UserActivity } from "@/app/(admin)/hooks/useAdminDashboard";
import { Badge } from "@/components/ui/badge";

interface RecentActivityListProps {
  activity: UserActivity[];
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
};

export const RecentActivityList = ({ activity }: RecentActivityListProps) => {
  return (
    <div className="space-y-3">
      {activity.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
            <div>
              <p className="text-white font-medium">{user.full_name || user.email}</p>
              <p className="text-white/60 text-sm">
                Último acceso: {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
              </p>
            </div>
          </div>
          <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {user.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      ))}
    </div>
  );
};
