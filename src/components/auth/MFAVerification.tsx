/**
 * MFA Verification Component
 * Componente para verificar autenticación multifactor
 * Fecha: 7 Diciembre 2025
 */

import React, { useState, useEffect } from 'react';
import { mfaService, MFAMethod } from '@/services/mfa/MFAService';
import { logger } from '@/lib/logger';

interface MFAVerificationProps {
  userId: string;
  method: MFAMethod;
  onVerified: () => void;
  onCancel: () => void;
  onUseBackupCode?: () => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  method,
  onVerified,
  onCancel,
  onUseBackupCode
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);

  // Inicializar sesión MFA
  useEffect(() => {
    const initMFA = async () => {
      try {
        const id = await mfaService.initiateMFA(userId, method);
        setSessionId(id);
        const session = mfaService.getSession(id);
        if (session) {
          setMaxAttempts(session.maxAttempts);
        }
      } catch (err) {
        setError('Error iniciando MFA');
        logger.error('MFA init error', { error: String(err) });
      }
    };
    initMFA();
  }, [userId, method]);

  // Manejar verificación
  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Por favor ingresa el código');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await mfaService.verifyMFA(sessionId, code);
      
      if (isValid) {
        logger.info('✅ MFA verification successful', { userId, method });
        onVerified();
      } else {
        const session = mfaService.getSession(sessionId);
        const remainingAttempts = session ? session.maxAttempts - session.attempts : 0;
        
        if (remainingAttempts <= 0) {
          setError('Demasiados intentos fallidos. Intenta más tarde.');
        } else {
          setError(`Código inválido. ${remainingAttempts} intentos restantes.`);
        }
        
        setAttempts(session?.attempts || 0);
        setCode('');
      }
    } catch (err) {
      setError('Error verificando código');
      logger.error('MFA verification error', { error: err });
    } finally {
      setLoading(false);
    }
  };

  // Manejar Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  // Obtener descripción del método
  const getMethodDescription = (): string => {
    switch (method) {
      case 'TOTP':
        return 'Ingresa el código de 6 dígitos de tu aplicación de autenticación';
      case 'SMS':
        return 'Ingresa el código de 6 dígitos enviado a tu teléfono';
      case 'EMAIL':
        return 'Ingresa el código de 8 caracteres enviado a tu email';
      case 'BIOMETRIC':
        return 'Usa tu huella dactilar o reconocimiento facial';
      default:
        return 'Ingresa el código de verificación';
    }
  };

  // Obtener placeholder
  const getPlaceholder = (): string => {
    switch (method) {
      case 'TOTP':
      case 'SMS':
        return '000000';
      case 'EMAIL':
        return 'XXXXXXXX';
      case 'BIOMETRIC':
        return 'Toca para verificar';
      default:
        return 'Código';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            🔐 Verificación de dos factores
          </h2>
          <p className="mt-2 text-gray-600">
            {getMethodDescription()}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Code Input */}
        <div className="space-y-2">
          <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
            Código de verificación
          </label>
          <input
            id="mfa-code"
            type={method === 'BIOMETRIC' ? 'button' : 'text'}
            placeholder={getPlaceholder()}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            maxLength={method === 'EMAIL' ? 8 : 6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            autoFocus
          />
        </div>

        {/* Attempts Counter */}
        {attempts > 0 && (
          <div className="text-sm text-gray-600">
            Intentos: {attempts}/{maxAttempts}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Backup Code Option */}
        {onUseBackupCode && (
          <button
            onClick={onUseBackupCode}
            disabled={loading}
            className="w-full text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            ¿Usar código de respaldo?
          </button>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          <p>Esta sesión expirará en 15 minutos</p>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
