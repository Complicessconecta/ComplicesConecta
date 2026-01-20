import { v4 as uuidv4 } from "uuid";
import type { ProfileType, Gender } from "@/lib/media";
import { pickProfileImage, inferProfileKind, resetImageCounters } from "@/lib/media";
import { nombres } from "@/constants/discover/nombres";
import { ubicaciones } from "@/constants/discover/ubicaciones";
import { bios } from "@/constants/discover/bios";
import type { Profile } from "@/types/discover.types";

export const generateRandomProfiles = (): Profile[] => {
  resetImageCounters();

  const usedImages = new Set<string>();
  const newProfiles: Profile[] = Array.from({ length: 50 }, (_, _index) => {
    const name = nombres[Math.floor(Math.random() * nombres.length)] ?? "Usuario";
    const profileKind = inferProfileKind({ name });
    const profileType: ProfileType = profileKind.kind === "couple" ? "couple" : "single";
    const gender: Gender = profileKind.gender;
    const id = uuidv4();

    return {
      id,
      name,
      age: Math.floor(Math.random() * (45 - 22 + 1)) + 22,
      location: ubicaciones[Math.floor(Math.random() * ubicaciones.length)] ?? "Ciudad de México",
      distance: Math.floor(Math.random() * 100) + 1,
      interests: ["Lifestyle", "Swinger", "Parejas", "Intercambio"]
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 2),
      image: pickProfileImage({ id, name, type: profileType, gender }, usedImages),
      bio: bios[Math.floor(Math.random() * bios.length)] ?? "",
      isOnline: Math.random() > 0.6,
      lastActive: Math.random() > 0.5 ? "Hace 1 hora" : "Hace 2 días",
      isVerified: Math.random() > 0.7,
      isPremium: Math.random() > 0.8,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      matchScore: Math.floor(Math.random() * 40) + 60,
      profileType,
      gender,
    };
  });

  return newProfiles;
};
