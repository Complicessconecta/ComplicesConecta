import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from '@/components/ui/cards/Card';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MapPin, 
  Verified, 
  Crown, 
  Settings, 
  Share2, 
  Lock, 
  Images, 
  Flag, 
  Coins, 
  Wallet, 
  Users,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { CoupleProfileWithPartners } from '@/services/social/couple/CoupleProfilesService';
import { generateMockCoupleProfiles } from '@/fixtures/coupleProfiles';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useProfileScore } from '@/features/profile/useProfileScore';
import { VanishSearchInput } from '@/components/ui/vanish-search-input';
import { walletService, WalletService } from '@/services/payments/WalletService';
import { nftService } from '@/services/payments/NFTService';
import type { CoupleNFTRequest } from '@/types/blockchain';
import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useBiometricAuth } from '@/features/auth/useBiometricAuth';
import { ImageModal } from '@/components/profiles/shared/ImageModal';
import { ParentalControl } from '@/components/profiles/shared/ParentalControl';
import { PrivateImageRequest } from '@/components/profiles/shared/PrivateImageRequest';
import { ProfileNavTabs } from '@/components/profiles/shared/ProfileNavTabs';
 

function ProfileCouple() {
  const navigate = useNavigate();

  const { isAuthenticated, user, profile: authProfile, loading: authLoading } = useAuth();

  const { toast: shadcnToast } = useToast();
  const [_activeTab, _setActiveTab] = useState('about');
  const [profile, setProfile] = useState<CoupleProfileWithPartners | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateImageRequest, _setShowPrivateImageRequest] = useState(false);
  const [privateImageAccess, setPrivateImageAccess] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [_showReportDialog, _setShowReportDialog] = useState(false);
  const setShowReportDialog = _setShowReportDialog;
  const [demoPrivateUnlocked, _setDemoPrivateUnlocked] = useState(false);
  const [isParentalLocked, _setIsParentalLocked] = usePersistedState('parentalLock', false);
  
  // Estados para modal de imágenes
  const [showImageModal, _setShowImageModal] = useState(false);
  const [_selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLikes, setImageLikes] = useState<{[key: string]: number}>({});
  const [imageUserLikes, setImageUserLikes] = useState<{[key: string]: boolean}>({});
  const [_imageComments, _setImageComments] = useState<{[key: string]: string[]}>({});
  const [_commentInput, _setCommentInput] = useState('');
  const [_showCommentInputFor, _setShowCommentInputFor] = useState<number | null>(null);
  
  const couplePrivateBaseImages = [
    '/assets/people/couple/privado/privadocouple1.jpg',
    '/assets/people/couple/privado/privadocouple2.jpg',
    '/assets/people/couple/privado/privadocouple3.jpg',
    '/assets/people/couple/privado/privadocouple4.jpg',
  ];

  // Función para filtrar imágenes que coincidan con avatar (blindaje biométrico)
  const getFilteredPrivateImages = () => {
    if (!profile) return couplePrivateBaseImages;
    
    // Extraer iniciales de los nombres para crear un hash de filtrado
    const avatarHash = `${profile.partner1_first_name?.[0] || 'E'}${profile.partner2_first_name?.[0] || ''}`.toLowerCase();
    
    // Filtrar imágenes basado en hash del avatar (evita mostrar imágenes que coincidan con avatar público)
    return couplePrivateBaseImages.filter((_, index) => {
      // Usar el hash para determinar qué imágenes mostrar para este perfil específico
      const imageIndex = (avatarHash.charCodeAt(0) + avatarHash.charCodeAt(1)) % couplePrivateBaseImages.length;
      return index !== imageIndex && index !== (imageIndex + 1) % couplePrivateBaseImages.length;
    });
  };

  const _shuffledCouplePrivateImages = useMemo(() => {
    const filtered = getFilteredPrivateImages();
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [profile]);
  
  // Determinar si es el perfil propio: esta pantalla representa el perfil de la sesión actual
  const isOwnProfile = Boolean(user);

  const isGalleryUnlocked = !isParentalLocked && (isOwnProfile || demoPrivateUnlocked || privateImageAccess === 'approved');

  // Función para hacer funcional el botón "Ver Fotos Privadas"
  const handleViewPrivatePhotos = async () => {
    if (isParentalLocked) return;

    // Si ya hay acceso, abrir galería
    if (isGalleryUnlocked) {
      _setShowImageModal(true);
      return;
    }

    // Perfil propio: exigir acceso seguro y desbloquear
    if (isOwnProfile) {
      const ok = await _requireSecureAccess();
      if (!ok) return;
      _setDemoPrivateUnlocked(true);
      _setShowImageModal(true);
      return;
    }

    // Otros usuarios: solicitud de acceso
    _setShowPrivateImageRequest(true);
  };

  const _requireSecureAccess = async (): Promise<boolean> => {
    const username = user?.id || 'anonymous';

    if (isBiometricEnabled && isBiometricAvailable) {
      const result = await authenticate(username);
      if (result.success) {
        return true;
      }
      if (result.method === 'pin' && hasPin) {
        const pin = window.prompt('Ingresa tu PIN de 6 dígitos para desbloquear contenido privado:');
        if (!pin) return false;
        return await verifyPin(pin);
      }
    } else if (hasPin) {
      const pin = window.prompt('Ingresa tu PIN de 6 dígitos para desbloquear contenido privado:');
      if (!pin) return false;
      return await verifyPin(pin);
    }

    return true;
  };
  // Funciones para modal de imágenes
  const _handleImageLike = (imageIndex: number) => {
    const imageId = imageIndex.toString();
    const currentLikes = imageLikes[imageId] || 0;
    const userLiked = imageUserLikes[imageId] || false;
    
    if (userLiked) {
      setImageLikes(prev => ({ ...prev, [imageId]: currentLikes - 1 }));
      setImageUserLikes(prev => ({ ...prev, [imageId]: false }));
    } else {
      setImageLikes(prev => ({ ...prev, [imageId]: currentLikes + 1 }));
      setImageUserLikes(prev => ({ ...prev, [imageId]: true }));
    }
  };

  const _handleAddComment = (imageIndex: number, comment?: string) => {
    if (comment) {
      const imageId = imageIndex.toString();
      _setImageComments((prev: {[key: string]: string[]}) => ({
        ...prev,
        [imageId]: [...(prev[imageId] || []), comment]
      }));
      toast.success('Comentario añadido');
    }
  };

  const _navigateCarousel = (index: number) => {
    setSelectedImageIndex(index);
  };

  const navigateCarousel = _navigateCarousel;

  // Types derived from services
  type WalletInfo = Awaited<ReturnType<typeof walletService.getOrCreateWallet>>;
  type UserNFT = Awaited<ReturnType<typeof nftService.getUserNFTs>>[number];
  type TestnetInfo = Awaited<ReturnType<typeof walletService.getTestnetTokensInfo>>;

  // Estados para funcionalidades blockchain
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState({ cmpx: '0', gtk: '0', matic: '0' });
  const [_testnetInfo, setTestnetInfo] = useState<TestnetInfo | null>(null);
  const [coupleNFTs, setCoupleNFTs] = useState<UserNFT[]>([]);
  const [coupleRequests, setCoupleRequests] = useState<CoupleNFTRequest[]>([]);
  const [_isClaimingTokens, _setIsClaimingTokens] = useState(false);
  const [isDemoMode] = useState(WalletService.isDemoMode());

  const hasWalletActive = Boolean(walletInfo);
  const hasAnyNFTs = coupleNFTs.length > 0;

  // Estados para gestión legal
  const [_showLegalManager, _setShowLegalManager] = useState(false);
  const [_legalTab, _setLegalTab] = useState<'agreement' | 'dispute'>('agreement');

  const [hasActiveAgreement, setHasActiveAgreement] = useState(false);
  const [agreementMeta, setAgreementMeta] = useState<{
    id: string;
    agreementHash: string;
    signedAt: string | null;
    signerIp: string | null;
  } | null>(null);
  const [_isCheckingAgreement, setIsCheckingAgreement] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState<'ACTIVE' | 'FROZEN_DISPUTE' | 'DISSOLVED'>('ACTIVE');
  const [_showDisputeWarning, _setShowDisputeWarning] = useState(false);

  const {
    authenticate,
    verifyPin,
    isBiometricAvailable,
    isBiometricEnabled,
    hasPin,
  } = useBiometricAuth();

  // Verificar estado del acuerdo de pareja para hard-lock legal
  useEffect(() => {
    const loadAgreementStatus = async () => {
      if (!profile?.id) return;

      try {
        setIsCheckingAgreement(true);

        if (!supabase) {
          logger.error('Supabase client no está inicializado para verificar acuerdo de pareja');
          setHasActiveAgreement(false);
          setAgreementMeta(null);
          return;
        }

        const { data, error } = await (supabase as any)
          .from('couple_agreements' as any)
          .select('id, agreement_hash, status, signed_at, partner_1_id, partner_2_id, partner_1_ip, partner_2_ip')
          .eq('couple_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error verificando estado de acuerdo de pareja', { error });
          setHasActiveAgreement(false);
          setAgreementMeta(null);
          return;
        }

        // Interface for the agreement row to avoid 'any'
        interface AgreementRow {
          id: string;
          agreement_hash: string;
          status: string;
          signed_at: string | null;
          partner_1_id: string;
          partner_2_id: string;
          partner_1_ip?: string;
          partner_2_ip?: string;
        }

        const row = data as unknown as AgreementRow;

        if (row && row.status === 'ACTIVE') {
          let signerIp: string | null = null;
          if (user?.id && row.partner_1_id === user.id) {
            signerIp = row.partner_1_ip ?? null;
          } else if (user?.id && row.partner_2_id === user.id) {
            signerIp = row.partner_2_ip ?? null;
          } else {
            signerIp = row.partner_1_ip ?? row.partner_2_ip ?? null;
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
        logger.error('Error cargando estado de acuerdo de pareja', { error: String(error) });
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
        setRelationshipStatus('ACTIVE');
        return;
      }

      if (!supabase) {
        logger.error('Supabase client no está inicializado para verificar disputas de pareja');
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from('couple_disputes' as any)
          .select('resolved_at, resolution_type')
          .eq('couple_agreement_id', agreementMeta.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error obteniendo disputas de pareja', { error });
          return;
        }

        interface DisputeRow {
          resolved_at?: string | null;
          resolution_type?: string | null;
        }

        const dispute = data as unknown as DisputeRow | null;

        if (!dispute) {
          setRelationshipStatus('ACTIVE');
        } else if (!dispute.resolved_at) {
          // Existe disputa sin resolver -> cuenta en congelamiento
          setRelationshipStatus('FROZEN_DISPUTE');
        } else {
          // Disputa resuelta o confiscada -> relación disuelta
          setRelationshipStatus('DISSOLVED');
        }
      } catch (error) {
        logger.error('Error sincronizando estado de disputa de pareja', { error: String(error) });
      }
    };

    void loadDisputeState();
  }, [agreementMeta?.id]);

  // Handlers para las acciones del perfil
  const _handleUploadImage = () => {
    logger.info('Subir imagen solicitado');
    toast.info('🖼️ Subir Imagen (DEMO): En la versión completa, esto abrirá la galería.');
  };

  const _handleDeletePost = (postId: string) => {
    logger.info('Eliminar post solicitado', { postId });
    if (window.confirm('🗑️ ¿Seguro que quieres eliminar este post? (Acción de DEMO)')) {
      toast.success('✅ Post eliminado (temporalmente para el demo)');
    }
  };

  const _handleCommentPost = (postId: string) => {
    logger.info('Comentar post solicitado', { postId });
    toast.info('💬 Comentar Post (DEMO): Aquí se abriría la sección de comentarios.');
  };

  // Funciones blockchain específicas para parejas
  const loadCoupleBlockchainData = async () => {
    if (!user?.id) return;
    
    try {
      // Cargar información específica de pareja
      const [wallet, tokens, nfts, requests, testnet] = await Promise.all([
        walletService.getOrCreateWallet(user.id).catch(() => null),
        walletService.getTokenBalances('').catch(() => ({ cmpx: '0', gtk: '0', matic: '0' })),
        nftService.getUserNFTs(user.id).catch(() => []),
        nftService.getCoupleNFTRequests(user.id).catch(() => []),
        walletService.getTestnetTokensInfo(user.id).catch(() => null)
      ]);
      
      setWalletInfo(wallet);
      setTokenBalances(tokens);
      setCoupleNFTs(nfts.filter((nft: any) => Boolean(nft?.is_couple)));
      setCoupleRequests(requests);
      setTestnetInfo(testnet);
    } catch (error) {
      logger.error('Error cargando datos blockchain de pareja:', { error: String(error) });
    }
  };

  const handleRequestCoupleNFT = async (partnerEmail: string) => {
    if (!user?.id) return;

    // Gating legal: requiere contrato activo y cuenta no congelada
    if (!hasActiveAgreement) {
      toast.error('Acción bloqueada: se requiere un Contrato de Pareja ACTIVO para crear un NFT de pareja.');
      return;
    }

    if (relationshipStatus !== 'ACTIVE') {
      toast.error('Acción bloqueada: la cuenta de pareja está en protocolo de disolución y los activos están congelados.');
      return;
    }
    
    try {
      if (isDemoMode) {
        // Modo demo - simular creación
        logger.info('Solicitud de NFT de pareja creada (DEMO):', { partnerEmail });
        
        // Simular nueva solicitud
        const now = new Date().toISOString();
        const newRequest: CoupleNFTRequest = {
          id: `demo-${Date.now()}`,
          requester_user_id: user.id,
          partner_user_id: '',
          partner1_address: '',
          partner2_address: '',
          name: `NFT de ${profile?.partner1_first_name} & ${profile?.partner2_first_name}`,
          description: 'NFT de pareja con consentimiento doble',
          image_url: '',
          metadata_uri: 'ipfs://pending',
          status: 'pending',
          consent1_timestamp: now,
          expires_at: now,
          network: 'demo',
          created_at: now,
          updated_at: now,
        };
        
        setCoupleRequests(prev => [newRequest, ...prev]);
        
        // Simular respuesta del partner después de un tiempo
        setTimeout(() => {
          setCoupleRequests(prev => 
            prev.map(req => 
              req.id === newRequest.id 
                ? { ...req, status: 'approved', consent2_timestamp: new Date().toISOString() }
                : req
            )
          );
        }, 5000);
      } else {
        // Modo real - crear solicitud real
        // Crear un archivo temporal para el NFT de pareja
        const tempFile = new File([''], 'couple-nft.png', { type: 'image/png' });
        const request = await nftService.requestCoupleNFT(user.id, partnerEmail, `NFT de ${profile?.partner1_first_name} & ${profile?.partner2_first_name}`, 'NFT de pareja con consentimiento doble', tempFile);
        logger.info('Solicitud de NFT de pareja creada:', { request });
        
        // Recargar solicitudes
        const updatedRequests = await nftService.getCoupleNFTRequests(user.id);
        setCoupleRequests(updatedRequests);
      }
    } catch (error) {
      logger.error('Error creando solicitud de NFT de pareja:', { error: String(error) });
    }
  };
  
  // Migración localStorage -> usePersistedState
  const [demoAuth, _setDemoAuth] = usePersistedState('demo_authenticated', 'false');
  const [demoUser, _setDemoUser] = usePersistedState<any>('demo_user', null); // TODO: Define specific user type

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (authLoading) return;

        logger.info('🔍 ProfileCouple - Estado de autenticación:', {
          isAuthenticated: isAuthenticated(),
          user: !!user,
          authProfile: !!authProfile,
          checkDemo: true,
          source: 'ProfileCouple'
        });

        // Verificar si hay sesión demo activa PRIMERO
        if (demoAuth === 'true' && demoUser) {
          logger.info('🎬 Cargando perfil demo pareja...');
          const demoCoupleProfile: CoupleProfileWithPartners = {
            id: 'demo-couple-456',
            profile_id: 'CC-DEMO-001',
            couple_name: 'Sofía & Carlos',
            username: '@pareja_love',
            location: 'CDMX, México',
            couple_bio: 'Pareja abierta y respetuosa en busca de experiencias auténticas en CDMX.',
            is_verified: true,
            is_premium: false,
            relationship_type: 'man-woman',
            couple_images: [],
            partner1_id: 'demo-partner-1',
            partner1_first_name: 'Sofía',
            partner1_last_name: 'López',
            partner1_age: 28,
            partner1_gender: 'female' as const,
            partner1_bio: 'Amo el arte y los atardeceres.',
            partner2_id: 'demo-partner-2',
            partner2_first_name: 'Carlos',
            partner2_last_name: 'Ramírez',
            partner2_age: 32,
            partner2_gender: 'male',
            partner2_interested_in: 'female',
            partner2_bio: 'Fan de la tecnología y el buen café.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(demoCoupleProfile);
          setLoading(false);
          loadCoupleBlockchainData();
          return;
        }
        
        // Verificar autenticación usando useAuth
        if (!isAuthenticated()) {
          logger.info('🔒 No autenticado, redirigiendo a auth');
          navigate('/auth', { replace: true });
          return;
        }
        
        // Simular carga de perfil de pareja real
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockCoupleProfiles = generateMockCoupleProfiles();
        setProfile(mockCoupleProfiles[0] ?? null);
        setLoading(false);
        // Cargar datos blockchain
        loadCoupleBlockchainData();
        
      } catch (error) {
        logger.error('Error loading profile:', { error: String(error) });
        // Fallback a perfil mock
        const mockCoupleProfiles = generateMockCoupleProfiles();
        setProfile(mockCoupleProfiles[0] ?? null);
        setLoading(false);

        shadcnToast({
          title: "Error al cargar perfil",
          description: "Se está mostrando un perfil de ejemplo.",
          variant: "destructive"
        });
      }
    };
    
    loadProfile();
  }, [user, demoAuth, demoUser, navigate, authLoading]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="bg-black/80 backdrop-blur-md border-b border-white/30 p-3 sm:p-4 shadow-lg flex-shrink-0">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Cargando perfil...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden profile-page">
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="px-4 pt-4">
          <ProfileNavTabs
            isOwnProfile={isOwnProfile}
            onUploadImage={_handleUploadImage}
            onDeletePost={_handleDeletePost}
            onCommentPost={_handleCommentPost}
          />
        </div>
        {/* Header centrado */}
        <div className="profile-header-container">
          <div className="max-w-36rem mx-auto text-center space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <h1 className="profile-header-title">{profile.couple_name || 'Perfil de Pareja'}</h1>
                {profile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className={cn("profile-badge flex items-center gap-1", useProfileScore(profile).color)}>
                          <span>{useProfileScore(profile).icon}</span>
                          <span>{useProfileScore(profile).label}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Score de confianza: {useProfileScore(profile).score}/100</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isOwnProfile && hasWalletActive && (
                  <Badge className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/60 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg shadow-emerald-500/50 backdrop-blur-md">
                    <Wallet className="w-3 h-3" />
                    <span>WALLET ACTIVA</span>
                  </Badge>
                )}
                {isOwnProfile && hasAnyNFTs && (
                  <Badge className="flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/60 px-2.5 py-1 text-[10px] sm:text-xs shadow-lg shadow-purple-500/50 backdrop-blur-md">
                    <Users className="w-3 h-3" />
                    <span>NFT VERIFIED</span>
                  </Badge>
                )}
                {isOwnProfile && hasActiveAgreement && (
                  <Badge className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-400/70 px-2.5 py-1 text-[10px] sm:text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3" />
                    <span>CONTRATO ACTIVO</span>
                  </Badge>
                )}
              </div>
              <p className="profile-header-username">{profile.username || '@pareja_love'}</p>
              <p className="text-sm text-white/60">ID: {profile.profile_id || 'CC-2025-002'}</p>
              {isAuthenticated() && user && (
                <p className="profile-header-email">{user.email || 'Usuario'}</p>
              )}
            </div>

            <VanishSearchInput
              placeholders={[
                'Buscar parejas en Ciudad de México...',
                'Eventos exclusivos este fin de semana...',
                'Clubs verificados con alberca...',
                'Cenas románticas Lifestyle...',
                'Usuarios con intereses en Viajes...',
              ]}
              onSubmit={(val) => {
                logger.info('Buscando:', { val });
                toast.info(`Buscando: ${val}`);
              }}
            />
          </div>
        </div>
        
        {/* Contenido principal centrado */}
        <div className="flex-1 pb-20 px-2 sm:px-4 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 py-4">
            <div className="flex gap-1 sm:gap-2">
              <Button 
                className="bg-white/10 hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: `Perfil de ${profile ? profile.partner1_first_name : 'Ella'} y ${profile ? profile.partner2_first_name : 'Él'}`,
                      text: `Conoce a esta pareja en ComplicesConecta`,
                      url: window.location.href
                    }).catch((error) => {
                      logger.error('Error compartiendo perfil de pareja', { error: String(error) });
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => {
                        shadcnToast({
                          title: 'Enlace copiado',
                          description: 'Se copió al portapapeles.',
                        });
                      })
                      .catch((error) => {
                        logger.error('Error copiando enlace al portapapeles', { error: String(error) });
                      });
                  }
                }}
              >
                <Share2 className="h-4 w-4 text-white opacity-90" />
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReportDialog(true);
                }}
                className="bg-white/10 hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105 hover:bg-red-500/20 group"
              >
                <Flag className="h-4 w-4 text-white group-hover:text-red-400 transition-colors" />
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/edit-profile-couple');
                }}
                className="hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
              >
                <Settings className="h-4 w-4 text-white" />
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/tokens');
                }}
                className="hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
              >
                <Crown className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
            {/* Información principal de la pareja */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  {/* Avatares de la pareja */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold">
                        {profile?.partner1_first_name?.[0]?.toUpperCase() || 'E'}
                      </div>
                      {profile?.is_verified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Verified className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400 animate-pulse" />
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold">
                        {profile?.partner2_first_name?.[0]?.toUpperCase() || ''}
                      </div>
                      {profile?.is_verified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Verified className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información básica */}
                  <div className="flex flex-col items-center justify-start flex-1">
                    <h2 className="text-lg font-bold">{profile?.partner1_first_name} & {profile?.partner2_first_name}</h2>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge className="profile-badge badge-location">
                        <MapPin className="w-4 h-4" />
                        {profile?.location || 'CDMX, México'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                      <div>
                        <p className="font-semibold text-white">{profile.partner1_first_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="profile-badge badge-age">🎂 {profile.partner1_age} años</Badge>
                          <Badge className="profile-badge badge-gender">{profile.partner1_gender === 'female' ? '♀️' : '♂️'}</Badge>
                          <Badge className="profile-badge badge-orientation">{profile.partner1_interested_in === 'both' ? '⚥' : '⚤'}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{profile.partner2_first_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="profile-badge badge-age">🎂 {profile.partner2_age} años</Badge>
                          <Badge className="profile-badge badge-gender">{profile.partner2_gender === 'female' ? '♀️' : '♂️'}</Badge>
                          <Badge className="profile-badge badge-orientation">{profile.partner2_interested_in === 'both' ? '⚥' : '⚤'}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Biografía */}
                    <p className="text-sm text-white/90 mt-4">
                      Una pareja aventurera que busca nuevas experiencias y conexiones auténticas.
                    </p>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                      {isOwnProfile && (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/edit-profile-couple');
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar Perfil</span>
                          <span className="sm:hidden">Editar</span>
                        </Button>
                      )}
                      
                      {!isOwnProfile && (
                        <Button 
                          onClick={() => setShowReportDialog(true)}
                          className="bg-red-500/20 hover:bg-red-600/30 text-red-200 border-red-400/30 flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Flag className="w-4 h-4" />
                          <span className="hidden sm:inline">Reportar</span>
                          <span className="sm:hidden">Report</span>
                        </Button>
                      )}
                      
                      {/* Botón para solicitar acceso a fotos privadas */}
                      {privateImageAccess === 'none' && (
                        <Button 
                          onClick={handleViewPrivatePhotos}
                          className="bg-purple-600/80 hover:bg-purple-700/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">Ver Fotos Privadas</span>
                          <span className="sm:hidden">Privadas</span>
                        </Button>
                      )}
                      
                      {/* Estado de solicitud pendiente */}
                      {privateImageAccess === 'pending' && (
                        <Button 
                          disabled
                          className="bg-yellow-600/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">Solicitud Pendiente</span>
                          <span className="sm:hidden">Pendiente</span>
                        </Button>
                      )}
                      
                      {/* Acceso aprobado */}
                      {privateImageAccess === 'approved' && (
                        <Button 
                          onClick={() => _setShowImageModal(true)}
                          className="bg-green-600/80 hover:bg-green-700/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
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

            <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl">
              <CardContent className="p-6 md:p-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span className="font-semibold">Fotos Privadas</span>
                  </div>
                  <Button
                    onClick={() => {
                      if (!isParentalLocked) {
                        _setIsParentalLocked(true);
                        _setDemoPrivateUnlocked(false);
                        _setShowImageModal(false);
                      }
                    }}
                    disabled={isParentalLocked}
                    className={cn(
                      'text-xs px-3 py-1.5',
                      isParentalLocked ? 'bg-red-600/80 hover:bg-red-700/80 cursor-default' : 'bg-orange-600/80 hover:bg-orange-700/80 hover:scale-105'
                    )}
                  >
                    {isParentalLocked ? '🔒 Bloqueado (PIN requerido)' : 'Bloquear Ahora'}
                  </Button>
                </div>

                {privateImageAccess === 'denied' && (
                  <div className="text-center py-6">
                    <p className="text-white/70 text-sm">Tu solicitud para ver las fotos privadas fue denegada.</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 md:gap-6">
                  {_shuffledCouplePrivateImages.map((imageSource, idx) => (
                    <div
                      key={imageSource}
                      className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                      onClick={() => {
                        if (isParentalLocked) return;

                        if (isGalleryUnlocked) {
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
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/people/couple/privado/privadocouple1.jpg';
                        }}
                        className={cn(
                          'w-full h-full object-cover transition-[filter,transform] duration-500',
                          isGalleryUnlocked ? 'blur-0 scale-100' : 'blur-2xl scale-110'
                        )}
                      />

                      {!isGalleryUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/70 via-purple-800/60 to-blue-900/70 backdrop-blur-2xl transition-all duration-500 group-hover:bg-opacity-90">
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xl backdrop-blur-2xl">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                          <span className="mt-3 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold text-white/90 bg-white/10 border border-white/20 shadow-sm">
                            {isParentalLocked ? 'Bloqueado por Control Parental' : 'Click para desbloquear'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumen rápido de Wallet & NFTs de Pareja */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl mt-4">
              <CardContent className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-white/70">Estado de cuenta NFT de pareja</p>
                    <p className="text-xs sm:text-sm text-white">
                      CMPX: <span className="font-semibold">{tokenBalances.cmpx}</span>
                      <span className="mx-2 text-white/40">·</span>
                      NFTs: <span className="font-semibold">{coupleNFTs.length}</span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/tokens')}
                  className="bg-gradient-to-r from-fuchsia-600 to-blue-600 hover:from-fuchsia-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg shadow-fuchsia-500/40 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isOwnProfile ? 'Gestionar mis Tokens' : 'Verificando activos...'}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Sección Blockchain para Parejas - Solo para perfil propio */}
            {isOwnProfile && (
              <Card className="bg-gradient-to-br from-fuchsia-600/20 to-purple-600/20 backdrop-blur-md border-fuchsia-400/30 text-white mt-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-fuchsia-400" />
                    <h3 className="text-lg font-semibold">Blockchain & NFTs de Pareja</h3>
                    {isDemoMode && (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                        DEMO
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">CMPX</span>
                      </div>
                      <div className="text-lg font-bold">{tokenBalances.cmpx}</div>
                      <div className="text-xs text-white/70">Tokens Compartidos</div>
                    </div>
                    
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm font-medium">NFTs Pareja</span>
                      </div>
                      <div className="text-lg font-bold">{coupleNFTs.length}</div>
                      <div className="text-xs text-white/70">Colección Conjunta</div>
                    </div>
                    
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm font-medium">Solicitudes</span>
                      </div>
                      <div className="text-lg font-bold">{coupleRequests.length}</div>
                      <div className="text-xs text-white/70">Pendientes</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      onClick={() => handleRequestCoupleNFT('pareja@demo.com')}
                      className="bg-fuchsia-500/20 hover:bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-400/30 flex items-center gap-2 text-sm px-3 py-2 border"
                    >
                      <Heart className="w-4 h-4" />
                      Crear NFT de Pareja
                    </Button>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      Sistema de Consentimiento Doble
                    </h4>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showPrivateImageRequest && (
        <PrivateImageRequest
          isOpen={showPrivateImageRequest}
          onClose={() => _setShowPrivateImageRequest(false)}
          profileId={profile.id}
          profileName={profile.couple_name || 'Perfil de Pareja'}
          profileType="couple"
          onRequestSent={() => {
            setPrivateImageAccess('pending');
            _setShowPrivateImageRequest(false);
          }}
        />
      )}

      <ParentalControl
        isLocked={isParentalLocked}
        onToggle={(locked) => {
          _setIsParentalLocked(locked);
          if (!locked) {
            _setDemoPrivateUnlocked(true);
          } else {
            _setDemoPrivateUnlocked(false);
            _setShowImageModal(false);
          }
        }}
        onUnlock={() => {
          _setDemoPrivateUnlocked(true);
        }}
      />

      <ImageModal
        isOpen={showImageModal}
        onClose={() => _setShowImageModal(false)}
        images={_shuffledCouplePrivateImages}
        currentIndex={_selectedImageIndex}
        onNavigate={navigateCarousel}
        onLike={_handleImageLike}
        onComment={_handleAddComment}
        likes={imageLikes}
        userLikes={imageUserLikes}
        isPrivate
        isBlurred={!isGalleryUnlocked}
      />
    </div>
  );
}

export default ProfileCouple;
