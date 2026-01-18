import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/**
 * Componente de animación fade-in + slide-up al entrar en viewport
 * @param children - Contenido a animar
 * @param delay - Retraso en segundos (opcional)
 * @param className - Clases CSS adicionales (opcional)
 */
export const FadeInUp = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación fade-in al entrar en viewport
 * @param children - Contenido a animar
 * @param delay - Retraso en segundos (opcional)
 * @param className - Clases CSS adicionales (opcional)
 */
export const FadeIn = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación scale-in al entrar en viewport
 * @param children - Contenido a animar
 * @param delay - Retraso en segundos (opcional)
 * @param className - Clases CSS adicionales (opcional)
 */
export const ScaleIn = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación slide-in desde la izquierda
 * @param children - Contenido a animar
 * @param delay - Retraso en segundos (opcional)
 * @param className - Clases CSS adicionales (opcional)
 */
export const SlideInLeft = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación slide-in desde la derecha
 * @param children - Contenido a animar
 * @param delay - Retraso en segundos (opcional)
 * @param className - Clases CSS adicionales (opcional)
 */
export const SlideInRight = ({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Componente de animación staggered para listas de elementos
 * @param children - Array de elementos a animar
 * @param staggerDelay - Retraso entre cada elemento (opcional)
 * @param className - Clases CSS adicionales (opcional)
 */
export const StaggeredChildren = ({ 
  children, 
  staggerDelay = 0.1, 
  className = "" 
}: { 
  children: React.ReactNode[]; 
  staggerDelay?: number; 
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
