import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Fingerprint,
  KeyRound,
  MapPin,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { LocationSettings } from "@/components/settings/LocationSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PinSettings } from "@/components/settings/PinSettings";
import { BiometricSettings } from "@/components/settings/BiometricSettings";

/**
 * Página real de Configuración (/settings).
 * Antes la ruta /settings renderizaba SwingerDashboard (el dashboard con
 * sus estadísticas primero y la configuración abajo), por eso el test
 * veía "Dashboard Swinger" antes que "Configuración" y la ruta
 * /swinger-dashboard era 404. Ahora /settings es solo configuración y
 * /swinger-dashboard tiene su propia ruta.
 */
const Settings = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("privacy");

  return (
    <div className="min-h-dvh relative overflow-x-hidden">
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="outline"
            onClick={() => {
              // Único "Volver" de la página (la píldora fija global ya no
              // se renderiza en /settings): navigate(-1) no hace nada si
              // se entró directo (sin historial); en ese caso ir al
              // inicio, que es lo que promete el botón.
              const idx = (window.history.state as { idx?: number } | null)
                ?.idx;
              if (typeof idx === "number" && idx > 0) navigate(-1);
              else navigate("/");
            }}
            className="border-slate-300 text-slate-900 hover:bg-slate-100 dark:border-white/30 dark:text-white dark:hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inicio
          </Button>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Configuración
          </h1>
          <p className="text-slate-600 dark:text-white/70 mb-8">
            Gestiona tu privacidad, ubicación, notificaciones y seguridad.
          </p>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            {/* Ronda 15 (stream C): sin overrides de color — los
                defaults de TabsList/TabsTrigger ya son opacos en ambos
                temas (ronda 10, B2). Los overrides `text-white/70` y
                `data-[state=active]:text-white` dejaban la pestaña
                activa blanca sobre fondo blanco en tema claro. */}
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-1.5" />
                Privacidad
              </TabsTrigger>
              <TabsTrigger value="location">
                <MapPin className="h-4 w-4 mr-1.5" />
                Ubicación
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-1.5" />
                Avisos
              </TabsTrigger>
              <TabsTrigger value="pin">
                <KeyRound className="h-4 w-4 mr-1.5" />
                PIN
              </TabsTrigger>
              <TabsTrigger value="biometric">
                <Fingerprint className="h-4 w-4 mr-1.5" />
                Biometría
              </TabsTrigger>
            </TabsList>

            <TabsContent value="privacy" className="mt-6">
              <PrivacySettings />
            </TabsContent>
            <TabsContent value="location" className="mt-6">
              <LocationSettings />
            </TabsContent>
            <TabsContent value="notifications" className="mt-6">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="pin" className="mt-6">
              <PinSettings />
            </TabsContent>
            <TabsContent value="biometric" className="mt-6">
              <BiometricSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Settings;
