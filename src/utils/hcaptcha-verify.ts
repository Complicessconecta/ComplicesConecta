import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Ô£à MIGRATED: hCaptcha verification moved to Supabase Edge Function
// This client-side utility now calls the secure Edge Function

/**
 * Verifica un token de hCaptcha
 * @param token - Token generado por el widget de hCaptcha
 * @returns Promise con el resultado de la verificaci├│n
 */
interface HCaptchaResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export const verifyHCaptcha = async (
  token: string, 
  action: string = 'login', 
  userId?: string
): Promise<HCaptchaResponse> => {
  try {
    // Verificar que el token existe
    if (!token) {
      return {
        success: false,
        message: 'Token de hCaptcha requerido'
      };
    }

    // Verificar que Supabase est├® disponible
    if (!supabase) {
      logger.error('Supabase no est├í disponible');
      return {
        success: false,
        message: 'Supabase no est├í disponible'
      };
    }

    // Llamar a la Edge Function de Supabase para verificaci├│n segura
    const { data, error } = await supabase.functions.invoke('hcaptcha-verify', {
      body: { token, action, userId }
    });
    
    if (error) {
      logger.error('Error al verificar hCaptcha:', { error: error.message || String(error) });
      return {
        success: false,
        message: 'Error interno de verificaci├│n'
      };
    }

    if (data?.success) {
      logger.info('hCaptcha verificado exitosamente:', data);
      return {
        success: true,
        message: data.message || 'Verificaci├│n exitosa',
        data
      };
    } else {
      logger.info('Verificaci├│n de hCaptcha fall├│:', data);
      return {
        success: false,
        message: data?.error || 'Verificaci├│n fall├│',
        data
      };
    }
  } catch (error) {
    logger.error('Error al verificar hCaptcha:', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      message: 'Error interno de verificaci├│n'
    };
  }
};

/**
 * Ejemplo de uso con Edge Function
 */
export const exampleUsage = () => {
  // Ejemplo de c├│mo usar la funci├│n de verificaci├│n migrada
  const token = 'token-from-hcaptcha-widget';
  
  verifyHCaptcha(token, 'registration', 'user-123')
    .then((result) => {
      if (result.success) {
        logger.info('Ô£à Verificaci├│n exitosa!', result.data);
        // Proceder con el registro/login del usuario
      } else {
        logger.info('ÔØî Verificaci├│n fall├│:', { message: result.message });
        // Mostrar error al usuario
      }
    })
    .catch((error) => {
      logger.error('Error:', error);
    });
};

/**
 * Hook React para verificaci├│n de hCaptcha
 */
export const useHCaptchaVerification = () => {
  const verifyToken = async (token: string, action?: string, userId?: string) => {
    return await verifyHCaptcha(token, action, userId);
  };

  return { verifyToken };
};
