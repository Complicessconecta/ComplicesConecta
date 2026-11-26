/**
 * Límites de mensajes y videollamada según los toggles de Privacidad.
 *
 * Hoy Chat.tsx usa `mockPrivacySettings` de `@/lib/data` (siempre
 * `allowMessages: "everyone"`) y el botón de video no tiene `onClick`:
 * los toggles "Limitar el envío de mensajes" y "Chat de video" no se
 * cumplían. Este módulo implementa la decisión; Chat.tsx NO se edita
 * en esta ronda (fuera de los archivos asignados). Puntos exactos de
 * inserción al final de este archivo y en el reporte al coordinador.
 *
 * Semántica de los toggles (sección Privacidad):
 * - `limitMessages` ON: solo contactos VERIFICADOS pueden escribirte.
 *   OFF: cualquiera con acceso al hilo puede escribirte.
 * - `videoChat` OFF: nadie puede iniciar videollamada contigo.
 *   ON: tus matches pueden iniciar videollamada.
 *
 * En demo la privacidad del destinatario se lee de localStorage
 * (`single_privacy:<id>` / `couple_privacy:<id>`); en real, de
 * `couple_profiles.privacy_settings` (pareja) y de
 * `profiles.privacy_settings` (single; migración 20261124040000,
 * si aún no está aplicada se usa el local).
 */
import {
  loadPrivacySettings,
  readPrivacySettingsSync,
  type PrivacySettings,
  type ProfileType,
} from "@/lib/visibility";

export interface ChatLimitCheck {
  /** El destinatario recibió el mensaje / llamada. */
  allowed: boolean;
  /** Motivo en español para mostrar en toast cuando no se permite. */
  reason?: string;
}

export interface MessageLimitInput {
  /** Ajustes de privacidad DEL DESTINATARIO (a quien le escriben). */
  recipientPrivacy: PrivacySettings | null | undefined;
  /** ¿El remitente es un perfil verificado? */
  senderIsVerified: boolean;
  /**
   * Ronda 9 (stream A, punto 4): si el remitente O el destinatario
   * es una cuenta anónima, solo se puede escribir con amistad
   * aceptada (`areFriends`). Sin amistad no hay chat ni media.
   */
  senderIsAnonymous?: boolean;
  recipientIsAnonymous?: boolean;
  /** ¿Remitente y destinatario son amigos aceptados? */
  areFriends?: boolean;
}

/**
 * ¿Puede este remitente enviarle un mensaje al destinatario?
 * El toggle solo restringe por verificación del remitente; el resto
 * de reglas del hilo (invitación aceptada, match, chat pausado) las
 * sigue aplicando Chat.tsx antes/después de esta comprobación.
 */
export function canSendMessageTo(input: MessageLimitInput): ChatLimitCheck {
  const { recipientPrivacy, senderIsVerified } = input;
  if (
    (input.senderIsAnonymous === true || input.recipientIsAnonymous === true) &&
    input.areFriends !== true
  ) {
    return {
      allowed: false,
      reason:
        "Las cuentas anónimas solo pueden chatear con amigos aceptados. Envía primero una solicitud de amistad y espera a que la acepten.",
    };
  }
  if (!recipientPrivacy) return { allowed: true };
  if (recipientPrivacy.limitMessages && !senderIsVerified) {
    return {
      allowed: false,
      reason:
        "Este perfil solo acepta mensajes de contactos verificados. Verifica tu perfil para poder escribirle.",
    };
  }
  return { allowed: true };
}

export interface VideoCallLimitInput {
  /** Ajustes de privacidad DEL DESTINATARIO (a quien se llama). */
  recipientPrivacy: PrivacySettings | null | undefined;
  /** ¿Hay match mutuo con el destinatario? */
  hasMatch: boolean;
  /**
   * Ronda 9 (stream A, punto 4): una videollamada con un anónimo
   * exige amistad aceptada (el match mutuo es la aceptación en
   * este flujo); sin ella no hay llamada.
   */
  senderIsAnonymous?: boolean;
  recipientIsAnonymous?: boolean;
}

/** ¿Se puede iniciar una videollamada con el destinatario? */
export function canStartVideoCall(input: VideoCallLimitInput): ChatLimitCheck {
  const { recipientPrivacy, hasMatch } = input;
  if (
    (input.senderIsAnonymous === true || input.recipientIsAnonymous === true) &&
    !hasMatch
  ) {
    return {
      allowed: false,
      reason:
        "Las cuentas anónimas solo pueden hacer videollamadas con amigos aceptados.",
    };
  }
  if (!recipientPrivacy) return { allowed: true };
  if (!recipientPrivacy.videoChat) {
    return {
      allowed: false,
      reason: "Este perfil no permite videollamadas.",
    };
  }
  if (!hasMatch) {
    return {
      allowed: false,
      reason: "Necesitas un match mutuo para iniciar una videollamada.",
    };
  }
  return { allowed: true };
}

/**
 * Carga la privacidad del destinatario para usarla en Chat.tsx.
 * Demo: lectura síncrona de localStorage. Real: Supabase
 * (`couple_profiles` o `profiles` según el tipo; single requiere la
 * migración 20261124040000 aplicada, si no, respaldo local).
 */
export async function loadRecipientPrivacy(
  recipientUserId: string,
  recipientType: ProfileType,
): Promise<PrivacySettings> {
  const { settings } = await loadPrivacySettings(
    recipientUserId,
    recipientType,
  );
  return settings;
}

/** Variante síncrona (demo): misma fuente que la sección de Privacidad. */
export function readRecipientPrivacySync(
  recipientUserId: string,
  recipientType: ProfileType,
): PrivacySettings {
  return readPrivacySettingsSync(recipientUserId, recipientType);
}

/*
 * PUNTOS DE INSERCIÓN EN src/pages/Chat.tsx (los aplica el coordinador;
 * este archivo no edita Chat.tsx):
 *
 * 1) Importar al inicio, junto al resto de imports de lib:
 *      import {
 *        canSendMessageTo,
 *        canStartVideoCall,
 *        loadRecipientPrivacy,
 *      } from "@/lib/chatLimits";
 *    Y quitar el uso de `mockPrivacySettings` de `@/lib/data` (línea 10
 *    y `checkMessagePermissions` ~línea 927).
 *
 * 2) En `handleSendMessage` (~línea 888), DESPUÉS de la comprobación de
 *    `checkMessagePermissions`, o SUSTITUYENDO `checkMessagePermissions`
 *    por esto (el destinatario es `selectedChat`):
 *      const recipientPrivacy = await loadRecipientPrivacy(
 *        selectedChat.id.toString(),
 *        selectedChat.profileType === "couple" ? "couple" : "single",
 *      );
 *      const limit = canSendMessageTo({
 *        recipientPrivacy,
 *        senderIsVerified: Boolean(user?.is_verified ?? currentProfile?.is_verified),
 *      });
 *      if (!limit.allowed) {
 *        toast({ title: "Sin permisos", description: limit.reason });
 *        return;
 *      }
 *    NOTA: `user`/`currentProfile` no exponen hoy `is_verified` en
 *    Chat.tsx; si no hay fuente de verificación del remitente, usar
 *    `false` (lo más restrictivo) y reportarlo: el remitente sin
 *    verificar queda bloqueado cuando el destinatario tiene el límite
 *    activo. En demo, `selectedChat` no trae `profileType`: usar
 *    "single" salvo que el hilo sea de pareja.
 *
 * 3) Botón de video (~línea 991, `<Video className="h-4 w-4" />` sin
 *    onClick): añadirle onClick con la misma carga de privacidad:
 *      onClick={async () => {
 *        if (!selectedChat) return;
 *        const recipientPrivacy = await loadRecipientPrivacy(
 *          selectedChat.id.toString(),
 *          selectedChat.profileType === "couple" ? "couple" : "single",
 *        );
 *        const call = canStartVideoCall({
 *          recipientPrivacy,
 *          hasMatch: matchedIds?.has(selectedChat.id.toString()) ?? false,
 *        });
 *        if (!call.allowed) {
 *          toast({ title: "Videollamada no disponible", description: call.reason });
 *          return;
 *        }
 *        // TODO: iniciar la videollamada (hoy no existe flujo de llamada).
 *      }}
 *    El flujo real de videollamada NO existe en la app (no hay
 *    WebRTC ni pantalla de llamada): el gate queda listo, pero sin
 *    llamada que iniciar. Queda pendiente implementar la llamada.
 */
