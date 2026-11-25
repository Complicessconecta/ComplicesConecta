/**
 * Billetera demo canónica — ÚNICA fuente de verdad (ronda 6, puntos 11 y 12).
 *
 * Antes cada superficie tenía sus propios números: `useTokens` decía
 * single 1250/850 y pareja 2000/1500, `TokenDashboard` tenía un MOCK
 * estático 5000/2500 con 2000 en staking (hero "7000 CMPX"), `DemoWallet`
 * duplicaba los balances en su propio `DEMO_BALANCES` y los perfiles
 * hardcodeaban "1250"/"850"/"2000"/"1500" como strings sueltos. El test
 * de verificación de la ronda 5 vio justo eso: perfil 5000 CMPX, hero
 * de /tokens 7000 CMPX y, tras reclamar 100 CMPX, 1755 (1350 + 405).
 *
 * Semántica (la que arregla el 1755): el saldo canónico ES el total
 * poseído. El staking es una PARTE de ese total, no un extra: por eso
 * `TokenDashboard` sumaba disponible + staking y el total se inflaba
 * (1250 + 375 = 1625; tras reclamar 100: 1350 + 405 = 1755). Ahora el
 * total es el saldo y "disponibles" es total − staking.
 */

export type DemoAccountType = "single" | "couple";

/**
 * Balances demo canónicos por tipo de cuenta. Single Sofía (28 años):
 * CMPX 1250 / GTK 850 / 4 NFTs. Pareja Carmen & Roberto (25/28 años):
 * CMPX 2000 / GTK 1500 / 2 NFTs. PIN demo 1234.
 */
export const DEMO_WALLET_BALANCES: Record<
  DemoAccountType,
  { cmpx: number; gtk: number; nfts: number }
> = {
  single: { cmpx: 1250, gtk: 850, nfts: 4 },
  couple: { cmpx: 2000, gtk: 1500, nfts: 2 },
} as const;

/**
 * Persistencia del saldo demo (ronda 7, punto 8): reclamar 100 CMPX en
 * /tokens lo subía solo en el estado local del hook useTokens (1250 →
 * 1350) y el perfil seguía leyendo la constante 1250, así que el
 * reclamo se perdía al navegar y al recargar. El saldo canónico vive
 * ahora en localStorage (`demo_wallet_balances`), sembrado con las
 * constantes de arriba; reclamar escribe aquí y todos los lectores
 * (perfil, TokenDashboard, DemoWallet, useTokens) leen lo mismo.
 */
export const DEMO_WALLET_STORAGE_KEY = "demo_wallet_balances";

/** Evento que se dispara cuando el saldo demo cambia (reclamo). Los
 * lectores con estado propio (useTokens, DemoWallet, perfiles) lo
 * escuchan para re-renderizar con el saldo ya persistido. */
export const DEMO_WALLET_CHANGED_EVENT = "demo-wallet-changed";

export function notifyDemoWalletChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DEMO_WALLET_CHANGED_EVENT));
}

function readPersistedDemoWalletBalances(): Record<
  DemoAccountType,
  { cmpx: number; gtk: number }
> {
  const fallback = {
    single: {
      cmpx: DEMO_WALLET_BALANCES.single.cmpx,
      gtk: DEMO_WALLET_BALANCES.single.gtk,
    },
    couple: {
      cmpx: DEMO_WALLET_BALANCES.couple.cmpx,
      gtk: DEMO_WALLET_BALANCES.couple.gtk,
    },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(DEMO_WALLET_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    const next = { ...fallback };
    for (const key of ["single", "couple"] as const) {
      const entry = (parsed as Record<string, unknown>)[key];
      if (entry && typeof entry === "object") {
        const cmpx = (entry as Record<string, unknown>).cmpx;
        const gtk = (entry as Record<string, unknown>).gtk;
        next[key] = {
          cmpx:
            typeof cmpx === "number" && Number.isFinite(cmpx) && cmpx >= 0
              ? cmpx
              : fallback[key].cmpx,
          gtk:
            typeof gtk === "number" && Number.isFinite(gtk) && gtk >= 0
              ? gtk
              : fallback[key].gtk,
        };
      }
    }
    return next;
  } catch {
    return fallback;
  }
}

/**
 * Acredita tokens al saldo demo persistido y avisa con el evento. Es
 * lo que debe llamar todo reclamo demo (World ID +100 CMPX,
 * recompensas) en vez de tocar solo el estado local del hook: si no,
 * el perfil y /tokens vuelven a discrepar al navegar o recargar.
 */
export function creditDemoWallet(
  accountType: DemoAccountType,
  delta: { cmpx?: number; gtk?: number },
): { cmpx: number; gtk: number; nfts: number } {
  const persisted = readPersistedDemoWalletBalances();
  const next = {
    cmpx: Math.max(0, persisted[accountType].cmpx + (delta.cmpx ?? 0)),
    gtk: Math.max(0, persisted[accountType].gtk + (delta.gtk ?? 0)),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DEMO_WALLET_STORAGE_KEY,
        JSON.stringify({ ...persisted, [accountType]: next }),
      );
    } catch {
      // Sin almacenamiento: el reclamo solo vive en esta sesión.
    }
  }
  notifyDemoWalletChanged();
  return { ...next, nfts: DEMO_WALLET_BALANCES[accountType].nfts };
}

/** Normaliza cualquier valor a un tipo de cuenta demo válido (single por defecto). */
export function getDemoWalletBalance(
  accountType: DemoAccountType | string | null | undefined,
): { cmpx: number; gtk: number; nfts: number } {
  const type: DemoAccountType = accountType === "couple" ? "couple" : "single";
  const persisted = readPersistedDemoWalletBalances()[type];
  return {
    cmpx: persisted.cmpx,
    gtk: persisted.gtk,
    nfts: DEMO_WALLET_BALANCES[type].nfts,
  };
}

export interface DemoWalletView {
  /** Total poseído de CMPX (el saldo; el staking es parte de él). */
  cmpxBalance: number;
  /** CMPX en staking (30% del total, simulación demo). */
  cmpxStaked: number;
  /** CMPX disponibles = total − staking. */
  cmpxAvailable: number;
  /** Total poseído de GTK. */
  gtkBalance: number;
  /** GTK en staking (20% del total, simulación demo). */
  gtkStaked: number;
  /** GTK disponibles = total − staking. */
  gtkAvailable: number;
  /** Ganados este mes (5% del total CMPX, simulación demo). */
  monthlyEarned: number;
  /** Límite mensual Beta. */
  monthlyLimit: number;
  /** Restantes del mes = límite − ganados. */
  monthlyRemaining: number;
}

/**
 * Deriva la vista de billetera desde un total: staking y límite mensual
 * son fracciones del total, nunca sumandos. Reclamar X CMPX suma X al
 * total y el resto de la vista se recalcula solo.
 */
export function deriveDemoWalletView(
  cmpx: number,
  gtk: number,
): DemoWalletView {
  const cmpxStaked = Math.round(cmpx * 0.3);
  const gtkStaked = Math.round(gtk * 0.2);
  const monthlyEarned = cmpx * 0.05;
  return {
    cmpxBalance: cmpx,
    cmpxStaked,
    cmpxAvailable: cmpx - cmpxStaked,
    gtkBalance: gtk,
    gtkStaked,
    gtkAvailable: gtk - gtkStaked,
    monthlyEarned,
    monthlyLimit: 1000,
    monthlyRemaining: 1000 - monthlyEarned,
  };
}
