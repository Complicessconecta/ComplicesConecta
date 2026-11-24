import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { LoadingScreen } from "@/components/LoadingScreen";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { HomeProfilesSection } from "@/components/home/HomeProfilesSection";
import { HomeBenefitsSection } from "@/components/home/HomeBenefitsSection";
import { HomeModalsManager } from "@/components/home/HomeModalsManager";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useLoading } from "@/contexts/LoadingContext";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { setIsLoading } = useLoading();
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

  // @isActive - página de inicio pública
  const isActive = location.pathname === "/";

  // Sin splash de carga falso: antes la landing forzaba 3 s de
  // LoadingScreen con barra de progreso en cada visita. El splash solo
  // aparece mientras la autenticación realmente está cargando.
  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);

  useEffect(() => {
    if (authLoading) return;

    const isAutomated =
      typeof navigator !== "undefined" && Boolean((navigator as any).webdriver);
    if (isAutomated) {
      return;
    }

    if (!isAuthenticated() && !hasVisited && !welcomeModalChecked.current) {
      welcomeModalChecked.current = true;
      logger.info("✅ Mostrando WelcomeModal a visitante no autenticado");
      setShowWelcome(true);
    }
  }, [authLoading, hasVisited, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;

    try {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsRunningInApp(userAgent.includes("wv"));
    } catch (error) {
      logger.error("❌ Error en la inicialización de la página de inicio", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated() && profile) {
      const accountType = profile.profile_type || "single";
      logger.info("🔄 Redirigiendo usuario autenticado", {
        userId: user?.id,
        accountType,
      });
      navigate(
        accountType === "couple" ? "/profile-couple" : "/profile-single",
      );
    }
  }, [authLoading, isAuthenticated, profile, user, navigate]);

  const handleFeatureClick = (
    featureType: "connections" | "verification" | "events" | "tokens",
  ) => {
    setSelectedFeature(featureType);
    setShowFeatureModal(true);
  };

  const handleWelcomeChange = (show: boolean) => {
    setShowWelcome(show);
    if (!show) {
      setHasVisited(true);
    }
  };

  if (authLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden selection:bg-complices-pink selection:text-white ${isActive ? "page-active" : ""}`}>
      {/* CAPA 1: CONTENIDO (Hijo Activo) */}
      {/* Z-index positivo para asegurar que el texto sea clickeable */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <DecorativeHearts count={8} />

        <main className="flex-grow">
          <HeroSection />

          <HomeProfilesSection
            onOpenActionModal={() => setShowActionButtonsModal(true)}
          />

          <HomeBenefitsSection
            onOpenModeratorForm={() => setShowModeratorForm(true)}
            onOpenInstall={() => setShowInstallModal(true)}
            onFeatureClick={handleFeatureClick}
            isRunningInApp={isRunningInApp}
          />
        </main>

        <Footer />
      </div>

      {/* CAPA 2: MODALES (Hijo Superior) */}
      {/* Z-index alto para estar siempre encima */}
      <div className="relative z-50">
        <HomeModalsManager
          showWelcome={showWelcome}
          setShowWelcome={handleWelcomeChange}
          showFeatureModal={showFeatureModal}
          setShowFeatureModal={setShowFeatureModal}
          selectedFeature={selectedFeature}
          showInstallModal={showInstallModal}
          setShowInstallModal={setShowInstallModal}
          showActionButtonsModal={showActionButtonsModal}
          setShowActionButtonsModal={setShowActionButtonsModal}
          showModeratorForm={showModeratorForm}
          setShowModeratorForm={setShowModeratorForm}
        />
      </div>
    </div>
  );
};

export default Index;
