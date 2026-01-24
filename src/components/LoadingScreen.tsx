import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import "./LoadingScreen.css";

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
        return prev + 1; // Incremento de 1% para duración de ~3 segundos
      });
    }, 30); // Intervalo de 30ms para duración de ~3 segundos (100% / 30ms ≈ 3s)

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);

    return () => clearInterval(textInterval);
  }, [loadingTexts.length]);

  return (
    <div className="loading-screen-container">
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="loading-screen-overlay"></div>

      {/* Main Loading Content */}
      <div className="loading-screen-content">
        {/* Logo Animation */}
        <div className="mb-8 relative">
          <div className="relative inline-block">
            <Heart
              className="w-16 h-16 sm:w-20 sm:h-20 text-fuchsia-400 animate-pulse-glow mx-auto drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]"
              fill="currentColor"
            />
            <div className="absolute inset-0 animate-ping">
              <Heart
                className="w-16 h-16 sm:w-20 sm:h-20 text-pink-400/70 mx-auto drop-shadow-[0_0_10px_rgba(244,114,182,0.6)]"
                fill="currentColor"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 animate-slide-up drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
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
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            data-progress={`${progress}%`}
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Progress Percentage */}
        <p className="text-white/80 text-sm font-medium">{progress}%</p>

        {/* Loading Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-white/60 rounded-full animate-bounce loading-dot-delay-1"
          ></div>
          <div
            className="w-3 h-3 bg-white/60 rounded-full animate-bounce loading-dot-delay-2"
          ></div>
        </div>
      </div>

      {/* Texto animado 'Cargando...' centrado en la parte inferior */}
      <div className="loading-screen-bottom">
        <p className="text-white/90 text-lg sm:text-xl font-medium animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  );
};
