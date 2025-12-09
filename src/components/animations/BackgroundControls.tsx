import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, RotateCcw, Layers } from 'lucide-react';
import { useBackgroundPreferences, type BackgroundMode } from '@/hooks/useBackgroundPreferences';

interface BackgroundControlsProps {
  onClose?: () => void;
}

/**
 * BackgroundControls - Controles para partículas y backgrounds
 * Se integra en la sección de "Configuración de Animaciones"
 */
export const BackgroundControls: React.FC<BackgroundControlsProps> = ({ onClose }) => {
  const { preferences, setBackgroundMode, setParticlesEnabled, setTransparenciesEnabled, resetPreferences } = useBackgroundPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleBackgroundModeChange = (mode: BackgroundMode) => {
    setBackgroundMode(mode);
    setLocalPrefs(prev => ({ ...prev, backgroundMode: mode }));
  };

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
    { label: 'Fijo', value: 'fixed', description: 'Fondo estático sin cambios' },
    { label: 'Aleatorio', value: 'random', description: 'Fondos rotando cada 5s' },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Partículas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-white font-semibold">Partículas Flotantes</h3>
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
          {localPrefs.particlesEnabled ? '✓ Partículas activadas' : '✗ Partículas desactivadas'}
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
          {localPrefs.transparenciesEnabled ? '✓ Transparencias activadas (glassmorphism)' : '✗ Transparencias desactivadas (fondo sólido)'}
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

        <div className="grid grid-cols-3 gap-2 ml-8">
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

        <p className="text-white/50 text-xs ml-8">
          {localPrefs.backgroundMode === 'default' && '📐 Gradiente por defecto'}
          {localPrefs.backgroundMode === 'fixed' && '📌 Fondo fijo sin cambios'}
          {localPrefs.backgroundMode === 'random' && '🔄 Fondos aleatorios'}
        </p>
      </div>

      {/* Divisor */}
      <div className="h-px bg-white/10" />

      {/* Botón Reset */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Restablecer Valores por Defecto</span>
      </button>

      {/* Info */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white/60 text-xs space-y-1">
        <p>💡 <strong>Consejo:</strong> Los cambios se guardan automáticamente</p>
        <p>🖥️ <strong>Desktop:</strong> Partículas 120Hz + backgrounds aleatorios</p>
        <p>📱 <strong>Mobile:</strong> Optimizado según capacidad del dispositivo</p>
      </div>
    </div>
  );
};

export default BackgroundControls;
