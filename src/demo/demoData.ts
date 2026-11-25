/**
 * Datos demo para ComplicesConecta
 * Perfiles mock para desarrollo y testing
 */

import { generateDemoUUID } from "@/lib/demo-uuid";
import { pickProfileImage, resetImageCounters, type ProfileType, type Gender } from "@/lib/media";
import { getAutoInterests } from "@/lib/lifestyle-interests";

/**
 * Datos canónicos de la pareja demo (UNA sola fuente, ronda 5):
 * Carmen & Roberto, 25 y 28 años (los mismos que la semilla demo de
 * `ProfileCouple.tsx`). Antes cada sitio decía una edad distinta:
 * 31 en el roster de Discover, 35 en Matches, 25/28 en el perfil
 * propio. La foto principal es la que les asigna el pool de pareja
 * (2ª del pool, silueta al atardecer) — la misma en Discover, Matches
 * y su perfil propio, nunca la de otra pareja.
 */
export const DEMO_COUPLE_CARMEN_ROBERTO = {
  name: "Carmen & Roberto",
  partner1: { name: "Carmen", age: 25 },
  partner2: { name: "Roberto", age: 28 },
  /** "25 y 28 años". */
  ageLabel: "25 y 28 años",
  mainImage:
    "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=400&h=400&fit=crop",
} as const;

/**
 * Foto canónica de Sofía (single demo, 28 años, id 609dcb3b…): retrato
 * verificado, la misma en su avatar, su galería pública y Matches.
 * Antes su avatar apuntaba a `img/demo-single-avatar.jpg` (no existe)
 * y su galería pública eran 3 mujeres distintas.
 */
export const SOFIA_CANONICAL_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face";

/** Id base de la foto canónica de Sofía, para derivar encuadres. */
export const SOFIA_CANONICAL_PHOTO_ID = "1494790108377-be9c29b29330";

/** Etiqueta de edad de una pareja ("25 y 28 años"). */
export const formatCoupleAgeLabel = (age: number, partnerAge: number): string =>
  `${age} y ${partnerAge} años`;

export interface DemoProfile {
  id: string;
  name: string;
  age: number;
  /** Edad del segundo miembro (solo parejas, p. ej. Carmen 25 / Roberto 28). */
  partnerAge?: number;
  location: string;
  distance: number;
  interests: string[];
  image: string;
  bio: string;
  isOnline: boolean;
  lastActive: string;
  isVerified: boolean;
  isPremium: boolean;
  rating: number;
  matchScore: number;
  profileType: ProfileType;
  gender?: Gender;
  partnerGender?: Gender;
  theme?: "romantic" | "adventurous";
  isDemo: true;
}

/**
 * Roster canónico de perfiles demo de Discover.
 * DETERMINISTA: nombres únicos (sin repetidos), género coherente con el
 * nombre — Ana es mujer y lleva foto de mujer, Francisco es hombre y
 * lleva foto de hombre —, ids estables entre cargas (generateDemoUUID con
 * seed fijo, nunca uuidv4 ni Math.random), y contadores/orden fijos.
 * Las parejas se nombran "X & Y" para que el filtro "Pareja" las distinga.
 */
const DEMO_ROSTER: Array<{
  name: string;
  gender: Gender;
  profileType: ProfileType;
  age: number;
  /** Edad del segundo miembro (solo parejas). */
  partnerAge?: number;
  location: string;
}> = [
  { name: "Ana", gender: "female", profileType: "single", age: 26, location: "Guadalajara" },
  { name: "Francisco", gender: "male", profileType: "single", age: 34, location: "Ciudad de México" },
  { name: "María & Juan", gender: "unknown", profileType: "couple", age: 29, location: "Guadalajara" },
  { name: "Carlos", gender: "male", profileType: "single", age: 32, location: "Monterrey" },
  { name: "Laura", gender: "female", profileType: "single", age: 27, location: "Puebla" },
  { name: "Carmen & Roberto", gender: "unknown", profileType: "couple", age: 25, partnerAge: 28, location: "Ciudad de México" },
  { name: "Miguel", gender: "male", profileType: "single", age: 35, location: "Tijuana" },
  { name: "Lucía", gender: "female", profileType: "single", age: 24, location: "Mérida" },
  { name: "Javier & Elena", gender: "unknown", profileType: "couple", age: 33, location: "Querétaro" },
  { name: "David", gender: "male", profileType: "single", age: 30, location: "León" },
  { name: "Cristina", gender: "female", profileType: "single", age: 28, location: "Monterrey" },
  { name: "Alejandro", gender: "male", profileType: "single", age: 36, location: "Guadalajara" },
  { name: "Rosa & Daniel", gender: "unknown", profileType: "couple", age: 30, location: "Puebla" },
  { name: "Isabel", gender: "female", profileType: "single", age: 25, location: "Ciudad de México" },
  { name: "Rafael", gender: "male", profileType: "single", age: 38, location: "Torreón" },
  { name: "Pilar", gender: "female", profileType: "single", age: 29, location: "San Luis Potosí" },
  { name: "Sergio & Teresa", gender: "unknown", profileType: "couple", age: 34, location: "Cuernavaca" },
  { name: "Manuel", gender: "male", profileType: "single", age: 41, location: "Mexicali" },
  { name: "Dolores", gender: "female", profileType: "single", age: 33, location: "Aguascalientes" },
  { name: "Pablo & Raquel", gender: "unknown", profileType: "couple", age: 27, location: "Mérida" },
];

/**
 * Fotos de pareja VERIFICADAS por vista, una a una: cada URL es una
 * foto distinta de una pareja junta (no símbolos ni fotos sueltas).
 * Revisión ronda 5 (2026-11-24): se sacaron 1522098543979 (dos
 * hombres en la playa), 1516589178581 (dos manos formando un corazón
 * — esa era la foto que se repetía como post de Ana y avatar del
 * chat) y 1465495976277 (solo manos con anillos, sin caras). Reemplazos
 * verificados por vista: 1519741497674 novios con ramo, 1532712938310
 * novios caminando de la mano en la montaña y 1591604466107 retrato
 * de novios. Mismo pool que el "couple" de @/lib/media (8 fotos para
 * 6 parejas demo, sin repetir hasta agotar la lista).
 */
export const DEMO_COUPLE_IMAGES = [
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=400&fit=crop",
];

/** Foto de pareja verificada, sin repetir hasta agotar la lista. */
const pickVerifiedCoupleImage = (coupleIndex: number, used: Set<string>): string => {
  const unused = DEMO_COUPLE_IMAGES.find((url) => !used.has(url));
  const url = unused ?? DEMO_COUPLE_IMAGES[coupleIndex % DEMO_COUPLE_IMAGES.length]!;
  used.add(url);
  return url;
};

export const generateDemoProfiles = (count: number = 20): DemoProfile[] => {
  const bios = [
    "Explorando el lifestyle swinger con mente abierta y respeto. Busco conexiones auténticas y experiencias compartidas.",
    "Pareja liberal en busca de otras parejas afines para intercambios. Discreción y comunicación abierta son clave.",
    "Nuevo en el lifestyle swinger, pero con muchas ganas de conocer gente interesante y vivir nuevas experiencias.",
    "Experiencia en el lifestyle, buscando parejas y singles para momentos únicos. Siempre con respeto mutuo.",
    "Discreto y respetuoso. Me encanta la vida social del lifestyle y conocer personas afines.",
    "Pareja experimentada buscando conexiones reales en el lifestyle swinger. Comunicación y límites claros.",
    "Aventurero del lifestyle swinger en busca de parejas y personas para compartir diversión adulta.",
    "Buscando explorar el lifestyle con parejas de mente abierta. Discreción total y ambiente relajado.",
  ];

  resetImageCounters();

  // Un solo `used` compartido por toda la tanda: sin fotos repetidas
  // hasta agotar el pool de cada categoría.
  const usedImages = new Set<string>();
  const experienceLevels = ["principiante", "intermedio", "experimentado"];

  // Índice de pareja para rotar las fotos de pareja verificadas.
  let coupleIndex = 0;

  return Array.from({ length: count }, (_, i) => {
    const entry = DEMO_ROSTER[i % DEMO_ROSTER.length]!;
    const profileType: ProfileType = entry.profileType;
    const gender: Gender = entry.gender;
    const partnerGender: Gender = gender === "male" ? "female" : "male";

    // Nivel de experiencia determinista por posición.
    const experienceLevel =
      experienceLevels[i % experienceLevels.length]!;

    // Intereses automáticos apropiados para el lifestyle swinger
    // (getAutoInterests es determinista). Las parejas no tienen género
    // único: se pasa undefined.
    const interests = getAutoInterests(
      profileType,
      experienceLevel,
      gender === "unknown" ? undefined : gender,
    );

    const profile: DemoProfile = {
      id: generateDemoUUID(`demo-profile-${i + 1}`),
      name: entry.name,
      age: entry.age,
      // Edad del segundo miembro (parejas): la del roster canónico.
      ...(entry.partnerAge !== undefined
        ? { partnerAge: entry.partnerAge }
        : {}),
      location: entry.location,
      distance: 3 + ((i * 11) % 47),
      interests,
      // Las parejas NO usan pickProfileImage: su pool "couple" de
      // @/lib/media está contaminado con fotos de una sola persona y
      // las tarjetas de pareja salían con foto de un solo hombre.
      image:
        profileType === "couple"
          ? pickVerifiedCoupleImage(coupleIndex++, usedImages)
          : pickProfileImage(
              {
                id: generateDemoUUID(`demo-profile-${i + 1}`),
                name: entry.name,
                type: profileType,
                gender,
              },
              usedImages,
            ),
      bio: bios[i % bios.length] ?? "Sin bio disponible",
      isOnline: i % 3 !== 0,
      lastActive: `Hace ${((i * 7) % 50) + 5} min`,
      isVerified: i % 4 !== 0,
      isPremium: i % 5 === 0,
      rating: 4 + (i % 2) * 0.5,
      matchScore: 70 + ((i * 7) % 28),
      profileType,
      gender,
      theme: i % 2 === 0 ? "romantic" : "adventurous",
      isDemo: true as const,
    };

    if (profileType === "couple") {
      profile.partnerGender = partnerGender;
    }

    return profile;
  });
};

export const demoStats = {
  totalUsers: 15420,
  activeToday: 2341,
  newThisWeek: 187,
  premiumUsers: 892,
  verifiedProfiles: 7234,
  successfulMatches: 3456,
  averageAge: 32,
  topLocation: "Ciudad de México",
};

export const demoProfiles = [
  {
    id: "demo-1",
    first_name: "Ana",
    last_name: "García",
    display_name: "Ana & Carlos",
    // NFT Gallery example - Lifestyle Swinger
    nft_galleries: [
      {
        id: "nft-demo-1",
        gallery_name: "Aventuras Lifestyle",
        is_verified: true,
        nft_network: "polygon",
        nft_token_id: "#12345",
        minted_at: "2025-06-15T10:30:00Z",
        images_count: 12,
        description:
          "Galería NFT verificada de experiencias compartidas en el lifestyle",
      },
    ],
  },
  {
    id: "demo-6",
    first_name: "Javier",
    last_name: "Morales",
    display_name: "Javier M.",
    age: 31,
    bio: "Emprendedor de Tijuana con éxito en los negocios y mente abierta para nuevas experiencias. Busco conexiones auténticas y momentos especiales.",
    email: "javier.morales@demo.com",
    profile_type: "single",
    is_demo: true,
    is_verified: false,
    is_premium: false,
    role: "user",
    latitude: 32.5149,
    longitude: -117.0382,
    created_at: "2024-02-20T13:10:00Z",
    updated_at: "2024-02-20T13:10:00Z",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    interests: [
      "negocios",
      "networking",
      "lujo",
      "experiencias_exclusivas",
      "vida_social",
    ],
    location: "Tijuana, Baja California",
    // NFT Gallery example - Business & Lifestyle
    nft_galleries: [
      {
        id: "nft-demo-6",
        gallery_name: "Eventos Exclusivos",
        is_verified: true,
        nft_network: "polygon",
        nft_token_id: "#67890",
        minted_at: "2025-07-20T14:15:00Z",
        images_count: 8,
        description: "Galería NFT de eventos exclusivos y experiencias premium",
      },
    ],
  },
  {
    id: "demo-2",
    first_name: "Carlos",
    last_name: "Rodríguez",
    display_name: "Carlos R.",
    age: 32,
    bio: "Soltero de Guadalajara con mente abierta. Disfruto de la buena compañía, eventos sociales y experiencias nuevas. Busco conexiones genuinas.",
    email: "carlos.demo@complicesconecta.com",
    profile_type: "single",
    is_demo: true,
    is_verified: false,
    is_premium: true,
    role: "user",
    location: "Ciudad de México, México",
    interests: [
      "Lifestyle Swinger",
      "Intercambio de Parejas",
      "Eventos Lifestyle",
      "Mentalidad Abierta",
    ],
    created_at: "2024-01-16T14:30:00Z",
    updated_at: "2024-01-16T14:30:00Z",
  },
  {
    id: "demo-couple-1",
    first_name: "María & Juan",
    last_name: "López",
    display_name: "María & Juan",
    age: 29,
    bio: "Pareja aventurera buscando nuevas experiencias y amistades.",
    email: "pareja.demo@complicesconecta.com",
    profile_type: "couple",
    is_demo: true,
    is_verified: true,
    is_premium: true,
    role: "user",
    location: "Guadalajara, México",
    interests: [
      "Intercambio de Parejas",
      "Fiestas Temáticas",
      "Clubs Privados",
      "Experiencias Nuevas",
    ],
    created_at: "2024-01-17T09:15:00Z",
    updated_at: "2024-01-17T09:15:00Z",
    // NFT Gallery example - Premium couple with verified NFT
    nft_galleries: [
      {
        id: "nft-demo-couple-1",
        gallery_name: "Encuentros Lifestyle",
        is_verified: true,
        nft_network: "polygon",
        nft_token_id: "#11111",
        minted_at: "2025-08-10T16:45:00Z",
        images_count: 20,
        description:
          "Galería NFT verificada de encuentros y experiencias compartidas",
      },
      {
        id: "nft-demo-couple-2",
        gallery_name: "Fiestas Privadas",
        is_verified: true,
        nft_network: "polygon",
        nft_token_id: "#22222",
        minted_at: "2025-09-05T11:20:00Z",
        images_count: 15,
        description: "Galería NFT de fiestas privadas y eventos exclusivos",
      },
    ],
  },
  {
    id: "demo-3",
    first_name: "Laura",
    last_name: "Martínez",
    display_name: "Laura M.",
    age: 26,
    bio: "Artista y diseñadora. Me encanta crear y conectar con personas creativas.",
    email: "laura.demo@complicesconecta.com",
    profile_type: "single",
    is_demo: true,
    is_verified: true,
    is_premium: false,
    role: "user",
    location: "Monterrey, México",
    interests: [
      "Arte Erótico",
      "Fotografía Erótica",
      "Ambiente Sensual",
      "Conexiones Auténticas",
    ],
    created_at: "2024-01-18T16:45:00Z",
    updated_at: "2024-01-18T16:45:00Z",
    // NFT Gallery example - Artist with verified NFT portfolio
    nft_galleries: [
      {
        id: "nft-demo-3",
        gallery_name: "Arte Sensual",
        is_verified: true,
        nft_network: "polygon",
        nft_token_id: "#33333",
        minted_at: "2025-05-12T09:00:00Z",
        images_count: 25,
        description:
          "Galería NFT de arte erótico y fotografía sensual verificada",
      },
    ],
  },
  {
    id: "demo-4",
    first_name: "Miguel",
    last_name: "Fernández",
    display_name: "Miguel F.",
    age: 35,
    bio: "Chef profesional y amante de la buena comida. Siempre experimentando.",
    email: "miguel.demo@complicesconecta.com",
    profile_type: "single",
    is_demo: true,
    is_verified: false,
    is_premium: false,
    role: "user",
    location: "Puebla, México",
    interests: [
      "Cenas Íntimas",
      "Cócteles Afrodisíacos",
      "Experiencias Sensuales",
      "Diversión Adulta",
    ],
    created_at: "2024-01-19T11:20:00Z",
    updated_at: "2024-01-19T11:20:00Z",
  },
];

export const demoMessages = [
  {
    id: "msg-1",
    content: "¡Hola! Me encanta tu perfil, tenemos muchos intereses en común.",
    sender_id: "demo-1",
    receiver_id: "demo-2",
    created_at: "2024-01-20T10:30:00Z",
    read: false,
  },
  {
    id: "msg-2",
    content:
      "Gracias Ana! También me llamó la atención tu pasión por la fotografía.",
    sender_id: "demo-2",
    receiver_id: "demo-1",
    created_at: "2024-01-20T10:45:00Z",
    read: true,
  },
  {
    id: "msg-3",
    content: "¿Te gustaría quedar para tomar un café y hablar de viajes?",
    sender_id: "demo-1",
    receiver_id: "demo-2",
    created_at: "2024-01-20T11:00:00Z",
    read: false,
  },
];

export const demoInvitations = [
  {
    id: "inv-1",
    from_profile: "demo-3",
    to_profile: "demo-1",
    type: "profile",
    message: "Me encantaría conocerte mejor, ¿te interesa conectar?",
    status: "pending",
    created_at: "2024-01-20T09:00:00Z",
  },
  {
    id: "inv-2",
    from_profile: "demo-4",
    to_profile: "demo-couple-1",
    type: "gallery",
    message: "Hola! Me gustaría ver más fotos de vuestras aventuras.",
    status: "accepted",
    created_at: "2024-01-19T15:30:00Z",
  },
];

export const demoEvents = [
  {
    id: "event-1",
    title: "Noche de Fotografía",
    description: "Encuentro para amantes de la fotografía nocturna",
    date: "2024-02-15T20:00:00Z",
    location: "Parque del Retiro, Madrid",
    organizer: "demo-1",
    attendees: ["demo-2", "demo-3"],
    max_attendees: 10,
    is_premium: false,
  },
  {
    id: "event-2",
    title: "Cena Gastronómica",
    description: "Experiencia culinaria con chef profesional",
    date: "2024-02-20T19:30:00Z",
    location: "Restaurante Demo, Barcelona",
    organizer: "demo-4",
    attendees: ["demo-couple-1"],
    max_attendees: 8,
    is_premium: true,
  },
];

export const demoMatches = [
  {
    id: "match-1",
    profile1: "demo-1",
    profile2: "demo-2",
    compatibility_score: 85,
    matched_at: "2024-01-20T08:00:00Z",
    status: "active",
  },
  {
    id: "match-2",
    profile1: "demo-3",
    profile2: "demo-4",
    compatibility_score: 72,
    matched_at: "2024-01-19T14:20:00Z",
    status: "pending",
  },
];

