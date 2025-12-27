import React from 'react';
import { Shield, AlertTriangle, Phone, Mail, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { useNavigate } from 'react-router-dom';

const LeyOlimpia: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate(-1)}
            className="mr-4 bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-red-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Ley Olimpia - ProtecciÃ³n Digital</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Â¿QuÃ© es la Ley Olimpia? */}
            <Card className="bg-white/10 border-red-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  Â¿QuÃ© es la Ley Olimpia?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90 space-y-4">
                <p>
                  La <strong>Ley Olimpia</strong> es un conjunto de reformas legislativas en MÃ©xico que reconocen la 
                  <strong> violencia digital</strong> como un delito. Fue nombrada en honor a Olimpia Coral Melo, 
                  activista que luchÃ³ contra la difusiÃ³n no consensuada de contenido Ã­ntimo.
                </p>
                <p>
                  Esta ley <strong>protege a las vÃ­ctimas</strong> de la difusiÃ³n no autorizada de imÃ¡genes, videos 
                  o audios de contenido sexual o erÃ³tico, conocido como "revenge porn" o "porno venganza".
                </p>
              </CardContent>
            </Card>

            {/* Nuestro Compromiso */}
            <Card className="bg-white/10 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 text-purple-400 mr-2" />
                  Nuestro Compromiso en ComplicesConecta
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-500/20 p-4 rounded-lg border border-green-400/30">
                    <h4 className="font-semibold text-green-400 mb-2">âœ… Cumplimiento Total</h4>
                    <p className="text-sm">Respetamos y aplicamos estrictamente todas las disposiciones de la Ley Olimpia.</p>
                  </div>
                  <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-400/30">
                    <h4 className="font-semibold text-blue-400 mb-2">ðŸ”’ ProtecciÃ³n Avanzada</h4>
                    <p className="text-sm">Implementamos medidas tÃ©cnicas para prevenir la difusiÃ³n no consensuada.</p>
                  </div>
                  <div className="bg-orange-500/20 p-4 rounded-lg border border-orange-400/30">
                    <h4 className="font-semibold text-orange-400 mb-2">âš¡ Respuesta RÃ¡pida</h4>
                    <p className="text-sm">Actuamos inmediatamente ante reportes de violencia digital.</p>
                  </div>
                  <div className="bg-red-500/20 p-4 rounded-lg border border-red-400/30">
                    <h4 className="font-semibold text-red-400 mb-2">ðŸš« Tolerancia Cero</h4>
                    <p className="text-sm">Sancionamos severamente cualquier violaciÃ³n a la privacidad.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medidas de ProtecciÃ³n */}
            <Card className="bg-white/10 border-cyan-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 text-cyan-400 mr-2" />
                  Medidas de ProtecciÃ³n Implementadas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">â€¢</span>
                    <span><strong>Marca de agua obligatoria:</strong> Todas las imÃ¡genes privadas incluyen marca de agua "ComplicesConecta Â© Privado"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">â€¢</span>
                    <span><strong>ProtecciÃ³n anti-copia:</strong> DeshabilitaciÃ³n de clic derecho, arrastrar y guardar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">â€¢</span>
                    <span><strong>Control parental:</strong> Sistema de bloqueo para proteger menores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">â€¢</span>
                    <span><strong>ModeraciÃ³n 24/7:</strong> Equipo dedicado para revisar reportes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">â€¢</span>
                    <span><strong>EncriptaciÃ³n de datos:</strong> ProtecciÃ³n avanzada de informaciÃ³n personal</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reportar ViolaciÃ³n */}
            <Card className="bg-red-500/20 border-red-400/50">
              <CardHeader>
                <CardTitle className="text-red-400 text-center">
                  âš ï¸ Reportar ViolaciÃ³n
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90 space-y-4">
                <p className="text-sm text-center">
                  Si eres vÃ­ctima de violencia digital o conoces un caso, repÃ³rtalo inmediatamente:
                </p>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => window.open('mailto:reportes@complicesconecta.com?subject=Reporte Ley Olimpia', '_blank')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reportar por Email
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open('https://wa.me/5617184109?text=Reporte%20Ley%20Olimpia', '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    WhatsApp Urgente
                  </Button>
                </div>
                <p className="text-xs text-center text-white/70">
                  Respuesta garantizada en menos de 2 horas
                </p>
              </CardContent>
            </Card>

            {/* Recursos Oficiales */}
            <Card className="bg-white/10 border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-blue-400">
                  ðŸ“š Recursos Oficiales
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90 space-y-3">
                <Button
                  variant="outline"
                  className="w-full text-white border-white/30 hover:bg-white/10"
                  onClick={() => window.open('https://www.gob.mx/inmujeres/articulos/ley-olimpia', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ley Olimpia Oficial
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-white border-white/30 hover:bg-white/10"
                  onClick={() => window.open('https://www.gob.mx/conavim', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  CONAVIM
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-white border-white/30 hover:bg-white/10"
                  onClick={() => window.open('tel:911')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Emergencias 911
                </Button>
              </CardContent>
            </Card>

            {/* EstadÃ­sticas */}
            <Card className="bg-white/10 border-yellow-400/30">
              <CardHeader>
                <CardTitle className="text-yellow-400">
                  ðŸ“Š En ComplicesConecta
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/90 space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">0</div>
                  <div className="text-sm">Casos de violencia digital</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">100%</div>
                  <div className="text-sm">Cumplimiento legal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">&lt;2h</div>
                  <div className="text-sm">Tiempo de respuesta</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer de la pÃ¡gina */}
        <div className="mt-12 text-center">
          <p className="text-white/60 text-sm">
            ComplicesConecta se compromete a crear un espacio digital seguro y respetuoso para todos nuestros usuarios.
            <br />
            La violencia digital no tiene lugar en nuestra plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeyOlimpia;


