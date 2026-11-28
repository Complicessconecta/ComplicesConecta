/**
 * DemoSelector - Componente para seleccionar tipo de cuenta demo
 * Fecha: 15 Noviembre 2025
 * Propósito: Permitir al usuario elegir entre cuenta Single o Pareja para modo demo
 * Evita el auto-login forzado y mejora la experiencia de usuario
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users, Sparkles, ArrowRight, LogIn, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ComplianceSignupForm } from "@/components/modals/compliance-signup-form";
import { canCreateAnonymousAccountOnDevice } from "@/lib/anonymous";
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
import {
  deleteActiveDemoSession,
  deleteLocalDemoAccount,
  findLocalAnonymousAccount,
  getActiveDemoSession,
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
  // Ronda 10, stream D: la lista se relee al montar, al recuperar el
  // foco y con el evento `storage`, para que el borrado de cuentas
  // demo (stream A, misma ronda) se refleje sin recargar la página.
  const refreshLocalAccounts = useCallback(() => {
    setLocalAccounts(listLocalDemoAccounts());
  }, []);
  useEffect(() => {
    refreshLocalAccounts();
    window.addEventListener("focus", refreshLocalAccounts);
    window.addEventListener("storage", refreshLocalAccounts);
    return () => {
      window.removeEventListener("focus", refreshLocalAccounts);
      window.removeEventListener("storage", refreshLocalAccounts);
    };
  }, [refreshLocalAccounts]);

  // Ronda 10, stream D (D1): la cuenta anónima de este navegador se
  // lee directa del registro en cada render (no del estado de la
  // lista): así el estado del botón es el vigente aunque la lista aún
  // no se haya refrescado tras un borrado.
  const anonymousAccount = findLocalAnonymousAccount();
  const anonymousCheck = canCreateAnonymousAccountOnDevice();
  const [showAnonymousForm, setShowAnonymousForm] = useState(false);

  // Ronda 14, stream B: la sesión demo ACTIVA se lee directa de
  // localStorage en cada render (mismo patrón que `anonymousAccount`
  // arriba): así la sección "Cuenta demo activa" aparece siempre que
  // haya sesión, también para Single/Pareja canónica, que nunca entra
  // en el registro `cc_local_demo_accounts_v1` y por eso no aparecía
  // en "Tus cuentas demo en este navegador" tras la primera visita.
  // La sección solo se muestra cuando la sesión NO se puede gestionar
  // desde la lista: la lista ya tiene Entrar + Eliminar para las
  // cuentas registradas no canónicas (incluida la anónima), así que
  // mostrarla también aquí duplicaría la cuenta (y su nombre) en
  // /demo. La canónica (Sofía / Carmen & Roberto) nunca entra en el
  // registro — ni su fila de lista tiene Eliminar (ronda 11) — así que
  // la sección es su única gestión en /demo.
  const activeDemoSession = getActiveDemoSession();
  const shownActiveSession =
    activeDemoSession !== null &&
    !(activeDemoSession.isRegistered && !activeDemoSession.isCanonical)
      ? activeDemoSession
      : null;
  const [activeSessionPendingDelete, setActiveSessionPendingDelete] =
    useState(false);

  const confirmDeleteActiveSession = () => {
    setActiveSessionPendingDelete(false);
    const session = getActiveDemoSession();
    if (!session || isLoading) return;
    const result = deleteActiveDemoSession();
    if (!result.deleted) {
      toast({
        title: "No se pudo eliminar",
        description: result.reason ?? "No se pudo eliminar esa sesión demo.",
        variant: "destructive",
      });
      return;
    }
    // La sección se relee en el mismo render (`activeDemoSession` se
    // calcula desde localStorage): al cerrar la sesión desaparece.
    setLocalAccounts(listLocalDemoAccounts());
    toast({
      title: "Sesión demo eliminada",
      description: session.isRegistered
        ? `Se eliminó "${session.nickname}" de este navegador.`
        : `Se cerró la sesión demo de "${session.nickname}".`,
    });
  };

  /**
   * Ronda 19, stream B: reentrar desde "Cuenta demo activa" NO
   * mostraba el toast (test dirigido ronda 18, PR #78: 3 intentos,
   * reentra al instante pero sin "Modo Demo Activado", mientras el
   * "Entrar" de la lista sí lo muestra). Causa: el botón "Entrar
   * como …" hacía un `navigate(...)` pelado, sin pasar por
   * `handleDemoLogin` ni `handleLocalAccountLogin`, que son los
   * únicos que disparan el toast. La sesión ya existe (el banner
   * solo se muestra si `getActiveDemoSession()` la resuelve), así
   * que no hace falta `signIn` ni restaurar nada: solo el toast
   * antes de navegar, con el mismo título y la misma descripción
   * de bienvenida que `handleLocalAccountLogin`. El toast sobrevive
   * al cambio de ruta porque el <Toaster /> vive en MainLayout,
   * por encima del <Outlet /> (ronda 18). La navegación no cambia.
   */
  const handleActiveSessionLogin = () => {
    const session = shownActiveSession;
    if (!session || isLoading) return;
    toast({
      title: "🎭 Modo Demo Activado",
      description: `Bienvenido de nuevo, ${session.nickname}`,
    });
    navigate(session.type === "couple" ? "/profile-couple" : "/profile-single");
  };

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

      // Ronda 18, stream A (B1/B2): navegar DE INMEDIATO, sin el
      // `setTimeout(..., 1000)` que había aquí. Ese segundo de retardo
      // dejaba /demo retenida con el toast y sin loader (la ronda 17
      // hizo urgente la navegación UNA VEZ PEDIDA, pero aquí ni se
      // pedía); el toast sobrevive al cambio de ruta porque el
      // <Toaster /> vive en MainLayout, por encima del <Outlet />.
      navigate(type === "couple" ? "/profile-couple" : "/profile-single");
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

  // Ronda 24: las declaraciones de `usePersistedState` para
  // `demo_authenticated`/`userType` se eliminaron con sus setters
  // (ver `handleDemoLogin`): solo quedaba el setter y ya no se usa.
  // Nada más de este archivo cambia.

  /**
   * Ronda 11 (stream A, 1h): eliminar una cuenta demo creada
   * localmente en este navegador, con confirmación EN LA APP.
   *
   * Causa raíz del hallazgo (1h) del test de la ronda 10 (5 clics en
   * "Eliminar", sin diálogo, sin toast, sin borrado): la confirmación
   * era `window.confirm(...)`, que en varias webviews móviles (el
   * navegador in-app del test) se descarta solo o ni se muestra — el
   * mismo motivo documentado en Single/CouplePrivacySection, que ya
   * habían abandonado window.confirm por ese motivo. El handler SÍ
   * estaba cableado y `deleteLocalDemoAccount()` SÍ funciona (19/19
   * en r10-stream-a), pero el confirm nativo nunca dejaba llegar a él.
   * Ahora el diálogo es un AlertDialog (Radix, mismo patrón que
   * PrivacySettings): visible y táctil en cualquier webview.
   * Las canónicas (Sofía, Carmen & Roberto) no están en esta lista y
   * no se pueden borrar: `deleteLocalDemoAccount` las rechaza.
   */
  const [accountPendingDelete, setAccountPendingDelete] =
    useState<LocalDemoAccountRecord | null>(null);

  const handleDeleteLocalAccount = (account: LocalDemoAccountRecord) => {
    if (isLoading) return;
    setAccountPendingDelete(account);
  };

  const confirmDeleteLocalAccount = () => {
    const account = accountPendingDelete;
    setAccountPendingDelete(null);
    if (!account || isLoading) return;
    const result = deleteLocalDemoAccount(account.userId);
    if (!result.deleted) {
      toast({
        title: "No se pudo eliminar",
        description: result.reason ?? "No se pudo eliminar esa cuenta demo.",
        variant: "destructive",
      });
      return;
    }
    // La lista y el hueco de anónima se releen en el mismo render:
    // `anonymousAccount` / `anonymousCheck` se calculan en cada
    // render desde el registro, así que "Crear cuenta demo anónima"
    // vuelve a habilitarse al borrar la anónima anterior.
    setLocalAccounts(listLocalDemoAccounts());
    toast({
      title: "Cuenta demo eliminada",
      description: `Se eliminó "${account.nickname}" de este navegador.`,
    });
  };

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

      // Ronda 24 (H3 del diagnóstico): SOLO escritura en crudo
      // (safeSetItem), como ya hace `handleLocalAccountLogin`. Los
      // setters de `usePersistedState` serializan con JSON.stringify
      // y dejaban `demo_authenticated` como `"true"` ENTRECOMILLADO;
      // si React ejecutaba ese updater DESPUÉS del safeSetItem, el
      // valor final quedaba entrecomillado, `getSessionFlags()`
      // (compara `=== "true"`) devolvía false y `isDemo()` false →
      // rebote a /discover con la sesión demo «activa» en apariencia.
      // Persistir flags demo
      safeSetItem("demo_authenticated", "true", { validate: true });
      safeSetItem("userType", type, { validate: false });

      toast({
        title: "🎭 Modo Demo Activado",
        description: `Bienvenido al modo demo como ${type === "single" ? "Usuario Single" : "Pareja"}`,
      });

      // Ronda 18, stream A (B1/B2): navegar DE INMEDIATO tras el
      // `signIn` exitoso, sin el `setTimeout(..., 1000)` que había
      // aquí. Ese segundo de retardo dejaba /demo retenida con el
      // toast "Modo Demo Activado" y sin loader: la ronda 17 hizo
      // urgente la navegación UNA VEZ PEDIDA (`useTransitions={false}`),
      // pero aquí la navegación ni se pedía durante 1 s — no había
      // loader que commitear. El toast sobrevive al cambio de ruta
      // porque el <Toaster /> vive en MainLayout, por encima del
      // <Outlet />; y la sesión no depende del retardo, porque
      // `handleDemoAuth` ya escribió `demo_authenticated`, `demo_user`
      // y `userType` en localStorage de forma síncrona antes de que
      // `signIn` resolviera.
      if (type === "couple") {
        navigate("/profile-couple");
      } else {
        navigate("/profile-single");
      }
    } catch (error) {
      logger.error("Error en demo login", {
        error: error instanceof Error ? error.message : String(error),
      });

      // Rollback: evitar sesión demo a medias (solo borrado en
      // crudo; ver el comentario de arriba: nada de setters de
      // `usePersistedState` para estas claves).
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

          {/* Ronda 14, stream B: sesión demo ACTIVA, visible en /demo
              mientras exista y no se pueda gestionar desde la lista
              (ver `shownActiveSession` arriba). La sesión canónica
              Single/Pareja (Sofía / Carmen & Roberto) nunca entra en
              el registro, así que sin esta sección no había forma de
              gestionarla ni de eliminarla desde /demo tras la primera
              visita: solo se veía el selector "Explorar como
              Single/Pareja". Eliminar cierra la sesión (la canónica
              sigue disponible para volver a entrar). */}
          {shownActiveSession && (
            <div className="rounded-lg border border-purple-400/40 bg-purple-500/10 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Cuenta demo activa
              </h3>
              <p className="text-slate-600 dark:text-white/70 text-xs mb-3">
                Tienes una sesión demo abierta en este navegador.
              </p>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-3 py-2">
                <div className="min-w-40 flex-1 basis-40">
                  <p className="text-slate-900 dark:text-white font-medium wrap-break-word">
                    {shownActiveSession.displayName}
                    <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-white/10 dark:text-white/80 dark:border-white/20">
                      {shownActiveSession.type === "couple"
                        ? "Pareja"
                        : "Single"}
                    </span>
                  </p>
                  {shownActiveSession.email && (
                    <p className="text-slate-500 dark:text-white/60 text-xs wrap-break-word">
                      {shownActiveSession.email}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  disabled={isLoading}
                  onClick={handleActiveSessionLogin}
                  className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  {`Entrar como ${shownActiveSession.nickname}`}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isLoading}
                  onClick={() => setActiveSessionPendingDelete(true)}
                  title={`Eliminar la sesión demo de ${shownActiveSession.nickname}`}
                  aria-label={`Eliminar la sesión demo de ${shownActiveSession.nickname}`}
                  className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-300 dark:hover:text-red-200 shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Ronda 14, stream B: confirmación EN LA APP para eliminar
              la sesión demo activa (mismo patrón que el diálogo de la
              lista: sin window.confirm, que en webviews se descarta). */}
          <AlertDialog
            open={activeSessionPendingDelete}
            onOpenChange={(open) => {
              if (!open) setActiveSessionPendingDelete(false);
            }}
          >
            <AlertDialogContent className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Eliminar la sesión demo activa?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {`Se cerrará la sesión demo activa de "${shownActiveSession?.nickname ?? "Demo"}". La cuenta demo seguirá disponible para volver a entrar.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteActiveSession}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Ronda 9, stream D: cuentas demo locales de este navegador.
              Sin esta sección, tras cerrar sesión no había forma de
              volver a entrar con una cuenta creada por registro. */}
          {/* RONDA 11 (stream B, B6): la sección era `text-white`
              sobre `bg-white/5` (blanco sobre blanco en tema claro) y
              el nombre/email llevaban `truncate`: en la prueba de la
              ronda 10 los nombres se veían como "a…" / "T…". Ahora el
              fondo es opaco claro y los textos envuelven
              (`wrap-break-word`) en vez de truncarse: el nombre
              completo siempre se ve. */}
          {localAccounts.length > 0 && (
            <div className="rounded-lg border border-slate-300 bg-slate-50 dark:border-white/20 dark:bg-white/5 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Tus cuentas demo en este navegador
              </h3>
              <p className="text-slate-600 dark:text-white/70 text-xs mb-3">
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
                  // Ronda 12 (stream B, 1b): la columna del nombre era
                  // `min-w-0 flex-1` (flex: 1 1 0%) con `wrap-break-word`:
                  // a 390 px (ancho CSS de móvil) la fila "casi cabía" y el
                  // algoritmo flex aplastaba la columna a ~27 px, así que el
                  // nombre y el email se rompían LETRA POR LETRA
                  // ("Te / st / R7"). Ahora la columna tiene un mínimo
                  // garantizado (`min-w-40 basis-40`): antes que aplastar el
                  // nombre, los botones Entrar / Eliminar bajan a la
                  // siguiente línea (el `li` ya es `flex-wrap`).
                  return (
                    <li
                      key={account.userId}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-3 py-2"
                    >
                      <div className="min-w-40 flex-1 basis-40">
                        <p className="text-slate-900 dark:text-white font-medium wrap-break-word">
                          {displayName}
                          {account.isAnonymous && (
                            <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-800 border border-purple-500/40 dark:bg-purple-400/20 dark:text-purple-100 dark:border-purple-400/40">
                              Anónimo
                            </span>
                          )}
                          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-white/10 dark:text-white/80 dark:border-white/20">
                            {type === "couple" ? "Pareja" : "Single"}
                          </span>
                        </p>
                        <p className="text-slate-500 dark:text-white/60 text-xs wrap-break-word">
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
                      {/* Ronda 11 (stream A, 1h): las cuentas demo
                          canónicas (Sofía, Carmen & Roberto) NO tienen
                          botón de eliminar — ni en la lista ni en el
                          lib (`deleteLocalDemoAccount` las rechaza).
                          Sin esta guarda, un registro canónico colado
                          en la lista mostraría un botón que siempre
                          falla. */}
                      {account.email !== "single@outlook.es" &&
                        account.email !== "pareja@outlook.es" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isLoading}
                            onClick={() => handleDeleteLocalAccount(account)}
                            title={`Eliminar la cuenta demo "${account.nickname}" de este navegador`}
                            aria-label={`Eliminar la cuenta demo ${account.nickname}`}
                            className="text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-300 dark:hover:text-red-200 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Ronda 11 (stream A, 1h): confirmación EN LA APP para
              eliminar una cuenta demo. Sin window.confirm (se descarta
              en webviews y el borrado nunca ocurría, test ronda 10). */}
          <AlertDialog
            open={accountPendingDelete !== null}
            onOpenChange={(open) => {
              if (!open) setAccountPendingDelete(null);
            }}
          >
            <AlertDialogContent
              // Ronda 13, stream D (D1): fondo opaco explícito. El
              // default `bg-background` del componente es transparente
              // en Tailwind v4 (`--background: 350 20% 99%` sin hsl()
              // + `@theme inline` → `background-color: var(--background)`
              // inválido) y el texto se solapaba con la página detrás.
              // Per-site: sin tocar el @theme global.
              className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar cuenta demo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará la cuenta demo &quot;
                  {accountPendingDelete?.nickname}&quot; (
                  {accountPendingDelete?.email}) de este navegador, con sus
                  ajustes de privacidad y visibilidad. Esta acción no se puede
                  deshacer.
                  {accountPendingDelete?.isAnonymous &&
                    " Al eliminarla, el hueco de cuenta anónima queda libre y podrás crear otra."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteLocalAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Ronda 10, stream D (D1): crear cuenta demo anónima,
              SIEMPRE visible en /demo. Antes la única vía era el
              formulario incrustado en el perfil (sesión activa): tras
              cerrar sesión no había forma de crear una cuenta anónima
              (test ronda 9: el botón solo aparecía en la sesión
              inicial heredada). Si ya existe una en este navegador,
              el botón queda visible pero deshabilitado con el motivo
              (una por dispositivo); borrarla de "Tus cuentas demo en
              este navegador" (stream A) vuelve a habilitarlo. */}
          <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Cuenta demo anónima
            </h3>
            {anonymousAccount ? (
              <>
                <p className="text-slate-600 dark:text-white/70 text-xs mb-3">
                  Ya existe una cuenta anónima en este navegador (la verás en
                  "Tus cuentas demo en este navegador").{" "}
                  {anonymousCheck.reason ??
                    "Solo se permite una cuenta anónima por navegador."}{" "}
                  Para crear otra, elimínala primero de esa lista.
                </p>
                <Button
                  type="button"
                  disabled
                  title={anonymousCheck.reason}
                  className="w-full bg-purple-600/50 text-white/80 cursor-not-allowed"
                >
                  Crear cuenta demo anónima
                </Button>
              </>
            ) : (
              <>
                <p className="text-slate-600 dark:text-white/70 text-xs mb-3">
                  Explora sin mostrar tu identidad: solo tu alias es visible,
                  sin foto de rostro y sin billetera hasta que verifiques tu
                  perfil. Solo se permite una cuenta anónima por navegador.
                </p>
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowAnonymousForm((v) => !v)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {showAnonymousForm
                    ? "Ocultar formulario"
                    : "Crear cuenta demo anónima"}
                </Button>
                {showAnonymousForm && (
                  <div className="mt-4">
                    <ComplianceSignupForm />
                  </div>
                )}
              </>
            )}
          </div>

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
