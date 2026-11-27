import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  User,
  Flame,
  Users,
  Crown,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { safeGetItem } from "@/lib/safe-storage";
import { formatApproximateDistance } from "@/lib/geolocation";
import {
  DEMO_COUPLE_CARMEN_ROBERTO,
  SOFIA_CANONICAL_PHOTO,
} from "@/demo/demoData";
import { generateDemoUUID } from "@/lib/demo-uuid";
import { isDemoMatchHistoryCleared } from "@/lib/demoMatchHistory";

// Professional profile images from Unsplash - Production ready
// Removed local imports that fail in production

export interface Match {
  id: number;
  name: string;
  age: number;
  /** Etiqueta de edad a mostrar ("25 y 28 años" en parejas). */
  ageLabel?: string;
  /**
   * Id estable del perfil para /profile/<profileId>. Los ids numéricos
   * de match (1-6) chocaban con la lista legacy de ProfileDetail
   * (1-4: Ana, Antonio...), así que /profile/3 mostraba a Carmen &
   * Roberto al navegar desde aquí y a Ana al cargar directo. Carmen &
   * Roberto usa su UUID del roster de Discover; los demás, un id
   * estable propio (el wrapper no los resuelve, pero el detalle usa
   * el perfil del state cuando el id coincide con la URL).
   */
  profileId: string;
  image: string;
  compatibility: number;
  mutualInterests: string[];
  distance: number;
  matchedAt: string;
  hasUnreadMessage: boolean;
  status: "new" | "viewed" | "chatting";
}

const Matches = () => {
  const navigate = useNavigate();
  const { isAuthenticated: _isAuthenticated, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading] = useState(false);

  // Datos demo de matches. Edades y fotos canónicas (ronda 5):
  // Carmen & Roberto 25 y 28 años (DEMO_COUPLE_CARMEN_ROBERTO, la
  // misma fuente que Discover y su perfil propio — antes decía 35) y
  // su foto es la del pool de pareja; Sofía 28 años (antes 29) con su
  // foto canónica. Anabella & Julio y Miguel & Elena no están en el
  // roster: sus fotos son dos parejas juntas verificadas por vista
  // (Wikimedia Commons, novios abrazándose / caminando), distintas de
  // las del pool para no reutilizarlas entre perfiles. Las distancias
  // se muestran aproximadas (ver MatchCard).
  const [demoMatches] = useState<Match[]>([
    {
      id: 1,
      profileId: "match-anabella-julio",
      name: "Anabella & Julio",
      age: 32,
      image:
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/A_wedding_bride_and_groom_01.jpg/500px-A_wedding_bride_and_groom_01.jpg",
      compatibility: 98,
      mutualInterests: ["Fiestas Privadas", "Intercambio", "Eventos VIP"],
      distance: 1.2,
      matchedAt: "Hace 2 horas",
      hasUnreadMessage: true,
      status: "new",
    },
    {
      id: 2,
      profileId: "demo-single-1",
      name: "Sofía",
      age: 28,
      image: SOFIA_CANONICAL_PHOTO,
      compatibility: 94,
      mutualInterests: ["Unicornio", "Experiencias Nuevas", "Discreción"],
      distance: 3.5,
      matchedAt: "Ayer",
      hasUnreadMessage: true,
      status: "chatting",
    },
    {
      id: 3,
      profileId: generateDemoUUID("demo-profile-6"),
      name: "Carmen & Roberto",
      age: DEMO_COUPLE_CARMEN_ROBERTO.partner1.age,
      ageLabel: DEMO_COUPLE_CARMEN_ROBERTO.ageLabel,
      image: DEMO_COUPLE_CARMEN_ROBERTO.mainImage,
      compatibility: 91,
      mutualInterests: [
        "Intercambio Suave",
        "Clubs Exclusivos",
        "Parejas Verificadas",
      ],
      distance: 5.8,
      matchedAt: "Hace 3 días",
      hasUnreadMessage: false,
      status: "viewed",
    },
    {
      id: 4,
      profileId: "match-raul",
      name: "Raúl",
      age: 26,
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
      compatibility: 89,
      mutualInterests: ["Single Masculino", "Experiencias Nuevas", "Aventuras"],
      distance: 2.1,
      matchedAt: "Hace 1 semana",
      hasUnreadMessage: false,
      status: "chatting",
    },
    {
      id: 5,
      profileId: "match-valentina",
      name: "Valentina",
      age: 27,
      image:
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face",
      compatibility: 96,
      mutualInterests: ["Lifestyle", "Aventuras", "Discreción Total"],
      distance: 4.2,
      matchedAt: "Hace 5 horas",
      hasUnreadMessage: true,
      status: "new",
    },
    {
      id: 6,
      profileId: "match-miguel-elena",
      name: "Miguel & Elena",
      age: 34,
      image:
        "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Bride_and_groom_at_wedding_party.jpg/500px-Bride_and_groom_at_wedding_party.jpg",
      compatibility: 92,
      mutualInterests: [
        "Parejas Swinger",
        "Intercambio Completo",
        "Eventos Exclusivos",
      ],
      distance: 6.8,
      matchedAt: "Hace 2 días",
      hasUnreadMessage: false,
      status: "viewed",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "new" | "recent" | "unread">(
    "all",
  );

  // Detectar modo de operación (demo vs producción)
  useEffect(() => {
    const demoAuth = safeGetItem<string>("demo_authenticated", {
      validate: true,
      defaultValue: "false",
    });
    const isDemo = demoAuth === "true";

    // Ronda 21 (stream B, FAIL 6): si el usuario eliminó su
    // historial demo desde /settings ("Eliminar historial de
    // matches"), la lista queda vacía: la semilla NO se recarga.
    // La marca vive en `cc_demo_matches_cleared:<userId>` (ver
    // `src/lib/demoMatchHistory.ts`); sin ella, la semilla es la
    // única fuente de matches demo (no hay almacén local).
    if (user?.id && isDemoMatchHistoryCleared(user.id)) {
      if (matches.length > 0) setMatches([]);
      logger.info("ℹ️ Historial de matches demo eliminado: lista vacía");
      return;
    }

    // SIEMPRE usar datos demo para respetar la lógica de negocio
    // No cargar datos reales hasta que el sistema esté completamente implementado
    if (matches.length === 0) {
      setMatches(demoMatches);
      logger.info("✅ Matches demo cargados (respetando lógica de negocio):", {
        count: demoMatches.length,
        isDemo,
      });
    }
  }, [matches.length, user?.id]);

  const currentMatches = matches; // Siempre usar datos demo para respetar lógica de negocio
  const filteredMatches = currentMatches.filter((match) => {
    switch (filter) {
      case "new":
        return match.status === "new";
      case "recent":
        return (
          match.matchedAt.includes("horas") || match.matchedAt.includes("Ayer")
        );
      case "unread":
        return match.hasUnreadMessage;
      default:
        return true;
    }
  });

  const handleStartChat = (matchId: number) => {
    // Abrir el chat demo con ese match. Chat.tsx lee el :id de la ruta y
    // el perfil del state para construir y seleccionar la conversación
    // (en demo el acceso está forzado y los mensajes se agregan en local).
    // Antes solo hacía un log y el botón no hacía nada visible.
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      logger.warn("Start chat: match no encontrado", { matchId });
      return;
    }
    logger.info("Start chat:", { matchId });
    navigate(`/chat/${match.id}`, {
      state: {
        profile: {
          id: String(match.id),
          name: match.name,
          image: match.image,
          isOnline: true,
        },
      },
    });
  };

  const handleViewProfile = (matchId: number) => {
    // Abrir el detalle del perfil. ProfileDetail lee el :id y el perfil
    // del state (lo adapta con valores por defecto). Antes solo hacía un
    // log y el botón no hacía nada visible.
    // Se navega con match.profileId (id estable), NO con el id numérico
    // del match: /profile/3 es Ana en la lista legacy y Carmen &
    // Roberto en Matches, así que la misma URL mostraba dos personas
    // distintas según se llegara con state o directo.
    const match = matches.find((m) => m.id === matchId);
    if (!match) {
      logger.warn("View profile: match no encontrado", { matchId });
      return;
    }
    logger.info("View profile:", { matchId });
    navigate(`/profile/${match.profileId}`, {
      state: {
        profile: {
          id: match.profileId,
          name: match.name,
          age: match.age,
          ageLabel: match.ageLabel,
          location: "Ciudad de México",
          interests: match.mutualInterests,
          image: match.image,
          isOnline: true,
          bio: "Conexiones auténticas y experiencias únicas.",
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-linear-to-b dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 sm:p-6">
      <main className="max-w-6xl mx-auto mt-6 space-y-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta de nuevos matches */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  Nuevos Matches
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentMatches.filter((m) => m.status === "new").length}
                </p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-full">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Tarjeta de conversaciones */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  Conversaciones
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentMatches.filter((m) => m.hasUnreadMessage).length}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Tarjeta de compatibilidad */}
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  Compatibilidad
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentMatches.length > 0
                    ? `${Math.round(currentMatches.reduce((acc, m) => acc + m.compatibility, 0) / currentMatches.length)}%`
                    : "0%"}
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <Crown className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              {
                id: "all",
                label: "Todos",
                icon: Users,
                count: currentMatches.length,
              },
              {
                id: "new",
                label: "Nuevos",
                icon: Flame,
                count: currentMatches.filter((m) => m.status === "new").length,
              },
              {
                id: "recent",
                label: "Recientes",
                icon: Sparkles,
                count: currentMatches.filter(
                  (m) =>
                    m.matchedAt.includes("horas") ||
                    m.matchedAt.includes("Ayer"),
                ).length,
              },
              {
                id: "unread",
                label: "No leídos",
                icon: MessageCircle,
                count: currentMatches.filter((m) => m.hasUnreadMessage).length,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                  filter === item.id
                    ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-700/50 dark:border-gray-600/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid de Matches */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-200/60 dark:bg-gray-800/30 rounded-2xl p-4 animate-pulse h-80"
              >
                <div className="bg-slate-300/60 dark:bg-gray-700/50 rounded-lg h-48 mb-4"></div>
                <div className="h-4 bg-slate-300/60 dark:bg-gray-700/50 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-300/60 dark:bg-gray-700/50 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, _) => (
              <MatchCard
                key={match.id}
                match={match}
                onMessage={handleStartChat}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-gray-700/50">
            <div className="bg-linear-to-br from-purple-500/10 to-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-purple-400/50" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No hay matches
            </h3>
            <p className="text-slate-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              No se encontraron coincidencias con los filtros actuales. Intenta
              ajustar tus preferencias.
            </p>
            <button
              onClick={() => setFilter("all")}
              className="px-6 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Ver todos los matches
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

// Componente MatchCard mejorado
const MatchCard = ({
  match,
  onMessage,
  onViewProfile,
}: {
  match: Match;
  onMessage: (id: number) => void;
  onViewProfile: (id: number) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 group"
    >
      {/* Imagen de perfil */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={match.image}
          alt={match.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const fallback =
              "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=600&fit=crop&crop=face";
            if (target.src !== fallback) target.src = fallback;
          }}
        />

        {/* Badge de estado */}
        {match.status === "new" && (
          <div className="absolute top-3 right-3 bg-linear-to-r from-fuchsia-500 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>
            NUEVO
          </div>
        )}

        {/* Overlay de información */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-white">{match.name}</h3>
              <div className="flex items-center text-sm text-gray-200">
                <span>{match.ageLabel ?? `${match.age} años`}</span>
                <span className="mx-2">•</span>
                {/* Distancia APROXIMADA (mínimo 1 km, sin decimales), igual
                    que en Discover: antes salía la exacta con decimal
                    ("1.2 km", "3.5 km"...). */}
                <span>{formatApproximateDistance(match.distance)}</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
              {match.compatibility}%
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        {/* Intereses en común */}
        <div className="flex flex-wrap gap-2 mb-4">
          {match.mutualInterests.slice(0, 3).map((interest, i) => (
            <span
              key={i}
              className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-100 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-500/20"
            >
              {interest}
            </span>
          ))}
          {match.mutualInterests.length > 3 && (
            <span className="text-xs bg-slate-100 text-slate-600 dark:bg-gray-700/50 dark:text-gray-300 px-3 py-1 rounded-full">
              +{match.mutualInterests.length - 3}
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={() => onMessage(match.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              match.hasUnreadMessage
                ? "bg-linear-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 dark:bg-gray-700/50 dark:text-gray-200 dark:hover:bg-gray-600/50 dark:border-gray-600/30"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            {match.hasUnreadMessage ? "Nuevo mensaje" : "Mensaje"}
          </button>

          <button
            onClick={() => onViewProfile(match.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-700 dark:text-white bg-slate-100 dark:bg-gray-700/50 hover:bg-slate-200 dark:hover:bg-gray-600/50 border border-slate-300 dark:border-gray-600/30 transition-all"
          >
            <User className="h-4 w-4" />
            Ver perfil
          </button>
        </div>

        {/* Fecha del match */}
        <div className="mt-3 text-center">
          <span className="text-xs text-slate-500 dark:text-gray-400">
            {`Conectado ${match.matchedAt.toLowerCase()}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Matches;
