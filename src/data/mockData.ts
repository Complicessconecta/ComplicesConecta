import type { Database } from "@/types/supabase-generated";
import { getAssetUrl } from "@/utils/assetLoader";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface MockProfile extends ProfileRow {
  stats: {
    totalViews: number;
    totalLikes: number;
    totalMatches: number;
    profileCompleteness: number;
  };
  interestsList: string[];
  nftImages: string[];
  nft_images?: string[];
}

const nftImage1 = "/assets/nfts/imagen1.jpg";
const nftImage2 = "/assets/nfts/imagen2.jpg";
const nftImage3 = "/assets/nfts/imagen3.jpg";

export const MOCK_PROFILE_SINGLE: MockProfile = {
  id: "demo-single-1",
  user_id: "demo-single-1",
  name: "Sofía Demo",
  display_name: "Sofía Demo",
  age: 28,
  account_type: "single",
  agreement_id: null,
  avatar_url: getAssetUrl("img/demo-single-avatar.jpg"),
  bio: "Explorando conexiones auténticas en el lifestyle swinger. Disfruto de experiencias discretas, respeto mutuo y encuentros sofisticados.",
  location: "Ciudad de México, México",
  gender: "female",
  interests: [
    "Lifestyle Swinger",
    "Experiencias Nuevas",
    "Conexiones Auténticas",
    "Ambiente Elegante",
    "Experiencias Sensuales",
    "Fiestas Temáticas",
  ],
  is_premium: true,
  is_verified: true,
  is_blocked: false,
  is_demo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  latitude: null,
  longitude: null,
  stats: {
    totalViews: 1240,
    totalLikes: 320,
    totalMatches: 48,
    profileCompleteness: 92,
  },
  interestsList: [
    "Principiantes Curiosos",
    "Mentalidad Abierta",
    "Soft Swap",
    "Cenas Románticas",
    "Viajes en Grupo",
    "Fiestas Privadas",
    "Conexión Emocional",
    "Diversión Segura",
  ],
  nftImages: [nftImage1, nftImage2, nftImage3],
  blocked_at: null,
  blocked_reason: null,
  consent_status: null,
  dispute_id: null,
  email_verified_at: null,
  first_name: "Sofía",
  full_name: "Sofía Demo",
  last_name: "Demo",
  is_online: true,
  phone_verified_at: null,
  role: null,
  s2_cell_id: null,
  s2_level: null,
  nft_images: [nftImage1, nftImage2, nftImage3], // Added for compatibility
};

export const MOCK_PROFILE_COUPLE: MockProfile = {
  id: "demo-couple-1",
  user_id: "demo-couple-1",
  name: "Ana & Luis Demo",
  display_name: "Ana & Luis Demo",
  age: 32,
  account_type: "couple",
  agreement_id: null,
  avatar_url: getAssetUrl("img/demo-couple-avatar.jpg"),
  bio: "Pareja abierta de Ciudad de México explorando el lifestyle con reglas claras, respeto y mucha complicidad.",
  location: "Ciudad de México, México",
  gender: "couple",
  interests: [
    "Intercambio de Parejas",
    "Cenas Románticas",
    "Viajes en Grupo",
    "Fiestas Privadas",
    "Conexión Emocional",
    "Diversión Segura",
  ],
  is_premium: true,
  is_verified: true,
  is_blocked: false,
  is_demo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  latitude: null,
  longitude: null,
  stats: {
    totalViews: 2150,
    totalLikes: 580,
    totalMatches: 112,
    profileCompleteness: 98,
  },
  interestsList: [
    "Full Swap",
    "Trios (H-M-H)",
    "Trios (M-H-M)",
    "Voyeurismo",
    "Exhibicionismo",
    "Swinger Clubs",
  ],
  nftImages: [nftImage1, nftImage2, nftImage3],
  nft_images: [nftImage1, nftImage2, nftImage3],
  blocked_at: null,
  blocked_reason: null,
  consent_status: null,
  dispute_id: null,
  email_verified_at: null,
  first_name: "Ana",
  full_name: "Ana & Luis Demo",
  last_name: "Luis",
  is_online: true,
  phone_verified_at: null,
  role: null,
  s2_cell_id: null,
  s2_level: null,
};
