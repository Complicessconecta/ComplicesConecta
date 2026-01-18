import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Componente de parallax ligero para nodos de fondo
 * Efecto de movimiento sutil al hacer scroll
 * @param children - Contenido con efecto parallax
 * @param speed - Velocidad del efecto parallax (0.1 = lento, 0.5 = rápido)
 * @param className - Clases CSS adicionales
 */
export const ParallaxBackground = ({ 
  children, 
  speed = 0.2, 
  className = "" 
}: { 
  children: React.ReactNode; 
  speed?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * Componente de parallax para múltiples capas
 * Crea efecto de profundidad con diferentes velocidades
 * @param layers - Array de capas con diferentes velocidades
 * @param className - Clases CSS adicionales
 */
export const ParallaxLayers = ({ 
  layers, 
  className = "" 
}: { 
  layers: Array<{ children: React.ReactNode; speed: number; className?: string }>; 
  className?: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {layers.map((layer, index) => {
        const y = useTransform(scrollYProgress, [0, 1], [0, layer.speed * 100]);
        return (
          <motion.div
            key={index}
            style={{ y }}
            className={`absolute inset-0 ${layer.className || ""}`}
          >
            {layer.children}
          </motion.div>
        );
      })}
    </div>
  );
};

/**
 * Componente de parallax horizontal para nodos conectados
 * Efecto de movimiento horizontal al hacer scroll
 * @param children - Contenido con efecto parallax horizontal
 * @param speed - Velocidad del efecto parallax horizontal
 * @param className - Clases CSS adicionales
 */
export const HorizontalParallax = ({ 
  children, 
  speed = 0.1, 
  className = "" 
}: { 
  children: React.ReactNode; 
  speed?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, speed * 50]);

  return (
    <motion.div ref={ref} style={{ x }} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * Componente de parallax para nodos conectados (círculos)
 * Crea efecto de movimiento en diferentes direcciones
 * @param children - Contenido con efecto parallax
 * @param direction - Dirección del movimiento ("up", "down", "left", "right")
 * @param speed - Velocidad del efecto parallax
 * @param className - Clases CSS adicionales
 */
export const ConnectedNodesParallax = ({ 
  children, 
  direction = "up", 
  speed = 0.15, 
  className = "" 
}: { 
  children: React.ReactNode; 
  direction?: "up" | "down" | "left" | "right"; 
  speed?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const transform = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);

  const getTransform = () => {
    switch (direction) {
      case "up":
        return { y: transform };
      case "down":
        return { y: useTransform(scrollYProgress, [0, 1], [0, -speed * 100]) };
      case "left":
        return { x: transform };
      case "right":
        return { x: useTransform(scrollYProgress, [0, 1], [0, -speed * 100]) };
      default:
        return { y: transform };
    }
  };

  return (
    <motion.div ref={ref} style={getTransform()} className={className}>
      {children}
    </motion.div>
  );
};
