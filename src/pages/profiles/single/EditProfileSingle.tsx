import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import ImageUpload from "@/components/profiles/shared/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { getAppConfig, resolveDemoAccountType } from "@/lib/app-config";
import type { Database } from "@/types/supabase-generated";
import { SAFE_INTERESTS } from "@/lib/lifestyle-interests";
import { ExplicitInterestsEditor } from "@/components/settings/ExplicitInterestsEditor";
import { logger } from "@/lib/logger";
import { useDemoThemeConfig, useProfileTheme } from "@/features/profile/useProfileTheme";
import { motion } from "framer-motion";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];


const EditProfileSingle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Tables<"profiles"> | any>(null);
  // Espejo del perfil para el temporizador: si a los 10 s sigue sin
  // perfil, se muestra error con reintento en vez del "Cargando…" eterno
  // (~20 s en el test: supabase.auth.getUser() sin sesión puede
  // quedarse colgado en red y nada lo cortaba).
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    location: "",
    profession: "",
    bio: "",
    interests: [] as string[],
    explicitInterests: [] as string[],
    avatar: "",
  });
  const [_isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState("");
  const [_success, setSuccess] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Demo theme configuration
  const { demoTheme, setDemoTheme, navbarStyle, setNavbarStyle } =
    useDemoThemeConfig();
  const themeConfig = useProfileTheme("single", ["male"], demoTheme);

  // Forzar re-render cuando cambia el tema
  useEffect(() => {
    // El cambio de tema se maneja automáticamente por el hook
    logger.info("Tema actualizado", { demoTheme, navbarStyle });
  }, [demoTheme, navbarStyle]);

  // Usar intereses seguros desde la fuente única de verdad
  const availableInterests = SAFE_INTERESTS;

  // Intereses demo que muestra el perfil cuando demo_user aún no trae
  // selección (ProfileSingle: DEMO_SINGLE_INTEREST_TITLES[0,2,4]). El
  // editor debe precargarlos: antes dejaba `interests` en [] y Guardar
  // escribía [] en demo_user, con lo que el perfil perdía los intereses.
  const DEMO_SINGLE_EDITOR_INTERESTS = [
    "Lifestyle Exclusivo",
    "Privacidad Total",
    "Chat Encriptado",
  ] as const;

  // Poblar el formulario con la identidad demo guardada en `demo_user`.
  // Los campos que el demo no trae (o trae vacíos) usan los valores
  // canónicos del perfil demo (Sofía, 28, CDMX, México), los mismos que
  // muestra ProfileSingle. Nunca se inventa una persona: sin identidad
  // usable no se genera ningún mock.
  const applyDemoIdentity = useCallback((user: any) => {
    const asString = (value: unknown): string =>
      typeof value === "string" ? value : "";
    const asStringArray = (value: unknown): string[] =>
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
        ? (value as string[])
        : [];
    // Identidad del login demo (p. ej. "Sofía" para single@outlook.es).
    const identityName = [
      asString(user.first_name),
      asString(user.last_name),
    ]
      .filter(Boolean)
      .join(" ");
    const storedName = asString(user.name) || asString(user.display_name);

    setFormData({
      name: storedName || identityName || "Sofía",
      age:
        typeof user.age === "number" || typeof user.age === "string"
          ? String(user.age)
          : "28",
      bio: asString(user.bio),
      location: asString(user.location) || "CDMX, México",
      profession: asString(user.profession),
      // Sin selección guardada, precargar los intereses que el perfil ya
      // muestra (ver arriba): Guardar sin cambios no debe borrarlos.
      interests: asStringArray(user.interests).length > 0
        ? asStringArray(user.interests)
        : [...DEMO_SINGLE_EDITOR_INTERESTS],
      explicitInterests: asStringArray(user.explicitInterests),
      avatar: asString(user.avatar) || asString(user.avatar_url),
    });
    setUserId(user.id);
    setProfile(user);
    setProfileLoaded(true);
    setIsLoading(false);
  }, []);

  const loadProfile = useCallback(async () => {
    if (profileLoaded) return;

    try {
      const demoAuth = localStorage.getItem("demo_authenticated");
      const demoUser = localStorage.getItem("demo_user");

      if (demoAuth === "true" && demoUser) {
        const user = JSON.parse(demoUser);

        // El demo_user guardado cambia de forma según quién lo escribió:
        // handleDemoAuth lo guarda con `accountType`, pero el signIn de
        // useAuth lo reescribe con forma de Profile (`profile_type` /
        // `relationship_type`, sin `accountType`). Leer solo `accountType`
        // hacía que la condición nunca se cumpliera y el editor cayera en
        // generateMockSingle(), mostrando otra persona en cada carga.
        // `userType` es el respaldo que escribe DemoSelector al entrar.
        const demoType =
          resolveDemoAccountType(user) ??
          (localStorage.getItem("userType") === "couple"
            ? "couple"
            : localStorage.getItem("userType") === "single"
              ? "single"
              : null);

        // Sesión de pareja en el editor de single: ir al editor de pareja,
        // nunca mostrar un mock aleatorio.
        if (demoType === "couple") {
          navigate("/edit-profile-couple");
          return;
        }

        if (demoType === "single") {
          // Demo: el editor muestra al usuario demo real, no un mock
          // aleatorio. La selección de intereses guardada en demo_user es
          // la que lee el perfil, así que editor y perfil coinciden.
          applyDemoIdentity(user);
          return;
        }

        // Sesión demo sin tipo resoluble: no inventar persona; seguir al
        // flujo de Supabase de abajo (usuario real) o a /auth.
      }

      // Si no hay demo auth, intentar con Supabase
      if (getAppConfig().features.demoCredentials) {
        if (!supabase) {
          logger.error("Supabase no está disponible");
          setError("Supabase no está disponible");
          return;
        }

        const {
          data: { user },
          // getUser() sin sesión puede colgarse ~20 s en red: cortarlo
          // a los 8 s y caer al flujo de /auth en vez de dejar el
          // "Cargando…" infinito.
        } = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_resolve, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error("Tiempo de espera agotado al verificar la sesión"),
                ),
              8000,
            ),
          ),
        ]);

        if (user) {
          const { data: profile, error } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            logger.error("Error fetching profile:", { error: error.message });
            setError("Error al cargar perfil");
          } else if (profile) {
            const profileData = profile as any;
            setFormData({
              name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim(),
              age: profileData.age?.toString() || "",
              bio: profileData.bio || "",
              location: `${profileData.latitude || ""}, ${profileData.longitude || ""}`,
              profession: "",
              interests: [],
              explicitInterests: [],
              avatar: "",
            });
            setUserId(user.id);
            setProfile(profile);
            setProfileLoaded(true);
            return;
          }
        }
      }

      // Sin sesión demo ni usuario real: ir a /auth (como el editor de
      // pareja). Nunca mostrar una persona aleatoria inventada.
      navigate("/auth");
      return;
    } catch (error) {
      setError("Error inesperado al cargar perfil");
      logger.error("Error loading profile:", { error: String(error) });

      // En caso de error, si hay sesión demo intentar con la identidad
      // guardada; si no, ir a /auth. Nunca un mock aleatorio.
      try {
        const demoUser = localStorage.getItem("demo_user");
        if (
          localStorage.getItem("demo_authenticated") === "true" &&
          demoUser
        ) {
          const user = JSON.parse(demoUser);
          if (resolveDemoAccountType(user) === "single") {
            applyDemoIdentity(user);
            return;
          }
          if (resolveDemoAccountType(user) === "couple") {
            navigate("/edit-profile-couple");
            return;
          }
        }
      } catch {
        // demo_user corrupto: caer a /auth
      }
      setIsLoading(false);
      navigate("/auth");
    }
  }, [profileLoaded, navigate, applyDemoIdentity]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Si a los 10 s sigue sin perfil, no dejar el spinner eterno: mostrar
  // error con acciones (reintentar / ir a iniciar sesión).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!profileRef.current) setLoadTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    if (_isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (getAppConfig().features.demoCredentials) {
        // Modo demo - guardar en localStorage
        const demoUser = JSON.parse(localStorage.getItem("demo_user") || "{}");
        const updatedUser = {
          ...demoUser,
          ...formData,
          age: parseInt(formData.age) || undefined,
        };
        localStorage.setItem("demo_user", JSON.stringify(updatedUser));
        setSuccess("Perfil guardado exitosamente (modo demo)");
        toast({
          title: "Perfil guardado",
          description: "Tus cambios se guardaron correctamente.",
        });
      } else {
        // Modo producción - guardar en Supabase
        const nameParts = formData.name.split(" ");
        const { error } = await (supabase as any)
          .from("profiles")
          .update({
            first_name: nameParts[0] || "",
            last_name: nameParts.slice(1).join(" ") || "",
            age: parseInt(formData.age) || 25,
            bio: formData.bio,
            // La selección de intereses se persistía solo en demo; en
            // producción se perdía y el perfil seguía mostrando los títulos
            // demo. Misma fuente que lee el perfil (activities_interested).
            activities_interested: formData.interests ?? [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          setError("Error al guardar perfil: " + error.message);
          toast({
            title: "No se pudo guardar",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setSuccess("Perfil guardado exitosamente");
          toast({
            title: "Perfil guardado",
            description: "Tus cambios se guardaron correctamente.",
          });
        }
      }
    } catch (error) {
      setError(
        "Error inesperado al guardar perfil: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar: url }));
    setSuccess("Imagen subida exitosamente");
  };

  const handleImageError = (error: string) => {
    setError(error);
  };

  if (!profile) {
    // Timeout: la carga no debe quedarse en spinner para siempre.
    if (loadTimedOut) {
      return (
        <div className="min-h-screen bg-linear-to-br from-purple-900 via-fuchsia-900 to-red-900 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-white text-lg font-semibold mb-2">
              No se pudo cargar tu perfil
            </p>
            <p className="text-white/80 text-sm mb-6">
              La carga está tardando demasiado. Revisa tu conexión o vuelve a
              intentarlo.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setLoadTimedOut(false);
                  setError("");
                  void loadProfile();
                }}
                className="bg-linear-to-r from-purple-500 to-fuchsia-500 text-white"
              >
                Reintentar
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-white hover:bg-white/20"
              >
                Ir a iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-fuchsia-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando perfil...</p>
          <p className="text-white/60 text-sm mt-2">
            Esto puede tardar unos segundos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${themeConfig.backgroundClass || "edit-profile-gradient"} relative overflow-hidden pb-20`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header: con wrap y sin recortes. Antes "Guardar Cambios" salía
          cortado en móvil porque los 3 elementos no cabían en una línea:
          el título llevaba `truncate` y quedaba en "E...". Ahora el título
          ocupa su propia línea en móvil y nunca se trunca. */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile-single")}
            className="shrink-0 whitespace-nowrap text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al perfil
          </Button>
          <h1 className="order-3 w-full text-center text-base font-bold text-white sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:text-xl">
            Editar Perfil
          </h1>
          <Button
            onClick={handleSave}
            disabled={_isLoading}
            className="shrink-0 whitespace-nowrap bg-linear-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {_isLoading ? (
              "Guardando..."
            ) : (
              <>
                <span className="hidden sm:inline">Guardar Cambios</span>
                <span className="sm:hidden">Guardar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 pb-24 space-y-6 max-w-4xl">
        {/* Confirmación visible al guardar: antes _success/_error se
            seteaban pero nunca se renderizaban, así que pulsar Guardar
            no mostraba nada (además del toast). */}
        {_success && (
          <div
            role="status"
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200"
          >
            ✓ {_success}
          </div>
        )}
        {_error && (
          <div
            role="alert"
            className="rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-200"
          >
            {_error}
          </div>
        )}
        {/* Foto de perfil */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6">
            <h3
              className={`font-semibold ${themeConfig.textClass} mb-4 text-center`}
            >
              Foto de perfil
            </h3>
            <div className="flex items-center justify-center">
              <div className="w-32 h-32 flex items-center justify-center">
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  onError={handleImageError}
                  userId={userId}
                  currentImage={formData.avatar}
                  type="profile"
                  profileType="single"
                  className="w-full h-full"
                />
              </div>
            </div>
            <p className="text-xs text-white/70 text-center mt-2">
              Sube una foto clara de tu rostro para aumentar tus conexiones
            </p>
          </CardContent>
        </Card>

        {/* Información básica */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6 space-y-4">
            <h3 className={`font-semibold ${themeConfig.textClass} mb-4`}>
              Información básica
            </h3>

            <div>
              <label
                className={`block text-sm font-medium ${themeConfig.textClass} mb-2`}
              >
                Nombre completo
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Tu nombre completo"
                className={`bg-white/20 border-white/30 ${themeConfig.textClass} placeholder:text-white/70`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeConfig.textClass} mb-2`}
              >
                Edad
              </label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Tu edad"
                className={`bg-white/20 border-white/30 ${themeConfig.textClass} placeholder:text-white/70`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6 space-y-4">
            <h3 className={`font-semibold ${themeConfig.textClass} mb-4`}>
              Información adicional
            </h3>

            <div>
              <label
                className={`block text-sm font-medium ${themeConfig.textClass} mb-2`}
              >
                Ubicación
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Ciudad donde vives"
                className={`bg-white/20 border-white/30 ${themeConfig.textClass} placeholder:text-white/70`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeConfig.textClass} mb-2`}
              >
                Profesión
              </label>
              <Input
                value={formData.profession}
                onChange={(e) =>
                  handleInputChange("profession", e.target.value)
                }
                placeholder="Tu profesión"
                className={`bg-white/20 border-white/30 ${themeConfig.textClass} placeholder:text-white/70`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Biografía */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6">
            <h3 className={`font-semibold ${themeConfig.textClass} mb-4`}>
              Sobre ti
            </h3>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Cuéntanos sobre ti, qué buscas en el lifestyle swinger..."
              rows={4}
              className={`resize-none bg-white/20 border-white/30 ${themeConfig.textClass} placeholder:text-white/70`}
            />
            <p className={`text-xs ${themeConfig.textClass}/70 mt-2`}>
              {formData.bio.length}/500 caracteres
            </p>
          </CardContent>
        </Card>

        {/* Intereses */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6">
            <h3 className={`font-semibold ${themeConfig.textClass} mb-4`}>
              Intereses
            </h3>
            <p className={`text-sm ${themeConfig.textClass}/70 mb-4`}>
              Selecciona hasta 6 intereses que te representen en el lifestyle
            </p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-4 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm">
              {availableInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant={
                    formData.interests.includes(interest)
                      ? "default"
                      : "secondary"
                  }
                  className={`cursor-pointer transition-all ${
                    formData.interests.includes(interest)
                      ? "bg-linear-to-r from-fuchsia-500 to-purple-500 text-white shadow-md border-0"
                      : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                  }`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                  {formData.interests.includes(interest) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-white/70 mt-2">
              {formData.interests.length}/6 seleccionados
            </p>
          </CardContent>
        </Card>

        {/* 🔒 Intereses Explícitos (Post-Registro) */}
        <ExplicitInterestsEditor
          selectedInterests={formData.explicitInterests}
          onInterestsChange={(interests) =>
            setFormData((prev) => ({ ...prev, explicitInterests: interests }))
          }
          onSave={handleSave}
          className="bg-white/10 backdrop-blur-md border-white/20"
        />

        {/* 🎨 Personalización Visual */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              🎨 Personalización Visual
            </h3>

            {/* Selector de Tema */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/90 mb-2 block">
                  Tema de Colores
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDemoTheme("light")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      demoTheme === "light"
                        ? "border-yellow-400 bg-linear-to-br from-fuchsia-300 via-purple-200 to-indigo-200"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sun className="h-4 w-4" />
                      <span
                        className={
                          demoTheme === "light" ? "text-gray-900" : "text-white"
                        }
                      >
                        ☀️ Claro
                      </span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDemoTheme("dark")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      demoTheme === "dark"
                        ? "border-purple-400 bg-linear-to-br from-gray-900 via-gray-800 to-black"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Moon className="h-4 w-4" />
                      🌙 Oscuro
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Selector de Navbar */}
              <div>
                <label className="text-sm text-white/90 mb-2 block">
                  Estilo de Navegación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNavbarStyle("transparent")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      navbarStyle === "transparent"
                        ? "border-blue-400 bg-transparent"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Eye className="h-4 w-4" />
                      Transparente
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNavbarStyle("solid")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      navbarStyle === "solid"
                        ? "border-purple-400 bg-linear-to-r from-purple-600 to-fuchsia-600"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <EyeOff className="h-4 w-4" />
                      Sólida
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de privacidad */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-glow">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-4">
              Configuración de privacidad
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Mostrar edad</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-white/20 border-white/30"
                  title="Mostrar edad en perfil"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Mostrar ubicación</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-white/20 border-white/30"
                  title="Mostrar ubicación en perfil"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">
                  Aparecer en búsquedas
                </span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-white/20 border-white/30"
                  title="Aparecer en resultados de búsqueda"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardar al final del formulario: el botón del header queda
            fuera de vista al bajar, y antes era el único. */}
        <div className="sticky bottom-4 z-20">
          <Button
            onClick={handleSave}
            disabled={_isLoading}
            className="w-full bg-linear-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-xl"
          >
            <Save className="h-4 w-4 mr-2" />
            {_isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default EditProfileSingle;

