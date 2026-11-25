/**
 * Registro demo local (sin Supabase).
 *
 * Cuando el preview no tiene VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY,
 * el cliente de Supabase es un stub cuya fetch siempre rechaza con
 * "Supabase not configured - using stub client" y cualquier registro
 * real falla. El registro demo NO debe depender de Supabase (mismo
 * principio del veredicto provisional de la ronda 5): crea la cuenta
 * en localStorage con la misma forma que `handleDemoAuth` / `useAuth`
 * esperan (`demo_authenticated`, `userType`, `demo_user` con forma de
 * Profile) y guarda país y fecha de nacimiento con los helpers locales
 * que ya usan los formularios de registro.
 *
 * La cuenta así creada es local al navegador: sirve para probar el
 * flujo completo (perfil propio, perfil privado para no-amigo,
 * solicitudes de amistad) en el preview. NO es una cuenta real: al
 * configurar las variables en Vercel, el registro real vuelve a ser
 * el camino principal y estas cuentas demo no existen en la BD.
 */
import { generateDemoUserUUID } from "@/lib/demo-uuid";
import { writeCountryCodeLocal } from "@/lib/countries";
import { savePrivacySettingsExtra } from "@/lib/visibility";
import type { Profile } from "@/types/supabase-custom";

export interface LocalDemoAccountInput {
  email: string;
  /** Apodo / nombre en la comunidad (single) o apodo de pareja. */
  nickname: string;
  accountType: "single" | "couple";
  firstName?: string | undefined;
  lastName?: string | undefined;
  /** Edad del single o del primer integrante de la pareja. */
  age?: number | undefined;
  bio?: string | undefined;
  interests?: string[] | undefined;
  countryCode?: string | undefined;
  /** Fecha de nacimiento ISO del single o del primer integrante. */
  birthDate?: string | undefined;
  gender?: string | undefined;
  interestedIn?: string | string[] | undefined;
  /** Pareja: nombre del segundo integrante. */
  partnerFirstName?: string | undefined;
  /** Pareja: edad del segundo integrante. */
  partnerAge?: number | undefined;
  /** Pareja: fecha de nacimiento ISO del segundo integrante. */
  partnerBirthDate?: string | undefined;
}

export function createLocalDemoAccount(input: LocalDemoAccountInput): {
  userId: string;
  profile: Profile;
} {
  const email = input.email.trim().toLowerCase();
  const userId = generateDemoUserUUID(email);
  const displayName =
    input.accountType === "couple" && input.partnerFirstName
      ? `${input.firstName ?? input.nickname} & ${input.partnerFirstName}`
      : input.nickname;
  const interestedIn = Array.isArray(input.interestedIn)
    ? input.interestedIn.join(", ")
    : input.interestedIn;

  const profile: Profile = {
    id: userId,
    user_id: userId,
    email,
    first_name: input.firstName ?? input.nickname,
    last_name: input.lastName ?? "",
    name: displayName,
    display_name: displayName,
    nickname: input.nickname,
    accountType: input.accountType,
    profile_type: input.accountType,
    relationship_type: input.accountType,
    couple_name: input.accountType === "couple" ? displayName : undefined,
    his_name:
      input.accountType === "couple"
        ? `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim() ||
          input.nickname
        : undefined,
    his_age:
      input.accountType === "couple" && typeof input.age === "number"
        ? input.age
        : undefined,
    her_name:
      input.accountType === "couple" ? input.partnerFirstName : undefined,
    her_age:
      input.accountType === "couple" && typeof input.partnerAge === "number"
        ? input.partnerAge
        : undefined,
    role: "user",
    age: typeof input.age === "number" ? input.age : null,
    bio: input.bio ?? null,
    gender: input.gender ?? null,
    interested_in: interestedIn ?? null,
    interests: input.interests ?? null,
    is_demo: true,
    is_verified: false,
    is_premium: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Misma sesión demo que el login demo: useAuth la lee de aquí.
  localStorage.setItem("demo_authenticated", "true");
  localStorage.setItem("userType", input.accountType);
  localStorage.setItem("demo_user", JSON.stringify(profile));

  if (input.countryCode) {
    writeCountryCodeLocal(userId, input.countryCode);
  }
  // Fecha(s) de nacimiento: de ahí se deriva el signo zodiacal. En demo
  // la fuente es el local; el helper además intenta el guardado en BD,
  // que falla silencioso con el stub (queda el local).
  if (input.birthDate) {
    savePrivacySettingsExtra(userId, input.accountType, {
      birthDate: input.birthDate,
      ...(input.partnerBirthDate ? { birthDate2: input.partnerBirthDate } : {}),
    });
  }

  return { userId, profile };
}
