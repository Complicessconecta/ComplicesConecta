import { serve } from "std/http/server.ts";
import {
  authenticate,
  handleOptions,
  jsonResponse,
} from "../_shared/auth.ts";

interface ReferralRequest {
  referralCode: string;
  newUserId: string;
}

const TOKEN_CONFIG = {
  REFERRAL_REWARD: 50,
  WELCOME_BONUS: 50,
  MONTHLY_LIMIT: 500,
} as const;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    // C2: only a logged-in user may claim a referral (was: unauthenticated).
    const auth = await authenticate(req);
    if ("response" in auth) return auth.response;

    const supabase = auth.supabase;

    const { referralCode, newUserId }: ReferralRequest = await req.json();

    // C2: a caller may only claim a referral for themselves.
    if (auth.user.id !== newUserId) {
      return jsonResponse(
        req,
        {
          success: false,
          message: "Solo puedes reclamar un referido para tu propia cuenta",
        },
        403,
      );
    }

    // Validar código de referido
    if (!/^CMPX[A-Z0-9]{6}$/.test(referralCode)) {
      return jsonResponse(
        req,
        {
          success: false,
          message: "Código de referido inválido",
        },
        400,
      );
    }

    // Buscar usuario invitador por código
    const { data: inviter, error: inviterError } = await supabase
      .from("user_token_balances")
      .select("*")
      .eq("referral_code", referralCode)
      .single();

    if (inviterError || !inviter) {
      return jsonResponse(
        req,
        {
          success: false,
          message: "Código de referido no encontrado",
        },
        404,
      );
    }

    // Verificar que no se auto-refiera
    if (inviter.user_id === newUserId) {
      return jsonResponse(
        req,
        {
          success: false,
          message: "No puedes referirte a ti mismo",
        },
        400,
      );
    }

    // Verificar si el usuario ya fue referido
    const { data: existingUser } = await supabase
      .from("user_token_balances")
      .select("referred_by")
      .eq("user_id", newUserId)
      .single();

    if (existingUser?.referred_by) {
      return jsonResponse(
        req,
        {
          success: false,
          message: "Este usuario ya fue referido anteriormente",
        },
        400,
      );
    }

    // Verificar límite mensual del invitador
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastResetDate = new Date(inviter.last_reset_date);

    let monthlyEarned = inviter.monthly_earned;

    // Reset mensual si es necesario
    if (
      currentMonth !== lastResetDate.getMonth() ||
      currentYear !== lastResetDate.getFullYear()
    ) {
      monthlyEarned = 0;
    }

    if (
      monthlyEarned + TOKEN_CONFIG.REFERRAL_REWARD >
      TOKEN_CONFIG.MONTHLY_LIMIT
    ) {
      return jsonResponse(
        req,
        {
          success: false,
          message: `Límite mensual alcanzado (${TOKEN_CONFIG.MONTHLY_LIMIT} CMPX)`,
        },
        400,
      );
    }

    // Generar código de referido para nuevo usuario
    const newUserReferralCode = `CMPX${newUserId.slice(-6).toUpperCase()}`;

    // Transacción: actualizar invitador y crear nuevo usuario
    const { error: transactionError } = await supabase.rpc(
      "process_referral_reward",
      {
        inviter_id: inviter.user_id,
        new_user_id: newUserId,
        new_user_referral_code: newUserReferralCode,
        referral_reward: TOKEN_CONFIG.REFERRAL_REWARD,
        welcome_bonus: TOKEN_CONFIG.WELCOME_BONUS,
        monthly_limit: TOKEN_CONFIG.MONTHLY_LIMIT,
        current_monthly_earned: monthlyEarned,
      },
    );

    if (transactionError) {
      console.error("Error en transacción:", transactionError);
      return jsonResponse(
        req,
        {
          success: false,
          message: "Error interno del servidor",
        },
        500,
      );
    }

    // Registrar en historial de recompensas
    const rewardTimestamp = now.toISOString();
    const rewards = [
      {
        id: `ref_${Date.now()}_${inviter.user_id}`,
        inviter_id: inviter.user_id,
        invited_id: newUserId,
        amount: TOKEN_CONFIG.REFERRAL_REWARD,
        type: "referral_bonus",
        timestamp: rewardTimestamp,
        status: "completed",
      },
      {
        id: `wel_${Date.now()}_${newUserId}`,
        inviter_id: inviter.user_id,
        invited_id: newUserId,
        amount: TOKEN_CONFIG.WELCOME_BONUS,
        type: "welcome_bonus",
        timestamp: rewardTimestamp,
        status: "completed",
      },
    ];

    await supabase.from("referral_rewards").insert(rewards);

    return jsonResponse(
      req,
      {
        success: true,
        message: `¡Recompensas asignadas! ${TOKEN_CONFIG.REFERRAL_REWARD} CMPX para invitador, ${TOKEN_CONFIG.WELCOME_BONUS} CMPX de bienvenida`,
        rewards,
      },
      200,
    );
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(
      req,
      { success: false, message: "Error interno del servidor" },
      500,
    );
  }
});
