import React, { useState, useEffect, useMemo } from "react";
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
  Baby,
  Scale,
  Gavel,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { CouplePreNuptialAgreement } from './CouplePreNuptialAgreement';
import { CoupleDisputeManager } from './CoupleDisputeManager';
import { useNavigate } from "react-router-dom";
import { generateMockCoupleProfiles, type CoupleProfileWithPartners } from "@/features/profile/coupleProfiles";
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { usePersistedState } from '@/hooks/usePersistedState';
import { PrivateImageRequest } from '@/components/profile/PrivateImageRequest';
import { PrivateImageGallery } from '@/components/profile/PrivateImageGallery';
import { ReportProfileDialog } from '@/components/profile/ReportProfileDialog';
import { ProfileNavTabs } from '@/components/profiles/shared/ProfileNavTabs';
import { ImageModal } from '@/components/profiles/shared/ImageModal';
import { ParentalControl } from '@/components/profiles/shared/ParentalControl';
import { useProfileScore } from '@/features/profile/useProfileScore';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { ComplianceSignupForm } from '@/components/ui/compliance-signup-form';
import { EventsCarousel } from '@/components/ui/carousel/events-carousel';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from '@/components/modals/animated-modal';
import { FileUpload } from '@/components/ui/forms/file-upload';
import { VanishSearchInput } from '@/components/ui/vanish-search-input';
import { walletService, WalletService } from '@/services/WalletService';
import { nftService } from '@/services/NFTService';
import type { CoupleNFTRequest } from '@/types/blockchain';
import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useBiometricAuth } from '@/features/auth/useBiometricAuth';
 

function ProfileCouple() {
  const navigate = useNavigate();

  const { toast: shadcnToast } = useToast();
  const [_activeTab, _setActiveTab] = useState('about');
  const [profile, setProfile] = useState<CoupleProfileWithPartners | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateImageRequest, setShowPrivateImageRequest] = useState(false);
  const [privateImageAccess, setPrivateImageAccess] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [demoPrivateUnlocked, setDemoPrivateUnlocked] = useState(false);
  const [isParentalLocked, setIsParentalLocked] = usePersistedState('parentalLock', false);
  
  // Estados para modal de imÃ¡genes
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  // FunciÃ³n para filtrar imÃ¡genes que coincidan con avatar (blindaje biomÃ©trico)
  const getFilteredPrivateImages = () => {
    if (!profile) return couplePrivateBaseImages;
    
    // Extraer iniciales de los nombres para crear un hash de filtrado
    const avatarHash = `${profile.partner1_first_name?.[0] || 'E'}${profile.partner2_first_name?.[0] || ''}`.toLowerCase();
    
    // Filtrar imÃ¡genes basado en hash del avatar (evita mostrar imÃ¡genes que coincidan con avatar pÃºblico)
    return couplePrivateBaseImages.filter((_, index) => {
      // Usar el hash para determinar quÃ© imÃ¡genes mostrar para este perfil especÃ­fico
      const imageIndex = (avatarHash.charCodeAt(0) + avatarHash.charCodeAt(1)) % couplePrivateBaseImages.length;
      return index !== imageIndex && index !== (imageIndex + 1) % couplePrivateBaseImages.length;
    });
  };

  const shuffledCouplePrivateImages = useMemo(() => {
    const filtered = getFilteredPrivateImages();
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [profile]);
  
  // FunciÃ³n para hacer funcional el botÃ³n "Ver Fotos Privadas"
  const handleViewPrivatePhotos = () => {
    if (isOwnProfile) {
      if (isParentalLocked) {
        return;
      }
      setDemoPrivateUnlocked(true);
    } else {
      setShowPrivateImageRequest(true);
    }
  };

  const requireSecureAccess = async (): Promise<boolean> => {
    const username = user?.id || 'anonymous';

    if (isBiometricEnabled && isBiometricAvailable) {
      const result = await authenticate(username);
      if (result.success) {
        return true;
      }
      if (result.method === 'pin' && hasPin) {
        const pin = window.prompt('Ingresa tu PIN de 6 dÃ­gitos para desbloquear contenido privado:');
        if (!pin) return false;
        return await verifyPin(pin);
      }
    } else if (hasPin) {
      const pin = window.prompt('Ingresa tu PIN de 6 dÃ­gitos para desbloquear contenido privado:');
      if (!pin) return false;
      return await verifyPin(pin);
    }

    return true;
  };
  // Funciones para modal de imÃ¡genes
  const handleImageLike = (imageIndex: number) => {
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

  const handleAddComment = (imageIndex: number, comment?: string) => {
    if (comment) {
      const imageId = imageIndex.toString();
      _setImageComments((prev: {[key: string]: string[]}) => ({
        ...prev,
        [imageId]: [...(prev[imageId] || []), comment]
      }));
      toast.success('Comentario aÃ±adido');
    }
  };

  const navigateCarousel = (index: number) => {
    setSelectedImageIndex(index);
  };

  const { isAuthenticated, user, profile: authProfile, loading: authLoading } = useAuth();

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

  // Estados para gestiÃ³n legal
  const [showLegalManager, setShowLegalManager] = useState(false);
  const [legalTab, setLegalTab] = useState<'agreement' | 'dispute'>('agreement');

  const [hasActiveAgreement, setHasActiveAgreement] = useState(false);
  const [agreementMeta, setAgreementMeta] = useState<{
    id: string;
    agreementHash: string;
    signedAt: string | null;
    signerIp: string | null;
  } | null>(null);
  const [_isCheckingAgreement, setIsCheckingAgreement] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState<'ACTIVE' | 'FROZEN_DISPUTE' | 'DISSOLVED'>('ACTIVE');
  const [showDisputeWarning, setShowDisputeWarning] = useState(false);

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
          logger.error('Supabase client no estÃ¡ inicializado para verificar acuerdo de pareja');
          setHasActiveAgreement(false);
          setAgreementMeta(null);
          return;
        }

        const { data, error } = await supabase
          .from('couple_agreements')
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

        const row = data as any;

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
      // Si no hay acuerdo activo asociado, asumimos relaciÃ³n activa sin disputa
      if (!agreementMeta?.id) {
        setRelationshipStatus('ACTIVE');
        return;
      }

      if (!supabase) {
        logger.error('Supabase client no estÃ¡ inicializado para verificar disputas de pareja');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('couple_disputes')
          .select('resolved_at, resolution_type')
          .eq('couple_agreement_id', agreementMeta.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error obteniendo disputas de pareja', { error });
          return;
        }

        if (!data) {
          setRelationshipStatus('ACTIVE');
        } else if (!data.resolved_at) {
          // Existe disputa sin resolver â†’ cuenta en congelamiento
          setRelationshipStatus('FROZEN_DISPUTE');
        } else {
          // Disputa resuelta o confiscada â†’ relaciÃ³n disuelta
          setRelationshipStatus('DISSOLVED');
        }
      } catch (error) {
        logger.error('Error sincronizando estado de disputa de pareja', { error: String(error) });
      }
    };

    void loadDisputeState();
  }, [agreementMeta?.id]);

  const handleAgreementComplete = (agreementId: string) => {
    logger.info('Acuerdo prenupcial completado desde ProfileCouple', { agreementId });
    setHasActiveAgreement(true);
    setAgreementMeta(prev => ({
      id: agreementId,
      agreementHash: prev?.agreementHash ?? '',
      signedAt: prev?.signedAt ?? new Date().toISOString(),
      signerIp: prev?.signerIp ?? null,
    }));
  };

  // Determinar si es el perfil propio
  const isOwnProfile = user?.id === profile?.id;

  // Handlers para las acciones del perfil
  const handleUploadImage = () => {
    logger.info('Subir imagen solicitado');
    toast.info('ðŸ–¼ï¸ Subir Imagen (DEMO): En la versiÃ³n completa, esto abrirÃ¡ la galerÃ­a.');
  };

  const handleDeletePost = (postId: string) => {
    logger.info('Eliminar post solicitado', { postId });
    if (window.confirm('ðŸ—‘ï¸ Â¿Seguro que quieres eliminar este post? (AcciÃ³n de DEMO)')) {
      toast.success('âœ… Post eliminado (temporalmente para el demo)');
    }
  };

  const handleCommentPost = (postId: string) => {
    logger.info('Comentar post solicitado', { postId });
    toast.info('ðŸ’¬ Comentar Post (DEMO): AquÃ­ se abrirÃ­a la secciÃ³n de comentarios.');
  };

  // Funciones blockchain especÃ­ficas para parejas
  const loadCoupleBlockchainData = async () => {
    if (!user?.id) return;
    
    try {
      // Cargar informaciÃ³n especÃ­fica de pareja
      const [wallet, tokens, nfts, requests, testnet] = await Promise.all([
        walletService.getOrCreateWallet(user.id).catch(() => null),
        walletService.getTokenBalances('').catch(() => ({ cmpx: '0', gtk: '0', matic: '0' })),
        nftService.getUserNFTs(user.id).catch(() => []),
        nftService.getCoupleNFTRequests(user.id).catch(() => []),
        walletService.getTestnetTokensInfo(user.id).catch(() => null)
      ]);
      
      setWalletInfo(wallet);
      setTokenBalances(tokens);
      setCoupleNFTs(nfts.filter(nft => nft.is_couple));
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
      toast.error('AcciÃ³n bloqueada: se requiere un Contrato de Pareja ACTIVO para crear un NFT de pareja.');
      return;
    }

    if (relationshipStatus !== 'ACTIVE') {
      toast.error('AcciÃ³n bloqueada: la cuenta de pareja estÃ¡ en protocolo de disoluciÃ³n y los activos estÃ¡n congelados.');
      return;
    }
    
    try {
      if (isDemoMode) {
        // Modo demo - simular creaciÃ³n
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
          metadata_uri: undefined,
          status: 'pending',
          consent1_timestamp: now,
          consent2_timestamp: undefined,
          expires_at: now,
          token_id: undefined,
          contract_address: undefined,
          network: 'demo',
          created_at: now,
          updated_at: now,
        };
        
        setCoupleRequests(prev => [newRequest, ...prev]);
        
        // Simular respuesta del partner despuÃ©s de un tiempo
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
        logger.info('Solicitud de NFT de pareja creada:', request);
        
        // Recargar solicitudes
        const updatedRequests = await nftService.getCoupleNFTRequests(user.id);
        setCoupleRequests(updatedRequests);
      }
    } catch (error) {
      logger.error('Error creando solicitud de NFT de pareja:', { error: String(error) });
    }
  };
  
  // MigraciÃ³n localStorage â†’ usePersistedState
  const [demoAuth, _setDemoAuth] = usePersistedState('demo_authenticated', 'false');
  const [demoUser, _setDemoUser] = usePersistedState<any>('demo_user', null); // TODO: Define specific user type

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (authLoading) return;

        logger.info('ðŸ” ProfileCouple - Estado de autenticaciÃ³n:', {
          isAuthenticated: isAuthenticated(),
          user: !!user,
          authProfile: !!authProfile
        });

        // Verificar si hay sesiÃ³n demo activa PRIMERO
        if (demoAuth === 'true' && demoUser) {
          logger.info('ðŸŽ­ Cargando perfil demo pareja...');
          const demoCoupleProfile: CoupleProfileWithPartners = {
            id: 'demo-couple-456',
            profile_id: 'CC-DEMO-001',
            couple_name: 'SofÃ­a & Carlos',
            username: '@pareja_love',
            location: 'CDMX, MÃ©xico',
            couple_bio: 'Pareja abierta y respetuosa en busca de experiencias autÃ©nticas en CDMX.',
            is_verified: true,
            is_premium: false,
            relationship_type: 'man-woman',
            couple_images: [],
            partner1_id: 'demo-partner-1',
            partner1_first_name: 'SofÃ­a',
            partner1_last_name: 'LÃ³pez',
            partner1_age: 28,
            partner1_gender: 'female' as const,
            partner1_bio: 'Amo el arte y los atardeceres.',
            partner2_id: 'demo-partner-2',
            partner2_first_name: 'Carlos',
            partner2_last_name: 'RamÃ­rez',
            partner2_age: 32,
            partner2_gender: 'male',
            partner2_interested_in: 'female',
            partner2_bio: 'Fan de la tecnologÃ­a y el buen cafÃ©.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(demoCoupleProfile);
          setLoading(false);
          loadCoupleBlockchainData();
          return;
        }
        
        // Verificar autenticaciÃ³n usando useAuth
        if (!isAuthenticated()) {
          logger.info('ðŸ”’ No autenticado, redirigiendo a auth');
          navigate('/auth', { replace: true });
          return;
        }
        
        // Simular carga de perfil de pareja real
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockCoupleProfiles = generateMockCoupleProfiles();
        const selectedProfile = mockCoupleProfiles[0];
        
        setProfile(selectedProfile);
        setLoading(false);
        // Cargar datos blockchain
        loadCoupleBlockchainData();
        
      } catch (error) {
        logger.error('Error loading profile:', { error: String(error) });
        // Fallback a perfil mock
        const mockCoupleProfiles = generateMockCoupleProfiles();
        setProfile(mockCoupleProfiles[0]);
        setLoading(false);

        shadcnToast({
          title: "Error al cargar perfil",
          description: "Se estÃ¡ mostrando un perfil de ejemplo.",
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
                'Buscar parejas en Ciudad de MÃ©xico...',
                'Eventos exclusivos este fin de semana...',
                'Clubs verificados con alberca...',
                'Cenas romÃ¡nticas Lifestyle...',
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
                variant="ghost" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 p-2 transition-all duration-300 hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: `Perfil de ${profile ? profile.partner1_first_name : 'Ella'} y ${profile ? profile.partner2_first_name : 'l'}`,
                      text: `Conoce a esta pareja en ComplicesConecta`,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href).then(() => 
                      alert('Enlace copiado al portapapeles')
                    ).catch(console.error);
                  }
                }}
              >
                <Share2 className="h-4 w-4 text-white opacity-90" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
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
                variant="ghost" 
                size="sm"
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
                variant="ghost" 
                size="sm"
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
            {/* Informacin principal de la pareja */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                  {/* Avatares de la pareja */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold">
                        {profile?.partner1_first_name?.[0]?.toUpperCase() || 'E'}
                      </div>
                      {profile?.is_verified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Verified className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 animate-pulse" />
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold">
                        {profile?.partner2_first_name?.[0]?.toUpperCase() || ''}
                      </div>
                      {profile?.is_verified && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                          <Verified className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informacin bsica */}
                  <div className="flex flex-col items-center justify-start flex-1">
                    <h2 className="text-lg font-bold">{profile?.partner1_first_name} & {profile?.partner2_first_name}</h2>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge className="profile-badge badge-location">
                        <MapPin className="w-4 h-4" />
                        {profile?.location || 'CDMX, MÃ©xico'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4">
                      <div>
                        <p className="font-semibold text-white">{profile.partner1_first_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="profile-badge badge-age">ðŸŽ‚ {profile.partner1_age} aÃ±os</Badge>
                          <Badge className="profile-badge badge-gender">{profile.partner1_gender === 'female' ? 'â™€ï¸' : 'â™‚ï¸'}</Badge>
                          <Badge className="profile-badge badge-orientation">{profile.partner1_interested_in === 'both' ? 'âš¥' : 'âš¤'}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{profile.partner2_first_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="profile-badge badge-age">ðŸŽ‚ {profile.partner2_age} aÃ±os</Badge>
                          <Badge className="profile-badge badge-gender">{profile.partner2_gender === 'female' ? 'â™€ï¸' : 'â™‚ï¸'}</Badge>
                          <Badge className="profile-badge badge-orientation">{profile.partner2_interested_in === 'both' ? 'âš¥' : 'âš¤'}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Biografa */}
                    <p className="text-sm text-white/90 mt-4">
                      Una pareja aventurera que busca nuevas experiencias y conexiones autnticas.
                    </p>

                    {/* Botones de accin */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                      {isOwnProfile && (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/edit-profile-couple');
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                          size="sm"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar Perfil</span>
                          <span className="sm:hidden">Editar</span>
                        </Button>
                      )}
                      
                      {!isOwnProfile && (
                        <Button 
                          onClick={() => setShowReportDialog(true)}
                          variant="outline"
                          className="bg-red-500/20 hover:bg-red-600/30 text-red-200 border-red-400/30 flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                          size="sm"
                        >
                          <Flag className="w-4 h-4" />
                          <span className="hidden sm:inline">Reportar</span>
                          <span className="sm:hidden">Report</span>
                        </Button>
                      )}
                      
                      {/* BotÃ³n para solicitar acceso a fotos privadas */}
                      {privateImageAccess === 'none' && (
                        <Button 
                          onClick={handleViewPrivatePhotos}
                          className="bg-purple-600/80 hover:bg-purple-700/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                          size="sm"
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
                          size="sm"
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline">Solicitud Pendiente</span>
                          <span className="sm:hidden">Pendiente</span>
                        </Button>
                      )}
                      
                      {/* Acceso aprobado */}
                      {privateImageAccess === 'approved' && (
                        <Button 
                          onClick={() => {/* Mostrar galera privada */}}
                          className="bg-green-600/80 hover:bg-green-700/80 text-white flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
                          size="sm"
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

            {/* Resumen rÃ¡pido de Wallet & NFTs de Pareja */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl mt-4">
              <CardContent className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-white/70">Estado de cuenta NFT de pareja</p>
                    <p className="text-xs sm:text-sm text-white">
                      CMPX: <span className="font-semibold">{tokenBalances.cmpx}</span>
                      <span className="mx-2 text-white/40">Â·</span>
                      NFTs: <span className="font-semibold">{coupleNFTs.length}</span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/tokens')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg shadow-purple-500/40 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isOwnProfile ? 'Gestionar mis Tokens' : 'Verificando activos...'}</span>
                </Button>
              </CardContent>
            </Card>

            {/* SecciÃ³n Blockchain para Parejas - Solo para perfil propio */}
            {isOwnProfile && (
              <Card className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-md border-pink-400/30 text-white mt-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-pink-400" />
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
                        <Users className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium">NFTs Pareja</span>
                      </div>
                      <div className="text-lg font-bold">{coupleNFTs.length}</div>
                      <div className="text-xs text-white/70">ColecciÃ³n Conjunta</div>
                    </div>
                    
                    <div className="p-3 bg-white/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium">Solicitudes</span>
                      </div>
                      <div className="text-lg font-bold">{coupleRequests.length}</div>
                      <div className="text-xs text-white/70">Pendientes</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      onClick={() => handleRequestCoupleNFT('pareja@demo.com')}
                      className="bg-pink-500/20 hover:bg-pink-600/30 text-pink-200 border-pink-400/30 flex items-center gap-2 text-sm px-3 py-2 border"
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
                    <p className="text-xs text-white/70 leading-relaxed">
                      Todos los NFTs de pareja requieren aprobaciÃ³n de ambos miembros.
                      {isDemoMode && ' (Modo demo - sin transacciones reales)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SecciÃ³n GestiÃ³n Legal - Solo para perfil propio */}
            {isOwnProfile && (
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border-slate-600/30 text-white mt-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-300" />
                      <h3 className="text-lg font-semibold">GestiÃ³n Legal de Pareja</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLegalManager(!showLegalManager)}
                      className="text-xs text-blue-200 hover:text-white hover:bg-white/10"
                    >
                      {showLegalManager ? 'Ocultar' : 'Gestionar'}
                    </Button>
                  </div>

                  {!showLegalManager ? (
                    <div className="text-sm text-gray-300">
                      <p>Gestiona tu Acuerdo Prenupcial Digital y resoluciÃ³n de disputas de forma segura en la blockchain.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex gap-2 border-b border-white/10 pb-2">
                        <Button
                          variant={legalTab === 'agreement' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLegalTab('agreement')}
                          className={legalTab === 'agreement' ? 'bg-blue-600' : 'hover:bg-white/10'}
                        >
                          Acuerdo Prenupcial
                        </Button>
                        <Button
                          variant={legalTab === 'dispute' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setShowDisputeWarning(true)}
                          className={legalTab === 'dispute' ? 'bg-red-600' : 'hover:bg-white/10'}
                        >
                          <Gavel className="w-4 h-4 mr-2" />
                          Disputas
                        </Button>
                      </div>

                      {legalTab === 'agreement' && (
                        <CouplePreNuptialAgreement
                          coupleId={profile.id}
                          partner1Id={profile.partner1_id}
                          partner2Id={profile.partner2_id}
                          onAgreementComplete={handleAgreementComplete}
                        />
                      )}

                      {legalTab === 'dispute' && (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-red-500/50 animate-pulse bg-red-950/40 p-4 md:p-6">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-300 mt-0.5" />
                              <div className="space-y-1 text-sm">
                                <p className="font-semibold text-red-100">
                                  Zona de DisoluciÃ³n Legal
                                </p>
                                <p className="text-red-100/80">
                                  AtenciÃ³n: Iniciar una disputa activa el protocolo de congelaciÃ³n inmediata
                                  de activos CMPX/GTK y NFTs de pareja. Durante la disputa, las transferencias
                                  y retiros estarÃ¡n bloqueados hasta que se registre una resoluciÃ³n.
                                </p>
                              </div>
                            </div>
                          </div>

                          <CoupleDisputeManager
                            coupleId={profile.id}
                            partner1Id={profile.partner1_id}
                            partner2Id={profile.partner2_id}
                            currentStatus={relationshipStatus}
                            onStatusChange={(status) => {
                              setRelationshipStatus(status as 'ACTIVE' | 'FROZEN_DISPUTE' | 'DISSOLVED');
                              logger.info('Estado de pareja cambiado:', { status });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Beneficios demo para parejas - grid con efecto hover */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardContent className="pt-4">
                <HoverEffect
                  items={[
                    {
                      title: 'Intercambio Seguro',
                      description: 'Acuerdos claros, control parental y consentimiento doble en cada paso.',
                      link: '#',
                      icon: <Heart className="w-5 h-5 text-pink-300" />,
                    },
                    {
                      title: 'Fiestas Privadas',
                      description: 'Invitaciones a eventos cerrados con parejas verificadas y anfitriones confiables.',
                      link: '#',
                      icon: <Crown className="w-5 h-5 text-yellow-300" />,
                    },
                    {
                      title: 'Clubes Verificados',
                      description: 'Acceso a clubes lifestyle auditados para seguridad y discreciÃ³n.',
                      link: '#',
                      icon: <Users className="w-5 h-5 text-purple-200" />,
                    },
                    {
                      title: 'Viajes Lifestyle',
                      description: 'Escapadas seleccionadas para parejas afines en destinos exclusivos.',
                      link: '#',
                      icon: <MapPin className="w-5 h-5 text-blue-200" />,
                    },
                    {
                      title: 'Comunidad Selecta',
                      description: 'Perfiles curados para minimizar fricciÃ³n y maximizar compatibilidad.',
                      link: '#',
                      icon: <Verified className="w-5 h-5 text-green-300" />,
                    },
                    {
                      title: 'Parejas Afines',
                      description: 'Algoritmos que priorizan intereses, lÃ­mites y estilo de relaciÃ³n.',
                      link: '#',
                      icon: <Baby className="w-5 h-5 text-pink-200" />,
                    },
                  ]}
                  className="pt-2"
                />
              </CardContent>
            </Card>

            {/* Experiencias demo compartidas: eventos, registro rÃ¡pido y verificaciÃ³n KYC */}
            <Card className="bg-black/60 backdrop-blur-xl border border-purple-500/30 text-white">
              <CardContent className="space-y-6 pt-4">
                <EventsCarousel />
                <div className="grid gap-4 lg:grid-cols-2">
                  <ComplianceSignupForm />
                  <div className="space-y-4">
                    <FileUpload />
                    <Modal>
                      <ModalTrigger asChild>
                        <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 rounded-xl py-3 shadow-lg">
                          <Heart className="w-4 h-4" />
                          <span>Ver experiencias VIP demo</span>
                        </button>
                      </ModalTrigger>

                      <ModalBody>
                        <ModalContent>
                          <h4 className="text-lg md:text-2xl text-white font-bold text-center mb-8">
                            Experiencias para Parejas
                          </h4>
                          <div className="text-center text-neutral-300 space-y-4">
                            <p>Conecta con otras parejas verificadas en un entorno seguro.</p>
                            {/* TODO: Reutilizar contenido existente de experiencias VIP para parejas si se define un bloque especÃ­fico */}
                          </div>
                        </ModalContent>
                        <ModalFooter className="gap-4">
                          <button className="bg-purple-600 text-white px-4 py-2 rounded-md">Continuar</button>
                        </ModalFooter>
                      </ModalBody>
                    </Modal>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Navigation Tabs - Estilo Twitter/Instagram */}
            <ProfileNavTabs 
              isOwnProfile={isOwnProfile}
              onUploadImage={handleUploadImage}
              onDeletePost={handleDeletePost}
              onCommentPost={handleCommentPost}
            />

            {/* SECCIÃ“N GALERÃA PRIVADA (DÃšO/PAREJA) BLINDADA */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Fotos Privadas (4)
                </h4>
                {/* Indicador de estado */}
                <div
                  className={`text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-full font-medium transition-all ${
                    isParentalLocked ? 'bg-red-600/80 text-white' : 'bg-green-600/80 text-white'
                  }`}
                >
                  {isParentalLocked ? <Lock className="w-3 h-3" /> : <Baby className="w-3 h-3" />}
                  {isParentalLocked ? 'Protegido' : 'Visible'}
                </div>
              </div>

              {/* Grid DinÃ¡mico (Igual que Single) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 cursor-pointer">
                {shuffledCouplePrivateImages.map((imageSrc, idx) => (
                  <div
                    key={imageSrc}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                    onClick={async () => {
                      if (isParentalLocked) {
                        alert('ðŸ”’ Contenido protegido. Ingresa el PIN de Control Parental para desbloquear.');
                        return;
                      }

                      if (isOwnProfile) {
                        const ok = await requireSecureAccess();
                        if (!ok) return;
                        setDemoPrivateUnlocked(true);
                        setSelectedImageIndex(idx);
                        setShowImageModal(true);
                      } else {
                        setShowPrivateImageRequest(true);
                      }
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Private couple content"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/people/couple/privado/privadocouple1.jpg'; }}
                      className={`w-full h-full object-cover transition-[filter,transform] duration-500 ${
                        isParentalLocked ? 'blur-2xl scale-110' : 'blur-0 scale-100'
                      }`}
                    />

                    {isParentalLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/70 via-purple-800/60 to-blue-900/70 backdrop-blur-2xl transition-all duration-500 group-hover:bg-opacity-90">
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xl backdrop-blur-2xl">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                        <span className="mt-3 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold text-white/90 bg-white/10 border border-white/20 shadow-sm">
                          Click para desbloquear
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            {/* Galera privada - solo si tiene acceso aprobado */}
            {(privateImageAccess === 'approved' || (demoPrivateUnlocked && isOwnProfile)) && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white mt-6">
                <CardContent className="p-4 sm:p-6">
                  <PrivateImageGallery
                    profileId={profile?.id || ''}
                    profileName={profile ? `${profile.partner1_first_name || ''} & ${profile.partner2_first_name || ''}` : 'Pareja'}
                    profileType="couple"
                    isOwner={false}
                    hasAccess={true}
                    images={[
                      {
                        id: '1',
                        url: '/assets/people/couple/privado/privadocouple1.jpg',
                        thumbnail: '/assets/people/couple/privado/privadocouple1.jpg',
                        uploadedAt: new Date(),
                      },
                      {
                        id: '2',
                        url: '/assets/people/couple/privado/privadocouple2.jpg',
                        thumbnail: '/assets/people/couple/privado/privadocouple2.jpg',
                        uploadedAt: new Date(),
                      },
                      {
                        id: '3',
                        url: '/assets/people/couple/privado/privadocouple3.jpg',
                        thumbnail: '/assets/people/couple/privado/privadocouple3.jpg',
                        uploadedAt: new Date(),
                      },
                      {
                        id: '4',
                        url: '/assets/people/couple/privado/privadocouple4.jpg',
                        thumbnail: '/assets/people/couple/privado/privadocouple4.jpg',
                        uploadedAt: new Date(),
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal de advertencia antes de entrar a la Zona de DisoluciÃ³n Legal */}
      {showDisputeWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center px-4">
          <div className="max-w-xl w-full bg-red-950/80 border border-red-500/50 animate-pulse rounded-2xl shadow-2xl p-6 md:p-10 text-white space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-300 mt-0.5" />
              <div className="space-y-2 text-sm">
                <h3 className="text-lg font-semibold">Usted estÃ¡ entrando a la Zona de DisoluciÃ³n Legal</h3>
                <p className="text-red-100/90">
                  Iniciar una disputa activarÃ¡ el protocolo de congelaciÃ³n inmediata de activos CMPX/GTK y NFTs de pareja.
                  Durante la disputa, las transferencias y retiros quedarÃ¡n bloqueados hasta que se registre una resoluciÃ³n
                  en el sistema.
                </p>
                <p className="text-xs text-red-100/80">
                  Esta acciÃ³n debe utilizarse solo en casos de ruptura real de la relaciÃ³n. Revise el Protocolo de Muerte
                  SÃºbita y las consecuencias de inacciÃ³n antes de continuar.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => {
                  setLegalTab('dispute');
                  setShowDisputeWarning(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                SÃ­, entrar a la Zona de DisoluciÃ³n
              </Button>
              <Button
                onClick={() => setShowDisputeWarning(false)}
                variant="outline"
                className="flex-1 border-white/40 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de solicitud de acceso a fotos privadas */}
      {showPrivateImageRequest && (
        <PrivateImageRequest
          isOpen={showPrivateImageRequest}
          onClose={() => setShowPrivateImageRequest(false)}
          profileId={profile?.id || ''}
          profileName={profile ? `${profile.partner1_first_name || ''} & ${profile.partner2_first_name || ''}` : 'Pareja'}
          profileType="couple"
          onRequestSent={() => {
            setPrivateImageAccess('pending');
            setShowPrivateImageRequest(false);
          }}
        />
      )}

      {/* Control Parental */}
      <ParentalControl
        isLocked={isParentalLocked}
        onToggle={(locked) => {
          setIsParentalLocked(locked);
          localStorage.setItem('parentalControlLocked', JSON.stringify(locked));
          if (!locked) {
            setDemoPrivateUnlocked(true);
          } else {
            setDemoPrivateUnlocked(false);
          }
        }}
        onUnlock={() => {
          setDemoPrivateUnlocked(true);
        }}
      />

      {/* Modal de carrusel de imÃ¡genes */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={shuffledCouplePrivateImages}
        currentIndex={selectedImageIndex}
        onNavigate={navigateCarousel}
        onLike={handleImageLike}
        onComment={handleAddComment}
        likes={imageLikes}
        userLikes={imageUserLikes}
        isPrivate={true}
      />

      {/* Modal de reporte */}
      <ReportProfileDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportedUserId={profile?.id || 'unknown'}
        reportedUserName={profile?.couple_name || `${profile?.partner1_first_name} & ${profile?.partner2_first_name}`}
      />

    </div>
  );
}

export default ProfileCouple;

