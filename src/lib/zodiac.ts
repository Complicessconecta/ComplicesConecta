/**
 * Signo zodiacal — derivado de la fecha de nacimiento o elegido a mano.
 *
 * El registro NO recogía fecha de nacimiento (solo "Edad" numérica; el
 * `birthDate` de Auth.tsx es estado muerto: nunca se renderiza ni se
 * envía). Por eso el signo se resuelve así, en este orden:
 *   1. signo manual elegido por el usuario (tiene prioridad),
 *   2. signo derivado de la fecha de nacimiento guardada,
 *   3. null (sin datos para derivarlo).
 *
 * La fecha y el signo manual se guardan como claves extra dentro del
 * mismo `privacy_settings` (couple_profiles) / localStorage
 * (`single_privacy:<id>` / `couple_privacy:<id>`), ver visibility.ts.
 * La tabla `profiles` (single) NO tiene columna `privacy_settings` ni
 * `birth_date`: en real, la fecha del single vive solo en local hasta
 * que exista la migración (ver reporte del coordinador).
 */

export interface ZodiacSign {
  /** Identificador estable en español, p. ej. "aries". */
  id: string;
  /** Nombre en español, p. ej. "Aries". */
  name: string;
  /** Símbolo unicode del signo, p. ej. "♈". */
  symbol: string;
  /** Inicio del rango (mes 1-12, día 1-31). */
  startMonth: number;
  startDay: number;
  /** Fin del rango (mes 1-12, día 1-31). */
  endMonth: number;
  endDay: number;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: "aries",
    name: "Aries",
    symbol: "♈",
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
  },
  {
    id: "tauro",
    name: "Tauro",
    symbol: "♉",
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
  },
  {
    id: "geminis",
    name: "Géminis",
    symbol: "♊",
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
  },
  {
    id: "cancer",
    name: "Cáncer",
    symbol: "♋",
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
  },
  {
    id: "leo",
    name: "Leo",
    symbol: "♌",
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
  },
  {
    id: "virgo",
    name: "Virgo",
    symbol: "♍",
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
  },
  {
    id: "libra",
    name: "Libra",
    symbol: "♎",
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
  },
  {
    id: "escorpio",
    name: "Escorpio",
    symbol: "♏",
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
  },
  {
    id: "sagitario",
    name: "Sagitario",
    symbol: "♐",
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
  },
  {
    id: "capricornio",
    name: "Capricornio",
    symbol: "♑",
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
  },
  {
    id: "acuario",
    name: "Acuario",
    symbol: "♒",
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
  },
  {
    id: "piscis",
    name: "Piscis",
    symbol: "♓",
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
  },
];

export function getZodiacSignById(
  id: string | null | undefined,
): ZodiacSign | null {
  if (!id) return null;
  return (
    ZODIAC_SIGNS.find((sign) => sign.id === id.toLowerCase().trim()) ?? null
  );
}

/** Signo para un mes (1-12) y día (1-31). null si la fecha no es válida. */
export function getZodiacSign(month: number, day: number): ZodiacSign | null {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Días reales por mes (febrero 29 para no rechazar años bisiestos).
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > (daysInMonth[month - 1] ?? 31)) return null;
  for (const sign of ZODIAC_SIGNS) {
    const afterStart =
      month > sign.startMonth ||
      (month === sign.startMonth && day >= sign.startDay);
    const beforeEnd =
      month < sign.endMonth || (month === sign.endMonth && day <= sign.endDay);
    // Capricornio cruza el cambio de año: su rango es (dic 22+) O (ene -19).
    if (sign.startMonth > sign.endMonth) {
      if (afterStart || beforeEnd) return sign;
    } else if (afterStart && beforeEnd) {
      return sign;
    }
  }
  return null;
}

/**
 * Signo a partir de una fecha ISO ("YYYY-MM-DD") o un Date.
 * Devuelve null si no hay fecha o no es válida. No usa la zona horaria:
 * corta los 10 primeros caracteres del ISO para no mover el día.
 */
export function getZodiacSignFromDate(
  value: string | Date | null | undefined,
): ZodiacSign | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return getZodiacSign(value.getMonth() + 1, value.getDate());
  }
  const iso = String(value).trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return getZodiacSign(Number(match[2]), Number(match[3]));
}

/** De dónde salió el signo resuelto. */
export type ZodiacSource = "manual" | "birthdate" | null;

export interface ResolveZodiacInput {
  /** Fecha de nacimiento ISO ("YYYY-MM-DD") o null. */
  birthDate?: string | null;
  /** Signo elegido a mano (id, p. ej. "aries") o "" para automático. */
  manualSign?: string | null;
}

/**
 * Resuelve el signo a mostrar. El manual tiene prioridad sobre la fecha:
 * el usuario puede corregir el signo sin cambiar su fecha de nacimiento.
 */
export function resolveZodiacSign(input: ResolveZodiacInput): {
  sign: ZodiacSign | null;
  source: ZodiacSource;
} {
  const manual = getZodiacSignById(input.manualSign ?? null);
  if (manual) return { sign: manual, source: "manual" };
  const derived = getZodiacSignFromDate(input.birthDate ?? null);
  if (derived) return { sign: derived, source: "birthdate" };
  return { sign: null, source: null };
}

/** Etiqueta lista para mostrar, p. ej. "♈ Aries". "" si no hay signo. */
export function formatZodiacSign(sign: ZodiacSign | null | undefined): string {
  if (!sign) return "";
  return `${sign.symbol} ${sign.name}`;
}
