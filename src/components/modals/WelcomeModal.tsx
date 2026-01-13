import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Heart,
  Sparkles,
  Gift,
  Star,
  Zap,
  HelpCircle,
  Globe,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// FIX: Estructura de DOM ideal para modales modernos:
// 1. Modal renderizado fuera del layout principal usando createPortal
// 2. Overlay fijo que cubre toda la pantalla (inset-0)
// 3. z-index muy alto (9999) para estar por encima de navbar (z-50)
// 4. Bloqueo de scroll del body mientras el modal está abierto
// 5. Manejo de tecla ESC y click en overlay para cerrar
// 6. Animaciones suaves de entrada/salida (fade + scale)

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  // FIX: Manejar hidratación correctamente - solo renderizar después del mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // FIX: Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px"; // Prevenir salto por scrollbar
      setCurrentStep(0);
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    // FIX: Limpiar al desmontar
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // FIX: Manejar tecla ESC para cerrar
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const welcomeSteps = [
    {
      icon: Heart,
      title: "👋 ¡Bienvenido",
      titleAccent: "a",
      titleAccent2: "ComplicesConecta!",
      subtitle: "Tu nueva aventura comienza aquí",
      description:
        "Descubre conexiones auténticas y experiencias únicas con personas que comparten tus intereses en la comunidad lifestyle más grande de México.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Gift,
      title: "🪙 Sistema de Tokens CMPX",
      subtitle: "Gana recompensas por invitar amigos",
      description:
        "Obtén 50 CMPX por cada amigo que invites + 50 CMPX de bienvenida para ellos. Usa tus tokens para desbloquear funciones premium durante la fase beta.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Sparkles,
      title: "Versión Beta Exclusiva",
      subtitle: "Sé parte de algo especial",
      description:
        "Estás entre los primeros en probar nuestra plataforma. Acceso gratuito a funciones premium con tokens. Si encuentras problemas, repórtalos en FAQ.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Zap,
      title: "Funciones Premium Gratis",
      subtitle: "Todo desbloqueado en la beta",
      description:
        "Chat ilimitado, galería privada, eventos exclusivos y más. Todo disponible usando tus tokens CMPX sin costo adicional.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Globe,
      title: "🌍 Próximamente: World ID",
      subtitle: "Verificación de identidad con Worldcoin",
      description:
        "Pronto podrás verificar tu identidad humana con World ID y ganar 100 CMPX adicionales. Integración con Worldchain para máxima seguridad y privacidad.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Shield,
      title: "Primera App con Ley Olimpia 100%",
      subtitle: "Pioneros en protección digital y seguridad",
      description:
        "ComplicesConecta es la PRIMERA aplicación lifestyle en México que implementa la Ley Olimpia al 100%. Protección avanzada contra violencia digital, marca de agua obligatoria, y tolerancia CERO a la difusión no consensuada. Tu seguridad es nuestra misión desde el primer día.",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      icon: Shield,
      title: "🛡️ Sistema de Moderación",
      subtitle: "Comunidad segura y protegida",
      description:
        "Contamos con un equipo de moderadores dedicados que mantienen la comunidad segura. ¿Interesado en ayudar? Puedes aplicar para ser moderador y contribuir a crear un ambiente positivo para todos.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: Zap,
      title: "🎯 ¡Todo es Interactivo!",
      subtitle: "Cada elemento tiene vida propia",
      description:
        "Todos los botones, enlaces y elementos de la página son dinámicos y animados. ¡Haz clic en todo! Cada interacción te llevará a nuevas experiencias. Los iconos brillan, los botones se animan y cada sección tiene sorpresas esperándote.",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset step to 0 when modal opens
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep((prev: number) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // FIX: Manejar click en overlay para cerrar
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // FIX: No renderizar nada si no está montado (SSR) o no está abierto
  // FIX: Verificar que document.body existe para evitar error en SSR
  if (!mounted || !isOpen || typeof document === "undefined" || !document.body) return null;

  const firstStep = welcomeSteps[0];
  if (!firstStep) return null;

  const currentStepData = welcomeSteps[currentStep] ?? firstStep;
  const IconComponent = currentStepData.icon;

  // FIX: Usar createPortal para renderizar en document.body
  // Esto evita que el modal se corte por overflow-hidden de padres
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      {/* FIX: Contenedor del modal con animación de entrada */}
      <div
        className="w-full max-w-xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full shadow-2xl shadow-purple-500/30 border-0 overflow-visible relative bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 border-purple-500/30 rounded-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-blue-900/90 pointer-events-none rounded-lg"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 pointer-events-none"></div>

          {/* Floating Elements */}
          <div className="absolute top-4 right-12 opacity-20 pointer-events-none">
            <Sparkles className="w-6 h-6 text-blue-400 animate-float" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-15 pointer-events-none">
            <Star
              className="w-5 h-5 text-purple-400 animate-float"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
          <div className="absolute top-1/2 right-8 opacity-10 pointer-events-none">
            <Zap
              className="w-4 h-4 text-blue-400 animate-float"
              style={{ animationDelay: "1s" }}
            />
          </div>

          {/* Close Button - Positioned outside Card for visibility */}
          <div className="absolute -top-2 -right-2 z-50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="pointer-events-auto cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-red-500/30 hover:border-red-400/50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              aria-label="Cerrar"
            >
              <X className="h-6 w-6 text-white hover:text-red-400" />
            </Button>
          </div>

          <CardContent className="p-8 text-center relative z-10">
            {/* Icon with Animation */}
            <div
              className={`relative bg-gradient-to-r from-purple-600 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50 animate-float ring-2 ring-white/20 ring-offset-4 ring-offset-purple-900/50`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-blue-400/30 rounded-full animate-pulse blur-sm"></div>
              <IconComponent
                className={`w-12 h-12 text-white drop-shadow-md relative z-10 animate-pulse`}
              />
              {/* Sparkle effect around icon */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Special Badges */}
            {currentStep === 1 && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 text-yellow-300 border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.35)] backdrop-blur-sm animate-bounce text-sm font-semibold"
                >
                  🪙 TOKENS CMPX
                </Badge>
              </div>
            )}
            {currentStep === 2 && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-accent/30 text-accent border-accent/40 shadow-[0_0_20px_rgba(168,85,247,0.35)] backdrop-blur-sm animate-bounce text-sm font-semibold"
                >
                  BETA EXCLUSIVA
                </Badge>
              </div>
            )}
            {currentStep === 3 && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-600/40 to-purple-600/40 text-white border border-white/30 shadow-[0_0_25px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/30 backdrop-blur-sm animate-pulse"
                >
                  ⚡ PREMIUM GRATIS
                </Badge>
              </div>
            )}
            {currentStep === 4 && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.35)] backdrop-blur-sm animate-bounce text-sm font-semibold"
                >
                  🌍 WORLD ID PRÓXIMAMENTE
                </Badge>
              </div>
            )}
            {currentStep === 6 && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-400/20 to-blue-500/20 text-blue-300 border border-blue-400/50 shadow-[0_0_20px_rgba(96,165,250,0.35)] backdrop-blur-sm animate-bounce text-sm font-semibold"
                >
                  🛡️ MODERACIÓN SEGURA
                </Badge>
              </div>
            )}
            {currentStep === 7 && (
              <div className="mb-4">
                <Badge
                  variant="secondary"
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.35)] backdrop-blur-sm animate-bounce text-sm font-semibold"
                >
                  🎯 EXPLORA TODO
                </Badge>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4 animate-slide-up">
              {/* Title con 3 líneas separadas */}
              <div className="space-y-1 text-center flex flex-col items-center justify-center">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-lg animate-pulse-glow inline-flex items-center justify-center gap-2">
                  {currentStepData.title}
                </h2>
                {currentStepData.titleAccent && (
                  <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-lg animate-pulse-glow">
                    {currentStepData.titleAccent}
                  </h2>
                )}
                {currentStepData.titleAccent2 && (
                  <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent drop-shadow-lg animate-pulse-glow">
                    {currentStepData.titleAccent2}
                  </h2>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-white/90 to-purple-200/90 bg-clip-text text-transparent drop-shadow-md animate-fade-in animate-bounce">
                {currentStepData.subtitle}
              </h3>
              <p className="text-white/95 font-medium leading-relaxed drop-shadow-md backdrop-blur-sm bg-black/10 rounded-lg p-4 border border-white/10">
                {currentStepData.description}
                {currentStep === 1 && (
                  <span className="inline-flex items-center gap-1 ml-2 text-purple-300 font-semibold drop-shadow-sm hover:text-purple-200 transition-colors cursor-pointer animate-pulse">
                    <HelpCircle className="w-4 h-4" />
                    FAQ
                  </span>
                )}
              </p>
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center space-x-2 mt-8 mb-6">
              {welcomeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`relative transition-all duration-300 ${
                    index === currentStep
                      ? "w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full scale-125 shadow-lg shadow-purple-500/50 animate-pulse ring-2 ring-white/30"
                      : index < currentStep
                        ? "w-3 h-3 bg-gradient-to-r from-purple-400/80 to-blue-400/80 rounded-full"
                        : "w-3 h-3 bg-white/30 rounded-full hover:bg-white/50 transition-colors cursor-pointer"
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  {index === currentStep && (
                    <div className="absolute inset-0 bg-purple-400/50 rounded-full animate-ping"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center space-x-4">
              <Button
                variant="default"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1 bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-700 hover:to-blue-700 text-white font-semibold border-0 shadow-lg shadow-purple-500/30 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Anterior
                </span>
              </Button>

              <Button
                variant="default"
                onClick={handleNext}
                className={`flex-1 relative overflow-hidden group font-semibold border-0 shadow-lg backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 ${
                  currentStep === welcomeSteps.length - 1
                    ? "bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-500/30"
                    : "bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-500/30"
                }`}
              >
                {currentStep === welcomeSteps.length - 1 ? (
                  <>
                    <Heart
                      className="w-4 h-4 mr-2 group-hover:animate-pulse"
                      fill="currentColor"
                    />
                    ¡Comenzar!
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    Siguiente
                    <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                  </span>
                )}
              </Button>
            </div>

            {/* Skip Option */}
            <button
              onClick={handleClose}
              className="text-sm text-white/80 font-medium hover:text-purple-300 transition-all duration-300 mt-4 underline drop-shadow-sm hover:scale-105 inline-flex items-center gap-1 group"
            >
              <X className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
              Saltar introducción
            </button>
          </CardContent>

          {/* Animated Border Effect */}
          <div className="absolute inset-0 border-2 border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-lg animate-pulse opacity-50"></div>
        </Card>
      </div>
    </div>,
    document.body,
  );
};
