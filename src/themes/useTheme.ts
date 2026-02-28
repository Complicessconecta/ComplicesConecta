// src/hooks/useTheme.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";

interface ThemePrefs {
  background: string;
  particlesIntensity: number; // 0-100
  glowLevel: "low" | "medium" | "high";
  isCustom: boolean;
  enableParticles: boolean;
  enableBackgroundAnimations: boolean;
  animationSpeed: "slow" | "normal" | "fast";
  enableGlassUI: boolean;
}

const defaultPrefs: ThemePrefs = {
  background: "/backgrounds/default-neon.webp",
  particlesIntensity: 50,
  glowLevel: "medium",
  isCustom: false,
  enableParticles: true,
  enableBackgroundAnimations: true,
  animationSpeed: "normal",
  enableGlassUI: true,
};

export const useTheme = () => {
  const { user, isDemo } = useAuth();

  const [prefs, setPrefs] = usePersistedState<ThemePrefs>(
    "user_theme",
    defaultPrefs,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shouldSkip = !user || isDemo;

    if (shouldSkip) {
      setLoading(false);
      return undefined;
    }

    // Fetch desde Supabase (solo si hay cliente y user.id)
    const fetchTheme = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Usar 'any' para evitar errores de tipos cuando la tabla no existe
        const { data, error } = await supabase
          .from("user_themes")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          // Si la tabla no existe, simplemente continuar con los valores por defecto
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            logger.info("Tabla user_themes no existe, usando valores por defecto");
            setLoading(false);
            return;
          }
          throw error;
        }

        if (data) {
          const config = (data.theme_config as any) || {};
          setPrefs({
            background: config.background || defaultPrefs.background,
            particlesIntensity:
              config.particlesIntensity ?? defaultPrefs.particlesIntensity,
            glowLevel: config.glowLevel || defaultPrefs.glowLevel,
            isCustom: (data as any).is_custom ?? true,
            enableParticles:
              config.enableParticles ?? defaultPrefs.enableParticles,
            enableBackgroundAnimations:
              config.enableBackgroundAnimations ??
              defaultPrefs.enableBackgroundAnimations,
            animationSpeed:
              config.animationSpeed || defaultPrefs.animationSpeed,
            enableGlassUI:
              config.enableGlassUI ??
              defaultPrefs.enableGlassUI,
          });

          logger.info("Tema cargado de DB", { userId: user.id });
        }
      } catch (error) {
        logger.error("Error cargando tema", { error });
      } finally {
        setLoading(false);
      }
    };

    void fetchTheme();

    // Realtime subscription (solo si VIP y supabase disponible)
    const isPremiumUser =
      typeof user === "object" &&
      user !== null &&
      "is_premium" in user &&
      (user as Record<string, unknown>).is_premium === true;

    if (isPremiumUser && supabase) {
      const channel = supabase
        .channel("user_themes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_themes",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const config = (payload.new?.theme_config as any) || {};
            
            setPrefs({
              background: config.background || defaultPrefs.background,
              particlesIntensity:
                config.particlesIntensity ?? defaultPrefs.particlesIntensity,
              glowLevel: config.glowLevel || defaultPrefs.glowLevel,
              isCustom: (payload.new as any)?.is_custom ?? true,
              enableParticles:
                config.enableParticles ?? defaultPrefs.enableParticles,
              enableBackgroundAnimations:
                config.enableBackgroundAnimations ??
                defaultPrefs.enableBackgroundAnimations,
              animationSpeed:
                config.animationSpeed || defaultPrefs.animationSpeed,
              enableGlassUI:
                config.enableGlassUI ??
                defaultPrefs.enableGlassUI,
            });
          },
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }

    return undefined;
  }, [user, isDemo, setPrefs]);

  // Defaults basados en preferencias por defecto si no custom
  const getDefaultBg = () => {
    return defaultPrefs.background;
  };

  return {
    prefs: {
      ...prefs,
      background: prefs.isCustom ? prefs.background : getDefaultBg(),
    },
    loading,
    setPrefs,
  };
};
