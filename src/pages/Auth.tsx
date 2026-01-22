import React, { useState, useEffect } from "react";
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

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    getCurrentLocation: _getCurrentLocation,
    location: _location,
    isLoading: _locationLoading,
    error: _locationError,
  } = useGeolocation();
  const {
    user: _user,
    session: _session,
    profile: _profile,
    loading: _loading,
    signIn,
    signOut: _signOut,
    isAdmin: _isAdmin,
    isDemo: _isDemo,
    getProfileType: _getProfileType,
    shouldUseProductionAdmin: _shouldUseProductionAdmin,
    appMode: _appMode,
  } = useAuth();

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showLoginLoading, setShowLoginLoading] = useState(false);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [authFeedback, setAuthFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Depurar cambio de activeTab
  useEffect(() => {
    console.log("activeTab cambió:", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const isAutomated =
      typeof navigator !== "undefined" && Boolean((navigator as any).webdriver);
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
      // Usar el método signIn del hook useAuth que maneja correctamente demo y producción
      const result = await signIn(
        formData.email,
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

        // Redirigir segn el tipo de cuenta
        const userWithMetadata = result.user as any;
        const accountType =
          userWithMetadata?.user_metadata?.account_type ||
          userWithMetadata?.user_metadata?.accountType ||
          userWithMetadata?.accountType ||
          formData.accountType ||
          "single";

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
    } catch (error: any) {
      // Mejorar mensajes de error
      let errorMessage = "Error al iniciar sesión";

      if (error?.message) {
        if (error.message.includes("Invalid API key")) {
          errorMessage =
            "Error de configuracin. Por favor, contacta al soporte.";
        } else if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Invalid credentials") ||
          error.message.includes("Invalid login") ||
          error.message.includes("Invalid password") ||
          error.message.includes("Authentication failed")
        ) {
          errorMessage = "Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Por favor, confirma tu correo electrnico antes de iniciar sesión";
        } else if (error.message.includes("User not found")) {
          errorMessage = "Usuario no encontrado. Verifica tu correo electrnico";
        } else {
          errorMessage = error.message;
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
    // Aquí se implementaría la lógica de recuperación de contraseña
    toast({
      title: "Recuperación de contraseña",
      description: "Se ha enviado un correo de recuperación a " + resetEmail,
    });
    setShowResetPassword(false);
    setResetEmail("");
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
      _getCurrentLocation();
      if (_location && _location.latitude && _location.longitude) {
        setFormData((prev) => ({
          ...prev,
          location: `${_location.latitude},${_location.longitude}`,
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
    return (
      <LoginLoadingScreen
        onComplete={() => setShowLoginLoading(false)}
        userType="single"
      />
    );
  }

  return (
    <ResponsiveContainer className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-visible">
      {/* Corazones decorativos flotantes */}
      <DecorativeHearts count={6} />

      {/* Background completamente uniforme - sin bloques visibles */}

      <div className="relative z-10 w-full max-w-md">
        {/* Card con glassmorphism mejorado - más transparente para ver fondo */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl overflow-visible">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="bg-linear-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThemeModal(true)}
                  className="bg-linear-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
                >
                  Tema
                </Button>
                <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // Toggle entre modo normal y admin
                  const isAdminMode = formData.email.includes(
                    import.meta.env.VITE_ADMIN_EMAIL || "",
                  );

                  console.log("Botón Admin clickeado:", { isAdminMode, activeTab });

                  // Siempre cambiar a pestaña de login cuando se activa modo Admin
                  if (!isAdminMode) {
                    // NO prellenar email - dejar que el usuario lo ingrese manualmente
                    setFormData((prev) => ({
                      ...prev,
                      password: "",
                    }));

                    // Forzar cambio de pestaña de login
                    setActiveTab("signin");
                    console.log("setActiveTab('signin') llamado");

                    // Forzar re-renderizado con un pequeño delay
                    setTimeout(() => {
                      setActiveTab("signin");
                      console.log("setActiveTab('signin') llamado en timeout");
                    }, 10);

                    toast({
                      title: "Modo Admin Activado",
                      description: "Ingresa tu email de administrador para continuar",
                    });
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      email: "",
                      password: "",
                    }));
                    toast({
                      title: "Modo Normal Activado",
                      description: "Ingresa tus credenciales de usuario",
                    });
                  }
                }}
                className="bg-linear-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/40 hover:to-emerald-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
                data-testid="toggle-auth-mode"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
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
              defaultValue="signin"
              onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg">
                <TabsTrigger
                  value="signin"
                  data-testid="switch-to-login"
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:border-purple-400/50 text-white/70 hover:text-white/90 transition-all duration-300"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  data-testid="switch-to-register"
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:border-purple-400/50 text-white/70 hover:text-white/90 transition-all duration-300"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form
                  onSubmit={handleSignIn}
                  autoComplete="off"
                  className="space-y-4"
                  data-testid="login-form"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Correo electrnico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      placeholder="tu@email.com"
                      autoComplete="email"
                      data-testid="email-input"
                      className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-white font-medium"
                    >
                      Contrasea
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      minLength={6}
                      placeholder="Tu contraseña"
                      autoComplete="current-password"
                      data-testid="password-input"
                      className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-sm text-purple-300 hover:text-purple-200 underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:scale-105"
                    data-testid="login-button"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                  >
                    Iniciar Sesión
                  </Button>

                  {authFeedback && (
                    <p
                      data-testid="auth-feedback"
                      role="status"
                      className={
                        authFeedback.type === "error"
                          ? "text-sm text-red-300"
                          : "text-sm text-green-300"
                      }
                    >
                      {authFeedback.message}
                    </p>
                  )}

                  {/* Demo Login Button con glassmorphism mejorado - Navega a selector */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-yellow-400/50 bg-linear-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 backdrop-blur-sm text-white font-semibold hover:from-yellow-500/40 hover:via-amber-500/40 hover:to-yellow-500/40 hover:border-yellow-400 hover:text-white hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
                    onClick={() => navigate("/demo")}
                    data-testid="demo-login-button"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400/0 via-yellow-400/20 to-yellow-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"></div>
                    <Sparkles className="w-4 h-4 mr-2 relative z-10 group-hover:animate-spin" />
                    <span className="relative z-10">Acceso Demo</span>
                  </Button>

                  {/* Club Demo Button - Próximamente */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full border-2 border-purple-400/50 bg-linear-to-r from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 backdrop-blur-sm text-white/70 font-semibold cursor-not-allowed relative overflow-hidden"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    <span>Club Demo - Próximamente</span>
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" data-testid="register-form">
                <div className="space-y-4">
                  <div className="flex gap-4 justify-center mb-4">
                    <Button
                      onClick={() => handleInputChange("accountType", "single")}
                      className="flex-1 bg-linear-to-r from-purple-600 to-blue-600 text-white"
                    >
                      Soltero/a
                    </Button>
                    <Button
                      onClick={() => handleInputChange("accountType", "couple")}
                      className="flex-1 bg-linear-to-r from-pink-600 to-purple-600 text-white"
                    >
                      Pareja
                    </Button>
                  </div>

                  {formData.accountType && (
                    <Button
                      onClick={handleAutoLocation}
                      disabled={autoLocationRequested}
                      className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white"
                    >
                      {autoLocationRequested ? "Ubicación obtenida" : "Obtener mi ubicación"}
                    </Button>
                  )}

                  {formData.accountType === "single" ? (
                    <SingleRegistrationForm onSuccess={() => navigate("/")} />
                  ) : formData.accountType === "couple" ? (
                    <CoupleRegistrationForm onSuccess={() => navigate("/")} />
                  ) : null}
                </div>
              </TabsContent>
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
                  setFormData((prev) => ({ ...prev, preferredTheme: "dark" }));
                  setShowThemeModal(false);
                }}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white"
              >
                Tema Oscuro
              </Button>
              <Button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, preferredTheme: "light" }));
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

