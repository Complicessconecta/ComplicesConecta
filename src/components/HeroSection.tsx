import { Heart } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative flex items-center justify-center overflow-hidden py-16 sm:py-24">
      {/* Main Content */}
      <div className="relative text-center px-4 max-w-6xl mx-auto w-full">
        <div className="animate-slide-up">
          {/* Logo ComplicesConecta - Mejorado con gradiente y glow */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center space-x-6 group">
              <div className="relative">
                <Heart
                  className="text-pink-500 transition-all duration-300 h-16 w-16 sm:h-20 sm:w-20 animate-pulse group-hover:text-pink-400 drop-shadow-[0_0_30px_rgba(236,72,153,0.8)]"
                  fill="currentColor"
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    animationDuration: "2s",
                    filter: "drop-shadow(0 0 30px rgba(236,72,153,0.8))",
                  }}
                />
                <div className="absolute inset-0 animate-float">
                  <Heart
                    className="text-pink-400 opacity-80 transition-all duration-300 h-16 w-16 sm:h-20 sm:w-20 animate-ping drop-shadow-lg"
                    fill="currentColor"
                    stroke="white"
                    strokeWidth="1"
                  />
                </div>
                <div className="absolute inset-0 animate-pulse">
                  <Heart
                    className="text-pink-300 opacity-50 transition-all duration-300 h-16 w-16 sm:h-20 sm:w-20 drop-shadow-md"
                    fill="currentColor"
                    stroke="white"
                    strokeWidth="1"
                  />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-pink-200 to-pink-300 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(236,72,153,0.5)] transition-all duration-300 group-hover:scale-105 tracking-wide">
                ComplicesConecta
              </h1>
            </div>
          </div>

          {/* Main Headline - Con gradiente y glow */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 leading-tight tracking-tight">
              <span className="block bg-gradient-to-r from-white via-pink-100 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
                Plataforma Social
              </span>
              <span className="block bg-gradient-to-r from-pink-200 via-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(236,72,153,0.6)]">
                Exclusiva
              </span>
              <span className="block bg-gradient-to-r from-pink-300 via-pink-400 to-pink-500 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl font-medium mt-2 drop-shadow-xl">
                para Adultos +18
              </span>
            </h1>
          </div>

          {/* Subtitle - Con gradiente */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-8 leading-relaxed">
            <span className="bg-gradient-to-r from-white via-pink-100 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
              Encuentra tu
            </span>
            <span className="block bg-gradient-to-r from-pink-200 via-pink-300 to-pink-400 bg-clip-text text-transparent font-bold drop-shadow-[0_4px_20px_rgba(236,72,153,0.5)]">
              Conexión Perfecta
            </span>
          </h2>

          {/* Description */}
          <div className="max-w-4xl mx-auto mb-12">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-2 border border-pink-400/50">
                <span className="w-2 h-2 bg-pink-300 rounded-full animate-pulse"></span>
                Versión Beta Exclusiva
              </span>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl leading-relaxed font-medium mb-4">
              <span className="bg-gradient-to-r from-white via-pink-50 to-pink-100 bg-clip-text text-transparent drop-shadow-lg">
                Conecta con personas afines de manera segura y discreta
              </span>
            </p>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed font-light">
              <span className="bg-gradient-to-r from-pink-100 via-pink-200 to-pink-300 bg-clip-text text-transparent drop-shadow-md">
                Sistema de verificación KYC, chat encriptado y eventos exclusivos
                para la comunidad lifestyle
              </span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-16 pt-8 border-t border-pink-500/20">
          <div className="text-center group">
            <div className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              BETA
            </div>
            <div className="bg-gradient-to-r from-pink-100 to-pink-200 bg-clip-text text-transparent font-semibold drop-shadow-lg">
              Versión de Prueba
            </div>
          </div>
          <div className="text-center group">
            <div className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              100%
            </div>
            <div className="bg-gradient-to-r from-pink-100 to-pink-200 bg-clip-text text-transparent font-semibold drop-shadow-lg">
              Funciones Gratis
            </div>
          </div>
          <div className="text-center group">
            <div className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              ∞
            </div>
            <div className="bg-gradient-to-r from-pink-100 to-pink-200 bg-clip-text text-transparent font-semibold drop-shadow-lg">
              Posibilidades
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
