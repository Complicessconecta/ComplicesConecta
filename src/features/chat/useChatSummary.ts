/**
 * useChatSummary - Hook React para resúmenes de chat
 * v3.5.0 - Fase 1.3
 * 
 * @version 3.5.0
 * @date 2025-10-30
 */

import { useState } from 'react';
import { chatSummaryService, type ChatSummary } from '@/features/chat/ChatSummaryService';
import { useAuth } from '@/features/auth/useAuth';
import { logger } from '@/lib/logger';

export interface UseChatSummaryResult {
  summary: ChatSummary | null;
  isLoading: boolean;
  error: Error | null;
  usageStats: {
    usedToday: number;
    limit: number;
    remaining: number;
  } | null;
  generateSummary: (chatId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook para generar y gestionar resúmenes de chat
 */
export const useChatSummary = (): UseChatSummaryResult => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [usageStats, setUsageStats] = useState<{
    usedToday: number;
    limit: number;
    remaining: number;
  } | null>(null);

  const generateSummary = async (chatId: string) => {
    if (!user) {
      setError(new Error('Usuario no autenticado'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('[useChatSummary] Generating summary for chat:', { chatId });
      
      const result = await chatSummaryService.generateSummary(chatId, user.id);
      setSummary(result);
      
      // Actualizar estadísticas de uso
      const stats = await chatSummaryService.getUsageStats(user.id);
      setUsageStats(stats);
      
      logger.info('[useChatSummary] Summary generated successfully');
    } catch (err) {
      const error = err as Error;
      logger.error('[useChatSummary] Error generating summary:', { error: error.message });
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    summary,
    isLoading,
    error,
    usageStats,
    generateSummary,
    clearError,
  };
};


