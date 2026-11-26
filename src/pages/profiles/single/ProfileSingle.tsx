import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Share2,
  MapPin,
  Lock,
  Unlock,
  Users,
  Calendar,
  CheckCircle,
  Sparkles,
  Camera,
  Flag,
  Edit,
  Images,
  Eye,
  TrendingUp,
  Wallet,
  Coins,
  Zap,
  Gift,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ShareProfile } from "@/components/profiles/shared/ShareProfile";
import {
  SOFIA_CANONICAL_PHOTO,
  SOFIA_PUBLIC_PHOTOS,
  SOFIA_PUBLIC_PHOTOS_FULL,
} from "@/demo/demoData";
import { ProfileContent } from "@/components/profiles/ProfileContent";
import { useAuth } from "@/features/auth/useAuth";
import { useBiometricAuth } from "@/features/auth/useBiometricAuth";
import { logger } from "@/lib/logger";
import { computeProfileCompleteness } from "@/lib/profileCompleteness";
import {
  deriveOrientationLabel,
  formatGenderLabel,
  formatInterestedInLabel,
} from "@/lib/profileLabels";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/forms/Input";
import { PrivateImageRequest } from "@/components/profiles/shared/PrivateImageRequest";
import { PrivateImageRequestsManager } from "@/components/profiles/shared/PrivateImageRequestsManager";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportDialog } from "@/components/dialogs/ReportDialog";
import { ImageModal } from "@/components/profiles/shared/ImageModal";
import { ParentalControl } from "@/components/profiles/shared/ParentalControl";
import { useProfileScore } from "@/features/profile/useProfileScore";
import { motion } from "framer-motion";
import { walletService } from "@/services/payments/WalletService";
import {
  nftService,
  DEMO_NFTS_CHANGED_EVENT,
  countMintedDemoNFTs,
  DEMO_MINT_LIMIT,
} from "@/services/payments/NFTService";
import {
  getDemoWalletBalance,
  DEMO_WALLET_CHANGED_EVENT,
} from "@/lib/demo-wallet";
import { isAnonymousDemoProfile } from "@/lib/demo-registration";
import { getAnonymousExpiryInfo } from "@/lib/anonymous";
import { LiveCountdown } from "@/components/profiles/shared/PhotoAccessCountdown";
import { listAnonymousPhotoAccessGrantedBy } from "@/lib/friends";
import { useProfileTheme } from "@/features/profile/useProfileTheme";
import {
  PRIVATE_MEDIA_PLACEHOLDER,
  toPrivateStoragePath,
  usePrivateMediaUrls,
} from "@/lib/storage/private-media";
import { ComplianceSignupForm } from "@/components/modals/compliance-signup-form";
import { EventsCarousel } from "@/components/ui/carousel/events-carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel/carousel";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@/components/modals/animated-modal";
import { NFTMintButton } from "@/components/ui/buttons/NFTMintButton";
import { FileUpload } from "@/components/ui/forms/file-upload";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/shared/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DemoWallet } from "@/components/wallet/DemoWallet";
import { SingleAboutSection } from "@/components/profiles/single/SingleAboutSection";
import { SinglePreferencesSection } from "@/components/profiles/single/SinglePreferencesSection";
import { SingleLookingForSection } from "@/components/profiles/single/SingleLookingForSection";
import { SingleSubscriptionCard } from "@/components/profiles/single/SingleSubscriptionCard";
import { SinglePrivacySection } from "@/components/profiles/single/SinglePrivacySection";
import {
  ProtectedMedia,
  noDownloadProps,
} from "@/components/profiles/shared/ProtectedMedia";
import { formatZodiacSign } from "@/lib/zodiac";
import {
  getProfileZodiacSign,
  getVisibilityBadge,
  usePrivacySettings,
} from "@/lib/visibility";
// Alcance A (6 puntos sociales): nacionalidad, amistades, visibilidad,
// reportar/bloquear y solicitudes de amistad/fotos.
import { NationalityBadge } from "@/components/profiles/shared/NationalityBadge";
import { FriendsSection } from "@/components/profiles/shared/FriendsSection";
import { FriendRequestButton } from "@/components/profiles/shared/FriendRequestButton";
import { PhotoAccessRequestButton } from "@/components/profiles/shared/PhotoAccessRequestButton";
import { ReportBlockButtons } from "@/components/profiles/shared/ReportBlockButtons";
import { ProfileSocialSettings } from "@/components/profiles/shared/ProfileSocialSettings";
import { readCountryCodeLocal } from "@/lib/countries";
import { getSocialDemoData } from "@/demo/socialDemoData";

// --- Secciones modelo del video, espejo de pareja (1 usuario) ---
// Campos físicos que NO existen en el modelo de perfil: en demo se muestran
// estos valores de demostración, coherentes con Sofía (28, CDMX). NO son
// datos personales del video del usuario. Fuera de demo el campo vacío se
// oculta.
const DEMO_SINGLE_DETAILS = {
  height: "168 cm",
  weight: "60 kg",
  hair: "Castaño",
  eyes: "Café",
} as const;

// Títulos demo de intereses (respaldo cuando aún no se ha editado nada en
// el editor): la selección real del editor (demo_user) tiene prioridad;
// ver savedDemoInterests.
const DEMO_SINGLE_INTEREST_TITLES = [
  "Lifestyle Exclusivo",
  "Eventos VIP",
  "Privacidad Total",
  "Verificación Real",
  "Chat Encriptado",
  "Match Inteligente",
] as const;

// Orientación derivada (Heterosexual / Homosexual / Bisexual). Ronda 9
// (stream B): delega en `deriveOrientationLabel`, que acepta "men" /
// "women" además de "male" / "female" (el mapeo anterior no los conocía
// y devolvía null para el valor guardado en demo, "men").
const deriveSingleOrientation = (
  gender?: string | null,
  interestedIn?: string | null,
): string | null => deriveOrientationLabel(gender, interestedIn);

const splitLookingFor = (lookingFor: string | null): string[] =>
  (lookingFor ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const parseDislikes = (preferences: unknown): string[] => {
  if (!preferences || typeof preferences !== "object") return [];
  const dislikes = (preferences as { dislikes?: unknown }).dislikes;
  if (!Array.isArray(dislikes)) return [];
  return dislikes.filter((d): d is string => typeof d === "string");
};

const mapSingleRelationshipStatus = (
  relationshipType?: string | null,
  gender?: string | null,
): string => {
  if (!relationshipType) return "Sin definir";
  const t = relationshipType.toLowerCase();
  const g = (gender ?? "").toLowerCase();
  if (t === "single")
    return g === "female" ? "Soltera" : g === "male" ? "Soltero" : "Soltero/a";
  if (t === "married")
    return g === "female" ? "Casada" : g === "male" ? "Casado" : "Casado/a";
  if (t === "in_relationship" || t === "relationship") return "En una relación";
  if (t === "divorced")
    return g === "female"
      ? "Divorciada"
      : g === "male"
        ? "Divorciado"
        : "Divorciado/a";
  if (t === "widowed")
    return g === "female" ? "Viuda" : g === "male" ? "Viudo" : "Viudo/a";
  return relationshipType;
};

const ProfileSingle: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    profile,
    isAuthenticated,
    signOut,
    loading: isLoading,
    isDemoMode,
    getProfileType,
  } = useAuth();
  const { toast } = useToast();
  const {
    authenticate,
    verifyPin,
    isBiometricAvailable,
    isBiometricEnabled,
    hasPin,
  } = useBiometricAuth();
  const [isBiometricUnlocking, setIsBiometricUnlocking] = useState(false);

  // Ajustes de privacidad del perfil que se está viendo (indicador de
  // visibilidad, signo zodiacal y marca de agua). Misma clave que usa
  // SinglePrivacySection (`user.id ?? profile.id`); se actualiza en
  // vivo cuando esa sección guarda un cambio.
  const profilePrivacy = usePrivacySettings(
    user?.id ?? profile?.id ?? "",
    "single",
    // Ronda 10 (stream A, punto A1): el anónimo es privado por
    // defecto; sin ajustes guardados, el default es invisible. Se
    // calcula en línea porque el `isAnonymous` memoizado se define
    // más abajo (usarlo aquí caería en la zona muerta temporal).
    isAnonymousDemoProfile(profile),
  );
  const profileZodiac = getProfileZodiacSign(profilePrivacy);
  const visibilityBadge = getVisibilityBadge(
    profilePrivacy,
    profile?.is_online ?? false,
  );

  // Funcin helper para verificar autenticacin
  const checkAuth = () => {
    return typeof isAuthenticated === "function"
      ? isAuthenticated()
      : !!isAuthenticated;
  };

  const handleBiometricUnlock = async () => {
    if (!isOwnProfile || isGalleryUnlocked) return;

    if (!import.meta.env.PROD) {
      setIsParentalLocked(true);
      setShowParentalUnlock(true);
      return;
    }

    if (!isBiometricEnabled || !isBiometricAvailable) {
      setIsParentalLocked(true);
      setShowParentalUnlock(true);
      return;
    }

    setIsBiometricUnlocking(true);
    try {
      const username = user?.id || "anonymous";
      const result = await authenticate(username);
      if (result.success) {
        setIsParentalLocked(false);
        setShowParentalUnlock(false);
        setDemoPrivateUnlocked(true);
        persistUnlock();
        return;
      }

      setIsParentalLocked(true);
      setShowParentalUnlock(true);
    } catch (error) {
      logger.error("Biometric unlock failed", { error: String(error) });
      setIsParentalLocked(true);
      setShowParentalUnlock(true);
    } finally {
      setIsBiometricUnlocking(false);
    }
  };

  const requireSecureAccess = async (): Promise<boolean> => {
    try {
      const username = user?.id || "anonymous";

      if (isBiometricEnabled && isBiometricAvailable) {
        const result = await authenticate(username);
        if (result.success) {
          return true;
        }
        if (result.method === "pin" && hasPin) {
          const pin = window.prompt(
            "Ingresa tu PIN de 6 dígitos para desbloquear contenido privado:",
          );
          if (!pin) return false;
          return await verifyPin(pin);
        }
      } else if (hasPin) {
        const pin = window.prompt(
          "Ingresa tu PIN de 6 dígitos para desbloquear contenido privado:",
        );
        if (!pin) return false;
        return await verifyPin(pin);
      }

      return true;
    } catch (error) {
      logger.error("Secure access failed", { error: String(error) });
      return false;
    }
  };

  interface ProfileStats {
    totalViews: number;
    totalLikes: number;
    totalMatches: number;
    profileCompleteness: number;
    lastActive: Date;
    joinDate: Date;
    verificationLevel: number;
  }

  const [showPrivateImageRequest, setShowPrivateImageRequest] = useState(false);
  const [privateImageAccess, setPrivateImageAccess] = usePersistedState<
    "none" | "pending" | "approved" | "denied"
  >("private_image_access", "none");

  const [showPrivateDecisionModal, setShowPrivateDecisionModal] =
    useState(false);
  const [privateDecisionRequesterName, setPrivateDecisionRequesterName] =
    useState<string>("");

  const [showPrivatePolicyModal, setShowPrivatePolicyModal] = useState(false);
  const [showPrivateDeniedModal, setShowPrivateDeniedModal] = useState(false);
  const [temporaryPrivateAccess, setTemporaryPrivateAccess] = useState(false);
  const [showPrivateBlockedModal, setShowPrivateBlockedModal] = useState(false);
  const [blockedDurationMs, setBlockedDurationMs] = useState(0);

  const getPrivateGalleryBlockKey = () =>
    `private_gallery_block:${profile?.id || "unknown"}`;
  const getPrivateGalleryAttemptKey = () =>
    `private_gallery_attempts:${profile?.id || "unknown"}`;
  const getPrivateGalleryBlockDurationKey = () =>
    `private_gallery_block_duration:${profile?.id || "unknown"}`;

  const getBlockedUntil = () => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.localStorage.getItem(getPrivateGalleryBlockKey());
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  };

  const isPrivateRequestBlocked = () => {
    const until = getBlockedUntil();
    return typeof until === "number" && until > Date.now();
  };

  const registerPrivateRequestSent = () => {
    if (typeof window === "undefined") return { blocked: false, durationMs: 0 };
    try {
      const currentAttempts = Number(
        window.localStorage.getItem(getPrivateGalleryAttemptKey()) || "0",
      );
      const nextAttempts = currentAttempts + 1;
      window.localStorage.setItem(
        getPrivateGalleryAttemptKey(),
        String(nextAttempts),
      );

      if (nextAttempts < 3) {
        return { blocked: false, durationMs: 0 };
      }

      const prevDuration = Number(
        window.localStorage.getItem(getPrivateGalleryBlockDurationKey()) || "0",
      );
      const base = 2 * 60 * 60 * 1000;
      const nextDuration = Math.min(
        prevDuration > 0 ? prevDuration * 2 : base,
        24 * 60 * 60 * 1000,
      );
      const blockedUntil = Date.now() + nextDuration;

      window.localStorage.setItem(
        getPrivateGalleryBlockDurationKey(),
        String(nextDuration),
      );
      window.localStorage.setItem(
        getPrivateGalleryBlockKey(),
        String(blockedUntil),
      );
      window.localStorage.setItem(getPrivateGalleryAttemptKey(), "0");

      return { blocked: true, durationMs: nextDuration };
    } catch {
      return { blocked: false, durationMs: 0 };
    }
  };

  const clearPrivateRequestAttempts = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(getPrivateGalleryAttemptKey(), "0");
    } catch {
      // no-op
    }
  };

  const resetPrivateBlock = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(getPrivateGalleryBlockKey());
      window.localStorage.removeItem(getPrivateGalleryAttemptKey());
      window.localStorage.removeItem(getPrivateGalleryBlockDurationKey());
    } catch {
      // no-op
    }
  };

  // Demo: controlar desbloqueo visual de fotos privadas en el propio perfil
  const [demoPrivateUnlocked, setDemoPrivateUnlocked] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  // Menú "Compartir" (punto 17): TikTok, Facebook, WhatsApp y X.
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Galería privada COLAPSADA por defecto (punto 14, regresión ronda 4):
  // al cargar se ven los 58 ítems expandidos; debe cargar colapsada y
  // expandirse solo al tocar "Ver fotos".
  const [privateGalleryOpen, setPrivateGalleryOpen] = useState(false);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const profileScore = useProfileScore(profile);

  const privateGalleryRef = useRef<HTMLDivElement | null>(null);

  // PIN persistente (full test 2026-11-24): el desbloqueo de la galería
  // privada con PIN 1234 (demo) se perdía al navegar porque el efecto de
  // montaje forzaba locked=true siempre. Se guarda la expiración del
  // desbloqueo (1 h, igual que las URLs firmadas de la galería): al montar
  // solo se fuerza el bloqueo si ya expiró. El auto-bloqueo del
  // ParentalControl (onToggle(true)) y el botón Bloquear limpian la clave.
  const [unlockExpiresAt, setUnlockExpiresAt] = usePersistedState<number>(
    "private_gallery_unlocked_until",
    0,
  );
  const persistUnlock = useCallback(() => {
    setUnlockExpiresAt(Date.now() + 60 * 60 * 1000);
  }, [setUnlockExpiresAt]);
  const clearUnlock = useCallback(() => {
    setUnlockExpiresAt(0);
  }, [setUnlockExpiresAt]);

  // Estado para control parental: la galería privada carga BLOQUEADA.
  // (Antes: false, y las fotos privadas quedaban visibles sin PIN en la
  // primera carga del perfil.)
  const [isParentalLocked, setIsParentalLocked] = usePersistedState<boolean>(
    "parentalControlLocked",
    true,
  );

  const [showParentalUnlock, setShowParentalUnlock] = useState(false);

  // Restaurar el desbloqueo vigente al montar; si expiró (o nunca hubo),
  // bloquear: cubre instalaciones que ya tenían
  // "parentalControlLocked" = false persistido antes de este fix.
  const unlockRestoredRef = useRef(false);
  useEffect(() => {
    if (unlockRestoredRef.current) return;
    unlockRestoredRef.current = true;
    if (unlockExpiresAt > Date.now()) {
      setIsParentalLocked(false);
      setDemoPrivateUnlocked(true);
    } else {
      setIsParentalLocked(true);
      setDemoPrivateUnlocked(false);
      if (unlockExpiresAt !== 0) setUnlockExpiresAt(0);
    }
    // Solo al montar: el valor leído de localStorage en el primer render
    // es la fuente; reaccionar a cambios posteriores lo re-bloquearía.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isPostCommentModalOpen, setIsPostCommentModalOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  // Estados para modal de carrusel avanzado
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);

  const openImageModal = (images: string[], index: number) => {
    setModalImages(images);
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };
  const [imageLikes, setImageLikes] = useState<{ [key: string]: number }>(
    () => ({
      "1": 12,
      "2": 8,
      "3": 15,
    }),
  );
  const [imageUserLikes, setImageUserLikes] = useState<{
    [key: string]: boolean;
  }>(() => ({}));
  const [profileStats, setProfileStats] = useState<ProfileStats>(() => ({
    totalViews: 0,
    totalLikes: 0,
    totalMatches: 0,
    profileCompleteness: 0,
    lastActive: new Date(),
    joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    verificationLevel: 0,
  }));

  useEffect(() => {
    if (location.hash !== "#wallet") return;
    const id = window.setTimeout(() => {
      document
        .getElementById("wallet")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [location.hash]);

  // Ronda 8 (punto 14): el temporizador que alternaba la etiqueta del
  // chip (Cuenta ↔ DEMO/nombre) cada 4-6 s SIN interacción del usuario
  // se eliminó: era la causa de que la etiqueta alternara entre
  // capturas consecutivas de la MISMA cuenta/sesión. Ahora la etiqueta
  // es determinista: "Cuenta" solo al pasar el cursor; si no, "DEMO"
  // en demo o el nombre en sesión real.
  // Estados para funcionalidades blockchain
  const [tokenBalances, setTokenBalances] = useState(() => ({
    cmpx: "0",
    gtk: "0",
    matic: "0",
  }));
  const [testnetInfo, setTestnetInfo] = useState<any>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);
  // Determinar si es el perfil propio
  const isOwnProfile = checkAuth() && user?.id === profile?.id;

  // 🎨 Aplicar tema distintivo para perfil demo
  const isDemoProfile = useMemo(
    () =>
      Boolean(profile?.is_demo) ||
      (typeof profile?.id === "string" && profile.id.startsWith("demo")) ||
      (typeof profile?.user_id === "string" &&
        profile.user_id.startsWith("demo")),
    [profile?.is_demo, profile?.id, profile?.user_id],
  );
  const demoTheme = isDemoProfile ? "demo_premium" : undefined;
  useProfileTheme("single", ["male"], demoTheme);

  // Ronda 8 (punto 14): perfil ANÓNIMO. Es su propio perfil limitado
  // (sin NFTs, sin publicar, permiso para todo) y NO la persona demo
  // canónica: cuando es anónimo, `singleIsDemo` es false y ningún
  // fallback de Sofía (foto, edad, bio, saldos, NFTs, fotos privadas)
  // se aplica. Ver isAnonymousDemoProfile en @/lib/demo-registration.
  const isAnonymous = useMemo(() => isAnonymousDemoProfile(profile), [profile]);

  // Ronda 9 (stream A, punto 6): vigencia de la cuenta anónima (30
  // días desde su creación) para el aviso de expiración/conversión.
  const anonymousExpiry = useMemo(
    () =>
      getAnonymousExpiryInfo(
        typeof profile?.created_at === "string" ? profile.created_at : null,
      ),
    [profile?.created_at],
  );

  // Ronda 10 (stream A, punto A6): cuenta atrás de los accesos a la
  // galería limitada que el dueño ya concedió (24 h desde la
  // aceptación). Se re-calcula cada 30 s para que el temporizador
  // avance sin recargar; los expirados desaparecen solos (hay que
  // volver a pedir acceso).
  const [galleryAccessNowMs, setGalleryAccessNowMs] = useState(() =>
    Date.now(),
  );
  useEffect(() => {
    if (!isAnonymous) return;
    const timer = window.setInterval(
      () => setGalleryAccessNowMs(Date.now()),
      30000,
    );
    return () => window.clearInterval(timer);
  }, [isAnonymous]);
  const grantedGalleryAccess = useMemo(
    () =>
      isAnonymous && profile?.id
        ? listAnonymousPhotoAccessGrantedBy(
            String(profile.id),
            galleryAccessNowMs,
          )
        : [],
    [isAnonymous, profile?.id, galleryAccessNowMs],
  );

  // Datos de imágenes privadas para el carrusel
  type PrivateImageItem = {
    id?: string;
    url?: string;
    src?: string;
    caption?: string;
    likes?: number;
    userLiked?: boolean;
  };

  // C6: rutas de Storage (bucket "media") de las 58 imágenes privadas.
  // Ya NO son URLs públicas: la ruta legacy `/assets/people/...` se mapea a
  // `people/...` en el bucket con toPrivateStoragePath(). Las URLs firmadas
  // se resuelven abajo con usePrivateMediaUrls() (solo galería desbloqueada
  // + usuario autenticado); en cualquier otro caso se muestra el placeholder.
  // Ronda 8 (punto 14): el perfil anónimo NO tiene fotos privadas de
  // Sofía: su galería privada es vacía (sin sus 58 fotos ni su PIN).
  const privateImageStoragePaths = useMemo(
    () =>
      isAnonymous
        ? []
        : Array.from({ length: 58 })
            .map((_, idx) =>
              toPrivateStoragePath(
                `/assets/people/single/privado/aprivadosingle${idx + 1}.jpg`,
              ),
            )
            .filter((p): p is string => p !== null),
    [isAnonymous],
  );

  const profilePrivateImagesRaw = profile?.privateImages as
    (PrivateImageItem | string)[] | undefined;

  const profilePrivateImages = useMemo(
    () =>
      profilePrivateImagesRaw?.filter((img) => {
        const src = typeof img === "string" ? img : (img.url ?? img.src ?? "");
        return src && src !== profile?.avatar_url;
      }),
    [profilePrivateImagesRaw, profile?.avatar_url],
  );

  const isGalleryUnlocked =
    isOwnProfile &&
    !isParentalLocked &&
    (demoPrivateUnlocked || privateImageAccess === "approved");

  // C6: resuelve las 58 rutas de Storage a URLs firmadas (1 h) solo cuando
  // la galería está desbloqueada y hay usuario autenticado. Llamada
  // incondicional en el top-level (sin early returns antes en el componente).
  // En cualquier otro caso devuelve el placeholder genérico por posición.
  const privateImageUrls = usePrivateMediaUrls(privateImageStoragePaths, {
    unlocked: isGalleryUnlocked,
    userId: user?.id ?? null,
    ownerId: profile?.id ?? null,
    // SOLO DEMO: el bucket `media` no existe aún; las imágenes demo se
    // resuelven desde /assets/... (ver private-media.ts). Perfiles reales:
    // sin este flag, URLs firmadas o placeholder.
    demoAssetFallback: isDemoMode(),
  });

  const galleryImages: (PrivateImageItem | string)[] = useMemo(() => {
    // Imágenes guardadas en el registro del perfil (DB): se pasan tal cual.
    // Su ubicación de almacenamiento es desconocida y NO forma parte de las
    // 62 del inventario C6; ver el hallazgo aparte en C6_FIX_SUMMARY.md.
    if (
      Array.isArray(profilePrivateImages) &&
      profilePrivateImages.length > 0
    ) {
      return profilePrivateImages;
    }
    return privateImageStoragePaths.map((_storagePath, idx) => ({
      id: String(idx + 1),
      url: privateImageUrls[idx] ?? PRIVATE_MEDIA_PLACEHOLDER,
      title: "Contenido privado",
      description: "Acceso privado",
    }));
  }, [profilePrivateImages, privateImageStoragePaths, privateImageUrls]);

  // Flags internos para bloquear secciones de UI opcionales sin romper lint
  const SHOW_ONLINE_BADGE = false;
  const SHOW_BIO_SECTION = false;

  // Funciones para el modal del carrusel
  const handleImageLike = (imageIndex: number) => {
    const imageId = imageIndex.toString();
    const currentLikes = imageLikes[imageId] || 0;
    const userLiked = imageUserLikes[imageId] || false;

    if (userLiked) {
      setImageLikes((prev) => ({ ...prev, [imageId]: currentLikes - 1 }));
      setImageUserLikes((prev) => ({ ...prev, [imageId]: false }));
    } else {
      setImageLikes((prev) => ({ ...prev, [imageId]: currentLikes + 1 }));
      setImageUserLikes((prev) => ({ ...prev, [imageId]: true }));
    }
  };

  const navigateCarousel = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleAddComment = (imageIndex: number, comment?: string) => {
    const imageId = imageIndex.toString();
    logger.info("Comentario solicitado en imagen privada", {
      imageId,
      hasComment: !!comment,
    });
    toast({
      title: "Comentarios",
      description:
        "Funcionalidad de comentarios en galería privada en preparación.",
    });
  };

  // Handlers para las acciones del perfil
  const handleUploadImage = () => {
    logger.info("Subir imagen solicitado");
    // Demo: Simular subida de imagen a galería (NO es crear post)
    toast({
      title: "Subir imagen (DEMO)",
      description:
        "En producción: selector + crop + filtros + galería. Demo: funcionalidad simulada.",
    });
    logger.info("Subida de imagen demo");
  };

  const handleDeletePost = (postId: string) => {
    logger.info("Eliminar post solicitado", { postId });
    // Demo: Modal de confirmación
    const confirmed = window.confirm(
      "🗑️ PERFIL DEMO\n\nEste es un perfil de demostración.\n¿Eliminar este post temporalmente?\n\n(Se recargará al refrescar)",
    );
    if (confirmed) {
      logger.info("Post eliminado (demo):", { postId });
      toast({
        title: "Post eliminado (DEMO)",
        description: "Se restaurará al refrescar la página.",
      });
      // TODO: En producción, eliminar del estado
    }
  };

  const handleCommentPost = (postId: string) => {
    logger.info("Comentar post solicitado", { postId });
    // Implementar lógica de comentario
    setCommentPostId(postId);
    setCommentDraft("");
    setIsPostCommentModalOpen(true);
  };

  // Funciones para cargar datos adicionales
  const loadProfileStats = useCallback(async () => {
    // Demo: no hay API real de estadísticas; contadores coherentes con el
    // contenido demo (12 posts, 2 matches) en vez de 0 junto a contenido.
    // Fuera de demo siguen en 0 hasta que exista la API real.
    // Ronda 8 (punto 14): el perfil anónimo NO hereda los 148/56/2 de
    // Sofía: empieza en 0, como una cuenta nueva.
    const demoStats =
      isDemoMode() && !isAnonymous
        ? { totalViews: 148, totalLikes: 56, totalMatches: 2 }
        : { totalViews: 0, totalLikes: 0, totalMatches: 0 };
    try {
      // Intentar cargar estadísticas reales, no mock
      // TODO: Implementar carga real de estadísticas desde API
      logger.info("Cargando estadísticas reales del perfil", {
        userId: currentProfile.id,
      });

      // Por ahora, usar valores por defecto hasta implementar API real
      const defaultStats = {
        ...demoStats,
        profileCompleteness: 0,
        lastActive: new Date(currentProfile.created_at || new Date()),
        joinDate: new Date(currentProfile.created_at || new Date()),
        verificationLevel: currentProfile.is_verified ? 1 : 0,
      };
      setProfileStats(defaultStats);
    } catch (error) {
      logger.error("Error loading profile stats:", { error: String(error) });
      // En error, usar valores por defecto
      setProfileStats({
        ...demoStats,
        profileCompleteness: 0,
        lastActive: new Date(),
        joinDate: new Date(),
        verificationLevel: 0,
      });
    }
  }, [profile?.id, profile?.created_at, profile?.is_verified, isAnonymous]);

  const handleViewPrivatePhotos = async () => {
    try {
      if (isPrivateRequestBlocked()) {
        toast({
          title: "Acceso temporalmente bloqueado",
          description: "Has excedido los intentos. Intenta más tarde.",
          variant: "destructive",
        });
        return;
      }

      if (await requireSecureAccess()) {
        setShowPrivatePolicyModal(true);
      }
    } catch (error) {
      logger.error("Error handling private photo request", {
        error: String(error),
      });
    }
  };

  const handleViewApprovedPrivatePhotos = () => {
    if (!privateGalleryRef.current) {
      toast({
        title: "Galería privada",
        description: "No se pudo ubicar la sección de fotos privadas.",
        variant: "destructive",
      });
      return;
    }

    privateGalleryRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    toast({
      title: "Galería privada",
      description: "Desplazándote a tus fotos privadas.",
    });
  };

  // Funciones para blockchain
  const loadBlockchainData = useCallback(
    async (forcedUserId?: string) => {
      const targetUserId =
        forcedUserId ||
        user?.id ||
        asOptionalString(currentProfile["user_id"]) ||
        currentProfile.id ||
        null;

      try {
        const isDemoAuthActive =
          typeof window !== "undefined" &&
          window.localStorage.getItem("demo_authenticated") === "true";
        const isDemoActive = isDemoMode() || isDemoAuthActive;

        // Ronda 8 (punto 14): el perfil anónimo NO tiene los saldos
        // canónicos de Sofía (CMPX 1250 / GTK 850), ni NFTs, ni
        // staking: su billetera empieza vacía.
        if (isAnonymous) {
          setTokenBalances({ cmpx: "0", gtk: "0", matic: "0" });
          setUserNFTs([]);
          setTestnetInfo(null);
          return;
        }

        if (targetUserId) {
          // En DEMO mostrar datos demo para que el usuario vea valores.
          // Ronda 7, puntos 8 y 9: la rama demo también aplica cuando el
          // PERFIL que se está viendo es demo (isDemoProfile), no solo
          // cuando los flags de modo demo están activos: en el test el
          // perfil demo mostraba "Blockchain & NFTs" en 0/0/0 mientras
          // Suscripción (constantes) decía 1250/850. Y el uid es el
          // mismo que usa el botón de mint (user.id primero): antes
          // este callback tenía deps [] y capturaba el user del primer
          // render (null), así que leía `demo_nfts:<profile.user_id>`
          // mientras el mint escribía `demo_nfts:<user.id>` — tras
          // recargar, la colección minteada se leía con otro uid y el
          // contador volvía a 0.
          if (isDemoActive || isDemoProfile) {
            const [nfts] = await Promise.all([
              nftService
                .getUserNFTs(targetUserId, { demoFallback: isDemoProfile })
                .catch(() => []),
            ]);

            // Datos demo visibles (canónicos PERSISTIDOS, ÚNICA fuente
            // @/lib/demo-wallet): tras reclamar 100 CMPX en /tokens el
            // perfil debe decir 1350, no 1250.
            const canonical = getDemoWalletBalance("single");
            setTokenBalances({
              cmpx: String(canonical.cmpx),
              gtk: String(canonical.gtk),
              matic: "10",
            });
            setUserNFTs(nfts);
            setTestnetInfo({
              remaining: 500,
              dailyRemaining: 2500000,
              canClaim: true,
              dailyLimit: 2500000,
              dailyClaimed: 0,
              claimed: 500,
              maxClaim: 1000,
            } as any);
            return;
          }

          // Producción: obtener address real antes de consultar balances
          const walletInfo =
            await walletService.getOrCreateWallet(targetUserId);
          const address = walletInfo?.address;

          const [tokens, nfts, testnet] = await Promise.all([
            address
              ? walletService
                  .getTokenBalances(address, walletInfo.network || "mumbai")
                  .catch(() => ({ cmpx: "0", gtk: "0", matic: "0" }))
              : Promise.resolve({ cmpx: "0", gtk: "0", matic: "0" }),
            nftService.getUserNFTs(targetUserId).catch(() => []),
            walletService.getTestnetTokensInfo(targetUserId).catch(() => null),
          ]);

          setTokenBalances(tokens);
          setUserNFTs(nfts);
          setTestnetInfo(testnet);
          return;
        }

        // Fallback demo sin user.id: usar flag local para mostrar estado mínimo
        if (isDemoMode() && !isAnonymous) {
          const canonical = getDemoWalletBalance("single");
          setTokenBalances({
            cmpx: String(canonical.cmpx),
            gtk: String(canonical.gtk),
            matic: "10",
          }); // Balance demo canónico de single (igual que useTokens).
          setUserNFTs([]);
          setTestnetInfo({
            remaining: 500,
            dailyRemaining: 2500000,
            canClaim: true,
            dailyLimit: 2500000,
            dailyClaimed: 0,
            claimed: 500,
            maxClaim: 1000,
          } as any);
        }
      } catch (error) {
        logger.error("Error cargando datos blockchain:", {
          error: String(error),
        });
      }
      // Deps con user?.id e isDemoProfile: el callback lee ambos y con
      // deps [] capturaba el user del primer render (ver comentario en
      // la rama demo). Al cambiar el user tras el login demo, el efecto
      // de abajo vuelve a correr y recarga con el uid correcto.
    },
    [user?.id, isDemoProfile, isAnonymous],
  );

  const handleClaimTestnetTokens = async () => {
    const uid = user?.id || (profile as any)?.user_id || (profile as any)?.id;
    if (!uid || isClaimingTokens) return;

    setIsClaimingTokens(true);
    try {
      if (isDemoMode()) {
        // Modo demo - simular reclamo
        const result = await walletService.executeDemoAction(
          uid,
          "send_tokens",
          { amount: 1000 },
        );
        logger.info("Tokens de testnet reclamados (DEMO):", result);

        // Actualizar estado local para demo
        setTestnetInfo((prev: any) => ({
          ...prev,
          claimed: (prev?.claimed || 0) + 1000,
          remaining: Math.max(0, (prev?.remaining || 1000) - 1000),
        }));
      } else {
        // Modo real - reclamar tokens reales
        const txHash = await walletService.claimTestnetTokens(uid, 1000);
        logger.info("Tokens de testnet reclamados:", { txHash });

        // Recargar información
        await loadBlockchainData();
      }
    } catch (error) {
      logger.error("Error reclamando tokens de testnet:", {
        error: String(error),
      });
    } finally {
      setIsClaimingTokens(false);
    }
  };

  const handleClaimDailyTokens = async () => {
    const uid = user?.id || (profile as any)?.user_id || (profile as any)?.id;
    if (!uid || isClaimingTokens) return;

    setIsClaimingTokens(true);
    try {
      if (isDemoMode()) {
        // Modo demo - simular reclamo diario con datos mock
        logger.info("Tokens diarios reclamados (DEMO mock)");

        // Actualizar estado local para demo con datos mock
        setTestnetInfo((prev: any) => {
          const newDailyClaimed = (prev?.dailyClaimed || 0) + 50000;
          const newDailyRemaining = Math.max(
            0,
            (prev?.dailyRemaining || 2500000) - 50000,
          );
          const newClaimed = (prev?.claimed || 0) + 50000;
          const newRemaining = Math.max(0, (prev?.remaining || 1000) - 500);

          return {
            ...prev,
            dailyClaimed: newDailyClaimed,
            dailyRemaining: newDailyRemaining,
            claimed: newClaimed,
            remaining: newRemaining,
          };
        });

        // Actualizar balances de tokens demo
        setTokenBalances((prev) => ({
          cmpx: String(parseInt(prev.cmpx || "0") + 50000),
          gtk: prev.gtk,
          matic: prev.matic,
        }));

        toast({
          title: "Tokens reclamados (DEMO)",
          description: "+50,000 CMPX agregados a tu wallet",
        });
      } else {
        // Modo real - reclamar tokens diarios
        const txHash = await walletService.claimDailyTokens(uid, 50000);
        logger.info("Tokens diarios reclamados:", { txHash });

        // Recargar información
        await loadBlockchainData();
      }
    } catch (error) {
      logger.error("Error reclamando tokens diarios:", {
        error: String(error),
      });
      toast({
        title: "Error",
        description: "No se pudieron reclamar los tokens diarios",
        variant: "destructive",
      });
    } finally {
      setIsClaimingTokens(false);
    }
  };

  // Migración localStorage → usePersistedState
  useEffect(() => {
    if (profile?.id) {
      loadProfileStats();
      loadBlockchainData();
    }
  }, [profile?.id, loadProfileStats, loadBlockchainData]);

  // Recargar NFTs si se mintea en otro sitio de la misma página
  // (DemoWallet, modal de mint): todos leen getUserNFTs (punto 12).
  // Ronda 7, punto 8: también al cambiar el saldo demo (reclamo en
  // /tokens) para que "Blockchain & NFTs" y Suscripción digan 1350
  // sin recargar la página.
  useEffect(() => {
    const onChanged = () => void loadBlockchainData();
    window.addEventListener(DEMO_NFTS_CHANGED_EVENT, onChanged);
    window.addEventListener(DEMO_WALLET_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(DEMO_NFTS_CHANGED_EVENT, onChanged);
      window.removeEventListener(DEMO_WALLET_CHANGED_EVENT, onChanged);
    };
  }, [loadBlockchainData]);

  // singleIsDemo y savedDemoInterests VAN AQUÍ ARRIBA, antes de los early
  // returns de loading/perfil: si se declaran después, en el primer render
  // (cargando) el useMemo no se ejecuta y en el segundo sí → React truena
  // con el error #310 ("Rendered more hooks than during the previous
  // render") → /404.
  // Punto 14a (ronda 7): `isDemoMode()` es true para CUALQUIER sesión
  // demo (single o pareja: solo mira `demo_authenticated` en
  // localStorage). Antes `singleIsDemo` era eso a secas, así que con
  // sesión de pareja esta página mostraba el nombre/foto de la pareja
  // (del `profile` de useAuth, bien resuelto) pero TODOS los datos demo
  // de Sofía: CMPX 1250 (`DEMO_WALLET_BALANCES.single`), staking 170 GTK
  // (20% de 850), "Soltera" (`DEMO_SINGLE_DETAILS`), sus fotos y sus
  // amigos. Ahora el flag demo de Sofía exige sesión single
  // (`getProfileType()` lee el `demo_user` fresco y resuelve
  // "couple" para la pareja; en sesión real lee `profile_type`).
  // Ronda 8 (punto 14): el perfil ANÓNIMO tampoco es Sofía: es su
  // propio perfil limitado, sin sus datos. Sin el `!isAnonymous`,
  // "Crear Perfil Anónimo" (TestR7) seguía cayendo aquí y clonaba
  // foto, bio, saldos, NFTs y fotos privadas de Sofía.
  const singleIsDemo =
    isDemoMode() && getProfileType() === "single" && !isAnonymous;
  // Intereses guardados desde el editor (demo): el editor single guarda la
  // selección en `demo_user` (localStorage) y el perfil la refleja. Si aún
  // no se ha editado nada, se usan los títulos demo. En producción se leen
  // las actividades reales (activities_interested).
  const savedDemoInterests = useMemo(() => {
    if (!singleIsDemo || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("demo_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { interests?: unknown };
      return Array.isArray(parsed.interests) &&
        parsed.interests.every((x) => typeof x === "string")
        ? (parsed.interests as string[])
        : null;
    } catch {
      return null;
    }
  }, [singleIsDemo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-white font-medium">Cargando perfil...</p>
          <p className="mt-2 text-white/70 text-sm">
            Obteniendo datos reales del perfil
          </p>
        </div>
      </div>
    );
  }

  // Punto 14a (ronda 7): una sesión de pareja NO tiene perfil single
  // propio: su página es /profile-couple (a donde ya apunta el botón
  // Perfil del dock, que resuelve por tipo). Sin esta redirección, entrar
  // directo a /profile-single con sesión de pareja renderizaba el híbrido
  // (nombre/foto de la pareja + datos de Sofía). Va antes del `!profile`:
  // el tipo se conoce por la sesión aunque el perfil no haya cargado.
  // `getProfileType()` solo devuelve "couple" con resolución positiva
  // (su default es "single"), así que una sesión sin tipo conocido no
  // redirige por error.
  if (checkAuth() && getProfileType() === "couple") {
    return <Navigate to="/profile-couple" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">
              Perfil no encontrado
            </h2>
            <p className="text-white/80 mb-4">
              No se pudo cargar la información del perfil. Los datos pueden no
              existir o estar inaccesibles.
            </p>
            <Button
              onClick={() => navigate("/discover")}
              className="border border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // profile es no nulo a partir de aquí
  const currentProfile = profile;

  const asOptionalString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length > 0 ? value : undefined;

  const asString = (value: unknown, fallback: string): string =>
    asOptionalString(value) ?? fallback;

  // Valores de display seguros para DEMO inversor (fallback cuando faltan datos reales)
  const displayName = asString(
    currentProfile.display_name ??
      asOptionalString(currentProfile["name"]) ??
      asOptionalString(currentProfile.first_name),
    "Usuario", // Fallback genérico, no nombre específico
  );

  // Ronda 9 (stream A, Cuenta/DEMO): la etiqueta del chip es
  // CONSTANTE — "DEMO" en demo o el nombre en sesión real. Antes
  // dependía del hover (`accountChipHovered`: "Cuenta" al pasar el
  // cursor) y en táctil el hover se quedaba pegado al abrir el menú,
  // así que la etiqueta cambiaba según el estado del menú y la ruta
  // (ronda 8: "DEMO" con menú cerrado, "Cuenta" con menú abierto o
  // en /profile-couple). Sin hover no hay dependencia.
  const accountChipLabel = isDemoProfile ? "DEMO" : displayName;

  // Foto principal de Sofía (28, demo single): si el avatar viene vacío
  // o apunta al asset local roto `img/demo-single-avatar.jpg` (no existe
  // en public/) o al placeholder genérico (tampoco existe), SafeImage
  // mostraba "NO DISPONIBLE". En demo se usa su foto canónica verificada.
  const rawAvatarUrl = asOptionalString(currentProfile.avatar_url);
  const isBrokenDemoAvatar =
    rawAvatarUrl != null &&
    (rawAvatarUrl.includes("demo-single-avatar") ||
      rawAvatarUrl.includes("avatar-placeholder"));
  const avatarUrl =
    rawAvatarUrl && !isBrokenDemoAvatar
      ? rawAvatarUrl
      : singleIsDemo
        ? SOFIA_CANONICAL_PHOTO
        : "/assets/avatar-placeholder.png";

  // Fotos públicas de Sofía: 3 DISTINTAS del pool (ver
  // SOFIA_PUBLIC_PHOTOS en @/demo/demoData): la canónica + 2 retratos
  // distintos. Antes eran 3 recortes de la misma foto canónica y se
  // veían como la misma imagen repetida 3 veces.
  // Ronda 8 (punto 14): el perfil anónimo NO muestra las fotos
  // públicas de Sofía: su galería pública empieza vacía.
  const SOFIA_PUBLIC_PHOTOS_LIST = isAnonymous ? [] : [...SOFIA_PUBLIC_PHOTOS];
  const SOFIA_PUBLIC_PHOTOS_FULL_LIST = [...SOFIA_PUBLIC_PHOTOS_FULL];
  const SOFIA_PUBLIC_TILE_GRADIENTS = [
    "from-purple-400 to-blue-600",
    "from-pink-400 to-red-600",
    "from-blue-400 to-teal-600",
  ];

  // En demo, la edad canónica de Sofía es 28 (la misma que usa
  // singleAbout); fuera de demo, 18 es la mínima legal, no un valor
  // específico. Ronda 8 (punto 14): el perfil anónimo no tiene edad
  // registrada: null (sin inventar 18) y la píldora se oculta.
  const displayAge =
    currentProfile.age || (singleIsDemo ? 28 : isAnonymous ? null : 18);

  // Nacionalidad: columna `country_code` (migración 20261124050000)
  // → local del registro → datos sociales demo (por nombre).
  const profileCountryCode =
    (currentProfile as { country_code?: string | null }).country_code ??
    readCountryCodeLocal(user?.id ?? profile?.id ?? "") ??
    getSocialDemoData(displayName).countryCode;

  // Ronda 9 (stream B): `formatGenderLabel` localiza el valor crudo
  // ("female" -> "Mujer"); antes un valor desconocido se devolvía tal cual.
  const displayGenderLabel = formatGenderLabel(currentProfile.gender);

  // Ronda 9 (stream B): la píldora mostraba "men" en crudo porque el
  // mapeo anterior solo conocía "male"/"female" y el valor guardado es
  // "men". `formatInterestedInLabel` lo localiza ("Hombres") y nunca
  // devuelve el valor crudo en inglés.
  const displayOrientationLabel = formatInterestedInLabel(
    currentProfile.interested_in,
  );

  // Ronda 8 (punto 14): el perfil anónimo NO tiene la sección
  // "Blockchain & NFTs" (sin NFTs, sin mint/claim, sin staking de
  // Sofía) aunque sea perfil propio/demo.
  const canShowBlockchainSection =
    (isOwnProfile || isDemoProfile) && !isAnonymous;

  // Secciones espejo de pareja para 1 usuario (modelo del video).
  // En producción se leen las columnas reales de profiles
  // (activities_interested, looking_for, preferences, age_range_min/max,
  // relationship_type, interested_in); los campos físicos no existen en
  // la tabla y solo se muestran en demo.
  const singleActivities =
    (currentProfile["activities_interested"] as string[] | null) ?? [];
  const singleAgeMin = currentProfile["age_range_min"] as number | null;
  const singleAgeMax = currentProfile["age_range_max"] as number | null;
  const singleAbout = {
    name: displayName,
    age:
      typeof currentProfile.age === "number"
        ? currentProfile.age
        : singleIsDemo
          ? 28
          : null,
    gender: currentProfile.gender ?? "",
    bio: asOptionalString(currentProfile.bio),
    avatarGradient: "from-fuchsia-400 to-purple-600",
    details: {
      ...(singleIsDemo ? DEMO_SINGLE_DETAILS : {}),
      orientation:
        deriveSingleOrientation(
          currentProfile.gender,
          currentProfile.interested_in,
        ) ?? (singleIsDemo ? "Heterosexual" : null),
    },
  };
  const singleLikes = singleIsDemo
    ? (savedDemoInterests ?? [
        DEMO_SINGLE_INTEREST_TITLES[0],
        DEMO_SINGLE_INTEREST_TITLES[2],
        DEMO_SINGLE_INTEREST_TITLES[4],
      ])
    : singleActivities;
  const singleLookingFor = singleIsDemo
    ? ["Parejas"]
    : splitLookingFor((currentProfile["looking_for"] as string | null) ?? null);
  const singleAgeRange = singleIsDemo
    ? "25 a 45 años"
    : singleAgeMin != null && singleAgeMax != null
      ? `${singleAgeMin} a ${singleAgeMax} años`
      : null;
  const singleRelationshipStatus = singleIsDemo
    ? "Soltera"
    : mapSingleRelationshipStatus(
        currentProfile["relationship_type"] as string | null,
        currentProfile.gender,
      );
  const singleDislikes = singleIsDemo
    ? []
    : parseDislikes(currentProfile["preferences"]);

  // % de perfil completo desde los datos reales (antes estaba hardcodeado a 0).
  // Cálculo plano (no es hook) para no tocar el orden de hooks (#310).
  const profileCompleteness = computeProfileCompleteness([
    Boolean(displayName),
    Boolean(asOptionalString(currentProfile.bio)),
    typeof currentProfile.age === "number",
    Boolean(currentProfile.avatar_url),
    Boolean(currentProfile.gender),
    singleActivities.length > 0,
    galleryImages.length > 0,
    Boolean(currentProfile.is_verified),
  ]);

  return (
    <div className="min-h-dvh bg-transparent text-slate-900 dark:text-white pb-20 md:pb-0 pt-20 overflow-x-hidden">
      <div className="container mx-auto px-4 pb-24 w-full max-w-full">
        <div className="max-w-4xl mx-auto">
          {/* RONDA 7 (punto 3): la tarjeta era `bg-white/5` con texto
              `text-white` heredado: en tema claro el fondo es claro y
              el nombre, las píldoras y los botones quedaban blancos
              sobre claro (ilegibles). Ahora la tarjeta es blanca sólida
              en claro y translúcida oscura en oscuro; el texto sigue al
              tema. */}
          <Card className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 overflow-hidden mb-6">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* Imagen de perfil */}
                <div className="w-full sm:w-1/3 md:w-1/4 h-64 sm:h-auto relative">
                  <SafeImage
                    src={avatarUrl}
                    alt={displayName}
                    fallbackType="avatar"
                    className="w-full h-full object-cover"
                  />

                  {SHOW_ONLINE_BADGE && currentProfile.is_online && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Informacoin basica */}
                <div className="flex-1 text-center sm:text-left">
                  <h2
                    className={cn(
                      "profile-header-title",
                      isDemoProfile &&
                        "bg-linear-to-r from-purple-700 via-fuchsia-700 to-cyan-700 dark:from-purple-300 dark:via-fuchsia-300 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow",
                    )}
                  >
                    {displayName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    {isDemoProfile && (
                      <Badge className="rounded-full bg-yellow-500/15 text-yellow-800 border border-yellow-500/50 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-400/40 px-2.5 py-1 text-[11px] shadow-lg shadow-yellow-500/20 backdrop-blur-md">
                        DEMO
                      </Badge>
                    )}
                    <Badge className="rounded-full bg-slate-900/5 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[11px] shadow-lg shadow-purple-500/10 backdrop-blur-md">
                      <span className="font-semibold">ID:</span>
                      <span className="ml-1 font-mono">
                        {String(currentProfile.id).slice(0, 8)}
                      </span>
                    </Badge>
                    {/* Insignia de verificado + visibilidad + signo: el
                        toggle "Signo zodiacal" de Privacidad controla si
                        el signo se muestra; el modo invisible se ve con
                        el fantasma 👻. */}
                    {/* Ronda 10 (stream A, punto A2): el anónimo NO es
                        verificado (no pasó World ID / KYC): nunca
                        muestra "✓ Verificado"; lleva la insignia
                        "Anónimo" en su lugar. */}
                    {currentProfile.is_verified && !isAnonymous && (
                      <Badge
                        className="rounded-full bg-blue-500/15 text-blue-800 border border-blue-500/50 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/40 px-2.5 py-1 text-[11px] shadow-lg shadow-blue-500/20 backdrop-blur-md"
                        title="Perfil verificado"
                      >
                        ✓ Verificado
                      </Badge>
                    )}
                    {isAnonymous && (
                      <Badge
                        className="rounded-full bg-slate-600/20 text-slate-800 border border-slate-500/50 dark:bg-slate-500/25 dark:text-slate-100 dark:border-slate-400/40 px-2.5 py-1 text-[11px] shadow-lg shadow-slate-500/20 backdrop-blur-md"
                        title="Perfil anónimo: solo visible para cuentas verificadas"
                      >
                        Anónimo
                      </Badge>
                    )}
                    <Badge
                      className="rounded-full bg-slate-900/5 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[11px] shadow-lg shadow-purple-500/10 backdrop-blur-md"
                      title={visibilityBadge.title}
                    >
                      {visibilityBadge.label}
                    </Badge>
                    {profilePrivacy.zodiacVisible && profileZodiac && (
                      <Badge
                        className="rounded-full bg-slate-900/5 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[11px] shadow-lg shadow-purple-500/10 backdrop-blur-md"
                        title="Signo zodiacal"
                      >
                        {formatZodiacSign(profileZodiac)}
                      </Badge>
                    )}
                    {/* Nacionalidad (punto 1): país + bandera del registro. */}
                    <NationalityBadge countryCode={profileCountryCode} />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                    {displayAge != null && (
                      <Badge className="profile-badge badge-age">
                        🎂 {displayAge} años
                      </Badge>
                    )}
                    <Badge className="profile-badge badge-gender">
                      {displayGenderLabel}
                    </Badge>
                    <Badge className="profile-badge badge-orientation">
                      {displayOrientationLabel}
                    </Badge>
                    <Badge className="profile-badge badge-location">
                      <MapPin className="w-3 h-3" />
                      {asString(
                        currentProfile["location"],
                        isAnonymous ? "Sin ubicación" : "CDMX, México",
                      )}
                    </Badge>
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
                          <p>Score de confianza: {profileScore.score}/100</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Biografa */}
                  {SHOW_BIO_SECTION &&
                    asOptionalString(currentProfile["name"]) && (
                      <p className="text-slate-700 dark:text-white/90 mb-4 leading-relaxed">
                        {asString(currentProfile["name"], "")}
                      </p>
                    )}

                  {/* Botones de accion */}
                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                    <Button
                      onClick={() => navigate("/edit-profile-single")}
                      className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar Perfil</span>
                      <span className="sm:hidden">Editar</span>
                    </Button>

                    {/* Compartir (punto 17): un solo botón "Compartir" que abre
                        el menú con TikTok, Facebook, WhatsApp y X. El
                        botón grande "Compartir en TikTok" se quitó: dos
                        botones de compartir atascaban la fila en pantallas
                        chicas. TikTok sigue dentro del menú. */}
                    <Button
                      onClick={() => setIsShareOpen(true)}
                      className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </Button>

                    <Button
                      onClick={() => setShowReportDialog(true)}
                      className="bg-slate-900/5 hover:bg-slate-900/10 text-red-700 border border-red-400/50 dark:bg-white/10 dark:hover:bg-white/20 dark:text-red-200 dark:border-red-400/40 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Flag className="w-4 h-4" />
                      <span className="hidden sm:inline">Reportar</span>
                      <span className="sm:hidden">Report</span>
                    </Button>

                    {/* Social (puntos 2, 4 y 5): solicitud de amistad y de
                        ver fotos + bloqueo real. Solo visibles cuando se
                        ve un perfil ajeno (en el propio no se muestran);
                        el botón Reportar de arriba sigue abriendo el
                        ReportDialog existente. */}
                    <FriendRequestButton
                      profileId={profile?.id || ""}
                      profileName={displayName}
                      viewerId={user?.id || ""}
                      viewerName={displayName}
                      isOwnProfile={isOwnProfile}
                      isDemo={singleIsDemo}
                    />
                    {/* Ronda 8 (punto 14, recuperación): el perfil
                        anónimo NO tiene galería privada, así que no hay
                        nada que solicitar: el botón de acceso a fotos
                        se oculta para sus espectadores (la amistad sí
                        se pide con el botón de arriba, por flujo). */}
                    {!isAnonymous && (
                      <PhotoAccessRequestButton
                        profileId={profile?.id || ""}
                        profileName={displayName}
                        viewerId={user?.id || ""}
                        isOwnProfile={isOwnProfile}
                        isDemo={singleIsDemo}
                      />
                    )}
                    <ReportBlockButtons
                      profileId={profile?.id || ""}
                      profileName={displayName}
                      viewerId={user?.id || ""}
                      isOwnProfile={isOwnProfile}
                      isDemo={singleIsDemo}
                      showReport={false}
                      onReport={() => setShowReportDialog(true)}
                    />

                    {/* Botón único (Demo/Nombre ↔ Cuenta) con menú */}
                    {isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-full shadow-lg shadow-purple-500/30">
                            <span className="flex items-center gap-2">
                              {accountChipLabel}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        {/* RONDA 6 (punto 2): el menú se abre HACIA ARRIBA
                            (`side="top"`): hacia abajo tapaba las tarjetas
                            de estadísticas que están justo debajo de la
                            cabecera del perfil.
                            RONDA 10 (stream B, B1): el menú era TRANSPARENTE
                            en ambos temas: hereda `bg-popover` /
                            `text-popover-foreground` del DropdownMenu
                            compartido y en Tailwind v4 esos tokens no
                            resuelven (`--popover: 0 0% 100%` es un triplete
                            HSL crudo; el CSS compilado es
                            `background-color:var(--popover)`, color inválido
                            que el navegador descarta). Con el fondo
                            transparente, al abrir hacia arriba se veían a
                            través la pastilla de edad, la bio y los botones
                            ("DEMO sobre la pastilla de edad", "Ver Mi Perfil
                            sobre Editar"). Fondo SÓLIDO opaco explícito en
                            ambos temas + `sideOffset`/`collisionPadding`
                            para que no pegue al botón ni al borde. */}
                        <DropdownMenuContent
                          align="end"
                          side="top"
                          sideOffset={8}
                          collisionPadding={8}
                          className="min-w-[180px] bg-white text-slate-900 border-slate-200 shadow-xl dark:bg-slate-900 dark:text-white dark:border-white/15"
                        >
                          <DropdownMenuLabel className="text-slate-900 dark:text-white">
                            {accountChipLabel}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-white/10 dark:focus:bg-white/10 dark:focus:text-white cursor-pointer"
                            onClick={() => navigate("/profile")}
                          >
                            Ver Mi Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-white/10 dark:focus:bg-white/10 dark:focus:text-white cursor-pointer"
                            onClick={async () => {
                              if (isDemoProfile) {
                                // Habilitar logout incluso en demo
                                await signOut();
                              }
                              if (window.confirm("¿Cerrar sesión?")) {
                                try {
                                  await signOut();
                                } catch (error) {
                                  logger.error("Error during sign out:", {
                                    error,
                                  });
                                }
                                navigate("/");
                              }
                            }}
                          >
                            Cerrar Sesión
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Botón para solicitar acceso a fotos privadas.
                        Ronda 8 (punto 14): el perfil anónimo no tiene
                        galería privada: no hay nada que solicitar. */}
                    {!isAnonymous && privateImageAccess === "none" && (
                      <Button
                        onClick={handleViewPrivatePhotos}
                        disabled={isPrivateRequestBlocked()}
                        className="bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full shadow-lg"
                      >
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          Ver Fotos Privadas
                        </span>
                        <span className="sm:hidden">Privadas</span>
                      </Button>
                    )}

                    {/* Estado de solicitud pendiente */}
                    {!isAnonymous && privateImageAccess === "pending" && (
                      <Button
                        disabled
                        className="bg-white/10 text-yellow-200 border border-yellow-400/40 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                      >
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          Solicitud Pendiente
                        </span>
                        <span className="sm:hidden">Pendiente</span>
                      </Button>
                    )}

                    {/* Acceso aprobado */}
                    {!isAnonymous && privateImageAccess === "approved" && (
                      <Button
                        onClick={handleViewApprovedPrivatePhotos}
                        className="bg-white/10 hover:bg-white/20 text-green-200 border border-green-400/40 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                      >
                        <Images className="w-4 h-4" />
                        <span className="hidden sm:inline">Fotos Privadas</span>
                        <span className="sm:hidden">Privadas</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas mejoradías */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.totalViews}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Visitas
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.totalLikes}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Likes
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.totalMatches}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Matches
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileCompleteness}%
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Completo
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sección Blockchain - Perfil propio o demo */}
          {canShowBlockchainSection && (
            <Card className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  Blockchain & NFTs
                  {isDemoMode() && (
                    <Badge className="bg-yellow-500/15 text-yellow-800 border-yellow-500/50 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-400/30 text-xs">
                      DEMO
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-4">
                {/* Información de Wallet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">CMPX</span>
                    </div>
                    <div className="text-lg font-bold">
                      {tokenBalances.cmpx}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-white/70">
                      Tokens Utility
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">GTK</span>
                    </div>
                    <div className="text-lg font-bold">{tokenBalances.gtk}</div>
                    <div className="text-xs text-slate-500 dark:text-white/70">
                      Governance
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Images className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">NFTs</span>
                    </div>
                    <div className="text-lg font-bold">{userNFTs.length}</div>
                    <div className="text-xs text-slate-500 dark:text-white/70">
                      Colección
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={() => {
                      if (isDemoProfile) {
                        setIsMintModalOpen(true);
                        return;
                      }
                      navigate("/nfts");
                    }}
                    className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm px-3 py-2"
                  >
                    <Images className="w-4 h-4" />
                    Ver NFTs
                  </Button>

                  {/* Reclamar Tokens Gratuitos */}
                  {testnetInfo?.canClaim && testnetInfo?.remaining > 0 && (
                    <Button
                      onClick={handleClaimTestnetTokens}
                      disabled={isClaimingTokens}
                      className="bg-green-500/15 hover:bg-green-600/20 text-green-800 border-green-500/50 dark:bg-green-500/20 dark:hover:bg-green-600/30 dark:text-green-200 dark:border-green-400/30 flex items-center gap-2 text-sm px-3 py-2 border"
                    >
                      <Gift className="w-4 h-4" />
                      {isClaimingTokens
                        ? "Reclamando..."
                        : `Reclamar ${testnetInfo.remaining} CMPX Gratis`}
                    </Button>
                  )}

                  {/* Reclamar Tokens Diarios */}
                  {testnetInfo?.dailyRemaining > 0 && (
                    <Button
                      onClick={handleClaimDailyTokens}
                      disabled={isClaimingTokens}
                      className="bg-blue-500/10 hover:bg-blue-600/20 text-blue-700 border-blue-500/40 dark:bg-blue-500/20 dark:hover:bg-blue-600/30 dark:text-blue-200 dark:border-blue-400/30 flex items-center gap-2 text-sm px-3 py-2 border"
                    >
                      <Calendar className="w-4 h-4" />
                      {isClaimingTokens
                        ? "Reclamando..."
                        : `Reclamar ${Math.floor(testnetInfo.dailyRemaining / 1000)}K CMPX Diarios`}
                    </Button>
                  )}

                  {/* Mintear NFT */}
                  <Modal
                    isOpen={isMintModalOpen}
                    onClose={() => setIsMintModalOpen(false)}
                  >
                    <ModalBody>
                      <ModalContent>
                        <h4 className="text-lg md:text-2xl text-neutral-100 font-bold text-center mb-4">
                          Generar NFT de Perfil
                        </h4>
                        <p className="text-neutral-300 text-sm text-center mb-4">
                          En modo demo puedes mintear hasta {DEMO_MINT_LIMIT}{" "}
                          NFTs para probar el flujo.
                          <br />
                          <span className="text-purple-300 font-semibold">
                            {/* Ronda 8, punto 4: el contador es de NFTs
                              MINTEADOS POR TI, no de la colección total:
                              la colección nace con los 4 de ejemplo y el
                              tope es sobre minteados — antes decía 4/4 en
                              fresco y el modal solo ofrecía "Cerrar". */}
                            NFTs minteados por ti:{" "}
                            {countMintedDemoNFTs(userNFTs)}/{DEMO_MINT_LIMIT}
                            {" · "}
                            Colección: {userNFTs.length} NFTs
                          </span>
                        </p>
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsMintModalOpen(false);
                              window.location.href = "/nfts";
                            }}
                            className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 text-sm"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            Más información sobre NFTs
                          </Button>
                        </div>
                        {/* Ronda 7, punto 5: el footer con "Confirmar
                          Mint" + DEMO + "Cerrar" era HERMANO de
                          ModalContent (la caja con fondo, max-w-md y
                          overflow), no hijo: los botones se renderizaban
                          FUERA de la caja, flotando sobre la página. La
                          ronda 6 ajustó el tamaño de ModalContent, pero
                          el footer nunca estuvo dentro de ella. Ahora el
                          footer vive dentro de ModalContent. */}
                        <ModalFooter className="gap-4">
                          {countMintedDemoNFTs(userNFTs) >= DEMO_MINT_LIMIT ? (
                            <div className="w-full text-center">
                              <p className="text-yellow-300 text-sm mb-2">
                                🎉 Has alcanzado el límite de {DEMO_MINT_LIMIT}{" "}
                                NFTs minteados en modo demo
                              </p>
                              <Button
                                onClick={() => setIsMintModalOpen(false)}
                                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/25"
                              >
                                Cerrar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <NFTMintButton
                                userId={
                                  user?.id ||
                                  asString(
                                    currentProfile["user_id"],
                                    currentProfile.id,
                                  )
                                }
                                type="single"
                                nftName={`Profile NFT #${userNFTs.length + 1}`}
                                nftDescription="NFT demo de perfil"
                                demoImageUrl={avatarUrl}
                                buttonText="Confirmar Mint"
                                onMintSuccess={async () => {
                                  const uid =
                                    user?.id ||
                                    asOptionalString(
                                      currentProfile["user_id"],
                                    ) ||
                                    currentProfile.id;
                                  if (!uid) return;
                                  const updated = await nftService
                                    .getUserNFTs(uid)
                                    .catch(() => []);
                                  setUserNFTs(updated);
                                  toast({
                                    title: "¡NFT minteado exitosamente!",
                                    description: `Colección: ${updated.length} NFTs (${countMintedDemoNFTs(updated)}/${DEMO_MINT_LIMIT} minteados)`,
                                  });
                                  if (
                                    countMintedDemoNFTs(updated) >=
                                    DEMO_MINT_LIMIT
                                  ) {
                                    setTimeout(
                                      () => setIsMintModalOpen(false),
                                      1500,
                                    );
                                  }
                                }}
                                className="w-full"
                              />
                              <Button
                                onClick={() => setIsMintModalOpen(false)}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/25"
                              >
                                Cerrar
                              </Button>
                            </>
                          )}
                        </ModalFooter>
                      </ModalContent>
                    </ModalBody>
                  </Modal>

                  <Modal
                    isOpen={showPrivateBlockedModal}
                    onClose={() => setShowPrivateBlockedModal(false)}
                  >
                    <ModalBody>
                      <ModalContent>
                        <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-6">
                          Acceso bloqueado por intentos
                        </h4>
                        <div className="py-2 max-w-xl mx-auto text-center text-white/85 space-y-2">
                          <p className="text-sm">
                            Detectamos múltiples solicitudes consecutivas. Para
                            prevenir hostigamiento, se bloqueó temporalmente el
                            envío de solicitudes.
                          </p>
                          <p className="text-xs opacity-70">
                            Bloqueo actual:{" "}
                            {Math.round(blockedDurationMs / (60 * 60 * 1000))}h.
                            Reincidencia duplica hasta 24h (suspensión
                            preventiva).
                          </p>
                        </div>
                        {/* Mismo defecto que el modal de Mint (punto 5):
                          el footer flotaba fuera de la caja. */}
                        <ModalFooter className="gap-4">
                          <button
                            className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm"
                            onClick={() => setShowPrivateBlockedModal(false)}
                            type="button"
                          >
                            Entendido
                          </button>
                        </ModalFooter>
                      </ModalContent>
                    </ModalBody>
                  </Modal>

                  <button
                    className="bg-purple-500/10 hover:bg-purple-600/20 text-purple-700 border-purple-500/40 dark:bg-purple-500/20 dark:hover:bg-purple-600/30 dark:text-purple-200 dark:border-purple-400/30 flex items-center gap-2 text-sm px-3 py-2 border rounded-md"
                    onClick={() => setIsMintModalOpen(true)}
                  >
                    <Camera className="w-4 h-4" />
                    Mintear NFT de Perfil
                  </button>
                </div>

                {/* Información de Testnet */}
                {testnetInfo && (
                  <div className="p-3 bg-slate-900/5 dark:bg-white/5 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Estado Testnet Mumbai
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-white/70">
                          Tokens Gratuitos:
                        </span>
                        <div className="font-medium">
                          {testnetInfo.claimed || 0} /{" "}
                          {testnetInfo.maxClaim || 1000} CMPX
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-white/70">
                          Tokens Diarios:
                        </span>
                        <div className="font-medium">
                          {Math.floor((testnetInfo.dailyClaimed || 0) / 1000)}K
                          /{" "}
                          {Math.floor(
                            (testnetInfo.dailyLimit || 2500000) / 1000,
                          )}
                          K CMPX
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de NFTs */}
                {userNFTs.length > 0 && (
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Images className="w-4 h-4 text-purple-400" />
                          Mis NFTs ({userNFTs.length})
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          🎨 Tokens únicos que representan tu perfil en
                          blockchain
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (isDemoProfile) {
                              setIsMintModalOpen(true);
                              return;
                            }
                            navigate("/nfts");
                          }}
                          className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white text-xs shadow-lg hover:shadow-purple-500/50 transition-all"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Crear NFT
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (isDemoProfile) {
                              setIsMintModalOpen(true);
                              return;
                            }
                            navigate("/nfts");
                          }}
                          className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Saber más →
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 min-w-0">
                      {userNFTs.slice(0, 4).map((nft, index) => (
                        <div
                          key={nft.id || index}
                          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-all cursor-pointer group min-w-0"
                        >
                          <div className="aspect-square rounded mb-2 overflow-hidden relative">
                            {nft.image ? (
                              <SafeImage
                                src={nft.image}
                                alt={`NFT #${nft.token_id}`}
                                className="w-full h-full group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                                <Images className="w-8 h-8 text-white/40" />
                              </div>
                            )}
                            <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                              #{nft.token_id}
                            </div>
                            {/*
                              Ronda 11 (stream D, punto v): la píldora CMPX
                              estaba arriba a la izquierda y tapaba el
                              texto "Cómplices Conecta" del arte del NFT.
                              Baja a la esquina inferior con un degradado
                              para que siga legible sin tapar el arte.
                            */}
                            <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/70 to-transparent pointer-events-none" />
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {nft.value ? `${nft.value} CMPX` : ""}
                            </div>
                          </div>
                          <div className="text-xs min-w-0">
                            {/* RONDA 11 (stream B, B8): el título era `truncate`
                                y "Cómplice Legendario" se veía como
                                "Cómplice Leg…" en la lista de 4 columnas.
                                La rejilla "Mis NFTs" muestra el título
                                completo: aquí ahora envuelve hasta 2
                                líneas (`line-clamp-2`) en vez de cortarse. */}
                            <div
                              className="font-medium line-clamp-2"
                              title={nft.name || `NFT #${nft.token_id}`}
                            >
                              {nft.name || `NFT #${nft.token_id}`}
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-1 min-w-0">
                              <span
                                className={`text-[10px] capitalize shrink-0 ${
                                  nft.rarity === "legendary"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : nft.rarity === "epic"
                                      ? "text-purple-600 dark:text-purple-400"
                                      : nft.rarity === "rare"
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-500 dark:text-gray-400"
                                }`}
                              >
                                {nft.rarity || "Común"}
                              </span>
                              {nft.chain && (
                                <span className="text-slate-400 dark:text-white/50 text-[9px] truncate min-w-0">
                                  {nft.chain}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-white/60">
                      <span>
                        Colección:{" "}
                        {userNFTs[0]?.collection || "CómplicesConecta"}
                      </span>
                      <span>
                        {userNFTs.length} NFTs · {countMintedDemoNFTs(userNFTs)}
                        /{DEMO_MINT_LIMIT} minteados
                      </span>
                    </div>
                    {userNFTs.length > 4 && (
                      <div className="text-center mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (isDemoProfile) {
                              setIsMintModalOpen(true);
                              return;
                            }
                            navigate("/nfts");
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
                        >
                          Ver todos (+{userNFTs.length - 4} más)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumen rápido de Wallet & NFTs.
              Ronda 8 (punto 14): el perfil anónimo no tiene billetera
              ni NFTs: se oculta el resumen. */}
          {!isAnonymous && (
            <Card
              id="wallet"
              className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl"
            >
              <CardContent className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-white/70">
                      Estado de cuenta NFT
                    </p>
                    <p className="text-xs sm:text-sm text-white">
                      CMPX:{" "}
                      <span className="font-semibold">
                        {tokenBalances.cmpx}
                      </span>
                      <span className="mx-2 text-white/40">·</span>
                      NFTs:{" "}
                      <span className="font-semibold">{userNFTs.length}</span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (isOwnProfile || isDemoProfile) {
                      navigate("/tokens");
                      return;
                    }

                    if (typeof window !== "undefined") {
                      window.location.hash = "wallet";
                      document.getElementById("wallet")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg shadow-purple-500/40 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>
                    {isOwnProfile || isDemoProfile
                      ? "Gestionar mis Tokens"
                      : "Verificando activos..."}
                  </span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sobre mí - modelo del video (espejo de pareja, 1 usuario) */}
          <SingleAboutSection member={singleAbout} isDemoMode={singleIsDemo} />

          {/* Preferencias */}
          <SinglePreferencesSection
            name={singleAbout.name}
            likes={singleLikes}
            dependsOn={[]}
          />

          {/* Buscamos + Situación sentimental + Me gusta / No me gusta */}
          <SingleLookingForSection
            lookingFor={singleLookingFor}
            ageRange={singleAgeRange}
            relationshipStatus={singleRelationshipStatus}
            likes={singleLikes}
            dislikes={singleDislikes}
          />

          {/* Suscripción y saldo: en demo se lee el saldo PERSISTIDO
              (ronda 7, punto 8), no la constante 1250/850: tras
              reclamar 100 CMPX en /tokens, esta tarjeta debe decir
              1350. El re-render llega por el listener de
              demo-wallet-changed, que recarga tokenBalances. */}
          <SingleSubscriptionCard
            isPremium={currentProfile.is_premium ?? false}
            isDemoMode={singleIsDemo}
            cmpx={
              singleIsDemo
                ? String(getDemoWalletBalance("single").cmpx)
                : tokenBalances.cmpx
            }
            gtk={
              singleIsDemo
                ? String(getDemoWalletBalance("single").gtk)
                : tokenBalances.gtk
            }
            nftCount={userNFTs.length}
            isOwnProfile={isOwnProfile}
            onManage={() => navigate("/tokens")}
          />

          {/* Privacidad - solo perfil propio (en demo el perfil demo es propio) */}
          {(isOwnProfile || singleIsDemo) && (
            <SinglePrivacySection
              userId={user?.id ?? profile?.id ?? ""}
              isDemoMode={singleIsDemo}
              isAnonymous={isAnonymous}
            />
          )}

          {/* Amistades (punto 2) + ajustes sociales: visibilidad
              público/privado y geolocalización (puntos 3 y 4). */}
          <FriendsSection
            profileId={profile?.id ?? ""}
            profileName={displayName}
            isOwnProfile={isOwnProfile}
            isDemo={singleIsDemo}
          />
          {(isOwnProfile || singleIsDemo) && (
            <ProfileSocialSettings
              userId={user?.id ?? profile?.id ?? ""}
              profileType="single"
              isDemo={singleIsDemo}
              // Ronda 10 (stream A, punto A1): el anónimo nace
              // privado; sin visibilidad guardada, el select arranca
              // en "🔒 Privado".
              isAnonymous={isAnonymous}
            />
          )}

          {/* Demo Wallet - solo demo, tras la información del perfil.
              El uid es el MISMO que usan el modal de mint y
              loadBlockchainData (user.id, luego user_id del perfil):
              antes era `profile?.id` y DemoWallet leía/escribía
              `demo_nfts:<profile.id>` mientras el mint escribía
              `demo_nfts:<user.id>` — dos colecciones distintas y el
              contador de Wallet decía 1 mientras el perfil decía 0
              (ronda 7, punto 9).
              Ronda 8 (punto 14): el perfil anónimo no tiene wallet
              demo ni staking (170 GTK / 35% APY de Sofía). */}
          {isDemoProfile && !isAnonymous && (
            <DemoWallet
              userId={
                user?.id ||
                asOptionalString(currentProfile["user_id"]) ||
                currentProfile.id ||
                ""
              }
              accountType="single"
            />
          )}

          {/* Publicaciones - después de la información del perfil.
              El post de ejemplo es de Ana, no de Sofía: showExamplePost
              en false para que la pestaña no muestre el post de Ana ni
              su vacío contradictorio (punto 13).
              Ronda 8 (punto 14): el perfil anónimo NO puede publicar
              posts (solo crear reseñas) ni mintear NFTs: se ocultan
              "Crear Post" y "Crear NFT" en ProfileContent.
              Ronda 9 (stream A, puntos 1 y 6): el perfil anónimo tiene
              galería LIMITADA propia (isAnonymous) y aviso de
              expiración/conversión: 30 días desde su creación; al
              expirar, o se verifica (World ID / KYC) o se pierde el
              acceso completo. La billetera ya está desactivada
              (sin compra/recibo de CMPX, sin recompensas, sin staking)
              hasta verificar. */}
          {isOwnProfile && isAnonymous && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 sm:p-5 text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Cuenta anónima
                {anonymousExpiry.expiresAtMs !== null &&
                  !anonymousExpiry.expired &&
                  ` · expira en ${anonymousExpiry.daysRemaining} ${anonymousExpiry.daysRemaining === 1 ? "día" : "días"}`}
                {anonymousExpiry.expired && " · expirada"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-white/70">
                Tu cuenta anónima dura 30 días. Verifica tu perfil (World ID /
                KYC) para desbloquear todo: billetera, chat sin límites, galería
                completa y reseñas. Sin verificar, no puedes comprar ni recibir
                CMPX, ni ganar recompensas ni hacer staking.
              </p>
              {/* Ronda 10 (stream A, punto A6): cuenta atrás de los
                  accesos a la galería limitada ya concedidos (24 h
                  desde la aceptación). Sin accesos vigentes, no se
                  muestra nada: no hay nada que contar. */}
              {grantedGalleryAccess.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-400/30 bg-black/20 p-3">
                  <p className="font-semibold text-amber-100">
                    Acceso a tu galería limitada
                  </p>
                  <ul className="mt-1 space-y-1 text-white/80">
                    {grantedGalleryAccess.map((access) => (
                      <li key={access.viewerId}>
                        {access.viewerName} ·{" "}
                        {/* Ronda 11 (stream A, 1f): cuenta atrás EN VIVO
                            (1 s, HH:MM:SS) en vez del texto "23 h 12 min"
                            que solo cambiaba cada minuto. */}
                        <LiveCountdown
                          remainingMs={access.remainingMs}
                          onExpire={() => setGalleryAccessNowMs(Date.now())}
                        />{" "}
                        · expira a las 24 h de concedido
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                onClick={() => navigate("/edit-profile-single")}
                className="mt-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-full"
              >
                Completar mi perfil para verificarme
              </Button>
            </div>
          )}
          <div className="pt-4">
            <ProfileContent
              isOwnProfile={isOwnProfile}
              onUploadImage={handleUploadImage}
              onDeletePost={handleDeletePost}
              onCommentPost={handleCommentPost}
              showExamplePost={false}
              allowCreatePost={!isAnonymous}
              allowNft={!isAnonymous}
              isAnonymous={isAnonymous}
              // Ronda 10 (stream A, punto A6): quién ve la galería
              // limitada y de quién es, para la cuenta atrás del
              // acceso concedido (24 h).
              galleryViewerId={user?.id ?? ""}
              galleryOwnerId={profile?.id ?? ""}
            />
          </div>

          {/* Experiencias demo: eventos, registro rápido y verificación KYC */}
          <Card className="bg-black/60 backdrop-blur-xl border border-purple-500/30 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximas experiencias lifestyle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EventsCarousel />
              <div className="grid gap-4 lg:grid-cols-2">
                <ComplianceSignupForm />
                <div className="space-y-4">
                  <FileUpload />
                  <Modal
                    isOpen={isVipModalOpen}
                    onClose={() => setIsVipModalOpen(false)}
                  >
                    <ModalBody>
                      <ModalContent>
                        <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-8">
                          Reserva tu Experiencia VIP
                        </h4>
                        <div className="py-10 flex flex-wrap gap-x-4 gap-y-6 items-start justify-center max-w-sm mx-auto text-neutral-300">
                          <p className="text-center">
                            Accede a eventos exclusivos, fiestas privadas y
                            matchmaking prioritario.
                          </p>
                          {/* TODO: Inyectar aquí el contenido actual de VipBookingModal si se quiere reutilizar texto al 100% */}
                        </div>
                        {/* Mismo defecto que el modal de Mint (punto 5):
                          el footer flotaba fuera de la caja. */}
                        <ModalFooter className="gap-4">
                          <button
                            className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm"
                            onClick={() => setIsVipModalOpen(false)}
                          >
                            Cancelar
                          </button>
                          <button className="bg-purple-600 text-white text-sm px-4 py-2 rounded-md hover:bg-purple-700">
                            Solicitar Acceso
                          </button>
                        </ModalFooter>
                      </ModalContent>
                    </ModalBody>
                  </Modal>

                  <button
                    className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 rounded-xl py-3 shadow-lg hover:scale-[1.02] transition-all"
                    onClick={() => setIsVipModalOpen(true)}
                  >
                    <Calendar className="w-4 h-4" />
                    Ver opciones VIP demo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Galería */}
          <Card className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                <Images className="w-5 h-5" />
                Galería de Fotos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10">
              {/* Mostrar mensaje de acceso denegado si corresponde.
                  Ronda 8 (punto 14): sin galería privada en anónimo. */}
              {!isAnonymous && privateImageAccess === "denied" && (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Acceso Denegado
                  </h3>
                  <p className="text-slate-600 dark:text-white/70">
                    Tu solicitud para ver las fotos privadas fue denegada.
                  </p>
                </div>
              )}

              {/* Galería pública siempre visible. Sin botón de descarga
                  para visitantes (menú contextual y arrastre bloqueados);
                  la marca de agua se aplica si el dueño la tiene activa
                  en Privacidad. El dueño sí puede gestionar sus fotos. */}
              <ProtectedMedia
                isOwner={isOwnProfile}
                watermark={profilePrivacy.watermark}
                watermarkText={displayName}
                className="mb-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                  {SOFIA_PUBLIC_PHOTOS_LIST.map((src, idx) => (
                    <div
                      key={src}
                      className={`aspect-square bg-linear-to-br ${SOFIA_PUBLIC_TILE_GRADIENTS[idx] ?? "from-purple-400 to-blue-600"} rounded-lg flex items-center justify-center overflow-hidden`}
                    >
                      <button
                        type="button"
                        className="w-full h-full"
                        onClick={() =>
                          openImageModal(SOFIA_PUBLIC_PHOTOS_FULL_LIST, idx)
                        }
                      >
                        <SafeImage
                          src={src}
                          alt={`Foto pública ${idx + 1}`}
                          className="w-full h-full"
                        />
                      </button>
                    </div>
                  ))}
                </div>
                {SOFIA_PUBLIC_PHOTOS_LIST.length === 0 && (
                  <p className="text-center text-sm text-slate-500 dark:text-white/60 py-8">
                    Sin fotos públicas aún
                  </p>
                )}
              </ProtectedMedia>

              {/* Galería privada mejorada con carrusel.
                  Ronda 8 (punto 14): el perfil anónimo no tiene galería
                  privada (ni las 58 fotos de Sofía ni su PIN 1234). */}
              {!isAnonymous && (
                <div
                  className="mb-6"
                  ref={privateGalleryRef}
                  id="private-gallery"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Fotos Privadas ({galleryImages.length})
                    </h4>
                    {/* Colapsar/expandir (punto 14): la galería carga
                      colapsada; el botón la expande sin desbloquearla
                      (las fotos siguen borrosas/bloqueadas hasta el PIN). */}
                    <button
                      type="button"
                      onClick={() => setPrivateGalleryOpen((prev) => !prev)}
                      aria-expanded={privateGalleryOpen}
                      className="h-8 px-3 text-xs rounded-full flex items-center gap-1.5 bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 border border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 transition-all"
                    >
                      {privateGalleryOpen ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Ocultar fotos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Ver fotos ({galleryImages.length})
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {import.meta.env.PROD &&
                        isOwnProfile &&
                        !isGalleryUnlocked && (
                          <Button
                            onClick={handleBiometricUnlock}
                            disabled={isBiometricUnlocking}
                            className="h-8 px-3 text-xs rounded-full flex items-center gap-1.5 bg-emerald-500/80 hover:bg-emerald-600/80 text-white transition-all min-w-[110px] justify-center"
                          >
                            <Unlock className="w-3 h-3" />
                            {isBiometricUnlocking
                              ? "Validando..."
                              : "Biométrico"}
                          </Button>
                        )}
                      <Button
                        onClick={() => {
                          if (isGalleryUnlocked) {
                            // BLOQUEAR manual: quitar blur y candado
                            setIsParentalLocked(true);
                            setShowParentalUnlock(false);
                            setDemoPrivateUnlocked(false);
                            setShowImageModal(false);
                            clearUnlock();
                          } else {
                            // DESBLOQUEAR: activar ParentalControl para ingresar PIN
                            setIsParentalLocked(true);
                            setShowParentalUnlock(true);
                          }
                        }}
                        className={`h-8 px-3 text-xs rounded-full flex items-center gap-1.5 transition-all min-w-[110px] justify-center ${
                          isGalleryUnlocked
                            ? "bg-red-600/80 hover:bg-red-700/80 text-white"
                            : "bg-purple-600/80 hover:bg-purple-700/80 text-white"
                        }`}
                      >
                        {isGalleryUnlocked ? (
                          <>
                            <Lock className="w-3 h-3" />
                            Bloquear
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            Desbloquear
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* SECCIÓN GALERÍA PRIVADA CORREGIDA — colapsada por
                    defecto (punto 14): antes el carrusel renderizaba los
                    58 ítems expandidos al cargar el perfil. */}
                  <div className="mb-4">
                    <p className="text-slate-500 dark:text-white/60 text-xs mb-2">
                      🔒 Galería Privada (requiere desbloqueo con PIN)
                    </p>
                    {!privateGalleryOpen ? (
                      <p className="text-slate-400 dark:text-white/50 text-xs">
                        {galleryImages.length} fotos privadas colapsadas. Toca
                        "Ver fotos" para expandir la galería.
                      </p>
                    ) : (
                      <Carousel
                        className="mt-4"
                        opts={{ align: "start", loop: false }}
                      >
                        <CarouselContent>
                          {galleryImages.map(
                            (img: PrivateImageItem | string, idx: number) => {
                              const imageSource =
                                typeof img === "string"
                                  ? img
                                  : (img.url ?? img.src ?? "");
                              return (
                                <CarouselItem
                                  key={idx}
                                  className="basis-1/2 sm:basis-1/3 md:basis-1/4"
                                >
                                  <div
                                    className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                                    onClick={() => {
                                      // Si el control parental está bloqueado, abrir
                                      // la pantalla del PIN (perfil propio) o el
                                      // flujo de solicitud (visitante).
                                      if (isParentalLocked) {
                                        if (isOwnProfile) {
                                          setShowParentalUnlock(true);
                                        } else {
                                          setShowPrivateImageRequest(true);
                                        }
                                        return;
                                      }

                                      // Si ya está desbloqueado, abrir carrusel
                                      if (isGalleryUnlocked) {
                                        const resolved = galleryImages
                                          .map((g) =>
                                            typeof g === "string"
                                              ? g
                                              : (g.url ?? g.src ?? ""),
                                          )
                                          .filter(
                                            (u): u is string =>
                                              typeof u === "string" &&
                                              u.length > 0,
                                          );
                                        openImageModal(resolved, idx);
                                        return;
                                      }

                                      // CASO 1: Perfil propio (demo o real)
                                      // Al hacer click, activar el control parental para pedir PIN
                                      if (isOwnProfile) {
                                        setIsParentalLocked(true);
                                        setShowParentalUnlock(true);
                                        return;
                                      }

                                      // CASO 2: Otros usuarios (vista sin acceso)
                                      // Mostrar modal de solicitud de acceso legal
                                      setShowPrivateImageRequest(true);
                                    }}
                                  >
                                    <img
                                      src={imageSource}
                                      alt="Private content"
                                      {...noDownloadProps(isOwnProfile)}
                                      onError={(e) => {
                                        // C6: sin fallback a la imagen privada
                                        // pública; solo al placeholder genérico,
                                        // y sin reintentar si ya es el placeholder.
                                        const img =
                                          e.currentTarget as HTMLImageElement;
                                        if (
                                          !img.src.endsWith(
                                            PRIVATE_MEDIA_PLACEHOLDER,
                                          )
                                        ) {
                                          img.src = PRIVATE_MEDIA_PLACEHOLDER;
                                        }
                                      }}
                                      className={cn(
                                        "w-full h-full object-cover transition-[filter,transform] duration-500",
                                        isGalleryUnlocked
                                          ? "blur-0 scale-100"
                                          : "blur-3xl scale-110",
                                      )}
                                    />

                                    {/* Marca de agua de la galería privada:
                                    solo si el dueño la tiene activa en
                                    Privacidad (antes salía siempre). */}
                                    {isGalleryUnlocked &&
                                      profilePrivacy.watermark && (
                                        <div className="absolute inset-0 pointer-events-none select-none">
                                          <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-1 text-[10px] font-semibold text-white border border-white/20">
                                            ComplicesConecta
                                          </div>
                                          <div className="absolute inset-0 flex items-center justify-center opacity-15">
                                            <div className="text-white text-3xl font-bold -rotate-45">
                                              CÓMPLICES
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    {!isGalleryUnlocked && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-purple-950/90 via-purple-900/85 to-blue-950/90 backdrop-blur-sm transition-all duration-500 group-hover:from-purple-950/95 group-hover:via-purple-900/90 group-hover:to-blue-950/95">
                                        <div className="bg-white/20 p-4 rounded-2xl border-2 border-white/30 shadow-2xl backdrop-blur-md">
                                          <Lock className="w-8 h-8 text-white drop-shadow-lg" />
                                        </div>
                                        <span className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold text-white bg-white/20 border-2 border-white/40 shadow-lg backdrop-blur-md">
                                          {isParentalLocked
                                            ? "🔒 Bloqueado por Control Parental"
                                            : isOwnProfile
                                              ? "👆 Click para desbloquear (requiere PIN)"
                                              : "🔒 Contenido Privado"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </CarouselItem>
                              );
                            },
                          )}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                      </Carousel>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestor de solicitudes de acceso a galería privada (solo para propietario).
              Ronda 8 (punto 14): el perfil anónimo no tiene galería
              privada: tampoco hereda las 2 solicitudes mock de Sofía
              (María García / Carlos López). */}
          {isOwnProfile && !isAnonymous && (
            <div className="mb-6">
              <PrivateImageRequestsManager
                profileId={profile?.id || ""}
                profileName={asString(profile?.["name"], displayName)}
                onAccessGranted={(requesterId) => {
                  logger.info("Acceso Concedido a Galería Privada", {
                    requesterId,
                  });
                }}
                onAccessDenied={(requesterId) => {
                  logger.info("Acceso Denegado a Galería Privada", {
                    requesterId,
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de solicitud de acceso a fotos privadas */}
      {showPrivateImageRequest && (
        <PrivateImageRequest
          isOpen={showPrivateImageRequest}
          onClose={() => setShowPrivateImageRequest(false)}
          profileId={profile?.id || ""}
          profileName={asString(profile?.["name"], displayName)}
          profileType="single"
          onRequestSent={() => {
            const guard = registerPrivateRequestSent();
            setShowPrivateImageRequest(false);

            if (guard.blocked) {
              setBlockedDurationMs(guard.durationMs);
              setShowPrivateBlockedModal(true);
              return;
            }

            setPrivateImageAccess("pending");
            setPrivateDecisionRequesterName("Solicitante");
            setShowPrivateDecisionModal(true);
          }}
        />
      )}

      {/* Control Parental - SOLO para perfil propio.
          Ronda 8 (punto 14): el perfil anónimo no tiene galería
          privada ni PIN (el PIN demo 1234 era de Sofía). */}
      {isOwnProfile && !isAnonymous && (
        <ParentalControl
          isLocked={isParentalLocked}
          showLockScreen={showParentalUnlock}
          // Cerrar sin desbloquear (X, Escape, clic en el fondo): sin
          // onClose el modal no ofrecía ninguna salida salvo el PIN.
          onClose={() => setShowParentalUnlock(false)}
          onToggle={(locked) => {
            setIsParentalLocked(locked);
            // Si se desbloquea, permitir acceso a imágenes privadas
            if (!locked) {
              setDemoPrivateUnlocked(true);
              setShowParentalUnlock(false);
              persistUnlock();
            } else {
              // Si se bloquea, ocultar imágenes privadas
              setDemoPrivateUnlocked(false);
              setShowParentalUnlock(false);
              clearUnlock();
            }
          }}
          onUnlock={() => {
            // Callback cuando se desbloquea exitosamente con PIN
            setDemoPrivateUnlocked(true);
            setShowParentalUnlock(false);
            persistUnlock();
          }}
        />
      )}

      {/* El botón "Desbloquear" flotante (`fixed top-20 right-4`) se
          eliminó: tapaba contenido y el toggle de tema al hacer scroll.
          El desbloqueo vive en el botón en flujo del encabezado de la
          galería privada ("Fotos Privadas"), que abre la pantalla del
          PIN. */}

      {/* Modal de carrusel de imágenes */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          if (!isOwnProfile && temporaryPrivateAccess) {
            setTemporaryPrivateAccess(false);
            setPrivateImageAccess("none");
          }
        }}
        images={
          modalImages.length > 0
            ? modalImages
            : galleryImages.map((img) =>
                typeof img === "string" ? img : (img.url ?? img.src ?? ""),
              )
        }
        currentIndex={selectedImageIndex}
        onNavigate={navigateCarousel}
        onLike={handleImageLike}
        onComment={handleAddComment}
        isPrivate
        isBlurred={!isGalleryUnlocked}
      />

      <Modal
        isOpen={showPrivateDecisionModal}
        onClose={() => setShowPrivateDecisionModal(false)}
      >
        <ModalBody>
          <ModalContent>
            <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-6">
              Solicitud de acceso a galería privada
            </h4>
            <div className="py-2 max-w-xl mx-auto text-center text-white/85">
              <p className="text-sm">
                {privateDecisionRequesterName} solicita acceso a tu galería.
              </p>
              <p className="text-xs opacity-70 mt-2">
                En demo este flujo se simula para validar UX.
              </p>
            </div>
            {/* Mismo defecto que el modal de Mint (punto 5): el footer
              flotaba fuera de la caja. */}
            <ModalFooter className="gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm"
                onClick={() => {
                  setPrivateImageAccess("denied");
                  setShowPrivateDecisionModal(false);
                  setShowPrivateDeniedModal(true);
                }}
                type="button"
              >
                Denegar
              </button>
              <button
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-md hover:bg-purple-700"
                onClick={() => {
                  clearPrivateRequestAttempts();
                  resetPrivateBlock();
                  setPrivateImageAccess("approved");
                  setTemporaryPrivateAccess(true);
                  setShowPrivateDecisionModal(false);
                  setTimeout(() => {
                    const resolved = galleryImages
                      .map((g) =>
                        typeof g === "string" ? g : (g.url ?? g.src ?? ""),
                      )
                      .filter(
                        (u): u is string =>
                          typeof u === "string" && u.length > 0,
                      );
                    openImageModal(resolved, 0);
                  }, 50);
                }}
                type="button"
              >
                Confirmar
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={showPrivatePolicyModal}
        onClose={() => setShowPrivatePolicyModal(false)}
      >
        <ModalBody>
          <ModalContent>
            <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-6">
              Solicitud de galería privada
            </h4>
            <div className="py-2 max-w-xl mx-auto text-center text-white/85 space-y-2">
              <p className="text-sm">
                Para acceder a contenido privado debes enviar una solicitud.
              </p>
              <p className="text-xs opacity-70">
                Si envías 3+ solicitudes seguidas, el botón se bloqueará 2
                horas. Si reincides, el bloqueo se duplica hasta 24 horas.
              </p>
              <p className="text-xs opacity-70">
                Al aprobarse, el acceso es temporal: al cerrar la galería
                deberás solicitar de nuevo.
              </p>
            </div>
            {/* Mismo defecto que el modal de Mint (punto 5): el footer
              flotaba fuera de la caja. */}
            <ModalFooter className="gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm"
                onClick={() => setShowPrivatePolicyModal(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-md hover:bg-purple-700"
                onClick={() => {
                  setShowPrivatePolicyModal(false);
                  setShowPrivateImageRequest(true);
                }}
                type="button"
              >
                Continuar
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={showPrivateDeniedModal}
        onClose={() => setShowPrivateDeniedModal(false)}
      >
        <ModalBody>
          <ModalContent>
            <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-6">
              Solicitud denegada
            </h4>
            <div className="py-2 max-w-xl mx-auto text-center text-white/85 space-y-2">
              <p className="text-sm">
                El dueño del perfil denegó tu solicitud. No se mostrará la
                galería privada.
              </p>
              <p className="text-xs opacity-70">
                Respeta la decisión. Solicitudes insistentes pueden bloquear tu
                acceso temporalmente.
              </p>
            </div>
            {/* Mismo defecto que el modal de Mint (punto 5): el footer
              flotaba fuera de la caja. */}
            <ModalFooter className="gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm"
                onClick={() => setShowPrivateDeniedModal(false)}
                type="button"
              >
                Entendido
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={isPostCommentModalOpen}
        onClose={() => setIsPostCommentModalOpen(false)}
      >
        <ModalBody>
          <ModalContent>
            <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-6">
              Comentar post
            </h4>
            <div className="py-2 max-w-xl mx-auto space-y-4">
              <Input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="bg-black/30 border-white/10 text-white placeholder:text-white/50"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                {commentDraft.length}/280
              </p>
            </div>
            {/* Mismo defecto que el modal de Mint (punto 5): el footer
              flotaba fuera de la caja. */}
            <ModalFooter className="gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm"
                onClick={() => setIsPostCommentModalOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                type="button"
                disabled={!commentDraft.trim() || commentDraft.length > 280}
                onClick={() => {
                  if (!commentPostId) return;
                  logger.info("Comentario de post enviado (demo)", {
                    postId: commentPostId,
                    length: commentDraft.trim().length,
                  });
                  toast({
                    title: "Comentario enviado",
                    description:
                      "Tu comentario se registró (DEMO). En producción se guardará en backend.",
                  });
                  setIsPostCommentModalOpen(false);
                  setCommentPostId(null);
                  setCommentDraft("");
                }}
              >
                Enviar
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalBody>
      </Modal>

      {/* Modal de reporte */}
      <ReportDialog
        isOpen={showReportDialog}
        onOpenChange={setShowReportDialog}
        profileId={profile?.id || ""}
        profileName={asString(profile?.["name"], displayName)}
        onReport={(reason) => {
          logger.info("Reporte enviado desde perfil single", { reason });
        }}
      />

      {/* Menú "Compartir" (punto 17): TikTok, Facebook, WhatsApp y X. */}
      <ShareProfile
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        profileId={String(currentProfile.id)}
        profileName={displayName}
      />
    </div>
  );
};

export default ProfileSingle;
