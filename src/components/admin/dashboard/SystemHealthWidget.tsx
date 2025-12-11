import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Activity, Settings, Shield, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SystemHealthWidget = () => {
  const navigate = useNavigate();

  // Esta data es estática o podría venir de un endpoint de health check en el futuro
  const systemStatus = [
    { name: "Base de Datos", status: "Operativo", color: "bg-green-500" },
    { name: "API", status: "Operativo", color: "bg-green-500" },
    { name: "Notificaciones", status: "Operativo", color: "bg-green-500" },
    { name: "Almacenamiento", status: "Advertencia", color: "bg-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemStatus.map(service => (
            <div key={service.name} className="flex justify-between items-center">
              <span className="text-white/80">{service.name}</span>
              <Badge className={service.color}>{service.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => navigate('/admin/moderators')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Shield className="h-4 w-4 mr-2" />
            Gestionar Moderadores
          </Button>
          <Button
            onClick={() => navigate('/admin/career-applications')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Solicitudes de Carrera
          </Button>
          <Button
            onClick={() => window.location.reload()} // Simplificado para recargar la página
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos (Recargar)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
