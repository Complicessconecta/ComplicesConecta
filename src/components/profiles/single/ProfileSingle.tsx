import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Verified, Settings, Share2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/features/auth/useAuth';
import { logger } from '@/lib/logger';
import { usePersistedState } from '@/hooks/usePersistedState';
import { PrivateImageRequest } from '@/components/profiles/shared/PrivateImageRequest';
import { ReportProfileDialog } from '@/components/profiles/shared/ReportProfileDialog';
import { ProfileNavTabs } from '@/components/profiles/shared/ProfileNavTabs';
import ProfileStats from '@/components/profiles/shared/ProfileStats';
import { useProfileScore } from '@/features/profile/useProfileScore';
import { walletService } from '@/services/WalletService';
import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBiometricAuth } from '@/features/auth/useBiometricAuth';
import { useProfileTheme } from '@/features/profile/useProfileTheme';
import type { Database } from '@/types/supabase';

// Type definition for ProfileRow (Single)
type ProfileRow = Partial<Database['public']['Tables']['profiles']['Row']> & {
    id: string;
    user_id: string;
    display_name?: string | null;
    nickname?: string | null;
    profile_id?: string | null;
    privateImages?: any[]; // Simplified
    avatar_url?: string | null;
    is_demo?: boolean;
    is_online?: boolean;
    is_premium?: boolean;
    gender?: string;
    interested_in?: string;
    bio?: string | null;
    location?: string | null;
    age?: number | null;
    verified?: boolean;
};

export function ProfileSingle() {
  const navigate = useNavigate();
  const [activeTab] = useState('about');
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateImageRequest, setShowPrivateImageRequest] = useState(false);
  const [, setPrivateImageAccess] = usePersistedState<'none' | 'pending' | 'approved' | 'denied'>('private_image_access_single', 'none');
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  // Auth & User
  const { isAuthenticated, user, profile: authProfile, loading: authLoading } = useAuth();
  
  // Biometrics
  useBiometricAuth();

  const profileScore = useProfileScore(profile);

  // Theme
  const isDemoProfile = profile?.is_demo || false;
  const demoTheme = isDemoProfile ? 'demo_premium' : undefined;
  useProfileTheme('single', ['male'], demoTheme); // Default to male theme for now, or dynamic

  // Blockchain States
  const [tokenBalances, setTokenBalances] = useState({ cmpx: '0', gtk: '0', matic: '0' });

  // Determine if own profile
  const isOwnProfile = useMemo(() => {
    if (!user?.id || !profile) return false;
    return user.id === profile.id || user.id === profile.user_id;
  }, [user?.id, profile]);

  // Load Profile Logic (Simulated for now based on ProfileCouple)
  useEffect(() => {
    const loadProfile = async () => {
        if (authLoading) return;
        
        if (!isAuthenticated()) {
            navigate('/auth', { replace: true });
            return;
        }

        try {
             // Simulate loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use authProfile if available, otherwise mock
            if (authProfile) {
                setProfile({
                    ...authProfile,
                    id: authProfile.id,
                    user_id: user?.id || '',
                    display_name: authProfile.display_name || 'Usuario',
                    profile_id: 'CC-SINGLE-001', // Mock ID
                    location: 'CDMX, México', // Mock location
                    age: 30, // Mock age
                    gender: 'male',
                    interested_in: 'female',
                    bio: 'Explorando la vida y nuevas conexiones.',
                    is_demo: false
                } as ProfileRow);
            } else {
                 // Fallback mock
                 setProfile({
                    id: 'demo-single-123',
                    user_id: 'demo-user-123',
                    display_name: 'Alejandro',
                    profile_id: 'CC-DEMO-SINGLE',
                    location: 'CDMX, México',
                    age: 28,
                    gender: 'male',
                    interested_in: 'female',
                    bio: 'Amante de la fotografía y el buen café.',
                    is_demo: true,
                    verified: true
                 } as ProfileRow);
            }
            setLoading(false);
            
            // Load blockchain data
             if (user?.id) {
                loadWalletData(user.id);
            }

        } catch (error) {
            logger.error('Error loading profile', { error });
             setLoading(false);
        }
    };
    
    loadProfile();
  }, [authLoading, isAuthenticated, user, navigate, authProfile]);

  const loadWalletData = async (userId: string) => {
      try {
          const wallet = await walletService.getOrCreateWallet(userId).catch(() => null);
          const tokens = wallet?.address 
            ? await walletService.getTokenBalances(wallet.address).catch(() => ({ cmpx: '0', gtk: '0', matic: '0' }))
            : { cmpx: '0', gtk: '0', matic: '0' };
            
           setTokenBalances(tokens);
      } catch (error) {
          logger.error('Error loading wallet data', { error });
      }
  };

  // Derived stats from profile score for demo purposes (until backend provides real stats)
  const stats = useMemo(() => {
      const baseScore = profileScore?.score || 50;
      return {
          likes: Math.floor(baseScore * 2.5) + (profile?.id ? 12 : 0),
          matches: Math.floor(baseScore * 0.8) + (profile?.id ? 5 : 0),
          visits: Math.floor(baseScore * 8.5) + (profile?.id ? 45 : 0)
      };
  }, [profileScore, profile?.id]);

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

  // Handlers
  const handleUploadImage = () => {
    logger.info('Subir imagen solicitado');
    toast.info('🖼️ Subir Imagen (DEMO): En la versión completa, esto abrirá la galería.');
  };

  const handleDeletePost = (postId: string) => {
    logger.info('Eliminar post solicitado', { postId });
    if (window.confirm('🗑️ ¿Seguro que quieres eliminar este post? (Acción de DEMO)')) {
      toast.success('✅ Post eliminado (temporalmente para el demo)');
    }
  };

  const handleCommentPost = (postId: string) => {
    logger.info('Comentar post solicitado', { postId });
    toast.info('💬 Comentar Post (DEMO): Aquí se abriría la sección de comentarios.');
  };

  return (
    <div className="min-h-screen bg-black/95 text-white pb-20">
        {/* Header Section */}
        <div className="relative">
            {/* Cover Image */}
            <div className="h-48 sm:h-64 w-full bg-gradient-to-r from-purple-900 to-indigo-900 overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&h=400&fit=crop" 
                    alt="Cover" 
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Profile Header Content */}
            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-white/10 shadow-xl mb-4 relative group">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span>{profile?.display_name?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                        <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-4 border-black flex items-center justify-center" title="En línea">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    {/* Name & ID */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                {profile?.display_name || 'Usuario'}
                            </h1>
                            {profile?.verified && (
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                                    <Verified className="w-3 h-3 mr-1" />
                                    Verificado
                                </Badge>
                            )}
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="outline" className={cn("ml-2 flex items-center gap-1 border-white/20", profileScore.color)}>
                                            <span>{profileScore.icon}</span>
                                            <span className="hidden sm:inline">{profileScore.label}</span>
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Score de confianza: {profileScore.score}/100</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-white/60 text-sm flex items-center justify-center gap-2">
                            <span>@{profile?.nickname || 'usuario'}</span>
                            <span>•</span>
                            <span>{profile?.age || 25} años</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {profile?.location || 'México'}
                            </span>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8 w-full sm:w-auto">
                        <Button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate('/edit-profile');
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center gap-2 text-sm sm:text-base px-4 py-2 flex-1 sm:flex-initial"
                            size="sm"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Editar Perfil</span>
                        </Button>
                        
                        <Button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (navigator.share) {
                                    navigator.share({
                                        title: `Perfil de ${profile.display_name}`,
                                        text: `Mira el perfil de ${profile.display_name} en ComplicesConecta`,
                                        url: window.location.href
                                    }).catch((error) => logger.error('Error compartiendo perfil', { error }));
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Enlace copiado');
                                }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white border-none flex items-center gap-2 text-sm sm:text-base px-4 py-2 flex-1 sm:flex-initial"
                            size="sm"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>Compartir</span>
                        </Button>

                        <Button 
                            variant="outline"
                            onClick={() => navigate('/settings')}
                            className="bg-transparent border-white/20 text-white hover:bg-white/10 flex-1 sm:flex-initial"
                            size="sm"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Bio Section (Moved up to match Couple style) */}
                    <Card className="bg-white/10 border-white/20 backdrop-blur-sm w-full max-w-4xl mb-6">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-pink-500" />
                                Sobre mí
                            </h3>
                            <p className="text-white/80 leading-relaxed">
                                {profile?.bio || '¡Hola! Soy nuevo en la comunidad. Me encanta conocer gente nueva y compartir experiencias.'}
                            </p>
                            
                            <div className="mt-6 flex flex-wrap gap-2">
                                {['Viajes', 'Música', 'Cine', 'Tecnología'].map((tag) => (
                                    <Badge key={tag} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/10">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Section */}
                    <div className="w-full max-w-4xl mb-6">
                        <ProfileStats stats={stats} />
                    </div>

                     {/* Wallet/Tokens Summary */}
                    <div className="w-full max-w-4xl mb-6">
                         <Card className="bg-white/5 backdrop-blur-xl border border-white/15 text-white rounded-2xl shadow-xl">
                          <CardContent className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs sm:text-sm text-white/70">Estado de cuenta</p>
                                <p className="text-xs sm:text-sm text-white">
                                  CMPX: <span className="font-semibold">{tokenBalances.cmpx}</span>
                                  <span className="mx-2 text-white/40">·</span>
                                  GTK: <span className="font-semibold">{tokenBalances.gtk}</span>
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => navigate('/tokens')}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg shadow-purple-500/40 flex items-center gap-2"
                            >
                              <Wallet className="w-4 h-4" />
                              <span>Gestionar mis Tokens</span>
                            </Button>
                          </CardContent>
                        </Card>
                    </div>

                    {/* Navigation Tabs (Shared Component) */}
                    <div className="w-full max-w-4xl mb-6">
                        <ProfileNavTabs 
                            isOwnProfile={isOwnProfile}
                            onUploadImage={handleUploadImage}
                            onDeletePost={handleDeletePost}
                            onCommentPost={handleCommentPost}
                        />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Private Gallery Access - Hidden for now, integrated in Tabs if needed */}
        {activeTab === 'gallery' && (
           <div className="hidden">
               {/* Legacy gallery content */}
           </div>
        )}

      {/* Dialogs */}
      <ReportProfileDialog 
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportedUserId={profile?.id || ''}
        reportedUserName={profile?.display_name || 'Usuario'}
      />
      
      <PrivateImageRequest
        isOpen={showPrivateImageRequest}
        onClose={() => setShowPrivateImageRequest(false)}
        profileId={profile?.id || ''}
        profileName={profile?.display_name || 'Usuario'}
        profileType="single"
        onRequestSent={() => {
            setPrivateImageAccess('pending');
            toast.success('Solicitud enviada correctamente');
        }}
      />
      
    </div>
  );
}

export default ProfileSingle;

