import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent } from '@/components/ui/cards/Card';
import { 
  Grid3X3, 
  Play, 
  Upload, 
  Trash2,
  MessageCircle,
  Heart,
  Share,
  MoreHorizontal,
  Users,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/cn';
import StoriesContainer from '@/components/stories/StoriesContainer';
import { ComingSoonModal } from '@/components/modals/ComingSoonModal';
import { FeatureModal } from '@/components/modals/FeatureModal';
import { NFTMintButton } from '@/components/blockchain/NFTMintButton';
import { MatchCard } from '@/components/ui/MatchCard';
import CompatibilityModal from '@/components/modals/CompatibilityModal';
import { logger } from '@/lib/logger';
import { useAuth } from '@/features/auth/useAuth';
import { 
  useSmartMatching, 
  type UserProfile, 
  type PersonalityTraits, 
  type MatchingPreferences,
  type ActivityMetrics,
  type VerificationStatus 
} from '@/lib/ai/smartMatching';

// Mock Data Generators for AI Matching
const createMockPersonality = (): PersonalityTraits => ({
  openness: Math.floor(Math.random() * 40) + 60,
  conscientiousness: Math.floor(Math.random() * 40) + 60,
  extraversion: Math.floor(Math.random() * 100),
  agreeableness: Math.floor(Math.random() * 40) + 60,
  neuroticism: Math.floor(Math.random() * 30),
  adventurousness: Math.floor(Math.random() * 50) + 50,
  discretion: Math.floor(Math.random() * 40) + 60
});

const createMockPreferences = (): MatchingPreferences => ({
  ageRange: { min: 18, max: 99 },
  genderPreference: ['single', 'pareja'],
  maxDistance: 50,
  interests: [],
  dealBreakers: [],
  importance: {
    personality: 80,
    interests: 60,
    location: 40,
    activity: 50,
    verification: 70
  }
});

const createMockActivity = (): ActivityMetrics => ({
  lastActive: new Date(),
  responseRate: 90,
  profileCompleteness: 100,
  photosCount: 5,
  messagesExchanged: 100,
  meetingsArranged: 5
});

const createMockVerification = (): VerificationStatus => ({
  isVerified: true,
  photoVerified: true,
  phoneVerified: true,
  idVerified: true,
  coupleVerified: false
});

const mockCurrentUser: UserProfile = {
  id: 'current-user',
  name: 'Usuario Demo',
  age: 30,
  gender: 'single',
  location: { city: 'CDMX', coordinates: { lat: 19.4326, lng: -99.1332 } },
  interests: ['Música', 'Arte', 'Tecnología', 'Viajes'],
  personality: createMockPersonality(),
  preferences: createMockPreferences(),
  activity: createMockActivity(),
  verification: createMockVerification()
};

const mockCandidates: UserProfile[] = [
  {
    id: 'match-1',
    name: 'Valentina',
    age: 24,
    gender: 'single',
    location: { city: 'CDMX', coordinates: { lat: 19.4326, lng: -99.1332 } },
    interests: ['Música', 'Arte', 'Fotografía', 'Cine'],
    personality: createMockPersonality(),
    preferences: createMockPreferences(),
    activity: createMockActivity(),
    verification: createMockVerification()
  },
  {
    id: 'match-2',
    name: 'Pareja Aventurera',
    age: 28,
    gender: 'pareja',
    location: { city: 'Guadalajara', coordinates: { lat: 20.6597, lng: -103.3496 } },
    interests: ['Viajes', 'Lifestyle', 'Gastronomía', 'Naturaleza'],
    personality: createMockPersonality(),
    preferences: createMockPreferences(),
    activity: createMockActivity(),
    verification: { ...createMockVerification(), coupleVerified: true }
  },
  {
    id: 'match-3',
    name: 'Sofía',
    age: 26,
    gender: 'single',
    location: { city: 'Monterrey', coordinates: { lat: 25.6866, lng: -100.3161 } },
    interests: ['Fitness', 'Yoga', 'Salud', 'Lectura'],
    personality: createMockPersonality(),
    preferences: createMockPreferences(),
    activity: createMockActivity(),
    verification: createMockVerification()
  }
];

type TabType = 'posts' | 'stories' | 'gallery' | 'matches';

interface ProfileNavTabsProps {
  isOwnProfile?: boolean;
  onUploadImage?: () => void;
  onDeletePost?: (postId: string) => void;
  onCommentPost?: (postId: string) => void;
}

export const ProfileNavTabs: React.FC<ProfileNavTabsProps> = ({
  isOwnProfile = false,
  onUploadImage,
  onDeletePost,
  onCommentPost
}) => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();

  const isAuthFn = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);
  const currentUserId = (user as any)?.id as string | undefined;

  const loginLabel =
    (user as any)?.nickname ||
    (user as any)?.user_metadata?.nickname ||
    (profile as any)?.nickname ||
    (profile as any)?.display_name ||
    (profile as any)?.first_name ||
    (user as any)?.email?.split?.('@')?.[0] ||
    'Ingresar';

  const nftFileInputRef = useRef<HTMLInputElement | null>(null);
  const [nftImageFile, setNftImageFile] = useState<File | undefined>(undefined);

  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [isLiked, setIsLiked] = useState(false);
  const [demoPost, setDemoPost] = useState<any>(null);
  const [demoPostLikes, setDemoPostLikes] = useState(0);
  const [demoPostComments, setDemoPostComments] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const { findMatches } = useSmartMatching();
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    // Simular carga de matches con IA
    const results = findMatches(mockCurrentUser, mockCandidates, { limit: 10 });
    
    const formattedMatches = results.matches.map(match => {
      const candidate = mockCandidates.find(c => c.id === match.userId);
      return {
        id: match.userId,
        name: candidate?.name || 'Usuario',
        age: candidate?.age || 25,
        bio: candidate?.interests.join(' • ') || 'Sin bio',
        location: candidate?.location.city,
        avatar: `https://images.unsplash.com/photo-${match.userId === 'match-1' ? '1494790108755-2616b612b786' : match.userId === 'match-2' ? '1522071820081-009f0129c71c' : '1534528741775-53994a69daeb'}?w=400&h=400&fit=crop`,
        compatibility: match.totalScore,
        reasons: match.reasons.slice(0, 3),
        fullReasons: match.reasons,
        breakdown: match.breakdown,
        variant: 'grid' as const,
        accountType: (candidate?.gender === 'pareja' ? 'couple' : 'single') as 'single' | 'couple',
        verified: candidate?.verification.isVerified
      };
    });
    
    setMatches(formattedMatches);
  }, []);

  const handleMatchAction = (id: string, action: 'like' | 'pass' | 'super-like') => {
    // En un caso real, aquí se llamaría a la API
    logger.info('Match action en ProfileNavTabs', { id, action });
    
    if (action === 'super-like') {
      alert(`✨ ¡Has dado Super Like a este perfil! \n\nSe notificará al usuario inmediatamente.`);
    }
    
    setMatches(prev => prev.filter(m => m.id !== id));
  };

  const tabs = [
    {
      id: 'posts' as TabType,
      label: 'Posts',
      icon: Grid3X3,
      count: 12,
      visible: true
    },
    {
      id: 'stories' as TabType,
      label: 'Historias',
      icon: Play,
      count: 5,
      visible: true
    },
    {
      id: 'gallery' as TabType,
      label: 'Galería',
      icon: Upload,
      count: 24,
      visible: true
    },
    {
      id: 'matches' as TabType,
      label: 'Matches',
      icon: Users,
      count: 2,
      visible: isOwnProfile
    }
  ].filter(tab => tab.visible);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-4">
            {/* Posts Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Post Example - Perfil Single (Ana) */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">Ana</span>
                        <span className="text-white/60 text-sm">hace 2h</span>
                      </div>
                      <p className="text-white/90 text-sm">
                        Disfrutando de un día increíble y conociendo nuevos lugares ✨
                      </p>
                    </div>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => onDeletePost?.('post-1')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Post Image */}
                  <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg mb-3 overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop" 
                      alt="Post"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=400&fit=crop';
                      }}
                    />
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-2 transition-colors ${
                          isLiked 
                            ? 'text-pink-400 hover:text-pink-500' 
                            : 'text-white/60 hover:text-pink-400'
                        } hover:bg-white/10`}
                        onClick={() => {
                          setIsLiked(!isLiked);
                          setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
                        }}
                      >
                        <Heart className={`w-4 h-4 ${
                          isLiked ? 'fill-pink-400' : ''
                        }`} />
                        <span className="text-sm">{likeCount}</span>
                      </Button>
                    </motion.div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-blue-400 hover:bg-white/10 flex items-center gap-2"
                      onClick={() => onCommentPost?.('post-1')}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">8</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-green-400 hover:bg-white/10"
                      onClick={() => {
                        alert('🔗 Compartir post\n\n(Función demo)');
                      }}
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white hover:bg-white/10 ml-auto"
                      onClick={() => {
                        const options = window.confirm(
                          '⚙️ MÁS OPCIONES\n\n✅ Guardar post\n✅ Reportar\n✅ Ocultar\n\n(Función demo)'
                        );
                        if (options) {
                          alert('✅ Acción guardada');
                        }
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Post Demo Creado */}
              {demoPost && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        D
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">Demo User</span>
                          <span className="text-white/60 text-sm">hace 1 min</span>
                        </div>
                        <p className="text-white/90 text-sm">{demoPost.content}</p>
                      </div>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-white text-6xl">🎉</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-2 ${demoPostLikes > 0 ? 'text-pink-400' : 'text-white/60 hover:text-pink-400'}`}
                          onClick={() => setDemoPostLikes(prev => prev + 1)}
                        >
                          <Heart className={`w-4 h-4 ${demoPostLikes > 0 ? 'fill-pink-400' : ''}`} />
                          <span className="text-sm">{demoPostLikes}</span>
                        </Button>
                      </motion.div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white/60 hover:text-blue-400 flex items-center gap-2"
                        onClick={() => {
                          setShowComments(!showComments);
                          if (!showComments) {
                            setDemoPostComments(prev => prev + 1);
                          }
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{demoPostComments}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-white/60 hover:text-green-400">
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                    {showComments && (
                      <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-white/70 text-sm mb-2">💬 Comentarios demo:</p>
                        <div className="space-y-2">
                          <div className="text-xs text-white/60">
                            <span className="font-semibold text-white">Usuario 1:</span> ¡Me encanta! 😍
                          </div>
                          <div className="text-xs text-white/60">
                            <span className="font-semibold text-white">Usuario 2:</span> Genial 👏
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Empty State */}
              {!demoPost && (
                <div className="text-center py-12">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p className="text-white/60 mb-4">No hay posts aún</p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => {
                        onUploadImage?.();
                        setDemoPost({
                          id: `demo-${Date.now()}`,
                          content: '¡Nuevo post demo creado! 🎉',
                          timestamp: new Date().toISOString()
                        });
                      }}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Crear Post
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'stories':
        return (
          <div className="space-y-4">
            <StoriesContainer />
            <div className="text-center py-8">
              <Play className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <p className="text-white/60 mb-4">Tus historias aparecerán aquí</p>
              {isOwnProfile && (
                <Button
                  onClick={onUploadImage}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Crear Historia
                </Button>
              )}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-6">
            {/* Add Photo / Mint NFT Actions */}
            {isOwnProfile && (
              <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                 <Button
                  onClick={onUploadImage}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Foto
                </Button>

                <input
                  ref={nftFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Seleccionar archivo de imagen NFT"
                  title="Seleccionar archivo de imagen para NFT (JPEG, PNG, WebP)"
                  placeholder="Imagen NFT"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (!file) return;
                    setNftImageFile(file);
                    logger.info('NFT image selected', { name: file.name, size: file.size, type: file.type });
                  }}
                />

                <Button
                  onClick={() => nftFileInputRef.current?.click()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Crear NFT
                </Button>
              </div>
            )}

            {isOwnProfile && nftImageFile && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <div className="text-sm text-white/80">
                  Imagen seleccionada: <span className="text-white font-semibold">{nftImageFile.name}</span>
                </div>

                <NFTMintButton
                  userId={currentUserId || 'current-user'}
                  type="single"
                  nftName={nftImageFile.name.replace(/\.[^.]+$/, '')}
                  nftDescription="NFT creado desde galería"
                  imageFile={nftImageFile}
                  buttonText="Mintear NFT"
                  onMintSuccess={(nft) => {
                    setNftImageFile(undefined);
                    alert(`NFT Creado: ${nft.token_id}`);
                  }}
                  className="w-full"
                />
              </div>
            )}

            {/* Gallery Grid Pública */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Fotos Públicas
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="aspect-square bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" 
                    alt="Galería 1"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face';
                    }}
                  />
                </div>
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-600 rounded-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" 
                    alt="Galería 2"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Gallery Privada con Lock */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Fotos Privadas 🔒
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => alert('🔒 Solicita acceso para ver fotos privadas')}>
                  <img 
                    src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop" 
                    alt="Foto privada 1"
                    className="w-full h-full object-cover filter blur-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <span className="text-6xl mb-2">🔒</span>
                    <span className="text-white text-sm">Click para solicitar</span>
                  </div>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => alert('🔒 Solicita acceso para ver fotos privadas')}>
                  <img 
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop" 
                    alt="Foto privada 2"
                    className="w-full h-full object-cover filter blur-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-6xl">🔒</span>
                  </div>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => alert('🔒 Solicita acceso para ver fotos privadas')}>
                  <img 
                    src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop" 
                    alt="Foto privada 3"
                    className="w-full h-full object-cover filter blur-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-6xl">🔒</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Button for Own Profile */}
            {isOwnProfile && (
              <div className="text-center py-8">
                <Button
                  onClick={onUploadImage}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Imagen
                </Button>
              </div>
            )}
          </div>
        );

      case 'matches':
        return (
          <div className="space-y-4">
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    id={match.id}
                    name={match.name}
                    age={match.age}
                    bio={match.bio}
                    location={match.location}
                    avatar={match.avatar}
                    compatibility={match.compatibility}
                    reasons={match.reasons}
                    accountType={match.accountType}
                    variant="grid"
                    onLike={() => handleMatchAction(match.id, 'like')}
                    onPass={() => handleMatchAction(match.id, 'pass')}
                    onSuperLike={() => handleMatchAction(match.id, 'super-like')}
                    onViewDetails={() => setSelectedMatch(match)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Sparkles className="h-8 w-8 text-white/20" />
                </div>
                <p className="text-white/60 mb-2">¡Estás al día!</p>
                <p className="text-sm text-white/40">Vuelve más tarde para ver nuevos matches</p>
              </div>
            )}

            <CompatibilityModal
              isOpen={!!selectedMatch}
              onClose={() => setSelectedMatch(null)}
              compatibilityScore={selectedMatch?.compatibility}
              reasons={selectedMatch?.fullReasons}
              breakdown={selectedMatch?.breakdown}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            if (isAuthFn) {
              navigate('/settings');
              return;
            }
            navigate('/auth');
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
        >
          {isAuthFn ? loginLabel : 'Ingresar'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-white border-b-2 border-pink-400"
                  : "text-white/60 hover:text-white/80"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* Modales */}
      <ComingSoonModal 
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="Galería Privada"
        feature="Galería Privada"
      />
      
      <FeatureModal 
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        feature="connections"
      />
    </div>
  );
};


