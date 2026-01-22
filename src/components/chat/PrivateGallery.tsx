import { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { galleryPrivacyService } from '@/services/social/GalleryPrivacyService';
import { toast } from '@/hooks/useToast';

interface GalleryItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
}

interface PrivateGalleryProps {
  galleryItems: GalleryItem[];
  creatorId: string;
  currentUserId: string;
}

export function PrivateGallery({ galleryItems, creatorId, currentUserId }: PrivateGalleryProps) {
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const handleUnlock = async (itemId: string) => {
    setUnlocking(itemId);

    try {
      const result = await galleryPrivacyService.unlockGallery(currentUserId, itemId, creatorId);

      if (result.success) {
        setUnlockedItems(prev => new Set(prev).add(itemId));
        toast({
          title: 'Galería desbloqueada',
          description: 'Ahora puedes ver el contenido privado',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Error al desbloquear',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al desbloquear',
      });
    } finally {
      setUnlocking(null);
    }
  };

  const cmpxCost = galleryPrivacyService.getCMPCost();

  if (!galleryItems || galleryItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold">Galería Privada</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryItems.map(item => {
          const isUnlocked = unlockedItems.has(item.id);

          return (
            <div
              key={item.id}
              className={`relative rounded-lg overflow-hidden ${
                !isUnlocked ? 'blur-sm' : ''
              }`}
            >
              <img
                src={item.thumbnail_url || item.url}
                alt={item.caption || 'Foto privada'}
                className="w-full h-48 object-cover"
              />

              {!isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                  <Lock className="h-8 w-8 text-white mb-2" />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUnlock(item.id)}
                    disabled={unlocking === item.id}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {unlocking === item.id ? 'Desbloqueando...' : `Desbloquear (${cmpxCost} CMPX)`}
                  </Button>
                </div>
              )}

              {item.caption && isUnlocked && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm">{item.caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
