import React from "react";
import { createPortal } from "react-dom";
import { motion, type Variants } from "framer-motion";
import { AnimationContext } from "@/components/animations/AnimationProvider";
import { Button } from "@/components/ui/buttons/Button";
import { UnifiedCard } from "@/components/ui/UnifiedCard";
import { Settings, Zap, Eye, Sparkles, Palette, Film } from "lucide-react";
import { useBgMode } from "@/hooks/useBgMode";
import { useBackgroundPreferences } from "@/hooks/useBackgroundPreferences";

interface AnimationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Evento para abrir el modal desde la barra de navegación: el botón
// "Config" del dock apunta a la ruta del editor, así que estando ya en
// esa ruta el tap no navega a ningún lado; en ese caso Navigation
// dispara este evento y el botón flotante abre el mismo modal.
export const OPEN_ANIMATION_SETTINGS_EVENT =
  "complicesconecta:open-animation-settings";

export const AnimationSettings: React.FC<AnimationSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  // Hooks must be called at the top level, before any conditional returns
  const context = React.useContext(AnimationContext);
  const { mode, setMode } = useBgMode();
  const { preferences, setParticlesEnabled } = useBackgroundPreferences();

  // Escape cierra el modal (el overlay y el botón Cerrar ya lo hacían).
  // Un solo overlay a la vez: el modal vive en un portal a document.body
  // con z-50, centrado y fondo oscurecido (ver `modal` abajo).
  React.useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Si no hay provider, mostrar mensaje o retornar null
  if (!context) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-white">
          <p>AnimationProvider no está disponible</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/20 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const { config, updateConfig } = context;

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
  };

  if (!isOpen) return null;

  const modal = (
    <motion.div
      variants={overlayVariants as unknown as Variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={panelVariants as unknown as Variants}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[95vw] md:max-w-md"
      >
        <UnifiedCard className="p-4 md:p-6 bg-white/10 backdrop-blur-md border border-white/20 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">
              Configuración de Animaciones
            </h2>
          </div>

          <div className="space-y-6">
            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Movimiento Reducido</p>
                  <p className="text-white/60 text-sm">Para accesibilidad</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  updateConfig({ reducedMotion: !config.reducedMotion })
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.reducedMotion ? "bg-purple-600" : "bg-gray-600"
                }`}
              >
                <motion.div
                  animate={{ x: config.reducedMotion ? 24 : 0 }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>

            {/* Animation Speed */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <p className="text-white font-medium">Velocidad de Animación</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["slow", "normal", "fast"] as const).map((speed) => (
                  <Button
                    key={speed}
                    variant={
                      config.animationSpeed === speed ? "love" : "default"
                    }
                    size="sm"
                    onClick={() => updateConfig({ animationSpeed: speed })}
                    // La variante "default" usa los tokens primary (bg-primary
                    // / text-primary-foreground), que en Tailwind v4 quedan
                    // sin fondo legible sobre esta tarjeta oscura; los botones
                    // no seleccionados llevan colores explícitos.
                    className={
                      config.animationSpeed === speed
                        ? "capitalize"
                        : "capitalize bg-white/15 text-white border border-white/20 hover:bg-white/25"
                    }
                  >
                    {speed === "slow"
                      ? "Lenta"
                      : speed === "normal"
                        ? "Normal"
                        : "Rápida"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Particles Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <div>
                  <p className="text-white font-medium">Partículas Flotantes</p>
                  <p className="text-white/60 text-sm">Efectos de fondo</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const next = !config.enableParticles;
                  updateConfig({ enableParticles: next });
                  setParticlesEnabled(next);
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.enableParticles ? "bg-purple-600" : "bg-gray-600"
                }`}
              >
                <motion.div
                  animate={{ x: config.enableParticles ? 24 : 0 }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>

            {/* Background Animations Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Fondo Animado</p>
                  <p className="text-white/60 text-sm">Gradientes dinámicos</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  updateConfig({
                    enableBackgroundAnimations:
                      !config.enableBackgroundAnimations,
                  })
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.enableBackgroundAnimations
                    ? "bg-purple-600"
                    : "bg-gray-600"
                }`}
              >
                <motion.div
                  animate={{ x: config.enableBackgroundAnimations ? 24 : 0 }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>

            {/* Background Mode Selector */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Film className="w-5 h-5 text-cyan-400" />
                <p className="text-white font-medium">Modo de Fondo</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mode === "static" ? "love" : "default"}
                  size="sm"
                  onClick={() => setMode("static")}
                  className={
                    mode === "static"
                      ? "capitalize"
                      : "capitalize bg-white/15 text-white border border-white/20 hover:bg-white/25"
                  }
                >
                  Fijo
                </Button>
                <Button
                  variant={mode === "particles" ? "love" : "default"}
                  size="sm"
                  onClick={() => setMode("particles")}
                  className={
                    mode === "particles"
                      ? "capitalize"
                      : "capitalize bg-white/15 text-white border border-white/20 hover:bg-white/25"
                  }
                >
                  Partículas
                </Button>
                <Button
                  variant={mode === "video" ? "love" : "default"}
                  size="sm"
                  onClick={() => setMode("video")}
                  className={
                    mode === "video"
                      ? "capitalize"
                      : "capitalize bg-white/15 text-white border border-white/20 hover:bg-white/25"
                  }
                >
                  Vídeo
                </Button>
              </div>
            </div>

            {/* Animation Preview */}
            <div className="border-t border-white/20 pt-4">
              <p className="text-white font-medium mb-3">Vista Previa</p>
              <div className="flex justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: config.reducedMotion ? 0.01 : 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="default"
              onClick={onClose}
              className="flex-1 bg-white/15 text-white border border-white/20 hover:bg-white/25"
            >
              Cerrar
            </Button>
            <Button
              variant="love"
              onClick={() => {
                updateConfig({
                  reducedMotion: false,
                  animationSpeed: "normal",
                  enableParticles: true,
                  enableBackgroundAnimations: true,
                });
                if (!preferences.particlesEnabled) {
                  setParticlesEnabled(true);
                }
              }}
              className="flex-1"
            >
              Restablecer
            </Button>
          </div>
        </UnifiedCard>
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body as unknown as Element);
};

// Settings button component
// RONDA 5: el engranaje flotante (`fixed bottom-4 left-4`) se ELIMINÓ:
// seguía al hacer scroll y tapaba el compositor en /chat y los controles
// en /video-chat. Este componente ahora es SOLO el host del modal: lo
// abre el botón "Config" del dock (evento OPEN_ANIMATION_SETTINGS_EVENT),
// el engranaje en flujo del HeaderNav (páginas públicas) y la fila
// superior en flujo de MainLayout (rutas logueadas sin dock). El modal
// en sí sigue siendo un overlay centrado bajo demanda, no un flotante.
export const AnimationSettingsButton: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Abrir el modal cuando el botón "Config" del dock lo pide: estando ya
  // en la ruta del editor, el tap no navega a ningún lado y Navigation
  // dispara este evento para abrir el mismo modal del engranaje flotante.
  React.useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_ANIMATION_SETTINGS_EVENT, open);
    return () =>
      window.removeEventListener(OPEN_ANIMATION_SETTINGS_EVENT, open);
  }, []);

  return <AnimationSettings isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};
