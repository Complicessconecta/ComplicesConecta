import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, ArrowLeft, Sparkles, Building } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LoginLoadingScreen } from "@/components/LoginLoadingScreen";
import { useAuth } from "@/features/auth/useAuth";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { SingleRegistrationForm } from "@/components/profiles/single/SingleRegistrationForm";
import { CoupleRegistrationForm } from "@/components/profiles/couple/CoupleRegistrationForm";
import { SharedTermsModal } from "@/components/modals/SharedTermsModal";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/ui/ThemeProvider";
import { logger } from "@/lib/logger";

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: string;
  birthDate: string;
  gender: string;
  interestedIn: string;
  bio: string;
  role: string;
  accountType: string;
  phone: string; // Teléfono para validación MX
  partnerFirstName: string;
  partnerLastName: string;
  partnerNickname: string;
  partnerAge: string;
  partnerBirthDate: string;
  partnerGender: string;
  partnerInterestedIn: string;
  partnerBio: string;
  location: string;
  acceptTerms: boolean;
  shareLocation: boolean;
  selectedInterests: string[];
  preferredTheme: string;
  profileTheme: string;
}

// Interfaces para tipos extendidos
type NavigatorWithWebDriver = Navigator & {
  webdriver?: boolean;
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    getCurrentLocation,
    location,
  } = useGeolocation();
  const { signIn, signOut, isDemoMode, isAdmin } = useAuth();

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showLoginLoading, setShowLoginLoading] = useState(false);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isAdminLoginMode, setIsAdminLoginMode] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const AuthFeedback = ({
    feedback,
  }: {
    feedback: { type: "success" | "error"; message: string };
  }) =>
    feedback.type === "error" ? (
      <div
        className="rounded-lg border px-3 py-2 text-sm backdrop-blur-sm bg-red-500/10 border-red-500/30 text-red-200"
        role="alert"
        aria-live="assertive"
      >
        {feedback.message}
      </div>
    ) : (
      <div
        className="rounded-lg border px-3 py-2 text-sm backdrop-blur-sm bg-green-500/10 border-green-500/30 text-green-200"
        role="status"
        aria-live="polite"
      >
        {feedback.message}
      </div>
    );

  let setTheme: (theme: "light" | "dark" | "system") => void = () => {};
  try {
    const themeContext = useTheme();
    setTheme = themeContext.setTheme;
  } catch {
    setTheme = () => {};
  }

  // Depurar cambio de activeTab
  useEffect(() => {
    console.log("activeTab cambió:", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const isAutomated =
      typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithWebDriver).webdriver);
    if (!isAutomated) return;

    const testEmail = import.meta.env.VITE_TESTSPRITE_EMAIL as string | undefined;
    const testPassword = import.meta.env.VITE_TESTSPRITE_PASSWORD as
      | string
      | undefined;

    if (!testEmail || !testPassword) return;

    setFormData((prev) => {
      if (prev.email || prev.password) {
        return prev;
      }
      return {
        ...prev,
        email: testEmail,
        password: testPassword,
      };
    });
  }, []);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    nickname: "",
    age: "",
    birthDate: "",
    gender: "",
    interestedIn: "",
    bio: "",
    role: "user",
    accountType: "single",
    phone: "", // Teléfono agregado para validación MX
    partnerFirstName: "",
    partnerLastName: "",
    partnerNickname: "",
    partnerAge: "",
    partnerBirthDate: "",
    partnerGender: "",
    partnerInterestedIn: "",
    partnerBio: "",
    location: "",
    acceptTerms: false,
    shareLocation: false,
    selectedInterests: [],
    preferredTheme: "dark",
    profileTheme: "dark",
  });

  const handleInputChange = (
    field: string,
    value: string | boolean | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthFeedback(null);

    let didSucceed = false;

    try {
      // Determinar si el input es un ID de administrador o un correo
      const input = formData.email.trim();
      const isAdminId = input.startsWith('admin_') && input.includes('_');

      const loginEmail = formData.email;

      // Si es un ID de administrador, buscar el correo correspondiente
      if (isAdminId) {
        throw new Error("Login por ID de administrador no está disponible en cliente");
      }

      // Usar el método signIn del hook useAuth que maneja correctamente demo y producción
      const result = await signIn(
        loginEmail,
        formData.password,
        formData.accountType || "single",
      );

      if (result && result.user) {
        didSucceed = true;
        setShowLoginLoading(true);
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido de vuelta a ComplicesConecta",
        });

        setAuthFeedback({
          type: "success",
          message: "Inicio de sesión exitoso",
        });

        // Redirigir según el tipo de cuenta y modo admin
        const userWithMetadata = result.user;

        const meta =
          userWithMetadata &&
          typeof userWithMetadata === "object" &&
          "user_metadata" in userWithMetadata
            ? userWithMetadata.user_metadata
            : undefined;

        const accountTypeFromMeta =
          meta &&
          typeof meta === "object" &&
          "account_type" in meta &&
          typeof meta.account_type === "string"
            ? meta.account_type
            : meta &&
                typeof meta === "object" &&
                "accountType" in meta &&
                typeof meta.accountType === "string"
              ? meta.accountType
              : undefined;

        const accountTypeFromUser =
          userWithMetadata &&
          typeof userWithMetadata === "object" &&
          "accountType" in userWithMetadata &&
          typeof userWithMetadata.accountType === "string"
            ? userWithMetadata.accountType
            : undefined;

        const accountType =
          accountTypeFromMeta || accountTypeFromUser || formData.accountType || "single";

        // Verificar si es admin y redirigir al panel correspondiente
        const isAdminUser = isAdmin();
        
        // Personalizar mensaje de bienvenida según rol
        const nickname =
          meta &&
          typeof meta === "object" &&
          "nickname" in meta &&
          typeof meta.nickname === "string"
            ? meta.nickname
            : "";

        const firstName =
          meta &&
          typeof meta === "object" &&
          "first_name" in meta &&
          typeof meta.first_name === "string"
            ? meta.first_name
            : "";

        const welcomeMessage = isAdminUser
          ? "Bienvenido Administrador"
          : `Bienvenido de vuelta ${nickname || firstName}`;
        
        toast({
          title: "Inicio de sesión exitoso",
          description: welcomeMessage,
        });

        setAuthFeedback({
          type: "success",
          message: isAdminUser ? "Acceso administrador verificado" : "Inicio de sesión exitoso",
        });
        
        // Redirección inmediata para admin, sin timeout
        if (isAdminLoginMode || isAdminUser) {
          try {
            const { data: isAdminRpc, error: rpcError } = await supabase.rpc("is_admin");
            if (rpcError) {
              throw rpcError;
            }
            if (isAdminRpc === true) {
              navigate("/admin/dashboard");
              return;
            }
          } catch (error) {
            logger.error("❌ Admin verification failed", {
              error: error instanceof Error ? error.message : String(error),
            });
          }

          await signOut();
          toast({
            variant: "destructive",
            title: "Acceso Denegado",
            description: "No tienes permisos de administrador",
          });
          navigate("/auth");
          return;
        }
        
        setTimeout(() => {
          if (accountType === "couple") {
            navigate("/profile-couple");
          } else {
            navigate("/profile-single");
          }
        }, 3000);
      } else {
        throw new Error("No se recibieron datos de usuario");
      }
    } catch (error) {
      // Mejorar mensajes de error
      let errorMessage = "Error al iniciar sesión";

      const errorText = error instanceof Error ? error.message : String(error);
      if (errorText) {
        if (errorText.includes("Invalid API key")) {
          errorMessage =
            "Error de configuracin. Por favor, contacta al soporte.";
        } else if (
          errorText.includes("Invalid login credentials") ||
          errorText.includes("Invalid credentials") ||
          errorText.includes("Invalid login") ||
          errorText.includes("Invalid password") ||
          errorText.includes("Authentication failed")
        ) {
          errorMessage = "Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.";
        } else if (errorText.includes("Email not confirmed")) {
          errorMessage =
            "Por favor, confirma tu correo electrnico antes de iniciar sesión";
        } else if (errorText.includes("User not found")) {
          errorMessage = "Usuario no encontrado. Verifica tu correo electrnico";
        } else {
          errorMessage = errorText;
        }
      }

      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: errorMessage,
      });

      setAuthFeedback({
        type: "error",
        message: errorMessage,
      });
    } finally {
      if (!didSucceed) {
        setShowLoginLoading(false);
      }
    }
  };

  // handleSignUp eliminado - los formularios SingleRegistrationForm y CoupleRegistrationForm manejan su propia lógica

  // Handler para recuperación de contraseña
  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
      });
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Recuperación de contraseña",
        description: "Se ha enviado un correo de recuperación a " + resetEmail,
      });
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el correo de recuperación",
      });
    }
  };

  // Handler para solicitar ubicación automática
  const handleAutoLocation = async () => {
    if (autoLocationRequested) {
      toast({
        title: "Ubicación ya solicitada",
        description: "La ubicación ya ha sido solicitada anteriormente",
      });
      return;
    }
    try {
      getCurrentLocation();
      if (location && location.latitude && location.longitude) {
        setFormData((prev) => ({
          ...prev,
          location: `${location.latitude},${location.longitude}`,
        }));
        setAutoLocationRequested(true);
        toast({
          title: "Ubicación obtenida",
          description: "Tu ubicación ha sido obtenida exitosamente",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al obtener ubicación",
        description: "No se pudo obtener tu ubicación automáticamente",
      });
    }
  };

  if (showLoginLoading) {
    const inferredName = formData.email?.split("@")[0];
    const inferredProfile = inferredName
      ? formData.accountType === "couple"
        ? {
            nickname: formData.nickname || inferredName,
            firstName: formData.firstName || inferredName,
            coupleName: inferredName,
          }
        : {
            nickname: formData.nickname || inferredName,
            firstName: formData.firstName || inferredName,
          }
      : undefined;
    const loadingUserType = isAdminLoginMode
      ? "admin"
      : formData.accountType === "couple"
        ? "couple"
        : "single";

    return (
      <LoginLoadingScreen
        onComplete={() => setShowLoginLoading(false)}
        userType={loadingUserType}
        userName={isAdminLoginMode ? "Administrador" : formData.email}
        userProfile={inferredProfile ?? {}}
      />
    );
  }

  return (
    <ResponsiveContainer className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-visible">
      {/* Corazones decorativos flotantes */}
      <DecorativeHearts count={6} />

      {/* Background completamente uniforme - sin bloques visibles */}

      <div className="relative z-10 w-full max-w-md">
        {authFeedback && (
          <div className="mb-3">
            <AuthFeedback feedback={authFeedback} />
          </div>
        )}
        {/* Card con glassmorphism mejorado - más transparente para ver fondo */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl overflow-visible">
          <CardHeader className="text-center">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="bg-linear-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="flex flex-wrap justify-end gap-2 max-w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThemeModal(true)}
                  className="h-9 px-4 bg-linear-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
                >
                  Tema
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (typeof isDemoMode === "function" && isDemoMode()) {
                      await signOut();
                      return;
                    }
                    navigate("/demo");
                  }}
                  className="h-9 px-4 bg-linear-to-r from-pink-600/20 to-fuchsia-600/20 hover:from-pink-600/40 hover:to-fuchsia-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-fuchsia-500/30 transition-all duration-300 hover:scale-105"
                  data-testid="demo-mode-button"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {typeof isDemoMode === "function" && isDemoMode()
                    ? "Cerrar sesión"
                    : "Demo"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/clubs/demo")}
                  className="h-9 px-4 bg-linear-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
                  data-testid="clubs-demo-button"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Club Demo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const nextMode = !isAdminLoginMode;
                    setIsAdminLoginMode(nextMode);
                    setFormData((prev) => ({
                      ...prev,
                      email: "",
                      password: "",
                    }));

                    setActiveTab("signin");

                    toast({
                      title: nextMode
                        ? "Modo Admin Activado"
                        : "Modo Usuario Activado",
                      description: nextMode
                        ? "Ingresa tu email de administrador para continuar"
                        : "Ingresa tus credenciales de usuario",
                    });
                  }}
                  className="h-9 px-4 bg-linear-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/40 hover:to-emerald-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
                  data-testid="toggle-auth-mode"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {isAdminLoginMode ? "Usuario" : "Admin"}
                </Button>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-linear-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
              ComplicesConecta
            </CardTitle>
            <CardDescription className="text-white/90 font-medium text-lg">
              Conecta con personas afines en un entorno seguro y discreto
            </CardDescription>

            <div className="flex justify-center space-x-8 mt-6 mb-4">
              <div className="text-center">
                <Shield className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-white font-medium">Seguro</p>
              </div>
              <div className="text-center">
                <Users className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-white font-medium">Comunidad</p>
              </div>
              <div className="text-center">
                <Sparkles className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-white font-medium">IA Match</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
              className="w-full"
            >
              <TabsList
                className={`grid w-full max-w-md mx-auto ${isAdminLoginMode ? "grid-cols-1" : "grid-cols-2"} bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg items-center justify-center`}
              >
                <TabsTrigger
                  value="signin"
                  data-testid="switch-to-login"
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:border-purple-400/50 text-white/70 hover:text-white/90 transition-all duration-300 w-full h-10 flex items-center justify-center"
                >
                  Iniciar Sesión
                </TabsTrigger>
                {!isAdminLoginMode && (
                  <TabsTrigger
                    value="signup"
                    data-testid="switch-to-register"
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:border-purple-400/50 text-white/70 hover:text-white/90 transition-all duration-300 w-full h-10 flex items-center justify-center"
                  >
                    Registrarse
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="signin">
                <form
                  onSubmit={handleSignIn}
                  autoComplete="off"
                  className="space-y-4"
                  data-testid="login-form"
                >
                  <div>
                    <Label htmlFor="email" className="text-white">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="tu@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder-white/70"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-white">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="********"
                      className="bg-white/10 border-white/20 text-white placeholder-white/70"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-stretch">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(true);
                      }}
                      variant="outline"
                      className="h-11 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                    <Button
                      type="submit"
                      className="h-11 bg-linear-to-r from-purple-600 to-blue-600 text-white"
                    >
                      Iniciar Sesión
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {!isAdminLoginMode && (
                <TabsContent value="signup" data-testid="register-form">
                  <div className="space-y-4">
                    <div className="flex gap-4 justify-center mb-4">
                      <Button
                        type="button"
                        onClick={() => handleInputChange("accountType", "single")}
                        className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 text-white"
                      >
                        Soltero/a
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleInputChange("accountType", "couple")}
                        className="flex-1 bg-linear-to-r from-pink-600 to-purple-600 text-white"
                      >
                        Pareja
                      </Button>
                    </div>

                    {formData.accountType && (
                      <Button
                        type="button"
                        onClick={handleAutoLocation}
                        disabled={autoLocationRequested}
                        className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white"
                      >
                        {autoLocationRequested
                          ? "Ubicación obtenida"
                          : "Obtener mi ubicación"}
                      </Button>
                    )}

                    {formData.accountType === "single" ? (
                      <SingleRegistrationForm onSuccess={() => navigate("/")} />
                    ) : formData.accountType === "couple" ? (
                      <CoupleRegistrationForm onSuccess={() => navigate("/")} />
                    ) : null}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modal de recuperación de contraseña */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 rounded-2xl shadow-2xl border border-purple-500/40 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recuperar Contraseña</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reset-email" className="text-white">Correo electrónico</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="bg-white/10 border-white/20 text-white placeholder-white/70"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail("");
                  }}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleResetPassword}
                  className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 text-white"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de tema */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 rounded-2xl shadow-2xl border border-purple-500/40 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Cambiar Tema</h3>
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setTheme("dark");
                  setShowThemeModal(false);
                }}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white"
              >
                Tema Oscuro
              </Button>
              <Button
                onClick={() => {
                  setTheme("light");
                  setShowThemeModal(false);
                }}
                className="w-full bg-linear-to-r from-pink-600 to-purple-600 text-white"
              >
                Tema Claro
              </Button>
              <Button
                onClick={() => setShowThemeModal(false)}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de términos y condiciones */}
      <SharedTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={(termsAccepted, privacyAccepted) => {
          console.log("Términos aceptados:", termsAccepted, "Privacidad aceptada:", privacyAccepted);
        }}
      />
    </ResponsiveContainer>
  );
};

export default Auth;

