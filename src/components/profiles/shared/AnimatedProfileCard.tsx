import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Crown, EyeOff, MapPin, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons/Button";
import { cn } from "@/shared/lib/cn";
import { ANONYMOUS_LIKE_BLOCKED_MESSAGE } from "@/lib/anonymous";
import {
  isTouchDevice,
  getAnimationConfig,
  addTouchSupport,
} from "@/utils/mobile";

interface ProfileCardProps {
  id: number;
  profileId?: string;
  name: string;
  age: number;
  // Edad del segundo miembro (parejas): se muestra "25 y 28 años".
  partnerAge?: number | undefined;
  location: string;
  image: string;
  images?: string[];
  bio?: string;
  interests?: string[];
  isOnline?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  /**
   * Ronda 9 (stream A, punto 3): perfil anónimo: insignia "Anónimo"
   * junto a la de verificado. Solo lo ven espectadores verificados
   * (el filtro vive en shouldShowInDiscover).
   * Ronda 10 (stream A, punto A2): el anónimo NO es verificado: la
   * insignia "✓ Verificado" se suprime cuando `isAnonymous` es true
   * (antes salían las dos a la vez).
   */
  isAnonymous?: boolean;
  isPrivate?: boolean;
  lastSeen?: string;
  onLike?: (id: number | string) => void;
  /**
   * Ronda 21 (stream B, FAIL 10): like CONTROLADO por el padre
   * (`likedProfileIds` en Discover). Antes la tarjeta guardaba su
   * propio `isLiked` local: el corazón se llenaba aunque el padre
   * no se enterara (contador en 12) y al recargar se apagaba. Con
   * la prop, UI y contador no pueden divergir: el corazón solo está
   * rojo si el padre registró el like (y lo persistió). Sin la prop
   * (otros llamadores), la tarjeta sigue con su estado local.
   */
  liked?: boolean | undefined;
  /**
   * Ronda 10 (stream A, punto A8): el espectador es una cuenta
   * anónima. Su like está bloqueado: el botón no alterna a
   * "Te Gusta" y avisa con `onAnonymousLikeBlocked` (mensaje claro,
   * sin toast de error). Sin esto, la tarjeta alternaba optimista y
   * el error llegaba después desde el padre.
   */
  isViewerAnonymous?: boolean;
  onAnonymousLikeBlocked?: () => void;
  onMessage?: (id: number | string) => void;
  onViewProfile?: (id: number | string) => void;
  className?: string;
  canMessage?: boolean;
}

export const AnimatedProfileCard = React.memo<ProfileCardProps>(
  function AnimatedProfileCard({
    id,
    profileId,
    name,
    age,
    partnerAge,
    location,
    image,
    images = [],
    bio,
    interests = [],
    isOnline = false,
    isPremium = false,
    isVerified = false,
    isAnonymous = false,
    isPrivate = false,
    lastSeen,
    onLike,
    liked,
    isViewerAnonymous = false,
    onAnonymousLikeBlocked,
    onMessage,
    onViewProfile,
    className = "",
    canMessage = true,
  }) {
    const [isHovered, setIsHovered] = React.useState(false);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    // Ronda 21 (stream B, FAIL 10): si el padre pasa `liked`, esa
    // prop MANDA (única fuente de verdad); el estado local solo
    // existe para llamadores sin prop. El toggle local nunca se
    // ejecuta en modo controlado: si no, el corazón se llenaría
    // antes de que el padre confirmara el like.
    const [isLikedLocal, setIsLikedLocal] = React.useState(false);
    const isLiked = liked ?? isLikedLocal;
    const [showViews, setShowViews] = React.useState(false);
    // Si la foto (Unsplash) no carga, no dejar el degradado borroso: mostrar
    // un avatar con la inicial. Se resetea al cambiar de foto/perfil.
    const [imageError, setImageError] = React.useState(false);
    React.useEffect(() => {
      setImageError(false);
    }, [currentImageIndex, image]);
    const viewCount = React.useMemo(() => ((id * 97) % 500) + 50, [id]);

    const allImages = [image, ...images];

    const animationConfig = getAnimationConfig();
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (cardRef.current && isTouchDevice()) {
        addTouchSupport(cardRef.current);
      }
    }, []);

    const handleLike = React.useCallback(() => {
      // Ronda 10 (stream A, punto A8): el like anónimo se bloquea
      // ANTES de alternar el estado: si no, el botón queda en
      // "Te Gusta" aunque el like no se registró.
      if (isViewerAnonymous) {
        onAnonymousLikeBlocked?.();
        return;
      }
      // Ronda 21 (stream B, FAIL 10): en modo controlado (`liked`
      // como prop) NO alternar estado local: el padre es quien
      // alterna y re-renderiza con la prop nueva. El gate anónimo
      // de arriba sigue bloqueando antes de alternar, igual que el
      // gate del padre en `handleLike` de Discover (ronda 10, A8).
      if (liked === undefined) {
        setIsLikedLocal(!isLikedLocal);
      }
      onLike?.(profileId ?? id);
    }, [
      isLikedLocal,
      liked,
      onLike,
      id,
      profileId,
      isViewerAnonymous,
      onAnonymousLikeBlocked,
    ]);

    const nextImage = React.useCallback(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, [allImages.length]);

    const prevImage = React.useCallback(() => {
      setCurrentImageIndex(
        (prev) => (prev - 1 + allImages.length) % allImages.length,
      );
    }, [allImages.length]);

    return (
      <motion.div
        ref={cardRef}
        className={cn("relative group", className)}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={
          animationConfig.enabled ? { y: -4, scale: animationConfig.scale } : {}
        }
        transition={{
          type: "spring",
          stiffness: animationConfig.stiffness,
          damping: animationConfig.damping,
          duration: animationConfig.duration,
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Card className="overflow-hidden bg-white dark:bg-white/5 backdrop-blur-md border-slate-200 dark:border-white/20 shadow-xl">
          {/* Image Container: clicar la foto abre el perfil */}
          <div
            className="relative aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] overflow-hidden cursor-pointer"
            onClick={() => onViewProfile?.(profileId ?? id)}
            role="button"
            aria-label={`Ver perfil de ${name}`}
            title={`Ver perfil de ${name}`}
          >
            <AnimatePresence mode="wait">
              {imageError ? (
                <motion.div
                  key={`fallback-${currentImageIndex}`}
                  className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500 to-fuchsia-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-6xl font-bold text-white/90">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </motion.div>
              ) : (
                <motion.img
                  key={currentImageIndex}
                  src={allImages[currentImageIndex]}
                  alt={`${name} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onError={() => setImageError(true)}
                />
              )}
            </AnimatePresence>

            {/* Online Status */}
            {isOnline && (
              <motion.div
                className="absolute top-2 left-2 sm:top-3 sm:left-3 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Premium Badge */}
            {isPremium && (
              <motion.div
                className="absolute top-2 right-2 sm:top-3 sm:right-3"
                whileHover={animationConfig.enabled ? { scale: 1.1 } : {}}
                whileTap={animationConfig.enabled ? { scale: 0.95 } : {}}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-linear-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs sm:text-sm">
                  <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">Premium</span>
                  <span className="sm:hidden">P</span>
                </Badge>
              </motion.div>
            )}

            {/* Privacy Indicator */}
            {isPrivate && (
              <motion.div
                className="absolute top-10 right-2 sm:top-12 sm:right-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-0.5 sm:p-1">
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </motion.div>
            )}

            {/* Image Navigation */}
            {allImages.length > 1 && isHovered && (
              <motion.div
                className="absolute inset-0 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="flex-1 bg-linear-to-r from-black/20 to-transparent hover:from-black/40 transition-all duration-300"
                  aria-label="Imagen anterior"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="flex-1 bg-gradient-to-l from-black/20 to-transparent hover:from-black/40 transition-all duration-300"
                  aria-label="Siguiente imagen"
                />
              </motion.div>
            )}

            {/* Image Dots */}
            {allImages.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 flex gap-0.5 sm:gap-1">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={cn(
                      "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 touch-manipulation",
                      index === currentImageIndex
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/80 active:bg-white/90",
                    )}
                    aria-label={`Ver imagen ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Hover Overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
          </div>

          <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {/* Name and Age */}
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <motion.h3
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:underline"
                  layoutId={`name-${id}`}
                  onClick={() => onViewProfile?.(profileId ?? id)}
                  title={`Ver perfil de ${name}`}
                >
                  {name}, {age}
                  {partnerAge ? ` y ${partnerAge}` : ""}
                </motion.h3>
                {/* Insignia de perfil verificado (nunca en un anónimo:
                    el anónimo no pasó World ID / KYC; ver A2). */}
                {isVerified && !isAnonymous && (
                  <Badge
                    className="shrink-0 bg-blue-500 text-white border-0 text-[10px] sm:text-xs"
                    title="Perfil verificado"
                  >
                    ✓ Verificado
                  </Badge>
                )}
                {/* Ronda 9 (stream A, punto 3): insignia de anónimo */}
                {isAnonymous && (
                  <Badge
                    className="shrink-0 bg-slate-600 text-white border-0 text-[10px] sm:text-xs"
                    title="Perfil anónimo: solo visible para cuentas verificadas"
                  >
                    Anónimo
                  </Badge>
                )}
              </div>
              {!isOnline && lastSeen && (
                <span className="text-xs text-slate-500 dark:text-white/60 hidden sm:inline">
                  {lastSeen}
                </span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-slate-600 dark:text-white/80">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm truncate">{location}</span>
            </div>

            {/* Bio */}
            {bio && (
              <motion.p
                className="text-xs sm:text-sm text-slate-600 dark:text-white/90 line-clamp-2 sm:line-clamp-3"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {bio}
              </motion.p>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <motion.div
                className="flex flex-wrap items-start gap-1.5 sm:gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {interests.slice(0, 3).map((interest, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="inline-flex items-center text-xs bg-slate-900/5 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-white dark:border-white/20 px-2 py-1 leading-snug max-w-full whitespace-normal break-words"
                  >
                    {interest}
                  </Badge>
                ))}
                {interests.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="inline-flex items-center text-xs bg-slate-900/5 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-white dark:border-white/20 px-2 py-1 leading-snug"
                  >
                    +{interests.length - 3}
                  </Badge>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                title={
                  isViewerAnonymous
                    ? ANONYMOUS_LIKE_BLOCKED_MESSAGE
                    : "Me gusta"
                }
                className={`flex-1 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation ${
                  isLiked
                    ? "bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-500/50 dark:bg-red-500/30 dark:text-red-400 dark:hover:bg-red-500/40"
                    : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10 active:bg-slate-900/15 border border-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/30 dark:border-white/20"
                }`}
              >
                <motion.div
                  animate={isLiked ? { scale: [1, 1.4, 1] } : {}}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                >
                  <Heart
                    className={`w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 transition-colors duration-300 ${isLiked ? "fill-current text-red-500" : ""}`}
                  />
                </motion.div>
                <span className="hidden sm:inline font-medium">
                  {isLiked ? "Te Gusta" : "Me Gusta"}
                </span>
                <span className="sm:hidden sr-only">
                  {isLiked ? "Te Gusta" : "Me Gusta"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isPrivate && !canMessage) {
                    // Perfil privado: mostrar mensaje de acceso requerido
                    alert(
                      "Este perfil es privado. Debes solicitar acceso para chatear.",
                    );
                    return;
                  }
                  onMessage?.(profileId ?? id);
                }}
                disabled={isPrivate && !canMessage}
                className={cn(
                  "flex-1 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation",
                  canMessage && !isPrivate
                    ? "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10 active:bg-slate-900/15 border border-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/30 dark:border-white/20"
                    : isPrivate && !canMessage
                      ? "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border border-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-300 dark:hover:bg-yellow-500/30"
                      : "bg-slate-900/5 text-slate-400 cursor-not-allowed dark:bg-white/5 dark:text-white/50",
                )}
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline font-medium">
                  {isPrivate && !canMessage ? "Solicitar Acceso" : "Chat"}
                </span>
                <span className="sm:hidden sr-only">
                  {isPrivate && !canMessage ? "Solicitar Acceso" : "Chat"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isPrivate && !canMessage) {
                    // Perfil privado: mostrar mensaje de acceso requerido
                    alert(
                      "Este perfil es privado. Debes solicitar acceso para ver el perfil completo.",
                    );
                    return;
                  }
                  setShowViews(!showViews);
                  // El id que se pasa es el id REAL del perfil (profileId),
                  // no el numérico derivado: ese nunca igualaba a ningún perfil.
                  onViewProfile?.(profileId ?? id);
                }}
                className={cn(
                  "relative transition-all duration-300 px-2 sm:px-3 py-1.5 sm:py-2 touch-manipulation group",
                  isPrivate && !canMessage
                    ? "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border border-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-300 dark:hover:bg-yellow-500/30"
                    : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10 active:bg-slate-900/15 border border-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/30 dark:border-white/20",
                )}
                title={`${isPrivate && !canMessage ? "Perfil privado - Solicitar acceso" : `${viewCount} visualizaciones`}`}
              >
                {isPrivate && !canMessage ? (
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Eye
                    className={cn(
                      "w-3 h-3 sm:w-4 sm:h-4 transition-all",
                      showViews && "text-blue-400 scale-110",
                    )}
                  />
                )}
                {showViews && !isPrivate && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 border border-white/20"
                  >
                    👁️ {viewCount} vistas
                  </motion.span>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* Floating Action on Hover - Hidden on mobile */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute -top-2 -right-2 z-10 hidden sm:block"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                size="sm"
                onClick={handleLike}
                className={`rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 shadow-lg touch-manipulation ${
                  isLiked
                    ? "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white"
                    : "bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-800"
                }`}
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? "fill-current" : ""}`}
                />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

export default AnimatedProfileCard;
