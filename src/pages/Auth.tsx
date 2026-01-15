import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import RegisterForm from "@/components/auth/RegisterForm";

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

  const [isLoading, setIsLoading] = useState(false);
  const [__showResetPassword, _setShowResetPassword] = useState(false);
  const [__resetEmail, _setResetEmail] = useState("");
  const [showLoginLoading, setShowLoginLoading] = useState(false);
  const [__autoLocationRequested, _setAutoLocationRequested] = useState(false);
  const [__showThemeModal, _setShowThemeModal] = useState(false);
  const [__showTermsModal, _setShowTermsModal] = useState(false);
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
    setIsLoading(true);
    setShowLoginLoading(true);

    try {
      // Usar el método signIn del hook useAuth que maneja correctamente demo y producción
      const result = await signIn(
        formData.email,
        formData.password,
        formData.accountType || "single",
      );

      if (result && result.user) {
        toast({
          title: "Inicio de sesin exitoso",
          description: "Bienvenido de vuelta a ComplicesConecta",
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
      let errorMessage = "Error al iniciar sesin";

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
            "Por favor, confirma tu correo electrnico antes de iniciar sesin";
        } else if (error.message.includes("User not found")) {
          errorMessage = "Usuario no encontrado. Verifica tu correo electrnico";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: "destructive",
        title: "Error al iniciar sesin",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setShowLoginLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validaciones adicionales
      if (!formData.acceptTerms) {
        throw new Error("Debes aceptar los trminos y condiciones");
      }

      if (formData.age && parseInt(formData.age) < 18) {
        throw new Error("Debes ser mayor de 18 aos");
      }

      if (
        formData.accountType === "couple" &&
        formData.partnerAge &&
        parseInt(formData.partnerAge) < 18
      ) {
        throw new Error("Tu pareja debe ser mayor de 18 aos");
      }

      // Crear usuario en Supabase
      if (!supabase) {
        throw new Error("Supabase no est disponible");
      }

      const { data: _authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            display_name: formData.nickname,
            account_type: formData.accountType,
            profile_type: formData.accountType,
            age: parseInt(formData.age),
            gender: formData.gender,
            interested_in: formData.interestedIn,
            bio: formData.bio,
            location: formData.location,
            share_location: formData.shareLocation,
            // Datos de pareja si aplica
            ...(formData.accountType === "couple" && {
              partner_first_name: formData.partnerFirstName,
              partner_last_name: formData.partnerLastName,
              partner_display_name: formData.partnerNickname,
              partner_age: parseInt(formData.partnerAge),
              partner_gender: formData.partnerGender,
              partner_interested_in: formData.partnerInterestedIn,
            }),
          },
        },
      });

      if (authError) throw authError;

      toast({
        title: "Cuenta creada exitosamente!",
        description: "Revisa tu correo para verificar tu cuenta",
      });

      // Redirigir al login despus del registro
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear cuenta",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
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
    <ResponsiveContainer className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      {/* Corazones decorativos flotantes */}
      <DecorativeHearts count={6} />

      {/* Background completamente uniforme - sin bloques visibles */}

      <div className="relative z-10 w-full max-w-md">
        {/* Card con glassmorphism mejorado - más transparente para ver fondo */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // Toggle entre modo normal y admin
                  const isAdminMode = formData.email.includes(
                    "complicesconectasw@outlook.es",
                  );
                  if (!isAdminMode) {
                    setFormData((prev) => ({
                      ...prev,
                      email: import.meta.env.VITE_ADMIN_EMAIL || "",
                      password: "",
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      email: "",
                      password: "",
                    }));
                  }
                }}
                className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/40 hover:to-emerald-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
                data-testid="toggle-auth-mode"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
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
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg">
                <TabsTrigger 
                  value="signin" 
                  data-testid="switch-to-login"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:border-purple-400/50 text-white/70 hover:text-white/90 transition-all duration-300"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  data-testid="switch-to-register"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 data-[state=active]:border-purple-400/50 text-white/70 hover:text-white/90 transition-all duration-300"
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
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:scale-105"
                    data-testid="login-button"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                  >
                    Iniciar Sesión
                  </Button>

                  {/* Demo Login Button con glassmorphism mejorado - Navega a selector */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 backdrop-blur-sm text-white font-semibold hover:from-yellow-500/40 hover:via-amber-500/40 hover:to-yellow-500/40 hover:border-yellow-400 hover:text-white hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group"
                    onClick={() => navigate("/demo")}
                    data-testid="demo-login-button"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/20 to-yellow-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                    <Sparkles className="w-4 h-4 mr-2 relative z-10 group-hover:animate-spin" />
                    <span className="relative z-10">Acceso Demo</span>
                  </Button>

                  {/* Club Demo Button - Próximamente */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full border-2 border-purple-400/50 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 backdrop-blur-sm text-white/70 font-semibold cursor-not-allowed relative overflow-hidden"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    <span>Club Demo - Próximamente</span>
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" data-testid="register-form">
                <RegisterForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSignUp={handleSignUp}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
};

export default Auth;
