import { useState, useEffect, useCallback } from 'react';

export type BackgroundMode = 'default' | 'fixed' | 'random' | 'solid';
export type ParticlesState = 'enabled' | 'disabled';

interface BackgroundPreferences {
  backgroundMode: BackgroundMode;
  particlesEnabled: boolean;
  transparenciesEnabled: boolean;
  solidColor: string;
}

const STORAGE_KEY = 'cc_background_preferences';

const DEFAULT_PREFERENCES: BackgroundPreferences = {
  backgroundMode: 'random',
  particlesEnabled: true,
  transparenciesEnabled: true,
  solidColor: '#1a1a2e', // Dark blue/purple default
};

/**
 * Hook para gestionar preferencias de backgrounds y partículas
 * Persiste en localStorage y se sincroniza globalmente
 */
export const useBackgroundPreferences = () => {
  const [preferences, setPreferences] = useState<BackgroundPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_PREFERENCES;
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFERENCES;
      const obj = parsed as Partial<BackgroundPreferences>;
      return {
        backgroundMode: obj.backgroundMode || DEFAULT_PREFERENCES.backgroundMode,
        particlesEnabled:
          obj.particlesEnabled !== undefined
            ? obj.particlesEnabled
            : DEFAULT_PREFERENCES.particlesEnabled,
        transparenciesEnabled:
          obj.transparenciesEnabled !== undefined
            ? obj.transparenciesEnabled
            : DEFAULT_PREFERENCES.transparenciesEnabled,
        solidColor: obj.solidColor || DEFAULT_PREFERENCES.solidColor,
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar preferencias del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const timer = setTimeout(() => {
          setPreferences((prev) => ({
            ...prev,
            backgroundMode: parsed.backgroundMode || DEFAULT_PREFERENCES.backgroundMode,
            particlesEnabled:
              parsed.particlesEnabled !== undefined
                ? parsed.particlesEnabled
                : DEFAULT_PREFERENCES.particlesEnabled,
            transparenciesEnabled:
              parsed.transparenciesEnabled !== undefined
                ? parsed.transparenciesEnabled
                : DEFAULT_PREFERENCES.transparenciesEnabled,
          }));
          setIsLoaded(true);
        }, 0);
        return () => clearTimeout(timer);
      } else {
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading background preferences:', error);
      const timer = setTimeout(() => {
        setPreferences(DEFAULT_PREFERENCES);
        setIsLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Guardar preferencias en localStorage y emitir evento
  const savePreferences = useCallback((newPrefs: Partial<BackgroundPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Emitir evento personalizado para sincronizar entre tabs/ventanas
        window.dispatchEvent(new CustomEvent('backgroundPreferencesChanged', { detail: updated }));
      } catch (error) {
        console.error('Error saving background preferences:', error);
      }
      return updated;
    });
  }, []);

  // Cambiar modo de background
  const setBackgroundMode = useCallback((mode: BackgroundMode) => {
    savePreferences({ backgroundMode: mode });
  }, [savePreferences]);

  // Cambiar estado de partículas
  const setParticlesEnabled = useCallback((enabled: boolean) => {
    savePreferences({ particlesEnabled: enabled });
  }, [savePreferences]);

  // Cambiar estado de transparencias
  const setTransparenciesEnabled = useCallback((enabled: boolean) => {
    savePreferences({ transparenciesEnabled: enabled });
  }, [savePreferences]);

  // Cambiar color sólido
  const setSolidColor = useCallback((color: string) => {
    savePreferences({ solidColor: color, backgroundMode: 'solid' });
  }, [savePreferences]);

  // Resetear a valores por defecto
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('backgroundPreferencesChanged', { detail: DEFAULT_PREFERENCES }));
    } catch (error) {
      console.error('Error resetting background preferences:', error);
    }
  }, []);

  return {
    preferences,
    isLoaded,
    setBackgroundMode,
    setParticlesEnabled,
    setTransparenciesEnabled,
    setSolidColor,
    resetPreferences,
  };
};

export default useBackgroundPreferences;

