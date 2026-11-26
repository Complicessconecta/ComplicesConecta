import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/app-config";
import { logger } from "@/lib/logger";

/**
 * Contenido de clubs: eventos, descuentos y miembros.
 * Las tablas club_events / club_discounts / club_members existen desde la
 * migración 20261124030000, pero NINGÚN archivo de src/ las consultaba:
 * los eventos del demo vivían solo en memoria (DEMO_EVENTS en ClubsDemo).
 * Este servicio es el lector/escritor canónico: intenta Supabase (con
 * timeout corto para no dejar "Cargando clubs..." colgado) y cae al
 * respaldo demo; en demo, lo creado se guarda en localStorage.
 */

export interface ClubEventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  registeredCount: number;
  isVip: boolean;
  price: number;
  currency: string;
}

export interface ClubDiscountItem {
  id: string;
  code: string;
  description: string;
  discountPercent: number | null;
  discountAmount: number | null;
  validUntil: string | null;
  maxUses: number | null;
  usesCount: number;
}

export interface ClubMemberItem {
  id: string;
  userId: string;
  displayName: string;
  role: string;
  status: string;
  joinedAt: string;
}

export const DEMO_CLUB_EVENTS: ClubEventItem[] = [
  {
    id: "evt-1",
    title: "Noche de Máscaras",
    description:
      "Velada de misterio y elegancia. Dress code: formal oscuro con máscara.",
    date: new Date().toISOString(),
    startTime: "22:00",
    endTime: "03:00",
    location: "CDMX",
    capacity: 300,
    registeredCount: 120,
    isVip: true,
    price: 500,
    currency: "$",
  },
  {
    id: "evt-2",
    title: "Velvet Social",
    description:
      "DJ invitado + dress code noir. Experiencia sensorial con mixología premium.",
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    startTime: "21:30",
    endTime: "02:30",
    location: "CDMX",
    capacity: 180,
    registeredCount: 96,
    isVip: false,
    price: 350,
    currency: "$",
  },
  {
    id: "evt-3",
    title: "Ritual de Luna",
    description:
      "Experiencia sensorial + mixología molecular bajo la luz de la luna.",
    date: new Date(Date.now() + 86400000 * 10).toISOString(),
    startTime: "23:00",
    endTime: "04:00",
    location: "CDMX",
    capacity: 240,
    registeredCount: 144,
    isVip: true,
    price: 650,
    currency: "$",
  },
  {
    id: "evt-4",
    title: "Encuentro de Cómplices",
    description:
      "Noche de networking para parejas y solteros con afinidades compartidas.",
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    startTime: "20:00",
    endTime: "02:00",
    location: "CDMX",
    capacity: 200,
    registeredCount: 85,
    isVip: false,
    price: 400,
    currency: "$",
  },
  {
    id: "evt-5",
    title: "Cena Clandestina",
    description:
      "Cena de 5 tiempos con maridaje en espacio íntimo. Solo 40 cupos.",
    date: new Date(Date.now() + 86400000 * 18).toISOString(),
    startTime: "20:30",
    endTime: "01:00",
    location: "CDMX",
    capacity: 40,
    registeredCount: 38,
    isVip: true,
    price: 1200,
    currency: "$",
  },
  {
    id: "evt-6",
    title: "After Hours",
    description:
      "Continúa la fiesta después del cierre. Música deep house y ambiente relajado.",
    date: new Date(Date.now() + 86400000 * 21).toISOString(),
    startTime: "01:00",
    endTime: "06:00",
    location: "CDMX",
    capacity: 100,
    registeredCount: 67,
    isVip: true,
    price: 300,
    currency: "$",
  },
];

export const DEMO_CLUB_DISCOUNTS: ClubDiscountItem[] = [
  {
    id: "dsc-1",
    code: "AURA20",
    description: "20% en la primera visita al club",
    discountPercent: 20,
    discountAmount: null,
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    maxUses: 100,
    usesCount: 34,
  },
  {
    id: "dsc-2",
    code: "VIP50",
    description: "$50 de descuento en acceso VIP",
    discountPercent: null,
    discountAmount: 50,
    validUntil: new Date(Date.now() + 86400000 * 14).toISOString(),
    maxUses: 50,
    usesCount: 12,
  },
];

export const DEMO_CLUB_MEMBERS: ClubMemberItem[] = [
  {
    id: "mbr-1",
    userId: "demo-1",
    displayName: "Carmen & Roberto",
    role: "member",
    status: "active",
    joinedAt: new Date(Date.now() - 86400000 * 40).toISOString(),
  },
  {
    id: "mbr-2",
    userId: "demo-2",
    displayName: "Sofía",
    role: "member",
    status: "active",
    joinedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "mbr-3",
    userId: "demo-3",
    displayName: "Anabella & Julio",
    role: "vip",
    status: "active",
    joinedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

const LOCAL_EVENTS_KEY = (clubId: string) => `club_events_local:${clubId}`;
const LOCAL_DISCOUNTS_KEY = (clubId: string) =>
  `club_discounts_local:${clubId}`;
const QUERY_TIMEOUT_MS = 3000;

function loadLocal<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, items: T[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage no disponible: se pierde lo creado en demo.
  }
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

interface ClubQueryResult {
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
}

function mapEventRow(row: Record<string, unknown>): ClubEventItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    date: String(row.event_date ?? new Date().toISOString()),
    startTime: String(row.start_time ?? ""),
    endTime: String(row.end_time ?? ""),
    location: String(row.location ?? ""),
    capacity: Number(row.capacity ?? 0),
    registeredCount: Number(row.registered_count ?? 0),
    isVip: Boolean(row.is_vip),
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? "$"),
  };
}

function mapDiscountRow(row: Record<string, unknown>): ClubDiscountItem {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    description: String(row.description ?? ""),
    discountPercent:
      row.discount_percent === null || row.discount_percent === undefined
        ? null
        : Number(row.discount_percent),
    discountAmount:
      row.discount_amount === null || row.discount_amount === undefined
        ? null
        : Number(row.discount_amount),
    validUntil: row.valid_until ? String(row.valid_until) : null,
    maxUses:
      row.max_uses === null || row.max_uses === undefined
        ? null
        : Number(row.max_uses),
    usesCount: Number(row.uses_count ?? 0),
  };
}

function mapMemberRow(row: Record<string, unknown>): ClubMemberItem {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    displayName: String(row.display_name ?? row.user_id ?? "Miembro"),
    role: String(row.role ?? "member"),
    status: String(row.status ?? "active"),
    joinedAt: String(
      row.joined_at ?? row.created_at ?? new Date().toISOString(),
    ),
  };
}

export async function loadClubEvents(
  clubId: string,
): Promise<{ items: ClubEventItem[]; source: "supabase" | "demo" }> {
  const local = loadLocal<ClubEventItem>(LOCAL_EVENTS_KEY(clubId));
  if (supabase && !isDemoMode()) {
    try {
      const { data, error } = await withTimeout(
        (supabase as any)
          .from("club_events")
          .select("*")
          .eq("club_id", clubId)
          .eq("is_active", true)
          .order("event_date", { ascending: true }) as Promise<ClubQueryResult>,
        QUERY_TIMEOUT_MS,
      );
      if (error) throw error;
      if (data && data.length > 0) {
        return {
          items: [...local, ...data.map(mapEventRow)],
          source: "supabase",
        };
      }
    } catch (error) {
      logger.warn("clubContentService: eventos desde respaldo demo", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { items: [...local, ...DEMO_CLUB_EVENTS], source: "demo" };
}

export async function loadClubDiscounts(
  clubId: string,
): Promise<{ items: ClubDiscountItem[]; source: "supabase" | "demo" }> {
  const local = loadLocal<ClubDiscountItem>(LOCAL_DISCOUNTS_KEY(clubId));
  if (supabase && !isDemoMode()) {
    try {
      const { data, error } = await withTimeout(
        (supabase as any)
          .from("club_discounts")
          .select("*")
          .eq("club_id", clubId)
          .eq("is_active", true)
          .order("created_at", {
            ascending: false,
          }) as Promise<ClubQueryResult>,
        QUERY_TIMEOUT_MS,
      );
      if (error) throw error;
      if (data && data.length > 0) {
        return {
          items: [...local, ...data.map(mapDiscountRow)],
          source: "supabase",
        };
      }
    } catch (error) {
      logger.warn("clubContentService: descuentos desde respaldo demo", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { items: [...local, ...DEMO_CLUB_DISCOUNTS], source: "demo" };
}

export async function loadClubMembers(
  clubId: string,
): Promise<{ items: ClubMemberItem[]; source: "supabase" | "demo" }> {
  if (supabase && !isDemoMode()) {
    try {
      const { data, error } = await withTimeout(
        (supabase as any)
          .from("club_members")
          .select("id, club_id, user_id, role, status, joined_at, created_at")
          .eq("club_id", clubId)
          .order("joined_at", { ascending: false }) as Promise<ClubQueryResult>,
        QUERY_TIMEOUT_MS,
      );
      if (error) throw error;
      if (data && data.length > 0) {
        return { items: data.map(mapMemberRow), source: "supabase" };
      }
    } catch (error) {
      logger.warn("clubContentService: miembros desde respaldo demo", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { items: DEMO_CLUB_MEMBERS, source: "demo" };
}

export interface NewClubEventInput {
  clubId: string;
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  isVip?: boolean;
  price?: number;
}

export async function createClubEvent(
  input: NewClubEventInput,
): Promise<ClubEventItem> {
  const item: ClubEventItem = {
    id: `local-${Date.now()}`,
    title: input.title,
    description: input.description ?? "",
    date: input.eventDate,
    startTime: input.startTime ?? "",
    endTime: input.endTime ?? "",
    location: input.location ?? "",
    capacity: input.capacity ?? 0,
    registeredCount: 0,
    isVip: input.isVip ?? false,
    price: input.price ?? 0,
    currency: "$",
  };
  if (supabase && !isDemoMode()) {
    try {
      const { data, error } = await (supabase as any)
        .from("club_events")
        .insert({
          club_id: input.clubId,
          title: input.title,
          description: input.description ?? null,
          event_date: input.eventDate,
          start_time: input.startTime ?? null,
          end_time: input.endTime ?? null,
          location: input.location ?? null,
          capacity: input.capacity ?? null,
          is_vip: input.isVip ?? false,
          price: input.price ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      if (data) return mapEventRow(data as Record<string, unknown>);
    } catch (error) {
      logger.warn(
        "clubContentService: no se pudo crear el evento en BD, se guarda local",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
  const key = LOCAL_EVENTS_KEY(input.clubId);
  saveLocal(key, [item, ...loadLocal<ClubEventItem>(key)]);
  return item;
}

export interface NewClubDiscountInput {
  clubId: string;
  code: string;
  description?: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
  validUntil?: string | null;
  maxUses?: number | null;
}

export async function createClubDiscount(
  input: NewClubDiscountInput,
): Promise<ClubDiscountItem> {
  const item: ClubDiscountItem = {
    id: `local-${Date.now()}`,
    code: input.code,
    description: input.description ?? "",
    discountPercent: input.discountPercent ?? null,
    discountAmount: input.discountAmount ?? null,
    validUntil: input.validUntil ?? null,
    maxUses: input.maxUses ?? null,
    usesCount: 0,
  };
  if (supabase && !isDemoMode()) {
    try {
      const { data, error } = await (supabase as any)
        .from("club_discounts")
        .insert({
          club_id: input.clubId,
          code: input.code,
          description: input.description ?? null,
          discount_percent: input.discountPercent ?? null,
          discount_amount: input.discountAmount ?? null,
          valid_until: input.validUntil ?? null,
          max_uses: input.maxUses ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      if (data) return mapDiscountRow(data as Record<string, unknown>);
    } catch (error) {
      logger.warn(
        "clubContentService: no se pudo crear el descuento en BD, se guarda local",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
  const key = LOCAL_DISCOUNTS_KEY(input.clubId);
  saveLocal(key, [item, ...loadLocal<ClubDiscountItem>(key)]);
  return item;
}
