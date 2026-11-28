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
 * ahora en localStorage, sembrado con las constantes de arriba; reclamar
 * escribe aquí y todos los lectores (perfil, TokenDashboard, DemoWallet,
 * useTokens) leen lo mismo.
 *
 * Ronda 8, punto 8: la clave NO puede empezar por `demo_`: al cerrar
 * sesión `clearDemoAuth` (app-config) y `StorageManager.clearDemoSession`
 * barren por prefijo `demo_` y borraban el saldo reclamado, así que tras
 * logout/login el saldo volvía a la semilla (1250). La clave nueva usa
 * el prefijo `cc_` — mismo precedente que `cc_local_demo_accounts_v1`
 * (demo-registration), que sobrevive al logout a propósito. La clave
 * vieja se sigue leyendo una vez y se migra (no se pierde el saldo de
 * quien ya reclamó). Esto es solo el SALDO demo: los NFTs demo
 * (`demo_nfts:<uid>`) siguen borrándose al cerrar sesión, como promete
 * /demo.
 */
export const DEMO_WALLET_STORAGE_KEY = "cc_demo_wallet_balances_v1";
export const LEGACY_DEMO_WALLET_STORAGE_KEY = "demo_wallet_balances";

/**
 * Ronda 24, stream C — tiendas demo de los tokens de bienvenida.
 *
 * Las tres usan el prefijo `cc_` (NO `demo_`) por la misma razón que
 * el saldo: el barrido de logout borra por prefijo `demo_` y el
 * crédito de bienvenida, la recompensa de referido y el desbloqueo
 * de galería deben SOBREVIVIR al logout — si no, el flag de "ya
 * reclamado" se borraría y el crédito se volvería a acreditar en el
 * siguiente login (o el desbloqueo de 24 h se perdería).
 *
 * Son claves separadas del saldo (no se meten dentro del JSON de
 * `cc_demo_wallet_balances_v1`) porque `creditDemoWallet` reescribe
 * ese JSON solo con `{single, couple}` y borraría cualquier clave
 * extra que se colara ahí.
 */
export const DEMO_WELCOME_CLAIMED_KEY = "cc_demo_welcome_claimed_v1";
export const DEMO_REFERRAL_REWARDS_KEY = "cc_demo_referral_rewards_v1";
export const DEMO_GALLERY_UNLOCKS_KEY = "cc_demo_gallery_unlocks_v1";

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
    // Clave nueva primero; si no existe, migrar la vieja (`demo_...`)
    // una vez: se lee, se reescribe en la clave nueva y se borra la
    // vieja para que el barrido de logout no la vuelva a borrar.
    let raw = window.localStorage.getItem(DEMO_WALLET_STORAGE_KEY);
    if (!raw) {
      const legacy = window.localStorage.getItem(
        LEGACY_DEMO_WALLET_STORAGE_KEY,
      );
      if (legacy) {
        raw = legacy;
        try {
          window.localStorage.setItem(DEMO_WALLET_STORAGE_KEY, legacy);
          window.localStorage.removeItem(LEGACY_DEMO_WALLET_STORAGE_KEY);
        } catch {
          // Sin escritura: se sigue leyendo la vieja en esta sesión.
        }
      }
    }
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

/**
 * Ronda 24, stream C — debita CMPX del saldo demo persistido.
 * Devuelve el saldo resultante o `null` si no alcanza (sin tocar el
 * saldo). Es el gasto demo que usan el envío de regalos, la creación
 * de chat privado y el desbloqueo de galería privada.
 */
export function debitDemoWallet(
  accountType: DemoAccountType,
  cmpxAmount: number,
): { cmpx: number; gtk: number; nfts: number } | null {
  const persisted = readPersistedDemoWalletBalances();
  const current = persisted[accountType].cmpx;
  if (!Number.isFinite(cmpxAmount) || cmpxAmount < 0 || current < cmpxAmount) {
    return null;
  }
  const next = {
    cmpx: current - cmpxAmount,
    gtk: persisted[accountType].gtk,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        DEMO_WALLET_STORAGE_KEY,
        JSON.stringify({ ...persisted, [accountType]: next }),
      );
    } catch {
      // Sin almacenamiento: el débito solo vive en esta sesión.
    }
  }
  notifyDemoWalletChanged();
  return { ...next, nfts: DEMO_WALLET_BALANCES[accountType].nfts };
}

function readDemoFlagMap(
  key: string,
): Record<string, string | boolean | number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, string | boolean | number>;
  } catch {
    return {};
  }
}

function writeDemoFlagMap(
  key: string,
  map: Record<string, string | boolean | number | string[]>,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // Sin almacenamiento: el flag solo vive en esta sesión.
  }
}

/**
 * Ronda 24, stream C — ¿ya se reclamó el crédito de bienvenida de
 * este tipo de cuenta demo? El saldo demo es COMPARTIDO por tipo de
 * cuenta (todas las single comparten 1250), así que el flag también
 * es por tipo: la primera single que entra se lleva los 50 CMPX y
 * las siguientes ya no (limitación demo, no del diseño real — en
 * producción el flag es por usuario en `token_transactions`).
 */
export function isDemoWelcomeCreditClaimed(
  accountType: DemoAccountType,
): boolean {
  return readDemoFlagMap(DEMO_WELCOME_CLAIMED_KEY)[accountType] === true;
}

export function markDemoWelcomeCreditClaimed(
  accountType: DemoAccountType,
): void {
  writeDemoFlagMap(DEMO_WELCOME_CLAIMED_KEY, {
    ...readDemoFlagMap(DEMO_WELCOME_CLAIMED_KEY),
    [accountType]: true,
  });
}

/**
 * Ronda 24, stream C — recompensas de referido demo ya pagadas
 * (`"<inviterId>:<inviteeId>"`). Anti-farm demo: el mismo par no
 * cobra dos veces.
 */
export function hasDemoReferralReward(
  inviterId: string,
  inviteeId: string,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DEMO_REFERRAL_REWARDS_KEY);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    return (
      Array.isArray(parsed) && parsed.includes(`${inviterId}:${inviteeId}`)
    );
  } catch {
    return false;
  }
}

export function markDemoReferralReward(
  inviterId: string,
  inviteeId: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(DEMO_REFERRAL_REWARDS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const list: string[] = Array.isArray(parsed)
      ? (parsed as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const key = `${inviterId}:${inviteeId}`;
    if (!list.includes(key)) list.push(key);
    window.localStorage.setItem(
      DEMO_REFERRAL_REWARDS_KEY,
      JSON.stringify(list),
    );
  } catch {
    // Sin almacenamiento: el flag solo vive en esta sesión.
  }
}

/**
 * Ronda 24, stream C — desbloqueos de galería privada demo:
 * `"<userId>:<profileId>"` → ISO de creación. La ventana de 24 h se
 * calcula en `WelcomeTokensService.isGalleryUnlockValid` a partir de
 * este timestamp (la tabla real `gallery_unlocks` tampoco tiene
 * columna `expires_at`: la expiración se deriva de `created_at`).
 */
export function getDemoGalleryUnlockCreatedAt(
  userId: string,
  profileId: string,
): string | null {
  const value = readDemoFlagMap(DEMO_GALLERY_UNLOCKS_KEY)[
    `${userId}:${profileId}`
  ];
  return typeof value === "string" ? value : null;
}

export function recordDemoGalleryUnlock(
  userId: string,
  profileId: string,
  createdAtIso: string = new Date().toISOString(),
): void {
  writeDemoFlagMap(DEMO_GALLERY_UNLOCKS_KEY, {
    ...readDemoFlagMap(DEMO_GALLERY_UNLOCKS_KEY),
    [`${userId}:${profileId}`]: createdAtIso,
  });
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
