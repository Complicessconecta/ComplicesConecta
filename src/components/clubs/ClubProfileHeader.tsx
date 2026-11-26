import { useEffect, useState } from "react";
import { Building, MapPin, Phone, Globe, Clock, Star, CheckCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/cards/Card";
import { ExpandableClubDescription } from "@/components/clubs/ExpandableClubDescription";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover/popover";
import type { Club } from "@/entities/club";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  countUserReviews,
  USER_REVIEWS_CHANGED_EVENT,
} from "@/components/clubs/ClubProfileReviews";

interface ClubProfileHeaderProps {
  club: Club;
  isOwner?: boolean;
  onEdit?: () => void;
}

export const ClubProfileHeader: React.FC<ClubProfileHeaderProps> = ({
  club,
  isOwner = false,
  onEdit,
}) => {
  const isPremium = club.membership_tier === "premium";
  const isDemoClub = club.id === "demo";

  // Ronda 15 (stream C): conteo VIVO de reseñas. El `rating_count` del
  // club es la semilla estática (128 en Eden Noir) y la sección de
  // reseñas suma las que escribe el usuario (129 tras publicar una):
  // el encabezado mostraba 128 mientras la sección decía 129 (test
  // PR #74). Se lee el mismo almacén que `ClubProfileReviews` y se
  // actualiza con su evento al publicar.
  const clubId = String(club.id);
  const [userReviewCount, setUserReviewCount] = useState(() =>
    countUserReviews(clubId),
  );
  useEffect(() => {
    setUserReviewCount(countUserReviews(clubId));
    const onUserReviewsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ clubId?: string }>).detail;
      if (!detail?.clubId || detail.clubId === clubId) {
        setUserReviewCount(countUserReviews(clubId));
      }
    };
    window.addEventListener(USER_REVIEWS_CHANGED_EVENT, onUserReviewsChanged);
    return () =>
      window.removeEventListener(
        USER_REVIEWS_CHANGED_EVENT,
        onUserReviewsChanged,
      );
  }, [clubId]);
  const liveReviewCount = club.rating_count + userReviewCount;

  return (
    <Card
      className={
        // Ronda 15 (stream C): el gradiente translúcido (`/40`) con
        // texto blanco era blanco sobre claro en tema claro (misma
        // clase de bug que la wallet demo). Opaco en ambos temas.
        isPremium
          ? "bg-purple-950 dark:bg-card bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border border-yellow-400/40 shadow-2xl shadow-yellow-500/20 overflow-hidden"
          : "bg-purple-950 dark:bg-card bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden"
      }
    >
      {/* Cover Image */}
      <div className="relative h-64 bg-linear-to-br from-purple-600 to-fuchsia-600 overflow-hidden">
        {club.cover_image_url ? (
          <SafeImage
            src={club.cover_image_url}
            alt={club.name}
            fallbackType="cover"
            className="w-full h-full"
          />
        ) : (
          <>
            {/* Imagen de banner animada */}
            <div className="absolute inset-0 bg-cover bg-center animate-pulse" style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-purple-900/60" />
            <div className="w-full h-full flex items-center justify-center relative z-10">
              <Building className="h-24 w-24 text-white/40 animate-bounce" />
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
          {/* Ronda 15, stream B: la insignia "Admin" marca la vista de
              creador, no el club demo en sí. Antes se pintaba siempre
              que `club.id === "demo"`, también en la vista pública, y
              el visitante veía "Admin" sin sesión ni admin. Solo se
              muestra con `isOwner` (la rama admin de ClubsDemo). */}
          {isDemoClub && isOwner && (
            <Badge className="bg-purple-500/90 text-white border border-purple-300/40">
              Admin
            </Badge>
          )}
          {isPremium && (
            <Badge className="bg-linear-to-r from-yellow-400 to-amber-500 text-black border border-yellow-300/60">
              ✅ Premium
            </Badge>
          )}
          {club.is_active && (
            <Badge className="bg-green-500/90 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          )}
          {club.is_featured && (
            <Badge className="bg-yellow-500/90 text-black">
              <Award className="h-3 w-3 mr-1" />
              Destacado
            </Badge>
          )}
          {club.verified_at && (
            <Badge className="bg-blue-500/90 text-white">
              <Star className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          )}
        </div>

        {/* Edit Button (Owner Only) */}
        {isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Editar Perfil
          </button>
        )}
      </div>

      {/* Club Info */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Logo */}
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-xl bg-linear-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl">
              {club.logo_url ? (
                <SafeImage
                  src={club.logo_url}
                  alt={club.name}
                  fallbackType="default"
                  className="w-full h-full"
                />
              ) : (
                <Building className="h-16 w-16 text-white/60" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-white">{club.name}</h1>
              {typeof club.live_status === "string" && club.live_status.trim().length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button">
                      <Badge
                        className={
                          club.live_status.includes("🔥")
                            ? "bg-red-500/20 text-red-200 border border-red-400/40 animate-pulse"
                            : "bg-white/10 text-white/90 border border-white/20"
                        }
                      >
                        Vibe: {club.live_status}
                      </Badge>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-black/80 border border-white/10 text-white">
                    Este club está reportando gran actividad ahora mismo. ¡Reserva tu lugar!
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-white font-semibold">
                  {club.rating_average.toFixed(1)}
                </span>
              </div>
              <span className="text-white/60">
                ({liveReviewCount} reseñas)
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">
                {club.check_in_count} check-ins
              </span>
            </div>

            {/* Description: ronda 12 (stream B, 1a) — antes era
                `line-clamp-2` sin vía para leerla completa (la intro de
                Eden Noir se cortaba en "…iluminació…"). Ahora se
                expande/contrae con "Ver más" / "Ver menos". La tarjeta
                es púrpura oscura en ambos temas, así que el botón usa
                el morado claro en los dos. */}
            {club.description && (
              <ExpandableClubDescription
                text={club.description}
                className="mb-4"
                textClassName="text-white/80"
                buttonClassName="text-purple-300 hover:text-purple-200"
              />
            )}

            {/* Location & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4 text-purple-400" />
                <span>
                  {club.address}, {club.city}
                  {club.state && `, ${club.state}`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Phone className="h-4 w-4 text-purple-400" />
                <span>Teléfono disponible</span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Horarios disponibles</span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Globe className="h-4 w-4 text-purple-400" />
                <span>Website disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
