import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Info, Briefcase, UserCheck, DollarSign, Heart, Shield, Users, Zap, Smartphone as Android } from "lucide-react";

interface HomeBenefitsSectionProps {
  onOpenModeratorForm: () => void;
  onOpenInstall: () => void;
  onFeatureClick: (featureType: 'connections' | 'verification' | 'events' | 'tokens') => void;
  isRunningInApp: boolean;
}

export const HomeBenefitsSection = ({ 
  onOpenModeratorForm, 
  onOpenInstall, 
  onFeatureClick,
  isRunningInApp 
}: HomeBenefitsSectionProps) => {

  const features = [
    {
      icon: Heart,
      title: "Conexiones Auténticas",
      description: "Algoritmo inteligente que conecta personas con intereses reales en común",
      type: 'connections' as const,
      iconBg: "bg-gradient-to-r from-purple-500 to-purple-600"
    },
    {
      icon: Shield,
      title: "Verificación KYC Avanzada",
      description: "Perfiles verificados con tecnología blockchain y KYC para máxima seguridad y confianza",
      type: 'verification' as const,
      iconBg: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "Eventos Swinger Exclusivos",
      description: "Accede a fiestas privadas, encuentros y eventos exclusivos para la comunidad swinger",
      type: 'events' as const,
      iconBg: "bg-gradient-to-r from-purple-500 to-purple-600"
    },
    {
      icon: Zap,
      title: "Sistema de Tokens CMPX/GTK",
      description: "Gana tokens participando, accede a funciones premium y eventos VIP",
      type: 'tokens' as const,
      iconBg: "bg-gradient-to-r from-amber-500 to-orange-500"
    }
  ];

  return (
    <>
      {/* About, Careers, Donations Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-xl">
              Conoce Más Sobre Nuestra Plataforma
            </h2>
            <p className="text-xl text-white max-w-3xl mx-auto drop-shadow-md">
              Descubre nuestra misión, únete a nuestro equipo o apoya nuestro crecimiento
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* About Section */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full">
                    <Info className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                  Acerca de Nosotros
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-white mb-6 drop-shadow-sm">
                  Conoce nuestra misión, visión y valores. Descubre por qué somos la plataforma más confiable para la comunidad lifestyle.
                </p>
                <Button 
                  variant="default" 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full"
                  asChild
                >
                  <Link to="/about">
                    Conocer Más
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Careers Section */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                  Únete al Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-white drop-shadow-sm mb-6">
                  Forma parte de nuestro equipo innovador. Buscamos talento apasionado por la tecnología y la comunidad lifestyle.
                </p>
                <Button 
                  variant="default" 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full"
                  asChild
                >
                  <Link to="/careers">
                    Ver Vacantes
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Moderator Section */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full">
                    <UserCheck className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                  Ser Moderador
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-white drop-shadow-sm mb-6">
                  Ayuda a mantener una comunidad segura y respetuosa. Únete a nuestro equipo de moderadores voluntarios.
                </p>
                <Button 
                  variant="default" 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full"
                  onClick={onOpenModeratorForm}
                >
                  Aplicar Ahora
                </Button>
              </CardContent>
            </Card>
            
            {/* Donations Section */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-center text-xl drop-shadow-lg">
                  Apoya el Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-white drop-shadow-sm mb-6">
                  Ayúdanos a crecer y mejorar la plataforma. Tu apoyo nos permite seguir innovando para la comunidad.
                </p>
                <Button 
                  variant="default" 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 border border-purple-400 w-full"
                  asChild
                >
                  <Link to="/donations">
                    Donar Ahora
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              ¿Por qué elegir nuestra plataforma?
            </h2>
            <p className="text-xl text-white drop-shadow-sm max-w-3xl mx-auto">
              La plataforma más segura y discreta para la comunidad swinger. Conectamos parejas y solteros 
              con verificación avanzada, tecnología blockchain y total privacidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center group hover:transform hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onFeatureClick(feature.type)}
              >
                <div className="bg-card-gradient rounded-2xl p-8 shadow-soft hover:shadow-glow transition-all duration-300">
                  <div className={`${feature.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white drop-shadow-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Sin elementos adicionales que creen bordes */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10 max-w-6xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Atrévete a Vivir Nuevas Fantasías
            </h2>
            <p className="text-xl text-white drop-shadow-sm mb-8">
              Conecta con parejas y solteros liberales en un ambiente seguro y discreto. La aventura de tu vida te espera.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="xl" className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700" asChild>
                <Link to="/auth">
                  <Heart className="mr-2 h-5 w-5" fill="currentColor" />
                  Crear Cuenta Gratis
                </Link>
              </Button>
              {!isRunningInApp && (
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white hover:from-green-600 hover:to-emerald-700 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                  onClick={onOpenInstall}
                >
                  <Android className="w-5 h-5 mr-2" />
                  Instalar Aplicación
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
