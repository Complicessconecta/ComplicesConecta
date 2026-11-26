import { useMemo } from "react";

export type ProfileScoreLevel = "safe" | "new" | "warning" | "danger";

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

    if (!profile)
      return {
        score: 0,
        level: "new",
        label: "Nuevo / Creciendo",
        // RONDA 7 (punto 3): los colores de score eran claros fijos
        // (`text-blue-400`...): sobre la píldora clara en tema claro no
        // se leían. Ahora cada nivel tiene su tono oscuro en claro y el
        // claro original en oscuro.
        color: "text-blue-600 dark:text-blue-400",
        icon: "🌱",
      };

    // Ajustes basados en propiedades del perfil (simulados)
    if (profile.is_verified) score += 10;
    if (profile.is_premium) score += 5;
    if (profile.is_demo) score = 95; // Perfiles demo son seguros

    // Simulación de "no recomendado" para ciertos IDs o condiciones
    if (profile.id === "suspicious-user") {
      score = 40;
    }

    let level: ProfileScoreLevel = "new";
    let label = "Nuevo / Creciendo";
    let color = "text-blue-600 dark:text-blue-400";
    let icon = "🌱";

    if (score >= 90) {
      level = "safe";
      label = "Seguro / Amigable";
      color = "text-green-600 dark:text-green-400";
      icon = "🛡️";
    } else if (score >= 70) {
      level = "new";
      label = "Nuevo / Creciendo";
      color = "text-blue-600 dark:text-blue-400";
      icon = "🌱";
    } else if (score >= 50) {
      level = "warning";
      label = "Precaución";
      color = "text-yellow-600 dark:text-yellow-400";
      icon = "⚠️";
    } else {
      level = "danger";
      label = "No Recomendado";
      color = "text-red-600 dark:text-red-400";
      icon = "🚫";
    }

    return {
      score,
      level,
      label,
      color,
      icon,
    };
  }, [profile?.id, profile?.is_verified, profile?.is_premium, profile?.is_demo]);
};
