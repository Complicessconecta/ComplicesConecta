import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Modal';
import { Eye, Lock, Unlock, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import { getUserImages, deleteImage, ImageUpload } from '@/lib/images';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/features/auth/useAuth';
import { logger } from '@/lib/logger';
import { tokenService } from '@/services/TokenService';
import { supabase } from '@/integrations/supabase/client';

interface ImageGalleryProps {
  images: string[];
  _onImageClick?: (index: number) => void;
  _showUpload?: boolean;
  _onUpload?: (file: File) => void;
  profileId?: string;
  isOwner?: boolean;
}

export function ImageGallery({ images: _images, _onImageClick, _showUpload = false, _onUpload, profileId = '', isOwner = false }: ImageGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageUpload | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [unlockedProfiles, setUnlockedProfiles] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const GALLERY_UNLOCK_COST = 1000;

  useEffect(() => {
    loadImages();
    if (user) {
      loadUnlockedGalleries();
    }
  }, [profileId, user]);

  const loadUnlockedGalleries = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('gallery_unlocks')
        .select('profile_id')
        .eq('user_id', user.id);
      
      if (error) throw error;

      if (data) {
        setUnlockedProfiles(data.map(item => item.profile_id));
      }
    } catch (error) {
      logger.error('Error loading unlocked galleries:', { error });
    }
  };

  const loadImages = async () => {
    setLoading(true);
    try {
      const loadedImages = await getUserImages(profileId, isOwner);
      setImages(loadedImages);
    } catch (error) {
      logger.error('Error loading images:', { error });
      toast({
        variant: "destructive",
        title: "Error al cargar imágenes",
        description: "Error de conexión",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      const success = await deleteImage(imageId, profileId);
      
      if (success) {
        setImages(images.filter(img => img.id !== imageId));
        setSelectedImage(null);
        toast({
          title: "Imagen eliminada",
          description: "La imagen se eliminó correctamente.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: "No se pudo eliminar la imagen",
        });
      }
    } catch (error) {
      logger.error('Error deleting image:', { error });
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "No se pudo eliminar la imagen",
      });
    }
  };

  const handleRequestAccess = async () => {
    if (!user) {
        toast({
            title: "Inicia sesión",
            description: "Debes iniciar sesión para desbloquear galerías.",
            variant: "destructive",
        });
        return;
    }

    setRequestingAccess(true);
    try {
        const balance = await tokenService.getBalance(user.id);
        if (!balance || balance.cmpx < GALLERY_UNLOCK_COST) {
            toast({
                title: "Saldo insuficiente",
                description: `Necesitas ${GALLERY_UNLOCK_COST} CMPX para desbloquear. Compra más en la tienda.`,
                variant: "destructive",
            });
            return;
        }

        const success = await tokenService.spendTokens(user.id, 'cmpx', GALLERY_UNLOCK_COST, `Desbloqueo de galería para el perfil ${profileId}`);

        if (success) {
            // Persistir el desbloqueo en la base de datos
            if (supabase) {
                const { error } = await supabase.from('gallery_unlocks').insert({ user_id: user.id, profile_id: profileId });
                if (error) throw new Error('No se pudo registrar el desbloqueo.');
            }

            setUnlockedProfiles([...unlockedProfiles, profileId]);
            toast({
                title: "Galería Desbloqueada",
                description: "Ahora tienes acceso a todas las imágenes privadas de este perfil.",
            });
        } else {
            throw new Error('La transacción de tokens falló.');
        }
    } catch (error) {
        logger.error('Error unlocking gallery:', { error: error instanceof Error ? error.message : String(error) });
        toast({
            variant: "destructive",
            title: "Error al desbloquear",
            description: error instanceof Error ? error.message : "No se pudo completar la operación.",
        });
    } finally {
        setRequestingAccess(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const publicImages = images.filter(img => img.is_public);
  const privateImages = images.filter(img => !img.is_public);
  const hasPrivateImages = privateImages.length > 0;

  return (
    <div className="space-y-6">
      {/* Imágenes públicas */}
      {publicImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Galería Pública ({publicImages.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {publicImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isOwner={isOwner}
                onView={setSelectedImage}
                onDelete={handleDeleteImage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Imágenes privadas */}
      {privateImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Galería Privada ({privateImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {privateImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isOwner={isOwner}
                onView={setSelectedImage}
                onDelete={handleDeleteImage}
                isUnlocked={unlockedProfiles.includes(profileId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay imágenes */}
      {images.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No hay imágenes</h3>
            <p className="text-muted-foreground">
              {isOwner 
                ? "Sube tu primera imagen para comenzar tu galería"
                : "Este perfil no tiene imágenes públicas disponibles"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Botón para desbloquear galería privada */}
      {!isOwner && hasPrivateImages && user && !unlockedProfiles.includes(profileId) && (
        <Card className="p-4">
          <CardContent className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Galería Privada</h4>
              <p className="text-sm text-muted-foreground">
                Desbloquea la galería por {GALLERY_UNLOCK_COST} CMPX para ver todas las imágenes.
              </p>
            </div>
            <Button
              onClick={handleRequestAccess}
              disabled={requestingAccess}
              variant="outline"
            >
              <Unlock className="h-4 w-4 mr-2" />
              {requestingAccess ? 'Procesando...' : 'Desbloquear Galería'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de imagen */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-sm sm:max-w-md lg:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                {selectedImage.is_public ? (
                  <Unlock className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                {selectedImage.title || 'Imagen'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.title || 'Imagen'}
                className="w-full max-h-60 sm:max-h-80 lg:max-h-96 object-contain rounded-lg"
              />
              {selectedImage.description && (
                <p className="text-muted-foreground">{selectedImage.description}</p>
              )}
              <div className="flex items-center justify-between">
                <Badge variant={selectedImage.is_public ? "default" : "secondary"}>
                  {selectedImage.is_public ? 'Pública' : 'Privada'}
                </Badge>
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteImage(selectedImage.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface ImageCardProps {
  image: ImageUpload;
  isOwner: boolean;
  onView: (image: ImageUpload) => void;
  onDelete: (imageId: string) => void;
  isUnlocked?: boolean;
}

function ImageCard({ image, isOwner, onView, onDelete, isUnlocked = false }: ImageCardProps) {
  // Determinar si la imagen está bloqueada (privada y no desbloqueada por el usuario)
  const isLocked = !isOwner && !image.is_public && !isUnlocked;

  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow relative">
      <div className="relative aspect-square" onClick={() => !isLocked && onView(image)}>
        <img
          src={image.url}
          alt={image.title || 'Imagen'}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLocked ? 'blur-xl filter blur-[20px] scale-110' : ''
          }`}
        />
        
        {/* Overlay de Bloqueo para contenido privado */}
        {isLocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-black/60 p-3 rounded-full mb-2 border border-white/20">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs font-bold px-3 py-1 bg-black/60 rounded-full border border-white/10 backdrop-blur-md">
              Desbloquear para ver
            </span>
          </div>
        )}
        
        {/* Overlay con controles (solo si no está bloqueado) */}
        {!isLocked && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver
            </Button>
          </div>
        )}

        {/* Badges de privacidad y NFT */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          <Badge variant={image.is_public ? "default" : "secondary"} className="text-xs">
            {image.is_public ? (
              <Unlock className="h-3 w-3 mr-1" />
            ) : (
              <Lock className="h-3 w-3 mr-1" />
            )}
            {image.is_public ? 'Pública' : 'Privada'}
          </Badge>
          {/* Badge NFT si la imagen está en una galería NFT */}
          {(image as any).is_nft_verified && (
            <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-400/50 text-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              NFT-Verificado
            </Badge>
          )}
        </div>

        {/* Botón eliminar para propietario */}
        {isOwner && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Información de la imagen */}
      {image.title && (
        <CardContent className="p-3">
          <p className="text-sm font-medium truncate">{image.title}</p>
          {image.description && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {image.description}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}



