import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MapPin,
  Verified,
  Crown,
  Settings,
  Share2,
  Lock,
  Unlock,
  Images,
  Flag,
  Coins,
  Wallet,
  Users,
  ShieldCheck,
  Eye,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ShareProfile } from "@/components/profiles/shared/ShareProfile";
import {
  DEMO_COUPLE_CARMEN_ROBERTO,
  DEMO_COUPLE_IMAGES,
} from "@/demo/demoData";
import { toast } from "sonner";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import type { CoupleProfileWithPartners } from "@/services/social/couple/CoupleProfilesService";
import { generateMockCoupleProfiles } from "@/fixtures/coupleProfiles";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { computeProfileCompleteness } from "@/lib/profileCompleteness";
import { deriveOrientationLabel } from "@/lib/profileLabels";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useProfileScore } from "@/features/profile/useProfileScore";
import { VanishSearchInput } from "@/components/ui/vanish-search-input";
import {
  WalletService,
  walletService,
} from "@/services/payments/WalletService";
import {
  nftService,
  seedDemoNFTs,
  DEMO_NFTS_CHANGED_EVENT,
  DEMO_MINT_LIMIT,
  countMintedDemoNFTs,
} from "@/services/payments/NFTService";
import {
  getDemoWalletBalance,
  DEMO_WALLET_CHANGED_EVENT,
} from "@/lib/demo-wallet";
import { cn } from "@/shared/lib/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useBiometricAuth } from "@/features/auth/useBiometricAuth";
import type { Database } from "@/types/supabase-generated";
import { ImageModal } from "@/components/profiles/shared/ImageModal";
import { ParentalControl } from "@/components/profiles/shared/ParentalControl";
import { PrivateImageRequest } from "@/components/profiles/shared/PrivateImageRequest";
import { ProfileContent } from "@/components/profiles/ProfileContent";
import { DemoWallet } from "@/components/wallet/DemoWallet";
import {
  PRIVATE_MEDIA_PLACEHOLDER,
  toPrivateStoragePath,
  usePrivateMediaUrls,
} from "@/lib/storage/private-media";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoupleAboutSection } from "@/components/profiles/couple/CoupleAboutSection";
import type { CoupleAboutMember } from "@/components/profiles/couple/CoupleAboutSection";
import { CouplePreferencesSection } from "@/components/profiles/couple/CouplePreferencesSection";
import type { CoupleMemberPreferences } from "@/components/profiles/couple/CouplePreferencesSection";
import { CoupleLookingForSection } from "@/components/profiles/couple/CoupleLookingForSection";
import { CoupleSubscriptionCard } from "@/components/profiles/couple/CoupleSubscriptionCard";
import { CouplePrivacySection } from "@/components/profiles/couple/CouplePrivacySection";
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
// reportar/bloquear y solicitudes de amistad/fotos (espejo de Single).
import { NationalityBadge } from "@/components/profiles/shared/NationalityBadge";
import { isAnonymousDemoProfile } from "@/lib/demo-registration";
import { FriendsSection } from "@/components/profiles/shared/FriendsSection";
import { FriendRequestButton } from "@/components/profiles/shared/FriendRequestButton";
import { PhotoAccessRequestButton } from "@/components/profiles/shared/PhotoAccessRequestButton";
import {
  GrantedGalleryAccessList,
  PhotoAccessCountdown,
} from "@/components/profiles/shared/PhotoAccessCountdown";
import {
  canonicalDemoOwnerId,
  getAnonymousPhotoAccessRemainingMs,
  getPhotoAccessStatus,
  getPhotoAccessStatusSync,
} from "@/lib/friends";
import { ReportBlockButtons } from "@/components/profiles/shared/ReportBlockButtons";
import { ProfileSocialSettings } from "@/components/profiles/shared/ProfileSocialSettings";
import { getCountryByName, readCountryCodeLocal } from "@/lib/countries";
import { getSocialDemoData } from "@/demo/socialDemoData";
import {
  DEMO_USER_CHANGED_EVENT,
  parseSavedCoupleDemoInterests,
  resolveDemoInterestList,
} from "@/lib/profile-interests";
// Espejo de Single: gestor de solicitudes de acceso, reporte y experiencias.
import { PrivateImageRequestsManager } from "@/components/profiles/shared/PrivateImageRequestsManager";
import { ReportDialog } from "@/components/dialogs/ReportDialog";
import { ComplianceSignupForm } from "@/components/modals/compliance-signup-form";
import { EventsCarousel } from "@/components/ui/carousel/events-carousel";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@/components/modals/animated-modal";
import { FileUpload } from "@/components/ui/forms/file-upload";

// --- Secciones modelo del video (perfil de pareja) ---
// Campos físicos que NO existen en el modelo de perfil: en demo se muestran
// estos valores de demostración, coherentes con Carmen & Roberto (25/28,
// CDMX). NO son los datos personales del video del usuario. Fuera de demo
// el campo vacío se oculta.
const DEMO_MEMBER_DETAILS = [
  { height: "165 cm", weight: "58 kg", hair: "Castaño", eyes: "Café" },
  { height: "178 cm", weight: "76 kg", hair: "Negro", eyes: "Café" },
] as const;

// Títulos demo de intereses (respaldo cuando aún no se ha editado nada en
// el editor): repartidos entre ambos miembros solo en demo. La selección
// real del editor (demo_user) tiene prioridad; ver savedDemoInterests.
const DEMO_INTEREST_TITLES = [
  "Lifestyle Exclusivo",
  "Eventos VIP",
  "Privacidad Total",
  "Verificación Real",
  "Chat Encriptado",
  "Match Inteligente",
] as const;

// Ronda 9 (stream B): delega en `deriveOrientationLabel`, que acepta
// "men" / "women" además de "male" / "female" (el mapeo anterior solo
// comparaba igualdad exacta con "male"/"female" y devolvía null).
const deriveOrientation = (
  gender: string,
  interestedIn?: string | null,
): string | null => deriveOrientationLabel(gender, interestedIn);

const mapRelationshipType = (relationshipType: string): string => {
  switch (relationshipType) {
    case "man-woman":
      return "Pareja hombre y mujer";
    case "man-man":
      return "Pareja de hombres";
    case "woman-woman":
      return "Pareja de mujeres";
    default:
      return "Pareja";
  }
};

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

function ProfileCouple() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isAuthenticated,
    user,
    profile: authProfile,
    loading: authLoading,
    signOut,
    getProfileType,
  } = useAuth();

  const { toast: shadcnToast } = useToast();
  const [_activeTab, _setActiveTab] = useState("about");
  const [profile, setProfile] = useState<CoupleProfileWithPartners | null>(
    null,
  );
  // El score se calcula UNA vez aquí, en el top-level e incondicional
  // (igual que ProfileSingle:246). Antes se llamaba a useProfileScore()
  // 4 veces dentro del JSX del return principal, que solo se renderiza
  // cuando el perfil ya cargó: en el primer render (cargando) eran 0
  // llamadas y en el segundo 4, y React truena con el error #310
  // ("Rendered more hooks than during the previous render") → /404.
  const profileScore = useProfileScore(profile);
  // Ronda 11, stream C (iii): el anónimo nace privado/invisible
  // (espejo de ProfileSingle).
  const isAnonymous = useMemo(
    () => isAnonymousDemoProfile(authProfile),
    [authProfile],
  );
  const [loading, setLoading] = useState(true);

  // Ajustes de privacidad de la pareja que se está viendo (indicador de
  // visibilidad, signos y marca de agua). Misma clave que usa
  // CouplePrivacySection (`user.id ?? profile.profile_id`); se actualiza
  // en vivo cuando esa sección guarda un cambio.
  const profilePrivacy = usePrivacySettings(
    user?.id ?? profile?.profile_id ?? "",
    "couple",
    isAnonymous,
  );
  const profileZodiac1 = getProfileZodiacSign(profilePrivacy, 0);
  const profileZodiac2 = getProfileZodiacSign(profilePrivacy, 1);
  const visibilityBadge = getVisibilityBadge(
    profilePrivacy,
    profile?.isOnline ?? false,
  );
  const [showPrivateImageRequest, _setShowPrivateImageRequest] =
    useState(false);
  const [privateImageAccess, setPrivateImageAccess] = useState<
    "none" | "pending" | "approved" | "denied"
  >("none");
  const [showReportDialog, setShowReportDialog] = useState(false);
  // Menú "Compartir" (punto 17): TikTok, Facebook, WhatsApp y X.
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Galería privada COLAPSADA por defecto (punto 14, regresión ronda 4).
  const [privateGalleryOpen, setPrivateGalleryOpen] = useState(false);
  // Espejo de Single: modal VIP de la sección "Próximas experiencias".
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [demoPrivateUnlocked, _setDemoPrivateUnlocked] = useState(false);
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

  // La galería privada carga BLOQUEADA: el valor anterior (false) dejaba
  // las fotos privadas visibles sin PIN en la primera carga del perfil.
  const [isParentalLocked, _setIsParentalLocked] = usePersistedState(
    "parentalLock",
    true,
  );

  const [showParentalUnlock, setShowParentalUnlock] = useState(false);

  // Restaurar el desbloqueo vigente al montar; si expiró (o nunca hubo),
  // bloquear: cubre instalaciones que ya tenían "parentalLock" = false
  // persistido antes de este fix.
  const unlockRestoredRef = useRef(false);
  useEffect(() => {
    if (unlockRestoredRef.current) return;
    unlockRestoredRef.current = true;
    if (unlockExpiresAt > Date.now()) {
      _setIsParentalLocked(false);
      _setDemoPrivateUnlocked(true);
    } else {
      _setIsParentalLocked(true);
      _setDemoPrivateUnlocked(false);
      if (unlockExpiresAt !== 0) setUnlockExpiresAt(0);
    }
    // Solo al montar: el valor leído de localStorage en el primer render
    // es la fuente; reaccionar a cambios posteriores lo re-bloquearía.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isBiometricUnlocking, setIsBiometricUnlocking] = useState(false);

  // Estados para modal de imágenes
  const [showImageModal, _setShowImageModal] = useState(false);
  const [_selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Imágenes que muestra el ImageModal: la galería pública (espejo de
  // Single) o la privada. Antes el modal siempre recibía las privadas.
  const [modalImages, setModalImages] = useState<string[]>([]);
  const openPublicImageModal = (index: number) => {
    setModalImages(couplePublicImageUrls);
    setSelectedImageIndex(index);
    _setShowImageModal(true);
  };
  const [imageLikes, setImageLikes] = useState<{ [key: string]: number }>({});
  const [imageUserLikes, setImageUserLikes] = useState<{
    [key: string]: boolean;
  }>({});
  const [_imageComments, _setImageComments] = useState<{
    [key: string]: string[];
  }>({});
  const [_commentInput, _setCommentInput] = useState("");
  const [_showCommentInputFor, _setShowCommentInputFor] = useState<
    number | null
  >(null);

  // Galería pública de pareja (espejo de Single): 3 fotos verificadas de
  // PAREJA JUNTA del pool canónico (misma fuente que Discover y Matches):
  // su foto principal (pool[1], silueta al atardecer) + 2 de reserva
  // (pool[6] y pool[7]). Antes eran c1-c3.jpg locales, mal etiquetados:
  // c1 = mujer sola, c2 = hombre solo, c3 = otra mujer sola.
  const couplePublicImageUrls = [
    DEMO_COUPLE_IMAGES[1] ?? DEMO_COUPLE_CARMEN_ROBERTO.mainImage,
    DEMO_COUPLE_IMAGES[6] ?? DEMO_COUPLE_CARMEN_ROBERTO.mainImage,
    DEMO_COUPLE_IMAGES[7] ?? DEMO_COUPLE_CARMEN_ROBERTO.mainImage,
  ];

  // C6: rutas de Storage (bucket "media") de las 4 imágenes privadas.
  // Ya NO son URLs públicas: la ruta legacy `/assets/people/...` se mapea a
  // `people/...` en el bucket con toPrivateStoragePath(). Las URLs firmadas
  // se resuelven abajo con usePrivateMediaUrls() (solo galería desbloqueada
  // + usuario autenticado); en cualquier otro caso se muestra el placeholder.
  const couplePrivateBaseImages = [
    "privadocouple1.jpg",
    "privadocouple2.jpg",
    "privadocouple3.jpg",
    "privadocouple4.jpg",
  ]
    .map((file) =>
      toPrivateStoragePath(`/assets/people/couple/privado/${file}`),
    )
    .filter((p): p is string => p !== null);

  // Función para filtrar imágenes que coincidan con avatar (blindaje biométrico)
  const getFilteredPrivateImages = () => {
    if (!profile) return couplePrivateBaseImages;

    // Extraer iniciales de los nombres para crear un hash de filtrado
    const avatarHash =
      `${profile.partner1_first_name?.[0] || "E"}${profile.partner2_first_name?.[0] || ""}`.toLowerCase();

    // Filtrar imágenes basado en hash del avatar (evita mostrar imágenes que coincidan con avatar público)
    return couplePrivateBaseImages.filter((_, index) => {
      // Usar el hash para determinar qué imágenes mostrar para este perfil específico
      const imageIndex =
        (avatarHash.charCodeAt(0) + avatarHash.charCodeAt(1)) %
        couplePrivateBaseImages.length;
      return (
        index !== imageIndex &&
        index !== (imageIndex + 1) % couplePrivateBaseImages.length
      );
    });
  };

  const _shuffledCouplePrivateImages = useMemo(() => {
    const filtered = getFilteredPrivateImages();
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [profile]);

  // Determinar si es el perfil propio: esta pantalla representa el perfil de la sesión actual
  const isOwnProfile = Boolean(user);

  const isGalleryUnlocked =
    !isParentalLocked &&
    (isOwnProfile || demoPrivateUnlocked || privateImageAccess === "approved");

  // isDemoMode VA AQUÍ ARRIBA, antes de usePrivateMediaUrls(): si se
  // declara después, el `demoAssetFallback: isDemoMode` de abajo lee el
  // const antes de inicializarse (TDZ) → ReferenceError en cada render →
  // ErrorBoundary → /404. Fue lo que rompió /profile-couple en el PR #44.
  // Punto 14a (ronda 7, espejo de ProfileSingle): el flag demo era true
  // para CUALQUIER sesión demo, así que con sesión single esta página
  // cargaba el perfil demo de Carmen & Roberto (nombre/foto de pareja)
  // con los datos de la sesión single. Ahora exige sesión de pareja
  // (`getProfileType()` resuelve "single"/"couple" del `demo_user`
  // fresco o de `profile_type` en sesión real).
  const isDemoMode =
    (WalletService.isDemoMode() ||
      (typeof window !== "undefined" &&
        window.localStorage.getItem("demo_authenticated") === "true")) &&
    getProfileType() === "couple";

  /**
   * Ronda 11 (stream A, 1f): sincronizar `privateImageAccess` con la
   * solicitud de acceso a fotos YA guardada. Causa raíz de que en la
   * galería de la pareja nunca se viera la cuenta atrás (test ronda
   * 10): este estado nacía en "none" y SOLO se ponía en "pending" al
   * enviar la solicitud desde el modal — la aceptación que llegaba a
   * /requests no se reflejaba aquí jamás, así que el visitante con
   * acceso concedido seguía viendo "Ver Fotos Privadas" → pedir de
   * nuevo, y no había superficie donde mostrar la cuenta atrás.
   * La aceptación también caduca a las 24 h (mismo TTL que la galería
   * del anónimo): aceptada pero vencida se lee como "none" para que
   * la cuenta atrás y el acceso no se contradigan.
   * Nota: el dueño NO se detecta con `isOwnProfile` (aquí es
   * `Boolean(user)`: cualquier sesión logueada), sino comparando los
   * ids canonizados — la ficha es "demo-couple-456" y la sesión el
   * uuid, y ambos canonizan al mismo id de usuario.
   * Este bloque va DESPUÉS de `isDemoMode` a propósito: el array de
   * dependencias lo lee en cada render y declararlo antes rompería
   * con TDZ (ReferenceError en cada render).
   */
  const refreshPhotoAccessStatus = useCallback(() => {
    const viewer = user?.id ?? "";
    const owner = profile?.id ?? "";
    if (!viewer || !owner) return;
    if (canonicalDemoOwnerId(viewer) === canonicalDemoOwnerId(owner)) {
      return;
    }
    const apply = (status: "none" | "pending" | "accepted" | "declined") => {
      const remainingMs = getAnonymousPhotoAccessRemainingMs(viewer, owner);
      if (status === "accepted" && remainingMs === null) {
        // Aceptada pero con las 24 h vencidas: hay que volver a pedir.
        setPrivateImageAccess("none");
        return;
      }
      setPrivateImageAccess(
        status === "accepted"
          ? "approved"
          : status === "pending"
            ? "pending"
            : status === "declined"
              ? "denied"
              : "none",
      );
    };
    if (isDemoMode) {
      apply(getPhotoAccessStatusSync(viewer, owner));
    } else {
      void getPhotoAccessStatus(viewer, owner, false).then(apply);
    }
  }, [user?.id, profile?.id, isDemoMode]);

  useEffect(() => {
    refreshPhotoAccessStatus();
  }, [refreshPhotoAccessStatus]);

  // C6: resuelve las rutas de Storage (en el mismo orden que
  // `_shuffledCouplePrivateImages`) a URLs firmadas (1 h) solo cuando la
  // galería está desbloqueada y hay usuario autenticado. Llamada
  // incondicional en el top-level (sin early returns antes en el componente).
  // En cualquier otro caso devuelve el placeholder genérico por posición.
  const couplePrivateImageUrls = usePrivateMediaUrls(
    _shuffledCouplePrivateImages,
    {
      unlocked: isGalleryUnlocked,
      userId: user?.id ?? null,
      ownerId: profile?.id ?? null,
      // SOLO DEMO: el bucket `media` no existe aún; las imágenes demo se
      // resuelven desde /assets/... (ver private-media.ts). Perfiles reales:
      // sin este flag, URLs firmadas o placeholder.
      demoAssetFallback: isDemoMode,
    },
  );

  // Función para hacer funcional el botón "Ver Fotos Privadas"
  const handleViewPrivatePhotos = async () => {
    // Bloqueado: el perfil propio abre la pantalla del PIN; un visitante
    // sigue al flujo de solicitud de acceso (no se le puede pedir el PIN
    // del dueño). Antes este `return` hacía que el botón no hiciera nada.
    if (isParentalLocked) {
      if (isOwnProfile) {
        setShowParentalUnlock(true);
        return;
      }
    }

    // Si ya hay acceso, abrir galería
    if (isGalleryUnlocked) {
      setModalImages(couplePrivateImageUrls);
      _setShowImageModal(true);
      return;
    }

    // Perfil propio: exigir acceso seguro y desbloquear
    if (isOwnProfile) {
      const ok = await _requireSecureAccess();
      if (!ok) return;
      _setDemoPrivateUnlocked(true);
      persistUnlock();
      setModalImages(couplePrivateImageUrls);
      _setShowImageModal(true);
      return;
    }

    // Otros usuarios: solicitud de acceso
    _setShowPrivateImageRequest(true);
  };

  const _requireSecureAccess = async (): Promise<boolean> => {
    const username = user?.id || "anonymous";

    if (import.meta.env.PROD && isBiometricEnabled && isBiometricAvailable) {
      setIsBiometricUnlocking(true);
      try {
        const first = await authenticate(username);
        if (!first.success) {
          setShowParentalUnlock(true);
          _setIsParentalLocked(true);
          return false;
        }

        const second = await authenticate(`${username}-partner`);
        if (second.success) {
          return true;
        }

        setShowParentalUnlock(true);
        _setIsParentalLocked(true);
        return false;
      } finally {
        setIsBiometricUnlocking(false);
      }
    }

    if (hasPin) {
      setShowParentalUnlock(true);
      _setIsParentalLocked(true);
      return false;
    }

    return true;
  };
  // Funciones para modal de imágenes
  const _handleImageLike = (imageIndex: number) => {
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

  const _handleAddComment = (imageIndex: number, comment?: string) => {
    if (comment) {
      const imageId = imageIndex.toString();
      _setImageComments((prev: { [key: string]: string[] }) => ({
        ...prev,
        [imageId]: [...(prev[imageId] || []), comment],
      }));
      toast.success("Comentario añadido");
    }
  };

  const _navigateCarousel = (index: number) => {
    setSelectedImageIndex(index);
  };

  const navigateCarousel = _navigateCarousel;

  // Types derived from services
  type WalletInfo = Awaited<ReturnType<typeof walletService.getOrCreateWallet>>;
  type UserNFT = Awaited<ReturnType<typeof nftService.getUserNFTs>>[number];
  type CoupleRequest = Awaited<
    ReturnType<typeof nftService.getCoupleNFTRequests>
  >[number];
  type CoupleAgreementRow =
    Database["public"]["Tables"]["couple_agreements"]["Row"];
  type CoupleDisputeRow =
    Database["public"]["Tables"]["couple_disputes"]["Row"];
  type TestnetInfo = Awaited<
    ReturnType<typeof walletService.getTestnetTokensInfo>
  >;

  // Estados para funcionalidades blockchain
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState({
    cmpx: "0",
    gtk: "0",
    matic: "0",
  });
  const [_testnetInfo, setTestnetInfo] = useState<TestnetInfo | null>(null);
  const [coupleNFTs, setCoupleNFTs] = useState<UserNFT[]>([]);
  const [coupleRequests, setCoupleRequests] = useState<CoupleRequest[]>([]);
  // Estadísticas espejo de ProfileSingle. Demo: sin API real, contadores
  // coherentes con el contenido demo (12 posts, 2 matches) en vez de 0
  // junto a contenido. Fuera de demo siguen en 0 hasta que exista la API.
  const [coupleStats] = useState({
    totalViews: isDemoMode ? 212 : 0,
    totalLikes: isDemoMode ? 94 : 0,
    totalMatches: isDemoMode ? 2 : 0,
    profileCompleteness: 0,
  });

  // Detalles reales de la pareja (intereses por miembro, "Buscamos",
  // preferencias) desde la tabla couple_profiles. La vista unificada del
  // RPC no expone estos campos, así que se leen directo (columnas reales
  // verificadas en los tipos generados; couple_profiles NO tiene
  // is_premium, ese sale del perfil). Solo fuera de demo y con id real;
  // si falla o no hay fila, las secciones muestran su estado vacío.
  type CoupleDetailsRow = {
    his_interests: string[] | null;
    her_interests: string[] | null;
    couple_interests: string[] | null;
    looking_for: string | null;
    preferences: unknown;
    age_range_min: number | null;
    age_range_max: number | null;
  };
  const [coupleDetails, setCoupleDetails] = useState<CoupleDetailsRow | null>(
    null,
  );

  useEffect(() => {
    const loadCoupleDetails = async () => {
      if (!profile?.id || isDemoMode || !supabase) return;
      try {
        const { data, error } = await supabase
          .from("couple_profiles")
          .select(
            "his_interests, her_interests, couple_interests, looking_for, preferences, age_range_min, age_range_max",
          )
          .eq("id", profile.id)
          .maybeSingle();
        if (error) {
          logger.error("Error cargando detalles de pareja", {
            error: String(error),
          });
          return;
        }
        if (data) setCoupleDetails(data as CoupleDetailsRow);
      } catch (error) {
        logger.error("Error cargando detalles de pareja", {
          error: String(error),
        });
      }
    };
    void loadCoupleDetails();
  }, [profile?.id, isDemoMode]);
  const [_isClaimingTokens, _setIsClaimingTokens] = useState(false);
  const displayAccountLabel =
    profile?.username || profile?.couple_name || "Cuenta";

  // Ronda 9 (stream A, Cuenta/DEMO): la etiqueta del chip es
  // CONSTANTE — "DEMO" en demo o el nombre de la cuenta en sesión
  // real. Antes dependía del hover (`accountChipHovered`: "Cuenta"
  // al pasar el cursor) y en táctil el hover se quedaba pegado al
  // abrir el menú, así que la etiqueta cambiaba según el estado del
  // menú y la ruta (mismo defecto que en el perfil single).
  const accountChipLabel = isDemoMode ? "DEMO" : displayAccountLabel;

  // Nacionalidad: `country_code` (migración 20261124050000) → columna
  // `country` (texto, ya existe) → local del registro → datos demo.
  const coupleName = profile?.couple_name || "Perfil de Pareja";
  const profileCountryCode =
    (profile as { country_code?: string | null } | null)?.country_code ??
    getCountryByName((profile as { country?: string | null } | null)?.country)
      ?.code ??
    readCountryCodeLocal(user?.id ?? profile?.profile_id ?? "") ??
    getSocialDemoData(coupleName).countryCode;

  const hasWalletActive = Boolean(walletInfo);
  const hasAnyNFTs = coupleNFTs.length > 0;

  // Estados para gestión legal
  const [_showLegalManager, _setShowLegalManager] = useState(false);
  const [_legalTab, _setLegalTab] = useState<"agreement" | "dispute">(
    "agreement",
  );

  const [hasActiveAgreement, setHasActiveAgreement] = useState(false);
  const [agreementMeta, setAgreementMeta] = useState<{
    id: string;
    agreementHash: string;
    signedAt: string | null;
    signerIp: string | null;
  } | null>(null);
  const [_isCheckingAgreement, setIsCheckingAgreement] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState<
    "ACTIVE" | "FROZEN_DISPUTE" | "DISSOLVED"
  >("ACTIVE");

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
  // se eliminó (mismo defecto que en el perfil single): la etiqueta
  // ahora es determinista ("Cuenta" solo al pasar el cursor).
  const [_showDisputeWarning, _setShowDisputeWarning] = useState(false);

  const { authenticate, isBiometricAvailable, isBiometricEnabled, hasPin } =
    useBiometricAuth();

  // Verificar estado del acuerdo de pareja para hard-lock legal
  useEffect(() => {
    const loadAgreementStatus = async () => {
      if (!profile?.id) return;

      try {
        setIsCheckingAgreement(true);

        if (!supabase) {
          logger.error(
            "Supabase client no está inicializado para verificar acuerdo de pareja",
          );
          setHasActiveAgreement(false);
          setAgreementMeta(null);
          return;
        }

        const { data, error } = await supabase
          .from("couple_agreements")
          .select(
            "id, agreement_hash, status, signed_at, partner_1_id, partner_2_id, partner_1_ip, partner_2_ip",
          )
          .eq("couple_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          logger.error("Error verificando estado de acuerdo de pareja", {
            error,
          });
          setHasActiveAgreement(false);
          setAgreementMeta(null);
          return;
        }

        const row = data as CoupleAgreementRow | null;

        if (row && row.status === "ACTIVE") {
          let signerIp: string | null = null;
          if (user?.id && row.partner_1_id === user.id) {
            signerIp =
              typeof row.partner_1_ip === "string" ? row.partner_1_ip : null;
          } else if (user?.id && row.partner_2_id === user.id) {
            signerIp =
              typeof row.partner_2_ip === "string" ? row.partner_2_ip : null;
          } else {
            const ip1 =
              typeof row.partner_1_ip === "string" ? row.partner_1_ip : null;
            const ip2 =
              typeof row.partner_2_ip === "string" ? row.partner_2_ip : null;
            signerIp = ip1 ?? ip2 ?? null;
          }

          setHasActiveAgreement(true);
          setAgreementMeta({
            id: row.id,
            agreementHash: row.agreement_hash,
            signedAt: row.signed_at,
            signerIp: signerIp ?? null,
          });
        } else {
          setHasActiveAgreement(false);
          setAgreementMeta(null);
        }
      } catch (error) {
        logger.error("Error cargando estado de acuerdo de pareja", {
          error: String(error),
        });
        setHasActiveAgreement(false);
        setAgreementMeta(null);
      } finally {
        setIsCheckingAgreement(false);
      }
    };

    void loadAgreementStatus();
  }, [profile?.id, user?.id]);

  // Sincronizar relationshipStatus con disputas reales en couple_disputes
  useEffect(() => {
    const loadDisputeState = async () => {
      // Si no hay acuerdo activo asociado, asumimos relación activa sin disputa
      if (!agreementMeta?.id) {
        setRelationshipStatus("ACTIVE");
        return;
      }

      if (!supabase) {
        logger.error(
          "Supabase client no está inicializado para verificar disputas de pareja",
        );
        return;
      }

      try {
        const { data, error } = await supabase
          .from("couple_disputes")
          .select("resolved_at, resolution_type")
          .eq("couple_agreement_id", agreementMeta.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          logger.error("Error obteniendo disputas de pareja", { error });
          return;
        }

        const dispute = data as CoupleDisputeRow | null;

        if (!dispute) {
          setRelationshipStatus("ACTIVE");
        } else if (!dispute.resolved_at) {
          // Existe disputa sin resolver -> cuenta en congelamiento
          setRelationshipStatus("FROZEN_DISPUTE");
        } else {
          // Disputa resuelta o confiscada -> relación disuelta
          setRelationshipStatus("DISSOLVED");
        }
      } catch (error) {
        logger.error("Error sincronizando estado de disputa de pareja", {
          error: String(error),
        });
      }
    };

    void loadDisputeState();
  }, [agreementMeta?.id]);

  // Handlers para las acciones del perfil
  const _handleUploadImage = () => {
    logger.info("Subir imagen solicitado");
    toast.info(
      "🖼️ Subir Imagen (DEMO): En la versión completa, esto abrirá la galería.",
    );
  };

  const _handleDeletePost = (postId: string) => {
    logger.info("Eliminar post solicitado", { postId });
    if (
      window.confirm(
        "🗑️ ¿Seguro que quieres eliminar este post? (Acción de DEMO)",
      )
    ) {
      toast.success("✅ Post eliminado (temporalmente para el demo)");
    }
  };

  const _handleCommentPost = (postId: string) => {
    logger.info("Comentar post solicitado", { postId });
    toast.info(
      "💬 Comentar Post (DEMO): Aquí se abriría la sección de comentarios.",
    );
  };

  // Funciones blockchain específicas para parejas
  const loadCoupleBlockchainData = async () => {
    if (!user?.id) return;

    try {
      if (isDemoMode) {
        // Espejo de Single: sembrar los NFTs demo para ESTE usuario pareja.
        // Sin esto `demo_nfts:<uid>` está vacío, getUserNFTs devuelve [] y la
        // sección "Blockchain & NFTs de Pareja" nunca se renderiza.
        seedDemoNFTs(user.id);
        const [nfts] = await Promise.all([
          nftService
            .getUserNFTs(user.id, { demoFallback: true })
            .catch(() => []),
        ]);

        setWalletInfo(null);
        // Balance demo canónico PERSISTIDO de pareja (ÚNICA fuente
        // @/lib/demo-wallet, ronda 7 punto 8): tras reclamar en /tokens
        // esta sección debe reflejarlo, no la constante 2000/1500.
        const canonical = getDemoWalletBalance("couple");
        setTokenBalances({
          cmpx: String(canonical.cmpx),
          gtk: String(canonical.gtk),
          matic: "10",
        });
        setCoupleNFTs(nfts.filter((nft) => Boolean(nft?.is_couple)));
        setCoupleRequests([]);
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

      // Cargar información específica de pareja
      const [wallet, tokens, nfts, requests, testnet] = await Promise.all([
        walletService.getOrCreateWallet(user.id).catch(() => null),
        walletService
          .getTokenBalances("")
          .catch(() => ({ cmpx: "0", gtk: "0", matic: "0" })),
        nftService.getUserNFTs(user.id).catch(() => []),
        nftService.getCoupleNFTRequests(user.id).catch(() => []),
        walletService.getTestnetTokensInfo(user.id).catch(() => null),
      ]);

      setWalletInfo(wallet);
      setTokenBalances(tokens);
      setCoupleNFTs(nfts.filter((nft) => Boolean(nft?.is_couple)));
      setCoupleRequests(requests);
      setTestnetInfo(testnet);
    } catch (error) {
      logger.error("Error cargando datos blockchain de pareja:", {
        error: String(error),
      });
    }
  };

  const handleRequestCoupleNFT = async (partnerEmail: string) => {
    if (!user?.id) return;

    // Ronda 8, punto 4 — causa raíz del botón "muerto": en demo el
    // gating legal NUNCA se cumple (no hay fila en `couple_agreements`
    // en Supabase y el preview demo ni siquiera tiene sesión real), así
    // que el clic moría en `toast.error`... y ese toast es de `sonner`,
    // cuyo <Toaster> no está montado en ningún sitio (MainLayout monta
    // solo el Toaster Radix): el error era invisible, sin modal, sin
    // toast y sin cambio de contador. En demo el gating se salta (el
    // hard-lock legal sigue vigente en modo real) y los avisos usan
    // `shadcnToast` (Radix, montado).
    if (isDemoMode) {
      try {
        // Modo demo - simular creación
        logger.info("Solicitud de NFT de pareja creada (DEMO):", {
          partnerEmail,
        });

        // Simular nueva solicitud
        const now = new Date().toISOString();
        const newRequest: CoupleRequest = {
          id: `demo-${Date.now()}`,
          partner1_address: "DEMO",
          partner2_address: "DEMO",
          initiator_address: "DEMO",
          metadata_uri: "ipfs://pending",
          status: "pending",
          consent1_timestamp: now,
          consent2_timestamp: null,
          blockchain_status: null,
          expires_at: now,
          token_id: 0,
          transaction_hash: null,
          metadata: null,
          created_at: now,
        };

        setCoupleRequests((prev) => [newRequest, ...prev]);
        shadcnToast({
          title: "Solicitud de NFT de pareja creada (DEMO)",
          description:
            "La pareja debe aprobarla; el NFT ya se minteó en local.",
        });

        // El NFT de pareja se mintea en demo (vía compartida, is_couple:
        // true) y persiste en `demo_nfts:<uid>`: antes la rama demo solo
        // creaba la solicitud y ningún contador cambiaba.
        const minted = await nftService.mintDemoNFT(user.id, {
          isCouple: true,
          name:
            profile?.partner1_first_name && profile?.partner2_first_name
              ? `NFT de ${profile.partner1_first_name} & ${profile.partner2_first_name}`
              : "NFT de Pareja",
          description: "NFT de pareja con consentimiento doble (DEMO)",
        });
        if (minted) {
          const nfts = await nftService
            .getUserNFTs(user.id, { demoFallback: true })
            .catch(() => []);
          setCoupleNFTs(nfts.filter((nft) => Boolean(nft?.is_couple)));
          shadcnToast({
            title: "¡NFT de pareja minteado (DEMO)!",
            description: `${minted.name} se agregó a la colección conjunta.`,
          });
        } else {
          shadcnToast({
            title: "Límite demo alcanzado",
            description: "Ya minteaste 4 NFTs en modo demo.",
            variant: "destructive",
          });
        }

        // Simular respuesta del partner después de un tiempo
        setTimeout(() => {
          setCoupleRequests((prev) =>
            prev.map((req) =>
              req.id === newRequest.id
                ? {
                    ...req,
                    status: "approved",
                    consent2_timestamp: new Date().toISOString(),
                  }
                : req,
            ),
          );
        }, 5000);
      } catch (error) {
        logger.error("Error creando solicitud de NFT de pareja (DEMO):", {
          error: String(error),
        });
        shadcnToast({
          title: "Error",
          description: "No se pudo crear el NFT de pareja en modo demo.",
          variant: "destructive",
        });
      }
      return;
    }

    // Gating legal (solo modo real): requiere contrato activo y cuenta
    // no congelada.
    if (!hasActiveAgreement) {
      shadcnToast({
        title: "Acción bloqueada",
        description:
          "Se requiere un Contrato de Pareja ACTIVO para crear un NFT de pareja.",
        variant: "destructive",
      });
      return;
    }

    if (relationshipStatus !== "ACTIVE") {
      shadcnToast({
        title: "Acción bloqueada",
        description:
          "La cuenta de pareja está en protocolo de disolución y los activos están congelados.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Modo real - crear solicitud real
      // Crear un archivo temporal para el NFT de pareja
      const tempFile = new File([""], "couple-nft.png", {
        type: "image/png",
      });
      const request = await nftService.requestCoupleNFT(
        user.id,
        partnerEmail,
        `NFT de ${profile?.partner1_first_name} & ${profile?.partner2_first_name}`,
        "NFT de pareja con consentimiento doble",
        tempFile,
      );
      logger.info("Solicitud de NFT de pareja creada:", { request });

      // Recargar solicitudes
      const updatedRequests = await nftService.getCoupleNFTRequests(user.id);
      setCoupleRequests(updatedRequests);
    } catch (error) {
      logger.error("Error creando solicitud de NFT de pareja:", {
        error: String(error),
      });
    }
  };

  // Migración localStorage -> usePersistedState
  const [demoAuth, _setDemoAuth] = usePersistedState(
    "demo_authenticated",
    "false",
  );
  const [demoUser, _setDemoUser] = usePersistedState<any>("demo_user", null); // TODO: Define specific user type

  // Intereses guardados desde el editor (demo): el editor de pareja guarda
  // la selección en `demo_user` (localStorage) y el perfil la refleja. Si
  // aún no se ha editado nada, se usan los títulos demo. En producción se
  // leen las columnas reales (his/her/couple_interests).
  // Ronda 14 (stream F, F2/F3): igual que en ProfileSingle — un `[]`
  // guardado anulaba el fallback (`??` no dispara con array vacío) y la
  // lectura era de un solo uso al montar. Ahora pasa por el resolver
  // compartido y se re-lee cuando el editor guarda en la misma sesión
  // (evento demo-user-changed).
  // ESTE bloque VA AQUÍ ARRIBA, antes de los early returns de
  // loading/perfil: si se declara después, en el primer render (cargando)
  // un hook no se ejecuta y en el segundo sí → React truena con el error
  // #310 ("Rendered more hooks than during the previous render") → /404.
  const [demoUserVersion, setDemoUserVersion] = useState(0);
  useEffect(() => {
    const onChanged = () => setDemoUserVersion((v) => v + 1);
    window.addEventListener(DEMO_USER_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(DEMO_USER_CHANGED_EVENT, onChanged);
  }, []);
  const savedDemoInterests = useMemo(() => {
    if (!isDemoMode || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("demo_user");
      if (!raw) return null;
      return parseSavedCoupleDemoInterests(JSON.parse(raw));
    } catch {
      return null;
    }
    // demoUserVersion: re-leer cuando el editor guarda (ver arriba).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode, demoUserVersion]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (authLoading) return;

        logger.info("🔍 ProfileCouple - Estado de autenticación:", {
          isAuthenticated: isAuthenticated(),
          user: !!user,
          authProfile: !!authProfile,
          checkDemo: true,
          source: "ProfileCouple",
        });

        // Verificar si hay sesión demo activa PRIMERO
        // isDemoMode lee localStorage directo (string "true"); demoAuth de
        // usePersistedState llega como booleano (JSON.parse("true") === true),
        // así que `demoAuth === "true"` nunca era verdad y la rama demo
        // quedaba inalcanzable.
        if (isDemoMode && demoUser) {
          logger.info("🎬 Cargando perfil demo pareja...");
          // Usar datos demo existentes pero marcados como demo
          const demoCoupleProfile: CoupleProfileWithPartners = {
            id: "demo-couple-456",
            profile_id: "CC-DEMO-001",
            couple_name: "Carmen & Roberto",
            username: "@pareja_demo",
            location: "Ciudad Demo",
            couple_bio:
              "Perfil de demostración. Regístrate para crear tu perfil real.",
            is_verified: false,
            is_premium: false,
            relationship_type: "Otro" as any,
            couple_images: [],
            partner1_id: "demo-partner-1",
            partner1_first_name: "Carmen",
            partner1_last_name: "",
            partner1_age: DEMO_COUPLE_CARMEN_ROBERTO.partner1.age,
            partner1_gender: "female" as const,
            partner1_bio: "Usuario de demostración.",
            partner2_id: "demo-partner-2",
            partner2_first_name: "Roberto",
            partner2_last_name: "",
            partner2_age: DEMO_COUPLE_CARMEN_ROBERTO.partner2.age,
            partner2_gender: "male",
            partner2_interested_in: "female",
            partner2_bio: "Usuario de demostración.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(demoCoupleProfile);
          setLoading(false);
          loadCoupleBlockchainData();
          return;
        }

        // Cargar perfil real de la DB usando la vista unificada
        if (user?.id) {
          logger.info("🔍 Cargando perfil real de pareja desde DB...");

          try {
            // Usar RPC para obtener datos reales de la vista unificada
            const { data: profileData, error } = await (supabase.rpc as any)(
              "get_profile_by_user_id",
              {
                p_user_id: user.id,
              },
            );

            if (error) {
              logger.error("❌ Error cargando perfil de pareja:", {
                error: error.message,
              });
              throw error;
            }

            if (profileData && profileData.account_type === "couple") {
              // Convertir datos de la vista unificada al formato CoupleProfileWithPartners
              const realCoupleProfile: CoupleProfileWithPartners = {
                id: profileData.couple_id || profileData.profile_id,
                profile_id: profileData.profile_id,
                couple_name: profileData.name,
                username: profileData.nickname
                  ? `@${profileData.nickname}`
                  : `@${profileData.name?.toLowerCase().replace(/\s+/g, "_") || "pareja"}`,
                location: profileData.location || "Ubicación no especificada",
                couple_bio: profileData.bio || "Información no disponible",
                is_verified: profileData.is_verified || false,
                is_premium: false, // TODO: Implementar lógica de premium
                relationship_type: (profileData.relationship_type ||
                  "Otro") as any,
                couple_images: [], // TODO: Implementar carga de imágenes
                partner1_id: profileData.user_id,
                partner1_first_name:
                  profileData.his_name?.split(" ")[0] || "Miembro 1",
                partner1_last_name:
                  profileData.his_name?.split(" ").slice(1).join(" ") || "",
                partner1_age: profileData.his_age || 18,
                partner1_gender: profileData.his_gender || "not_specified",
                partner1_bio: profileData.bio || "Información personal",
                partner2_id: `${profileData.user_id}-partner2`,
                partner2_first_name:
                  profileData.her_name?.split(" ")[0] || "Miembro 2",
                partner2_last_name:
                  profileData.her_name?.split(" ").slice(1).join(" ") || "",
                partner2_age: profileData.her_age || 18,
                partner2_gender: profileData.her_gender || "not_specified",
                partner2_interested_in: profileData.interested_in?.[0] || "all",
                partner2_bio: profileData.bio || "Información personal",
                created_at: profileData.created_at,
                updated_at: profileData.updated_at,
              };

              setProfile(realCoupleProfile);
              setLoading(false);
              loadCoupleBlockchainData();
              return;
            } else {
              logger.warn(
                "⚠️ Usuario no tiene perfil de pareja, redirigiendo...",
              );
              navigate("/profile-single");
              return;
            }
          } catch (dbError) {
            logger.error("❌ Error de base de datos:", {
              error: String(dbError),
            });
            // En error de DB, mostrar mensaje pero no fallback a mock
            shadcnToast({
              title: "Error al cargar perfil",
              description:
                "No se pudieron cargar los datos del perfil. Intente nuevamente.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        // Si no hay usuario autenticado, redirigir
        logger.info("🔒 No autenticado, redirigiendo a auth");
        navigate("/auth", { replace: true });
      } catch (error) {
        logger.error("Error loading profile:", { error: String(error) });
        // Fallback a perfil mock
        const mockCoupleProfiles = generateMockCoupleProfiles();
        setProfile(mockCoupleProfiles[0] ?? null);
        setLoading(false);

        shadcnToast({
          title: "Error al cargar perfil",
          description: "Se está mostrando un perfil de ejemplo.",
          variant: "destructive",
        });
      }
    };

    loadProfile();
  }, [user, demoAuth, demoUser, navigate, authLoading, isDemoMode]);

  // Recargar NFTs si se mintea en otro sitio de la misma página
  // (DemoWallet, modal de mint): todos leen getUserNFTs (punto 12).
  // La función se recrea en cada render: va en deps para no quedarse
  // con el cierre del primer render (user aún null).
  // Ronda 7, punto 8: también al cambiar el saldo demo (reclamo en
  // /tokens) para que "Blockchain & NFTs" y Suscripción digan el saldo
  // persistido sin recargar la página.
  useEffect(() => {
    const onChanged = () => void loadCoupleBlockchainData();
    window.addEventListener(DEMO_NFTS_CHANGED_EVENT, onChanged);
    window.addEventListener(DEMO_WALLET_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(DEMO_NFTS_CHANGED_EVENT, onChanged);
      window.removeEventListener(DEMO_WALLET_CHANGED_EVENT, onChanged);
    };
  }, [loadCoupleBlockchainData]);

  // Punto 14a (ronda 7, espejo de ProfileSingle): una sesión single NO
  // tiene perfil de pareja propio: su página es /profile-single (a donde
  // ya apunta el botón Perfil del dock). Sin esta redirección, entrar
  // directo a /profile-couple con sesión single cargaba el perfil demo
  // de Carmen & Roberto. Va antes del spinner/`!profile`: el tipo se
  // conoce por la sesión aunque el perfil no haya cargado.
  // `getProfileType()` devuelve "single" por default cuando no puede
  // resolver, así que se exige tipo CONOCIDO (perfil cargado en
  // `authProfile` o `demo_user` en localStorage): sin perfil cargado no
  // se redirige por error y se conserva el comportamiento actual
  // (pantalla "No se pudo cargar" / fallback).
  if (
    !authLoading &&
    isAuthenticated() &&
    (Boolean(authProfile) ||
      (typeof window !== "undefined" &&
        window.localStorage.getItem("demo_user") !== null)) &&
    getProfileType() === "single"
  ) {
    return <Navigate to="/profile-single" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="bg-black/80 backdrop-blur-md border-b border-white/30 p-3 sm:p-4 shadow-lg shrink-0">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-slate-700 dark:text-white">
                Cargando perfil...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 flex flex-col min-h-screen items-center justify-center p-6 text-center">
          <p className="text-slate-900 dark:text-white font-medium mb-2">
            No se pudo cargar el perfil de pareja.
          </p>
          <p className="text-slate-500 dark:text-white/70 text-sm mb-4">
            Inténtalo de nuevo o vuelve a tu perfil single.
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  // --- Props para las secciones nuevas (modelo del video) ---
  const aboutMembers: [CoupleAboutMember, CoupleAboutMember] = [
    {
      name: profile.partner1_first_name,
      age: profile.partner1_age,
      gender: profile.partner1_gender,
      bio: profile.partner1_bio,
      avatarGradient: "from-fuchsia-400 to-purple-600",
      details: {
        ...(isDemoMode ? DEMO_MEMBER_DETAILS[0] : {}),
        orientation:
          deriveOrientation(
            profile.partner1_gender,
            profile.partner1_interested_in,
          ) ?? (isDemoMode ? "Heterosexual" : null),
      },
    },
    {
      name: profile.partner2_first_name,
      age: profile.partner2_age,
      gender: profile.partner2_gender,
      bio: profile.partner2_bio,
      avatarGradient: "from-purple-400 to-fuchsia-600",
      details: {
        ...(isDemoMode ? DEMO_MEMBER_DETAILS[1] : {}),
        orientation:
          deriveOrientation(
            profile.partner2_gender,
            profile.partner2_interested_in,
          ) ?? (isDemoMode ? "Heterosexual" : null),
      },
    },
  ];

  // En modo real, partner1 = "his" y partner2 = "her" (mapeo del RPC).
  const preferenceMembers: [CoupleMemberPreferences, CoupleMemberPreferences] =
    [
      {
        name: profile.partner1_first_name,
        likes: isDemoMode
          ? resolveDemoInterestList(savedDemoInterests?.his, [
              DEMO_INTEREST_TITLES[0],
              DEMO_INTEREST_TITLES[2],
              DEMO_INTEREST_TITLES[4],
            ])
          : (coupleDetails?.his_interests ?? []),
        dependsOn: [],
      },
      {
        name: profile.partner2_first_name,
        likes: isDemoMode
          ? resolveDemoInterestList(savedDemoInterests?.her, [
              DEMO_INTEREST_TITLES[1],
              DEMO_INTEREST_TITLES[3],
              DEMO_INTEREST_TITLES[5],
            ])
          : (coupleDetails?.her_interests ?? []),
        dependsOn: [],
      },
    ];

  const lookingForTags = isDemoMode
    ? ["Parejas"]
    : splitLookingFor(coupleDetails?.looking_for ?? null);
  const lookingForAgeRange = isDemoMode
    ? "25 a 45 años"
    : coupleDetails?.age_range_min != null &&
        coupleDetails?.age_range_max != null
      ? `${coupleDetails.age_range_min} a ${coupleDetails.age_range_max} años`
      : null;
  const coupleLikes = isDemoMode
    ? resolveDemoInterestList(savedDemoInterests?.couple, [
        ...DEMO_INTEREST_TITLES,
      ])
    : (coupleDetails?.couple_interests ?? []);
  const coupleDislikes = isDemoMode
    ? []
    : parseDislikes(coupleDetails?.preferences);

  // % de perfil completo desde los datos reales (antes estaba hardcodeado a 0).
  // Cálculo plano (no es hook) para no tocar el orden de hooks (#310).
  const coupleCompleteness = computeProfileCompleteness([
    Boolean(profile.couple_name),
    coupleLikes.length > 0,
    couplePrivateImageUrls.length > 0,
    lookingForTags.length > 0,
    Boolean(profile.is_verified),
    Boolean((profile as { location?: string }).location),
  ]);

  return (
    <div className="min-h-screen relative overflow-hidden profile-page">
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header centrado */}
        <div className="profile-header-container">
          <div className="max-w-36rem mx-auto text-center space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <h1 className="profile-header-title">
                  {profile.couple_name || "Perfil de Pareja"}
                </h1>
                {profile && (
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
                          Score de confianza: {profileScore.score}
                          /100
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Insignia de verificado + visibilidad + signos: el
                    toggle "Signo zodiacal" de Privacidad controla si los
                    signos se muestran; el modo invisible se ve con el
                    fantasma 👻. (El check azul ya existe en los avatares;
                    este texto lo hace explícito.) */}
                {profile?.is_verified && (
                  <Badge className="flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-800 border border-blue-500/50 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/60 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg shadow-blue-500/50 backdrop-blur-md">
                    <span>✓ Verificado</span>
                  </Badge>
                )}
                <Badge
                  className="flex items-center gap-1 rounded-full bg-slate-900/5 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg backdrop-blur-md"
                  title={visibilityBadge.title}
                >
                  <span>{visibilityBadge.label}</span>
                </Badge>
                {profilePrivacy.zodiacVisible && profileZodiac1 && (
                  <Badge
                    className="flex items-center gap-1 rounded-full bg-slate-900/5 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg backdrop-blur-md"
                    title="Signo zodiacal"
                  >
                    <span>{formatZodiacSign(profileZodiac1)}</span>
                  </Badge>
                )}
                {profilePrivacy.zodiacVisible &&
                  profileZodiac2 &&
                  profileZodiac2.id !== profileZodiac1?.id && (
                    <Badge
                      className="flex items-center gap-1 rounded-full bg-slate-900/5 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg backdrop-blur-md"
                      title="Signo zodiacal"
                    >
                      <span>{formatZodiacSign(profileZodiac2)}</span>
                    </Badge>
                  )}
                {/* Nacionalidad (punto 1): país + bandera del registro. */}
                <NationalityBadge countryCode={profileCountryCode} />
                {isOwnProfile && hasWalletActive && (
                  <Badge className="flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/60 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg shadow-emerald-500/50 backdrop-blur-md">
                    <Wallet className="w-3 h-3" />
                    <span>WALLET ACTIVA</span>
                  </Badge>
                )}
                {isOwnProfile && hasAnyNFTs && (
                  <Badge className="flex items-center gap-1 rounded-full bg-purple-500/15 text-purple-800 border border-purple-500/50 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-400/60 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg shadow-purple-500/50 backdrop-blur-md">
                    <Users className="w-3 h-3" />
                    <span>NFT VERIFIED</span>
                  </Badge>
                )}
                {isOwnProfile && hasActiveAgreement && (
                  <Badge className="flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/70 px-2.5 py-1 text-[10px] sm:text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3" />
                    <span>CONTRATO ACTIVO</span>
                  </Badge>
                )}
              </div>
              <p className="profile-header-username">
                {profile.username || "@pareja_love"}
              </p>
              <p className="text-sm text-slate-500 dark:text-white/60">
                ID: {profile.profile_id || "CC-2025-002"}
              </p>
              {isAuthenticated() && user && (
                <p className="profile-header-email">
                  {user.email || "Usuario"}
                </p>
              )}
            </div>

            <VanishSearchInput
              placeholders={[
                "Buscar parejas en Ciudad de México...",
                "Eventos exclusivos este fin de semana...",
                "Clubs verificados con alberca...",
                "Cenas románticas Lifestyle...",
                "Usuarios con intereses en Viajes...",
              ]}
              onSubmit={(val) => {
                logger.info("Buscando:", { val });
                toast.info(`Buscando: ${val}`);
              }}
            />
          </div>
        </div>

        {/* Contenido principal centrado — ronda 14 (stream F, F1):
            antes había DOS contenedores `flex-1` con scroll propio: el
            primero solo llevaba la fila de iconos (Compartir, Reportar,
            Ajustes, Tokens) y el segundo la tarjeta del perfil. Ese
            primer bloque era el hueco vacío encima de la tarjeta. Ahora
            un solo contenedor con la fila de iconos directamente encima
            de la tarjeta. */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
            <div className="flex gap-1 sm:gap-2">
              {/* Compartir (punto 17): abre el menú con TikTok,
                  Facebook, WhatsApp, X y "Más opciones" (compartir
                  nativo / copiar enlace). Antes copiaba el enlace directo. */}
              <Button
                className="bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsShareOpen(true);
                }}
              >
                <Share2 className="h-4 w-4 text-slate-700 dark:text-white opacity-90" />
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReportDialog(true);
                }}
                className="bg-slate-900/5 hover:bg-red-500/20 dark:bg-white/10 dark:hover:bg-red-500/20 p-2 transition-all duration-300 hover:scale-105 group"
              >
                <Flag className="h-4 w-4 text-slate-700 group-hover:text-red-500 dark:text-white dark:group-hover:text-red-400 transition-colors" />
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/edit-profile-couple");
                }}
                className="hover:bg-slate-900/10 dark:hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
              >
                <Settings className="h-4 w-4 text-slate-700 dark:text-white" />
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/tokens");
                }}
                className="hover:bg-slate-900/10 dark:hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
              >
                <Crown className="h-4 w-4 text-slate-700 dark:text-white" />
              </Button>
            </div>
            {/* Información principal de la pareja */}
            <Card className="bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 text-slate-900 dark:text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  {/* Avatar de la pareja: foto verificada de la pareja
                      JUNTA (recorte circular de su foto principal). Antes
                      eran dos círculos con las iniciales "C" y "R". */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="relative">
                      <img
                        src={
                          couplePublicImageUrls[0] ??
                          DEMO_COUPLE_CARMEN_ROBERTO.mainImage
                        }
                        alt="Carmen & Roberto"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-fuchsia-400/60"
                      />
                      {profile?.is_verified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Verified className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400 animate-pulse" />
                  </div>

                  {/* Información básica */}
                  <div className="flex flex-col items-center justify-start flex-1">
                    <h2 className="text-lg font-bold">
                      {profile?.partner1_first_name} &{" "}
                      {profile?.partner2_first_name}
                    </h2>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge className="profile-badge badge-location">
                        <MapPin className="w-4 h-4" />
                        {profile?.location || "CDMX, México"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {profile.partner1_first_name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="profile-badge badge-age">
                            🎂 {profile.partner1_age} años
                          </Badge>
                          <Badge className="profile-badge badge-gender">
                            {profile.partner1_gender === "female" ? "♀️" : "♂️"}
                          </Badge>
                          <Badge className="profile-badge badge-orientation">
                            {profile.partner1_interested_in === "both"
                              ? "⚥"
                              : "⚤"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {profile.partner2_first_name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="profile-badge badge-age">
                            🎂 {profile.partner2_age} años
                          </Badge>
                          <Badge className="profile-badge badge-gender">
                            {profile.partner2_gender === "female" ? "♀️" : "♂️"}
                          </Badge>
                          <Badge className="profile-badge badge-orientation">
                            {profile.partner2_interested_in === "both"
                              ? "⚥"
                              : "⚤"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Biografía */}
                    <p className="text-sm text-slate-600 dark:text-white/90 mt-4">
                      Una pareja aventurera que busca nuevas experiencias y
                      conexiones auténticas.
                    </p>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
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
                              través la pastilla de edad, la bio y los botones.
                              Fondo SÓLIDO opaco explícito en ambos temas +
                              `sideOffset`/`collisionPadding`. */}
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
                                if (isDemoMode) {
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

                      {isOwnProfile && (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate("/edit-profile-couple");
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:border-white/30 flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Editar Perfil
                          </span>
                          <span className="sm:hidden">Editar</span>
                        </Button>
                      )}

                      {!isOwnProfile && (
                        <Button
                          onClick={() => setShowReportDialog(true)}
                          className="bg-red-500/20 hover:bg-red-600/30 text-red-700 dark:text-red-200 border-red-400/30 flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Flag className="w-4 h-4" />
                          <span className="hidden sm:inline">Reportar</span>
                          <span className="sm:hidden">Report</span>
                        </Button>
                      )}

                      {/* Social (puntos 2, 4 y 5): solicitud de amistad y
                          de ver fotos + bloqueo real. Solo visibles
                          cuando se ve un perfil ajeno. */}
                      <FriendRequestButton
                        profileId={profile?.id || ""}
                        profileName={coupleName}
                        viewerId={user?.id || ""}
                        viewerName={coupleName}
                        isOwnProfile={isOwnProfile}
                        isDemo={isDemoMode}
                      />
                      <PhotoAccessRequestButton
                        profileId={profile?.id || ""}
                        profileName={coupleName}
                        viewerId={user?.id || ""}
                        isOwnProfile={isOwnProfile}
                        isDemo={isDemoMode}
                      />
                      <ReportBlockButtons
                        profileId={profile?.id || ""}
                        profileName={coupleName}
                        viewerId={user?.id || ""}
                        isOwnProfile={isOwnProfile}
                        isDemo={isDemoMode}
                        showReport={false}
                        onReport={() => setShowReportDialog(true)}
                      />

                      {/* Botón para solicitar acceso a fotos privadas */}
                      {privateImageAccess === "none" && (
                        <Button
                          onClick={handleViewPrivatePhotos}
                          className="bg-purple-600/80 hover:bg-purple-700/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Ver Fotos Privadas
                          </span>
                          <span className="sm:hidden">Privadas</span>
                        </Button>
                      )}

                      {/* Estado de solicitud pendiente */}
                      {privateImageAccess === "pending" && (
                        <Button
                          disabled
                          className="bg-yellow-600/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Solicitud Pendiente
                          </span>
                          <span className="sm:hidden">Pendiente</span>
                        </Button>
                      )}

                      {/* Acceso aprobado */}
                      {privateImageAccess === "approved" && (
                        <Button
                          onClick={() => {
                            setModalImages(couplePrivateImageUrls);
                            _setShowImageModal(true);
                          }}
                          className="bg-green-600/80 hover:bg-green-700/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Images className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Fotos Privadas
                          </span>
                          <span className="sm:hidden">Privadas</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Galería pública - espejo de Single (3 fotos públicas) */}
            <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <Images className="w-5 h-5" />
                  Galería de Fotos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10">
                {/* Sin botón de descarga para visitantes (menú contextual
                    y arrastre bloqueados); la marca de agua se aplica si
                    la pareja la tiene activa en Privacidad. */}
                <ProtectedMedia
                  isOwner={isOwnProfile}
                  watermark={profilePrivacy.watermark}
                  watermarkText={profile.couple_name || "ComplicesConecta"}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                    {couplePublicImageUrls.map((src, idx) => (
                      <div
                        key={src}
                        className="aspect-square rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full h-full"
                          onClick={() => openPublicImageModal(idx)}
                          aria-label={`Foto pública ${idx + 1}`}
                        >
                          <img
                            src={src}
                            alt={`Foto pública ${idx + 1}`}
                            loading="lazy"
                            {...noDownloadProps(isOwnProfile)}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </ProtectedMedia>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-2xl shadow-xl">
              <CardContent className="p-6 md:p-10">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span className="font-semibold">Fotos Privadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {import.meta.env.PROD &&
                      isOwnProfile &&
                      !isGalleryUnlocked && (
                        <Button
                          onClick={handleViewPrivatePhotos}
                          disabled={isBiometricUnlocking}
                          className="h-8 px-3 text-xs rounded-full flex items-center gap-1.5 bg-emerald-500/80 hover:bg-emerald-600/80 text-white transition-all min-w-[120px] justify-center"
                        >
                          <Unlock className="w-3 h-3" />
                          {isBiometricUnlocking ? "Validando..." : "Biométrico"}
                        </Button>
                      )}
                    {/* Colapsar/expandir (punto 14): la galería carga
                        colapsada; expandirla no la desbloquea (las fotos
                        siguen borrosas/bloqueadas hasta el PIN). */}
                    <Button
                      onClick={() => setPrivateGalleryOpen((prev) => !prev)}
                      aria-expanded={privateGalleryOpen}
                      className="h-8 px-3 text-xs rounded-full flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 transition-all"
                    >
                      {privateGalleryOpen ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Ocultar fotos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Ver fotos ({_shuffledCouplePrivateImages.length})
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        if (isParentalLocked) {
                          // DESBLOQUEAR (solo el dueño): abrir la pantalla
                          // del PIN. Es el botón en flujo de la galería; el
                          // flotante `fixed top-20 right-4` se eliminó
                          // porque tapaba contenido y el toggle de tema.
                          if (isOwnProfile) setShowParentalUnlock(true);
                          return;
                        }
                        _setIsParentalLocked(true);
                        setShowParentalUnlock(false);
                        _setDemoPrivateUnlocked(false);
                        _setShowImageModal(false);
                        clearUnlock();
                      }}
                      disabled={isParentalLocked && !isOwnProfile}
                      className={cn(
                        "h-8 px-3 text-xs rounded-full flex items-center gap-1.5 transition-all min-w-[120px] justify-center",
                        isParentalLocked && isOwnProfile
                          ? "bg-purple-600/80 hover:bg-purple-700/80 text-white"
                          : isParentalLocked
                            ? "bg-red-600/80 cursor-default text-white"
                            : "bg-orange-600/80 hover:bg-orange-700/80 text-white",
                      )}
                    >
                      {isParentalLocked && isOwnProfile ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          Desbloquear
                        </>
                      ) : isParentalLocked ? (
                        "🔒 Bloqueado (PIN requerido)"
                      ) : (
                        "Bloquear Ahora"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Ronda 11 (stream A, 1f): cuenta atrás EN VIVO del
                    acceso concedido a la galería (24 h desde la
                    aceptación, HH:MM:SS con tick de 1 s). El visitante
                    con acceso aprobado la ve tickear aquí; el dueño ve
                    a quiénes les concedió acceso y cuánto les queda.
                    Sin esto, la aceptación no se reflejaba en la
                    galería en absoluto (test ronda 10). */}
                {!isOwnProfile && privateImageAccess === "approved" && (
                  <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
                    <PhotoAccessCountdown
                      viewerId={user?.id ?? ""}
                      ownerId={profile?.id ?? ""}
                      onExpire={refreshPhotoAccessStatus}
                    />
                  </div>
                )}
                {isOwnProfile && (
                  <GrantedGalleryAccessList
                    ownerId={profile?.id ?? ""}
                    className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-600 dark:text-white/80"
                  />
                )}

                {privateImageAccess === "denied" && (
                  <div className="text-center py-6">
                    <p className="text-slate-500 dark:text-white/70 text-sm">
                      Tu solicitud para ver las fotos privadas fue denegada.
                    </p>
                  </div>
                )}

                {/* Colapsada por defecto (punto 14): antes la rejilla
                    privada renderizaba expandida al cargar el perfil. */}
                {!privateGalleryOpen ? (
                  <p className="text-slate-400 dark:text-white/50 text-xs">
                    {_shuffledCouplePrivateImages.length} fotos privadas
                    colapsadas. Toca "Ver fotos" para expandir la galería.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-4 md:gap-6">
                    {_shuffledCouplePrivateImages.map((storagePath, idx) => {
                      // C6: la URL visible es la firmada (o el placeholder si
                      // la galería está bloqueada / sin sesión / sin permiso).
                      // `storagePath` solo se usa como key estable, nunca como src.
                      const imageSource =
                        couplePrivateImageUrls[idx] ??
                        PRIVATE_MEDIA_PLACEHOLDER;
                      return (
                        <div
                          key={storagePath}
                          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                          onClick={() => {
                            // Bloqueado: abrir la pantalla del PIN (perfil
                            // propio) o el flujo de solicitud (visitante),
                            // en vez de no hacer nada.
                            if (isParentalLocked) {
                              void handleViewPrivatePhotos();
                              return;
                            }

                            if (isGalleryUnlocked) {
                              setModalImages(couplePrivateImageUrls);
                              setSelectedImageIndex(idx);
                              _setShowImageModal(true);
                              return;
                            }

                            void handleViewPrivatePhotos();
                          }}
                        >
                          <img
                            src={imageSource}
                            alt="Private content"
                            {...noDownloadProps(isOwnProfile)}
                            onError={(e) => {
                              // C6: sin fallback a la imagen privada pública;
                              // solo al placeholder genérico, y sin reintentar
                              // si ya es el placeholder.
                              const img = e.currentTarget as HTMLImageElement;
                              if (
                                !img.src.endsWith(PRIVATE_MEDIA_PLACEHOLDER)
                              ) {
                                img.src = PRIVATE_MEDIA_PLACEHOLDER;
                              }
                            }}
                            className={cn(
                              "w-full h-full object-cover transition-[filter,transform] duration-500",
                              isGalleryUnlocked
                                ? "blur-0 scale-100"
                                : "blur-2xl scale-110",
                            )}
                          />

                          {!isGalleryUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-purple-900/70 via-purple-800/60 to-blue-900/70 backdrop-blur-2xl transition-all duration-500 group-hover:bg-opacity-90">
                              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xl backdrop-blur-2xl">
                                <Lock className="w-6 h-6 text-white" />
                              </div>
                              <span className="mt-3 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold text-white/90 bg-white/10 border border-white/20 shadow-sm">
                                {isParentalLocked
                                  ? "Bloqueado por Control Parental"
                                  : "Click para desbloquear"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas - espejo de ProfileSingle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {coupleStats.totalViews}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Visitas
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {coupleStats.totalLikes}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Likes
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {coupleStats.totalMatches}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Matches
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white backdrop-blur-xl border border-slate-200 text-slate-900 dark:bg-white/5 dark:border-white/15 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {coupleCompleteness}%
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                    Completo
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen rápido de Wallet & NFTs de Pareja */}
            <Card
              id="wallet"
              className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-2xl shadow-xl mt-4"
            >
              <CardContent className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-white/70">
                      Estado de cuenta NFT de pareja
                    </p>
                    <p className="text-xs sm:text-sm text-slate-900 dark:text-white">
                      CMPX:{" "}
                      <span className="font-semibold">
                        {tokenBalances.cmpx}
                      </span>
                      <span className="mx-2 text-slate-400 dark:text-white/40">
                        ·
                      </span>
                      NFTs:{" "}
                      <span className="font-semibold">{coupleNFTs.length}</span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.hash = "wallet";
                      document.getElementById("wallet")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="bg-linear-to-r from-fuchsia-600 to-blue-600 hover:from-fuchsia-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg shadow-fuchsia-500/40 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>
                    {isOwnProfile
                      ? "Gestionar mis Tokens"
                      : "Verificando activos..."}
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Sección Blockchain para Parejas - Solo para perfil propio */}
            {isOwnProfile && (
              <Card className="bg-white/80 dark:bg-linear-to-br dark:from-fuchsia-600/20 dark:to-purple-600/20 backdrop-blur-md border-slate-200 dark:border-fuchsia-400/30 text-slate-900 dark:text-white mt-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-fuchsia-400" />
                    <h3 className="text-lg font-semibold">
                      Blockchain & NFTs de Pareja
                    </h3>
                    {isDemoMode && (
                      <Badge className="bg-yellow-500/15 text-yellow-800 border-yellow-500/50 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-400/30 text-xs">
                        DEMO
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">CMPX</span>
                      </div>
                      <div className="text-lg font-bold">
                        {tokenBalances.cmpx}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-white/70">
                        Tokens Compartidos
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm font-medium">NFTs Pareja</span>
                      </div>
                      <div className="text-lg font-bold">
                        {coupleNFTs.length}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-white/70">
                        Colección Conjunta
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/5 dark:bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm font-medium">Solicitudes</span>
                      </div>
                      <div className="text-lg font-bold">
                        {coupleRequests.length}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-white/70">
                        Pendientes
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Ronda 14 (stream F, F7): mismo estado de límite que
                        el botón de la wallet: sin contador visible, en el
                        tope (4/4) el clic solo devolvía un toast y el
                        minteo "parecía desactivado". La cuenta es la
                        canónica (solo minteados por el usuario). */}
                    <Button
                      onClick={() => handleRequestCoupleNFT("pareja@demo.com")}
                      disabled={
                        countMintedDemoNFTs(coupleNFTs) >= DEMO_MINT_LIMIT
                      }
                      title={
                        countMintedDemoNFTs(coupleNFTs) >= DEMO_MINT_LIMIT
                          ? `Límite demo alcanzado: ya minteaste ${DEMO_MINT_LIMIT} NFTs de pareja`
                          : `Crear un NFT de pareja (${countMintedDemoNFTs(coupleNFTs)}/${DEMO_MINT_LIMIT} minteados)`
                      }
                      className="bg-fuchsia-500/10 hover:bg-fuchsia-600/20 text-fuchsia-700 border-fuchsia-500/40 dark:bg-fuchsia-500/20 dark:hover:bg-fuchsia-600/30 dark:text-fuchsia-200 dark:border-fuchsia-400/30 flex items-center gap-2 text-sm px-3 py-2 border disabled:opacity-50"
                    >
                      <Heart className="w-4 h-4" />
                      {countMintedDemoNFTs(coupleNFTs) >= DEMO_MINT_LIMIT
                        ? `Límite demo alcanzado (${countMintedDemoNFTs(coupleNFTs)}/${DEMO_MINT_LIMIT})`
                        : `Crear NFT de Pareja (${countMintedDemoNFTs(coupleNFTs)}/${DEMO_MINT_LIMIT})`}
                    </Button>
                  </div>

                  <div className="p-3 bg-slate-900/5 dark:bg-white/5 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      Sistema de Consentimiento Doble
                    </h4>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sobre nosotros - modelo del video (un bloque por miembro) */}
            <CoupleAboutSection
              members={aboutMembers}
              isDemoMode={isDemoMode}
            />

            {/* Preferencias por miembro */}
            <CouplePreferencesSection members={preferenceMembers} />

            {/* Buscamos + Situación sentimental + Nos gusta / No nos gusta */}
            <CoupleLookingForSection
              lookingFor={lookingForTags}
              ageRange={lookingForAgeRange}
              relationshipStatus={mapRelationshipType(
                profile.relationship_type,
              )}
              likes={coupleLikes}
              dislikes={coupleDislikes}
            />

            {/* Suscripción y saldo: en demo se lee el saldo PERSISTIDO
                (ronda 7, punto 8), no la constante 2000/1500: tras
                reclamar en /tokens, esta tarjeta debe reflejarlo. El
                re-render llega por el listener de demo-wallet-changed,
                que recarga tokenBalances. */}
            <CoupleSubscriptionCard
              isPremium={profile.is_premium ?? false}
              isDemoMode={isDemoMode}
              cmpx={
                isDemoMode
                  ? String(getDemoWalletBalance("couple").cmpx)
                  : tokenBalances.cmpx
              }
              gtk={
                isDemoMode
                  ? String(getDemoWalletBalance("couple").gtk)
                  : tokenBalances.gtk
              }
              nftCount={coupleNFTs.length}
              isOwnProfile={isOwnProfile}
              onManage={() => navigate("/tokens")}
            />

            {/* Privacidad - solo perfil propio (en demo el perfil demo es propio) */}
            {(isOwnProfile || isDemoMode) && (
              <CouplePrivacySection
                userId={user?.id ?? profile?.profile_id ?? ""}
                isDemoMode={isDemoMode}
                isAnonymous={isAnonymous}
              />
            )}

            {/* Amistades (punto 2) + ajustes sociales: visibilidad
                público/privado y geolocalización (puntos 3 y 4). */}
            <FriendsSection
              profileId={profile?.id ?? ""}
              profileName={coupleName}
              isOwnProfile={isOwnProfile}
              isDemo={isDemoMode}
            />
            {(isOwnProfile || isDemoMode) && (
              <ProfileSocialSettings
                userId={user?.id ?? profile?.profile_id ?? ""}
                profileType="couple"
                isDemo={isDemoMode}
                isAnonymous={isAnonymous}
              />
            )}

            {/* Gestor de solicitudes de acceso a galería privada (solo para propietario) - espejo de Single */}
            {isOwnProfile && (
              <div className="mb-6">
                <PrivateImageRequestsManager
                  profileId={profile?.id || ""}
                  profileName={profile.couple_name || "Perfil de Pareja"}
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

            {/* Demo Wallet (pareja): valores canónicos 2000/1500/2 NFTs
            vía accountType="couple" — espejo del de single.
            El uid es SOLO user.id, el mismo que usa
            loadCoupleBlockchainData (punto 9): profile.id es
            "demo-couple-456" (id de la ficha demo, no del usuario) y
            con él DemoWallet leía/escribía `demo_nfts:demo-couple-456`
            mientras el perfil leía `demo_nfts:<user.id>` — dos
            colecciones distintas. Sin user.id no hay uid válido: se
            pasa "" y DemoWallet muestra sus defaults en memoria sin
            tocar localStorage. */}
            {isDemoMode && (
              <DemoWallet userId={user?.id || ""} accountType="couple" />
            )}

            {/* Publicaciones - después de la información del perfil.
                El post de ejemplo es de Ana, no de la pareja:
                showExamplePost en false (punto 13). */}
            <div className="pt-4">
              <ProfileContent
                isOwnProfile={isOwnProfile}
                onUploadImage={_handleUploadImage}
                onDeletePost={_handleDeletePost}
                onCommentPost={_handleCommentPost}
                showExamplePost={false}
              />
            </div>

            {/* Experiencias demo: eventos, registro rápido y verificación KYC - espejo de Single */}
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
                          </div>
                          {/* Mismo defecto que el modal de Mint de Single
                            (punto 5): el footer flotaba fuera de la caja. */}
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
          </div>
        </div>
      </div>

      {showPrivateImageRequest && (
        <PrivateImageRequest
          isOpen={showPrivateImageRequest}
          onClose={() => _setShowPrivateImageRequest(false)}
          profileId={profile.id}
          profileName={profile.couple_name || "Perfil de Pareja"}
          profileType="couple"
          onRequestSent={() => {
            setPrivateImageAccess("pending");
            _setShowPrivateImageRequest(false);
          }}
        />
      )}

      <ParentalControl
        isLocked={isParentalLocked}
        showLockScreen={showParentalUnlock}
        // Cerrar sin desbloquear (X, Escape, clic en el fondo): sin
        // onClose el modal no ofrecía ninguna salida salvo el PIN.
        onClose={() => setShowParentalUnlock(false)}
        onToggle={(locked) => {
          _setIsParentalLocked(locked);
          if (!locked) {
            _setDemoPrivateUnlocked(true);
            setShowParentalUnlock(false);
            persistUnlock();
          } else {
            _setDemoPrivateUnlocked(false);
            setShowParentalUnlock(false);
            clearUnlock();
          }
        }}
        onUnlock={() => {
          _setDemoPrivateUnlocked(true);
          setShowParentalUnlock(false);
          persistUnlock();
        }}
      />

      {/* El botón "Desbloquear" flotante (`fixed top-20 right-4`) se
          eliminó: tapaba contenido y el toggle de tema al hacer scroll.
          El desbloqueo vive en el botón en flujo del encabezado de la
          galería ("Fotos Privadas"), que abre la pantalla del PIN. */}

      <ImageModal
        isOpen={showImageModal}
        onClose={() => _setShowImageModal(false)}
        images={modalImages.length > 0 ? modalImages : couplePrivateImageUrls}
        currentIndex={_selectedImageIndex}
        onNavigate={navigateCarousel}
        onLike={_handleImageLike}
        onComment={_handleAddComment}
        likes={imageLikes}
        userLikes={imageUserLikes}
        isPrivate
        isBlurred={!isGalleryUnlocked}
      />

      {/* Modal de reporte - espejo de Single (el botón Reportar lo abría pero no existía el modal) */}
      <ReportDialog
        isOpen={showReportDialog}
        onOpenChange={setShowReportDialog}
        profileId={profile?.id || ""}
        profileName={profile.couple_name || "Perfil de Pareja"}
        onReport={(reason) => {
          logger.info("Reporte enviado desde perfil de pareja", { reason });
        }}
      />

      {/* Menú "Compartir" (punto 17): TikTok, Facebook, WhatsApp y X. */}
      <ShareProfile
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        profileId={String(profile?.id || "")}
        profileName={coupleName}
      />
    </div>
  );
}

export default ProfileCouple;
