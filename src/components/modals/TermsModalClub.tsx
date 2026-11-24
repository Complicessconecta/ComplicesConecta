/**
 * Modal de Términos de Uso para Clubs
 * Espejo de TermsModalSingle/Couple pero con los términos específicos de
 * clubs (registro, +18, seguridad, eventos). El documento completo está en
 * docs/legal/TERMINOS_USO_CLUBS.md y la privacidad en
 * docs/legal/CLUBS_PRIVACY_POLICY.md.
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/buttons/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, FileText, Shield, Building } from "lucide-react";

interface TermsModalClubProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean) => void;
  title?: string;
}

export const TermsModalClub: React.FC<TermsModalClubProps> = ({
  isOpen,
  onClose,
  onAccept,
  title = "Términos de Uso para Clubs",
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);

  const handleAccept = () => {
    if (termsAccepted && privacyAccepted) {
      onAccept(termsAccepted, privacyAccepted);
      onClose();
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setShowFullTerms(false);
    setShowFullPrivacy(false);
    onClose();
  };

  const canProceed = termsAccepted && privacyAccepted;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Resumen de Términos de Uso para Clubs */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Términos de Uso para Clubs - Resumen
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullTerms(!showFullTerms)}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {showFullTerms ? "Ocultar" : "Ver completo"}
                </Button>
              </div>

              {!showFullTerms ? (
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    • <strong>Registro:</strong> Debes ser el propietario legal
                    del club o su representante autorizado, mayor de 18 años. La
                    solicitud queda en revisión (pending) y la activación está
                    sujeta a verificación.
                  </p>
                  <p>
                    • <strong>Mayoría de edad:</strong> ComplicesConecta es solo
                    para adultos (+18). El club no debe admitir ni promover el
                    acceso de menores de edad.
                  </p>
                  <p>
                    • <strong>Seguridad y consentimiento:</strong> El club debe
                    garantizar un entorno seguro, respetar el consentimiento de
                    los asistentes y no difundir imágenes sin autorización.
                  </p>
                  <p>
                    • <strong>Veracidad:</strong> La información del club
                    (nombre, ubicación, capacidad, horarios, precios) debe ser
                    real y mantenerse actualizada.
                  </p>
                  <p>
                    • <strong>Eventos y descuentos:</strong> Los eventos y
                    promociones publicados deben ser reales y honrarse en los
                    términos anunciados.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    Los términos completos están en el documento{" "}
                    <strong>TERMINOS_USO_CLUBS.md</strong> (docs/legal). En
                    resumen: registro sujeto a verificación, cuenta temporal de
                    30 días que debe cambiarse en el primer acceso, prohibición
                    de menores de 18 años, obligación de seguridad y
                    consentimiento, veracidad de la información, eventos y
                    descuentos reales, y suspensión por incumplimiento reiterado
                    o incidentes no atendidos.
                  </p>
                  <p>
                    ComplicesConecta es una plataforma de intermediación: el
                    club es el único responsable de sus instalaciones, su
                    personal, sus eventos y el cumplimiento de la normativa
                    local aplicable.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-4">
                <Checkbox
                  id="terms-club"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked === true)
                  }
                />
                <label
                  htmlFor="terms-club"
                  className="text-sm font-medium leading-tight cursor-pointer"
                >
                  Acepto los Términos de Uso para Clubs
                </label>
              </div>
            </div>

            {/* Resumen de Política de Privacidad para Clubs */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Política de Privacidad para Clubs - Resumen
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPrivacy(!showFullPrivacy)}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {showFullPrivacy ? "Ocultar" : "Ver completo"}
                </Button>
              </div>

              {!showFullPrivacy ? (
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    • <strong>Datos del club:</strong> Nombre, domicilio,
                    contacto comercial y documentos se usan para verificar el
                    registro y mostrar el perfil público del club.
                  </p>
                  <p>
                    • <strong>Datos personales:</strong> Los datos de
                    propietarios y representantes no se muestran públicamente;
                    solo se comparten de forma controlada cuando el club lo
                    autoriza (por ejemplo, al hacer check-in).
                  </p>
                  <p>
                    • <strong>Consentimiento:</strong> El club otorga su
                    consentimiento para que ComplicesConecta muestre su perfil
                    público (nombre, descripción, ubicación aproximada, fotos y
                    eventos) a los usuarios.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    La política completa está en el documento{" "}
                    <strong>CLUBS_PRIVACY_POLICY.md</strong> (docs/legal). Cubre
                    los datos de propietarios y del club, cómo se comparten con
                    usuarios de forma controlada, y los derechos del club sobre
                    sus datos.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-4">
                <Checkbox
                  id="privacy-club"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) =>
                    setPrivacyAccepted(checked === true)
                  }
                />
                <label
                  htmlFor="privacy-club"
                  className="text-sm font-medium leading-tight cursor-pointer"
                >
                  Acepto la Política de Privacidad para Clubs
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleAccept} disabled={!canProceed}>
            Aceptar y continuar
          </Button>
        </DialogFooter>

        {(!termsAccepted || !privacyAccepted) && (
          <p className="text-xs text-gray-500 text-center">
            Debes aceptar los términos y la política de privacidad para
            registrar el club.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
