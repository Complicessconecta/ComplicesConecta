import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Badge } from "@/components/ui/badge";
import { ContrastFixer } from "@/components/accessibility/ContrastFixer";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateDemoProfiles } from "@/demo/demoData";
import { logger } from "@/lib/logger";
import { Search, Filter, Brain, Sparkles, Heart, MapPin } from "lucide-react";

interface FilterState {
  location: string;
  ageRange: [number, number];
  interests: string[];
  onlineOnly: boolean;
  searchQuery: string;
}

interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  images: string[];
  interests: string[];
  isOnline: boolean;
  verified: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

// Ronda 27 (stream B): mismo tope que AdminModerators (ronda 24).
// Sin él, «Cargando perfiles...» se quedaba para siempre cuando la
// consulta a Supabase se colgaba en red (test dirigido PR #88:
// /profiles en "Cargando..." >10 s). Al vencer, la carga resuelve
// con error VISIBLE (banner con Reintentar) en vez de colgarse.
export const PROFILES_FETCH_TIMEOUT_MS = 15_000;

const withFetchTimeout = <T,>(promise: Promise<T>, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_resolve, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`Tiempo de espera agotado al cargar ${label} (15 s)`),
          ),
        PROFILES_FETCH_TIMEOUT_MS,
      ),
    ),
  ]);

const Profiles: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<"demo" | "real" | null>(null);
  // Ronda 27 (stream B): error de carga visible (banner con
  // Reintentar, no solo log). Antes el error de la consulta se
  // tragaba en loadRealProfiles (devolvía []) y la página mostraba
  // «0 perfiles encontrados» sin explicar nada; con la consulta
  // colgada, ni eso: «Cargando perfiles...» para siempre.
  const [loadError, setLoadError] = useState<string | null>(null);
  const profilesPerPage = 9;

  // Función para cargar perfiles reales desde Supabase.
  //
  // Ronda 27 (stream B): la consulta corre con tope de 15 s
  // (withFetchTimeout, patrón ronda 24) y los errores PROPAGAN en
  // vez de tragarse devolviendo []: el llamador (initializeProfiles)
  // los convierte en banner visible con Reintentar. Sin tope, una
  // consulta colgada dejaba «Cargando perfiles...» para siempre; sin
  // propagar, un error se veía igual que «0 perfiles» (test dirigido
  // PR #88).
  const loadRealProfiles = async (): Promise<Profile[]> => {
    setIsLoading(true);
    logger.info("🔄 Cargando perfiles reales desde Supabase...");

    if (!supabase) {
      logger.error("Supabase no está disponible");
      throw new Error("Supabase no está disponible");
    }

    // Ronda 24: tope propio a la consulta (ver withFetchTimeout).
    // Tipo explícito: el builder de Supabase es un thenable, no un
    // Promise, y sin él T se infiere como unknown (TS2339).
    const { data: profiles, error } = await withFetchTimeout<{
      data: Array<Record<string, any>> | null;
      error: { message: string; details?: string } | null;
    }>(
      (supabase as any)
        .from("profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          display_name,
          age,
          location,
          bio,
          interests,
          avatar_url,
          is_verified,
          created_at,
          updated_at
        `,
        )
        .eq("is_demo", false)
        .not("first_name", "is", null),
      "los perfiles",
    );

    if (error) {
      logger.error("❌ Error cargando perfiles reales:", {
        error: error.message,
        details: error.details,
      });
      // Como Error (no el objeto crudo de Supabase): el llamador
      // muestra error.message en el banner.
      throw new Error(error.message || "Error cargando perfiles reales");
    }

    // Convertir perfiles de Supabase al formato de Profile
    const formattedProfiles: Profile[] =
      profiles?.map((p: any) => ({
        id: p.id,
        name: p.display_name || `${p.first_name} ${p.last_name}`,
        age: p.age || 25,
        location: p.location || "Ciudad de México",
        bio: p.bio || "Perfil profesional en el ambiente swinger",
        images: p.avatar_url
          ? [p.avatar_url]
          : [
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(p.first_name || "Usuario"),
            ],
        interests: Array.isArray(p.interests)
          ? p.interests
          : ["Swinger", "Discreción"],
        isOnline: Math.random() > 0.5, // Simular estado online
        verified: p.is_verified || false,
        coordinates: { lat: 19.4326, lng: -99.1332 }, // Coordenadas por defecto
      })) || [];

    logger.info("✅ Perfiles reales cargados:", {
      count: formattedProfiles.length,
    });
    return formattedProfiles;
  };

  // Función para cargar perfiles demo.
  //
  // Ronda 27 (stream B): rama demo LOCAL, sin llamadas a Supabase —
  // mismo patrón que loadDemoModeratorsData() de AdminModerators
  // (ronda 26). El roster es el canónico (generateDemoProfiles, misma
  // fuente que Discover y Admin), mapeado al formato local de Profile:
  // `image` → `images: [image]`, `isVerified` → `verified`. El roster
  // demo no trae coordenadas: se usa la de Ciudad de México por
  // defecto, igual que el mapeo real de arriba.
  //
  // La rama demo se decide SOLO por el flag `demo_authenticated`
  // (sin exigir `demo_user`): antes, con el flag puesto pero sin
  // `demo_user` legible, la rama demo se saltaba y se caía a la rama
  // real — `isAuthenticated()` devuelve true con solo el flag
  // (useAuth.ts:917-919) — y la consulta Supabase sin tope se
  // colgaba en «Cargando perfiles...». En demo no hay sesión real
  // de Supabase (la auth demo es solo localStorage), así que la
  // consulta no tiene nada que devolver.
  const loadDemoProfiles = (): Profile[] => {
    logger.info("🔄 Cargando perfiles demo...");
    return generateDemoProfiles(20).map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      location: p.location,
      bio: p.bio,
      images: [p.image],
      interests: p.interests,
      isOnline: p.isOnline,
      verified: p.isVerified,
      coordinates: { lat: 19.4326, lng: -99.1332 },
    }));
  };

  // Detectar tipo de usuario y cargar perfiles apropiados.
  // Fuera del efecto para que el botón Reintentar del banner de
  // error pueda volver a llamarla (ronda 27).
  const initializeProfiles = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // Verificar si es usuario demo: SOLO el flag (ver
      // loadDemoProfiles). Con el flag puesto, la rama demo es local
      // y nunca toca Supabase.
      const isDemoAuthenticated =
        localStorage.getItem("demo_authenticated") === "true";

      // Verificar si es usuario real
      const isRealAuthenticated = isAuthenticated() && user && profile;

      let profiles: Profile[] = [];

      if (isDemoAuthenticated) {
        // Usuario demo
        setUserType("demo");
        profiles = loadDemoProfiles();
        logger.info("👤 Usuario demo detectado, cargando perfiles demo");
      } else if (isRealAuthenticated) {
        // Usuario real
        setUserType("real");
        profiles = await loadRealProfiles();
        logger.info("👤 Usuario real detectado, cargando perfiles reales");
      } else {
        // No autenticado, redirigir a auth
        logger.info("❌ Usuario no autenticado, redirigiendo a /auth");
        navigate("/auth");
        return;
      }

      setAllProfiles(profiles);
      setFilteredProfiles(profiles);
      setIsLoading(false);
    } catch (error) {
      // Ronda 27: el error ya no se traga en silencio — banner
      // visible con Reintentar (el tope de 15 s cae aquí cuando la
      // consulta se cuelga).
      logger.error("❌ Error inicializando perfiles:", {
        error: error instanceof Error ? error.message : String(error),
      });
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los perfiles.",
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void initializeProfiles();
  }, [isAuthenticated, user, profile, navigate]);

  // Función para calcular distancia entre coordenadas
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Función para calcular similitud de intereses
  const calculateInterestSimilarity = (
    interests1: string[],
    interests2: string[],
  ): number => {
    const set1 = new Set(interests1.map((i) => i.toLowerCase()));
    const set2 = new Set(interests2.map((i) => i.toLowerCase()));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  };

  // Sugerencias de IA actualizadas para tema swinger
  const _generateAiSuggestions = (query: string) => {
    const suggestions = [
      "Parejas swinger experimentadas",
      "Eventos privados discretos",
      "Intercambio consensual",
      "Lifestyle alternativo",
      "Parejas aventureras",
      "Eventos exclusivos",
      "Discreción y respeto",
      "Nuevas experiencias",
      "Ambiente swinger",
      "Conexiones auténticas",
    ];
    return suggestions
      .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);
  };

  const handleAiSearch = async (query: string) => {
    setIsSearching(true);
    try {
      // Simulación de búsqueda IA con filtrado real
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Filtrar perfiles basado en la búsqueda
      let filtered = allProfiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query.toLowerCase()) ||
          profile.bio.toLowerCase().includes(query.toLowerCase()) ||
          profile.location.toLowerCase().includes(query.toLowerCase()) ||
          profile.interests.some((interest) =>
            interest.toLowerCase().includes(query.toLowerCase()),
          ),
      );

      // Ordenar por similitud de intereses y distancia
      // Usar ubicación del usuario actual si está disponible
      let userLocation = { lat: 19.4326, lng: -99.1332 }; // Ciudad de México como referencia por defecto

      // Si es usuario real, usar su ubicación del perfil
      if (
        userType === "real" &&
        profile?.location &&
        typeof profile.location === "string"
      ) {
        // Mapear ubicaciones conocidas a coordenadas
        const locationMap: { [key: string]: { lat: number; lng: number } } = {
          "Ciudad de México": { lat: 19.4326, lng: -99.1332 },
          Guadalajara: { lat: 20.6597, lng: -103.3496 },
          Monterrey: { lat: 25.6866, lng: -100.3161 },
          Puebla: { lat: 19.0414, lng: -98.2063 },
          Tijuana: { lat: 32.5149, lng: -117.0382 },
          Cancún: { lat: 21.1619, lng: -86.8515 },
          Mérida: { lat: 20.9674, lng: -89.5926 },
          León: { lat: 21.122, lng: -101.6869 },
          "Playa del Carmen": { lat: 20.6296, lng: -87.0739 },
        };

        const userCoords = locationMap[profile.location];
        if (userCoords) {
          userLocation = userCoords;
        }
      }

      filtered = filtered.map((profile) => {
        let score = 0;

        // Calcular similitud de intereses
        const userInterests =
          userType === "real" && profile?.interests
            ? profile.interests
            : ["Swinger", "Eventos Privados", "Discreción"]; // Intereses por defecto
        const similarity = calculateInterestSimilarity(
          userInterests,
          profile.interests,
        );
        score += similarity * 50; // 50% del score por similitud

        // Calcular distancia si tiene coordenadas
        if (profile.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            profile.coordinates.lat,
            profile.coordinates.lng,
          );
          profile.distance = Math.round(distance);

          // Score por proximidad (más cerca = mejor score)
          if (distance < 50)
            score += 30; // Dentro de 50km
          else if (distance < 100)
            score += 20; // Dentro de 100km
          else if (distance < 200) score += 10; // Dentro de 200km
        }

        // Bonus por estar online
        if (profile.isOnline) score += 10;

        // Bonus por estar verificado
        if (profile.verified) score += 10;

        return { ...profile, aiScore: score };
      });

      // Ordenar por score de IA (mayor a menor)
      filtered.sort((a, b) => (b as any).aiScore - (a as any).aiScore);

      setFilteredProfiles(filtered);
      setAiSearchMode(true);
      const dynamicSuggestions = _generateAiSuggestions(query);
      setAiSuggestions(
        dynamicSuggestions.length > 0
          ? dynamicSuggestions
          : [
              "parejas swinger",
              "eventos privados",
              "lifestyle alternativo",
              "discreción",
            ],
      );
      logger.info("🤖 Búsqueda IA completada", {
        query,
        results: filtered.length,
        userType,
        topMatch: filtered[0]?.name,
        topScore: (filtered[0] as any)?.aiScore,
      });
    } catch (error) {
      logger.error("❌ Error en búsqueda IA:", { error });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    logger.info("🔍 Filtros aplicados", { filters });

    let filtered = allProfiles;

    // Filtro por ubicación
    if (filters.location && filters.location !== "all") {
      filtered = filtered.filter((profile) =>
        profile.location.toLowerCase().includes(filters.location.toLowerCase()),
      );
    }

    // Filtro por rango de edad
    if (
      filters.ageRange &&
      filters.ageRange[0] !== 18 &&
      filters.ageRange[1] !== 50
    ) {
      filtered = filtered.filter(
        (profile) =>
          profile.age >= filters.ageRange[0] &&
          profile.age <= filters.ageRange[1],
      );
    }

    // Filtro por intereses
    if (filters.interests && filters.interests.length > 0) {
      filtered = filtered.filter((profile) =>
        filters.interests.some((interest) =>
          profile.interests.some((profileInterest) =>
            profileInterest.toLowerCase().includes(interest.toLowerCase()),
          ),
        ),
      );
    }

    // Filtro por solo online
    if (filters.onlineOnly) {
      filtered = filtered.filter((profile) => profile.isOnline);
    }

    // Filtro por búsqueda de texto
    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.bio.toLowerCase().includes(query) ||
          profile.location.toLowerCase().includes(query) ||
          profile.interests.some((interest) =>
            interest.toLowerCase().includes(query),
          ),
      );
    }

    setFilteredProfiles(filtered);
    setCurrentPage(1);
    logger.info("✅ Filtros aplicados exitosamente", {
      originalCount: allProfiles.length,
      filteredCount: filtered.length,
    });
  };

  // Paginación
  const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);
  const startIndex = (currentPage - 1) * profilesPerPage;
  const currentProfiles = filteredProfiles.slice(
    startIndex,
    startIndex + profilesPerPage,
  );

  const ProfileCard: React.FC<{
    profile: Profile;
    onOpenModal: () => void;
  }> = ({ profile }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white/10 backdrop-blur-sm border-white/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img
              src={profile.images[0]}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${profile.name}&background=random&color=fff&size=48`;
              }}
            />
            {profile.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{profile.name}</h3>
              {profile.verified && (
                <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs">
                  ✓ Verificado
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/70">
              {profile.age} años &bull; {profile.location}
              {profile.distance ? <> &bull; {profile.distance} km</> : null}
            </p>
          </div>
        </div>
        <p className="text-sm text-white/80 mb-3 line-clamp-2">{profile.bio}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {profile.interests.slice(0, 3).map((interest, idx) => (
            <Badge
              key={idx}
              className="text-xs bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
            >
              {interest}
            </Badge>
          ))}
          {profile.interests.length > 3 && (
            <Badge className="text-xs bg-white/10 text-white/70 border-white/20">
              +{profile.interests.length - 3} más
            </Badge>
          )}
        </div>
        <Button
          className="w-full px-3 py-2 text-sm bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          onClick={() => logger.info("Ver perfil:", { profileId: profile.id })}
        >
          Ver Perfil Completo
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-violet-800 relative overflow-hidden">
      <ContrastFixer enabled={true} level="AA" />

      {/* Elementos decorativos */}
      <Heart
        className="absolute bottom-1/3 right-1/4 w-5 h-5 text-accent/20 animate-pulse"
        fill="currentColor"
      />
      <MapPin className="absolute top-1/2 right-1/6 w-7 h-7 text-secondary/15 animate-pulse" />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Indicador de tipo de usuario */}
        {userType && (
          <div className="mb-4 text-center">
            <Badge
              className={`px-4 py-2 text-sm ${
                userType === "demo"
                  ? "bg-yellow-500/20 text-yellow-200 border border-yellow-400/30"
                  : "bg-green-500/20 text-green-200 border border-green-400/30"
              }`}
            >
              {userType === "demo" ? "👤 Modo Demo" : "✅ Usuario Real"}
            </Badge>
          </div>
        )}

        {/* Estado de carga */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-white">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-lg">Cargando perfiles...</span>
            </div>
          </div>
        )}

        {/* Ronda 27 (stream B): error de carga visible (banner, no
            solo log): con el tope, una consulta colgada resuelve aquí
            en ~15 s. Reintentar vuelve a correr initializeProfiles. */}
        {!isLoading && loadError && (
          <div
            role="alert"
            className="mb-6 mx-auto max-w-2xl rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-center"
          >
            <p className="text-red-200 font-medium">
              No se pudieron cargar los perfiles: {loadError}
            </p>
            <button
              type="button"
              onClick={() => void initializeProfiles()}
              className="mt-3 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido principal */}
        {!isLoading && (
          <>
            {/* Encabezado de página */}
            <div className="text-center mb-12 pt-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                Descubre
                <span className="block bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                  Tu Match Perfecto
                </span>
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8 drop-shadow-md">
                Usa nuestra IA avanzada para encontrar personas compatibles
                basándose en personalidad, intereses y valores
              </p>

              {/* Sección de búsqueda IA */}
              <Card className="max-w-2xl mx-auto mb-8 shadow-glow border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-6 w-6 text-purple-400 drop-shadow-md" />
                      <Sparkles className="h-5 w-5 text-purple-400 animate-pulse drop-shadow-md" />
                    </div>
                    <h3 className="text-lg font-semibold text-white drop-shadow-md">
                      Búsqueda Inteligente por IA
                    </h3>
                  </div>

                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                        <Input
                          placeholder="Busca parejas, solteros, eventos..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-3 text-base bg-white/10 border-white/20 text-white placeholder:text-white/80"
                        />
                      </div>
                      <Button
                        onClick={() => handleAiSearch(searchQuery)}
                        disabled={isSearching || searchQuery.length < 3}
                        className="px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        {isSearching ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Buscando...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Buscar
                          </div>
                        )}
                      </Button>
                    </div>

                    {/* Sugerencias de IA */}
                    {aiSuggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-white/70 mb-2">
                          Sugerencias de IA:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.map((suggestion, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/10 transition-colors"
                              onClick={() => {
                                setSearchQuery(suggestion);
                                handleAiSearch(suggestion);
                              }}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {aiSearchMode && (
                    <div className="mt-4 p-3 bg-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-purple-200">
                        <Brain className="h-4 w-4" />
                        <span>
                          Resultados ordenados por compatibilidad de IA
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sección de filtros */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-white drop-shadow-md" />
                <h3 className="text-lg font-semibold text-white drop-shadow-md">
                  Filtros Avanzados
                </h3>
              </div>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Filtro por ubicación */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 drop-shadow-md">
                        Ubicación
                      </label>
                      <select
                        title="Filtrar por ubicación"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const filters: FilterState = {
                            location: e.target.value,
                            ageRange: [18, 50],
                            interests: [],
                            onlineOnly: false,
                            searchQuery: "",
                          };
                          handleFilterChange(filters);
                        }}
                      >
                        <option value="all">Todas las ubicaciones</option>
                        <option value="Ciudad de México">
                          Ciudad de México
                        </option>
                        <option value="Guadalajara">Guadalajara</option>
                        <option value="Monterrey">Monterrey</option>
                        <option value="Puebla">Puebla</option>
                        <option value="Tijuana">Tijuana</option>
                        <option value="Cancún">Cancún</option>
                        <option value="Mérida">Mérida</option>
                        <option value="León">León</option>
                        <option value="Playa del Carmen">
                          Playa del Carmen
                        </option>
                      </select>
                    </div>

                    {/* Filtro por intereses */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 drop-shadow-md">
                        Intereses
                      </label>
                      <select
                        title="Filtrar por intereses"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const filters: FilterState = {
                            location: "all",
                            ageRange: [18, 50],
                            interests: e.target.value ? [e.target.value] : [],
                            onlineOnly: false,
                            searchQuery: "",
                          };
                          handleFilterChange(filters);
                        }}
                      >
                        <option value="">Todos los intereses</option>
                        <option value="Swinger">Swinger</option>
                        <option value="Eventos Privados">
                          Eventos Privados
                        </option>
                        <option value="Parejas">Parejas</option>
                        <option value="Discreción">Discreción</option>
                        <option value="Intercambio">Intercambio</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Nuevas Experiencias">
                          Nuevas Experiencias
                        </option>
                      </select>
                    </div>

                    {/* Filtro por estado online */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 drop-shadow-md">
                        Estado
                      </label>
                      <select
                        title="Filtrar por estado online"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onChange={(e) => {
                          const filters: FilterState = {
                            location: "all",
                            ageRange: [18, 50],
                            interests: [],
                            onlineOnly: e.target.value === "online",
                            searchQuery: "",
                          };
                          handleFilterChange(filters);
                        }}
                      >
                        <option value="all">Todos</option>
                        <option value="online">Solo online</option>
                        <option value="offline">Solo offline</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de resultados */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <p className="text-white drop-shadow-md font-medium">
                  {filteredProfiles.length} perfiles encontrados
                </p>
                {aiSearchMode && (
                  <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/30 drop-shadow-md">
                    <Brain className="h-3 w-3 mr-1" />
                    Ordenado por IA
                  </Badge>
                )}
              </div>
              <Button
                className="border border-white/30 text-white hover:bg-white/10 bg-transparent px-4 py-2 text-sm transition-all duration-200 hover:border-white/50"
                onClick={() => {
                  setFilteredProfiles(allProfiles);
                  setAiSearchMode(false);
                  setSearchQuery("");
                  setAiSuggestions([]);
                  setCurrentPage(1);
                  logger.info("🧹 Filtros limpiados");
                }}
              >
                Limpiar filtros
              </Button>
            </div>

            {/* Grid de perfiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onOpenModal={() => {}}
                />
              ))}
            </div>

            {/* Paginación */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-white bg-purple-600/80 border border-purple-400 rounded-md hover:bg-purple-700/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-2 text-sm font-medium text-white">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-white bg-purple-600/80 border border-purple-400 rounded-md hover:bg-purple-700/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Profiles;
