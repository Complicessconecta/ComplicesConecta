/**
 * Modal de TÃ©rminos y PolÃ­ticas de Privacidad
 * Componente reutilizable para mostrar tÃ©rminos con checkbox obligatorio
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/buttons/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, FileText, Shield } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (termsAccepted: boolean, privacyAccepted: boolean) => void;
  title?: string;
}

export const SharedTermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  title = "TÃ©rminos de Uso y PolÃ­tica de Privacidad"
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
            <Shield className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Resumen de TÃ©rminos de Uso */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  TÃ©rminos de Uso - Resumen
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullTerms(!showFullTerms)}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {showFullTerms ? 'Ocultar' : 'Ver completo'}
                </Button>
              </div>
              
              {!showFullTerms ? (
                <div className="text-sm text-gray-700 space-y-2">
                  <p>â€¢ <strong>Edad mÃ­nima:</strong> Debes ser mayor de 18 aÃ±os para usar ComplicesConecta</p>
                  <p>â€¢ <strong>Uso responsable:</strong> Prohibido contenido ofensivo, spam o acoso</p>
                  <p>â€¢ <strong>Veracidad:</strong> La informaciÃ³n del perfil debe ser real y actualizada</p>
                  <p>â€¢ <strong>Respeto:</strong> Trata a otros usuarios con cortesÃ­a y respeto</p>
                  <p>â€¢ <strong>Seguridad:</strong> No compartas informaciÃ³n personal sensible</p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-3 max-h-40 overflow-y-auto">
                  <h4 className="font-medium">1. AceptaciÃ³n de TÃ©rminos</h4>
                  <p>Al registrarte en ComplicesConecta, aceptas cumplir con estos tÃ©rminos de uso y todas las polÃ­ticas aplicables.</p>
                  
                  <h4 className="font-medium">2. Elegibilidad</h4>
                  <p>Debes tener al menos 18 aÃ±os de edad para crear una cuenta. Si eres menor de edad, no puedes usar este servicio.</p>
                  
                  <h4 className="font-medium">3. Conducta del Usuario</h4>
                  <p>Te comprometes a usar la plataforma de manera responsable, sin acosar, amenazar o enviar contenido inapropiado a otros usuarios.</p>
                  
                  <h4 className="font-medium">4. Contenido del Perfil</h4>
                  <p>Toda la informaciÃ³n de tu perfil debe ser veraz y actualizada. Las fotos deben ser tuyas y apropiadas.</p>
                  
                  <h4 className="font-medium">5. Privacidad y Seguridad</h4>
                  <p>No compartas informaciÃ³n personal como nÃºmeros de telÃ©fono, direcciones o datos financieros con otros usuarios.</p>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  He leÃ­do y acepto los TÃ©rminos de Uso
                </label>
              </div>
            </div>

            {/* Resumen de PolÃ­tica de Privacidad */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  PolÃ­tica de Privacidad - Resumen
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPrivacy(!showFullPrivacy)}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {showFullPrivacy ? 'Ocultar' : 'Ver completo'}
                </Button>
              </div>

              {!showFullPrivacy ? (
                <div className="text-sm text-gray-700 space-y-2">
                  <p>â€¢ <strong>Datos recopilados:</strong> InformaciÃ³n de perfil, fotos, mensajes y actividad</p>
                  <p>â€¢ <strong>Uso de datos:</strong> Mejorar el servicio, hacer matches y comunicaciÃ³n</p>
                  <p>â€¢ <strong>Compartir datos:</strong> Solo con otros usuarios segÃºn tu configuraciÃ³n</p>
                  <p>â€¢ <strong>Seguridad:</strong> EncriptaciÃ³n y medidas de protecciÃ³n implementadas</p>
                  <p>â€¢ <strong>Tus derechos:</strong> Acceso, correcciÃ³n y eliminaciÃ³n de tus datos</p>
                </div>
              ) : (
                <div className="text-sm text-gray-700 space-y-3 max-h-40 overflow-y-auto">
                  <h4 className="font-medium">1. InformaciÃ³n que Recopilamos</h4>
                  <p>Recopilamos informaciÃ³n que nos proporcionas directamente, como datos de perfil, fotos, mensajes y preferencias.</p>
                  
                  <h4 className="font-medium">2. CÃ³mo Usamos tu InformaciÃ³n</h4>
                  <p>Usamos tus datos para crear tu perfil, sugerir matches compatibles, facilitar la comunicaciÃ³n y mejorar nuestros servicios.</p>
                  
                  <h4 className="font-medium">3. Compartir InformaciÃ³n</h4>
                  <p>Tu informaciÃ³n de perfil se comparte con otros usuarios segÃºn tu configuraciÃ³n de privacidad. No vendemos tus datos a terceros.</p>
                  
                  <h4 className="font-medium">4. Seguridad de Datos</h4>
                  <p>Implementamos medidas de seguridad tÃ©cnicas y organizacionales para proteger tu informaciÃ³n personal.</p>
                  
                  <h4 className="font-medium">5. Tus Derechos</h4>
                  <p>Puedes acceder, corregir o eliminar tu informaciÃ³n personal en cualquier momento desde tu perfil o contactÃ¡ndonos.</p>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                />
                <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                  He leÃ­do y acepto la PolÃ­tica de Privacidad
                </label>
              </div>
            </div>

            {/* Mensaje de advertencia si no se han aceptado */}
            {(!termsAccepted || !privacyAccepted) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Debes aceptar tanto los TÃ©rminos de Uso como la PolÃ­tica de Privacidad para continuar con el registro.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!canProceed}
            className={canProceed ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {canProceed ? 'Acepto y ContinÃºo' : 'Debe aceptar ambos tÃ©rminos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


