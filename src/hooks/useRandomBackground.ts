import { useMemo } from "react";

export interface BackgroundConfig {
  gradient: string;
  particleColor: string;
  particleOpacity: number;
  particleCount: number;
  animationSpeed: number;
}

const BACKGROUND_PRESETS: BackgroundConfig[] = [
  {
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    particleColor: "#667eea",
    particleOpacity: 0.55,
    particleCount: 80,
    animationSpeed: 2,
  },
  {
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    particleColor: "#f093fb",
    particleOpacity: 0.55,
    particleCount: 75,
    animationSpeed: 2.5,
  },
  {
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    particleColor: "#4facfe",
    particleOpacity: 0.55,
    particleCount: 85,
    animationSpeed: 1.8,
  },
  {
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    particleColor: "#43e97b",
    particleOpacity: 0.55,
    particleCount: 70,
    animationSpeed: 2.2,
  },
  {
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    particleColor: "#fa709a",
    particleOpacity: 0.55,
    particleCount: 78,
    animationSpeed: 2.1,
  },
  {
    gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    particleColor: "#30cfd0",
    particleOpacity: 0.55,
    particleCount: 82,
    animationSpeed: 1.9,
  },
  {
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    particleColor: "#a8edea",
    particleOpacity: 0.55,
    particleCount: 72,
    animationSpeed: 2.3,
  },
  {
    gradient: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
    particleColor: "#ff9a56",
    particleOpacity: 0.55,
    particleCount: 76,
    animationSpeed: 2.4,
  },
  {
    gradient: "linear-gradient(135deg, #2e2e78 0%, #662d8c 100%)",
    particleColor: "#9d4edd",
    particleOpacity: 0.55,
    particleCount: 80,
    animationSpeed: 2,
  },
  {
    gradient: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)",
    particleColor: "#0093E9",
    particleOpacity: 0.55,
    particleCount: 74,
    animationSpeed: 2.2,
  },
];

export const useRandomBackground = (): BackgroundConfig => {
  return useMemo(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_PRESETS.length);
    return BACKGROUND_PRESETS[randomIndex];
  }, []);
};

export const getBackgroundByPath = (pathname: string): BackgroundConfig => {
  const pathHash = pathname
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = pathHash % BACKGROUND_PRESETS.length;
  return BACKGROUND_PRESETS[index];
};
