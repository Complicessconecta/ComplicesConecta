import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, RotateCcw, Layers } from 'lucide-react';
import { useBackgroundPreferences, type BackgroundMode } from '@/hooks/useBackgroundPreferences';

// Fallback si el hook no estÃ¡ disponible
const _useBackgroundPreferencesFallback = () => ({
  preferences: { backgroundMode: 'random' as const, particlesEnabled: true, transparenciesEnabled: true },
  setBackgroundMode: () => {},
  setParticlesEnabled: () => {},
  setTransparenciesEnabled: () => {},
  resetPreferences: () => {},
});

interface BackgroundControlsProps {
  onClose?: () => void;
}

/**
 * BackgroundControls - Controles para partÃ­culas y backgrounds
 * Se integra en la secciÃ³n de "ConfiguraciÃ³n de Animaciones"
 */
export const BackgroundControls: React.FC<BackgroundControlsProps> = ({ onClose: _onClose }) => {
  const { preferences, setBackgroundMode, setParticlesEnabled, setTransparenciesEnabled, setSolidColor, resetPreferences } = useBackgroundPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleBackgroundModeChange = (mode: BackgroundMode) => {
    setBackgroundMode(mode);
    setLocalPrefs(prev => ({ ...prev, backgroundMode: mode }));
  };

  const handleSolidColorChange = (color: string) => {
    setSolidColor(color);
    setLocalPrefs(prev => ({ ...prev, solidColor: color, backgroundMode: 'solid' }));
  };

  const solidColors = [
    '#0f172a', // Slate 900
    '#1e1b4b', // Indigo 950
    '#312e81', // Indigo 900
    '#4c1d95', // Violet 900
    '#831843', // Pink 900
    '#000000', // Black
  ];

  const handleParticlesToggle = () => {
    const newState = !localPrefs.particlesEnabled;
    setParticlesEnabled(newState);
    setLocalPrefs(prev => ({ ...prev, particlesEnabled: newState }));
  };

  const handleTransparenciesToggle = () => {
    const newState = !localPrefs.transparenciesEnabled;
    setTransparenciesEnabled(newState);
    setLocalPrefs(prev => ({ ...prev, transparenciesEnabled: newState }));
  };

  const handleReset = () => {
    resetPreferences();
    setLocalPrefs(preferences);
  };

  const backgroundModes: { label: string; value: BackgroundMode; description: string }[] = [
    { label: 'Gradiente', value: 'default', description: 'Fondo degradado por defecto' },
    { label: 'SÃ³lido', value: 'solid', description: 'Color plano sin imagen' },
    { label: 'Fijo', value: 'fixed', description: 'Fondo estÃ¡tico sin cambios' },
    { label: 'Aleatorio', value: 'random', description: 'Fondos rotando cada 5s' },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* PartÃ­culas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-white font-semibold">PartÃ­culas Flotantes</h3>
              <p className="text-white/60 text-sm">Efectos de fondo animados</p>
            </div>
          </div>
          <button
            onClick={handleParticlesToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              localPrefs.particlesEnabled
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                localPrefs.particlesEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-white/50 text-xs ml-8">
          {localPrefs.particlesEnabled ? 'âœ“ PartÃ­culas activadas' : 'âœ— PartÃ­culas desactivadas'}
        </p>
      </div>

      {/* Divisor */}
      <div className="h-px bg-white/10" />

      {/* Transparencias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-white font-semibold">Transparencias en Contenedores</h3>
              <p className="text-white/60 text-sm">Efecto glassmorphism</p>
            </div>
          </div>
          <button
            onClick={handleTransparenciesToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              localPrefs.transparenciesEnabled
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                localPrefs.transparenciesEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-white/50 text-xs ml-8">
          {localPrefs.transparenciesEnabled ? 'âœ“ Transparencias activadas (glassmorphism)' : 'âœ— Transparencias desactivadas (fondo sÃ³lido)'}
        </p>
      </div>

      {/* Divisor */}
      <div className="h-px bg-white/10" />

      {/* Modo de Backgrounds */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <div>
            <h3 className="text-white font-semibold">Modo de Fondo</h3>
            <p className="text-white/60 text-sm">Tipo de fondo a mostrar</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 ml-8">
          {backgroundModes.map(mode => (
            <button
              key={mode.value}
              onClick={() => handleBackgroundModeChange(mode.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                localPrefs.backgroundMode === mode.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Selector de Color SÃ³lido */}
        {localPrefs.backgroundMode === 'solid' && (
          <div className="ml-8 mt-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs text-white/60 mb-2">Selecciona un color:</p>
            <div className="flex gap-2 flex-wrap">
              {solidColors.map(color => (
                <button
                  key={color}
                  onClick={() => handleSolidColorChange(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    localPrefs.solidColor === color ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-white/50 text-xs ml-8">
          {localPrefs.backgroundMode === 'default' && 'ðŸ“ Gradiente por defecto'}
          {localPrefs.backgroundMode === 'solid' && 'ðŸŽ¨ Color sÃ³lido seleccionado'}
          {localPrefs.backgroundMode === 'fixed' && 'ðŸ“Œ Fondo fijo sin cambios'}
          {localPrefs.backgroundMode === 'random' && 'ðŸ”„ Fondos aleatorios'}
        </p>
      </div>

      {/* Divisor */}
      <div className="h-px bg-white/10" />

      {/* BotÃ³n Reset */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Restablecer Valores por Defecto</span>
      </button>

      {/* Info */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white/60 text-xs space-y-1">
        <p>ðŸ’¡ <strong>Consejo:</strong> Los cambios se guardan automÃ¡ticamente</p>
        <p>ðŸ–¥ï¸ <strong>Desktop:</strong> PartÃ­culas 120Hz + backgrounds aleatorios</p>
        <p>ðŸ“± <strong>Mobile:</strong> Optimizado segÃºn capacidad del dispositivo</p>
      </div>
    </div>
  );
};

export default BackgroundControls;

