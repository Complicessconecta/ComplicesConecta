import { useMemo } from 'react';

export type ProfileScoreLevel = 'safe' | 'new' | 'warning' | 'danger';

export interface ProfileScore {
  score: number;
  level: ProfileScoreLevel;
  label: string;
  color: string;
  icon: string;
}

export const useProfileScore = (profile: any): ProfileScore => {
  return useMemo(() => {
    // LÃ³gica de scoring simulada (mock)
    // En producciÃ³n, esto vendrÃ­a del backend basado en reportes, verificaciÃ³n, antigÃ¼edad, etc.
    
    let score = 85; // Base score
    
    if (!profile) return {
      score: 0,
      level: 'new',
      label: 'Nuevo / Creciendo',
      color: 'text-blue-400',
      icon: 'ðŸŒ±'
    };

    // Ajustes basados en propiedades del perfil (simulados)
    if (profile.is_verified) score += 10;
    if (profile.is_premium) score += 5;
    if (profile.is_demo) score = 95; // Perfiles demo son seguros

    // SimulaciÃ³n de "no recomendado" para ciertos IDs o condiciones
    if (profile.id === 'suspicious-user') {
      score = 40;
    }

    let level: ProfileScoreLevel = 'new';
    let label = 'Nuevo / Creciendo';
    let color = 'text-blue-400';
    let icon = 'ðŸŒ±';

    if (score >= 90) {
      level = 'safe';
      label = 'Seguro / Amigable';
      color = 'text-green-500';
      icon = 'ðŸ›¡ï¸';
    } else if (score >= 70) {
      level = 'new';
      label = 'Nuevo / Creciendo';
      color = 'text-blue-400';
      icon = 'ðŸŒ±';
    } else if (score >= 50) {
      level = 'warning';
      label = 'PrecauciÃ³n';
      color = 'text-yellow-500';
      icon = 'âš ï¸';
    } else {
      level = 'danger';
      label = 'No Recomendado';
      color = 'text-red-500';
      icon = 'ðŸš«';
    }

    return {
      score,
      level,
      label,
      color,
      icon
    };
  }, [profile]);
};

