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

/**
 * Ronda 25 — evento del crédito de bienvenida demo. Se dispara SOLO
 * cuando `ensureDemoWelcomeCredit` acredita de verdad
 * (`credited === true`): re-entrar no muestra nada (idempotente por
 * el flag `cc_demo_welcome_claimed_v1`). MainLayout lo escucha y
 * muestra el toast "🎁 +50 CMPX de bienvenida" con el saldo. Es un
 * evento distinto de `DEMO_WALLET_CHANGED_EVENT` a propósito: ese lo
 * escuchan los lectores de saldo para re-renderizar (cualquier
 * reclamo/gasto), y este solo marca "bienvenida acreditada ahora"
 * para el toast.
 */
export const DEMO_WELCOME_CREDIT_EVENT = "demo-welcome-credit-credited";

export interface DemoWelcomeCreditEventDetail {
  accountType: DemoAccountType;
  /** CMPX acreditados (siempre WELCOME_CREDIT_CMPX = 50). */
  amount: number;
  /** Saldo CMPX resultante (null si no se pudo leer). */
  balance: number | null;
}

/** Ronda 26 — último crédito de bienvenida notificado y aún no
 * mostrado por MainLayout (ver `notifyDemoWelcomeCredit`). */
let pendingDemoWelcomeCredit: DemoWelcomeCreditEventDetail | null = null;

export function notifyDemoWelcomeCredit(
  detail: DemoWelcomeCreditEventDetail,
): void {
  if (typeof window === "undefined") return;
  // Ronda 26: el detalle queda guardado ANTES de disparar el evento.
  // MainLayout monta su listener DESPUÉS del efecto init de useAuth
  // (mismo componente, los efectos del hook se registran primero):
  // en un arranque en frío con restauración de sesión el evento
  // podía dispararse antes de que el listener existiera y perderse
  // del todo (el toast de +50 CMPX no aparecía nunca). Al montar,
  // MainLayout toma el pendiente de aquí (`takePendingDemoWelcomeCredit`)
  // y el toast se muestra igual; el listener lo consume al recibir el
  // evento, así que un remontaje no lo repite. Solo vive en memoria
  // (no en localStorage): un reload recarga el módulo vacío y el
  // crédito ya reclamado no vuelve a disparar el evento de todos
  // modos (idempotente por el flag `cc_demo_welcome_claimed_v1`).
  pendingDemoWelcomeCredit = detail;
  // Ronda 27: además de la marca en memoria, queda la marca
  // persistente "toast aún no mostrado" (ver abajo). Se escribe
  // aquí porque este es el único punto por el que pasa un crédito
  // real: solo cuando `credited === true` (WelcomeTokensService
  // solo llama aquí en ese caso), nunca en reentrada (crédito ya
  // reclamado) ni para anonymous (sin billetera hasta verificar).
  writePendingWelcomeToast(detail);
  // Ronda 28, bloque B: diagnóstico del pipeline del toast.
  // `console.info` directo (no el `logger` del repo): ese logger
  // solo imprime en DEV (src/lib/logger/logger.ts:39) y estos
  // diagnósticos tienen que verse en la consola del preview, donde
  // el toast lleva 3 rondas perdiéndose en vivo. Un log por
  // crédito, sin PII (solo tipo de cuenta, cantidad y saldo — lo
  // mismo que muestra el propio toast).
  console.info(
    "[toast-diag] notify credit",
    detail.accountType,
    detail.amount,
    detail.balance,
  );
  window.dispatchEvent(new CustomEvent(DEMO_WELCOME_CREDIT_EVENT, { detail }));
}

/**
 * Ronda 27 — marca persistente "crédito reclamado, toast aún no
 * mostrado" (segunda oportunidad del toast +50 CMPX).
 *
 * El hueco en memoria de la ronda 26 se consume al tomarlo: si el
 * timer del primer intento se pierde (remontaje de MainLayout que
 * limpia los timers, o cualquier carrera en la capa de toasts en el
 * primer inicio, el momento más cargado: modal de bienvenida,
 * chunks, carga de perfil, transiciones de auth), no queda
 * constancia de que el toast nunca se mostró — el crédito ya está
 * reclamado (idempotente por `cc_demo_welcome_claimed_v1`) y el
 * evento no vuelve a dispararse. Por eso el toast se perdía en el
 * primer inicio de Single (test dirigido del PR #88: toast de demo
 * sí, +50 CMPX no en 10 s, saldo correcto 1,300) aunque el
 * mecanismo funcionaba (la Pareja sí lo mostró en vivo).
 *
 * Esta marca vive en localStorage con prefijo `cc_` (NO `demo_`:
 * el barrido de logout borra por prefijo `demo_` y la marca debe
 * sobrevivir al logout, igual que el flag de reclamado) y la
 * consume quien MUESTRA el toast. Así la marca es el token de
 * entrega exactamente-una-vez: el primer timer que dispara la
 * toma y muestra; cualquier otro timer posterior la encuentra
 * vacía y no repite. El primer intento (diferido 4 s, ronda 26)
 * la consume al mostrar; la segunda oportunidad (MainLayout, al
 * cambiar de ruta o al montar) solo programa su timer si la marca
 * sigue ahí, y al disparar la toma: si ya no está, no muestra.
 *
 * Frescura: la marca lleva `claimedAt` y solo vale 60 s. Un reload
 * dentro de la ventana es otra segunda oportunidad (el toast se
 * muestra al montar); pasado ese tiempo se borra en silencio sin
 * mostrar nada — un crédito viejo nunca reaparece como toast en
 * una visita posterior.
 */
export const DEMO_WELCOME_TOAST_PENDING_KEY =
  "cc_demo_welcome_toast_pending_v1";

/** Ventana en la que la marca sigue siendo un crédito "recién reclamado". */
export const DEMO_WELCOME_TOAST_FRESHNESS_MS = 60_000;

export interface DemoWelcomeToastPending extends DemoWelcomeCreditEventDetail {
  /** Date.now() en el momento del crédito. */
  claimedAt: number;
}

function writePendingWelcomeToast(detail: DemoWelcomeCreditEventDetail): void {
  if (typeof window === "undefined") return;
  try {
    const pending: DemoWelcomeToastPending = {
      ...detail,
      claimedAt: Date.now(),
    };
    window.localStorage.setItem(
      DEMO_WELCOME_TOAST_PENDING_KEY,
      JSON.stringify(pending),
    );
  } catch {
    // localStorage no disponible (modo privado, etc.): el primer
    // intento en memoria sigue funcionando; solo se pierde la
    // segunda oportunidad persistente.
  }
}

export function clearPendingWelcomeToast(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_WELCOME_TOAST_PENDING_KEY);
  } catch {
    // Sin localStorage no hay nada que borrar.
  }
}

function readRawPendingWelcomeToast(): string | null {
  try {
    return window.localStorage.getItem(DEMO_WELCOME_TOAST_PENDING_KEY);
  } catch {
    return null;
  }
}

/**
 * Lee la marca SIN consumirla. Devuelve null si no hay marca, está
 * corrupta o caducó (la caduca se borra en silencio, nunca se muestra).
 */
export function peekPendingWelcomeToast(): DemoWelcomeToastPending | null {
  if (typeof window === "undefined") return null;
  const raw = readRawPendingWelcomeToast();
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearPendingWelcomeToast();
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    clearPendingWelcomeToast();
    return null;
  }
  const p = parsed as Partial<DemoWelcomeToastPending>;
  if (
    (p.accountType !== "single" && p.accountType !== "couple") ||
    typeof p.amount !== "number" ||
    (typeof p.balance !== "number" && p.balance !== null) ||
    typeof p.claimedAt !== "number"
  ) {
    clearPendingWelcomeToast();
    return null;
  }
  // Caducada (o con fecha futura, reloj movido): se borra sin mostrar.
  if (
    p.claimedAt > Date.now() ||
    Date.now() - p.claimedAt > DEMO_WELCOME_TOAST_FRESHNESS_MS
  ) {
    clearPendingWelcomeToast();
    return null;
  }
  return p as DemoWelcomeToastPending;
}

/**
 * Toma (y vacía) la marca persistente. Devuelve null si no hay
 * marca fresca. La usa quien muestra el toast, para que un segundo
 * timer no lo repita.
 */
export function takePendingWelcomeToast(): DemoWelcomeToastPending | null {
  const pending = peekPendingWelcomeToast();
  if (pending) clearPendingWelcomeToast();
  return pending;
}

/**
 * Toma (y vacía) el crédito de bienvenida pendiente de mostrar.
 * Lo usa MainLayout al montar (evento disparado antes que su
 * listener) y su listener al recibir el evento (para que un
 * remontaje no lo repita). Devuelve `null` si no hay nada pendiente.
 */
export function takePendingDemoWelcomeCredit(): DemoWelcomeCreditEventDetail | null {
  const pending = pendingDemoWelcomeCredit;
  pendingDemoWelcomeCredit = null;
  return pending;
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
