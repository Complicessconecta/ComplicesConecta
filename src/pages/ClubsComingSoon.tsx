import { Building, Clock, Sparkles, Target, Award, Globe, MapPin, Star, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/cards/Card";

const ClubsComingSoon = () => {
  const clubSystemInfo = {
    verificationProcess: [
      {
        step: "1. Registro",
        description: "Completa el formulario con información del club",
        icon: <Building className="h-5 w-5" />,
      },
      {
        step: "2. Documentación",
        description: "Sube documentos legales y flyers",
        icon: <Target className="h-5 w-5" />,
      },
      {
        step: "3. Verificación",
        description: "Proceso de verificación por el equipo",
        icon: <Sparkles className="h-5 w-5" />,
      },
      {
        step: "4. Aprobación",
        description: "Aprobación y asignación de slug único",
        icon: <Award className="h-5 w-5" />,
      },
    ],
    benefits: [
      {
        title: "Página Pública",
        description: "URL única /clubs/{slug} con información completa",
        icon: <Globe className="h-5 w-5" />,
      },
      {
        title: "Check-ins Verificados",
        description: "Sistema de check-in geolocalizado (radio 50m)",
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        title: "Reseñas Auténticas",
        description: "Solo usuarios con check-in real pueden reseñar",
        icon: <Star className="h-5 w-5" />,
      },
      {
        title: "Flyers Editables",
        description: "Flyers con watermark automático mediante IA",
        icon: <Camera className="h-5 w-5" />,
      },
      {
        title: "Publicidad Premium",
        description: "Oportunidades de promoción en la plataforma",
        icon: <Award className="h-5 w-5" />,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-400/50 rounded-full px-4 py-2 mb-6">
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Próximamente</span>
          </div>
          <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white mb-6 leading-tight">
            Clubs
            <span className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}
              Verificados
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Descubre clubs auténticos con check-ins geolocalizados, reseñas
            verificadías y sistema de watermark automático
          </p>
        </motion.div>

        {/* Sistema de Verificación Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-linear-to-r from-green-500 to-emerald-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                Sistema de Clubs Verificados
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Proceso riguroso de verificación para garantizar clubs
                auténticos y experiencias seguras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Proceso de Verificación */}
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-400" />
                    Proceso de Verificación
                  </h4>
                  <div className="space-y-4">
                    {clubSystemInfo.verificationProcess.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="p-2 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg text-white shrink-0">
                          {step.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-white">
                            {step.step}
                          </h5>
                          <p className="text-white/70 text-sm">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beneficios */}
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Beneficios de Verificación
                  </h4>
                  <div className="space-y-3">
                    {clubSystemInfo.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="p-2 bg-linear-to-r from-purple-500 to-fuchsia-600 rounded-lg text-white shrink-0">
                          {benefit.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-white">
                            {benefit.title}
                          </h5>
                          <p className="text-white/70 text-sm">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ventajas de Vinculación con ComplicesConecta */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card className="bg-linear-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Sparkles className="h-6 w-6" />
                Ventajas de Estar Vinculado con ComplicesConecta
              </CardTitle>
              <CardDescription className="text-white/70">
                Descubre todos los beneficios exclusivos para clubs verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-green-500 to-emerald-600 rounded-lg">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Página Pública Profesional</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    URL única /clubs/{'{slug}'} con información completa, galería de fotos y calendario de eventos
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-blue-500 to-cyan-600 rounded-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Check-ins Verificados</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    Sistema geolocalizado (radio 50m) con WorldID para verificación auténtica
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-yellow-500 to-orange-600 rounded-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Reseñas Auténticas</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    Solo usuarios con check-in real pueden reseñar, garantizando opiniones genuinas
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-purple-500 to-fuchsia-600 rounded-lg">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Flyers Editables con IA</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    Watermark automático, blur en imágenes sensibles y moderación antes de publicar
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-pink-500 to-rose-600 rounded-lg">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Publicidad Premium</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    Destacado en Discover, banners promocionales y promoción de eventos VIP
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-r from-indigo-500 to-violet-600 rounded-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Integración con Tokens</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    Sistema de descuentos con CMPX, beneficios especiales para holders de GTK y usuarios premium
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximamente Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-linear-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-yellow-400/50 shadow-2xl">
            <CardContent className="p-8 text-center">
              <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Lanzamiento Estimado: Q2 2026
              </h3>
              <p className="text-white/80 max-w-2xl mx-auto">
                Estamos trabajando arduamente para traerte la mejor experiencia de clubs verificados.
                Mientras tanto, puedes registrarte para ser uno de los primeros clubs en unirse.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ClubsComingSoon;

