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

/** Normaliza cualquier valor a un tipo de cuenta demo válido (single por defecto). */
export function getDemoWalletBalance(
  accountType: DemoAccountType | string | null | undefined,
): { cmpx: number; gtk: number; nfts: number } {
  return DEMO_WALLET_BALANCES[accountType === "couple" ? "couple" : "single"];
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
