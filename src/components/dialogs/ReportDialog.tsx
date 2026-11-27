import { useState } from "react";
import {
  Flag,
  AlertTriangle,
  UserX,
  MessageSquareOff,
  Camera,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Modal";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/useToast";
import { reportService } from "@/services/social";

interface ReportDialogProps {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onReport: (reason: string) => void;
}

export const ReportDialog = ({
  profileId,
  profileName,
  isOpen,
  onOpenChange,
  onReport,
}: ReportDialogProps) => {
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [blockUser, setBlockUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const reportReasons = [
    {
      id: "fake-profile",
      label: "Perfil falso",
      description: "Fotos falsas o información engañosa",
      icon: <UserX className="h-4 w-4" />,
    },
    {
      id: "inappropriate-content",
      label: "Contenido inapropiado",
      description: "Fotos o descripción ofensiva",
      icon: <Camera className="h-4 w-4" />,
    },
    {
      id: "harassment",
      label: "Acoso o comportamiento abusivo",
      description: "Mensajes ofensivos o acoso",
      icon: <MessageSquareOff className="h-4 w-4" />,
    },
    {
      id: "spam",
      label: "Spam o promoción no deseada",
      description: "Promoción de servicios o spam",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: "underage",
      label: "Menor de edad",
      description: "Parece ser menor de 18 años",
      icon: <Flag className="h-4 w-4" />,
    },
    {
      id: "scam",
      label: "Estafa o fraude",
      description: "Intento de estafa o solicitud de dinero",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: "terms-violation",
      label: "Infringe los términos y condiciones",
      description: "Viola los términos y condiciones de la plataforma",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      id: "impersonation",
      label: "Suplantación de identidad",
      description: "Se hace pasar por otra persona",
      icon: <User className="h-4 w-4" />,
    },
    {
      id: "other",
      label: "Otro motivo",
      description: "Otro motivo no listado arriba",
      icon: <Flag className="h-4 w-4" />,
    },
  ];

  const handleSubmit = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Por favor selecciona un motivo para el reporte",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar reporte usando el servicio
      const result = await reportService.createReport({
        reportedUserId: profileId,
        contentType: "profile",
        reason: reportType,
        ...(description ? { description } : {}),
      });

      if (result.success) {
        onReport(reportType);

        // Mostrar confirmación
        toast({
          title: "Reporte enviado",
          description: `Hemos recibido tu reporte sobre ${profileName}. Lo revisaremos en las próximas 24 horas.`,
        });

        if (blockUser) {
          toast({
            title: "Usuario bloqueado",
            description: `${profileName} ha sido bloqueado y no podrás ver su perfil ni recibir mensajes.`,
          });
        }

        // Resetear formulario
        setReportType("");
        setDescription("");
        setBlockUser(false);
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            result.error || "No se pudo enviar el reporte. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Contraste explícito (no tokens): los tokens primary/muted/
      background son canales HSL sin hsl() y en Tailwind v4 no resuelven
      a color válido, por eso título y motivos se veían en blanco sobre
      blanco aunque existían en el DOM. Fondo claro fijo + texto oscuro
      (y variantes dark:) para que el modal sea legible en ambos temas. */}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Flag className="h-5 w-5 text-destructive" />
            Reportar a {profileName}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-300">
            Tu reporte nos ayuda a mantener la comunidad segura. Toda la
            información será confidencial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Motivos del reporte */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
              ¿Cuál es el motivo del reporte?
            </Label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              {reportReasons.map((reason) => (
                <div
                  key={reason.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RadioGroupItem
                    value={reason.id}
                    id={reason.id}
                    className="mt-1 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={reason.id}
                      className="flex items-center gap-2 cursor-pointer text-slate-900 dark:text-slate-100"
                    >
                      {reason.icon}
                      {reason.label}
                    </Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Descripción adicional */}
          {reportType && (
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-slate-900 dark:text-slate-100"
              >
                Detalles adicionales (opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Proporciona más detalles sobre el problema..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Incluye cualquier información específica que pueda ayudarnos a
                investigar.
              </p>
            </div>
          )}

          {/* Opciones adicionales */}
          <div className="space-y-4 p-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="block-user"
                checked={blockUser}
                onCheckedChange={(checked) => setBlockUser(!!checked)}
                className="border-slate-400 dark:border-slate-500"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="block-user"
                  className="cursor-pointer text-slate-900 dark:text-slate-100"
                >
                  Bloquear a {profileName}
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No podrás ver su perfil ni recibir mensajes de esta persona.
                </p>
              </div>
            </div>
          </div>

          {/* Información importante */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Información importante
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Los reportes falsos pueden resultar en restricciones en tu
                  cuenta. Solo reporta contenido que viole genuinamente nuestras
                  normas comunitarias.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reportType || isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Reporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
