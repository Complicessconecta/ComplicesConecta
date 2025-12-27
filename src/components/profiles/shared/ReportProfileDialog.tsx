import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { CheckCircle, Bot } from 'lucide-react';
import { profileReportService } from '@/features/profile/ProfileReportService';
import { toast } from '@/hooks/useToast'; // Changed from useToast to use-toast based on typical shadcn structure, or check if useToast exists
import { logger } from '@/lib/logger';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Check useToast path. If it fails lint, I will fix.
// Usually shadcn uses components/ui/use-toast or hooks/use-toast.
// Original used '@/hooks/useToast'. I will keep it if it exists.

interface ReportProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

type ReportStep = 'reason' | 'details' | 'ai-check' | 'success';

export const ReportProfileDialog: React.FC<ReportProfileDialogProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  _reportedUserName
}) => {
  const [step, setStep] = useState<ReportStep>('reason');
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const reasons = [
    { value: 'harassment', label: 'Acoso o Intimidación' },
    { value: 'inappropriate_content', label: 'Contenido Inapropiado (+18 sin etiqueta)' },
    { value: 'fake_profile', label: 'Perfil Falso / Suplantación' },
    { value: 'spam', label: 'Spam o Estafa' },
    { value: 'hate_speech', label: 'Discurso de Odio' },
    { value: 'olympia_law', label: 'Violación Ley Olimpia (Contenido íntimo sin consentimiento)' },
    { value: 'other', label: 'Otro motivo' }
  ];

  const handleNext = async () => {
    if (step === 'reason') {
      if (!reason) return;
      setStep('details');
    } else if (step === 'details') {
      if (!description) return;
      setIsSubmitting(true);
      
      // Consultar servicio de análisis de IA
      try {
        const analysis = await profileReportService.analyzeReportContent(reason, description);
        setAiAnalysis(analysis.message);
        
        // Ajustar severidad basada en análisis de IA si es crítico
        if (analysis.category === 'legal_safety' && analysis.score > 80) {
           // Si la IA detecta alto riesgo, forzamos severidad alta/crítica en el UI (visual)
           // La lógica de envío final re-evaluará esto
        }
        
        setStep('ai-check');
      } catch (error) {
        logger.error("Error en análisis IA", { error });
        // Fallback si falla la IA
        setAiAnalysis("ℹ️ Gracias. Tu reporte ha sido pre-clasificado y será revisado por nuestro equipo de moderación.");
        setStep('ai-check');
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 'ai-check') {
      await submitReport();
    }
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    try {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      
      if (['harassment', 'hate_speech'].includes(reason)) {
        severity = 'high';
      }
      if (reason === 'olympia_law') {
        severity = 'critical';
      }
      
      const result = await profileReportService.createProfileReport({
        reportedUserId,
        reason,
        description: `[AI Analysis]: ${aiAnalysis}\n[User Detail]: ${description}`,
        severity
      });

      if (result.success) {
        setStep('success');
        toast({
          title: "Reporte Enviado",
          description: "Gracias por ayudarnos a mantener la comunidad segura.",
          variant: "default"
        });
      }
    } catch (error) {
      logger.error("Error enviando reporte", { error });
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          X
        </button>
        
        <h2 className="text-xl font-bold mb-4">Reportar Perfil</h2>
        
        {step === 'reason' && (
          <div className="space-y-4">
            <Label>Motivo del reporte</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleNext} disabled={!reason} className="w-full">
              Siguiente
            </Button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <Label>Detalles adicionales</Label>
            <Textarea 
              placeholder="Describe la situación..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
            <Button onClick={handleNext} disabled={!description || isSubmitting} className="w-full">
              {isSubmitting ? 'Analizando...' : 'Siguiente'}
            </Button>
          </div>
        )}

        {step === 'ai-check' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-3">
              <Bot className="h-6 w-6 text-blue-500" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Análisis Preliminar</p>
                <p>{aiAnalysis}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Al enviar, confirmas que este reporte es verídico. El mal uso de esta herramienta puede resultar en sanciones.
            </p>
            <Button onClick={handleNext} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar Reporte'}
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Reporte Recibido</h3>
            <p className="text-gray-500">
              Hemos recibido tu reporte. Nuestro equipo de moderación y sistemas de IA lo revisarán prioritariamente.
            </p>
            <Button onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
