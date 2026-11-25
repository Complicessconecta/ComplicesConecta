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

/**
 * Registro de cuentas demo locales (ronda 7, punto 1).
 *
 * `createLocalDemoAccount` solo escribía la SESIÓN (`demo_authenticated`,
 * `demo_user`): al cerrar sesión `clearDemoAuth` borra esas claves y la
 * cuenta dejaba de existir, así que el login volvía a caer en
 * `supabase.auth.signInWithPassword` y el stub rechazaba con
 * "Supabase not configured - using stub client" (caso PruebaR6, ID
 * 4388c9fb). Este registro es la agenda de cuentas creadas en este
 * navegador: sobrevive al logout para que el login pueda resolverlas.
 *
 * La clave NO usa el prefijo `demo_` a propósito: `clearDemoAuth` /
 * `StorageManager.clearDemoSession` barren por prefijo (`demo_`,
 * `demo-`, `chat_messages:`...) y borrarían el registro en cada
 * logout, que es justo lo que se quiere evitar. Solo guarda el perfil
 * (email + apodo, sin contraseña: el modo demo es local y sin
 * contraseña, C4/C5); nunca es una cuenta real ni otorga admin.
 */
const LOCAL_DEMO_ACCOUNTS_KEY = "cc_local_demo_accounts_v1";

export interface LocalDemoAccountRecord {
  email: string;
  nickname: string;
  userId: string;
  profile: Profile;
  /**
   * Ronda 8 (punto 14): origen de la cuenta. Solo el formulario
   * "Crear Perfil Anónimo" crea cuentas anónimas; el resto son
   * registros single/pareja normales. Sin esto no hay forma de
   * distinguir una cuenta anónima ya guardada de una normal.
   */
  isAnonymous?: boolean;
}

function readLocalDemoAccounts(): LocalDemoAccountRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_DEMO_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is LocalDemoAccountRecord =>
        Boolean(r) &&
        typeof r === "object" &&
        typeof (r as { email?: unknown }).email === "string" &&
        typeof (r as { userId?: unknown }).userId === "string" &&
        Boolean((r as { profile?: unknown }).profile) &&
        typeof (r as { profile?: unknown }).profile === "object",
    );
  } catch {
    return [];
  }
}

function saveLocalDemoAccount(record: LocalDemoAccountRecord): void {
  if (typeof window === "undefined") return;
  try {
    const accounts = readLocalDemoAccounts().filter(
      (a) => a.userId !== record.userId && a.email !== record.email,
    );
    accounts.push(record);
    window.localStorage.setItem(
      LOCAL_DEMO_ACCOUNTS_KEY,
      JSON.stringify(accounts),
    );
  } catch {
    // Sin almacenamiento: la cuenta solo vive en esta sesión.
  }
}

/**
 * Busca una cuenta demo local por email o por apodo (insensible a
 * mayúsculas y a espacios). Es lo que el login usa cuando Supabase no
 * está configurado: si la cuenta existe en este navegador, se restaura
 * su sesión; si no, el login debe fallar con "cuenta no encontrada"
 * en vez de llamar al stub de Supabase.
 */
export function findLocalDemoAccount(
  emailOrNickname: string,
): LocalDemoAccountRecord | null {
  const needle = emailOrNickname.trim().toLowerCase();
  if (!needle) return null;
  return (
    readLocalDemoAccounts().find(
      (a) =>
        a.email.toLowerCase() === needle ||
        a.nickname.trim().toLowerCase() === needle,
    ) ?? null
  );
}

/**
 * Restaura la sesión demo de un perfil local (las mismas tres claves
 * que escribe el registro y `handleDemoAuth`).
 */
export function restoreLocalDemoSession(profile: Profile): void {
  localStorage.setItem("demo_authenticated", "true");
  localStorage.setItem(
    "userType",
    profile.accountType === "couple" ? "couple" : "single",
  );
  localStorage.setItem("demo_user", JSON.stringify(profile));
}

export interface LocalDemoAccountInput {
  email: string;
  /** Apodo / nombre en la comunidad (single) o apodo de pareja. */
  nickname: string;
  accountType: "single" | "couple";
  /**
   * Ronda 8 (punto 14): cuenta creada por "Crear Perfil Anónimo".
   * El perfil anónimo es suyo y limitado (sin NFTs, sin publicar,
   * permiso para todo): NO debe heredar los datos demo de Sofía.
   */
  isAnonymous?: boolean | undefined;
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
    // Ronda 8 (punto 14): marca de cuenta anónima. Viaja en
    // `demo_user` y useAuth la pasa al perfil cargado; el perfil
    // single la lee para no aplicar los fallbacks de Sofía.
    ...(input.isAnonymous ? { is_anonymous: true as const } : {}),
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
  restoreLocalDemoSession(profile);
  // Agenda de cuentas locales (ronda 7, punto 1): sin esto la cuenta
  // solo existe mientras dura la sesión y no hay con qué volver a
  // entrar tras cerrar sesión.
  saveLocalDemoAccount({
    email,
    nickname: input.nickname,
    userId,
    profile,
    ...(input.isAnonymous ? { isAnonymous: true as const } : {}),
  });

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

/**
 * Ronda 8 (punto 14): ¿es este perfil demo una cuenta ANÓNIMA?
 *
 * Causa raíz del clon de Sofía: el perfil single demo aplicaba los
 * datos canónicos de Sofía (foto, 28 años, 168 cm / 60 kg, intereses,
 * CMPX 1250 / GTK 850, 4 NFTs, 58 fotos privadas, PIN 1234) a
 * CUALQUIER sesión demo single, porque nada distinguía la persona
 * demo canónica (Sofía, `single@outlook.es`) de una cuenta creada
 * por el usuario. La cuenta anónima se crea sin ningún dato personal
 * (solo alias + email), así que TODOS los fallbacks de Sofía se
 * disparaban y el perfil quedaba clonado.
 *
 * Detección, en orden:
 * 1. Marca explícita `is_anonymous` (cuentas creadas por "Crear
 *    Perfil Anónimo" a partir de esta ronda) o tipo "anonymous".
 * 2. Legado (cuentas anónimas creadas antes de la marca, p. ej.
 *    TestR7): sesión demo single que NO es la credencial canónica
 *    de Sofía y NO trae ningún dato personal (sin edad, bio, género,
 *    avatar ni intereses). El registro single normal siempre pasa
 *    edad (y bio/intereses/género), y la Sofía canónica trae edad
 *    28 + foto + género en el perfil cargado por useAuth, así que
 *    ninguno de los dos cae aquí por error.
 *
 * La rama legado SOLO aplica a cuentas demo (`is_demo` o email
 * `@demo.local`): sin esta guarda, un perfil REAL sin datos
 * (nuevo usuario que aún no llenó edad/bio/género/avatar/
 * intereses) se clasificaría como anónimo y perdería NFTs,
 * publicación y galería privada.
 */
export function isAnonymousDemoProfile(profile: unknown): boolean {
  if (!profile || typeof profile !== "object") return false;
  const p = profile as Record<string, unknown>;
  if (p.is_anonymous === true) return true;
  for (const key of ["accountType", "type", "profile_type"]) {
    const value = p[key];
    if (typeof value === "string" && value.trim().toLowerCase() === "anonymous")
      return true;
  }
  const email = typeof p.email === "string" ? p.email.toLowerCase().trim() : "";
  if (email === "single@outlook.es" || email === "pareja@outlook.es")
    return false;
  // Ronda 8 (recuperación): la heurística legado solo vale para
  // cuentas demo; un perfil real sin datos no es anónimo.
  const isDemoAccount = p.is_demo === true || email.endsWith("@demo.local");
  if (!isDemoAccount) return false;
  const hasPersonalData =
    typeof p.age === "number" ||
    (typeof p.bio === "string" && p.bio.trim().length > 0) ||
    (typeof p.gender === "string" && p.gender.trim().length > 0) ||
    (typeof p.avatar_url === "string" && p.avatar_url.trim().length > 0) ||
    (Array.isArray(p.interests) && p.interests.length > 0);
  return !hasPersonalData;
}
