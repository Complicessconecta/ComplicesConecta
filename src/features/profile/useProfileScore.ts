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
    // Lógica de scoring simulada (mock)
    // En producción, esto vendría del backend basado en reportes, verificación, antigüedad, etc.
    
    let score = 85; // Base score
    
    if (!profile) return {
      score: 0,
      level: 'new',
      label: 'Nuevo / Creciendo',
      color: 'text-blue-400',
      icon: '🌱'
    };

    // Ajustes basados en propiedades del perfil (simulados)
    if (profile.is_verified) score += 10;
    if (profile.is_premium) score += 5;
    if (profile.is_demo) score = 95; // Perfiles demo son seguros

    // Simulación de "no recomendado" para ciertos IDs o condiciones
    if (profile.id === 'suspicious-user') {
      score = 40;
    }

    let level: ProfileScoreLevel = 'new';
    let label = 'Nuevo / Creciendo';
    let color = 'text-blue-400';
    let icon = '🌱';

    if (score >= 90) {
      level = 'safe';
      label = 'Seguro / Amigable';
      color = 'text-green-500';
      icon = '🛡️';
    } else if (score >= 70) {
      level = 'new';
      label = 'Nuevo / Creciendo';
      color = 'text-blue-400';
      icon = '🌱';
    } else if (score >= 50) {
      level = 'warning';
      label = 'Precaución';
      color = 'text-yellow-500';
      icon = '⚠️';
    } else {
      level = 'danger';
      label = 'No Recomendado';
      color = 'text-red-500';
      icon = '🚫';
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

