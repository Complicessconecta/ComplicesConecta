import { FEMALE_NAMES, MALE_NAMES } from "@/lib/medianames";

const normalizeNameKey = (value: string): string => {
  const lower = value.toLowerCase();
  try {
    return lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return lower;
  }
};

const MALE_NAME_KEYS = new Set(MALE_NAMES.map(normalizeNameKey));
const FEMALE_NAME_KEYS = new Set(FEMALE_NAMES.map(normalizeNameKey));

export type ProfileType = "single" | "couple";
export type Gender = "male" | "female" | "unknown";

export function inferProfileKind(p: {
  name: string;
  type?: ProfileType;
  gender?: Gender;
}): { kind: "couple" | "single"; gender: Gender } {
  const normalized = (p.name || "").toLowerCase();
  if (p.type === "couple" || normalized.includes("&"))
    return { kind: "couple", gender: "unknown" };
  if (p.gender && p.gender !== "unknown")
    return { kind: "single", gender: p.gender };

  const first = normalized.split(/[ &,-]+/)[0] || "";
  const firstKey = normalizeNameKey(first);
  if (MALE_NAME_KEYS.has(firstKey)) return { kind: "single", gender: "male" };
  if (FEMALE_NAME_KEYS.has(firstKey))
    return { kind: "single", gender: "female" };
  return { kind: "single", gender: "unknown" };
}

// Pools de imágenes separados por categoría
const IMAGE_POOLS = {
  male: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
  ],
  female: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
  ],
  couple: [
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
  ],
};

// Contadores globales para cada pool
let poolCounters = {
  male: 0,
  female: 0,
  couple: 0,
};

export function pickProfileImage(
  p: { id: string; name: string; type?: ProfileType; gender?: Gender },
  used: Set<string>,
): string {
  const info = inferProfileKind(p);

  let poolKey: keyof typeof IMAGE_POOLS;
  if (info.kind === "couple") {
    poolKey = "couple";
  } else if (info.gender === "male") {
    poolKey = "male";
  } else if (info.gender === "female") {
    poolKey = "female";
  } else {
    // Fallback para género desconocido
    poolKey = Math.random() > 0.5 ? "male" : "female";
  }

  const pool = IMAGE_POOLS[poolKey];
  const fallbackImage = IMAGE_POOLS.female[0]!;
  let selectedImage: string = fallbackImage;
  let attempts = 0;
  const maxAttempts = pool.length * 2;

  while (attempts < maxAttempts) {
    const index = poolCounters[poolKey] % pool.length;
    const candidateImage = pool[index];
    if (candidateImage && !used.has(candidateImage)) {
      selectedImage = candidateImage;
      used.add(selectedImage);
      poolCounters[poolKey]++;
      return selectedImage;
    }
    poolCounters[poolKey]++;
    attempts++;
  }

  // Fallback: usar cualquier imagen del pool si todas están usadas
  for (const img of pool) {
    if (img) {
      selectedImage = img;
      used.add(selectedImage);
      return selectedImage;
    }
  }

  // Último fallback
  selectedImage = fallbackImage;
  used.add(selectedImage);
  return selectedImage;
}

// Función para resetear contadores (útil para testing o regeneración)
export function resetImageCounters() {
  poolCounters = {
    male: 0,
    female: 0,
    couple: 0,
  };
}

// Función para obtener imagen con fallback
export function getProfileImageWithFallback(imagePath: string): string {
  // En producción, aquí podrías verificar si la imagen existe
  // Por ahora, usar fallbacks conocidos
  const fallbacks = ["/public/placeholder.svg", "/public/compliceslogo.png"];

  try {
    return imagePath;
  } catch {
    return fallbacks[0] ?? "/public/placeholder.svg";
  }
}

// Función para obtener estadísticas de uso de imágenes
export function getImageUsageStats() {
  return {
    counters: { ...poolCounters },
    poolSizes: {
      male: IMAGE_POOLS.male.length,
      female: IMAGE_POOLS.female.length,
      couple: IMAGE_POOLS.couple.length,
    },
  };
}
