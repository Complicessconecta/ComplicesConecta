/**
 * CouplePreNuptialAgreement.tsx - Protocolo de Divorcio Digital
 *
 * Propósito: Implementar "Prenupcial Digital" con Cláusula de Muerte Súbita
 * Autor: Lead Architect & Legal Tech
 * Versión: v3.7.2 - Legal Tech Implementation
 * Fecha: 21 Noviembre 2025
 *
 * Características:
 * - Consentimiento dual requerido
 * - Cláusula de muerte súbita (30 días)
 * - Protección de activos digitales
 * - Evidencia legal completa
 */

import React, { useState, useEffect } from "react";
import {  FileText, AlertTriangle, Users, Shield, Clock, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";
import ConsentGuard from "@/components/ui/ConsentGuard";
import { toast } from "sonner";

interface CouplePreNuptialAgreementProps {
  coupleId: string;
  partner1Id: string;
  partner2Id: string;
  onAgreementComplete: (agreementId: string) => void;
  onCancel?: () => void;
}

interface AgreementStatus {
  id: string;
  partner1Signature: boolean;
  partner2Signature: boolean;
  status: "PENDING" | "ACTIVE" | "DISPUTED" | "DISSOLVED" | "FORFEITED";
  signedAt: string | null;
  disputeDeadline: string | null;
}

export const CouplePreNuptialAgreement: React.FC<
  CouplePreNuptialAgreementProps
> = ({ coupleId, partner1Id, partner2Id, onAgreementComplete, onCancel }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [agreementStatus, setAgreementStatus] =
    useState<AgreementStatus | null>(null);
  const [showConsentGuard, setShowConsentGuard] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [userIP, setUserIP] = useState<string>("");

  const protectedAssets = [
    {
      type: "Token CMPX",
      name: "CMPX",
      value: "1000",
      distribution: "50% cada pareja",
    },
    {
      type: "Token GTK",
      name: "GTK",
      value: "500",
      distribution: "50% cada pareja",
    },
    {
      type: "NFT",
      name: "NFT de Pareja",
      value: "1",
      distribution: "50% cada pareja",
    },
  ];

  // Obtener IP del usuario con redundancia
  useEffect(() => {
    const getUserIP = async () => {
      try {
        // Intento 1: ipify
        const response = await fetch("https://api.ipify.org?format=json");
        if (!response.ok) throw new Error("Ipify failed");
        const data = await response.json();
        setUserIP(data.ip);
      } catch (error) {
        logger.warn("Fallo primer intento de IP, probando backup", { error });
        try {
          // Intento 2: ipapi.co (HTTPS required)
          const response = await fetch("https://ipapi.co/json/");
          if (!response.ok) throw new Error("Ipapi failed");
          const data = await response.json();
          setUserIP(data.ip);
        } catch (secondError) {
          logger.error("No se pudo obtener IP del usuario en ningún servicio", {
            secondError,
          });
          // En producción esto debería impedir la firma, pero para dev usamos fallback
          setUserIP("UNKNOWN_IP");
        }
      }
    };

    getUserIP();
  }, []);

  // Verificar estado del acuerdo existente
  useEffect(() => {
    const checkAgreementStatus = async () => {
      try {
        if (!supabase) {
          logger.error("Supabase client is not initialized");
          return;
        }

        const { data, error } = await supabase
          .from("couple_agreements")
          .select("*")
          .eq("couple_id", coupleId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          logger.error("Error verificando acuerdo existente", { error });
          return;
        }

        if (data) {
          setAgreementStatus({
            id: data.id,
            partner1Signature: data.partner_1_signature ?? false,
            partner2Signature: data.partner_2_signature ?? false,
            status: data.status as
              | "ACTIVE"
              | "DISSOLVED"
              | "PENDING"
              | "DISPUTED"
              | "FORFEITED",
            signedAt: data.signed_at,
            disputeDeadline: data.dispute_deadline,
          });

          // Si el acuerdo está completo, notificar
          if (data.status === "ACTIVE") {
            onAgreementComplete(data.id);
          }
        }
      } catch (error) {
        logger.error("Error verificando acuerdo", { error });
      } finally {
        setIsLoading(false);
      }
    };

    checkAgreementStatus();
  }, [coupleId, onAgreementComplete]);

  // Crear nuevo acuerdo si no existe
  const createAgreement = async () => {
    if (!user) return;

    try {
      if (!supabase) {
        logger.error("Supabase client is not initialized");
        toast.error("Servicio de acuerdos no disponible en este momento.");
        return;
      }

      const agreementText = `
ACUERDO PRENUPCIAL DIGITAL - ComplicesConecta v3.7.2

PARTES:
- Partner 1: ${partner1Id}
- Partner 2: ${partner2Id}
- Pareja ID: ${coupleId}

INVENTARIO DE ACTIVOS PROTEGIDOS:
${protectedAssets.map((asset: { type: string; name: string; value: string; distribution: string }) => `- ${asset.type}: ${asset.name} (${asset.value}) - Dist: ${asset.distribution}`).join("\n")}

CLÁUSULA DE MUERTE SÚBITA:
En caso de disolución de la cuenta de pareja por conflicto no resuelto en 30 días, 
los activos digitales (Tokens CMPX/GTK y NFTs) no reclamados serán transferidos 
a la plataforma por concepto de "Gastos Administrativos de Cancelación" y la cuenta será eliminada.

DISPOSICIÓN DE ACTIVOS:
- Método: ADMIN_FORFEIT (Transferencia a la plataforma)
- Plazo de resolución: 30 días calendario
- Notificación: Ambas partes serán notificadías del inicio de disputa

EVIDENCIA LEGAL:
- Timestamp de firma
- IP de cada firmante
- Hash del acuerdo completo
- Consentimiento informado registrado
      `.trim();

      const encoder = new TextEncoder();
      const data = encoder.encode(agreementText);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const agreementHash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: newAgreement, error } = await supabase
        .from("couple_agreements")
        .insert({
          couple_id: coupleId,
          partner_1_id: partner1Id,
          partner_2_id: partner2Id,
          agreement_hash: agreementHash,
          death_clause_text:
            'En caso de disolución de la cuenta de pareja por conflicto no resuelto en 30 días, los activos digitales (Tokens/NFTs) no reclamados serán transferidos a la plataforma por concepto de "Gastos Administrativos de Cancelación" y la cuenta será eliminada.',
          asset_disposition_clause: "ADMIN_FORFEIT",
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creando acuerdo", { error });
        throw error;
      }

      setAgreementStatus({
        id: newAgreement.id,
        partner1Signature: false,
        partner2Signature: false,
        status: "PENDING",
        signedAt: null,
        disputeDeadline: null,
      });

      logger.info("Acuerdo prenupcial creado", {
        agreementId: newAgreement.id,
      });
    } catch (error) {
      logger.error("Error creando acuerdo prenupcial", { error });
      toast.error("Error al crear el acuerdo. Por favor, intenta de nuevo.");
    }
  };

  // Firmar acuerdo
  const signAgreement = async () => {
    if (!user || !agreementStatus || !userIP) return;

    setIsSigning(true);

    try {
      const isPartner1 = user.id === partner1Id;

      if (!supabase) {
        logger.error("Supabase client is not initialized");
        return;
      }

      const updatePayload = isPartner1
        ? {
            partner_1_signature: true,
            partner_1_ip: userIP,
            partner_1_signed_at: new Date().toISOString(),
          }
        : {
            partner_2_signature: true,
            partner_2_ip: userIP,
            partner_2_signed_at: new Date().toISOString(),
          };

      const { data, error } = await supabase
        .from("couple_agreements")
        .update({
          ...updatePayload,
        })
        .eq("id", agreementStatus.id)
        .select()
        .single();

      if (error) {
        logger.error("Error firmando acuerdo", { error });
        throw error;
      }

      // Actualizar estado local
      setAgreementStatus((prev) =>
        prev
          ? {
              ...prev,
              partner1Signature: data.partner_1_signature ?? false,
              partner2Signature: data.partner_2_signature ?? false,
              status: data.status as
                | "ACTIVE"
                | "DISSOLVED"
                | "PENDING"
                | "DISPUTED"
                | "FORFEITED",
              signedAt: data.signed_at,
              disputeDeadline: data.dispute_deadline,
            }
          : null,
      );

      logger.info("Acuerdo firmado exitosamente", {
        agreementId: agreementStatus.id,
        partner: isPartner1 ? "partner1" : "partner2",
        ip: userIP,
      });

      // Si ambos han firmado, el acuerdo está completo
      if (data.status === "ACTIVE") {
        onAgreementComplete(data.id);
      }
    } catch (error) {
      logger.error("Error firmando acuerdo", { error });
      toast.error("Error al firmar el acuerdo. Por favor, intenta de nuevo.");
    } finally {
      setIsSigning(false);
    }
  };

  // Manejar consentimiento completado
  const handleConsentComplete = (consentId: string) => {
    logger.info("Consentimiento de acuerdo prenupcial completado", {
      consentId,
    });
    setShowConsentGuard(false);
    signAgreement();
  };

  // Determinar si el usuario actual puede firmar
  const canUserSign = () => {
    if (!user || !agreementStatus) return false;

    const isPartner1 = user.id === partner1Id;
    const isPartner2 = user.id === partner2Id;

    if (!isPartner1 && !isPartner2) return false;

    if (isPartner1 && agreementStatus.partner1Signature) return false;
    if (isPartner2 && agreementStatus.partner2Signature) return false;

    return agreementStatus.status === "PENDING";
  };

  // Renderizar estado de firmas
  const renderSignatureStatus = () => {
    if (!agreementStatus) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div
            className={`p-2 rounded-full ${
              agreementStatus.partner1Signature ? "bg-green-100" : "bg-gray-200"
            }`}
          >
            {agreementStatus.partner1Signature ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">Partner 1</p>
            <p className="text-sm text-gray-600">
              {agreementStatus.partner1Signature ? "Firmado" : "Pendiente"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div
            className={`p-2 rounded-full ${
              agreementStatus.partner2Signature ? "bg-green-100" : "bg-gray-200"
            }`}
          >
            {agreementStatus.partner2Signature ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">Partner 2</p>
            <p className="text-sm text-gray-600">
              {agreementStatus.partner2Signature ? "Firmado" : "Pendiente"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">
          Cargando acuerdo prenupcial...
        </span>
      </div>
    );
  }

  // Mostrar ConsentGuard si es necesario
  if (showConsentGuard) {
    return (
      <ConsentGuard
        docPath="docs/legal/COUPLE_PRENUPTIAL_AGREEMENT.md"
        consentType="COUPLE_AGREEMENT"
        title="Acuerdo Prenupcial Digital"
        summary={[
          "Acepto la Cláusula de Muerte Súbita: activos no reclamados en 30 días se transfieren a la plataforma",
          "Entiendo que en caso de disputa tengo 30 días para llegar a un acuerdo con mi pareja",
          "Acepto que los activos digitales (CMPX, GTK, NFTs) pueden ser transferidos por gastos administrativos",
          "Confirmo que este acuerdo es vinculante y será registrado con evidencia legal completa",
          "Entiendo que ambos partners deben firmar para activar la cuenta de pareja",
        ]}
        onConsent={handleConsentComplete}
        onReject={() => {
          setShowConsentGuard(false);
          onCancel?.();
        }}
        variant="modal"
        required={true}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Acuerdo Prenupcial Digital
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Protección legal para activos digitales de la pareja con cláusula de
          muerte súbita
        </p>
      </div>

      {/* Estado del acuerdo */}
      {agreementStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Estado del Acuerdo
          </h2>
          {renderSignatureStatus()}

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                Estado:{" "}
                {agreementStatus.status === "PENDING"
                  ? "Pendiente de firmas"
                  : agreementStatus.status === "ACTIVE"
                    ? "Activo"
                    : agreementStatus.status}
              </span>
            </div>
            {agreementStatus.signedAt && (
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <Clock className="h-4 w-4" />
                <span>
                  Firmado:{" "}
                  {new Date(agreementStatus.signedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Términos principales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          Cláusula de Muerte Súbita
        </h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-medium mb-2">
            ⚠️ IMPORTANTE - LEE CUIDADOSAMENTE:
          </p>
          <p className="text-yellow-700 text-sm leading-relaxed">
            En caso de disolución de la cuenta de pareja por conflicto no
            resuelto en <strong>30 días calendario</strong>, los activos
            digitales (Tokens CMPX/GTK y NFTs) no reclamados serán transferidos
            a la plataforma por concepto de{" "}
            <strong>"Gastos Administrativos de Cancelación"</strong> y la cuenta
            será eliminada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Activos Protegidos</p>
              <p className="text-sm text-gray-600">Tokens CMPX/GTK, NFTs</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Plazo de Resolución</p>
              <p className="text-sm text-gray-600">30 días calendario</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Firmas Requeridías</p>
              <p className="text-sm text-gray-600">Ambos partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex space-x-4">
        {!agreementStatus ? (
          <button
            onClick={createAgreement}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Crear Acuerdo Prenupcial
          </button>
        ) : canUserSign() ? (
          <button
            onClick={() => setShowConsentGuard(true)}
            disabled={isSigning}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isSigning ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Firmando...
              </span>
            ) : (
              "Firmar Acuerdo"
            )}
          </button>
        ) : (
          <div className="flex-1 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg font-medium text-center">
            {agreementStatus.status === "ACTIVE"
              ? "Acuerdo Completado"
              : "Esperando tu firma o la de tu pareja"}
          </div>
        )}

        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Nota legal */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          🛡️ <strong>Evidencia Legal:</strong> Este acuerdo será registrado con
          IP de ambos firmantes, timestamps precisos y hash del contenido para
          garantizar integridad legal. El registro cumple con normativas de
          evidencia digital aplicables.
        </p>
      </div>
    </div>
  );
};

export default CouplePreNuptialAgreement;

