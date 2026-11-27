import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { Heart, MapPin, Verified, Star, X, Zap } from "lucide-react";
import { logger } from "@/lib/logger";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useProfileTheme, Gender } from "@/features/profile/useProfileTheme";
import { cn } from "@/shared/lib/cn";

// Perfil single para la tarjeta de descubrimiento (espejo de la interfaz
// local de CoupleProfileCard, sin los campos del segundo miembro).
interface SingleProfileWithDetails {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  location?: string;
  bio?: string | null;
  images?: string[] | null;
  avatar_url?: string | null;
  interests?: string[];
  rating?: number;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
}

interface SingleProfileCardProps {
  profile: SingleProfileWithDetails;
  onLike?: (id: string) => void;
  onOpenModal: () => void;
  // Nueva prop para habilitar temas visuales sincronizada con MainProfileCard
  useThemeBackground?: boolean;
  onSuperLike?: (id: string) => void;
  onDislike?: (id: string) => void;
}

const SingleProfileCard = ({
  profile,
  onLike,
  onOpenModal,
  useThemeBackground = false,
}: SingleProfileCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);

  // Configurar género para el hook de tema - sincronizado con MainProfileCard
  const gender = profile.gender as Gender;
  const genders: Gender[] = [gender];

  // Obtener configuración de tema usando el hook unificado
  const themeConfig = useProfileTheme("single", genders);

  // Use profile image if available, otherwise use placeholder
  const avatar =
    profile.images?.[0] ||
    profile.avatar_url ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face";

  // Handlers sincronizados con MainProfileCard
  const handleViewProfile = () => {
    navigate(`/profile/${profile.id}`);
  };

  const handleLike = (_e: React.MouseEvent<HTMLButtonElement>) => {
    _e.stopPropagation();
    onOpenModal();
  };

  const handleSuperLike = (_e: React.MouseEvent<HTMLButtonElement>) => {
    _e.stopPropagation();
    onOpenModal();
  };

  const handleDislike = (_e: React.MouseEvent<HTMLButtonElement>) => {
    _e.stopPropagation();
    onOpenModal();
    toast({
      title: "Perfil omitido",
      description: `Has pasado el perfil de ${profile.name}`,
    });
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-500 transform hover:scale-105 cursor-pointer",
        useThemeBackground
          ? `${themeConfig.backgroundClass} ${themeConfig.textClass}`
          : "bg-card-gradient",
      )}
      onClick={handleViewProfile}
    >
      <div className="relative">
        {/* Profile Image - Sincronizado con MainProfileCard aspect ratio */}
        <div className="aspect-3/4 overflow-hidden">
          <div className="relative overflow-hidden w-full h-full">
            {!imageError && avatar ? (
              <img
                src={avatar}
                alt={profile.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                onLoad={() =>
                  logger.info("Profile image loaded successfully:", {
                    image: avatar,
                  })
                }
              />
            ) : (
              <div
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  useThemeBackground
                    ? themeConfig.backgroundClass
                    : "bg-linear-to-br from-purple-400 to-pink-400",
                )}
              >
                <div
                  className={cn(
                    "text-center",
                    useThemeBackground ? themeConfig.textClass : "text-white",
                  )}
                >
                  <div className="text-6xl mb-2">👤</div>
                  <p className="text-sm opacity-80">Cargando imagen...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Online Status - Sincronizado con MainProfileCard */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center space-x-1 sm:space-x-2 bg-black/60 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] sm:text-xs font-medium text-white">
            En línea
          </span>
        </div>

        {/* Rating - Sincronizado con MainProfileCard */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center space-x-1 bg-black/60 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1">
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-current" />
          <span className="text-[10px] sm:text-xs font-medium text-white">
            {profile.rating || 4.9}
          </span>
        </div>

        {/* Verification Badge */}
        {profile.is_verified && (
          <div className="absolute bottom-12 sm:bottom-16 left-2 sm:left-4 bg-blue-500 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <Verified className="h-2.5 w-2.5 sm:h-3 sm:h-3" />
            <span className="hidden sm:inline">Verificado</span>
            <span className="sm:hidden sr-only">Verificado</span>
          </div>
        )}

        {/* Gradient Overlay - Sincronizado con MainProfileCard */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        {/* Quick Actions - Sincronizado con MainProfileCard */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-center items-end opacity-100 pointer-events-auto sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto transition-opacity duration-300">
          <div className="flex space-x-1 sm:space-x-2">
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none"
              onClick={handleDislike}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none"
              onClick={handleSuperLike}
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none"
              onClick={handleLike}
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>

      {/* Card Footer - Estructura similar a MainProfileCard */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3
            className={cn(
              "text-base sm:text-lg font-semibold group-hover:text-primary transition-colors truncate",
              useThemeBackground ? themeConfig.textClass : "text-white",
            )}
          >
            {profile.name}, {profile.age}
          </h3>
          <div
            className={cn(
              "flex items-center space-x-1",
              useThemeBackground ? themeConfig.accentClass : "text-white",
            )}
          >
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-xs sm:text-sm truncate">
              {profile.location}
            </span>
          </div>
        </div>

        {/* Interests - Sincronizado con MainProfileCard */}
        <div className="flex flex-wrap items-start gap-1.5 sm:gap-2 mb-4">
          {profile.interests
            ?.slice(0, 3)
            .map((interest: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 text-[10px] sm:text-xs rounded-full transition-colors hover:bg-purple-200 font-medium leading-snug max-w-full whitespace-normal break-words"
              >
                {interest}
              </span>
            ))}
          {profile.interests && profile.interests.length > 3 && (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-white/20 text-white text-[10px] sm:text-xs rounded-full leading-snug">
              +{profile.interests.length - 3}
            </span>
          )}
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 gap-2 mb-4">
          <div className="text-center p-2 bg-purple-100 text-purple-700 rounded-lg">
            <p className="font-semibold text-xs">{profile.name}</p>
            <p className="text-[10px] opacity-80">{profile.age} años</p>
          </div>
        </div>

        {/* Action Buttons - Alineados y centrados */}
        <div className="flex justify-center items-center space-x-2 px-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 max-w-[120px] bg-linear-to-r from-pink-500 to-purple-600 border-2 border-pink-400 text-white hover:from-pink-600 hover:to-purple-700 hover:border-pink-500 font-semibold transition-all duration-300 min-h-[40px] flex items-center justify-center"
            onClick={handleDislike}
          >
            <X
              className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0"
              strokeWidth={2.5}
            />
            <span className="hidden sm:inline text-xs">Pasar</span>
            <span className="sm:hidden text-xs sr-only">Pasar</span>
          </Button>
          <Button
            variant="love"
            size="sm"
            className="flex-1 max-w-[120px] min-h-[40px] flex items-center justify-center"
            onClick={handleLike}
            disabled={!onLike}
          >
            <Heart
              className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 shrink-0"
              strokeWidth={2.5}
            />
            <span className="hidden sm:inline text-xs">Me Gusta</span>
            <span className="sm:hidden text-xs sr-only">Me Gusta</span>
          </Button>
        </div>

        {/* View Profile Button - Sincronizado con MainProfileCard */}
        <button
          onClick={(_e) => {
            _e.stopPropagation();
            handleViewProfile();
          }}
          className="w-full mt-2 text-white bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 text-xs sm:text-sm py-2 rounded-md font-medium border border-purple-500 hover:border-purple-600 shadow-md hover:shadow-lg"
        >
          Ver Perfil Completo
        </button>
      </div>
    </div>
  );
};

export default SingleProfileCard;
