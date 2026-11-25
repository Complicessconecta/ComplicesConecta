import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, MapPin, Star, Shield, Camera } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/Footer";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { ProfileContent } from "@/components/profiles/ProfileContent";
import { ReportDialog } from "@/components/dialogs/ReportDialog";
import { toast } from "@/hooks/useToast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { clsx } from "clsx";
import { useProfileScore } from "@/features/profile/useProfileScore";
import { NationalityBadge } from "@/components/profiles/shared/NationalityBadge";
import { DistanceBadge } from "@/components/profiles/shared/DistanceBadge";
import { FriendRequestButton } from "@/components/profiles/shared/FriendRequestButton";
import { PhotoAccessRequestButton } from "@/components/profiles/shared/PhotoAccessRequestButton";
import { ReportBlockButtons } from "@/components/profiles/shared/ReportBlockButtons";
import { FriendsSection } from "@/components/profiles/shared/FriendsSection";
import { PrivateProfileGate } from "@/components/profiles/shared/PrivateProfileGate";
import { getSocialDemoData } from "@/demo/socialDemoData";
import {
  readVisibilityLocalOrNull,
  fetchProfileVisibility,
  resolveProfileVisibility,
  isProfileGated,
} from "@/lib/profileVisibility";
import { areFriendsSync } from "@/lib/friends";
import { readLocationSharingLocal } from "@/lib/geolocation";

// Helper for class names if cn is not available globally or imported
function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

// Professional profile images from Unsplash - Production ready
// Removed local imports that fail in production

// Perfiles legacy de ids numéricos 1-4 (lista local del detalle).
// Exportada para que el wrapper de /profile/:id resuelva por URL con
// la MISMA fuente: antes el wrapper no conocía estos ids y /profile/3
// directo mostraba a Ana mientras que al navegar desde Matches con
// state mostraba a Carmen & Roberto (el id 3 de match). Ahora la URL
// manda siempre: /profile/3 es Ana en los dos casos.
export const LEGACY_NUMERIC_PROFILES = [
  {
    id: 1,
    name: "Demo User",
    age: 28,
    location: "Ciudad de México",
    interests: [
      "Lifestyle Swinger",
      "Mentalidad Abierta",
      "Experiencias Nuevas",
      "Conexiones Auténticas",
    ],
    image:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=600&fit=crop&crop=face",
    rating: 4.8,
    isOnline: true,
    bio: "Explorando el lifestyle con mentalidad abierta. Busco conexiones auténticas y experiencias únicas.",
    profession: "Profesional Independiente",
    education: "Universidad Nacional Autónoma de México",
    languages: ["Español"],
    hobbies: [
      "Fotografía Sensual",
      "Baile",
      "Cenas Íntimas",
      "Eventos Sociales",
    ],
    lookingFor:
      "Personas con mentalidad abierta para compartir experiencias del lifestyle",
    images: [
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
    ],
  },
  {
    id: 2,
    name: "Antonio",
    age: 34,
    location: "Ciudad de México",
    interests: [
      "Lifestyle Swinger",
      "Intercambio de Parejas",
      "Eventos Lifestyle",
      "Mentalidad Abierta",
    ],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face&auto=format&q=80",
    rating: 4.9,
    isOnline: false,
    bio: "Chef profesional del lifestyle. Me encanta crear experiencias culinarias íntimas y ambientes sensuales.",
    profession: "Chef",
    education: "Escuela de Hostelería de Ciudad de México",
    languages: ["Español"],
    hobbies: [
      "Cocina Afrodisíaca",
      "Cenas Íntimas",
      "Degustación de Vinos",
      "Masajes Relajantes",
    ],
    lookingFor:
      "Parejas y personas del lifestyle para compartir experiencias culinarias sensuales",
    images: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
    ],
  },
  {
    id: 3,
    name: "Ana",
    age: 26,
    location: "Guadalajara",
    interests: [
      "Fiestas Temáticas",
      "Clubs Privados",
      "Experiencias Nuevas",
      "Ambiente Sensual",
    ],
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
    rating: 4.7,
    isOnline: true,
    bio: "Artista del lifestyle. Exploro la sensualidad a través del arte y busco conexiones creativas auténticas.",
    profession: "Artista",
    education: "Bellas Artes - Universidad de Guadalajara",
    languages: ["Español"],
    hobbies: [
      "Arte Erótico",
      "Fotografía Sensual",
      "Baile Contemporáneo",
      "Literatura Erótica",
    ],
    lookingFor:
      "Personas creativas del lifestyle que aprecien el arte sensual y las experiencias únicas",
    images: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=600&fit=crop&crop=face",
    ],
  },
  {
    id: 4,
    name: "Diego",
    age: 30,
    location: "Monterrey",
    interests: [
      "Arte Erótico",
      "Fotografía Erótica",
      "Ambiente Sensual",
      "Conexiones Auténticas",
    ],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
    rating: 4.8,
    isOnline: true,
    bio: "Desarrollador del lifestyle tech. Combino mi pasión por la tecnología con experiencias sensuales auténticas.",
    profession: "Desarrollador",
    education: "Ingeniería Informática - Universidad de Monterrey",
    languages: ["Español"],
    hobbies: [
      "Fotografía Erótica",
      "Tecnología Sensual",
      "Spa de Parejas",
      "Eventos Exclusivos",
    ],
    lookingFor:
      "Parejas y personas del lifestyle tech que valoren la innovación y la sensualidad",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
    ],
  },
];

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  // Modal de reporte (mismo componente legible que en los perfiles
  // propios): antes el botón "Reportar perfil" solo mostraba un toast.
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Verificar autenticación demo
  const demoAuth = localStorage.getItem("demo_authenticated");
  const demoUser = localStorage.getItem("demo_user");

  // Allow access in demo mode or if user is authenticated
  if (demoAuth !== "true" && !demoUser && !isAuthenticated()) {
    // Only redirect to auth if not in demo mode
    const isDemoMode =
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("demo");
    if (!isDemoMode) {
      navigate("/auth");
      return null;
    }
  }

  const stateProfile = location.state?.profile;

  // Adapt state profile to local shape if needed. La URL manda: el
  // perfil del state solo vale si su id coincide con el :id de la URL.
  // Sin esta guarda, /profile/3 con state de Matches (Carmen &
  // Roberto, id 3 de match) mostraba a la pareja, y /profile/3 directo
  // mostraba a Ana (id 3 legacy): la misma URL, dos personas distintas
  // según cómo se llegara. Matches ya navega con profileId estable;
  // si algún otro flujo pasa un state con id distinto, se ignora y
  // resuelve por URL.
  const stateMatchesUrl =
    stateProfile != null && String(stateProfile.id) === String(id ?? "");
  const adaptedStateProfile =
    stateMatchesUrl && stateProfile
      ? {
          ...stateProfile,
          profession: stateProfile.profession || "Miembro de la comunidad",
          education: stateProfile.education || "No especificado",
          languages: stateProfile.languages || ["Español"],
          hobbies: stateProfile.hobbies || stateProfile.interests || [],
          lookingFor: stateProfile.lookingFor || "Conexiones auténticas",
          images: stateProfile.images || [stateProfile.image],
          rating: stateProfile.rating || 4.5,
        }
      : null;

  const profile =
    adaptedStateProfile ||
    LEGACY_NUMERIC_PROFILES.find((p) => p.id === parseInt(id || ""));

  const profileScore = useProfileScore(profile);

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900">
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Perfil no encontrado
          </h1>
          <Button
            onClick={() => navigate("/profiles")}
            className="text-white bg-linear-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            Volver a perfiles
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Espectador y datos sociales (amistad, reporte/bloqueo, nacionalidad,
  // distancia, perfil privado): el perfil que se ve es ajeno casi siempre;
  // si el id coincide con el del espectador, es el propio.
  const demoUserParsed = (() => {
    try {
      return demoUser
        ? (JSON.parse(demoUser) as {
            id?: string;
            first_name?: string;
            email?: string;
          })
        : null;
    } catch {
      return null;
    }
  })();
  const viewerId = String(demoUserParsed?.id ?? user?.id ?? "demo-viewer");
  const viewerName = String(
    demoUserParsed?.first_name ?? user?.email ?? "Tú",
  );
  const isDemo = demoAuth === "true" || Boolean(demoUser);
  const isOwnProfile = String(profile.id) === viewerId;
  const socialDemo = getSocialDemoData(profile.name);
  const countryCode =
    (profile as { country_code?: string | null }).country_code ??
    socialDemo.countryCode;
  // Visibilidad efectiva: la BD manda (perfiles reales), luego lo que el
  // dueño guardó en local, y si no hay nada, la semilla demo del perfil.
  // Sin el fetch a BD, un perfil real puesto en privado nunca se cerraba.
  const [dbVisibility, setDbVisibility] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchProfileVisibility(String(profile.id)).then((v) => {
      if (alive) setDbVisibility(v);
    });
    return () => {
      alive = false;
    };
  }, [profile.id]);
  const profileVisibility = resolveProfileVisibility({
    dbVisibility,
    storedVisibility: readVisibilityLocalOrNull(String(profile.id)),
    seedVisibility: socialDemo.visibility,
  });
  const isFriend = areFriendsSync(viewerId, String(profile.id), viewerName);
  const gated = isProfileGated({
    visibility: profileVisibility,
    isOwner: isOwnProfile,
    isFriend,
  });

  // Perfil privado y espectador no amigo: solo la pantalla de solicitud
  // (como Twitter). El dueño y los amigos aceptados ven el perfil completo.
  if (gated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-fuchsia-900 to-red-900 relative overflow-hidden">
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Button
            onClick={() => navigate("/discover")}
            className="text-white bg-white/10 border border-white/30 hover:bg-white/20 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Discover
          </Button>
          <PrivateProfileGate
            profileId={String(profile.id)}
            profileName={profile.name}
            viewerId={viewerId}
            viewerName={viewerName}
            isDemo={isDemo}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-fuchsia-900 to-red-900 relative overflow-hidden">
      {/* Corazones decorativos flotantes */}
      <DecorativeHearts count={5} />
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <div className="px-4 pt-4">
          {/* ProfileContent hardcodea el post de Ana ("Post Example -
              Perfil Single (Ana)") y luego "No hay posts aún": en TODOS
              los /profile/<id> salía el post de Ana seguido del vacío,
              aunque el perfil visitado fuera otro. El post debe ser del
              perfil que se visita o no mostrarse: aquí solo se renderiza
              en el perfil de Ana. El arreglo propio es hacer el post
              prop-driven en ProfileContent.tsx (ver reporte). */}
          {profile.name === "Ana" && <ProfileContent />}
        </div>
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            onClick={() => navigate("/profiles")}
            className="mb-6 flex items-center gap-2 text-white bg-linear-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 border-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a perfiles
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="shrink-0">
                      <Avatar className="w-32 h-32">
                        <AvatarImage
                          src={profile.image}
                          alt={profile.name}
                          onError={(e) => {
                            // Si la imagen falla, usar fallback de Unsplash.
                            // DETERMINISTA por nombre (antes era
                            // Math.random: la misma URL mostraba caras
                            // distintas en cada carga).
                            const fallbackImages = [
                              "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face&auto=format&q=80",
                              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80",
                              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face&auto=format&q=80",
                            ];
                            const defaultFallback =
                              "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
                            const nameHash = profile.name
                              .split("")
                              .reduce(
                                (acc: number, ch: string) =>
                                  acc + ch.charCodeAt(0),
                                0,
                              );
                            const deterministicFallback: string =
                              fallbackImages[
                                nameHash % fallbackImages.length
                              ] ?? defaultFallback;
                            if (
                              e.currentTarget.src !== deterministicFallback
                            ) {
                              e.currentTarget.src = deterministicFallback;
                            } else {
                              // Si también falla el fallback, ocultar imagen y mostrar fallback
                              e.currentTarget.style.display = "none";
                            }
                          }}
                        />
                        <AvatarFallback className="bg-linear-to-br from-purple-400 to-fuchsia-400 text-white text-2xl font-bold">
                          {profile.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center mt-2">
                        <div
                          className={`w-3 h-3 rounded-full ${profile.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className="text-sm text-white/80 ml-2">
                          {profile.isOnline ? "En línea" : "Desconectado"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">
                          {profile.name}
                        </h1>
                        <Badge className="bg-white/10 border-white/30 text-white backdrop-blur-sm whitespace-nowrap shrink-0">
                          {(
                            profile as { ageLabel?: string }
                          ).ageLabel ?? `${profile.age} años`}
                        </Badge>
                        <NationalityBadge countryCode={countryCode} />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                className={cn(
                                  "profile-badge flex items-center gap-1 whitespace-nowrap shrink-0",
                                  profileScore.color,
                                )}
                              >
                                <span>{profileScore.icon}</span>
                                <span>{profileScore.label}</span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Score de confianza:{" "}
                                {profileScore.score}/100
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex items-center gap-4 text-white/80 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                        <DistanceBadge
                          distanceKm={
                            (
                              profile as {
                                distance?: number | null;
                              }
                            ).distance ?? null
                          }
                          profileSharesLocation={socialDemo.sharesLocation}
                          viewerSharesLocation={readLocationSharingLocal(
                            viewerId,
                          )}
                        />
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{profile.rating}</span>
                        </div>
                      </div>

                      <p className="text-lg text-white mb-4">{profile.bio}</p>

                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-white/80">
                          Perfil verificado
                        </span>
                      </div>

                      <p className="text-sm text-white/80">
                        <strong className="text-white">Profesión:</strong>{" "}
                        {profile.profession}
                      </p>

                      <div className="space-y-4">
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                          <h3 className="font-medium text-gray-100 mb-2">
                            Qué busco
                          </h3>
                          <p className="text-gray-100 font-medium">
                            {profile.lookingFor}
                          </p>
                        </div>

                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                          <h3 className="font-medium text-gray-100 mb-2">
                            Educación
                          </h3>
                          <p className="text-gray-100 font-medium">
                            {profile.education}
                          </p>
                        </div>

                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                          <h3 className="font-medium text-gray-100 mb-2">
                            Idiomas
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.languages.map((lang: string) => (
                              <Badge
                                key={lang}
                                className="border border-white/30 bg-white/10 backdrop-blur-sm text-white"
                              >
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                          <h3 className="font-medium text-gray-100 mb-2">
                            Hobbies
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.hobbies.map((hobby: string) => (
                              <Badge
                                key={hobby}
                                className="bg-fuchsia-200/80 text-fuchsia-900 border border-fuchsia-300/50 px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
                                style={{ flexShrink: 0 }}
                              >
                                {hobby}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Amistades (punto 2): en línea / última conexión y, si es
                  el dueño, "Eliminar de amigos". */}
              <FriendsSection
                profileId={String(profile.id)}
                profileName={profile.name}
                isOwnProfile={isOwnProfile}
                isDemo={isDemo}
              />

              {/* Photo Gallery */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Fotos
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.images.map((photo: string, index: number) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden rounded-lg"
                      >
                        <img
                          src={photo}
                          alt={`${profile.name} - Foto ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Sidebar */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        logger.info("Me gusta", { profileName: profile.name });
                        toast({
                          title: "Like enviado",
                          description: `¡Has dado like a ${profile.name}!`,
                        });
                      }}
                      className="w-full bg-linear-to-r from-fuchsia-500 to-red-500 hover:from-fuchsia-600 hover:to-red-600 text-white px-6 py-3 text-lg"
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      Me gusta
                    </Button>

                    <Button
                      onClick={() => {
                        logger.info("Enviando mensaje a", {
                          profileName: profile.name,
                        });
                        navigate(`/chat/${profile.id}`, { state: { profile } });
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Enviar mensaje
                    </Button>

                    {/* Amistad y acceso a fotos (punto 4): solicitud de
                        amistad y solicitud para ver la galería. El botón
                        "Reportar perfil" de abajo sigue abriendo el
                        diálogo; ReportBlockButtons solo aporta Bloquear. */}
                    <FriendRequestButton
                      profileId={String(profile.id)}
                      profileName={profile.name}
                      viewerId={viewerId}
                      viewerName={viewerName}
                      isOwnProfile={isOwnProfile}
                      isDemo={isDemo}
                    />
                    <PhotoAccessRequestButton
                      profileId={String(profile.id)}
                      profileName={profile.name}
                      viewerId={viewerId}
                      isOwnProfile={isOwnProfile}
                      isDemo={isDemo}
                    />
                    <ReportBlockButtons
                      profileId={String(profile.id)}
                      profileName={profile.name}
                      viewerId={viewerId}
                      isOwnProfile={isOwnProfile}
                      isDemo={isDemo}
                      onReport={() => setShowReportDialog(true)}
                      showReport={false}
                    />

                    <Button
                      onClick={() => {
                        logger.info("Reportando perfil de", {
                          profileName: profile.name,
                        });
                        setShowReportDialog(true);
                      }}
                      className="w-full border border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-6 py-3 text-lg transition-all duration-300"
                    >
                      Reportar perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4">
                    Información rápida
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Edad:</span>
                      <span className="text-white">
                        {(profile as { ageLabel?: string }).ageLabel ??
                          `${profile.age} años`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Ubicación:</span>
                      <span className="text-white">{profile.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Profesión:</span>
                      <span className="text-white">{profile.profession}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Valoración:</span>
                      <span className="text-white flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {profile.rating}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Estado:</span>
                      <span
                        className={`text-sm ${profile.isOnline ? "text-green-600" : "text-white"}`}
                      >
                        {profile.isOnline ? "En línea" : "Desconectado"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compatibility */}
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4">
                    Compatibilidad
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/80">Intereses comunes</span>
                        <span className="text-white">85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-[85%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/80">Proximidad</span>
                        <span className="text-white">92%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-[92%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/80">Estilo de vida</span>
                        <span className="text-white">78%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-[78%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-primary font-medium text-center">
                      ¡Gran compatibilidad! 🎉
                    </p>
                    <p className="text-xs text-white/80 text-center mt-1">
                      Tienes muchas cosas en común
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
        <ReportDialog
          isOpen={showReportDialog}
          onOpenChange={setShowReportDialog}
          profileId={String(profile.id)}
          profileName={profile.name}
          onReport={(reason) => {
            logger.info("Reporte enviado desde detalle de perfil", { reason });
            toast({
              title: "Perfil reportado",
              description:
                "Gracias por ayudarnos a mantener la comunidad segura.",
            });
          }}
        />
      </div>
    </div>
  );
};

export default ProfileDetail;
