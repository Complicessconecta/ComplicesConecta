import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards/Card';

export interface ConsentDocument {
  id: string;
  title: string;
  type: 'terms' | 'privacy' | 'disclaimer';
  version: string;
  content: string;
  required: boolean;
}

export interface UserConsent {
  id: string;
  club_id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  accepted_at: string;
  ip_address: string;
  user_agent: string;
}

interface ClubConsentManagerProps {
  clubId: string;
  userId: string;
  onConsentComplete?: (consents: UserConsent[]) => void;
  onConsentError?: (error: string) => void;
}

const ClubConsentManager: React.FC<ClubConsentManagerProps> = ({
  clubId,
  userId,
  onConsentComplete,
  onConsentError
}) => {
  const [documents, setDocuments] = useState<ConsentDocument[]>([]);
  const [acceptedConsents, setAcceptedConsents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<ConsentDocument | null>(null);

  // Documentos de consentimiento para clubs
  const getClubDocuments = (): ConsentDocument[] => [
    {
      id: 'club-terms',
      title: 'Términos y Condiciones del Club',
      type: 'terms',
      version: '1.0.0',
      content: `
TÉRMINOS Y CONDICIONES DEL CLUB

1. ACEPTACIÓN DE TÉRMINOS
Al registrarte como administrador de un club en CómplicesConecta, aceptas estos términos y condiciones.

2. RESPONSABILIDADES DEL ADMINISTRADOR
- Mantener información actualizada y veraz
- Cumplir con todas las leyes y regulaciones aplicables
- Garantizar la seguridad de los miembros del club
- Respetar las políticas de la plataforma

3. CONTENIDO Y CONDUCTA
- Prohibido contenido ilegal o ofensivo
- Respetar la privacidad de los miembros
- No discriminación por género, orientación, raza o religión

4. COSTOS Y PAGOS
- Los administradores son responsables de los costos operativos
- Transparencia en tarifas y membresías
- Política de reembolso claramente establecida

5. SEGURIDAD Y UBICACIÓN
- Mantener medidas de seguridad adecuadas
- Cumplir con regulaciones de capacidad y seguridad
- Responsabilidad sobre incidentes en el local

6. SUSPENSIÓN Y TERMINACIÓN
- Incumplimiento de términos puede resultar en suspensión
- Derecho a terminar la relación con previo aviso
- Proceso de apelación disponible

7. PROPIEDAD INTELECTUAL
- Respetar derechos de autor y marcas registradas
- Contenido generado pertenece al club y plataforma

8. LIMITACIÓN DE RESPONSABILIDAD
- La plataforma no es responsable de incidentes en clubs
- Uso del servicio es bajo propio riesgo

Al aceptar estos términos, confirmas entender y cumplir con todas las obligaciones establecidas.
      `.trim(),
      required: true
    },
    {
      id: 'club-privacy',
      title: 'Política de Privacidad del Club',
      type: 'privacy',
      version: '1.0.0',
      content: `
POLÍTICA DE PRIVACIDAD DEL CLUB

1. RECOLECCIÓN DE DATOS
Recopilamos información necesaria para la administración del club:
- Información de contacto del administrador
- Datos operativos del club
- Información de miembros (con consentimiento)

2. USO DE INFORMACIÓN
- Gestión de reservaciones y membresías
- Comunicación con miembros
- Mejora de servicios
- Cumplimiento legal

3. PROTECCIÓN DE DATOS
- Encriptación de información sensible
- Acceso restringido a personal autorizado
- Medidas de seguridad físicas y digitales
- Respaldos regulares

4. DERECHOS DEL USUARIO
- Acceso a información personal
- Corrección de datos inexactos
- Eliminación de cuenta (sujeto a términos)
- Portabilidad de datos

5. COOKIES Y TECNOLOGÍAS
- Uso de cookies para funcionalidad básica
- Analytics para mejorar servicios
- Opción de desactivar cookies no esenciales

6. COMPARTIR INFORMACIÓN
- No vendemos información personal a terceros
- Compartimos solo con consentimiento explícito
- Proveedores de servicios con acuerdos de confidencialidad

7. RETENCIÓN DE DATOS
- Conservamos información mientras sea necesario
- Eliminación segura de datos no requeridos
- Cumplimiento con períodos de retención legal

8. SEGURIDAD
- Actualizaciones regulares de seguridad
- Monitoreo de actividades sospechosas
- Notificación de brechas de seguridad

9. MENORES
- No recolectamos información de menores sin consentimiento parental
- Medidas especiales para proteger datos de menores

10. CAMBIOS A LA POLÍTICA
- Notificaremos cambios significativos
- Versión actual siempre disponible
- Continuo uso implica aceptación

Para preguntas sobre privacidad, contacta a privacy@complicesconecta.com
      `.trim(),
      required: true
    },
    {
      id: 'club-disclaimer',
      title: 'Aviso Legal y Descargo de Responsabilidad',
      type: 'disclaimer',
      version: '1.0.0',
      content: `
AVISO LEGAL Y DESCARGO DE RESPONSABILIDAD

1. NATURALEZA DEL SERVICIO
CómplicesConecta es una plataforma que conecta usuarios con clubs de adultos. No somos responsables de las actividades, servicios o conducta dentro de los clubs.

2. RESPONSABILIDAD DEL ADMINISTRADOR
El administrador del club es el único responsable de:
- Cumplimiento con todas las leyes locales y federales
- Licencias y permisos necesarios
- Seguridad y bienestar de los asistentes
- Calidad de los servicios ofrecidos

3. RIESGOS Y ASUMCIÓN
Los usuarios reconocen y aceptan que:
- La asistencia a clubs conlleva riesgos inherentes
- La plataforma no garantiza la seguridad en los locales
- Es responsabilidad personal evaluar riesgos

4. EXENCIÓN DE RESPONSABILIDAD
CómplicesConecta no es responsable de:
- Incidentes, accidentes o lesiones en los clubs
- Pérdidas, robos o daños a propiedad personal
- Disputas entre usuarios y administradores
- Calidad de servicios o productos ofrecidos

5. INDEMNIZACIÓN
El administrador acuerda indemnizar y mantener libre de responsabilidad a CómplicesConecta por:
- Reclamaciones derivadas de operaciones del club
- Violaciones de leyes o regulaciones
- Daños causados a terceros

6. VERIFICACIÓN DE INFORMACIÓN
Aunque realizamos esfuerzos de verificación:
- No garantizamos la exactitud de toda la información
- Los usuarios deben realizar su propia debida diligencia
- Reportamos información falsa o engañosa

7. CONTROVERSIAS
Para disputas entre usuarios y administradores:
- Recomendamos resolución directa primero
- Mediación disponible a través de la plataforma
- Arbitraje binding como último recurso

8. LEY APLICABLE
Estos términos se rigen por las leyes de México
- Jurisdicción exclusiva de tribunales mexicanos
- Aplicación de tratados internacionales relevantes

9. MODIFICACIONES
Nos reservamos el derecho de modificar estos términos
- Notificación previa a cambios significativos
- Uso continuado implica aceptación

10. CONTACTO LEGAL
Para asuntos legales: legal@complicesconecta.com
Domicilio: Ciudad de México, México

AL USAR ESTA PLATAFORMA, ACEPTAS ESTOS TÉRMINOS EN SU TOTALIDAD.
      `.trim(),
      required: true
    }
  ];

  // Cargar documentos
  useEffect(() => {
    const docs = getClubDocuments();
    setDocuments(docs);
    setLoading(false);
  }, []);

  // Manejar aceptación de documento
  const handleDocumentAccept = (documentId: string) => {
    setAcceptedConsents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  // Ver si todos los documentos requeridos están aceptados
  const allRequiredAccepted = documents
    .filter(doc => doc.required)
    .every(doc => acceptedConsents.has(doc.id));

  // Enviar consentimientos
  const handleSubmitConsents = async () => {
    if (!allRequiredAccepted) {
      onConsentError?.('Debes aceptar todos los documentos requeridos');
      return;
    }

    setSubmitting(true);
    try {
      // Simular envío a backend
      const consents: UserConsent[] = Array.from(acceptedConsents).map(consentId => {
        const doc = documents.find(d => d.id === consentId);
        return {
          id: `consent-${Date.now()}-${Math.random()}`,
          club_id: clubId,
          user_id: userId,
          consent_type: doc?.type || 'unknown',
          consent_version: doc?.version || '1.0.0',
          accepted_at: new Date().toISOString(),
          ip_address: '127.0.0.1', // En producción, obtener IP real
          user_agent: navigator.userAgent
        };
      });

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      onConsentComplete?.(consents);
    } catch (error) {
      console.error('Error submitting consents:', error);
      onConsentError?.('Error al guardar consentimientos');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consentimientos Legales del Club
          </CardTitle>
          <CardDescription>
            Debes revisar y aceptar los siguientes documentos para continuar con la creación del club.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.map((document) => (
            <Card key={document.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{document.title}</h3>
                      <Badge variant={document.required ? "default" : "secondary"}>
                        {document.required ? "Requerido" : "Opcional"}
                      </Badge>
                      <Badge variant="outline">
                        v{document.version}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Tipo: {document.type === 'terms' ? 'Términos' : 
                            document.type === 'privacy' ? 'Privacidad' : 'Aviso Legal'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDocument(document)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedConsents.has(document.id)}
                        onChange={() => handleDocumentAccept(document.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Acepto</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!allRequiredAccepted && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Debes aceptar todos los documentos requeridos para continuar.
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSubmitConsents}
              disabled={!allRequiredAccepted || submitting}
              className="min-w-32"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Consentimientos
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver documento completo */}
      {currentDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{currentDocument.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDocument(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {currentDocument.content}
                </pre>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setCurrentDocument(null)}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClubConsentManager;
