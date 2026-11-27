// ✅ AUTO-FIX aplicado por Auditoría ComplicesConecta v2.1.2
// Fecha: 2025-01-06
// Migración 2026-11-24: @worldcoin/idkit v1 → v4. La v1 (IDKitWidget,
// VerificationLevel, ISuccessResult) ya no existe en idkit 4.x. La v4 usa
// IDKitRequestWidget con preset orbLegacy + allow_legacy_proofs, de modo que
// la prueba que devuelve es V3 y se puede verificar con la Edge Function
// worldid-verify existente (que espera merkle_root / nullifier_hash /
// proof / verification_level).
//
// PENDIENTE (backend): la v4 exige `rp_context`, un contexto firmado por el
// backend (signRequest, con la clave RP de Worldcoin). No existe endpoint
// que lo genere, así que el componente recibe `rpContext` como prop
// opcional; sin él el botón explica que la verificación aún no está
// configurada en vez de romper. Cuando exista el endpoint, basta con
// pasarle el rp_context y el flujo completo funciona.

import { useState } from "react";
import type { FC } from "react";
import {
  IDKitRequestWidget,
  orbLegacy,
  type IDKitErrorCodes,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, Globe, Shield } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { logger } from "@/lib/logger";

/** Prueba World ID en el formato que entiende worldid-verify (V3). */
export interface WorldIDProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
}

interface WorldIDButtonProps {
  onSuccess?: (result: WorldIDProof) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  invitedBy?: string;
  /** Contexto RP firmado por el backend (signRequest). Sin él no se puede verificar. */
  rpContext?: RpContext;
}

interface WorldIDVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: string;
    worldid_verified: boolean;
    verification_level: string;
    rewards: {
      worldid_reward: number;
      referral_reward: number;
      total: number;
    };
  };
  error?: string;
}

export const WorldIDButton: FC<WorldIDButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  size = "default",
  className = "",
  invitedBy,
  rpContext,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const appId = import.meta.env.VITE_WORLD_APP_ID || "";
  const action = import.meta.env.VITE_WORLD_APP_ACTION || "verify-human";
  const isConfigured = Boolean(appId && rpContext);

  const handleVerify = async (proof: WorldIDProof) => {
    if (!user?.id) {
      toast({
        title: "Error de Autenticación",
        description: "Debes estar autenticado para verificar con World ID",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      if (!supabase) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      // Call our Edge Function for World ID verification
      const { data, error } = await supabase.functions.invoke(
        "worldid-verify",
        {
          body: {
            proof: {
              merkle_root: proof.merkle_root,
              nullifier_hash: proof.nullifier_hash,
              proof: proof.proof,
              verification_level: proof.verification_level,
              action,
              signal: user.id,
            },
            user_id: user.id,
            invited_by: invitedBy,
          },
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      const response: WorldIDVerificationResponse = data;

      if (response.success) {
        setIsVerified(true);

        toast({
          title: "Verificación Exitosa",
          description: `Has recibido ${response.data?.rewards.total || 0} CMPX por verificarte con World ID`,
          variant: "default",
        });

        onSuccess?.(proof);
      } else {
        throw new Error(response.message || "Verificación fallida");
      }
    } catch (error) {
      logger.error("World ID verification error:", {
        error: error instanceof Error ? error.message : String(error),
      });

      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      toast({
        title: "Error de Verificación",
        description: errorMessage,
        variant: "destructive",
      });

      onError?.(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  /** Resultado del widget v4 → prueba V3 para worldid-verify. */
  const handleWidgetSuccess = async (result: IDKitResult) => {
    if (result.protocol_version !== "3.0") {
      const message =
        "La verificación devolvió un formato no compatible con el servidor (se esperaba prueba World ID v3)";
      logger.error("World ID: resultado no-V3 recibido", {
        protocol: result.protocol_version,
      });
      toast({
        title: "Error de Verificación",
        description: message,
        variant: "destructive",
      });
      onError?.(message);
      return;
    }
    const item = result.responses[0];
    if (!item) {
      const message = "World ID no devolvió ninguna prueba";
      toast({
        title: "Error de Verificación",
        description: message,
        variant: "destructive",
      });
      onError?.(message);
      return;
    }
    await handleVerify({
      merkle_root: item.merkle_root,
      nullifier_hash: item.nullifier,
      proof: item.proof,
      verification_level: "orb",
    });
  };

  const handleWidgetError = (errorCode: IDKitErrorCodes) => {
    logger.error("World ID widget error:", { error: errorCode });

    let errorMessage = "Error en la verificación con World ID";
    if (errorCode === "user_rejected") {
      errorMessage = "Verificación cancelada por el usuario";
    } else if (errorCode === "verification_rejected") {
      errorMessage = "Verificación rechazada por el usuario";
    } else if (errorCode === "credential_unavailable") {
      errorMessage = "Credencial de World ID no disponible en este dispositivo";
    }

    toast({
      title: "Error de World ID",
      description: errorMessage,
      variant: "destructive",
    });

    onError?.(errorMessage);
  };

  const handleOpenWidget = () => {
    if (!user?.id) {
      toast({
        title: "Error de Autenticación",
        description: "Debes estar autenticado para verificar con World ID",
        variant: "destructive",
      });
      return;
    }
    if (!isConfigured) {
      const message =
        "La verificación con World ID aún no está configurada (falta el contexto del servidor)";
      toast({
        title: "World ID no disponible",
        description: message,
        variant: "destructive",
      });
      onError?.(message);
      return;
    }
    setWidgetOpen(true);
  };

  if (isVerified) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={cn(
          "bg-green-50 border-green-200 text-green-700 hover:bg-green-50",
          className,
        )}
      >
        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="text-xs sm:text-sm">Verificado con World ID</span>
        <Badge
          variant="secondary"
          className="ml-1 sm:ml-2 bg-green-100 text-green-800 text-xs"
        >
          <Check className="h-3 w-3" />
        </Badge>
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleOpenWidget}
        disabled={disabled || isVerifying || !user}
        variant="premium"
        size={size}
        className={cn(
          "relative overflow-hidden text-white border-0",
          className,
        )}
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
            <span className="text-xs sm:text-sm">Verificando...</span>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Verificar con World ID</span>
            </div>
            <Badge
              variant="secondary"
              className="ml-2 bg-white/20 text-white border-white/30"
            >
              +100 CMPX
            </Badge>
          </>
        )}

        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </Button>

      {rpContext && user && (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={appId as `app_${string}`}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs
          preset={orbLegacy({ signal: user.id })}
          onSuccess={handleWidgetSuccess}
          onError={handleWidgetError}
          autoClose
          language="es"
        />
      )}
    </>
  );
};
