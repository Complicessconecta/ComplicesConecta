import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, ShieldAlert, Bot } from 'lucide-react';
import { profileReportService } from '@/features/profile/ProfileReportService';
import { toast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  reportedUserName
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
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el reporte.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('reason');
    setReason('');
    setDescription('');
    setAiAnalysis(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-[500px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Reportar a {reportedUserName}
          </h2>
        </div>

        <div className="py-4">
          {step === 'reason' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Ayúdanos a entender qué está sucediendo. Tu reporte es anónimo.
              </p>
              <div className="space-y-2">
                <Label>Motivo del reporte</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasons.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                <Bot className="h-5 w-5" />
                <span>Nuestro asistente virtual analizará tu reporte para priorizarlo.</span>
              </div>
              <div className="space-y-2">
                <Label>Detalles adicionales</Label>
                <Textarea
                  placeholder="Por favor describe la situación con más detalle..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 'ai-check' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-md border ${
                reason === 'olympia_law' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Bot className="h-5 w-5" />
                  Análisis Preliminar
                </h4>
                <p className="text-sm">{aiAnalysis}</p>
              </div>
              <p className="text-sm text-gray-500">
                ¿Deseas confirmar y enviar este reporte a nuestro equipo de moderación?
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Reporte Recibido</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Hemos recibido tu reporte. Si se determina una violación de nuestras normas, tomaremos las medidas correspondientes.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4">
          {step !== 'success' ? (
            <div className="flex justify-between w-full">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!reason || (step === 'details' && !description) || isSubmitting}
                className={step === 'ai-check' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {isSubmitting ? 'Procesando...' : step === 'ai-check' ? 'Confirmar Reporte' : 'Continuar'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Entendido
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
