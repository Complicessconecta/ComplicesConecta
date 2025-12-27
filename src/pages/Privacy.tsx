import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Database, Cookie, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { Badge } from '@/components/ui/badge';

const Privacy = () => {
  const _navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      
      <div className="relative z-10">
        
        <main className="container mx-auto px-4 py-8">

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              PolÃ­tica de Privacidad
              <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                ComplicesConecta
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              CÃ³mo protegemos y utilizamos su informaciÃ³n personal
            </p>
            <Badge variant="secondary" className="mt-4 bg-white/10 border-white/30 text-white backdrop-blur-sm">
              <Shield className="h-4 w-4 mr-1" />
              Ãšltima actualizaciÃ³n: Noviembre 2025 - v3.5.0
            </Badge>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* IntroducciÃ³n */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5 text-purple-300" />
                  1. IntroducciÃ³n
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  En ComplicesConecta, valoramos profundamente su privacidad. Esta polÃ­tica explica cÃ³mo 
                  recopilamos, utilizamos y protegemos su informaciÃ³n personal cuando utiliza nuestra plataforma 
                  de conexiones para adultos.
                </p>
                <p className="text-white/80">
                  Nos comprometemos a mantener la confidencialidad y seguridad de sus datos personales, 
                  especialmente considerando la naturaleza sensible de nuestra plataforma.
                </p>
              </CardContent>
            </Card>

            {/* InformaciÃ³n que Recopilamos */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5 text-purple-300" />
                  2. InformaciÃ³n que Recopilamos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">InformaciÃ³n de Registro:</h4>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>Nombre, edad y ubicaciÃ³n</li>
                    <li>DirecciÃ³n de correo electrÃ³nico</li>
                    <li>Preferencias y orientaciÃ³n</li>
                    <li>FotografÃ­as de perfil</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">InformaciÃ³n de Uso:</h4>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>Actividad en la plataforma</li>
                    <li>Mensajes y comunicaciones</li>
                    <li>Preferencias de bÃºsqueda</li>
                    <li>Datos de geolocalizaciÃ³n (con su consentimiento)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">InformaciÃ³n TÃ©cnica:</h4>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>DirecciÃ³n IP y datos del dispositivo</li>
                    <li>InformaciÃ³n del navegador</li>
                    <li>Cookies y tecnologÃ­as similares</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* CÃ³mo Utilizamos su InformaciÃ³n */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">3. CÃ³mo Utilizamos su InformaciÃ³n</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  <strong className="text-white">Servicios de la plataforma:</strong> Para facilitar conexiones, mostrar perfiles 
                  compatibles y gestionar su cuenta.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">ComunicaciÃ³n:</strong> Para enviar notificaciones importantes, actualizaciones 
                  del servicio y responder a sus consultas.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Seguridad:</strong> Para verificar identidades, prevenir fraudes y mantener 
                  un ambiente seguro.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Mejoras del servicio:</strong> Para analizar el uso de la plataforma y mejorar 
                  nuestras funcionalidades.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Cumplimiento legal:</strong> Cumplimos con GDPR, LFPDPPP (MÃ©xico) y Ley 
                  Olimpia. Cuando sea requerido por ley o para proteger nuestros derechos legales.
                </p>
              </CardContent>
            </Card>

            {/* Compartir InformaciÃ³n */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">4. Compartir su InformaciÃ³n</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  <strong className="text-white">Con otros usuarios:</strong> Su perfil e informaciÃ³n bÃ¡sica son visibles para 
                  otros usuarios segÃºn sus configuraciones de privacidad.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Proveedores de servicios:</strong> Compartimos datos limitados con proveedores 
                  que nos ayudan a operar la plataforma (hosting, pagos, anÃ¡lisis).
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Cumplimiento legal:</strong> Podemos divulgar informaciÃ³n cuando sea requerido 
                  por autoridades legales o para proteger la seguridad.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Nunca vendemos:</strong> No vendemos su informaciÃ³n personal a terceros para 
                  fines comerciales.
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Cookie className="h-5 w-5 text-purple-300" />
                  5. Cookies y TecnologÃ­as Similares
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  <strong className="text-white">Cookies esenciales:</strong> Necesarias para el funcionamiento bÃ¡sico del sitio.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Cookies de rendimiento:</strong> Nos ayudan a entender cÃ³mo los usuarios 
                  interactan con la plataforma.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Cookies de personalizaciÃ³n:</strong> Permiten recordar sus preferencias y 
                  configuraciones.
                </p>
                <p className="text-white/80">
                  Puede gestionar sus preferencias de cookies en la configuraciÃ³n de su navegador.
                </p>
              </CardContent>
            </Card>

            {/* Seguridad */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5 text-purple-300" />
                  6. Seguridad de Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  <strong className="text-white">EncriptaciÃ³n AES-GCM:</strong> Utilizamos encriptaciÃ³n de grado militar 
                  para proteger la transmisiÃ³n y almacenamiento de datos.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Row Level Security (RLS):</strong> 122 polÃ­ticas RLS activas protegiendo 
                  acceso a datos sensibles a nivel de base de datos.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">VerificaciÃ³n IA de Consentimiento:</strong> Sistema proactivo de detecciÃ³n 
                  de consentimiento en chats (Ley Olimpia compliance).
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Monitoreo 24/7:</strong> Supervisamos continuamente nuestros sistemas 
                  con Sentry, New Relic y Datadog para detectar vulnerabilidades.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Respaldo seguro:</strong> Sus datos se almacenan de forma segura con 
                  copias de seguridad regulares y geo-redundancia.
                </p>
              </CardContent>
            </Card>

            {/* Sus Derechos */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">7. Sus Derechos de Privacidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  <strong className="text-white">Acceso:</strong> Puede solicitar una copia de sus datos personales.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">CorrecciÃ³n:</strong> Puede actualizar o corregir informaciÃ³n inexacta.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">EliminaciÃ³n:</strong> Puede solicitar la eliminaciÃ³n de su cuenta y datos.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Portabilidad:</strong> Puede solicitar sus datos en un formato transferible.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">ObjeciÃ³n:</strong> Puede oponerse al procesamiento de sus datos para 
                  ciertos fines.
                </p>
              </CardContent>
            </Card>

            {/* RetenciÃ³n de Datos */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">8. RetenciÃ³n de Datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/80">
                  Conservamos su informaciÃ³n personal solo durante el tiempo necesario para 
                  proporcionar nuestros servicios y cumplir con obligaciones legales.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">Cuenta activa:</strong> Mientras mantenga su cuenta activa.
                </p>
                <p className="text-white/80">
                  <strong className="text-white">DespuÃ©s de la eliminaciÃ³n:</strong> Algunos datos pueden conservarse 
                  por razones legales o de seguridad hasta 7 aÃ±os.
                </p>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-purple-300" />
                  9. Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Para preguntas sobre esta polÃ­tica de privacidad o para ejercer sus derechos:
                </p>
                <p className="text-white/80 mt-2">
                  <strong className="text-white">Email:</strong> <a href="mailto:privacy@complicesconecta.com" className="text-purple-300 hover:underline hover:text-purple-200">privacy@complicesconecta.com</a><br />
                  <strong className="text-white">Responsable de ProtecciÃ³n de Datos:</strong> <a href="mailto:dpo@complicesconecta.com" className="text-purple-300 hover:underline hover:text-purple-200">dpo@complicesconecta.com</a><br />
                  <strong className="text-white">DirecciÃ³n:</strong> Ciudad de MÃ©xico, MÃ©xico
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Privacy;


