import React, { useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, Shield } from "lucide-react";

/**
 * Ejemplo completo de implementación de hCaptcha
 * Muestra cómo integrar y verificar hCaptcha en un formulario
 */
export const HCaptchaExample: React.FC = () => {
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Site key de hCaptcha (obtener de hcaptcha.com)
  const HCAPTCHA_SITE_KEY =
    (import.meta.env as { VITE_HCAPTCHA_SITE_KEY?: string }).VITE_HCAPTCHA_SITE_KEY ||
    "10000000-ffff-ffff-ffff-000000000001";

  const handleSubmit = async () => {
    setError("El componente @hcaptcha/react-hcaptcha no está instalado. Por favor instale el paquete para usar este ejemplo.");
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
    return;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Ejemplo de Integración hCaptcha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg">
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <p>hCaptcha Widget Placeholder</p>
                <p className="text-sm">
                  Install @hcaptcha/react-hcaptcha to enable
                </p>
              </div>
            </div>
          </div>

          {/* Errores */}
          {error && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón de envío */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Enviando..." : "Enviar Formulario"}
          </Button>

          {/* Información de desarrollo */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Site Key:</strong> {HCAPTCHA_SITE_KEY}
            </p>
            <p>
              <strong>Estado:</strong> Componente no instalado
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
