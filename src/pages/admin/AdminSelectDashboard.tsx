import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Building, ArrowRight, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";

export const AdminSelectDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleAdminPanel = () => {
    logger.info("Admin seleccionó panel de administración");
    navigate("/admin/dashboard");
  };

  const handleClubsDemo = () => {
    logger.info("Admin seleccionó demo de clubs");
    navigate("/clubs/demo");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      logger.error("Error al cerrar sesión:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="bg-linear-to-r from-purple-400 to-fuchsia-500 text-white font-bold mb-4">
            <Shield className="h-4 w-4 mr-2" />
            Panel de Administración
          </Badge>
          <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white mb-6 leading-tight">
            Bienvenido,
            <span className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}
              {user?.email || "Admin"}
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-2">
            Selecciona el panel al que deseas acceder para gestionar la plataforma
          </p>
          <p className="text-sm text-white/70 max-w-3xl mx-auto">
            Acceso administrativo con datos reales (producción)
          </p>
        </motion.div>

        {/* Dashboard Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Admin Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-linear-to-br from-indigo-900/40 to-violet-900/40 backdrop-blur-xl border-white/20 shadow-2xl hover:border-purple-400/50 transition-all duration-300 cursor-pointer h-full group"
                  onClick={handleAdminPanel}>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-linear-to-r from-indigo-500 to-violet-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  Panel de Administración
                </CardTitle>
                <CardDescription className="text-white/70 text-base">
                  Gestiona usuarios, moderación, analytics y configuración general de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">Gestión de usuarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">Moderación de contenido</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">Analytics y métricas</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">Configuración del sistema</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Clubs Demo */}
          {!import.meta.env.PROD && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card
                className="bg-linear-to-br from-purple-900/40 to-fuchsia-900/40 backdrop-blur-xl border-white/20 shadow-2xl hover:border-fuchsia-400/50 transition-all duration-300 cursor-pointer h-full group"
                onClick={handleClubsDemo}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-linear-to-r from-purple-500 to-fuchsia-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Clubs Demo
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    Visualiza la experiencia de clubs en entorno demo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="w-2 h-2 bg-fuchsia-400 rounded-full" />
                      <span className="text-sm">Vista previa de clubs</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="w-2 h-2 bg-fuchsia-400 rounded-full" />
                      <span className="text-sm">Catálogo y filtros</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="w-2 h-2 bg-fuchsia-400 rounded-full" />
                      <span className="text-sm">Panel demo para clubes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </motion.div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-white/40 text-sm">
            Acceso restringido • Solo personal autorizado
          </p>
        </motion.div>
      </div>
    </div>
  );
};
