import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Card } from "@/components/ui/cards/Card";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/useToast";

interface SinglePhoto {
  id: string;
  url: string;
  isMain: boolean;
  uploadedAt: Date;
}

interface SinglePhotoSectionProps {
  photos: SinglePhoto[];
  onPhotoUpload: (file: File) => Promise<void>;
  onPhotoDelete: (photoId: string) => Promise<void>;
  onSetMainPhoto: (photoId: string) => Promise<void>;
  isEditable?: boolean;
  maxPhotos?: number;
}

export const SinglePhotoSection: React.FC<SinglePhotoSectionProps> = ({
  photos,
  onPhotoUpload,
  onPhotoDelete,
  onSetMainPhoto,
  isEditable = false,
  maxPhotos = 6,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Imagen demasiado grande",
        description: "La imagen debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Verificar límite de fotos
    if (photos.length >= maxPhotos) {
      toast({
        title: "Límite alcanzado",
        description: `Máximo ${maxPhotos} fotos`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      await onPhotoUpload(file);
    } catch (error) {
      logger.error("Error uploading photo:", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error al subir foto",
        description: "Error al subir la foto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Limpiar input
      event.target.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Subir foto"
        title="Seleccionar imagen"
      />

      <div className="space-y-4">
        {/* Header de la sección */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <h3 className="text-lg font-semibold text-purple-600">Mis Fotos</h3>
            <Badge variant="outline" className="text-xs">
              {photos.length}/{maxPhotos}
            </Badge>
          </div>

          {isEditable && photos.length < maxPhotos && (
            <Button
              onClick={handleUploadClick}
              disabled={uploading}
              size="sm"
              variant="outline"
              className="border-purple-300 hover:bg-purple-50"
            >
              {uploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4"
                >
                  <Upload className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Grid de fotos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <AnimatePresence>
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative group"
              >
                <Card className="overflow-hidden border-2 border-transparent hover:border-gray-200 transition-all duration-300">
                  <div className="relative aspect-square">
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => setSelectedPhoto(photo.id)}
                    />

                    {/* Badge de foto principal */}
                    {photo.isMain && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-purple-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      </div>
                    )}

                    {/* Overlay con acciones */}
                    {isEditable && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          {!photo.isMain && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetMainPhoto(photo.id);
                              }}
                              className="bg-white bg-opacity-90 hover:bg-opacity-100"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPhotoDelete(photo.id);
                            }}
                            className="bg-red-500 bg-opacity-90 hover:bg-opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Placeholder para agregar foto */}
          {isEditable && photos.length < maxPhotos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: photos.length * 0.1 }}
            >
              <Card
                className="aspect-square border-2 border-dashed cursor-pointer transition-all duration-300 hover:border-solid border-purple-300 hover:border-purple-400 hover:bg-purple-50"
                onClick={handleUploadClick}
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm text-center px-2">Agregar foto</span>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Mensaje cuando no hay fotos */}
        {photos.length === 0 && !isEditable && (
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay fotos aún</p>
          </div>
        )}
      </div>

      {/* Modal de vista previa de foto */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos.find((p) => p.id === selectedPhoto)?.url}
                alt="Vista previa"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SinglePhotoSection;
