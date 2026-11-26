import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/** SHA-256 en hex. Fallback a un hash simple si crypto.subtle no está disponible. */
async function sha256Hex(input: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback abajo.
  }
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
}

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

// Ronda 12 (stream D): respaldo local de consentimientos, mismo
// patrón que `club_events_local:` / `club_discounts_local:` en
// `clubContentService`. Sin la columna `user_consents.club_id`
// (migración 20261124030000 sin aplicar) el insert en BD falla con
// 42703 y antes el consentimiento se PERDÍA (solo `onConsentError`).
// Ahora queda guardado en este dispositivo y el flujo continúa con
// los consentimientos locales (id `local-...`). Límite conocido:
// no hay sincronización posterior — al aplicar 30000 estos
// consentimientos locales NO suben solos a BD, igual que los
// eventos/descuentos locales.
const LOCAL_CONSENTS_KEY = (userId: string, clubId: string) =>
  `user_consents_local:${userId}:${clubId}`;

function saveLocalConsents(
  userId: string,
  clubId: string,
  consents: UserConsent[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_CONSENTS_KEY(userId, clubId),
      JSON.stringify(consents),
    );
  } catch {
    // Sin almacenamiento: el consentimiento solo vive en esta sesión.
  }
}

export function readLocalConsents(
  userId: string,
  clubId: string,
): UserConsent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(
      LOCAL_CONSENTS_KEY(userId, clubId),
    );
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserConsent[]) : [];
  } catch {
    return [];
  }
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

  // Enviar consentimientos: guardado real en public.user_consents (con
  // club_id), no simulado. Antes solo llamaba onConsentComplete con objetos
  // locales y nunca persistía nada.
  const handleSubmitConsents = async () => {
    if (!allRequiredAccepted) {
      onConsentError?.('Debes aceptar todos los documentos requeridos');
      return;
    }

    setSubmitting(true);
    try {
      const consentedAt = new Date().toISOString();
      const rows = await Promise.all(
        Array.from(acceptedConsents).map(async (consentId) => {
          const doc = documents.find(d => d.id === consentId);
          if (!doc) return null;
          const consentHash = await sha256Hex(
            `${userId}|${clubId}|${doc.id}|${doc.version}|${consentedAt}`,
          );
          const textHash = await sha256Hex(doc.content);
          return {
            user_id: userId,
            club_id: clubId,
            consent_type: doc.type,
            version: doc.version,
            consented_at: consentedAt,
            consent_hash: consentHash,
            consent_text_hash: textHash,
            document_path: `clubs/${doc.id}-v${doc.version}`,
            is_active: true,
            user_agent: navigator.userAgent,
            ip_address: null,
          };
        }),
      );
      const inserts = rows.filter((r): r is NonNullable<typeof r> => r !== null);
      if (inserts.length === 0) {
        onConsentError?.('No hay consentimientos para guardar');
        return;
      }

      // Ronda 12 (stream D): si el insert en BD falla (p. ej. falta
      // `user_consents.club_id`, migración 30000 sin aplicar), el
      // consentimiento ya no se pierde: se guarda local
      // (`user_consents_local:`) y el flujo continúa con los
      // consentimientos locales. Sin este respaldo, el error solo
      // disparaba `onConsentError` y no quedaba registro del
      // consentimiento en ningún lado.
      let consents: UserConsent[];
      try {
        const { data, error } = await supabase
          .from('user_consents')
          .insert(inserts)
          .select('id, club_id, user_id, consent_type, version, consented_at');

        if (error) throw error;

        consents = (data ?? []).map((row) => ({
          id: row.id,
          club_id: row.club_id ?? clubId,
          user_id: row.user_id,
          consent_type: row.consent_type,
          consent_version: row.version,
          accepted_at: row.consented_at,
          ip_address: '',
          user_agent: navigator.userAgent,
        }));
      } catch (dbError) {
        logger.warn(
          'Consentimientos de club no se pudieron guardar en BD, se guardan local',
          { error: String(dbError), clubId },
        );
        consents = inserts.map((row, i) => ({
          id: `local-${Date.now()}-${i}`,
          club_id: row.club_id ?? clubId,
          user_id: row.user_id,
          consent_type: row.consent_type,
          consent_version: row.version,
          accepted_at: row.consented_at,
          ip_address: '',
          user_agent: navigator.userAgent,
        }));
        saveLocalConsents(userId, clubId, consents);
      }

      logger.info('Consentimientos de club guardados', { count: consents.length, clubId });
      onConsentComplete?.(consents);
    } catch (error) {
      logger.error('Error submitting consents:', { error: String(error) });
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
                {/* RONDA 10 (stream B, B4): la fila era `flex
                    justify-between` con la columna izquierda `flex-1`
                    SIN `min-w-0` y la fila de título sin salto de línea:
                    título + badges "Requerido"/"vX.Y" forzaban un ancho
                    mínimo y el botón "Ver" se recortaba en el borde
                    derecho. Ahora la columna puede encogerse, el título
                    salta de línea y en móvil el bloque Ver/Acepto baja
                    debajo en vez de recortarse. */}
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                  <div className="min-w-0 w-full sm:flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                      <h3 className="font-semibold min-w-0 break-words">{document.title}</h3>
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
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
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
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
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
