import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Heart, Flame, RefreshCw, Filter, Star, Home, User, Search, Sliders } from "lucide-react";
import SuperLikesModal from "@/components/modals/SuperLikesModal";
import PremiumModal from "@/components/modals/PremiumModal";
import CompatibilityModal from "@/components/modals/CompatibilityModal";
import EventsModal from "@/components/modals/EventsModal";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { pickProfileImage, type Gender } from "@/lib/media";
import { calculateDistance, getLocationDisplay } from "@/lib/distance-utils";
import { type CoupleProfileWithPartners, getAllCoupleProfiles } from "@/services/social/couple/CoupleProfilesService";
import { generateDemoProfiles, type DemoProfile } from "@/demo/demoData";
import { safeGetItem } from "@/lib/safe-storage";
import { generateFilterDemoCards, type FilterDemoCard } from "@/lib/infoCards";
import { FilterDemoCard as FilterDemoCardComponent } from "@/components/ui/FilterDemoCard";
import { supabase } from "@/integrations/supabase/client";
import CoupleProfileCard from "@/components/profiles/couple/CoupleProfileCard";
import { AnimatedProfileCard } from "@/components/profiles/shared/AnimatedProfileCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { logger } from "@/lib/logger";
import { matchService } from "@/services/social";
import type { Profile, Filters } from "@/types/discover.types";
import { generalInterests } from "@/constants/discover/generalInterests";
import { explicitInterests } from "@/constants/discover/explicitInterests";
import { generateRandomProfiles } from "@/utils/discover/generateRandomProfiles";

const normalizeGender = (value: unknown): Gender => {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "male" || raw === "m" || raw === "hombre" || raw === "man") return "male";
  if (raw === "female" || raw === "f" || raw === "mujer" || raw === "woman") return "female";
  return "unknown";
};

export const Discover = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [_isMobile] = useState(false);
  const { location } = useGeolocation();
  const { user, isAuthenticated } = useAuth();
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [demoProfiles, setDemoProfiles] = useState<DemoProfile[]>([]);
  const [filterCards, setFilterCards] = useState<FilterDemoCard[]>([]);
  const [coupleProfiles, setCoupleProfiles] = useState<
    CoupleProfileWithPartners[]
  >([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [filteredDemoProfiles, setFilteredDemoProfiles] = useState<
    DemoProfile[]
  >([]);
  const [filteredCoupleProfiles, setFilteredCoupleProfiles] = useState<
    CoupleProfileWithPartners[]
  >([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCouples, setShowCouples] = useState(false);

  // Modal states
  const [showSuperLikesModal, setShowSuperLikesModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ageRange: [18, 65],
    distance: 50,
    interests: [],
    verified: false,
    premium: false,
    online: false,
    relationshipType: [],
  });

  // Determinar si el usuario es demo/producción
  const isDemoOrProduction = () => {
    const authStatus = isAuthenticated();
    if (!authStatus || !user) return false;
    const demoAuth =
      safeGetItem<string>("demo_authenticated", {
        validate: true,
        defaultValue: "false",
      }) === "true";
    const isDemoUser =
      user.email === "single@outlook.es" || user.email === "pareja@outlook.es";
    // también considerar usuarios de produccin (que tienen cuenta real)
    return (demoAuth && isDemoUser) || (authStatus && !isDemoUser);
  };

  // Intereses disponibles segn el tipo de usuario
  const availableInterests = isDemoOrProduction()
    ? [...generalInterests, ...explicitInterests]
    : generalInterests;

  // Load couple profiles
  const loadCoupleProfiles = useCallback(async () => {
    try {
      const couples = await getAllCoupleProfiles(20, 0);
      setCoupleProfiles(couples);
      setFilteredCoupleProfiles(couples);
    } catch (error) {
      logger.error("Error loading single profiles", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  // Aplicar filtros
  useEffect(() => {
    const applyFilters = () => {
      // Filtrar perfiles demo
      const filteredDemo = demoProfiles.filter((profile) => {
        const ageMatch =
          profile.age >= filters.ageRange[0] &&
          profile.age <= filters.ageRange[1];
        const distanceMatch = !location || profile.distance <= filters.distance;
        const interestsMatch =
          filters.interests.length === 0 ||
          filters.interests.some((interest) =>
            profile.interests.includes(interest),
          );
        const verifiedMatch = !filters.verified || profile.isVerified;
        const premiumMatch = !filters.premium || profile.isPremium;
        const onlineMatch = !filters.online || profile.isOnline;

        return (
          ageMatch &&
          distanceMatch &&
          interestsMatch &&
          verifiedMatch &&
          premiumMatch &&
          onlineMatch
        );
      });

      setFilteredDemoProfiles(filteredDemo);

      // Filtrar perfiles individuales reales
      const filtered = profiles.filter((profile) => {
        const ageMatch =
          profile.age >= filters.ageRange[0] &&
          profile.age <= filters.ageRange[1];

        // Filtro de distancia mejorado - siempre aplicar si hay distancia disponible
        let distanceMatch = true;
        if (location) {
          // Si el perfil tiene distancia calculada, usarla
          if (profile.distance !== undefined) {
            distanceMatch = profile.distance <= filters.distance;
          } else {
            // Si no tiene distancia pero tiene coordenadías, calcularla
            // Esto se maneja en loadRealProfiles, as que aqu solo verificamos la distancia ya calculada
            distanceMatch = true; // Permitir si no hay distancia disponible
          }
        }

        const interestsMatch =
          filters.interests.length === 0 ||
          filters.interests.some((interest) =>
            profile.interests.includes(interest),
          );
        const verifiedMatch = !filters.verified || profile.isVerified;
        const premiumMatch = !filters.premium || profile.isPremium;
        const onlineMatch = !filters.online || profile.isOnline;

        return (
          ageMatch &&
          distanceMatch &&
          interestsMatch &&
          verifiedMatch &&
          premiumMatch &&
          onlineMatch
        );
      });

      setFilteredProfiles(filtered);

      // Filtrar perfiles de parejas
      const filteredCouples = coupleProfiles.filter((couple) => {
        const avgAge = (couple.partner1_age + couple.partner2_age) / 2;
        const ageMatch =
          avgAge >= filters.ageRange[0] && avgAge <= filters.ageRange[1];

        // Filtro de distancia para parejas
        let distanceMatch = true;
        if (location && couple.location) {
          // Calcular distancia - los perfiles de pareja pueden no tener coordenadías exactas
          // Usar la distancia calculada previamente o permitir el match si no hay coordenadías
          distanceMatch = true; // Por ahora permitir todos si no hay coordenadías precisas
        }

        // Los perfiles de pareja no tienen interests en el tipo actual, permitir match
        const interestsMatch = filters.interests.length === 0;
        const verifiedMatch = !filters.verified || couple.is_verified;
        const premiumMatch = !filters.premium || couple.is_premium;
        const onlineMatch = !filters.online || couple.isOnline;

        return (
          ageMatch &&
          distanceMatch &&
          interestsMatch &&
          verifiedMatch &&
          premiumMatch &&
          onlineMatch
        );
      });

      setFilteredCoupleProfiles(filteredCouples);
    };

    applyFilters();
  }, [filters, demoProfiles, profiles, coupleProfiles, location]);

  // Función para cargar perfiles reales desde Supabase
  const loadRealProfiles = useCallback(async () => {
    try {
      // Solo log una vez por carga
      if (profiles.length === 0) {
        logger.info("?? Cargando perfiles reales desde Supabase...");
      }

      if (!supabase) {
        logger.error("Supabase no est disponible");
        const newProfiles = generateRandomProfiles();
        setProfiles(newProfiles);
        setFilteredProfiles(newProfiles);
        return;
      }

      // Agregar timeout de 10 segundos para evitar bloqueo (aumentado de 3s)
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout loading profiles")), 10000);
      });

      const profilesPromise = supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .neq("is_demo", true)
        .limit(50);

      const { data: realProfiles, error } = (await Promise.race([
        profilesPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        logger.error("? Error cargando perfiles reales:", error);
        // Fallback a perfiles mock
        const newProfiles = generateRandomProfiles();
        setProfiles(newProfiles);
        setFilteredProfiles(newProfiles);
        return;
      }

      if (realProfiles && realProfiles.length > 0) {
        logger.info(`? ${realProfiles.length} perfiles reales cargados`);

        const usedImages = new Set<string>();

        // Convertir perfiles de Supabase al formato esperado
        const convertedProfiles: Profile[] = realProfiles.map(
          (profile: any) => {
            const normalizedGender = normalizeGender(profile.gender);
            return ({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name || ""}`.trim(),
            age: profile.age || 25,
            location: getLocationDisplay(location), // Ubicacin real implementada con useGeolocation
            distance: calculateDistance(
              location,
              profile.latitude && profile.longitude
                ? { latitude: profile.latitude, longitude: profile.longitude }
                : null,
            ), // Clculo de distancia implementado con coordenadías reales
            interests: Array.isArray(profile.interests)
              ? profile.interests
              : [], // Sistema de intereses conectado con Supabase
            image: pickProfileImage(
              {
                id: profile.id,
                name: profile.first_name,
                type: "single",
                gender: normalizedGender,
              },
              usedImages,
            ), // Avatar URL desde Supabase profiles
            bio: profile.bio || "Sin descripcin",
            isOnline: profile.is_online || false,
            lastActive: profile.last_active
              ? new Date(profile.last_active).toLocaleString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })
              : "Hace 1 hora",
            isVerified: profile.is_premium || false,
            isPremium: profile.is_premium || false,
            rating: 4.5,
            matchScore: Math.floor(Math.random() * 40) + 60,
            profileType: (profile.account_type as any) || "single",
            gender: normalizedGender === "unknown" ? undefined : normalizedGender,
            });
          },
        );

        setProfiles(convertedProfiles);
        setFilteredProfiles(convertedProfiles);
      } else {
        logger.info("?? No hay perfiles reales disponibles, usando mock");
        const newProfiles = generateRandomProfiles();
        setProfiles(newProfiles);
        setFilteredProfiles(newProfiles);
      }
    } catch (error) {
      logger.error(
        "? Error inesperado cargando perfiles (timeout o error de red)",
        { error: error instanceof Error ? error.message : String(error) },
      );
      // Fallback inmediato a perfiles mock cuando hay timeout
      const newProfiles = generateRandomProfiles();
      setProfiles(newProfiles);
      setFilteredProfiles(newProfiles);
    }
  }, [profiles.length, location]);

  // Cargar cards de filtros demo para usuarios no autenticados
  useEffect(() => {
    if (filterCards.length === 0) {
      const cards = generateFilterDemoCards();
      setFilterCards(cards);
    }
  }, [filterCards.length]);

  // Cargar perfiles demo solo para usuarios con credenciales especficas
  useEffect(() => {
    const demoAuth =
      safeGetItem<string>("demo_authenticated", {
        validate: true,
        defaultValue: "false",
      }) === "true";
    const isDemoUser =
      user?.email === "single@outlook.es" ||
      user?.email === "pareja@outlook.es";

    if (demoAuth && isDemoUser && demoProfiles.length === 0) {
      const demos = generateDemoProfiles(20);
      setDemoProfiles(demos);
      setFilteredDemoProfiles(demos);
    }
  }, [user?.email, demoProfiles.length]);

  // Verificar autenticacin y cargar perfiles reales
  useEffect(() => {
    // Si no est autenticado, mostrar cards informativos
    if (!isAuthenticated()) {
      logger.info("?? Usuario no autenticado - mostrando cards informativos");
      return;
    }

    logger.info("? Usuario autenticado en Discover:", {
      user: user?.email || user?.id,
      isAuthenticated: isAuthenticated(),
    });

    // Verificar autenticacin local adicional (demo)
    const demoAuth =
      safeGetItem<string>("demo_authenticated", {
        validate: true,
        defaultValue: "false",
      }) === "true";

    // Solo cargar perfiles reales una vez para usuarios autenticados
    if (profiles.length === 0) {
      // Cargar perfiles segn el tipo de usuario
      if (demoAuth) {
        // Solo log una vez para demo
        if (demoProfiles.length === 0) {
          logger.info("Usuario demo - cargando perfiles adicionales");
        }
        const newProfiles = generateRandomProfiles();
        setProfiles(newProfiles);
        setFilteredProfiles(newProfiles);
      } else {
        // Solo log una vez para usuarios reales
        logger.info("Cargando perfiles reales");
        loadRealProfiles();
      }
    }

    // Solo cargar parejas una vez
    if (coupleProfiles.length === 0) {
      loadCoupleProfiles();
    }
    // Cargar matches del usuario autenticado para habilitar/deshabilitar Chat
    if (user?.id) {
      (async () => {
        try {
          const ids = await matchService.getMatchedUserIds(user.id);
          setMatchedIds(new Set(ids.map(String)));
        } catch (error) {
          logger.warn("No se pudieron cargar los matches del usuario", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    } else {
      setMatchedIds(new Set());
    }
  }, [
    isAuthenticated,
    navigate,
    profiles.length,
    coupleProfiles.length,
    user?.id,
  ]);

  const handleLike = async (profileId: number | string) => {
    if (!isAuthenticated() || !user) {
      setShowPremiumModal(true);
      return;
    }

    try {
      const { success, isMatch, error } = await matchService.createLike(
        user.id,
        profileId.toString(),
      );

      if (error) {
        throw new Error("No se pudo procesar el like.");
      }

      if (success) {
        if (isMatch) {
          toast({
            title: "¡Es un Match! 🎉",
            description: "Ambos se han gustado. Ahora pueden chatear.",
          });
          setMatchedIds((prev) => {
            const next = new Set(prev);
            next.add(profileId.toString());
            return next;
          });
          // Opcional: Navegar directamente al chat o mostrar una animación de match.
        } else {
          toast({
            title: "Like enviado!",
            description: "Le has dado like a este perfil.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
      });
    }
  };

  const handleViewProfile = (profileId: number | string) => {
    const profile =
      profiles.find((p) => p.id === profileId.toString()) ||
      demoProfiles.find((p) => p.id === profileId.toString());
    if (profile) {
      navigate(`/profile/${profile.id}`, { state: { profile } });
    }
  };

  const handleMessage = async (profileId: number | string) => {
    if (!isAuthenticated() || !user) {
      setShowPremiumModal(true);
      return;
    }
    // Validar que profileId sea válido antes de navegar
    if (!profileId || profileId === "undefined" || profileId === "null") {
      logger.error("Error: profileId inválido", { profileId });
      return;
    }
    // Mantener flujo demo sin gating de match
    if (
      user?.email === "single@outlook.es" ||
      user?.email === "pareja@outlook.es"
    ) {
      navigate("/chat-info");
      return;
    }

    try {
      const hasMatch = await matchService.checkExistingMatch(
        user.id,
        profileId.toString(),
      );
      if (!hasMatch) {
        toast({
          variant: "destructive",
          title: "Match requerido",
          description: "Necesitas un match mutuo para poder chatear.",
        });
        return;
      }
      navigate(`/chat/${profileId}`);
    } catch (error) {
      logger.error("Error verificando match antes de chatear", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del match.",
      });
    }
  };

  const handleCtaClick = (action: "register" | "login" | "premium") => {
    switch (action) {
      case "register":
        navigate("/auth?mode=register");
        break;
      case "login":
        navigate("/auth");
        break;
      case "premium":
        setShowPremiumModal(true);
        break;
    }
  };

  const handleRefresh = () => {
    const newProfiles = generateRandomProfiles();
    setProfiles(newProfiles);
    setFilteredProfiles(newProfiles);
    toast({
      title: "Perfiles actualizados",
      description: "Se han cargado nuevos perfiles para ti.",
    });
  };

  return (
    <div className="min-h-dvh bg-transparent relative overflow-x-hidden pb-20">
      {/* Corazones decorativos flotantes */}
      <DecorativeHearts count={6} />
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden z-[-1]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10"></div>

      {/* Header con navegacin */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg relative z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/20 p-2 sm:px-4 bg-transparent border-none"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Inicio</span>
            </Button>
            <Button
              onClick={() => navigate("/profile")}
              className="text-white hover:bg-white/20 p-2 sm:px-4 bg-transparent border-none"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Perfil</span>
            </Button>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Descubrir</span>
          </h1>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              onClick={() => setShowCouples(!showCouples)}
              className={`p-2 sm:px-4 bg-transparent hover:bg-white/20 ${showCouples ? "text-purple-300 bg-white/20" : "text-white"}`}
            >
              <span className="hidden sm:inline">
                {showCouples ? "Singles" : "Parejas"}
              </span>
              <span className="sm:hidden">{showCouples ? "S" : "P"}</span>
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="text-white hover:bg-white/20 p-2 sm:px-4 bg-transparent"
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
            <Button
              onClick={handleRefresh}
              className="text-white hover:bg-white/20 p-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-full overflow-x-hidden">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="text-center p-4">
            <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-white">12</div>
            <div className="text-sm text-white/80">Likes</div>
          </GlassCard>
          <GlassCard className="text-center p-4">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-sm text-white/80">Super Likes</div>
          </GlassCard>
          <GlassCard className="text-center p-4">
            <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-sm text-white/80">Matches</div>
          </GlassCard>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Panel de filtros */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard
                className="w-full lg:w-80 p-4 lg:p-6"
                variant="colored"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-purple-300" />
                  <span className="text-white drop-shadow-lg font-bold">
                    Filtros Avanzados:
                  </span>
                </h3>

                {/* Edad */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Edad: {filters.ageRange[0]} - {filters.ageRange[1]} años
                  </label>
                  <Slider
                    value={filters.ageRange}
                    onValueChange={(value: number[]) =>
                      setFilters((prev) => ({
                        ...prev,
                        ageRange: value as [number, number],
                      }))
                    }
                    min={18}
                    max={65}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Distancia */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Distancia: {filters.distance} km
                  </label>
                  <Slider
                    value={[filters.distance]}
                    onValueChange={(value: number[]) =>
                      setFilters((prev) => ({
                        ...prev,
                        distance: value[0] ?? prev.distance,
                      }))
                    }
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Intereses */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Intereses
                    {isDemoOrProduction() && (
                      <span className="ml-2 text-xs text-purple-300">
                        (Demo/Produccin)
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-white/20 rounded-lg border border-white/30">
                    {availableInterests.map((interest: string) => (
                      <Badge
                        key={interest}
                        className={`cursor-pointer text-xs font-medium transition-all duration-200 hover:scale-105 ${
                          filters.interests.includes(interest)
                            ? "bg-linear-to-r from-purple-600 to-fuchsia-600 text-white border-0 shadow-lg"
                            : "border-white/60 text-white hover:border-white hover:bg-white/20 border bg-transparent"
                        }`}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            interests: prev.interests.includes(interest)
                              ? prev.interests.filter((i) => i !== interest)
                              : [...prev.interests, interest],
                          }));
                        }}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tipo de Relacion */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-purple-800 mb-3">
                    Tipo de Relacion
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Pareja", "Soltero/a", "Abierto", "Poliamoroso"].map(
                      (type) => {
                        const isSelected =
                          filters.relationshipType.includes(type);
                        return (
                          <Badge
                            key={type}
                            className={`cursor-pointer text-xs p-2 text-center transition-all duration-200 ${
                              isSelected
                                ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                                : "border-purple-300 text-purple-700 hover:border-purple-500 hover:bg-purple-50 border bg-transparent"
                            }`}
                            onClick={() => {
                              setFilters((prev) => ({
                                ...prev,
                                relationshipType: isSelected
                                  ? prev.relationshipType.filter(
                                      (t) => t !== type,
                                    )
                                  : [...prev.relationshipType, type],
                              }));
                            }}
                          >
                            {type}
                          </Badge>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Verificacion */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-purple-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          verified: e.target.checked,
                        }));
                      }}
                    />
                    Solo perfiles verificados
                  </label>
                </div>

                {/* Boton Limpiar Filtros */}
                <Button
                  variant="love"
                  className="w-full"
                  onClick={() => {
                    setFilters({
                      ageRange: [18, 65],
                      distance: 50,
                      interests: [],
                      verified: false,
                      premium: false,
                      online: false,
                      relationshipType: [],
                    });
                  }}
                >
                  Limpiar Filtros
                </Button>
              </GlassCard>
            </motion.div>
          )}

          {/* Grid de perfiles */}
          <div className="flex-1">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {showCouples ? (
                // Show couple profiles
                filteredCoupleProfiles.map((coupleProfile, index) => (
                  <motion.div
                    key={coupleProfile.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CoupleProfileCard
                      profile={coupleProfile}
                      onLike={() => handleLike(coupleProfile.id)}
                      onOpenModal={() => {
                        toast({
                          title: "Acción requerida",
                          description:
                            "Funcionalidad de modal disponible próximamente.",
                        });
                      }}
                    />
                  </motion.div>
                ))
              ) : (
                // Show content based on authentication status
                <>
                  {/* Usuarios NO autenticados: Cards de filtros demo */}
                  {!isAuthenticated() &&
                    filterCards.map((card, index) => (
                      <FilterDemoCardComponent
                        key={card.id}
                        card={card}
                        index={index}
                        onCtaClick={handleCtaClick}
                      />
                    ))}

                  {/* Usuarios autenticados con credenciales demo: Perfiles demo */}
                  {isAuthenticated() &&
                    user?.email === "single@outlook.es" &&
                    filteredDemoProfiles.map((profile, index) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <AnimatedProfileCard
                          id={parseInt(profile.id.slice(-8), 16) || index}
                          profileId={profile.id}
                          name={profile.name}
                          age={profile.age}
                          location={profile.location}
                          image={profile.image}
                          bio={profile.bio}
                          interests={profile.interests}
                          isOnline={profile.isOnline}
                          isPremium={profile.isPremium}
                          isPrivate={false}
                          lastSeen={
                            profile.isOnline ? "En línea" : profile.lastActive
                          }
                          onLike={handleLike}
                          onMessage={handleMessage}
                          onViewProfile={handleViewProfile}
                        />
                      </motion.div>
                    ))}

                  {/* Usuarios autenticados con credenciales demo: Perfiles demo */}
                  {isAuthenticated() &&
                    user?.email === "pareja@outlook.es" &&
                    filteredDemoProfiles.map((profile, index) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <AnimatedProfileCard
                          id={parseInt(profile.id.slice(-8), 16) || index}
                          profileId={profile.id}
                          name={profile.name}
                          age={profile.age}
                          location={profile.location}
                          image={profile.image}
                          bio={profile.bio}
                          interests={profile.interests}
                          isOnline={profile.isOnline}
                          isPremium={profile.isPremium}
                          isPrivate={false}
                          lastSeen={
                            profile.isOnline ? "En línea" : profile.lastActive
                          }
                          onLike={handleLike}
                          onMessage={handleMessage}
                          onViewProfile={handleViewProfile}
                        />
                      </motion.div>
                    ))}

                  {/* Usuarios autenticados reales: Perfiles reales */}
                  {isAuthenticated() &&
                    user?.email !== "single@outlook.es" &&
                    user?.email !== "pareja@outlook.es" &&
                    filteredProfiles.map((profile, index) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <AnimatedProfileCard
                          id={parseInt(profile.id)}
                          profileId={profile.id}
                          name={profile.name}
                          age={profile.age}
                          location={profile.location}
                          image={profile.image}
                          bio={profile.bio}
                          interests={profile.interests}
                          isOnline={profile.isOnline}
                          isPremium={profile.isPremium}
                          isPrivate={false}
                          lastSeen={
                            profile.isOnline ? "En línea" : profile.lastActive
                          }
                          onLike={handleLike}
                          onMessage={handleMessage}
                          canMessage={matchedIds.has(profile.id.toString())}
                          onViewProfile={handleViewProfile}
                        />
                      </motion.div>
                    ))}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Presentation Modals */}
      <SuperLikesModal
        isOpen={showSuperLikesModal}
        onClose={() => setShowSuperLikesModal(false)}
      />
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
      <CompatibilityModal
        isOpen={showCompatibilityModal}
        onClose={() => setShowCompatibilityModal(false)}
      />
      <EventsModal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
      />
    </div>
  );
};

