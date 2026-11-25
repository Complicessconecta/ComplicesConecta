/**
 * DemoSelector - Componente para seleccionar tipo de cuenta demo
 * Fecha: 15 Noviembre 2025
 * Propósito: Permitir al usuario elegir entre cuenta Single o Pareja para modo demo
 * Evita el auto-login forzado y mejora la experiencia de usuario
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users, Sparkles, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { safeRemoveItem, safeSetItem } from "@/lib/safe-storage";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  listLocalDemoAccounts,
  restoreLocalDemoSession,
  type LocalDemoAccountRecord,
} from "@/lib/demo-registration";
import { resolveDemoAccountType } from "@/lib/app-config";

interface DemoSelectorProps {
  className?: string;
}

export const DemoSelector: React.FC<DemoSelectorProps> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"single" | "couple" | null>(
    null,
  );
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Ronda 9, stream D: cuentas demo creadas por registro en este
  // navegador (`cc_local_demo_accounts_v1`, sobrevive al logout).
  // Antes /demo solo ofrecía "Explorar como Single/Pareja" y las
  // cuentas creadas (TestR7, anonr8test, …) no se podían volver a
  // abrir tras cerrar sesión (test ronda 8: la lista rica de cuentas
  // ya no aparecía por ningún camino).
  const [localAccounts, setLocalAccounts] = useState<LocalDemoAccountRecord[]>(
    [],
  );
  useEffect(() => {
    setLocalAccounts(listLocalDemoAccounts());
  }, []);

  /**
   * Entrada con una cuenta demo local ya registrada (un clic, sin
   * contraseña: así es el diseño demo). Restaura la sesión con los
   * datos propios de la cuenta (no el perfil canónico de Sofía) y
   * navega a su perfil; es lo mismo que hace el login local de
   * `useAuth.signIn` cuando resuelve la cuenta del registro.
   */
  const handleLocalAccountLogin = (account: LocalDemoAccountRecord) => {
    if (isLoading) return;
    setIsLoading(true);
    setSelectedAccount(account.userId);
    try {
      restoreLocalDemoSession(account.profile);
      const type = resolveDemoAccountType(account.profile) ?? "single";
      // Escritura en crudo (restoreLocalDemoSession + safeSetItem):
      // NO usar los setters de usePersistedState aquí: serializan
      // con JSON.stringify y dejan userType como '"single"' (con
      // comillas), y todos los lectores (`getSessionFlags`,
      // EditProfileSingle/Couple, Dashboard) comparan en crudo
      // (`=== "single"` / `=== "couple"`). La sesión la lee la
      // siguiente página desde localStorage al montar.
      safeSetItem("demo_authenticated", "true", { validate: true });
      safeSetItem("userType", type, { validate: false });

      toast({
        title: "🎭 Modo Demo Activado",
        description: `Bienvenido de nuevo, ${account.nickname}`,
      });

      setTimeout(() => {
        navigate(type === "couple" ? "/profile-couple" : "/profile-single");
      }, 1000);
    } catch (error) {
      logger.error("Error entrando con cuenta demo local", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "❌ Error",
        description: "No se pudo entrar con esa cuenta demo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedAccount(null);
    }
  };

  // Estado persistente para demo
  const [, setDemoAuthenticated] = usePersistedState<boolean>(
    "demo_authenticated",
    false,
  );
  const [, setUserType] = usePersistedState<string>("userType", "");

  /**
   * Maneja el inicio de sesión demo según el tipo seleccionado
   * @param type - Tipo de cuenta: 'single' o 'couple'
   */
  const handleDemoLogin = async (type: "single" | "couple") => {
    setIsLoading(true);
    setSelectedType(type);

    try {
      const demoEmail =
        type === "couple" ? "pareja@outlook.es" : "single@outlook.es";

      // C4/C5 (2026-11-19): modo demo sin contraseña. Ya no se lee ninguna
      // VITE_DEMO_PASSWORD_* ni existe el fallback literal "demo".
      // El demo es local, nunca admin; el login real es Supabase Auth.
      await signIn(demoEmail, "", type);

      // Establecer estado demo SOLO si signIn fue exitoso
      setDemoAuthenticated(true);
      setUserType(type);

      // Persistir flags demo
      safeSetItem("demo_authenticated", "true", { validate: true });
      safeSetItem("userType", type, { validate: false });

      toast({
        title: "🎭 Modo Demo Activado",
        description: `Bienvenido al modo demo como ${type === "single" ? "Usuario Single" : "Pareja"}`,
      });

      // Navegar según el tipo de cuenta
      setTimeout(() => {
        if (type === "couple") {
          navigate("/profile-couple");
        } else {
          navigate("/profile-single");
        }
      }, 1000);
    } catch (error) {
      logger.error("Error en demo login", {
        error: error instanceof Error ? error.message : String(error),
      });

      // Rollback: evitar sesión demo a medias
      setDemoAuthenticated(false);
      setUserType("");
      safeRemoveItem("demo_authenticated");
      safeRemoveItem("demo_user");
      safeRemoveItem("userType");

      toast({
        title: "❌ Error",
        description: "No se pudo activar el modo demo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedType(null);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/30 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-purple-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
            Modo Demo
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-white/90 text-lg mt-2">
            Selecciona el tipo de cuenta demo que deseas explorar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Descripción del modo demo */}
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
            <p className="text-slate-600 dark:text-white/90 text-sm leading-relaxed">
              <strong>💡 Modo Demo:</strong> Explora ComplicesConecta sin crear
              una cuenta. Puedes navegar por la aplicación, ver perfiles de
              ejemplo y probar todas las funcionalidades.
            </p>
          </div>

          {/* Grid de opciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opción Single */}
            <Card
              className={`
                cursor-pointer transition-all duration-300 transform hover:scale-105
                ${selectedType === "single" ? "ring-4 ring-purple-500 bg-purple-500/20" : "bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10"}
                border-2 border-slate-300 dark:border-white/20 hover:border-purple-400
              `}
              onClick={() => !isLoading && handleDemoLogin("single")}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-purple-500/30 rounded-full">
                    <User className="h-12 w-12 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      👤 Usuario Single
                    </h3>
                    <p className="text-slate-600 dark:text-white/80 text-sm">
                      Explora como usuario individual buscando conexiones y
                      experiencias
                    </p>
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin("single");
                    }}
                  >
                    {isLoading && selectedType === "single" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cargando...
                      </>
                    ) : (
                      <>
                        Explorar como Single
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Opción Pareja */}
            <Card
              className={`
                cursor-pointer transition-all duration-300 transform hover:scale-105
                ${selectedType === "couple" ? "ring-4 ring-pink-500 bg-pink-500/20" : "bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10"}
                border-2 border-slate-300 dark:border-white/20 hover:border-pink-400
              `}
              onClick={() => !isLoading && handleDemoLogin("couple")}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-pink-500/30 rounded-full">
                    <Users className="h-12 w-12 text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      💑 Pareja
                    </h3>
                    <p className="text-slate-600 dark:text-white/80 text-sm">
                      Descubre la experiencia como pareja buscando otras parejas
                      o singles
                    </p>
                  </div>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin("couple");
                    }}
                  >
                    {isLoading && selectedType === "couple" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cargando...
                      </>
                    ) : (
                      <>
                        Explorar como Pareja
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Nota informativa */}
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
            <p className="text-slate-600 dark:text-white/90 text-xs leading-relaxed">
              <strong>ℹ️ Nota:</strong> Los datos en modo demo son ficticios y
              no se guardarán. Para una experiencia completa, crea una cuenta
              real desde el botón "Registrarse".
            </p>
          </div>

          {/* Ronda 9, stream D: cuentas demo locales de este navegador.
              Sin esta sección, tras cerrar sesión no había forma de
              volver a entrar con una cuenta creada por registro. */}
          {localAccounts.length > 0 && (
            <div className="rounded-lg border border-white/20 bg-white/5 p-4">
              <h3 className="text-lg font-semibold text-white mb-1">
                Tus cuentas demo en este navegador
              </h3>
              <p className="text-white/70 text-xs mb-3">
                Cuentas creadas por registro en este dispositivo. Un clic para
                entrar, sin contraseña.
              </p>
              <ul className="space-y-2">
                {localAccounts.map((account) => {
                  const type =
                    resolveDemoAccountType(account.profile) ?? "single";
                  const displayName =
                    (typeof account.profile.display_name === "string" &&
                      account.profile.display_name) ||
                    account.nickname;
                  return (
                    <li
                      key={account.userId}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {displayName}
                          {account.isAnonymous && (
                            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-100 border border-purple-400/40">
                              Anónimo
                            </span>
                          )}
                          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20">
                            {type === "couple" ? "Pareja" : "Single"}
                          </span>
                        </p>
                        <p className="text-white/60 text-xs truncate">
                          {account.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleLocalAccountLogin(account)}
                        className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                      >
                        {isLoading && selectedAccount === account.userId ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Cargando...
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4 mr-1" />
                            Entrar
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Botón para volver */}
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
              onClick={() => navigate("/")}
              disabled={isLoading}
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoSelector;
