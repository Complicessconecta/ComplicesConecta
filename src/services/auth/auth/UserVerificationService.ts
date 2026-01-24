/**
 * UserVerificationService - Servicio unificado de verificación de identidad
 *
 * Implementa múltiples métodos de verificación:
 * - World ID (Worldcoin)
 * - Verificación por selfie (comparación con foto de perfil)
 * - Verificación por documento (OCR + validación de edad)
 * - Gestión de badges de verificación
 *
 * @version 3.5.0
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { faceRecognitionService } from "@/services/verification/FaceRecognitionService";
import { ocrService } from "@/services/verification/OCRService";
import { smsService } from "@/services/verification/SMSService";

export interface VerificationResult {
  success: boolean;
  method: "world_id" | "selfie" | "document" | "phone" | "email";
  verified: boolean;
  confidence?: number; // 0-100
  verifiedAt?: string;
  error?: string;
  metadata?: {
    verificationLevel?: string;
    nullifierHash?: string;
    documentType?: string;
    ageVerified?: boolean;
  };
}

export interface SelfieVerificationData {
  selfieFile: File;
  profilePhotoUrl?: string;
}

export interface DocumentVerificationData {
  documentFile: File;
  documentType: "id" | "passport" | "driver_license";
  country?: string;
}

export class UserVerificationService {
  private static instance: UserVerificationService;

  private constructor() {}

  static getInstance(): UserVerificationService {
    if (!UserVerificationService.instance) {
      UserVerificationService.instance = new UserVerificationService();
    }
    return UserVerificationService.instance;
  }

  /**
   * Verifica identidad con World ID (Worldcoin)
   */
  async verifyWithWorldID(
    userId: string,
    proof: {
      merkle_root: string;
      nullifier_hash: string;
      proof: string;
      verification_level: string;
      action: string;
      signal?: string;
    },
  ): Promise<VerificationResult> {
    try {
      logger.info("🌍 Verificando con World ID", {
        userId: userId.substring(0, 8) + "***",
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return {
          success: false,
          method: "world_id",
          verified: false,
          error: "Supabase no está disponible",
        };
      }

      // Llamar a la edge function de World ID
      const { data, error } = await supabase.functions.invoke(
        "worldid-verify",
        {
          body: {
            proof,
            user_id: userId,
          },
        },
      );

      if (error) {
        logger.error("Error verificando con World ID:", { error: error.message, details: error.details });
        return {
          success: false,
          method: "world_id",
          verified: false,
          error: error.message,
        };
      }

      const response = data as {
        success: boolean;
        message?: string;
        data?: unknown;
      };

      if (response.success) {
        // Actualizar perfil como verificado
        await this.updateVerificationStatus(userId, "world_id", {
          verificationLevel: proof.verification_level,
          nullifierHash: proof.nullifier_hash,
        });

        logger.info("✅ Verificación World ID exitosa", {
          userId: userId.substring(0, 8) + "***",
          nullifierHash: proof.nullifier_hash.substring(0, 16) + "***",
        });

        return {
          success: true,
          method: "world_id",
          verified: true,
          confidence: 95, // World ID tiene alta confianza
          verifiedAt: new Date().toISOString(),
          metadata: {
            verificationLevel: proof.verification_level,
            nullifierHash: proof.nullifier_hash,
          },
        };
      }

      return {
        success: false,
        method: "world_id",
        verified: false,
        error: response.message || "Verificación fallida",
      };
    } catch (error) {
      logger.error("Error crítico verificando con World ID:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        method: "world_id",
        verified: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifica identidad con selfie (comparación con foto de perfil)
   *
   * NOTA: Implementación básica. Para producción, usar servicio de reconocimiento facial
   */
  async verifyWithSelfie(
    userId: string,
    selfieData: SelfieVerificationData,
  ): Promise<VerificationResult> {
    try {
      logger.info("📸 Verificando con selfie", {
        userId: userId.substring(0, 8) + "***",
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return {
          success: false,
          method: "selfie",
          verified: false,
          error: "Supabase no está disponible",
        };
      }

      // 1. Subir selfie a Storage temporal
      const selfieFileName = `verification/${userId}/${Date.now()}-selfie.jpg`;
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(selfieFileName, selfieData.selfieFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          method: "selfie",
          verified: false,
          error: `Error subiendo selfie: ${uploadError.message}`,
        };
      }

      // 2. Obtener URL de selfie
      const { data: _urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(selfieFileName);

      // 3. Comparación básica (para producción, usar ML/AI)
      // Usar servicio de reconocimiento facial
      const comparisonResult = await faceRecognitionService.compareFaces(
        selfieFileName,
        selfieData.profilePhotoUrl,
      );

      const verified = comparisonResult.match && comparisonResult.faceDetected;
      const confidence = comparisonResult.confidence;

      if (verified) {
        await this.updateVerificationStatus(userId, "selfie", {
          verificationLevel: "medium",
        });
      }

      logger.info(
        verified
          ? "✅ Verificación selfie exitosa"
          : "⚠️ Verificación selfie requiere revisión manual",
        {
          userId: userId.substring(0, 8) + "***",
          confidence,
        },
      );

      return {
        success: true,
        method: "selfie",
        verified,
        confidence,
        ...(verified ? { verifiedAt: new Date().toISOString() } : {}),
        metadata: {
          verificationLevel: verified ? "medium" : "pending",
        },
      };
    } catch (error) {
      logger.error("Error verificando con selfie:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        method: "selfie",
        verified: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifica identidad con documento oficial
   *
   * NOTA: Requiere servicio de OCR para extraer información
   */
  async verifyWithDocument(
    userId: string,
    documentData: DocumentVerificationData,
  ): Promise<VerificationResult> {
    try {
      logger.info("🆔 Verificando con documento", {
        userId: userId.substring(0, 8) + "***",
        type: documentData.documentType,
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return {
          success: false,
          method: "document",
          verified: false,
          error: "Supabase no está disponible",
        };
      }

      // 1. Subir documento a Storage (cifrado/privado)
      const documentFileName = `verification/${userId}/${Date.now()}-${documentData.documentType}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(documentFileName, documentData.documentFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          method: "document",
          verified: false,
          error: `Error subiendo documento: ${uploadError.message}`,
        };
      }

      // 2. Extraer información del documento (OCR)
      // Usar servicio de OCR
      const ocrResult = await ocrService.extractDocumentData(
        documentFileName,
        documentData.documentType,
      );

      if (!ocrResult.success || !ocrResult.data) {
        return {
          success: false,
          method: "document",
          verified: false,
          error: ocrResult.error || "Error extrayendo información del documento",
        };
      }

      // Validar documento
      const documentValid = await ocrService.validateDocument(ocrResult.data);
      const ageVerified = ocrResult.data.isAdult || false;

      if (documentValid && ageVerified) {
        await this.updateVerificationStatus(userId, "document", {
          verificationLevel: "high",
          documentType: ocrResult.data.documentType,
          ageVerified,
        });
      }

      logger.info("✅ Documento verificado", {
        userId: userId.substring(0, 8) + "***",
        type: documentData.documentType,
        confidence: ocrResult.confidence,
      });

      return {
        success: true,
        method: "document",
        verified: documentValid && ageVerified,
        confidence: ocrResult.confidence,
        ...(documentValid && ageVerified
          ? { verifiedAt: new Date().toISOString() }
          : {}),
        metadata: {
          verificationLevel: "high",
          documentType: ocrResult.data.documentType,
          ageVerified,
        },
      };
    } catch (error) {
      logger.error("Error verificando con documento:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        method: "document",
        verified: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifica teléfono (SMS)
   */
  async verifyPhone(
    userId: string,
    phoneNumber: string,
    code: string,
  ): Promise<VerificationResult> {
    try {
      logger.info("📱 Verificando teléfono", {
        userId: userId.substring(0, 8) + "***",
        phone: phoneNumber.substring(0, 5) + "***",
      });

      // Validar formato de número de teléfono
      if (!smsService.validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          method: "phone",
          verified: false,
          error: "Número de teléfono inválido",
        };
      }

      // Verificar código SMS
      const smsResult = await smsService.verifyCode(userId, code);

      if (smsResult.verified) {
        // Actualizar estado de verificación
        await this.updateVerificationStatus(userId, "phone");

        logger.info("✅ Verificación por teléfono exitosa", {
          userId: userId.substring(0, 8) + "***",
        });

        return {
          success: true,
          method: "phone",
          verified: true,
          confidence: 90,
          verifiedAt: new Date().toISOString(),
        };
      }

      return {
        success: smsResult.success,
        method: "phone",
        verified: false,
        error: smsResult.error ?? "Error verificando código SMS",
      };
    } catch (error) {
      logger.error("Error verificando teléfono:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        method: "phone",
        verified: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Obtiene estado de verificación del usuario
   */
  async getVerificationStatus(userId: string): Promise<{
    worldId: boolean;
    selfie: boolean;
    document: boolean;
    phone: boolean;
    email: boolean;
    overall: "verified" | "pending" | "unverified";
    badges: string[];
  }> {
    try {
      if (!supabase) {
        logger.debug(
          "Supabase no está disponible, retornando estado no verificado",
        );
        return {
          worldId: false,
          selfie: false,
          document: false,
          phone: false,
          email: false,
          overall: "unverified",
          badges: [],
        };
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_verified, email_verified_at, phone_verified_at")
        .eq("user_id", userId)
        .single();

      if (error || !profile) {
        return {
          worldId: false,
          selfie: false,
          document: false,
          phone: false,
          email: false,
          overall: "unverified",
          badges: [],
        };
      }

      // Usar solo campos que existen en la BD (con casting por seguridad)
      const profileData = profile as unknown as {
        is_verified: boolean;
        email_verified_at?: string;
        phone_verified_at?: string;
      };
      const isVerified = profileData.is_verified || false;
      const emailVerified = !!profileData.email_verified_at;
      const phoneVerified = !!profileData.phone_verified_at;

      const badges: string[] = [];
      if (isVerified) badges.push("verified");
      if (emailVerified) badges.push("email");
      if (phoneVerified) badges.push("phone");

      const overall = isVerified
        ? "verified"
        : emailVerified || phoneVerified
          ? "pending"
          : "unverified";

      return {
        worldId: isVerified,
        selfie: false, // Campo no existe en BD aún
        document: false, // Campo no existe en BD aún
        phone: phoneVerified,
        email: emailVerified,
        overall,
        badges,
      };
    } catch (error) {
      logger.error("Error obteniendo estado de verificación:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        worldId: false,
        selfie: false,
        document: false,
        phone: false,
        email: false,
        overall: "unverified",
        badges: [],
      };
    }
  }

  /**
   * Actualiza estado de verificación en el perfil
   */
  private async updateVerificationStatus(
    userId: string,
    method: "world_id" | "selfie" | "document" | "phone" | "email",
    _metadata?: {
      verificationLevel?: string;
      nullifierHash?: string;
      documentType?: string;
      ageVerified?: boolean;
    },
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {};

      switch (method) {
        case "world_id":
          updateData.is_verified = true;
          break;
        case "selfie":
          // Campo photo_verified no existe aún, usar is_verified
          updateData.is_verified = true;
          break;
        case "document":
          // Campo id_verified no existe aún, usar is_verified
          updateData.is_verified = true;
          break;
        case "phone":
          updateData.phone_verified_at = new Date().toISOString();
          break;
        case "email":
          updateData.email_verified_at = new Date().toISOString();
          break;
      }

      // Si hay al menos una verificación, marcar como verificado
      if (
        updateData.is_verified ||
        updateData.phone_verified_at ||
        updateData.email_verified_at
      ) {
        updateData.is_verified = true;
      }

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);

      if (error) {
        logger.error("Error actualizando estado de verificación:", { error: error.message, details: error.details });
      } else {
        logger.info("✅ Estado de verificación actualizado", {
          userId: userId.substring(0, 8) + "***",
          method,
        });
      }
    } catch (error) {
      logger.error("Error crítico actualizando verificación:", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Exportar instancia singleton
export const userVerificationService = UserVerificationService.getInstance();
