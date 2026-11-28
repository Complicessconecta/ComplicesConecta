import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminNav } from "@/components/admin/AdminNav";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { generateDemoProfiles } from "@/demo/demoData";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { MODERATOR_STATUS, type ModeratorStatus } from "@/lib/roles";

interface Moderator {
  id: string;
  user_id?: string;
  email: string;
  full_name?: string;
  status: ModeratorStatus;
  created_at: string;
  activated_at?: string;
  reports_handled: number;
  suspensions_applied: number;
  last_activity?: string;
}

interface ModeratorRequest {
  id: string;
  full_name: string;
  email: string;
  motivation: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

// Ronda 24 (stream A): mismo tope que Admin/useAuth. Sin él,
// «Cargando moderadores...» se quedaba >60 s (preview y producción)
// cuando una consulta a Supabase se colgaba en red. Al vencer, la
// carga resuelve con error VISIBLE (banner) en vez de colgarse.
// Mismo patrón `Promise.race` que EditProfileSingle (8 s) y
// ProfileDetail (10 s).
export const MODERATORS_FETCH_TIMEOUT_MS = 15_000;

const withFetchTimeout = <T,>(promise: Promise<T>, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_resolve, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`Tiempo de espera agotado al cargar ${label} (15 s)`),
          ),
        MODERATORS_FETCH_TIMEOUT_MS,
      ),
    ),
  ]);

const AdminModerators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemo } = useAuth();

  // Ronda 26 (stream B): rama demo, igual que Admin.tsx:114 y
  // AdminRoute. `isDemo()` se lee fresco en cada render: con sesión
  // real asentada vale false aunque queden flags demo obsoletos
  // (useAuth.ts:998-1002), así que puede cambiar true→false al
  // hidratar la sesión (caso ronda 22).
  const demoActive = typeof isDemo === "function" ? isDemo() : Boolean(isDemo);
  // Qué rama ya se cargó ("demo" | "real"). Sin él, el efecto de
  // abajo re-cargaría en cada render (useAuth no memoiza su retorno
  // y `demoActive` se re-calcula); con él, un cambio de rama (flip
  // true→false al hidratar) recarga con la rama nueva en vez de
  // quedarse clavado en la primera decisión.
  const loadedBranchRef = useRef<"demo" | "real" | null>(null);

  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [requests, setRequests] = useState<ModeratorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  // Ronda 24: error de carga visible en el panel (no solo toast, que
  // en el test y en webview puede no verse). Se pone cuando una de
  // las dos consultas falla o vence su tope.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("moderators");

  // Formulario para crear moderador
  const [newModeratorEmail, setNewModeratorEmail] = useState("");
  const [newModeratorName, setNewModeratorName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Modal de detalles
  const [_selectedModerator, _setSelectedModerator] =
    useState<Moderator | null>(null);
  const [_selectedRequest, _setSelectedRequest] =
    useState<ModeratorRequest | null>(null);

  const statusLabels = {
    pending: "Pendiente",
    active: "Activo",
    suspended: "Suspendido",
    inactive: "Inactivo",
  };

  useEffect(() => {
    // Ronda 26 (stream B): en demo NO se toca Supabase (ver
    // loadDemoModeratorsData). La rama real sigue por fetchData con
    // sus topes de 15 s.
    const branch = demoActive ? "demo" : "real";
    if (loadedBranchRef.current === branch) return;
    loadedBranchRef.current = branch;
    if (demoActive) {
      loadDemoModeratorsData();
    } else {
      void fetchData();
    }
  }, [demoActive]);

  // Ronda 26 (stream B): datos demo/respaldo LOCALES, sin llamadas a
  // Supabase — mismo patrón que loadDemoAdminData() de Admin.tsx
  // (ronda 21) y mismo aviso «Panel demo — datos de respaldo».
  //
  // DIAGNÓSTICO (test dirigido PR #87, 2026-11-28 01:11–01:20 CST):
  // la página resolvía en ~20–25 s CON el banner «No se pudieron
  // cargar los datos de moderadores», 0 Moderadores, sin datos. La
  // ronda 24 pasó este mismo ítem sin tocar la página después, así
  // que el fallo es ambiental/intermitente, no una regresión de la
  // ronda 25 — y esta página era la única del área admin SIN rama
  // demo: en demo no hay sesión real de Supabase (la auth demo es
  // solo localStorage), así que las dos consultas iban a PostgREST
  // como `anon`, y al menos una fallaba hasta su tope de 15 s.
  //
  // Qué consulta falla y por qué (mejor explicación con la evidencia
  // del repo; el toast con error.message no quedó registrado en el
  // test y producción no se puede consultar desde aquí):
  // - `moderator_requests` como anon NO puede fallar por RLS: sus
  //   políticas (20250119000001_create_moderator_requests.sql) solo
  //   comparan auth.uid() = user_id o un EXISTS sobre user_roles;
  //   con auth.uid() NULL ambas son falsas y la consulta devuelve
  //   VACÍA, sin error.
  // - `moderators` SÍ: su política moderators_select es
  //   `user_id = auth.uid() OR public.is_admin()`
  //   (20251216100028_20251213_sync_and_fix.sql:414-416, marcada
  //   «migrado» en AUDITORIA_MIGRACIONES_SUPABASE.md), y
  //   `is_admin()` tiene `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO
  //   authenticated` (20260120000037:49-52) — anon no puede
  //   ejecutarla y Postgres niega la consulta (42501) al evaluar la
  //   política. La tabla existe (misma migración:133 y ALTERs sobre
  //   ella en 20260122065739_remote_schema.sql), así que «tabla
  //   inexistente» (PGRST205) NO es la hipótesis principal.
  //   Reserva: AUDITORIA_SUPABASE_COMPLETA_2026-02-04.md advierte
  //   «Múltiples versiones de is_admin()» en producción, así que los
  //   grants exactos en vivo no se pueden probar desde el repo.
  // - El tiempo ~20–25 s es CONSISTENTE con los topes (15 s de
  //   fetchData + carga del chunk/navegación), no con un cuelgue:
  //   los topes de la ronda 24 funcionan; lo que estaba mal era
  //   convertir cualquier fallo en banner bloqueante en demo, donde
  //   los datos de Supabase no significan nada (anon solo vería
  //   listas vacías en el mejor caso).
  //
  // Los datos demo se derivan del roster canónico
  // (generateDemoProfiles, misma fuente que Admin.tsx); los emails
  // son sintéticos con dominio .demo.local (no enrutable) y las
  // fechas son ISO relativas a hoy porque formatDate() necesita
  // fechas parseables (lastActive del roster es texto «Hace X min»).
  const loadDemoModeratorsData = () => {
    const demoProfiles = generateDemoProfiles(5);
    const daysAgoIso = (days: number, hours = 0) =>
      new Date(
        Date.now() - days * 86_400_000 - hours * 3_600_000,
      ).toISOString();
    // Email demo sintético a partir del nombre del roster.
    const demoEmailFor = (name: string) =>
      `${name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}@demo.local`;
    const [ana, francisco, mariaJuan, carlos, laura] = demoProfiles;
    setModerators(
      [
        {
          profile: ana,
          status: MODERATOR_STATUS.ACTIVE,
          createdDaysAgo: 45,
          activatedDaysAgo: 44,
          reportsHandled: 14,
          suspensionsApplied: 3,
        },
        {
          profile: francisco,
          status: MODERATOR_STATUS.ACTIVE,
          createdDaysAgo: 30,
          activatedDaysAgo: 29,
          reportsHandled: 9,
          suspensionsApplied: 1,
        },
        {
          profile: carlos,
          status: MODERATOR_STATUS.PENDING,
          createdDaysAgo: 12,
          reportsHandled: 0,
          suspensionsApplied: 0,
        },
      ].map((m) => ({
        id: m.profile!.id,
        email: demoEmailFor(m.profile!.name),
        full_name: m.profile!.name,
        status: m.status,
        created_at: daysAgoIso(m.createdDaysAgo),
        // Ronda 26 (coordinador): sin spread condicional el `undefined`
        // explícito rompe `exactOptionalPropertyTypes` en el tsc
        // durable (TS2345 en AdminModerators:200); la prop solo existe
        // cuando hay fecha de activación.
        ...(m.activatedDaysAgo
          ? { activated_at: daysAgoIso(m.activatedDaysAgo) }
          : {}),
        reports_handled: m.reportsHandled,
        suspensions_applied: m.suspensionsApplied,
      })),
    );
    setRequests(
      [
        {
          profile: mariaJuan,
          createdDaysAgo: 2,
          motivation:
            "Quiero ayudar a moderar la comunidad y mantener un ambiente seguro y respetuoso.",
        },
        {
          profile: laura,
          createdDaysAgo: 0,
          createdHoursAgo: 5,
          motivation:
            "Tengo experiencia moderando grupos y quiero apoyar al equipo.",
        },
      ].map((r) => ({
        id: `solicitud-${r.profile!.id}`,
        full_name: r.profile!.name,
        email: demoEmailFor(r.profile!.name),
        motivation: r.motivation,
        status: "pending" as const,
        created_at: daysAgoIso(r.createdDaysAgo, r.createdHoursAgo ?? 0),
      })),
    );
    setLoadError(null);
    setLoading(false);
    logger.info("🎭 Moderadores demo cargados (datos locales, sin Supabase)");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      // Ronda 24: tope global. Cada consulta ya tiene su propio tope
      // abajo, pero si el conjunto se cuelga por otro camino, esta
      // carrera apaga la carga con error visible en vez de dejar
      // «Cargando moderadores...» para siempre.
      const [moderatorsOk, requestsOk] = await withFetchTimeout(
        Promise.all([fetchModerators(), fetchRequests()]),
        "los datos de moderadores",
      );
      if (!moderatorsOk || !requestsOk) {
        setLoadError(
          "No se pudieron cargar los datos de moderadores. Reintenta más tarde.",
        );
      }
    } catch (error) {
      logger.error("? Error al cargar datos:", { error });
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos de moderadores.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchModerators = async (): Promise<boolean> => {
    try {
      if (!supabase) {
        logger.error("Supabase no est disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Supabase no est disponible",
        });
        return false;
      }

      // Ronda 24: tope propio a la consulta (ver withFetchTimeout).
      // Tipo explícito: el builder de Supabase es un thenable, no un
      // Promise, y sin él T se infiere como unknown (TS2339).
      const { data, error } = await withFetchTimeout<{
        data: Moderator[] | null;
        error: { message: string } | null;
      }>(
        (supabase as any)
          .from("moderators")
          .select("*")
          .order("created_at", { ascending: false }),
        "los moderadores",
      );

      if (error) throw error;
      setModerators(data || []);
      logger.info("? Moderadores cargados:", { count: data?.length || 0 });
      return true;
    } catch (error: any) {
      logger.error("? Error al cargar moderadores:", { error: error.message });
      toast({
        variant: "destructive",
        title: "Error al cargar moderadores",
        description: error.message,
      });
      return false;
    }
  };

  const fetchRequests = async (): Promise<boolean> => {
    try {
      if (!supabase) {
        logger.error("Supabase no est disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Supabase no est disponible",
        });
        return false;
      }

      // Ronda 24: tope propio a la consulta (ver withFetchTimeout).
      // Tipo explícito: el builder de Supabase es un thenable, no un
      // Promise, y sin él T se infiere como unknown (TS2339).
      const { data, error } = await withFetchTimeout<{
        data: ModeratorRequest[] | null;
        error: { message: string } | null;
      }>(
        (supabase as any)
          .from("moderator_requests")
          .select("*")
          .order("created_at", { ascending: false }),
        "las solicitudes de moderador",
      );

      if (error) throw error;
      setRequests(data || []);
      logger.info("? Solicitudes cargadas:", { count: data?.length || 0 });
      return true;
    } catch (error: any) {
      logger.error("? Error al cargar solicitudes:", { error: error.message });
      toast({
        variant: "destructive",
        title: "Error al cargar solicitudes",
        description: error.message,
      });
      return false;
    }
  };

  const createModerator = async () => {
    if (!newModeratorEmail || !newModeratorName) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor completa email y nombre",
      });
      return;
    }

    try {
      setIsCreating(true);
      logger.info("?? Creando nuevo moderador:", {
        email: newModeratorEmail,
        name: newModeratorName,
      });

      if (!supabase) {
        logger.error("Supabase no est disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Supabase no est disponible",
        });
        return;
      }

      // Generar token de activación
      const activationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

      if (!supabase) {
        logger.error("Supabase no est disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Supabase no est disponible",
        });
        setIsCreating(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await (supabase as any)
        .from("moderators")
        .insert([
          {
            email: newModeratorEmail.trim().toLowerCase(),
            full_name: newModeratorName.trim(),
            status: "pending",
            activation_token: activationToken,
            activation_expires_at: expiresAt.toISOString(),
            created_by: userId,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Moderador creado exitosamente",
        description: `Se ha enviado un enlace de activación a ${newModeratorEmail}`,
        duration: 5000,
      });

      // Limpiar formulario
      setNewModeratorEmail("");
      setNewModeratorName("");

      // Recargar lista
      await fetchModerators();

      logger.info("? Moderador creado exitosamente:", { id: data[0].id });
    } catch (error: any) {
      logger.error("? Error al crear moderador:", { error: error.message });
      toast({
        variant: "destructive",
        title: "Error al crear moderador",
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateModeratorStatus = async (
    moderatorId: string,
    newStatus: ModeratorStatus,
  ) => {
    try {
      logger.info("?? Actualizando status de moderador:", {
        moderatorId,
        newStatus,
      });

      if (!supabase) {
        logger.error("Supabase no est disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Supabase no est disponible",
        });
        return;
      }

      const { error } = await (supabase as any)
        .from("moderators")
        .update({ status: newStatus })
        .eq("id", moderatorId);

      if (error) throw error;

      // Actualizar estado local
      setModerators((prev) =>
        prev.map((mod) =>
          mod.id === moderatorId ? { ...mod, status: newStatus } : mod,
        ),
      );

      toast({
        title: "Status actualizado",
        description: `Moderador marcado como ${statusLabels[newStatus]}`,
      });

      logger.info("? Status actualizado exitosamente");
    } catch (error: any) {
      logger.error("? Error al actualizar status:", { error: error.message });
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message,
      });
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "approved" | "rejected",
    reason?: string,
  ) => {
    try {
      logger.info("?? Procesando solicitud:", { requestId, action, reason });

      if (!supabase) {
        logger.error("Supabase no est disponible");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Supabase no est disponible",
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { error } = await (supabase as any)
        .from("moderator_requests")
        .update({
          status: action,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Si se aprueba, crear el moderador
      if (action === "approved") {
        const request = requests.find((r) => r.id === requestId);
        if (request) {
          const activationToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          await (supabase as any).from("moderators").insert([
            {
              email: request.email,
              full_name: request.full_name,
              status: "pending",
              activation_token: activationToken,
              activation_expires_at: expiresAt.toISOString(),
              created_by: userId,
            },
          ]);
        }
      }

      toast({
        title: `Solicitud ${action === "approved" ? "aprobada" : "rechazada"}`,
        description:
          action === "approved"
            ? "Se ha creado el moderador y enviado enlace de activación"
            : "La solicitud ha sido rechazada",
      });

      // Recargar datos
      await fetchData();
      _setSelectedRequest(null);

      logger.info("? Solicitud procesada exitosamente");
    } catch (error: any) {
      logger.error("? Error al procesar solicitud:", { error: error.message });
      toast({
        variant: "destructive",
        title: "Error al procesar solicitud",
        description: error.message,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-fuchsia-900 to-red-900">
        <AdminNav userRole="admin" />
        <div className="flex items-center justify-center h-64 pt-24">
          <div className="text-white text-xl">Cargando moderadores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-fuchsia-900 to-red-900 relative overflow-hidden">
      <AdminNav userRole="admin" />
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen pt-20">
        {/* Ronda 26 (stream B): aviso demo, mismo texto que Admin.tsx.
            Solo en demo: la rama real no lo muestra. */}
        {demoActive && (
          <div role="note" className="max-w-7xl mx-auto px-3 sm:px-6 pt-4">
            <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
              <p className="text-amber-200 font-medium">
                Panel demo — datos de respaldo
              </p>
              <p className="text-amber-200/70 text-sm">
                Estás viendo datos de demostración. Los cambios no se guardan en
                el servidor.
              </p>
            </div>
          </div>
        )}
        {/* Ronda 24: error de carga visible (banner, no solo toast):
            con el tope, una red colgada resuelve aquí en ~15 s. */}
        {loadError && (
          <div role="alert" className="max-w-7xl mx-auto px-3 sm:px-6 pt-4">
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 font-medium">
                Error al cargar moderadores: {loadError}
              </p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl mx-auto gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Volver
            </Button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 text-center sm:text-left">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">
                Panel de Administración -{" "}
              </span>
              Moderadores
            </h1>
            <div className="flex items-center gap-2 text-white">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white text-xs sm:text-sm"
              >
                {moderators.length} Moderadores
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4 sm:space-y-6"
          >
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-white/10 backdrop-blur-md border-white/20 gap-1 sm:gap-0">
              <TabsTrigger
                value="moderators"
                className="text-white data-[state=active]:bg-white/20 text-xs sm:text-sm"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Moderadores </span>Activos
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="text-white data-[state=active]:bg-white/20 text-xs sm:text-sm"
              >
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Solicitudes (
                {requests.filter((r) => r.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="text-white data-[state=active]:bg-white/20 text-xs sm:text-sm"
              >
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Crear
              </TabsTrigger>
            </TabsList>

            {/* Tab: Moderadores Activos */}
            <TabsContent value="moderators" className="space-y-3 sm:space-y-4">
              {moderators.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white/80 text-sm sm:text-base">
                      No hay moderadores registrados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                moderators.map((moderator) => (
                  <Card
                    key={moderator.id}
                    className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                            <h3 className="text-lg sm:text-xl font-bold text-white wrap-break-word">
                              {moderator.full_name || moderator.email}
                            </h3>
                            <Badge
                              className={`${
                                moderator.status === MODERATOR_STATUS.ACTIVE
                                  ? "bg-green-500"
                                  : moderator.status ===
                                      MODERATOR_STATUS.INACTIVE
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              } text-white text-xs w-fit`}
                            >
                              {moderator.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-white/80 text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="break-all">
                                {moderator.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span>
                                Creado: {formatDate(moderator.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span>Reportes: {moderator.reports_handled}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ban className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span>
                                Suspensiones: {moderator.suspensions_applied}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto sm:ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateModeratorStatus(
                                moderator.id,
                                moderator.status === MODERATOR_STATUS.ACTIVE
                                  ? MODERATOR_STATUS.INACTIVE
                                  : MODERATOR_STATUS.ACTIVE,
                              )
                            }
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-none"
                          >
                            {moderator.status === MODERATOR_STATUS.ACTIVE ? (
                              <>
                                <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                                <span className="sm:hidden">Desactivar</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                                <span className="sm:hidden">Activar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Tab: Solicitudes Pendientes */}
            <TabsContent value="requests" className="space-y-3 sm:space-y-4">
              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <UserPlus className="h-8 w-8 sm:h-12 sm:w-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white/80 text-sm sm:text-base">
                      No hay solicitudes pendientes
                    </p>
                  </CardContent>
                </Card>
              ) : (
                requests
                  .filter((r) => r.status === "pending")
                  .map((request) => (
                    <Card
                      key={request.id}
                      className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                          <div className="flex-1 w-full">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 wrap-break-word">
                              {request.full_name}
                            </h3>
                            <div className="text-white/80 text-sm sm:text-base space-y-1">
                              <p>
                                <strong>Email:</strong>{" "}
                                <span className="break-all">
                                  {request.email}
                                </span>
                              </p>
                              <p>
                                <strong>Fecha:</strong>{" "}
                                {formatDate(request.created_at)}
                              </p>
                              <p>
                                <strong>Motivacin:</strong>{" "}
                                {request.motivation.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto sm:ml-4 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => _setSelectedRequest(request)}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-none"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                              <span className="sm:hidden">Ver</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleRequest(request.id, "approved")
                              }
                              className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                            >
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                              <span className="sm:hidden">Aprobar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => _setSelectedRequest(request)}
                              className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 flex-1 sm:flex-none"
                            >
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                              <span className="sm:hidden">Rechazar</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            {/* Tab: Crear Moderador */}
            <TabsContent value="create" className="space-y-3 sm:space-y-4">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                    Crear Nuevo Moderador
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white text-sm sm:text-base">
                      Email del Moderador *
                    </Label>
                    <Input
                      type="email"
                      value={newModeratorEmail}
                      onChange={(e) => setNewModeratorEmail(e.target.value)}
                      placeholder="moderador@ejemplo.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm sm:text-base">
                      Nombre Completo *
                    </Label>
                    <Input
                      value={newModeratorName}
                      onChange={(e) => setNewModeratorName(e.target.value)}
                      placeholder="Nombre del moderador"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
                    />
                  </div>
                  <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
                    <p className="text-white/80 text-xs sm:text-sm">
                      <strong>Nota:</strong> Se enviar un enlace de activación
                      al email especificado. El moderador tendr 24 horas para
                      activar su cuenta y definir su contraseña.
                    </p>
                  </div>
                  <Button
                    onClick={createModerator}
                    disabled={
                      isCreating || !newModeratorEmail || !newModeratorName
                    }
                    className="w-full bg-linear-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base"
                  >
                    {isCreating ? (
                      <>Creando moderador...</>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Crear Moderador
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminModerators;
