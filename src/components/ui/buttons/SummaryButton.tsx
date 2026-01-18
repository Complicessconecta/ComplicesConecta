
/**
 * SummaryButton Component
 *
 * Botón para generar resúmenes automáticos de conversaciones usando AI (GPT-4/BART)
 *
 * Features:
 * - Genera resúmenes con un clic
 * - Muestra loading state durante generación
 * - Abre modal con el resumen generado
 * - Rate limiting: 10 resúmenes/día
 * - Cache de 24 horas
 *
 * @example
 * ```tsx
 * <SummaryButton chatId="123" />
 * ```
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/buttons/Button";
import { Sparkles, Loader2 } from "lucide-react";
import { useChatSummary } from "@/features/chat/useChatSummary";
import { SummaryModal } from "@/components/modals/SummaryModal";
import { cn } from "@/shared/lib/cn";
import React from "react";

interface SummaryButtonProps {
  chatId: string;
  className?: string;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({
  chatId,
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { summary, isLoading, error, usageStats, generateSummary, clearError } =
    useChatSummary();
  const { toast } = useToast();

  useEffect(() => {
    if (error && !isModalOpen) {
      toast({
        title: "Error al generar resumen",
        description: String(error),
        variant: "destructive",
      });
      clearError(); // Limpiar el error después de mostrar el toast
    }
  }, [error, isModalOpen, toast, clearError]);

  const handleClick = async () => {
    // Check rate limit
    if (usageStats && usageStats.usedToday >= usageStats.limit) {
      toast({
        title: "Límite alcanzado",
        description: `Has alcanzado el límite de ${usageStats.limit} resúmenes por día. Intenta mañana.`,
        variant: "destructive",
      });
      return;
    }

    // Generate summary and open modal; SummaryModal renders only if summary exists
    await generateSummary(chatId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    clearError();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(className)}
        title="Generar resumen de conversación con IA"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Resumen IA
          </>
        )}
      </Button>

      {summary && (
        <SummaryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          summary={summary}
          error={error ? error.message : null}
        />
      )}
    </>
  );
};
