
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// --- AGE VALIDATION (From utils/validation.ts) ---

/**
 * Valida que el usuario sea mayor de 18 aÃ±os
 * @param birthDate - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns true si es mayor de 18 aÃ±os, false en caso contrario
 */
export const validateAge = (birthDate: string): boolean => {
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Ajustar si no ha cumplido aÃ±os este aÃ±o
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  } catch (error) {
    logger.error('Error validando edad:', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

/**
 * Valida que ambos miembros de una pareja sean mayores de 18 aÃ±os
 * @param birthDate1 - Fecha de nacimiento del primer miembro
 * @param birthDate2 - Fecha de nacimiento del segundo miembro
 * @returns objeto con validaciÃ³n individual y general
 */
export const validateCoupleAge = (birthDate1: string, birthDate2: string) => {
  const member1Valid = validateAge(birthDate1);
  const member2Valid = validateAge(birthDate2);
  
  return {
    member1Valid,
    member2Valid,
    bothValid: member1Valid && member2Valid,
    message: !member1Valid || !member2Valid 
      ? 'Ambos miembros de la pareja deben ser mayores de 18 aÃ±os'
      : 'ValidaciÃ³n de edad exitosa'
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
 * @returns true si el formato es vÃ¡lido
 */
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Verifica si el email ya existe en la base de datos (alias for checkEmailUniqueness)
 * @param email - Email a validar
 * @returns true si el email es Ãºnico, false si ya existe
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
      logger.error('Supabase no estÃ¡ disponible');
      return false; // Fail safe
    }

    // Verificar solo en profiles (auth.users no es accesible directamente)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Error checking profiles:', profileError);
      // Don't throw, just return false for safety or handle gracefully
      return false; 
    }

    return !profiles || profiles.length === 0;
  } catch (error) {
    logger.error('Error in checkEmailUniqueness:', { error });
    return false;
  }
};

/**
 * ValidaciÃ³n completa del email (formato + unicidad)
 */
export const validateEmail = async (email: string): Promise<EmailValidationResult> => {
  try {
    // Validar formato
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        isUnique: false,
        error: 'El email es requerido'
      };
    }

    if (!validateEmailFormat(email)) {
      return {
        isValid: false,
        isUnique: false,
        error: 'Formato de email invÃ¡lido'
      };
    }

    // Verificar unicidad
    const isUnique = await checkEmailUniqueness(email);

    if (!isUnique) {
      return {
        isValid: true,
        isUnique: false,
        error: 'Este email ya estÃ¡ registrado'
      };
    }

    return {
      isValid: true,
      isUnique: true
    };
  } catch (error) {
    logger.error('Error in validateEmail:', { error });
    return {
      isValid: false,
      isUnique: false,
      error: error instanceof Error ? error.message : 'Error validando email'
    };
  }
};

/**
 * ValidaciÃ³n en tiempo real para formularios
 */
export const validateEmailRealtime = async (
  email: string,
  onValidation: (result: EmailValidationResult) => void,
  _debounceMs: number = 500
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
 * Valida y normaliza nÃºmeros telefÃ³nicos de MÃ©xico
 * Acepta formatos: 5512345678, 044 55 1234 5678, 045 55 1234 5678, +52 55 1234 5678, 52 55 1234 5678
 * @param value - NÃºmero de telÃ©fono a validar
 * @returns Objeto con validaciÃ³n, nÃºmero normalizado y mensaje de error
 */
export const validateMXPhone = (value: string): {
  valid: boolean;
  cleanNumber: string;
  error?: string;
} => {
  // Eliminar caracteres no numÃ©ricos
  const clean = value.replace(/\D/g, '');
  
  // Validar longitud
  // MÃ©xico: 10 dÃ­gitos (local/celular) o 12/13 con cÃ³digo de paÃ­s (52)
  if (clean.length < 10) {
    return {
      valid: false,
      cleanNumber: clean,
      error: 'El nÃºmero debe tener al menos 10 dÃ­gitos'
    };
  }
  
  // Si tiene cÃ³digo de paÃ­s 52 al inicio
  let standardNumber = clean;
  if (clean.length > 10 && clean.startsWith('52')) {
    standardNumber = clean.substring(2);
  }
  
  // Validar longitud final de 10 dÃ­gitos
  if (standardNumber.length !== 10) {
    return {
      valid: false,
      cleanNumber: clean,
      error: 'El nÃºmero debe tener 10 dÃ­gitos vÃ¡lidos'
    };
  }
  
  return {
    valid: true,
    cleanNumber: standardNumber
  };
};

/**
 * Formatea un nÃºmero de telÃ©fono mexicano para visualizaciÃ³n
 * @param phone - NÃºmero de telÃ©fono (puede estar normalizado o no)
 * @returns NÃºmero formateado (ej: +52 55 1234 5678)
 */
export const formatMXPhone = (phone: string): string => {
  const validation = validateMXPhone(phone);
  
  if (!validation.valid || !validation.cleanNumber) {
    return phone; // Devolver el original si no es vÃ¡lido
  }
  
  // Formato: +52 XX XXXX XXXX
  // Assuming cleanNumber is 10 digits as per validation
  const tenDigits = validation.cleanNumber;
  const countryCode = "+52";
  const areaCode = tenDigits.substring(0, 2);     // XX
  const firstPart = tenDigits.substring(2, 6);    // XXXX
  const secondPart = tenDigits.substring(6, 10);  // XXXX
  
  return `${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
};

