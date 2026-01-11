import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);

  const loadingTexts = [
    "Conectando corazones...",
    "Preparando experiencias únicas...",
    "Creando conexiones auténticas...",
    "¡Casi listo para encontrar tu cómplice!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Call onComplete when loading reaches 100%
          setTimeout(() => onComplete(), 100);
          return 100;
        }
        return prev + 8; // Acelerar progreso para reducir tiempo de carga
      });
    }, 20); // Reducir intervalo para carga más rápida

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);

    return () => clearInterval(textInterval);
  }, [loadingTexts.length]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/loading/load1.jpg')" }}
    >
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center px-4 sm:px-8 max-w-xs sm:max-w-md mx-auto flex flex-col items-center justify-center flex-1">
        {/* Logo Animation */}
        <div className="mb-8 relative">
          <div className="relative inline-block">
            <Heart
              className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-pulse-glow mx-auto"
              fill="currentColor"
            />
            <div className="absolute inset-0 animate-ping">
              <Heart
                className="w-16 h-16 sm:w-20 sm:h-20 text-white/50 mx-auto"
                fill="currentColor"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 animate-slide-up">
            ComplicesConecta
          </h1>
        </div>

        {/* Loading Text */}
        <div className="mb-6 sm:mb-8 h-6 sm:h-8">
          <p className="text-lg sm:text-xl text-white/90 animate-fade-in-out px-2">
            {loadingTexts[currentText]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-white to-white/80 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Progress Percentage */}
        <p className="text-white/80 text-sm font-medium">{progress}%</p>

        {/* Loading Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>

      {/* Texto animado 'Cargando...' centrado en la parte inferior */}
      <div className="relative z-10 pb-8 sm:pb-12">
        <p className="text-white/90 text-lg sm:text-xl font-medium animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  );
};
