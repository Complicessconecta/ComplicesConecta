import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/Modal';
import { 
  Lock, 
  Trash2, 
  Heart, 
  MessageCircle,
  Globe,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { safeGetItem } from '@/lib/safeLocalStorage';

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  isPublic: boolean;
  uploadedAt: string;
  likes: number;
  comments: number;
}

interface GalleryProps {
  userId: string;
  profileName: string;
  profileType: 'single' | 'couple';
  isOwner: boolean;
}

// Datos demo para galerías - Agregar más muestras
const getDemoImages = (profileType: 'single' | 'couple'): GalleryImage[] => {
  const baseImages = [
    {
      id: 'demo-1',
      url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      caption: 'Disfrutando el día',
      isPublic: true,
      uploadedAt: '2024-01-15T10:30:00Z',
      likes: 12,
      comments: 3
    },
    {
      id: 'demo-2',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
      caption: 'Momento especial',
      isPublic: true,
      uploadedAt: '2024-01-14T15:20:00Z',
      likes: 8,
      comments: 1
    },
    {
      id: 'demo-3',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      caption: 'Experiencia única',
      isPublic: true,
      uploadedAt: '2024-01-13T14:00:00Z',
      likes: 18,
      comments: 4
    },
    {
      id: 'demo-4',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      caption: 'Aventura increíble',
      isPublic: false,
      uploadedAt: '2024-01-13T09:15:00Z',
      likes: 15,
      comments: 5
    },
    {
      id: 'demo-5',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      caption: 'Conexión auténtica',
      isPublic: false,
      uploadedAt: '2024-01-12T18:45:00Z',
      likes: 20,
      comments: 7
    },
    {
      id: 'demo-6',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      caption: 'Momento íntimo',
      isPublic: false,
      uploadedAt: '2024-01-11T16:30:00Z',
      likes: 25,
      comments: 9
    }
  ];

  if (profileType === 'couple') {
    return [
      ...baseImages,
      {
        id: 'demo-5',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        caption: 'Pareja perfecta',
        isPublic: true,
        uploadedAt: '2024-01-11T12:00:00Z',
        likes: 25,
        comments: 9
      }
    ];
  }

  return baseImages;
};

export const EnhancedGallery: React.FC<GalleryProps> = ({
  userId,
  profileName: _profileName,
  profileType,
  isOwner
}) => {
  const { user: _user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [_loading, setLoading] = useState(true);
  const [_isDemoMode, setIsDemoMode] = useState(false);
  const [_privateAccessRequests, _setPrivateAccessRequests] = useState<any[]>([]);
  const [imagesPerPage] = useState(12); // Mostrar 12 imágenes por página
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    checkModeAndLoadImages();
  }, [userId]);

  const checkModeAndLoadImages = async () => {
    const demoAuth = safeGetItem<string>('demo_authenticated', { validate: true, defaultValue: 'false' });
    const isDemo = demoAuth === 'true';
    setIsDemoMode(isDemo);

    if (isDemo) {
      // Cargar datos demo
      setImages(getDemoImages(profileType));
      setLoading(false);
      logger.info('🎭 Galería demo cargada:', { profileType, imageCount: getDemoImages(profileType).length });
    } else {
      // Cargar datos reales de Supabase
      await loadRealImages();
    }
  };

  const loadRealImages = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        logger.error('Supabase no está disponible');
        setImages(getDemoImages(profileType));
        setIsDemoMode(true);
        setLoading(false);
        return;
      }
      
      // Cargar imágenes públicas
      const { data: publicImages, error: publicError } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (publicError) {
        logger.error('Error cargando imágenes públicas:', { error: String(publicError) });
      }

      // Cargar imágenes privadas si es el propietario o tiene acceso
      let privateImages: unknown[] = [];
      if (isOwner) {
        const { data: privateData, error: privateError } = await supabase
          .from('media')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', false)
          .order('created_at', { ascending: false });

        if (privateError) {
          logger.error('Error cargando imágenes privadas:', { error: String(privateError) });
        } else {
          privateImages = privateData || [];
        }
      }

      // Combinar imágenes
      type MediaRow = {
        id?: string;
        file_url?: string;
        thumbnail_url?: string;
        is_public?: boolean | null;
        created_at?: string | null;
        metadata?: unknown;
        tags?: string[] | null;
      };

      const mappedPublic = (publicImages as MediaRow[] || []).map(img => ({
        id: img.id || Math.random().toString(),
        url: img.file_url || '',
        caption: '',
        isPublic: true,
        uploadedAt: img.created_at || new Date().toISOString(),
        likes: 0,
        comments: 0
      }));

      const mappedPrivate = (privateImages as MediaRow[] || []).map(img => ({
        id: img.id || Math.random().toString(),
        url: img.file_url || '',
        caption: '',
        isPublic: false,
        uploadedAt: img.created_at || new Date().toISOString(),
        likes: 0,
        comments: 0
      }));

      setImages([...mappedPublic, ...mappedPrivate]);
      setLoading(false);

    } catch (error) {
      logger.error('Error en carga de imágenes:', { error });
      setImages(getDemoImages(profileType));
      setIsDemoMode(true);
      setLoading(false);
    }
  };

  const displayedImages = showAll ? images : images.slice(0, imagesPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Galería de Fotos
          <Badge variant="secondary" className="ml-2">
            {images.length}
          </Badge>
        </h3>
        
        {isOwner && (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Subir Fotos
          </Button>
        )}
      </div>

      {/* Filtros de Galería */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="public">Públicas</TabsTrigger>
          <TabsTrigger value="private">Privadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedImages.map((image) => (
              <Card 
                key={image.id} 
                className="overflow-hidden cursor-pointer group relative aspect-square"
                onClick={() => setSelectedImage(image)}
              >
                <img 
                  src={image.url} 
                  alt={image.caption || "Gallery image"} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <div className="flex justify-between items-center text-white">
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {image.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {image.comments}
                      </span>
                    </div>
                    {!image.isPublic && <Lock className="h-3 w-3" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {images.length > imagesPerPage && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Ver menos' : 'Ver más'}
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Placeholder para otros tabs */}
        <TabsContent value="public" className="mt-6">
          <p className="text-center text-muted-foreground py-8">Mostrando solo fotos públicas...</p>
        </TabsContent>
        <TabsContent value="private" className="mt-6">
          <p className="text-center text-muted-foreground py-8">Mostrando solo fotos privadas...</p>
        </TabsContent>
      </Tabs>

      {/* Modal de Imagen */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-black/95 border-white/10 p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative flex flex-col md:flex-row h-[80vh]">
              <div className="flex-1 bg-black flex items-center justify-center relative">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.caption} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="w-full md:w-80 bg-background/95 backdrop-blur-md p-6 border-l border-white/10 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-white">
                      {selectedImage.caption || 'Sin título'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Subida el {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!selectedImage.isPublic && <Lock className="h-4 w-4 text-yellow-500" />}
                </div>
                
                <div className="flex-1">
                  {/* Comentarios irían aquí */}
                  <div className="text-center text-muted-foreground text-sm py-10">
                    No hay comentarios aún
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex gap-2">
                  <Button className="flex-1" variant="secondary">
                    <Heart className="h-4 w-4 mr-2" /> Me gusta
                  </Button>
                  {isOwner && (
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
