import { useState } from "react";
import { Image as ImageIcon, Camera, Lock, Unlock } from "lucide-react";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface ClubImage {
  id: string;
  url: string;
  caption?: string;
  isPrivate?: boolean;
  uploadedAt: string;
}

interface ClubProfileGalleryProps {
  images: ClubImage[];
  isOwner?: boolean;
  onUpload?: () => void;
  onTogglePrivacy?: (imageId: string) => void;
}

export const ClubProfileGallery: React.FC<ClubProfileGalleryProps> = ({
  images,
  isOwner = false,
  onUpload,
  onTogglePrivacy,
}) => {
  const [selectedImage, setSelectedImage] = useState<ClubImage | null>(null);

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-lg">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Galería</h3>
              <p className="text-white/60 text-sm">
                {images.length} {images.length === 1 ? 'foto' : 'fotos'}
              </p>
            </div>
          </div>

          {isOwner && onUpload && (
            <Button
              onClick={onUpload}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Subir Foto
            </Button>
          )}
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No hay fotos disponibles</p>
            {isOwner && (
              <Button
                onClick={onUpload}
                variant="outline"
                className="mt-4 border-white/30 text-white hover:bg-white/10"
              >
                Subir Primera Foto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Foto ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Privacy Badge */}
                {image.isPrivate && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/50 backdrop-blur-sm">
                      <Lock className="h-3 w-3 mr-1" />
                      Privada
                    </Badge>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Ver</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || 'Foto'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />

              {/* Caption */}
              {selectedImage.caption && (
                <div className="mt-4 text-center">
                  <p className="text-white text-lg">{selectedImage.caption}</p>
                </div>
              )}

              {/* Privacy Toggle (Owner Only) */}
              {isOwner && onTogglePrivacy && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => {
                      onTogglePrivacy(selectedImage.id);
                      setSelectedImage(null);
                    }}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    {selectedImage.isPrivate ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Hacer Pública
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Hacer Privada
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all"
                title="Cerrar galería"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
