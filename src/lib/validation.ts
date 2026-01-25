import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

// --- AGE VALIDATION (From utils/validation.ts) ---

/**
 * Valida que el usuario sea mayor de 18 años
 * @param birthDate - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns true si es mayor de 18 años, false en caso contrario
 */
export const validateAge = (birthDate: string): boolean => {
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Ajustar si no ha cumplido años este año
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1 >= 18;
    }

    return age >= 18;
  } catch (error) {
    logger.error("Error validando edad:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * Valida que ambos miembros de una pareja sean mayores de 18 años
 * @param birthDate1 - Fecha de nacimiento del primer miembro
 * @param birthDate2 - Fecha de nacimiento del segundo miembro
 * @returns objeto con validación individual y general
 */
export const validateCoupleAge = (birthDate1: string, birthDate2: string) => {
  const member1Valid = validateAge(birthDate1);
  const member2Valid = validateAge(birthDate2);

  return {
    member1Valid,
    member2Valid,
    bothValid: member1Valid && member2Valid,
    message:
      !member1Valid || !member2Valid
        ? "Ambos miembros de la pareja deben ser mayores de 18 años"
        : "Validación de edad exitosa",
  };
};

// --- EMAIL VALIDATION (Merged from utils/emailValidation.ts and utils/validation.ts) ---

export interface EmailValidationResult {
  isValid: boolean;
  isUnique: boolean;
  error?: string;
}

/**
 * Valida formato de email
 * @param email - Email a validar
 * @returns true si el formato es válido
 */
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Verifica si el email ya existe en la base de datos (alias for checkEmailUniqueness)
 * @param email - Email a validar
 * @returns true si el email es único, false si ya existe
 */
export const validateUniqueEmail = async (email: string): Promise<boolean> => {
  return checkEmailUniqueness(email);
};

/**
 * Verifica si el email ya existe en la base de datos
 */
export const checkEmailUniqueness = async (email: string): Promise<boolean> => {
  try {
    if (!supabase) {
      logger.error("Supabase no está disponible");
      return false; // Fail safe
    }

    // Verificar solo en profiles (auth.users no es accesible directamente)
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (profileError && profileError.code !== "PGRST116") {
      logger.error("Error checking profiles:", {
        error: profileError.message,
        details: profileError.details,
      });
      // Don't throw, just return false for safety or handle gracefully
      return false;
    }

    return !profiles || profiles.length === 0;
  } catch (error) {
    logger.error("Error in checkEmailUniqueness:", { error });
    return false;
  }
};

/**
 * Validación completa del email (formato + unicidad)
 */
export const validateEmail = async (
  email: string,
): Promise<EmailValidationResult> => {
  try {
    // Validar formato
    if (!email || email.trim() === "") {
      return {
        isValid: false,
        isUnique: false,
        error: "El email es requerido",
      };
    }

    if (!validateEmailFormat(email)) {
      return {
        isValid: false,
        isUnique: false,
        error: "Formato de email inválido",
      };
    }

    // Verificar unicidad
    const isUnique = await checkEmailUniqueness(email);

    if (!isUnique) {
      return {
        isValid: true,
        isUnique: false,
        error: "Este email ya está registrado",
      };
    }

    return {
      isValid: true,
      isUnique: true,
    };
  } catch (error) {
    logger.error("Error in validateEmail:", { error });
    return {
      isValid: false,
      isUnique: false,
      error: error instanceof Error ? error.message : "Error validando email",
    };
  }
};

/**
 * Validación en tiempo real para formularios
 */
export const validateEmailRealtime = async (
  email: string,
  onValidation: (result: EmailValidationResult) => void,
  _debounceMs: number = 500,
) => {
  // Simple implementation for now, assuming debounce is handled by caller or we implement it if needed.
  // Given the context, the caller likely expects a promise or direct call.
  // If this was a hook or had internal state, it would be different.
  // For now, we just call validateEmail.
  const result = await validateEmail(email);
  onValidation(result);
};

// --- PHONE VALIDATION (From utils/validation.ts) ---

/**
 * Valida y normaliza números telefónicos de México
 * Acepta formatos: 5512345678, 044 55 1234 5678, 045 55 1234 5678, +52 55 1234 5678, 52 55 1234 5678
 * @param value - Número de teléfono a validar
 * @returns Objeto con validación, número normalizado y mensaje de error
 */
export const validateMXPhone = (
  value: string,
): {
  valid: boolean;
  cleanNumber: string;
  error?: string;
} => {
  // Eliminar caracteres no numéricos
  const clean = value.replace(/\D/g, "");

  // Validar longitud
  // México: 10 dígitos (local/celular) o 12/13 con código de país (52)
  if (clean.length < 10) {
    return {
      valid: false,
      cleanNumber: clean,
      error: "El número debe tener al menos 10 dígitos",
    };
  }

  // Si tiene código de país 52 al inicio
  let standardNumber = clean;
  if (clean.length > 10 && clean.startsWith("52")) {
    standardNumber = clean.substring(2);
  }

  // Validar longitud final de 10 dígitos
  if (standardNumber.length !== 10) {
    return {
      valid: false,
      cleanNumber: clean,
      error: "El número debe tener 10 dígitos válidos",
    };
  }

  return {
    valid: true,
    cleanNumber: standardNumber,
  };
};

/**
 * Formatea un número de teléfono mexicano para visualización
 * @param phone - Número de teléfono (puede estar normalizado o no)
 * @returns Número formateado (ej: +52 55 1234 5678)
 */
export const formatMXPhone = (phone: string): string => {
  const validation = validateMXPhone(phone);

  if (!validation.valid || !validation.cleanNumber) {
    return phone; // Devolver el original si no es válido
  }

  // Formato: +52 XX XXXX XXXX
  // Assuming cleanNumber is 10 digits as per validation
  const tenDigits = validation.cleanNumber;
  const countryCode = "+52";
  const areaCode = tenDigits.substring(0, 2); // XX
  const firstPart = tenDigits.substring(2, 6); // XXXX
  const secondPart = tenDigits.substring(6, 10); // XXXX

  return `${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
};
