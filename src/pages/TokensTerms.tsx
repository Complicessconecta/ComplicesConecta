import { Button } from "@/components/ui/buttons/Button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards/Card';
import { ArrowLeft, FileText, AlertTriangle, Shield, Coins, Users, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TokensTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-hero-gradient">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/90 to-purple-800/90 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/tokens')}
              className="text-white hover:bg-white/20 flex items-center gap-2 btn-accessible bg-transparent border-none"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline truncate">Regresar a Tokens</span>
              <span className="sm:hidden">Regresar</span>
            </Button>
            
            <h1 className="text-lg sm:text-xl font-bold text-white text-center truncate">TÃ©rminos y Condiciones - Tokens</h1>
            
            <Button
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 bg-transparent border-none"
            >
              <span className="hidden sm:inline">Inicio</span>
              <span className="sm:hidden">ðŸ </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            TÃ©rminos y Condiciones
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
              Programa de Tokens CMPX/GTK
            </span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Lee y comprende los tÃ©rminos que rigen el uso de nuestro sistema de tokens y funciones premium.
          </p>
        </div>

        {/* InformaciÃ³n General */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-400" />
              InformaciÃ³n General del Acuerdo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <p><strong className="text-white">Fecha de vigencia:</strong> 3 de septiembre de 2025</p>
            <p><strong className="text-white">VersiÃ³n:</strong> 1.0 - Fase Beta</p>
            <p>
              Al participar en el programa de tokens CMPX/GTK de ComplicesConecta, aceptas estos tÃ©rminos y condiciones. 
              Este acuerdo complementa nuestros TÃ©rminos de Servicio generales.
            </p>
            <div className="bg-blue-900/30 p-4 rounded-lg">
              <p className="text-blue-200">
                <strong>Importante:</strong> Estos tÃ©rminos aplican especÃ­ficamente durante la fase beta. 
                Se actualizarÃ¡n antes del lanzamiento de producciÃ³n con tokens blockchain.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Definiciones */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-6 w-6 text-yellow-400" />
              Definiciones Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Tokens CMPX:</h4>
                <p className="text-sm">
                  Tokens internos digitales sin valor monetario real, utilizados durante la fase beta 
                  para acceder a funciones premium y recompensar participaciÃ³n.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Tokens GTK:</h4>
                <p className="text-sm">
                  Tokens blockchain (ERC20) que reemplazarÃ¡n a CMPX en producciÃ³n, 
                  con valor real y transferibilidad completa.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Sistema de Referidos:</h4>
                <p className="text-sm">
                  Programa que otorga 50 CMPX al invitador y 50 CMPX al invitado 
                  por cada registro exitoso usando cÃ³digos de referido.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Funciones Premium:</h4>
                <p className="text-sm">
                  CaracterÃ­sticas avanzadas de la plataforma que requieren tokens CMPX 
                  para su activaciÃ³n durante la fase beta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Derechos y Obligaciones */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Scale className="h-6 w-6 text-purple-400" />
              Derechos y Obligaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-white/80">
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Tus Derechos:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Ganar tokens CMPX participando legÃ­timamente en el sistema de referidos</li>
                <li>Usar tokens para acceder a funciones premium durante la fase beta</li>
                <li>Consultar tu balance y historial de transacciones en cualquier momento</li>
                <li>Recibir soporte tÃ©cnico para problemas relacionados con tokens</li>
                <li>Ser notificado sobre cambios importantes en el sistema</li>
                <li>Migrar tus CMPX a GTK cuando se active la versiÃ³n de producciÃ³n</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Tus Obligaciones:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Usar el sistema de manera honesta y sin intentar defraudar</li>
                <li>No crear mÃºltiples cuentas para obtener tokens adicionales</li>
                <li>No vender, transferir o intercambiar CMPX fuera de la plataforma</li>
                <li>Reportar errores o problemas tÃ©cnicos que encuentres</li>
                <li>Cumplir con los lÃ­mites mensuales establecidos (500 CMPX/mes)</li>
                <li>Mantener actualizada tu informaciÃ³n de contacto</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Limitaciones y Restricciones */}
        <Card className="bg-gradient-to-r from-orange-900/80 to-red-900/80 backdrop-blur-sm border border-orange-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
              Limitaciones y Restricciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-orange-200 mb-2">Valor de los Tokens:</h4>
                <p className="text-sm">
                  Los tokens CMPX NO tienen valor monetario real durante la fase beta. 
                  Son crÃ©ditos internos de la plataforma sin garantÃ­a de conversiÃ³n a dinero real.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-200 mb-2">LÃ­mites del Sistema:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>MÃ¡ximo 500 CMPX ganables por usuario por mes</li>
                  <li>Un solo cÃ³digo de referido por usuario nuevo</li>
                  <li>No se permiten auto-referidos ni cuentas mÃºltiples</li>
                  <li>Funciones premium limitadas a disponibilidad de tokens</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-200 mb-2">Modificaciones del Sistema:</h4>
                <p className="text-sm">
                  ComplicesConecta se reserva el derecho de modificar, suspender o terminar 
                  el programa de tokens con 30 dÃ­as de aviso previo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsabilidades */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-400" />
              Responsabilidades y LimitaciÃ³n de Responsabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Nuestra Responsabilidad:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Mantener el sistema de tokens funcionando de manera estable</li>
                  <li>Proteger la informaciÃ³n de tokens segÃºn nuestra polÃ­tica de privacidad</li>
                  <li>Procesar recompensas de referidos de manera justa y oportuna</li>
                  <li>Proporcionar soporte tÃ©cnico para problemas legÃ­timos</li>
                  <li>Notificar cambios importantes con anticipaciÃ³n</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">LimitaciÃ³n de Responsabilidad:</h4>
                <div className="bg-red-900/30 p-4 rounded-lg">
                  <p className="text-red-200 text-sm">
                    <strong>IMPORTANTE:</strong> ComplicesConecta no serÃ¡ responsable por:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2 ml-4 text-red-200">
                    <li>PÃ©rdidas financieras derivadas del uso de tokens CMPX</li>
                    <li>Interrupciones temporales del servicio durante mantenimiento</li>
                    <li>Cambios en el valor o utilidad de los tokens</li>
                    <li>Decisiones de inversiÃ³n basadas en la posesiÃ³n de tokens</li>
                    <li>Problemas tÃ©cnicos fuera de nuestro control</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Violaciones y Sanciones */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-yellow-400" />
              Violaciones y Sanciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Conductas Prohibidas:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Crear mÃºltiples cuentas para obtener tokens adicionales</li>
                  <li>Usar bots o automatizaciÃ³n para generar referidos falsos</li>
                  <li>Intentar hackear o manipular el sistema de tokens</li>
                  <li>Vender o intercambiar CMPX fuera de la plataforma</li>
                  <li>Proporcionar informaciÃ³n falsa para obtener tokens</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">Sanciones Aplicables:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-900/30 p-3 rounded-lg">
                    <h5 className="font-semibold text-yellow-200 text-sm">Primera InfracciÃ³n</h5>
                    <p className="text-xs text-yellow-100 mt-1">Advertencia escrita y congelamiento temporal de tokens</p>
                  </div>
                  <div className="bg-orange-900/30 p-3 rounded-lg">
                    <h5 className="font-semibold text-orange-200 text-sm">Segunda InfracciÃ³n</h5>
                    <p className="text-xs text-orange-100 mt-1">PÃ©rdida parcial de tokens y suspensiÃ³n de funciones premium</p>
                  </div>
                  <div className="bg-red-900/30 p-3 rounded-lg">
                    <h5 className="font-semibold text-red-200 text-sm">Tercera InfracciÃ³n</h5>
                    <p className="text-xs text-red-100 mt-1">PÃ©rdida total de tokens y exclusiÃ³n permanente del programa</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TransiciÃ³n a ProducciÃ³n */}
        <Card className="bg-gradient-to-r from-green-900/80 to-blue-900/80 backdrop-blur-sm border border-green-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-6 w-6 text-green-400" />
              TransiciÃ³n a VersiÃ³n de ProducciÃ³n
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <div className="space-y-4">
              <p>
                Cuando ComplicesConecta lance la versiÃ³n de producciÃ³n con tokens GTK blockchain:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-200">MigraciÃ³n de Tokens:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>CMPX se convertirÃ¡n automÃ¡ticamente a GTK</li>
                    <li>Ratio de conversiÃ³n serÃ¡ 1:1 inicialmente</li>
                    <li>Proceso gratuito para todos los usuarios beta</li>
                    <li>NotificaciÃ³n 60 dÃ­as antes de la migraciÃ³n</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-200">Nuevas Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                    <li>Pagos reales con Stripe para funciones premium</li>
                    <li>Transferibilidad completa de tokens GTK</li>
                    <li>Nuevos tÃ©rminos y condiciones actualizados</li>
                    <li>Valor de mercado real para los tokens</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-green-900/30 p-4 rounded-lg">
                <p className="text-green-200">
                  <strong>GarantÃ­a:</strong> Todos los tokens CMPX ganados legÃ­timamente durante la beta 
                  serÃ¡n honrados en la conversiÃ³n a GTK sin pÃ©rdida de valor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto y ResoluciÃ³n de Disputas */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/10">
          <CardHeader>
            <CardTitle className="text-white">Contacto y ResoluciÃ³n de Disputas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Soporte TÃ©cnico:</h4>
                <div className="bg-purple-900/30 p-3 rounded-lg text-sm">
                  <p><strong>Email:</strong> tokens@complicesconecta.com</p>
                  <p><strong>Chat:</strong> Disponible 24/7 en la app</p>
                  <p><strong>Respuesta:</strong> MÃ¡ximo 24 horas</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Disputas Legales:</h4>
                <div className="bg-purple-900/30 p-3 rounded-lg text-sm">
                  <p><strong>JurisdicciÃ³n:</strong> MÃ©xico</p>
                  <p><strong>Ley aplicable:</strong> LegislaciÃ³n mexicana</p>
                  <p><strong>MediaciÃ³n:</strong> Preferida antes de litigio</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aceptacin */}
        <Card className="bg-gradient-to-r from-purple-900/80 to-purple-800/80 backdrop-blur-sm border border-purple-400/30">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4">AceptaciÃ³n de TÃ©rminos</h3>
            <p className="text-white/80 mb-6">
              Al usar el sistema de tokens CMPX/GTK, confirmas que has leÃ­do, entendido y aceptado 
              estos tÃ©rminos y condiciones en su totalidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/tokens-privacy')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Ver PolÃ­tica de Privacidad
              </Button>
              <Button
                onClick={() => navigate('/tokens-info')}
                className="border border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Volver a InformaciÃ³n de Tokens
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



