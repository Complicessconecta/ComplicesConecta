import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { FadeInUp, ScaleIn } from "@/components/ui/animations/ScrollAnimations";

/**
 * HeroSection con animaciones suaves de scroll
 * Ejemplo de implementación de fade-in + slide-up
 */
export const AnimatedHeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-16 sm:py-24">
      {/* Contenido principal con animaciones escalonadas */}
      <div className="relative text-center px-4 max-w-6xl mx-auto w-full">
        
        {/* Logo ComplicesConecta - Animación 1 */}
        <FadeInUp delay={0.1}>
          <div className="mb-12 flex justify-center">
            <motion.div 
              className="flex items-center space-x-6 group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <Heart
                  className="h-16 w-16 sm:h-20 sm:w-20 text-pink-500 transition-all duration-300 animate-pulse"
                  fill="currentColor"
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    filter: "drop-shadow(0 0 30px rgba(236,72,153,0.8))",
                  }}
                />
                <motion.div 
                  className="absolute inset-0"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Heart
                    className="text-pink-400 opacity-80 h-16 w-16 sm:h-20 sm:w-20"
                    fill="currentColor"
                    stroke="white"
                    strokeWidth="1"
                  />
                </motion.div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-linear-to-r from-white via-pink-200 to-pink-300 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(236,72,153,0.5)] transition-all duration-300 tracking-wide">
                ComplicesConecta
              </h1>
            </motion.div>
          </div>
        </FadeInUp>

        {/* Main Headline - Animación 2 */}
        <FadeInUp delay={0.2}>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 leading-tight tracking-tight">
            <span className="block bg-linear-to-r from-white via-pink-100 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
              Plataforma Social
            </span>
            <span className="block bg-linear-to-r from-pink-200 via-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(236,72,153,0.6)]">
              Exclusiva
            </span>
            <span className="block bg-linear-to-r from-pink-300 via-pink-400 to-pink-500 bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl font-medium mt-2 drop-shadow-xl">
              para Adultos +18
            </span>
          </h1>
        </FadeInUp>

        {/* Subtitle - Animación 3 */}
        <FadeInUp delay={0.3}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-8 leading-relaxed">
            <span className="bg-linear-to-r from-white via-pink-100 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
              Encuentra tu
            </span>
            <span className="block bg-linear-to-r from-pink-200 via-pink-300 to-pink-400 bg-clip-text text-transparent font-bold drop-shadow-[0_4px_20px_rgba(236,72,153,0.5)]">
              Conexión Perfecta
            </span>
          </h2>
        </FadeInUp>

        {/* Description - Animación 4 */}
        <FadeInUp delay={0.4}>
          <div className="max-w-4xl mx-auto mb-12">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="bg-linear-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-2 border border-pink-400/50">
                <span className="w-2 h-2 bg-pink-300 rounded-full animate-pulse"></span>
                Versión Beta Exclusiva
              </span>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl leading-relaxed font-medium mb-4">
              <span className="bg-linear-to-r from-white via-pink-50 to-pink-100 bg-clip-text text-transparent drop-shadow-lg">
                Conecta con personas afines de manera segura y discreta
              </span>
            </p>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed font-light">
              <span className="bg-linear-to-r from-pink-100 via-pink-200 to-pink-300 bg-clip-text text-transparent drop-shadow-md">
                Sistema de verificación KYC, chat encriptado y eventos exclusivos
                para la comunidad lifestyle
              </span>
            </p>
          </div>
        </FadeInUp>

        {/* Stats Grid - Animación 5 */}
        <FadeInUp delay={0.5}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-16 pt-8 border-t border-pink-500/20">
            {[
              { label: "BETA", value: "Versión de Prueba" },
              { label: "100%", value: "Funciones Gratis" },
              { label: "∞", value: "Posibilidades" },
            ].map((stat, index) => (
              <ScaleIn key={index} delay={0.6 + index * 0.1}>
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-2 bg-linear-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                    {stat.label}
                  </div>
                  <div className="bg-linear-to-r from-pink-100 to-pink-200 bg-clip-text text-transparent font-semibold drop-shadow-lg">
                    {stat.value}
                  </div>
                </motion.div>
              </ScaleIn>
            ))}
          </div>
        </FadeInUp>

        {/* CTA Buttons - Animación 6 */}
        <FadeInUp delay={0.7}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <motion.button
              className="bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:shadow-pink-500/50 hover:scale-105 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Comenzar Ahora
              <ArrowRight className="h-5 w-5" />
            </motion.button>
            <motion.button
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl border border-white/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Saber Más
            </motion.button>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
};
