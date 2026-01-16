import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, ArrowLeft, Sparkles } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LoginLoadingScreen } from "@/components/LoginLoadingScreen";
import { useAuth } from "@/features/auth/useAuth";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { Theme } from "@/features/profile/useProfileTheme";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { PhoneInput } from "@/components/forms/PhoneInput";
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
  preferredTheme: Theme;
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showLoginLoading, setShowLoginLoading] = useState(false);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
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

  const getDeviceInfo = (): {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
  } => {
    const ua = navigator.userAgent;

    return {
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    };
  };

  const encodeEvidenceBase64 = (data: unknown): string => {
    try {
      const jsonString = JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(jsonString)));
    } catch (error) {
      logger.error("Error al codificar evidencia:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return "";
    }
  };

  const saveTermsAcceptanceEvidence = async (params: {
    userId: string;
    documentSlug: string;
    documentVersion: string;
  }) => {
    try {
      const deviceInfo = getDeviceInfo();
      const acceptedAt = new Date().toISOString();

      const evidence = {
        userId: params.userId,
        deviceInfo,
        acceptedAt,
        documentSlug: params.documentSlug,
        documentVersion: params.documentVersion,
        location: formData.location || null,
      };

      const evidenceEncoded = encodeEvidenceBase64(evidence);

      if (supabase) {
        const { error } = await supabase.from("legal_consents").insert({
          user_id: params.userId,
          document_slug: params.documentSlug,
          document_version: params.documentVersion,
          accepted_at: acceptedAt,
          ip: null,
          user_agent: deviceInfo.userAgent,
          device_info: deviceInfo,
          evidence_encrypted: evidenceEncoded,
        });

        if (error) {
          logger.error("Error al guardar evidencia de aceptación:", {
            error: error.message,
          });
        } else {
          logger.info("Evidencia de aceptación guardada exitosamente");
        }
      }
    } catch (error) {
      logger.error("Error al guardar evidencia de aceptación:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
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
          title: "Inicio de sesion exitoso",
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
            "Error de configuracion. Por favor, contacta al soporte.";
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
            "Por favor, confirma tu correo electronico antes de iniciar sesion";
        } else if (error.message.includes("User not found")) {
          errorMessage = "Usuario no encontrado. Verifica tu correo electronico";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: "destructive",
        title: "Error al iniciar sesion",
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
        throw new Error("Tu pareja debe ser mayor de 18 años");
      }

      // Crear usuario en Supabase
      if (!supabase) {
        throw new Error("Supabase no esta disponible");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
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

      if (authData?.user && formData.acceptTerms) {
        await saveTermsAcceptanceEvidence({
          userId: authData.user.id,
          documentSlug: "terminos_y_condiciones",
          documentVersion: "1.0",
        });
      }

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
                onClick={() => {
                  // Toggle entre modo normal y admin
                  setIsAdminMode(!isAdminMode);
                  setFormData((prev) => ({
                    ...prev,
                    email: "",
                    password: "",
                  }));
                }}
                className={`bg-gradient-to-r hover:scale-105 transition-all duration-300 hover:shadow-lg ${
                  isAdminMode
                    ? "from-green-600/20 to-emerald-600/40 hover:from-green-600/40 hover:to-emerald-600/60 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm hover:shadow-green-500/30"
                    : "from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 text-white/90 hover:text-white border border-white/20 hover:border-white/40 backdrop-blur-sm hover:shadow-purple-500/30"
                }`}
                data-testid="toggle-auth-mode"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isAdminMode ? "Admin" : "Normal"}
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
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="text"
                      inputMode="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      required
                      placeholder="tu@email.com"
                      autoComplete="off"
                      readOnly={!isEmailFocused}
                      onClick={() => setIsEmailFocused(true)}
                      data-testid="email-input"
                      className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-white font-medium"
                    >
                      Contraseña
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

                  {/* ¿Olvidaste tu contraseña? */}
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="w-full text-sm text-purple-300 hover:text-purple-200 underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" data-testid="register-form">
                <form onSubmit={handleSignUp} autoComplete="off" className="space-y-4">
                  {/* Tipo de Cuenta */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium">
                      Tipo de Cuenta
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={
                          formData.accountType === "single"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleInputChange("accountType", "single")
                        }
                        className={`text-sm font-semibold ${formData.accountType === "single" ? "bg-purple-600 text-white shadow-lg" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}`}
                      >
                        👤 Soltero/a
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.accountType === "couple"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleInputChange("accountType", "couple")
                        }
                        className={`text-sm font-semibold ${formData.accountType === "couple" ? "bg-purple-600 text-white shadow-lg" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}`}
                      >
                        💑 Pareja
                      </Button>
                    </div>
                  </div>

                  {/* Información Básica */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-white font-medium"
                    >
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      required
                      placeholder="Tu nombre"
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-white font-medium"
                    >
                      Apellido
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      required
                      placeholder="Tu apellido"
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="nickname"
                      className="text-white font-medium"
                    >
                      Nombre de Usuario
                    </Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) =>
                        handleInputChange("nickname", e.target.value)
                      }
                      required
                      placeholder="Nombre pblico"
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-white font-medium">
                      Edad
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="99"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  {/* Campo de teléfono con validación MX */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white font-medium">
                      Teléfono{" "}
                      <span className="text-white/60 text-sm">(México)</span>
                    </Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => handleInputChange("phone", value)}
                      placeholder="55 1234 5678"
                      required
                      showValidation={true}
                      autoFormat={true}
                      className="w-full"
                    />
                  </div>

                  {/* Campo de teléfono con validación MX */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white font-medium">
                      Teléfono{" "}
                      <span className="text-white/60 text-sm">(México)</span>
                    </Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => handleInputChange("phone", value)}
                      placeholder="55 1234 5678"
                      required
                      showValidation={true}
                      autoFormat={true}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-white font-medium">
                      Gnero
                    </Label>
                    <select
                      id="gender"
                      aria-label="Selecciona tu género"
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
                    >
                      <option value="" className="bg-purple-900 text-white">
                        Selecciona tu gnero
                      </option>
                      <option value="male" className="bg-purple-900 text-white">
                        Masculino
                      </option>
                      <option
                        value="female"
                        className="bg-purple-900 text-white"
                      >
                        Femenino
                      </option>
                      <option
                        value="non-binary"
                        className="bg-purple-900 text-white"
                      >
                        No binario
                      </option>
                      <option
                        value="other"
                        className="bg-purple-900 text-white"
                      >
                        Otro
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="interestedIn"
                      className="text-white font-medium"
                    >
                      Interesado en
                    </Label>
                    <select
                      id="interestedIn"
                      aria-label="Selecciona en quién estás interesado"
                      value={formData.interestedIn}
                      onChange={(e) =>
                        handleInputChange("interestedIn", e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
                    >
                      <option value="" className="bg-purple-900 text-white">
                        Selecciona tu interes
                      </option>
                      <option value="male" className="bg-purple-900 text-white">
                        Hombres
                      </option>
                      <option
                        value="female"
                        className="bg-purple-900 text-white"
                      >
                        Mujeres
                      </option>
                      <option value="both" className="bg-purple-900 text-white">
                        Ambos
                      </option>
                      <option
                        value="couples"
                        className="bg-purple-900 text-white"
                      >
                        Parejas
                      </option>
                    </select>
                  </div>

                  {/* Información de Pareja - Solo si es pareja */}
                  {formData.accountType === "couple" && (
                    <>
                      <div className="border-t border-white/20 pt-4">
                        <h4 className="text-white font-medium mb-4">
                          Información de tu Pareja
                        </h4>

                        <div className="space-y-2">
                          <Label
                            htmlFor="partnerFirstName"
                            className="text-white font-medium"
                          >
                            Nombre de tu Pareja
                          </Label>
                          <Input
                            id="partnerFirstName"
                            value={formData.partnerFirstName}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerFirstName",
                                e.target.value,
                              )
                            }
                            required
                            placeholder="Nombre de tu pareja"
                            className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="partnerLastName"
                            className="text-white font-medium"
                          >
                            Apellido de tu Pareja
                          </Label>
                          <Input
                            id="partnerLastName"
                            value={formData.partnerLastName}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerLastName",
                                e.target.value,
                              )
                            }
                            required
                            placeholder="Apellido de tu pareja"
                            className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="partnerNickname"
                            className="text-white font-medium"
                          >
                            Nombre de Usuario de tu Pareja
                          </Label>
                          <Input
                            id="partnerNickname"
                            value={formData.partnerNickname}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerNickname",
                                e.target.value,
                              )
                            }
                            required
                            placeholder="Nombre pblico de tu pareja"
                            className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="partnerAge"
                            className="text-white font-medium"
                          >
                            Edad de tu Pareja
                          </Label>
                          <Input
                            id="partnerAge"
                            type="number"
                            min="18"
                            max="99"
                            value={formData.partnerAge}
                            onChange={(e) =>
                              handleInputChange("partnerAge", e.target.value)
                            }
                            required
                            className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="partnerGender"
                            className="text-white font-medium"
                          >
                            Gnero de tu Pareja
                          </Label>
                          <select
                            id="partnerGender"
                            aria-label="Selecciona el género de tu pareja"
                            value={formData.partnerGender}
                            onChange={(e) =>
                              handleInputChange("partnerGender", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
                          >
                            <option
                              value=""
                              className="bg-purple-900 text-white"
                            >
                              Selecciona el genero
                            </option>
                            <option
                              value="male"
                              className="bg-purple-900 text-white"
                            >
                              Masculino
                            </option>
                            <option
                              value="female"
                              className="bg-purple-900 text-white"
                            >
                              Femenino
                            </option>
                            <option
                              value="non-binary"
                              className="bg-purple-900 text-white"
                            >
                              No binario
                            </option>
                            <option
                              value="other"
                              className="bg-purple-900 text-white"
                            >
                              Otro
                            </option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="partnerInterestedIn"
                            className="text-white font-medium"
                          >
                            Interesado en
                          </Label>
                          <select
                            id="partnerInterestedIn"
                            aria-label="Selecciona en quién está interesada tu pareja"
                            value={formData.partnerInterestedIn}
                            onChange={(e) =>
                              handleInputChange(
                                "partnerInterestedIn",
                                e.target.value,
                              )
                            }
                            required
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 [&>option]:bg-purple-900 [&>option]:text-white [color-scheme:dark]"
                          >
                            <option
                              value=""
                              className="bg-purple-900 text-white"
                            >
                              Selecciona el interes
                            </option>
                            <option
                              value="male"
                              className="bg-purple-900 text-white"
                            >
                              Hombres
                            </option>
                            <option
                              value="female"
                              className="bg-purple-900 text-white"
                            >
                              Mujeres
                            </option>
                            <option
                              value="both"
                              className="bg-purple-900 text-white"
                            >
                              Ambos
                            </option>
                            <option
                              value="couples"
                              className="bg-purple-900 text-white"
                            >
                              Parejas
                            </option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Información Adicional */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Correo electrónico
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
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-white font-medium"
                    >
                      Contraseña
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
                      placeholder="Mnimo 6 caracteres"
                      autoComplete="new-password"
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white font-medium">
                      Biografia
                    </Label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      required
                      rows={3}
                      placeholder="Cuntanos sobre ti..."
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="location"
                      className="text-white font-medium"
                    >
                      Ubicacin
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      required
                      placeholder="Ciudad, Estado"
                      className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  {/* Trminos y Condiciones */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        aria-label="Acepto los términos y condiciones"
                        checked={formData.acceptTerms}
                        onChange={(e) =>
                          handleInputChange("acceptTerms", e.target.checked)
                        }
                        required
                        className="rounded"
                      />
                      <Label
                        htmlFor="acceptTerms"
                        className="text-sm text-white/80"
                      >
                        Acepto los{" "}
                        <Link
                          to="/terms"
                          className="text-purple-300 hover:underline"
                        >
                          Terminos y Condiciones
                        </Link>{" "}
                        y la{" "}
                        <Link
                          to="/privacy"
                          className="text-purple-300 hover:underline"
                        >
                          Poltica de Privacidad
                        </Link>
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="shareLocation"
                        aria-label="Compartir mi ubicación"
                        checked={formData.shareLocation}
                        onChange={(e) => {
                          handleInputChange("shareLocation", e.target.checked);
                          if (e.target.checked && !autoLocationRequested && _location) {
                            setFormData((prev) => ({
                              ...prev,
                              location: `${_location.latitude},${_location.longitude}`,
                            }));
                            setAutoLocationRequested(true);
                            toast({
                              title: "Ubicación obtenida",
                              description: "Tu ubicación ha sido obtenida exitosamente",
                              variant: "default",
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Label
                        htmlFor="shareLocation"
                        className="text-sm text-white/80"
                      >
                        Compartir mi ubicación para mejorar las coincidencias
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                    disabled={isLoading}
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                  >
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Modal de Restablecer Contraseña */}
          {showResetPassword && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">
                  Restablecer Contraseña
                </h3>
                <p className="text-white/80 mb-4">
                  Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-white font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetEmail("");
                      }}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        if (resetEmail && supabase) {
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(
                              resetEmail,
                              {
                                redirectTo: `${window.location.origin}/auth/reset-password`,
                              }
                            );

                            if (error) throw error;

                            toast({
                              title: "Correo enviado",
                              description: `Se ha enviado un correo a ${resetEmail} con instrucciones para restablecer tu contraseña.`,
                              variant: "default",
                            });
                            setShowResetPassword(false);
                            setResetEmail("");
                          } catch (error: any) {
                            toast({
                              variant: "destructive",
                              title: "Error al enviar correo",
                              description: error.message || "No se pudo enviar el correo de recuperación",
                            });
                          }
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Tema */}
          {showThemeModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">
                  Elegir Tema
                </h3>
                <p className="text-white/80 mb-4">
                  Selecciona el tema preferido para tu perfil.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formData.preferredTheme === "dark" ? "default" : "outline"}
                      onClick={() => {
                        handleInputChange("preferredTheme", "dark");
                        setShowThemeModal(false);
                      }}
                      className={formData.preferredTheme === "dark" ? "bg-purple-600 text-white" : "bg-white/20 text-white border-white/30"}
                    >
                      🌙 Oscuro
                    </Button>
                    <Button
                      type="button"
                      variant={formData.preferredTheme === "light" ? "default" : "outline"}
                      onClick={() => {
                        handleInputChange("preferredTheme", "light");
                        setShowThemeModal(false);
                      }}
                      className={formData.preferredTheme === "light" ? "bg-purple-600 text-white" : "bg-white/20 text-white border-white/30"}
                    >
                      ☀️ Claro
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowThemeModal(false)}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Términos */}
          {showTermsModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">
                  Términos y Condiciones
                </h3>
                <div className="text-white/80 space-y-4 mb-6">
                  <p>
                    Al usar ComplicesConecta, aceptas los siguientes términos:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Debes ser mayor de 18 años para usar esta plataforma</li>
                    <li>Toda la información proporcionada debe ser verídica</li>
                    <li>Respetarás la privacidad y seguridad de otros usuarios</li>
                    <li>No compartirás contenido inapropiado o ilegal</li>
                    <li>Reportarás cualquier comportamiento sospechoso</li>
                    <li>La plataforma no se hace responsable de encuentros fuera de la plataforma</li>
                    <li>La información personal será tratada según nuestra Política de Privacidad</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTermsModal(false)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      handleInputChange("acceptTerms", true);
                      setShowTermsModal(false);
                      toast({
                        title: "Términos aceptados",
                        description: "Has aceptado los Términos y Condiciones",
                        variant: "default",
                      });
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  >
                    Aceptar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ResponsiveContainer>
  );
};

export default Auth;
