import { generateDemoUUID } from "@/lib/demo-uuid";
import type { ProfileType, Gender } from "@/lib/media";
import { pickProfileImage, inferProfileKind, resetImageCounters } from "@/lib/media";
import { nombres } from "@/constants/discover/nombres";
import { ubicaciones } from "@/constants/discover/ubicaciones";
import { bios } from "@/constants/discover/bios";
import { getDemoRosterAge } from "@/demo/demoData";
import type { Profile } from "@/types/discover.types";

// Nombres que @/lib/medianames no resuelve y quedaban en género
// "unknown" (con lo que pickProfileImage elegía pool hombre/mujer al
// azar y las fotos salían con género incorrecto).
const GENDER_OVERRIDES: Record<string, Gender> = {
  luca: "male",
  manuela: "female",
};

/**
 * Edad estable de un perfil demo POR NOMBRE (ronda 14, stream C).
 *
 * Causa raíz de "Ana 29→26" entre cargas/superficies: la edad se
 * sorteaba por POSICIÓN en el flujo aleatorio (`rand()` tras el
 * nombre), así que el mismo nombre salía con edades distintas — tres
 * "Carlos" a 41/40/45 en esta misma lista, frente a 32 en el roster
 * canónico de Discover, y cualquier cambio en la lista re-sorteaba
 * todas las edades. Ahora la edad es un atributo del nombre:
 * la del roster cuando el nombre es canónico (Ana siempre 26) y, si
 * no está en el roster, un hash estable del nombre (FNV-1a) en 22–45.
 * La lista sigue siendo determinista entre cargas (semilla fija) y
 * la edad ya no depende del orden ni de la longitud de la lista.
 * Solo afecta a datos demo/seeded; los perfiles reales usan su edad
 * de Supabase y no pasan por aquí.
 */
export const ageForDemoName = (name: string): number => {
  const rosterAge = getDemoRosterAge(name);
  if (rosterAge !== undefined) return rosterAge;
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return 22 + ((hash >>> 0) % 24);
};

/**
 * PRNG con semilla fija (mulberry32). La lista de Discover es
 * DETERMINISTA entre cargas (ronda 6, punto 15): antes cada llamada
 * usaba Math.random() y uuidv4(), así que cada visita a Discover
 * mostraba 50 perfiles distintos (nombres, edades, distancias e ids
 * nuevos). Con semilla fija, la misma llamada devuelve siempre la
 * misma lista, en el mismo orden, con los mismos ids.
 */
const DISCOVER_SEED = 20261124;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const generateRandomProfiles = (): Profile[] => {
  resetImageCounters();

  // Semilla fija por llamada: la lista es idéntica en cada carga y en
  // cada refresco (el botón "actualizar" recarga la misma lista
  // estable; no hay "nuevos perfiles" aleatorios en demo).
  const rand = mulberry32(DISCOVER_SEED);
  const pick = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(rand() * arr.length)] ?? arr[0]!;

  const usedImages = new Set<string>();
  const baseInterests = ["Lifestyle", "Swinger", "Parejas", "Intercambio"];
  const newProfiles: Profile[] = Array.from({ length: 50 }, (_, index) => {
    const name = pick(nombres);
    const profileKind = inferProfileKind({ name });
    const profileType: ProfileType = profileKind.kind === "couple" ? "couple" : "single";
    const firstName = name.split(" ")[0]?.toLowerCase() ?? "";
    const gender: Gender = GENDER_OVERRIDES[firstName] ?? profileKind.gender;
    // Id estable por posición (antes uuidv4: cada carga, ids nuevos y
    // los likes/matches guardados por id se perdían).
    const id = generateDemoUUID(`discover-profile-${index + 1}`);
    // Fisher-Yates con la semilla fija (determinista; sort() con
    // comparador aleatorio no lo es en todos los motores).
    const shuffled = [...baseInterests];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = tmp;
    }

    return {
      id,
      name,
      // Ronda 14, stream C: edad por nombre, no por sorteo (ver
      // `ageForDemoName`): el mismo nombre, la misma edad, siempre.
      age: ageForDemoName(name),
      location: pick(ubicaciones),
      distance: Math.floor(rand() * 100) + 1,
      interests: shuffled.slice(0, Math.floor(rand() * 3) + 2),
      image: pickProfileImage({ id, name, type: profileType, gender }, usedImages),
      bio: pick(bios),
      isOnline: rand() > 0.6,
      lastActive: rand() > 0.5 ? "Hace 1 hora" : "Hace 2 días",
      isVerified: rand() > 0.7,
      isPremium: rand() > 0.8,
      rating: Math.round((rand() * 2 + 3) * 10) / 10,
      matchScore: Math.floor(rand() * 40) + 60,
      profileType,
      gender,
    };
  });

  return newProfiles;
};
