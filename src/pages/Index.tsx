import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { BetaBanner } from "@/components/BetaBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { HomeProfilesSection } from "@/components/home/HomeProfilesSection";
import { HomeBenefitsSection } from "@/components/home/HomeBenefitsSection";
import { HomeModalsManager } from "@/components/home/HomeModalsManager";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { usePersistedState } from "@/hooks/usePersistedState";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();

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
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    if (loadingTimeoutRef.current) return;

    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      loadingTimeoutRef.current = null;
    }, 3000);

    return () => {
      if (!loadingTimeoutRef.current) return;
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    };
  }, [isLoading]);

  useEffect(() => {
    if (authLoading) return;
    setIsLoading(false);
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

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

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden selection:bg-complices-pink selection:text-white">
      {/* CAPA 1: CONTENIDO (Hijo Activo) */}
      {/* Z-index positivo para asegurar que el texto sea clickeable */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <BetaBanner />
        <div className="pt-16"> {/* Padding for fixed banner */}</div>
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
