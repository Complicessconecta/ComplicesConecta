import { useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
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
  Users,
  MessageCircle,
  Calendar,
  CheckCircle,
  User as UserIcon,
  Sparkles,
  Camera,
  Download,
  Flag,
  Baby,
  Edit,
  Images,
  Eye,
  TrendingUp,
  Wallet,
  Coins,
  Zap,
  Gift,
} from "lucide-react";
import { TikTokShareButton } from "@/components/sharing/TikTokShareButton";
import { trackEvent } from "@/config/posthog.config";
import { ProfileNavTabs } from "@/components/profiles/shared/ProfileNavTabs";
import { useAuth } from "@/features/auth/useAuth";
import { useBiometricAuth } from "@/features/auth/useBiometricAuth";
import { logger } from "@/lib/logger";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useToast } from "@/hooks/useToast";
import { PrivateImageRequest } from "@/components/profiles/shared/PrivateImageRequest";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportProfileDialog } from "@/components/profiles/shared/ReportProfileDialog";
import { ImageModal } from "@/components/profiles/shared/ImageModal";
import { ParentalControl } from "@/components/profiles/shared/ParentalControl";
import { useProfileScore } from "@/features/profile/useProfileScore";
import { motion } from "framer-motion";
import {
  walletService,
} from "@/services/payments/WalletService";
import { nftService } from "@/services/payments/NFTService";
import { useProfileTheme } from "@/features/profile/useProfileTheme";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { ComplianceSignupForm } from "@/components/modals/compliance-signup-form";
import { EventsCarousel } from "@/components/ui/carousel/events-carousel";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@/components/modals/animated-modal";
import { NFTMintButton } from "@/components/ui/buttons/NFTMintButton";
import { FileUpload } from "@/components/ui/forms/file-upload";
import { VanishSearchInput } from "@/components/ui/vanish-search-input";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/shared/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProfileSingle: FC = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    isAuthenticated,
    signOut,
    loading: isLoading,
    isDemoMode,
  } = useAuth();
  const { toast } = useToast();
  const {
    authenticate,
    verifyPin,
    isBiometricAvailable,
    isBiometricEnabled,
    hasPin,
  } = useBiometricAuth();

  // Funcin helper para verificar autenticacin
  const checkAuth = () => {
    return typeof isAuthenticated === "function"
      ? isAuthenticated()
      : !!isAuthenticated;
  };

  const requireSecureAccess = async (): Promise<boolean> => {
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

    // Sin biometría ni PIN configurados, permitir acceso pero en producción
    // se debería guiar al usuario a configurar un método seguro.
    return true;
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
  
  // Demo: controlar desbloqueo visual de fotos privadas en el propio perfil
  const [demoPrivateUnlocked, setDemoPrivateUnlocked] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const profileScore = useProfileScore(profile);

  // Estado para control parental: no auto-bloquear al cargar el perfil
  const [isParentalLocked, setIsParentalLocked] = useState(() => {
    const saved = localStorage.getItem("parentalControlLocked");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Estados para modal de carrusel avanzado
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLikes, setImageLikes] = useState<{ [key: string]: number }>({
    "1": 12,
    "2": 8,
    "3": 15,
  });
  const [imageUserLikes, setImageUserLikes] = useState<{
    [key: string]: boolean;
  }>({});
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalViews: 0,
    totalLikes: 0,
    totalMatches: 0,
    profileCompleteness: 0,
    lastActive: new Date(),
    joinDate: new Date(),
    verificationLevel: 0,
  });

  // Estados para funcionalidades blockchain
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [tokenBalances, setTokenBalances] = useState({
    cmpx: "0",
    gtk: "0",
    matic: "0",
  });
  const [testnetInfo, setTestnetInfo] = useState<any>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);
  // Determinar si es el perfil propio
  const isOwnProfile = checkAuth() && user?.id === profile?.id;

  // 🎨 Aplicar tema distintivo para perfil demo
  const isDemoProfile =
    Boolean(profile?.is_demo) ||
    (typeof profile?.id === "string" &&
      profile.id.startsWith("demo")) ||
    (typeof profile?.user_id === "string" &&
      profile.user_id.startsWith("demo"));
  const demoTheme = isDemoProfile ? "demo_premium" : undefined;
  useProfileTheme("single", ["male"], demoTheme);

  // Datos de imágenes privadas para el carrusel
  type PrivateImageItem = {
    id?: string;
    url?: string;
    src?: string;
    caption?: string;
    likes?: number;
    userLiked?: boolean;
  };

  const privateImages = useMemo(
    () =>
      Array.from({ length: 58 }).map((_, idx) => {
        const i = idx + 1;
        return {
          id: String(i),
          url: `/assets/people/single/privado/aprivadosingle${i}.jpg`,
          title: "Contenido privado",
          description: "Acceso privado",
        };
      }),
    [],
  );

  const profilePrivateImagesRaw = profile?.privateImages as
    | (PrivateImageItem | string)[]
    | undefined;
  const profilePrivateImages = profilePrivateImagesRaw?.filter((img) => {
    const src = typeof img === "string" ? img : (img.url ?? img.src ?? "");
    // Evitar que la galería privada repita exactamente el avatar principal
    return src && src !== profile?.avatar_url;
  });
  const galleryImages: (PrivateImageItem | string)[] = useMemo(() => {
    const source: (PrivateImageItem | string)[] =
      Array.isArray(profilePrivateImages) && profilePrivateImages.length > 0
        ? profilePrivateImages
        : privateImages;

    const shuffled = [...source];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = shuffled[i];
      const b = shuffled[j];
      if (a === undefined || b === undefined) continue;
      shuffled[i] = b;
      shuffled[j] = a;
    }
    return shuffled;
  }, [profilePrivateImages]);

  const isGalleryUnlocked =
    !isParentalLocked &&
    (isOwnProfile || demoPrivateUnlocked || privateImageAccess === "approved");

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

  const handleAddComment = (imageIndex: number) => {
    const imageId = imageIndex.toString();
    logger.info("Comentario solicitado en imagen privada", { imageId });
    toast({
      title: "Comentarios",
      description: "Funcionalidad de comentarios en galería privada en preparación.",
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
  };

  // Funciones para cargar datos adicionales
  const loadProfileStats = async () => {
    try {
      // Estadísticas fijas DEMO
      const mockStats = {
        totalViews: 456,
        totalLikes: 123,
        totalMatches: 78,
        profileCompleteness: 85,
        lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000),
        joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        verificationLevel: 2,
      };
      setProfileStats(mockStats);
    } catch (error) {
      logger.error("Error loading profile stats:", { error: String(error) });
    }
  };

  const handleShareProfile = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Perfil de ${profile?.name || "Usuario"}`,
          text: `Mira el perfil de ${profile?.name || "Usuario"} en ComplicesConecta`,
          url: window.location.href,
        });
      } else {
        // Fallback para navegadores que no soportan Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Enlace copiado",
          description: "El enlace al perfil se ha copiado al portapapeles.",
        });
        logger.info("URL copiada al portapapeles");
      }

      // Track en PostHog
      trackEvent("profile_shared", {
        profileId: profile?.id?.substring(0, 8) + "***",
        method: typeof navigator.share !== "undefined" ? "native" : "clipboard",
      });
    } catch (error) {
      logger.error("Error sharing profile:", { error: String(error) });
    }
  };

  const handleViewPrivatePhotos = async () => {
     if (await requireSecureAccess()) {
       setShowPrivateImageRequest(true);
     }
  };

  const handleDownloadProfile = () => {
    logger.info("Descargar perfil solicitado");

    // DEMO: Por seguridad, mostrar modal en lugar de descargar JSON plano
    const modalContent = `
📥 FUNCIÓN DE DESCARGA

En versión de producción:
 Datos encriptados
 Formato seguro (PDF/Encriptado)
 Autenticación requerida
 Watermark

VERSIÓN DEMO:
Datos protegidos por seguridad.

Información del perfil:
- Nombre: ${profile?.name || "Demo"}
- Email: ${user?.email?.substring(0, 3)}***@***
- Verificado: No disponible
- Fecha: ${new Date().toLocaleDateString()}
    `;

    toast({
      title: "Función de descarga (DEMO)",
      description:
        "Datos protegidos por seguridad. Disponible en producción con formato seguro.",
    });
    logger.info("Demo descarga mostrado - datos protegidos", { modalContent });
  };

  // Funciones para blockchain
  const loadBlockchainData = async (forcedUserId?: string) => {
    const targetUserId = forcedUserId || user?.id || null;

    try {
      if (targetUserId) {
        // Cargar información de wallet y tokens (real o demo con ID forzado)
        const [wallet, tokens, nfts, testnet] = await Promise.all([
          walletService.getOrCreateWallet(targetUserId).catch(() => null),
          walletService
            .getTokenBalances("")
            .catch(() => ({ cmpx: "0", gtk: "0", matic: "0" })),
          nftService.getUserNFTs(targetUserId).catch(() => []),
          walletService.getTestnetTokensInfo(targetUserId).catch(() => null),
        ]);
        setWalletInfo(wallet);
        setTokenBalances(tokens);
        setUserNFTs(nfts);
        setTestnetInfo(testnet);
        return;
      }

      // Fallback demo sin user.id: usar flag local para mostrar estado mínimo
      if (isDemoMode()) {
        const demoCreated =
          localStorage.getItem("wallet_demo_created") === "true";
        setWalletInfo(demoCreated ? { id: "demo", address: "DEMO" } : null);
        setTokenBalances({ cmpx: "0", gtk: "0", matic: "0" });
        setUserNFTs([]);
        setTestnetInfo({
          remaining: 1000,
          dailyRemaining: 2500000,
          canClaim: true,
          dailyLimit: 2500000,
          dailyClaimed: 0,
          claimed: 0,
          maxClaim: 1000,
        } as any);
      }
    } catch (error) {
      logger.error("Error cargando datos blockchain:", {
        error: String(error),
      });
    }
  };

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
        // Modo demo - simular reclamo diario
        const result = await walletService.executeDemoAction(
          uid,
          "send_tokens",
          { amount: 50000 },
        );
        logger.info("Tokens diarios reclamados (DEMO):", { result });

        // Actualizar estado local para demo
        setTestnetInfo((prev: any) => ({
          ...prev,
          dailyClaimed: (prev?.dailyClaimed || 0) + 50000,
          dailyRemaining: Math.max(
            0,
            (prev?.dailyRemaining || 2500000) - 50000,
          ),
        }));
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
    } finally {
      setIsClaimingTokens(false);
    }
  };

  // Migracin localStorage ? usePersistedState
  useEffect(() => {
    if (profile?.id) {
      loadProfileStats();
      loadBlockchainData();
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-white font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Perfil no encontrado</h2>
            <p className="text-white/80 mb-4">
              No se pudo cargar la informacin del perfil.
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
    "Sofía López",
  );

  const displayNickname = asString(
    asOptionalString(currentProfile["nickname"]) ??
      currentProfile.display_name ??
      asOptionalString(currentProfile["name"]),
    "sofia_love",
  ).replace(/^@/, "");

  const displayProfileId = asString(
    currentProfile.profile_id ?? currentProfile.id,
    "CC-2025-001",
  );

  const avatarUrl = asString(
    currentProfile.avatar_url,
    "/assets/people/single/f3.jpg",
  );

  const displayAge = currentProfile.age || 25;

  const displayGenderLabel = (() => {
    const g = currentProfile.gender?.toLowerCase();
    if (g === 'male') return 'Hombre';
    if (g === 'female') return 'Mujer';
    if (g === 'couple') return 'Pareja';
    return g || 'Usuario';
  })();

  const displayOrientationLabel = (() => {
    const i = currentProfile.interested_in?.toLowerCase();
    if (i === 'male') return 'Hombres';
    if (i === 'female') return 'Mujeres';
    if (i === 'couple') return 'Parejas';
    if (i === 'all' || i === 'everyone') return 'Todos';
    return i || 'Todo';
  })();

  const canShowBlockchainSection = isOwnProfile || isDemoProfile;

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0 pt-20">
      <div className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden mb-6">
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
                  <h2 className="profile-header-title">{displayName}</h2>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                    <Badge className="profile-badge badge-age">
                      🎂 {displayAge} años
                    </Badge>
                    <Badge className="profile-badge badge-gender">
                      {displayGenderLabel}
                    </Badge>
                    <Badge className="profile-badge badge-orientation">
                      {displayOrientationLabel}
                    </Badge>
                    <Badge className="profile-badge badge-location">
                      <MapPin className="w-3 h-3" />
                      {asString(currentProfile["location"], "CDMX, México")}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            className={cn(
                              "profile-badge flex items-center gap-1",
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
                  {SHOW_BIO_SECTION && asOptionalString(currentProfile["name"]) && (
                    <p className="text-white/90 mb-4 leading-relaxed">
                      {asString(currentProfile["name"], "")}
                    </p>
                  )}

                  {/* Botones de accin */}
                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
                    <Button
                      onClick={() => navigate("/edit-profile-single")}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar Perfil</span>
                      <span className="sm:hidden">Editar</span>
                    </Button>

                    <Button
                      onClick={handleShareProfile}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Compartir</span>
                      <span className="sm:hidden">Share</span>
                    </Button>

                    <TikTokShareButton
                      url={window.location.href}
                      text={`Mira el perfil de ${displayName} en ComplicesConecta ✨`}
                      hashtags={[
                        "ComplicesConecta",
                        "Swinger",
                        "Mexico",
                        "Dating",
                      ]}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                      variant="outline"
                      size="default"
                    />

                    <Button
                      onClick={handleDownloadProfile}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Descargar</span>
                      <span className="sm:hidden">Download</span>
                    </Button>

                    <Button
                      onClick={() => setShowReportDialog(true)}
                      className="bg-white/10 hover:bg-white/20 text-red-200 border border-red-400/40 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full"
                    >
                      <Flag className="w-4 h-4" />
                      <span className="hidden sm:inline">Reportar</span>
                      <span className="sm:hidden">Report</span>
                    </Button>

                    {/* Botón de usuario/sesión con Logout real */}
                    {isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full">
                            <UserIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Cuenta</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[180px]"
                        >
                          <DropdownMenuLabel>Sesión Activa</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigate("/profile")}
                          >
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              if (window.confirm("¿Cerrar sesión?")) {
                                try {
                                  await signOut();
                                } catch (error) {
                                  logger.error("Error during sign out:", { error });
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

                    {/* Botón para solicitar acceso a fotos privadas */}
                    {privateImageAccess === "none" && (
                      <Button
                        onClick={handleViewPrivatePhotos}
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white flex items-center gap-2 text-sm sm:text-base px-4 sm:px-5 py-2.5 rounded-full shadow-lg"
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
                    {privateImageAccess === "approved" && (
                      <Button
                        onClick={() => {
                          /* Mostrar galera privada */
                        }}
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

          {/* Estadísticas mejoradas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.totalViews}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70">
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
              <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.totalLikes}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70">Likes</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.totalMatches}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70">
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
              <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl hover:bg-white/10 transition-colors">
                <CardContent className="p-6 md:p-10 text-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {profileStats.profileCompleteness}%
                  </div>
                  <div className="text-xs sm:text-sm text-white/70">
                    Completo
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sección Blockchain - Perfil propio o demo */}
          {canShowBlockchainSection && (
            <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  Blockchain & NFTs
                  {isDemoMode() && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                      DEMO
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-4">
                {/* Información de Wallet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">CMPX</span>
                    </div>
                    <div className="text-lg font-bold">
                      {tokenBalances.cmpx}
                    </div>
                    <div className="text-xs text-white/70">Tokens Utility</div>
                  </div>

                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">GTK</span>
                    </div>
                    <div className="text-lg font-bold">{tokenBalances.gtk}</div>
                    <div className="text-xs text-white/70">Governance</div>
                  </div>

                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Images className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">NFTs</span>
                    </div>
                    <div className="text-lg font-bold">{userNFTs.length}</div>
                    <div className="text-xs text-white/70">Colección</div>
                  </div>
                </div>

                {/* Botones de Acción Blockchain */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => navigate("/tokens")}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-xl flex items-center gap-2 text-sm px-3 py-2 border"
                  >
                    <Wallet className="w-4 h-4" />
                    Billetera
                  </Button>

                  <Button
                    onClick={() => navigate("/nfts")}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white flex items-center gap-2 text-sm px-3 py-2 border border-white/10"
                  >
                    <Sparkles className="w-4 h-4" />
                    Crear NFT
                  </Button>

                  {/* Reclamar Tokens Gratuitos */}
                  {testnetInfo?.canClaim && testnetInfo?.remaining > 0 && (
                    <Button
                      onClick={handleClaimTestnetTokens}
                      disabled={isClaimingTokens}
                      className="bg-green-500/20 hover:bg-green-600/30 text-green-200 border-green-400/30 flex items-center gap-2 text-sm px-3 py-2 border"
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
                      className="bg-blue-500/20 hover:bg-blue-600/30 text-blue-200 border-blue-400/30 flex items-center gap-2 text-sm px-3 py-2 border"
                    >
                      <Calendar className="w-4 h-4" />
                      {isClaimingTokens
                        ? "Reclamando..."
                        : `Reclamar ${Math.floor(testnetInfo.dailyRemaining / 1000)}K CMPX Diarios`}
                    </Button>
                  )}

                  {/* Mintear NFT */}
                  <Modal>
                    <ModalTrigger asChild>
                      <button className="bg-purple-500/20 hover:bg-purple-600/30 text-purple-200 border-purple-400/30 flex items-center gap-2 text-sm px-3 py-2 border rounded-md">
                        <Camera className="w-4 h-4" />
                        Mintear NFT de Perfil
                      </button>
                    </ModalTrigger>
                    <ModalBody>
                      <ModalContent>
                        <h4 className="text-lg md:text-2xl text-neutral-100 font-bold text-center mb-4">
                          Generar NFT de Perfil
                        </h4>
                        <p className="text-neutral-300 text-sm text-center">
                          En modo demo puedes mintear hasta 4 NFTs para probar el
                          flujo.
                        </p>
                      </ModalContent>
                      <ModalFooter className="gap-4">
                        <NFTMintButton
                          userId={
                            user?.id ||
                            asString(currentProfile["user_id"], currentProfile.id)
                          }
                          type="single"
                          nftName={`Profile NFT #${userNFTs.length + 1}`}
                          nftDescription="NFT demo de perfil"
                          demoImageUrl={avatarUrl}
                          buttonText="Confirmar Mint"
                          onMintSuccess={async () => {
                            const uid =
                              user?.id || asOptionalString(currentProfile["user_id"]) || currentProfile.id;
                            if (!uid) return;
                            const updated = await nftService
                              .getUserNFTs(uid)
                              .catch(() => []);
                            setUserNFTs(updated);
                            toast({
                              title: "¡NFT minteado exitosamente!",
                              description: `Colección: ${Math.min(updated.length, 4)}/4`,
                            });
                          }}
                          className="w-full"
                        />
                      </ModalFooter>
                    </ModalBody>
                  </Modal>
                </div>

                {/* Información de Testnet */}
                {testnetInfo && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Estado Testnet Mumbai
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-white/70">Tokens Gratuitos:</span>
                        <div className="font-medium">
                          {testnetInfo.claimed || 0} /{" "}
                          {testnetInfo.maxClaim || 1000} CMPX
                        </div>
                      </div>
                      <div>
                        <span className="text-white/70">Tokens Diarios:</span>
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
                        <p className="text-xs text-white/60">
                          🎨 Tokens únicos que representan tu perfil en
                          blockchain
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate("/nfts")}
                          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs shadow-lg hover:shadow-purple-500/50 transition-all"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Crear NFT
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate("/nfts")}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          Saber más →
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                      {userNFTs.slice(0, 4).map((nft, index) => (
                        <div
                          key={nft.id || index}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all cursor-pointer group"
                        >
                          <div className="aspect-square rounded mb-2 overflow-hidden relative">
                            {nft.image ? (
                              <SafeImage
                                src={nft.image}
                                alt={`NFT #${nft.token_id}`}
                                className="w-full h-full group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                                <Images className="w-8 h-8 text-white/40" />
                              </div>
                            )}
                            <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                              #{nft.token_id}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="font-medium truncate">
                              {nft.name || `NFT #${nft.token_id}`}
                            </div>
                            <div className="text-white/70 capitalize text-[10px]">
                              {nft.rarity || "Común"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {userNFTs.length > 4 && (
                      <div className="text-center mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate("/nfts")}
                          className="text-xs text-white/70 hover:text-white"
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

          {/* Resumen rápido de Wallet & NFTs */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl">
            <CardContent className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-white/70">
                    Estado de cuenta NFT
                  </p>
                  <p className="text-xs sm:text-sm text-white">
                    CMPX:{" "}
                    <span className="font-semibold">{tokenBalances.cmpx}</span>
                    <span className="mx-2 text-white/40">·</span>
                    NFTs:{" "}
                    <span className="font-semibold">{userNFTs.length}</span>
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/tokens")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg shadow-purple-500/40 flex items-center gap-2"
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

          {/* Token Dashboard se gestiona sólo en la página /tokens; aquí dejamos el acceso rápido a través del botón "Gestionar mis Tokens" */}

          {/* Contenido del resumen - ProfileNavTabs existente */}
          <ProfileNavTabs
            isOwnProfile={isOwnProfile}
            onUploadImage={handleUploadImage}
            onDeletePost={handleDeletePost}
            onCommentPost={handleCommentPost}
          />

          {/* Intereses - grid demo con efecto hover */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white">Mis Intereses</CardTitle>
            </CardHeader>
            <CardContent>
              <HoverEffect
                items={[
                  {
                    title: "Lifestyle Exclusivo",
                    description:
                      "Conexiones seleccionadas para un círculo íntimo y sofisticado.",
                    link: "#",
                    icon: <TrendingUp className="w-5 h-5" />,
                  },
                  {
                    title: "Eventos VIP",
                    description:
                      "Acceso prioritario a fiestas privadas y experiencias lifestyle.",
                    link: "#",
                    icon: <Calendar className="w-5 h-5" />,
                  },
                  {
                    title: "Privacidad Total",
                    description:
                      "Perfiles protegidos, control parental y contenido sensible blindado.",
                    link: "#",
                    icon: <Lock className="w-5 h-5" />,
                  },
                  {
                    title: "Verificación Real",
                    description:
                      "Perfiles verificados para minimizar cuentas falsas y riesgos.",
                    link: "#",
                    icon: <CheckCircle className="w-5 h-5" />,
                  },
                  {
                    title: "Chat Encriptado",
                    description:
                      "Mensajes diseñados para máxima discreción y seguridad.",
                    link: "#",
                    icon: <MessageCircle className="w-5 h-5" />,
                  },
                  {
                    title: "Match Inteligente",
                    description:
                      "Recomendaciones basadas en intereses y compatibilidad real.",
                    link: "#",
                    icon: <Users className="w-5 h-5" />,
                  },
                ]}
                className="pt-2"
              />
            </CardContent>
          </Card>

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
                  <Modal>
                    <ModalTrigger asChild>
                      <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 rounded-xl py-3 shadow-lg hover:scale-[1.02] transition-all">
                        <Calendar className="w-4 h-4" />
                        Ver opciones VIP demo
                      </button>
                    </ModalTrigger>

                    <ModalBody>
                      <ModalContent>
                        <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
                          Reserva tu Experiencia VIP
                        </h4>
                        <div className="py-10 flex flex-wrap gap-x-4 gap-y-6 items-start justify-center max-w-sm mx-auto text-neutral-300">
                          <p className="text-center">
                            Accede a eventos exclusivos, fiestas privadas y
                            matchmaking prioritario.
                          </p>
                          {/* TODO: Inyectar aquí el contenido actual de VipBookingModal si se quiere reutilizar texto al 100% */}
                        </div>
                      </ModalContent>

                      <ModalFooter className="gap-4">
                        <button className="px-4 py-2 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm">
                          Cancelar
                        </button>
                        <button className="bg-purple-600 text-white text-sm px-4 py-2 rounded-md hover:bg-purple-700">
                          Solicitar Acceso
                        </button>
                      </ModalFooter>
                    </ModalBody>
                  </Modal>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Galera */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Images className="w-5 h-5" />
                Galera de Fotos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10">
              {/* Mostrar mensaje de acceso denegado si corresponde */}
              {privateImageAccess === "denied" && (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Acceso Denegado
                  </h3>
                  <p className="text-white/70">
                    Tu solicitud para ver las fotos privadas fue denegada.
                  </p>
                </div>
              )}

              {/* Galera pblica siempre visible */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 mb-6">
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
                    alt="Foto pública 1"
                    className="w-full h-full"
                  />
                </div>
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
                    alt="Foto pública 2"
                    className="w-full h-full"
                  />
                </div>
                <div className="aspect-square bg-gradient-to-br from-blue-400 to-teal-600 rounded-lg flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
                    alt="Foto pública 3"
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Galería privada mejorada con carrusel */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Fotos Privadas ({galleryImages.length})
                  </h4>
                  <Button
                    onClick={() => {
                      // BLOQUEAR es inmediato sin PIN
                      // DESBLOQUEAR requiere PIN (el modal ya está visible cuando isParentalLocked=true)
                      if (!isParentalLocked) {
                        // Bloquear ahora SIN PIN
                        setIsParentalLocked(true);
                        setDemoPrivateUnlocked(false);
                        localStorage.setItem(
                          "parentalControlLocked",
                          JSON.stringify(true),
                        );
                      }
                      // Si está bloqueado, NO hacer nada - el usuario debe usar el modal de PIN
                    }}
                    className={`text-xs px-3 py-1.5 flex items-center gap-1.5 transition-all ${
                      isParentalLocked
                        ? "bg-red-600/80 hover:bg-red-700/80 text-white cursor-default"
                        : "bg-orange-600/80 hover:bg-orange-700/80 text-white hover:scale-105"
                    }`}
                    disabled={isParentalLocked}
                  >
                    {isParentalLocked ? (
                      <>
                        <Lock className="w-3 h-3" />
                        🔒 Bloqueado (PIN requerido para desbloquear)
                      </>
                    ) : demoPrivateUnlocked ? (
                      <>
                        <Baby className="w-3 h-3" />
                        Bloquear Ahora
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Click en foto para desbloquear
                      </>
                    )}
                  </Button>
                </div>

                {/* SECCIÓN GALERÍA PRIVADA CORREGIDA */}
                <div className="mb-4">
                  <p className="text-white/60 text-xs mb-2">
                    🔒 Vista sin acceso (otros usuarios):
                  </p>
                  <div className="grid grid-cols-3 gap-4 md:gap-6 mt-4">
                    {galleryImages.map(
                      (img: PrivateImageItem | string, idx: number) => {
                        const imageSource =
                          typeof img === "string"
                            ? img
                            : (img.url ?? img.src ?? "");
                        return (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                            onClick={() => {
                              if (isParentalLocked) {
                                // Parental lock activo: sólo se puede desbloquear usando el PIN en el control parental
                                return;
                              }

                              // Si ya está desbloqueado, abrir carrusel
                              if (isGalleryUnlocked) {
                                setSelectedImageIndex(idx);
                                setShowImageModal(true);
                                return;
                              }

                              // En DEMO, al hacer click se desbloquea y se abre el carrusel privado
                              if (isDemoMode()) {
                                setDemoPrivateUnlocked(true);
                                setSelectedImageIndex(idx);
                                setShowImageModal(true);
                                return;
                              }

                              // En perfil propio (real), pedir autenticación segura y desbloquear
                              if (isOwnProfile) {
                                void handleViewPrivatePhotos();
                                return;
                              }

                              // En modo real (otros usuarios), disparamos la solicitud de acceso legal
                              setShowPrivateImageRequest(true);
                            }}
                          >
                            <img
                              src={imageSource}
                              alt="Private content"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "/assets/people/single/privado/aprivadosingle1.jpg";
                              }}
                              className={cn(
                                "w-full h-full object-cover transition-[filter,transform] duration-500",
                                isGalleryUnlocked
                                  ? "blur-0 scale-100"
                                  : "blur-2xl scale-110",
                              )}
                            />

                            {!isGalleryUnlocked && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/70 via-purple-800/60 to-blue-900/70 backdrop-blur-2xl transition-all duration-500 group-hover:bg-opacity-90">
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
                      },
                    )}
                  </div>
                </div>

                {/* Mostrar fotos normales si es dueño (para demo) */}
                {isOwnProfile && (
                  <div>
                    <p className="text-white/60 text-xs mb-2">
                      ✅ Vista con acceso (tu perfil):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                      {galleryImages.map((img, idx) => {
                        const imageSource =
                          typeof img === "string" ? img : (img.url ?? img.src ?? "");
                        return (
                          <div
                            key={typeof img === "string" ? `${img}-${idx}` : (img.id ?? idx)}
                            className="aspect-square rounded-lg overflow-hidden relative border-2 border-green-500/50"
                          >
                            <SafeImage
                              src={imageSource}
                              alt={`Foto privada ${idx + 1}`}
                              fallbackType="private"
                              className="w-full h-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
            setPrivateImageAccess("pending");
            setShowPrivateImageRequest(false);
          }}
        />
      )}

      {/* Control Parental */}
      <ParentalControl
        isLocked={isParentalLocked}
        onToggle={(locked) => {
          setIsParentalLocked(locked);
          localStorage.setItem("parentalControlLocked", JSON.stringify(locked));
          // Si se desbloquea, permitir acceso a imágenes privadas
          if (!locked) {
            setDemoPrivateUnlocked(true);
          } else {
            // Si se bloquea, ocultar imágenes privadas
            setDemoPrivateUnlocked(false);
          }
        }}
        onUnlock={() => {
          // Callback cuando se desbloquea exitosamente con PIN
          setDemoPrivateUnlocked(true);
        }}
      />

      {/* Modal de carrusel de imágenes */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={galleryImages.map((img) =>
          typeof img === "string" ? img : (img.url ?? img.src ?? ""),
        )}
        currentIndex={selectedImageIndex}
        onNavigate={navigateCarousel}
        onLike={handleImageLike}
        onComment={handleAddComment}
        likes={imageLikes}
        userLikes={imageUserLikes}
        isPrivate={true}
        isBlurred={!isGalleryUnlocked}
      />

      {/* Modal de reporte */}
      <ReportProfileDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportedUserId={profile?.id || ""}
        reportedUserName={asString(profile?.["name"], displayName)}
      />
    </div>
  );
};

export default ProfileSingle;
