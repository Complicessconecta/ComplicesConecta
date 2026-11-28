/**
 * WelcomeTokensService — tokens CMPX de bienvenida usables (ronda 24,
 * stream C).
 *
 * Capa de servicio, NO UI: el crédito vive aquí, nunca en los
 * formularios de registro (el cableado a `useAuth.signIn` / registro
 * lo aplica el coordinador en la integración; ver los puntos de
 * inserción al final del archivo).
 *
 * Reglas que NO se negocian:
 * - CMPX INTERNO (off-chain, saldo en base de datos). El token
 *   blockchain queda en "próximamente" por diseño; nada de aquí toca
 *   Web3 ni contratos.
 * - Perfiles anónimos: SIN cartera y SIN tokens. Todas las funciones
 *   se bloquean con `isAnonymous === true` y devuelven
 *   `ANONYMOUS_WALLET_BLOCKED_REASON`.
 * - Idempotencia: el crédito de bienvenida se acredita UNA SOLA VEZ
 *   por cuenta; el referido, una sola vez por par invitador/invitado.
 *
 * Auditoría de precios de la ronda (ver reporte del stream):
 * - Bienvenida 50 CMPX: ya existía como constante de display
 *   (`TOKEN_CONFIG.WELCOME_BONUS = 50` en TokenBalance.tsx y
 *   TokensInfo.tsx) pero NUNCA se acreditaba. Se implementa 50.
 * - Referido 50 CMPX: `TOKEN_CONFIG.REFERRAL_REWARD = 50`; pero
 *   `ReferralTokensService.processReferral` paga 100 CMPX al
 *   registrarse, SIN gate de verificación y en el saldo separado
 *   `user_referral_balances`. Este servicio paga 50 CON gate de
 *   verificación (World ID/KYC) y sobre `user_token_balances`; el
 *   100 de `processReferral` NO se toca (divergencia preexistente,
 *   la decide Wacko).
 * - Regalo 10 CMPX: precio nuevo aplicado. Los regalos del catálogo
 *   mock (`mockVirtualGifts`: 50/200/100) son precios de display y
 *   NUNCA se cobraron (no existe ruta de envío); se conservan como
 *   display y el cobro aplicado es la tarifa plana de 10 CMPX por
 *   envío de la ronda.
 * - Chat privado 25 CMPX: precio nuevo de CREACIÓN. Se conserva el
 *   `tokenCost = 1` por defecto de `ChatRoomService.createPrivateRoom`
 *   (costo de ACCESO por sala, distinto concepto, lo fija el creador).
 * - Galería privada: `GalleryPrivacyService.CMPX_COST = 100` se
 *   CONSERVA (regla de la ronda: no sobrescribir precios del código)
 *   frente al objetivo de 20; la diferencia queda reportada. Además
 *   el desbloqueo era GRATIS (se comprobaba el saldo pero nunca se
 *   debitaba) y PERMANENTE; ahora se debita y dura 24 h.
 */

import { supabase } from "@/integrations/supabase/client";
import { ANONYMOUS_WALLET_BLOCKED_REASON } from "@/lib/anonymous";
import {
  creditDemoWallet,
  debitDemoWallet,
  getDemoWalletBalance,
  hasDemoReferralReward,
  isDemoWelcomeCreditClaimed,
  markDemoReferralReward,
  markDemoWelcomeCreditClaimed,
  type DemoAccountType,
} from "@/lib/demo-wallet";
import { logger } from "@/lib/logger";
import { tokenService } from "@/services/payments/TokenService";

/** Crédito de bienvenida: 50 CMPX, una sola vez por cuenta. */
export const WELCOME_CREDIT_CMPX = 50;
/** Recompensa al invitador cuando el invitado verifica: 50 CMPX. */
export const REFERRAL_REWARD_CMPX = 50;
/** Tarifa plana por enviar un regalo: 10 CMPX. */
export const GIFT_SEND_COST_CMPX = 10;
/** Costo de CREAR un chat privado (sala privada): 25 CMPX. */
export const PRIVATE_CHAT_CREATE_COST_CMPX = 25;
/** Ventana de un desbloqueo de galería privada: 24 h. */
export const GALLERY_UNLOCK_VALIDITY_MS = 24 * 60 * 60 * 1000;
/** Ruta de la cartera / compra de tokens (opción "comprar más"). */
export const TOP_UP_ROUTE = "/tokens";
/** Descripción que marca el crédito de bienvenida en token_transactions. */
export const WELCOME_CREDIT_DESCRIPTION = "Bono de bienvenida CMPX";

export function insufficientBalanceMessage(
  requiredCmpx: number,
  balanceCmpx: number | null,
): string {
  const balance = balanceCmpx === null ? "desconocido" : `${balanceCmpx} CMPX`;
  return (
    `Saldo insuficiente de CMPX: necesitas ${requiredCmpx} CMPX y tienes ` +
    `${balance}. Recarga en la cartera para seguir.`
  );
}

export interface WelcomeCreditResult {
  /** true solo cuando esta llamada acreditó los 50 CMPX. */
  credited: boolean;
  /** true cuando el crédito ya estaba reclamado antes. */
  alreadyClaimed: boolean;
  /** Saldo CMPX resultante (null si no se pudo leer). */
  balance: number | null;
  error?: string;
}

export type ReferralRewardReason =
  | "credited"
  | "not_verified"
  | "already_rewarded"
  | "anonymous_blocked"
  | "error";

export interface ReferralRewardResult {
  credited: boolean;
  reason: ReferralRewardReason;
  error?: string;
}

export interface SpendResult {
  success: boolean;
  /** Saldo CMPX resultante (null si no se pudo leer). */
  newBalance: number | null;
  error?: string;
  /** true cuando el fallo es por saldo insuficiente. */
  needsTopUp: boolean;
  /** Ruta a la que lleva el botón "comprar más". */
  topUpRoute: string;
}

function spendResult(
  success: boolean,
  newBalance: number | null,
  error?: string,
): SpendResult {
  return {
    success,
    newBalance,
    ...(error ? { error } : {}),
    needsTopUp: !success && error !== ANONYMOUS_WALLET_BLOCKED_REASON,
    topUpRoute: TOP_UP_ROUTE,
  };
}

/**
 * ¿Sigue válido un desbloqueo de galería creado en `createdAtIso`?
 * La tabla `gallery_unlocks` no tiene columna `expires_at` (tampoco
 * hay migración autorizada en la ronda), así que la expiración se
 * deriva de `created_at` + 24 h.
 */
export function isGalleryUnlockValid(
  createdAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!createdAtIso) return false;
  const createdMs = Date.parse(createdAtIso);
  if (!Number.isFinite(createdMs)) return false;
  return nowMs - createdMs < GALLERY_UNLOCK_VALIDITY_MS;
}

/** ISO de expiración de un desbloqueo creado en `createdAtIso`. */
export function galleryUnlockExpiresAt(createdAtIso: string): string {
  const createdMs = Date.parse(createdAtIso);
  if (!Number.isFinite(createdMs)) return createdAtIso;
  return new Date(createdMs + GALLERY_UNLOCK_VALIDITY_MS).toISOString();
}

export class WelcomeTokensService {
  private static instance: WelcomeTokensService;

  private constructor() {}

  public static getInstance(): WelcomeTokensService {
    if (!WelcomeTokensService.instance) {
      WelcomeTokensService.instance = new WelcomeTokensService();
    }
    return WelcomeTokensService.instance;
  }

  /**
   * Crédito de bienvenida: 50 CMPX al primer ingreso/registro, UNA
   * SOLA VEZ por cuenta (idempotente).
   *
   * - Demo: flag `cc_demo_welcome_claimed_v1` por tipo de cuenta
   *   (el saldo demo es compartido por tipo) + saldo en
   *   `cc_demo_wallet_balances_v1`.
   * - Real: se busca una transacción previa de bienvenida en
   *   `token_transactions` (no hay columna `welcome_credit_claimed`
   *   en `user_token_balances` y no hay migración autorizada) y se
   *   acredita con `TokenService` sobre `user_token_balances`.
   *
   * El cableado (llamarla tras el primer ingreso/registro) NO está
   * aquí: ver puntos de inserción al final del archivo.
   */
  async claimWelcomeCredit(options: {
    userId: string;
    accountType: DemoAccountType;
    isAnonymous: boolean;
    isDemo: boolean;
  }): Promise<WelcomeCreditResult> {
    const { userId, accountType, isAnonymous, isDemo } = options;

    if (isAnonymous) {
      logger.info(ANONYMOUS_WALLET_BLOCKED_REASON, { userId });
      return {
        credited: false,
        alreadyClaimed: false,
        balance: null,
        error: ANONYMOUS_WALLET_BLOCKED_REASON,
      };
    }

    if (isDemo) {
      if (isDemoWelcomeCreditClaimed(accountType)) {
        return {
          credited: false,
          alreadyClaimed: true,
          balance: getDemoWalletBalance(accountType).cmpx,
        };
      }
      const next = creditDemoWallet(accountType, {
        cmpx: WELCOME_CREDIT_CMPX,
      });
      markDemoWelcomeCreditClaimed(accountType);
      logger.info("Crédito de bienvenida demo acreditado", {
        accountType,
        amount: WELCOME_CREDIT_CMPX,
      });
      return { credited: true, alreadyClaimed: false, balance: next.cmpx };
    }

    try {
      if (!supabase) {
        logger.error("Supabase no está disponible");
        return {
          credited: false,
          alreadyClaimed: false,
          balance: null,
          error: "Supabase no está disponible",
        };
      }

      // Idempotencia real: ¿ya existe un crédito de bienvenida?
      const { data: previous, error: lookupError } = await supabase
        .from("token_transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("description", WELCOME_CREDIT_DESCRIPTION)
        .maybeSingle();

      if (lookupError) {
        logger.error("Error buscando crédito de bienvenida previo", {
          error: lookupError,
        });
        return {
          credited: false,
          alreadyClaimed: false,
          balance: null,
          error: "Error al verificar el crédito de bienvenida",
        };
      }

      const balance = await tokenService.getBalance(userId);
      if (previous) {
        return {
          credited: false,
          alreadyClaimed: true,
          balance: balance?.cmpx ?? null,
        };
      }

      const credited = await tokenService.addTokens(
        userId,
        "cmpx",
        WELCOME_CREDIT_CMPX,
        WELCOME_CREDIT_DESCRIPTION,
        { reason: "welcome_bonus" },
      );
      if (!credited) {
        return {
          credited: false,
          alreadyClaimed: false,
          balance: balance?.cmpx ?? null,
          error: "No se pudo acreditar el bono de bienvenida",
        };
      }

      const next = await tokenService.getBalance(userId);
      logger.info("Crédito de bienvenida acreditado", {
        userId: userId.substring(0, 8) + "***",
        amount: WELCOME_CREDIT_CMPX,
      });
      return {
        credited: true,
        alreadyClaimed: false,
        balance: next?.cmpx ?? null,
      };
    } catch (error) {
      logger.error("Error acreditando crédito de bienvenida", { error });
      return {
        credited: false,
        alreadyClaimed: false,
        balance: null,
        error: "Error al acreditar el bono de bienvenida",
      };
    }
  }

  /**
   * Recompensa de referido: 50 CMPX al invitador cuando el invitado
   * completa registro Y verificación (World ID/KYC). Anti-farm:
   * sin verificación NO se paga, y el mismo par no cobra dos veces.
   *
   * NO llamar en la ruta de World ID: la edge function
   * `worldid-verify` ya paga la recompensa de referido en el
   * servidor (RPC `process_worldid_verification_reward`); llamarla
   * ahí duplicaría el pago. Esta función es para la ruta KYC/demo y
   * para cualquier verificación que no pase por esa edge function.
   *
   * El invitado recibe sus 50 CMPX por la vía del crédito de
   * bienvenida (`claimWelcomeCredit`, idempotente), no aquí.
   */
  async creditReferralReward(options: {
    inviterId: string;
    inviteeId: string;
    /**
     * Verificación del invitado. Si no se pasa, en real se lee
     * `user_token_balances.world_id_verified`; en demo sin flag
     * explícito se considera NO verificado (fail-closed anti-farm).
     */
    isInviteeVerified?: boolean | (() => Promise<boolean>);
    isAnonymous?: boolean;
    isDemo?: boolean;
    /** Tipo de cuenta demo del invitador (solo demo). */
    inviterAccountType?: DemoAccountType;
  }): Promise<ReferralRewardResult> {
    const {
      inviterId,
      inviteeId,
      isInviteeVerified,
      isAnonymous = false,
      isDemo = false,
      inviterAccountType = "single",
    } = options;

    if (isAnonymous) {
      logger.info(ANONYMOUS_WALLET_BLOCKED_REASON, { inviterId });
      return {
        credited: false,
        reason: "anonymous_blocked",
        error: ANONYMOUS_WALLET_BLOCKED_REASON,
      };
    }

    const verified = await this.resolveInviteeVerified(
      inviteeId,
      isInviteeVerified,
      isDemo,
    );
    if (verified === null) {
      return {
        credited: false,
        reason: "error",
        error: "No se pudo verificar al invitado",
      };
    }
    if (!verified) {
      logger.info("Referido sin pagar: invitado sin verificar", {
        inviteeId: inviteeId.substring(0, 8) + "***",
      });
      return { credited: false, reason: "not_verified" };
    }

    if (isDemo) {
      if (hasDemoReferralReward(inviterId, inviteeId)) {
        return { credited: false, reason: "already_rewarded" };
      }
      creditDemoWallet(inviterAccountType, { cmpx: REFERRAL_REWARD_CMPX });
      markDemoReferralReward(inviterId, inviteeId);
      logger.info("Recompensa de referido demo acreditada", {
        inviterId,
        amount: REFERRAL_REWARD_CMPX,
      });
      return { credited: true, reason: "credited" };
    }

    try {
      if (!supabase) {
        logger.error("Supabase no está disponible");
        return {
          credited: false,
          reason: "error",
          error: "Supabase no está disponible",
        };
      }

      // Idempotencia real: ¿ya se pagó este par?
      const { data: previous, error: lookupError } = await supabase
        .from("referral_rewards")
        .select("id")
        .eq("inviter_id", inviterId)
        .eq("invited_id", inviteeId)
        .maybeSingle();

      if (lookupError) {
        logger.error("Error buscando recompensa de referido previa", {
          error: lookupError,
        });
        return {
          credited: false,
          reason: "error",
          error: "Error al verificar la recompensa de referido",
        };
      }
      if (previous) {
        return { credited: false, reason: "already_rewarded" };
      }

      // Código de referido del invitador (columna NOT NULL en el insert).
      const { data: inviterRow } = await supabase
        .from("user_token_balances")
        .select("referral_code")
        .eq("user_id", inviterId)
        .maybeSingle();
      const referralCode =
        (inviterRow as { referral_code?: string | null } | null)
          ?.referral_code ??
        `REF${inviterId
          .replace(/[^A-Za-z0-9]/g, "")
          .slice(-8)
          .toUpperCase()}`;

      const { error: insertError } = await supabase
        .from("referral_rewards")
        .insert({
          inviter_id: inviterId,
          invited_id: inviteeId,
          user_id: inviterId,
          referral_code: referralCode,
          reward_type: "cmpx",
          amount: REFERRAL_REWARD_CMPX,
          inviter_reward_amount: REFERRAL_REWARD_CMPX,
          status: "confirmed",
          claimed: true,
          claimed_at: new Date().toISOString(),
          verification_method: "world_id_or_kyc",
          description: "Recompensa por referido verificado",
        });

      if (insertError) {
        logger.error("Error registrando recompensa de referido", {
          error: insertError,
        });
        return {
          credited: false,
          reason: "error",
          error: "No se pudo registrar la recompensa de referido",
        };
      }

      const credited = await tokenService.addTokens(
        inviterId,
        "cmpx",
        REFERRAL_REWARD_CMPX,
        "Recompensa por referido verificado",
        { reason: "referral_reward", invitee_id: inviteeId },
      );
      if (!credited) {
        return {
          credited: false,
          reason: "error",
          error: "No se pudo acreditar la recompensa de referido",
        };
      }

      logger.info("Recompensa de referido acreditada", {
        inviterId: inviterId.substring(0, 8) + "***",
        amount: REFERRAL_REWARD_CMPX,
      });
      return { credited: true, reason: "credited" };
    } catch (error) {
      logger.error("Error acreditando recompensa de referido", { error });
      return {
        credited: false,
        reason: "error",
        error: "Error al acreditar la recompensa de referido",
      };
    }
  }

  private async resolveInviteeVerified(
    inviteeId: string,
    isInviteeVerified: boolean | (() => Promise<boolean>) | undefined,
    isDemo: boolean,
  ): Promise<boolean | null> {
    if (typeof isInviteeVerified === "boolean") return isInviteeVerified;
    if (typeof isInviteeVerified === "function") {
      try {
        return await isInviteeVerified();
      } catch (error) {
        logger.error("Error resolviendo verificación del invitado", {
          error,
        });
        return null;
      }
    }
    if (isDemo) return false;
    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from("user_token_balances")
        .select("world_id_verified")
        .eq("user_id", inviteeId)
        .maybeSingle();
      if (error) {
        logger.error("Error leyendo verificación del invitado", { error });
        return null;
      }
      return (
        (data as { world_id_verified?: boolean | null } | null)
          ?.world_id_verified === true
      );
    } catch (error) {
      logger.error("Error leyendo verificación del invitado", { error });
      return null;
    }
  }

  /**
   * Gasto: enviar un regalo a otro perfil, 10 CMPX (tarifa plana).
   * Con saldo insuficiente NO descuenta y devuelve `needsTopUp`
   * con la ruta de recarga (`/tokens`); el cobro real queda fuera
   * de esta ronda, solo el punto de entrada.
   */
  async spendForGift(options: {
    userId: string;
    accountType: DemoAccountType;
    isAnonymous: boolean;
    isDemo: boolean;
    giftId?: number | string;
  }): Promise<SpendResult> {
    const { userId, accountType, isAnonymous, isDemo, giftId } = options;
    return this.spendCmpx({
      userId,
      accountType,
      isAnonymous,
      isDemo,
      amount: GIFT_SEND_COST_CMPX,
      description: "Envío de regalo virtual",
      metadata: {
        reason: "gift_send",
        ...(giftId !== undefined ? { gift_id: String(giftId) } : {}),
      },
    });
  }

  /**
   * Gasto: crear un chat privado, 25 CMPX. Misma semántica que
   * `spendForGift` ante saldo insuficiente.
   */
  async spendForPrivateChat(options: {
    userId: string;
    accountType: DemoAccountType;
    isAnonymous: boolean;
    isDemo: boolean;
  }): Promise<SpendResult> {
    const { userId, accountType, isAnonymous, isDemo } = options;
    return this.spendCmpx({
      userId,
      accountType,
      isAnonymous,
      isDemo,
      amount: PRIVATE_CHAT_CREATE_COST_CMPX,
      description: "Creación de chat privado",
      metadata: { reason: "private_chat_create" },
    });
  }

  private async spendCmpx(options: {
    userId: string;
    accountType: DemoAccountType;
    isAnonymous: boolean;
    isDemo: boolean;
    amount: number;
    description: string;
    metadata: Record<string, string | number | boolean>;
  }): Promise<SpendResult> {
    const { userId, accountType, isAnonymous, isDemo, amount } = options;

    if (isAnonymous) {
      logger.info(ANONYMOUS_WALLET_BLOCKED_REASON, { userId });
      return spendResult(false, null, ANONYMOUS_WALLET_BLOCKED_REASON);
    }

    if (isDemo) {
      const next = debitDemoWallet(accountType, amount);
      if (!next) {
        const balance = getDemoWalletBalance(accountType).cmpx;
        return spendResult(
          false,
          balance,
          insufficientBalanceMessage(amount, balance),
        );
      }
      return spendResult(true, next.cmpx);
    }

    const paid = await tokenService.spendTokens(
      userId,
      "cmpx",
      amount,
      options.description,
      options.metadata,
    );
    if (!paid) {
      const balance = await tokenService.getBalance(userId);
      return spendResult(
        false,
        balance?.cmpx ?? null,
        insufficientBalanceMessage(amount, balance?.cmpx ?? null),
      );
    }
    const next = await tokenService.getBalance(userId);
    return spendResult(true, next?.cmpx ?? null);
  }
}

export const welcomeTokensService = WelcomeTokensService.getInstance();

/**
 * PUNTOS DE INSERCIÓN PENDIENTES DE CABLEADO (los aplica el
 * coordinador en la integración; los archivos de auth son del
 * stream A y los formularios de registro no se tocan en esta ronda):
 *
 * 1. Crédito de bienvenida, login demo — `src/features/auth/useAuth.ts`,
 *    `signIn`, rama demo, tras `_setDemoUser(demoProfileData)` (~línea 688):
 *    ```ts
 *    await welcomeTokensService.claimWelcomeCredit({
 *      userId: demoAuth.user.id,
 *      accountType: demoAuth.user.accountType === "couple" ? "couple" : "single",
 *      isAnonymous: isAnonymousDemoProfile(demoProfileData),
 *      isDemo: true,
 *    });
 *    ```
 *    (Idempotente: en logins posteriores devuelve `alreadyClaimed`.)
 *
 * 2. Crédito de bienvenida, registro demo — `src/lib/demo-registration.ts`,
 *    `createLocalDemoAccount`, tras crear la cuenta (retorna `{ userId }`):
 *    mismo `claimWelcomeCredit` con `isDemo: true` y el `accountType`
 *    del input. Alternativa al punto 1 para cuentas creadas por los
 *    formularios de registro (que no se tocan).
 *
 * 3. Crédito de bienvenida, registro real — donde el registro real
 *    cree la fila de `user_token_balances` (hoy `TokenService.getBalance`
 *    la crea con 0 CMPX al primer acceso): mismo `claimWelcomeCredit`
 *    con `isDemo: false`. No hay columna `welcome_credit_claimed`;
 *    la idempotencia real vive en `token_transactions`.
 *
 * 4. Referido al verificar (KYC, NO World ID) — donde el código marque
 *    una verificación como completa fuera de la edge function
 *    `worldid-verify` (esa ya paga en servidor; NO duplicar):
 *    ```ts
 *    await welcomeTokensService.creditReferralReward({
 *      inviterId: <referred_by del invitado>,
 *      inviteeId: user.id,
 *      isInviteeVerified: true,
 *      isDemo: <modo demo>,
 *    });
 *    ```
 *    Hoy `WorldIDButton` no recibe `invitedBy` de ningún padre (no hay
 *    call-site que lo pase) y la edge function ya resuelve el referido
 *    World ID en servidor, así que este punto queda pendiente de que
 *    exista una ruta de verificación KYC con `referred_by` a mano.
 *
 * 5. Gasto de regalo — `src/components/premium/VirtualGifts.tsx`,
 *    `handleSendGift` (~línea 51): antes de `onSendGift`, llamar a
 *    `spendForGift` con el usuario actual; si `!success`, mostrar
 *    `result.error` + botón a `result.topUpRoute` (`/tokens`) y NO
 *    enviar el regalo. Hoy ningún padre pasa `onSendGift`, así que el
 *    envío no tiene ruta viva; el gasto queda listo en servicio.
 *
 * 6. Gasto de chat privado — CABLEADO en esta ronda en
 *    `ChatRoomService.createPrivateRoom` (25 CMPX al crear, vía
 *    `TokenService`); el único llamador es
 *    `PrivateRoomManagement.tsx:68` (solo premium) y recibe `null`
 *    cuando el saldo no alcanza.
 *
 * 7. Saldo visible — demo: `DemoWallet`/`TokenDashboard` ya leen
 *    `getDemoWalletBalance` y escuchan `DEMO_WALLET_CHANGED_EVENT`,
 *    que `creditDemoWallet`/`debitDemoWallet` disparan: el saldo se
 *    actualiza solo. Real: `useTokens` carga de `user_token_balances`
 *    al montar; tras acreditar/gastar hay que volver a llamar a su
 *    `loadTokenData` en el call-site (no hay evento vivo real).
 */
