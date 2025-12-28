/**
 * useModelLoader - Hook para lazy loading del modelo PyTorch
 * v3.5.0 - Fase 1.2
 * 
 * Features:
 * - Lazy loading (solo carga cuando se necesita)
 * - Loading states
 * - Error handling
 * - Auto-load en mount (opcional)
 * 
 * @version 3.5.0
 * @date 2025-10-30
 */

import { useEffect, useState } from 'react';
import { pytorchModel } from '@/services/analytics/ai/models/PyTorchScoringModel';
import { logger } from '@/lib/logger';

export interface ModelLoaderState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  loadModel: () => Promise<void>;
  disposeModel: () => void;
}

/**
 * Hook para gestionar la carga del modelo PyTorch
 * 
 * @param autoLoad - Si true, carga automáticamente en mount (default: false)
 * @returns Estado y funciones para gestionar el modelo
 */
export const useModelLoader = (autoLoad: boolean = false): ModelLoaderState => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Carga el modelo PyTorch
   */
  const loadModel = async (): Promise<void> => {
    // Si ya está cargado, no hacer nada
    if (pytorchModel.isLoaded()) {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('[ModelLoader] Loading PyTorch model...');
      await pytorchModel.load();
      setIsLoaded(true);
      logger.info('[ModelLoader] Model loaded successfully');
    } catch (err: unknown) {
      const resolvedError = err instanceof Error ? err : new Error(String(err));
      setError(resolvedError);
      logger.error('[ModelLoader] Error loading model', { error: resolvedError });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Libera recursos del modelo
   */
  const disposeModel = () => {
    pytorchModel.dispose();
    setIsLoaded(false);
    logger.info('[ModelLoader] Model disposed');
  };

  /**
   * Auto-load en mount si está habilitado
   */
  useEffect(() => {
    const aiEnabled = import.meta.env.VITE_AI_NATIVE_ENABLED === 'true';
    
    if (autoLoad && aiEnabled) {
      loadModel();
    }

    // Cleanup en unmount
    return () => {
      // No dispose automáticamente, el modelo es singleton
      // y puede estar siendo usado por otros componentes
    };
  }, [autoLoad]);

  return {
    isLoading,
    isLoaded,
    error,
    loadModel,
    disposeModel,
  };
};

/**
 * Hook simplificado que retorna solo el estado de carga
 */
export const useIsModelLoaded = (): boolean => {
  const [isLoaded, setIsLoaded] = useState(pytorchModel.isLoaded());

  useEffect(() => {
    // Verificar cada segundo si el modelo se cargó
    const interval = setInterval(() => {
      setIsLoaded(pytorchModel.isLoaded());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return isLoaded;
};


