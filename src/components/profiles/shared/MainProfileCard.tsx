import React, { useState, memo, useMemo, useCallback, useEffect } from "react";
import { Heart, MapPin, Verified, Star, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { useProfileTheme, Gender, ProfileType, Theme } from "@/features/profile/useProfileTheme";
import { inferProfileKind } from "@/lib/media";
import { cn } from "@/shared/lib/cn";
import { validateProfileCard } from "@/lib/zod-schemas";

interface ProfileCardProps {
  profile: {
    id: string | number;
    name: string;
    age?: number;
    location?: string;
    image?: string;
    interests?: string[];
    bio?: string;
    isOnline?: boolean;
    lastSeen?: string;
    verified?: boolean;
    rating?: number;
    // Propiedades para personalización visual
    gender?: Gender;
    partnerGender?: Gender;
    accountType?: ProfileType;
    theme?: Theme;
    // Propiedades específicas para parejas
    couple_name?: string;
    partner1_first_name?: string;
    partner1_age?: number;
    partner2_first_name?: string;
    partner2_age?: number;
  };
  onLike?: (id: string) => void;
  onSuperLike?: (profile: ProfileCardProps["profile"]) => void;
  onOpenModal?: () => void;
  // Props de configuración
  useThemeBackground?: boolean;
  variant?: "single" | "couple" | "discover" | "animated";
  showQuickActions?: boolean;
  showViewProfile?: boolean;
}

const MainProfileCardComponent = ({
  profile,
  onLike,
  onSuperLike,
  onOpenModal,
  useThemeBackground = false,
  variant = "single",
  showQuickActions = true,
  showViewProfile = true,
}: ProfileCardProps) => {
  // Validar props con Zod
  try {
    validateProfileCard(profile);
  } catch (__error) {
    logger.error("❌ Error validando ProfileCard:", { error: __error });
  }
  const isOnline = profile.isOnline ?? false;
  const {
    id,
    name,
    age,
    location,
    interests,
    image,
    rating,
    gender = "male",
    partnerGender,
    accountType = "single",
    theme,
  } = profile;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [_imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState(image);

  const resolvedGender: Gender = useMemo(() => {
    if (profile.gender) return profile.gender;
    const inferred = inferProfileKind({ name, type: accountType }).gender;
    if (inferred === "male" || inferred === "female") return inferred;
    return gender;
  }, [profile.gender, name, accountType, gender]);

  useEffect(() => {
    setCurrentImageSrc(image);
    setImageError(false);
  }, [image]);

  // Configurar géneros para el hook de tema - memoizado
  const genders: Gender[] = useMemo(
    () =>
      accountType === "couple" && partnerGender
        ? [resolvedGender, partnerGender]
        : [resolvedGender],
    [accountType, resolvedGender, partnerGender],
  );

  // Obtener configuración de tema
  const themeConfig = useProfileTheme(accountType, genders, theme);

  const handleViewProfile = useCallback(() => {
    navigate(`/profile/${id}`);
  }, [navigate, id]);

  const handleLike = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onLike) onLike(String(id));
      if (onOpenModal) onOpenModal();
    },
    [onLike, onOpenModal, id],
  );

  const handleSuperLike = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onSuperLike) onSuperLike(profile);
      if (onOpenModal) onOpenModal();
    },
    [onSuperLike, onOpenModal, profile],
  );

  const handleDislike = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onOpenModal) onOpenModal();
      toast({
        title: "Perfil omitido",
        description: `Has pasado el perfil de ${variant === "couple" ? profile.couple_name || name : name}`,
      });
    },
    [onOpenModal, variant, profile.couple_name, name, toast],
  );

  return (
    <div
      className={cn(
        "group relative rounded-3xl shadow-card hover:shadow-hover transition-all duration-500 transform hover:scale-105 cursor-pointer border border-white/20 backdrop-blur-sm bg-black/10",
        useThemeBackground
          ? `${themeConfig.backgroundClass} ${themeConfig.textClass}`
          : "bg-card-gradient",
      )}
      onClick={showViewProfile ? handleViewProfile : undefined}
    >
      {/* Image Container */}
      <div className="relative aspect-3/4 overflow-hidden">
        {!_imageError &&
        currentImageSrc &&
        currentImageSrc.startsWith("http") ? (
          <img
            src={currentImageSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            crossOrigin="anonymous"
            onError={(e) => {
              // Silenciar errores de CORS/OpaqueResponseBlocking
              const target = e.target as HTMLImageElement;
              const error = e.nativeEvent as any;

              // Verificar si es un error de CORS/OpaqueResponseBlocking
              const isCorsError =
                error?.message?.includes("OpaqueResponseBlocking") ||
                error?.message?.includes("CORS") ||
                target.src.includes("unsplash.com");

              if (!isCorsError) {
                logger.warn("Image failed to load, trying fallback:", {
                  image: currentImageSrc,
                });
              }

              // Intentar con imagen de respaldo
              const fallbackImages =
                resolvedGender === "female"
                  ? [
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=700&fit=crop&crop=face&q=80&auto=format",
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=700&fit=crop&crop=face&q=80&auto=format",
                      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=700&fit=crop&crop=face&q=80&auto=format",
                    ]
                  : [
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=700&fit=crop&crop=face&q=80&auto=format",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=700&fit=crop&crop=face&q=80&auto=format",
                      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&h=700&fit=crop&crop=face&q=80&auto=format",
                    ];

              const currentIndex = fallbackImages.indexOf(currentImageSrc);
              const nextIndex = (currentIndex + 1) % fallbackImages.length;

              if (currentIndex === -1 || nextIndex === 0) {
                // Si no es una imagen de respaldo o ya probamos todías, usar fallback visual
                setImageError(true);
              } else {
                // Intentar con la siguiente imagen de respaldo
                setCurrentImageSrc(fallbackImages[nextIndex]);
              }
            }}
            onLoad={() =>
              logger.info("Image loaded successfully:", {
                image: currentImageSrc,
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
              {/* Silueta 3D profesional como en la imagen */}
              <div className="w-24 h-24 mx-auto mb-3 bg-linear-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-16 h-16 bg-linear-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm opacity-80">Imagen actualizada</p>
            </div>
          </div>
        )}

        {/* Online Status */}
        {isOnline && (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center space-x-1 sm:space-x-2 bg-white/20 backdrop-blur-md rounded-full px-2 sm:px-3 py-1 border border-white/30">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-sm" />
            <span className="text-[10px] sm:text-xs font-semibold text-white">
              En línea
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center space-x-1 bg-white/20 backdrop-blur-md rounded-full px-2 sm:px-3 py-1 border border-white/30">
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 fill-current" />
          <span className="text-[10px] sm:text-xs font-semibold text-white">
            {rating || 4.9}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-center items-end opacity-100 pointer-events-auto sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto transition-all duration-300 transform translate-y-0">
            <div className="flex space-x-2 sm:space-x-3">
              <Button
                size="icon"
                variant="glass"
                className="w-10 h-10 sm:w-12 sm:h-12 hover:scale-110 transition-all duration-300"
                onClick={handleDislike}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </Button>
              <Button
                size="icon"
                variant="glass"
                className="w-10 h-10 sm:w-12 sm:h-12 hover:scale-110 transition-all duration-300"
                onClick={handleSuperLike}
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </Button>
              <Button
                size="icon"
                variant="glass"
                className="w-10 h-10 sm:w-12 sm:h-12 hover:scale-110 transition-all duration-300 animate-heart-beat"
                onClick={handleLike}
              >
                <Heart
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  strokeWidth={2.5}
                  fill="currentColor"
                />
              </Button>
            </div>
          </div>
        )}

        {/* Verification Badge - Corregido para coincidir con imagen */}
        {profile.verified && (
          <div className="absolute bottom-14 sm:bottom-16 left-3 sm:left-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 shadow-sm">
            <Verified className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Verificado</span>
            <span className="sm:hidden sr-only">Verificado</span>
          </div>
        )}
      </div>

      {/* Card Footer - Aumentado padding para evitar corte de botones */}
      <div className="p-6 sm:p-8 bg-black/5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={cn(
              "text-lg sm:text-xl font-heading font-bold group-hover:text-primary transition-colors truncate",
              useThemeBackground ? themeConfig.textClass : "text-white",
            )}
          >
            {name}, {age}
          </h3>
          <div
            className={cn(
              "flex items-center space-x-1",
              useThemeBackground ? themeConfig.accentClass : "text-white",
            )}
          >
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-xs sm:text-sm truncate font-medium">
              {location}
            </span>
          </div>
        </div>

        {/* Interests - Corregido para coincidir con imagen */}
        <div className="flex flex-wrap items-start gap-1.5 sm:gap-2 mb-6">
          {interests?.slice(0, 3).map((interest: string, index: number) => {
            const colors = [
              "bg-linear-to-r from-pink-500 to-pink-600 text-white border border-pink-400", // Rosa sólido
              "bg-linear-to-r from-orange-500 to-orange-600 text-white border border-orange-400", // Naranja sólido
              "bg-linear-to-r from-amber-500 to-yellow-500 text-white border border-amber-400", // Ámbar sólido
            ];
            return (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1.5 ${colors[index % colors.length]} text-[11px] sm:text-xs rounded-full font-medium leading-snug max-w-full whitespace-normal break-words`}
              >
                {interest}
              </span>
            );
          })}
          {interests && interests.length > 3 && (
            <span className="inline-flex items-center px-3 py-1.5 bg-white/20 text-white text-[11px] sm:text-xs rounded-full font-medium border border-white/30 leading-snug">
              +{interests.length - 3}
            </span>
          )}
        </div>

        {/* Action Buttons - Alineados y centrados con más espacio */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 px-2 mb-4">
          <Button
            variant="outline"
            size="action"
            className="flex-1 max-w-[220px] min-w-[110px] bg-linear-to-r from-gray-600 to-gray-700 border-2 border-gray-500 text-white hover:from-gray-700 hover:to-gray-800 hover:border-gray-600 font-semibold transition-all duration-300 min-h-[48px] flex items-center justify-center px-3 sm:px-4 hover:scale-105 shadow-lg"
            onClick={handleDislike}
          >
            <X
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0"
              strokeWidth={2.5}
            />
            <span className="hidden sm:inline text-sm whitespace-nowrap">Pasar</span>
            <span className="sm:hidden text-sm sr-only">Pasar</span>
          </Button>
          <Button
            variant="love"
            size="action"
            className="flex-1 max-w-[220px] min-w-[110px] font-bold min-h-[48px] flex items-center justify-center px-3 sm:px-4 hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all duration-300"
            onClick={handleLike}
            disabled={!onLike}
          >
            <Heart
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0 text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]"
              strokeWidth={2.5}
              fill="currentColor"
            />
            <span className="hidden sm:inline text-sm whitespace-nowrap">Me Gusta</span>
            <span className="sm:hidden text-sm sr-only">Me Gusta</span>
          </Button>
        </div>

        {/* View Profile Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile();
          }}
          className="w-full text-white bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all duration-300 text-sm py-3 rounded-xl font-semibold border border-pink-500 hover:border-pink-600 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Ver Perfil Completo
        </button>
      </div>
    </div>
  );
};

// Export con memo para optimización de performance
export const MainProfileCard = memo(MainProfileCardComponent);

// Export alias for backward compatibility
export { MainProfileCard as ProfileCard };

