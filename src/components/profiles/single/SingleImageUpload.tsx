import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, User } from "lucide-react";
import { ProfileImageService, ImageUploadResult } from "@/lib/storage";
import { cn } from "@/shared/lib/cn";

interface SingleImageUploadProps {
  onImageUploaded: (url: string) => void;
  onError: (error: string) => void;
  profileId: string;
  currentImage?: string;
  className?: string;
  disabled?: boolean;
}

export const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  onImageUploaded,
  onError,
  profileId,
  currentImage = "",
  className = "",
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (disabled || isUploading) return;

    setIsUploading(true);

    try {
      // Misma ruta de storage que CoupleImageUpload, con el id del perfil
      const result: ImageUploadResult =
        await ProfileImageService.uploadProfileImage(
          file,
          `${profileId}_profile`,
        );

      if (result.success && result.url) {
        onImageUploaded(result.url);
      } else {
        onError(result.error || "Error al subir imagen de perfil");
      }
    } catch {
      onError("Error inesperado al subir imagen de perfil");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage || disabled || isUploading) return;

    setIsUploading(true);

    try {
      const result = await ProfileImageService.deleteProfileImage(currentImage);
      if (result.success) {
        onImageUploaded("");
      } else {
        onError(result.error || "Error al eliminar imagen de perfil");
      }
    } catch {
      onError("Error inesperado al eliminar imagen de perfil");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Imagen de Perfil
        </h2>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label="Subir imagen de perfil"
        title="Seleccionar archivo de imagen de perfil"
      />

      {currentImage ? (
        // Mostrar imagen actual del perfil
        <div className="relative group">
          <img
            src={currentImage}
            alt="Imagen de perfil"
            className="w-full h-48 object-cover rounded-lg"
          />

          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
            <div className="flex gap-2">
              <button
                onClick={handleClick}
                disabled={disabled || isUploading}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="Cambiar imagen de perfil"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-white" />
                )}
              </button>

              <button
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
                className="p-2 bg-red-500/70 hover:bg-red-500/90 rounded-full transition-colors"
                title="Eliminar imagen de perfil"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Área de subida cuando no hay imagen
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 h-48 flex flex-col items-center justify-center",
            dragActive
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500",
            disabled || isUploading ? "opacity-50 cursor-not-allowed" : "",
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Subiendo imagen...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Imagen de perfil
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Clic o arrastra aquí
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, WEBP hasta 3MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Sube tu imagen de perfil. Se mostrará como tu foto principal.
        </p>
      </div>
    </div>
  );
};

export default SingleImageUpload;
