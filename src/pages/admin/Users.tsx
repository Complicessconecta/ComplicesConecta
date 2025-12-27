import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/hooks/useToast';

const AdminUsers = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated()) {
      toast({
        title: "Acceso Denegado",
        description: "Debe iniciar sesión para acceder al panel de administración",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!isAdmin()) {
      toast({
        title: "Acceso Denegado",
        description: "No tiene permisos de administrador",
        variant: "destructive"
      });
      navigate('/discover');
      return;
    }
  }, [loading, isAuthenticated, isAdmin, navigate, toast]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 mt-16">
        <h1 className="text-3xl font-bold mb-8">Gestión de Usuarios</h1>
        <UserManagementPanel />
      </div>
    </div>
  );
};

export default AdminUsers;

