import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeaderNav from "@/components/HeaderNav";
import { HeroSection } from "@/components/HeroSection";
import { ProfileCard } from "@/components/profiles/shared/MainProfileCard";
import { Footer } from "@/components/Footer";
import { BetaBanner } from "@/components/BetaBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { WelcomeModal } from "@/components/modals/WelcomeModal";
import { FeatureModal } from "@/components/modals/FeatureModal";
import { InstallAppModal } from "@/components/modals/InstallAppModal";
import { ActionButtonsModal } from "@/components/modals/ActionButtonsModal";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import {
  Heart,
  Users,
  Shield,
  Zap,
  Smartphone as Android,
  Info,
  Briefcase,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import "@/styles/animations.css";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import ModeratorApplicationForm from "@/components/forms/ModeratorApplicationForm";
import { getRandomProfileImage } from "@/lib/imageService";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth(); // Use authLoading

  // Local loading state, true until auth is resolved and redirects are checked.
  const [isLoading, setIsLoading] = useState(true);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<
    "connections" | "verification" | "events" | "tokens"
  >("connections");
  const [isRunningInApp, setIsRunningInApp] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showActionButtonsModal, setShowActionButtonsModal] = useState(false);
  const [showModeratorForm, setShowModeratorForm] = useState(false);

  const [hasVisited, setHasVisited] = usePersistedState<boolean>(
    "hasVisitedComplicesConecta",
    false,
  );
  const welcomeModalChecked = useRef(false);

  // CRÍTICO: Resetear hasVisited para permitir que el modal se muestre
  useEffect(() => {
    // Si el usuario no está autenticado, SIEMPRE resetear hasVisited
    if (!authLoading && !isAuthenticated()) {
      logger.info("🔄 Usuario no autenticado - reseteando hasVisited para mostrar WelcomeModal");
      setHasVisited(false);
    }
  }, [authLoading, isAuthenticated, setHasVisited]);

  // 4. REFACTORIZACIÓN DE HOME: useEffect simplificado con try/finally
  useEffect(() => {
    const initializeHome = () => {
      try {
        // La lógica asíncrona (si la hubiera) iría aquí.
        // Por ahora, detectamos si estamos en una WebView.
        const isInWebView = () => {
          const userAgent = navigator.userAgent.toLowerCase();
          return userAgent.includes("wv");
        };
        setIsRunningInApp(isInWebView());
      } catch (error) {
        logger.error("❌ Error en la inicialización de la página de inicio", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        // OBLIGATORIO: Se asegura que el spinner de carga se desactive siempre.
        // Se espera a que la autenticación también termine.
        if (!authLoading) {
          setIsLoading(false);
        }
      }
    };

    initializeHome();
  }, [authLoading]); // Se ejecuta cuando el estado de carga de la autenticación cambia.

  // Efecto para gestionar redirecciones y el modal de bienvenida
  useEffect(() => {
    // No hacer nada hasta que la carga inicial de autenticación haya terminado
    if (authLoading) return;

    // Lógica de redirección
    const isUserAuthenticated = isAuthenticated();
    if (isUserAuthenticated && profile) {
      const accountType = profile.profile_type || "single";
      logger.info("🔄 Redirigiendo usuario autenticado", {
        userId: user?.id,
        accountType,
      });
      navigate(
        accountType === "couple" ? "/profile-couple" : "/profile-single",
      );
      return; // Detiene la ejecución para no mostrar el modal
    }

    // Lógica para el modal de bienvenida (solo para visitantes no autenticados)
    logger.info("🎯 Verificando condiciones para WelcomeModal", {
      isUserAuthenticated,
      welcomeModalChecked: welcomeModalChecked.current,
      hasVisited,
      shouldShow: !isUserAuthenticated && !welcomeModalChecked.current && !hasVisited,
    });

    if (!isUserAuthenticated && !welcomeModalChecked.current && !hasVisited) {
      welcomeModalChecked.current = true;
      logger.info("✅ Mostrando WelcomeModal");
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, profile, user, navigate, hasVisited]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    setHasVisited(true);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  // Perfiles de ejemplo para la página principal
  const sampleProfiles = [
    {
      id: "1",
      name: "Gabriela",
      age: 29,
      location: "Ciudad de México",
      interests: [
        "Intercambio de Parejas",
        "Fiestas Privadas",
        "Encuentros Íntimos",
      ],
      image: getRandomProfileImage("female", { width: 500, height: 700 }),
      rating: 4.9,
      isOnline: true,
      bio: "Apasionada por la naturaleza y la creatividad. Buscando a alguien con quien compartir aventuras y conversaciones profundas.",
      profession: "Arquitecta",
      verified: true,
    },
    {
      id: "2",
      name: "Antonio",
      age: 34,
      location: "Guadalajara",
      interests: [
        "Experiencias Grupales",
        "Clubs Liberales",
        "Aventuras Sensuales",
      ],
      image: getRandomProfileImage("male", { width: 500, height: 700 }),
      rating: 4.8,
      isOnline: false,
      bio: "Emprendedor y amante del mar. Disfruto de un buen vino y una compañía inteligente.",
      profession: "Consultor Financiero",
      verified: true,
    },
    {
      id: "3",
      name: "Isabella",
      age: 27,
      location: "Monterrey",
      interests: [
        "Tantra y Sensualidad",
        "Juegos de Rol",
        "Experiencias Nuevas",
      ],
      image: getRandomProfileImage("female", { width: 500, height: 700 }),
      rating: 4.9,
      isOnline: true,
      bio: "Explorando la riqueza cultural de México. Me encanta perderme en libros y descubrir nuevos lugares.",
      profession: "Historiadora del Arte",
      verified: true,
    },
    {
      id: "4",
      name: "Mateo",
      age: 31,
      location: "Puebla",
      interests: [
        "Encuentros Casuales",
        "Fantasías Compartidas",
        "Vida Nocturna Liberal",
      ],
      image:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&h=700&fit=crop&crop=faces&auto=format&q=80",
      rating: 4.7,
      isOnline: true,
      bio: "Ingeniero de software con alma de chef. Siempre en busca del equilibrio perfecto entre código y sabor.",
      profession: "Desarrollador de Software",
      verified: true,
    },
  ];

  const handleFeatureClick = (
    featureType: "connections" | "verification" | "events" | "tokens",
  ) => {
    setSelectedFeature(featureType);
    setShowFeatureModal(true);
  };

  const features = [
    {
      icon: Heart,
      title: "Conexiones Auténticas",
      description:
        "Algoritmo inteligente que conecta personas con intereses reales en común",
      type: "connections" as const,
      iconBg: "bg-gradient-to-r from-purple-500 to-purple-600",
    },
    {
      icon: Shield,
      title: "Verificación KYC Avanzada",
      description:
        "Perfiles verificados con tecnología blockchain y KYC para máxima seguridad y confianza",
      type: "verification" as const,
      iconBg: "bg-gradient-to-r from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Eventos Swinger Exclusivos",
      description:
        "Accede a fiestas privadas, encuentros y eventos exclusivos para la comunidad swinger",
      type: "events" as const,
      iconBg: "bg-gradient-to-r from-purple-500 to-purple-600",
    },
    {
      icon: Zap,
      title: "Sistema de Tokens CMPX/GTK",
      description:
        "Gana tokens participando, accede a funciones premium y eventos VIP",
      type: "tokens" as const,
      iconBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-900 via-purple-900 to-blue-900">
      <DecorativeHearts count={8} />
      <div className="relative z-10">
        <BetaBanner />
        <div className="pt-16">
          <HeaderNav />
        </div>
      </div>

      <main>
        <HeroSection />

        <section className="py-10 sm:py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <div className="space-y-6">
                <h1
                  data-testid="main-heading"
                  className="text-4xl md:text-6xl font-bold text-white mb-6 animate-slide-up"
                >
                  Bienvenido a la Plataforma Social
                </h1>
                <p className="text-xl md:text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed animate-slide-up font-medium px-4">
                  La plataforma{" "}
                  <strong className="text-purple-300">más exclusiva</strong>{" "}
                  para la comunidad lifestyle mexicana.
                  <br className="hidden md:block" />
                  <span className="text-purple-200">
                    Conexiones auténticas, experiencias únicas.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 px-2">
                {sampleProfiles.map((profile, index) => (
                  <div
                    key={index}
                    className={`animate-slide-up slide-up-delay-${index}`}
                  >
                    <ProfileCard
                      profile={profile}
                      onLike={() => {}}
                      onSuperLike={() => {}}
                      onOpenModal={() => setShowActionButtonsModal(true)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-xl">
                Conoce Más Sobre Nuestra Plataforma
              </h2>
              <p className="text-xl text-white max-w-3xl mx-auto drop-shadow-md">
                Descubre nuestra misión, únete a nuestro equipo o apoya nuestro
                crecimiento
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto pointer-events-auto">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 pointer-events-auto">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full">
                      <Info className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                    Acerca de Nosotros
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pointer-events-auto">
                  <p className="text-white mb-6 drop-shadow-sm">
                    Conoce nuestra misión, visión y valores. Descubre por qué
                    somos la plataforma más confiable para la comunidad
                    lifestyle.
                  </p>
                  <Button
                    asChild
                    variant="default"
                    className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full pointer-events-auto"
                  >
                    <Link to="/about" className="pointer-events-auto">Conocer Más</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 pointer-events-auto">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                    Únete al Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pointer-events-auto">
                  <p className="text-white drop-shadow-sm mb-6">
                    Forma parte de nuestro equipo innovador. Buscamos talento
                    apasionado por la tecnología y la comunidad lifestyle.
                  </p>
                  <Button
                    asChild
                    variant="default"
                    className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full pointer-events-auto"
                  >
                    <Link to="/careers" className="pointer-events-auto">Ver Vacantes</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 pointer-events-auto">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full">
                      <UserCheck className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                    Ser Moderador
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pointer-events-auto">
                  <p className="text-white drop-shadow-sm mb-6">
                    Ayuda a mantener una comunidad segura y respetuosa. Únete a
                    nuestro equipo de moderadores voluntarios.
                  </p>
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full pointer-events-auto"
                    onClick={() => setShowModeratorForm(true)}
                  >
                    Aplicar Ahora
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 pointer-events-auto">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                    Apoya el Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pointer-events-auto">
                  <p className="text-white drop-shadow-sm mb-6">
                    Ayúdanos a crecer y mejorar la plataforma. Tu apoyo nos
                    permite seguir innovando para la comunidad.
                  </p>
                  <Button
                    asChild
                    variant="default"
                    className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full pointer-events-auto"
                  >
                    <Link to="/donations" className="pointer-events-auto">Donar Ahora</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Por qué elegir nuestra plataforma?
              </h2>
              <p className="text-xl text-white drop-shadow-sm max-w-3xl mx-auto">
                La plataforma más segura y discreta para la comunidad swinger.
                Conectamos parejas y solteros con verificación avanzada,
                tecnología blockchain y total privacidad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="text-center group hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => handleFeatureClick(feature.type)}
                >
                  <div
                    className={`${feature.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white drop-shadow-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10 max-w-6xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Atrévete a Vivir Nuevas Fantasías
              </h2>
              <p className="text-xl text-white drop-shadow-sm mb-8">
                Conecta con parejas y solteros liberales en un ambiente seguro y
                discreto. La aventura de tu vida te espera.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
                <Button
                  variant="default"
                  size="xl"
                  className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 pointer-events-auto"
                  asChild
                >
                  <Link to="/auth" className="pointer-events-auto">
                    <Heart className="mr-2 h-5 w-5" fill="currentColor" />
                    Crear Cuenta Gratis
                  </Link>
                </Button>
                {!isRunningInApp && (
                  <Button
                    variant="outline"
                    size="xl"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white hover:from-green-600 hover:to-emerald-700 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25 pointer-events-auto"
                    onClick={() => setShowInstallModal(true)}
                  >
                    <Android className="w-5 h-5 mr-2" />
                    Instalar Aplicación
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      {showWelcome && (
        <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} />
      )}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
      <FeatureModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        feature={selectedFeature}
      />
      <ActionButtonsModal
        isOpen={showActionButtonsModal}
        onClose={() => setShowActionButtonsModal(false)}
      />

      {showModeratorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-black/80 backdrop-blur-sm p-4 border-b border-white/20 z-10">
              <Button
                variant="ghost"
                onClick={() => setShowModeratorForm(false)}
                className="text-white hover:bg-white/10 float-right"
              >
                ✕ Cerrar
              </Button>
              <div className="clear-both"></div>
            </div>
            <div className="p-6">
              <ModeratorApplicationForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
