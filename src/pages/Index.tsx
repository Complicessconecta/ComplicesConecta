import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import HeaderNav from "@/components/HeaderNav";
import { HeroSection } from "@/components/HeroSection";
import { ProfileCard } from "@/components/profiles/shared/MainProfileCard";
import { Footer } from "@/components/Footer";
import { BetaBanner } from "@/components/BetaBanner";
import { WelcomeModal } from "@/components/modals/WelcomeModal";
import { FeatureModal } from "@/components/modals/FeatureModal";
import { InstallAppModal } from "@/components/modals/InstallAppModal";
import { ActionButtonsModal } from "@/components/modals/ActionButtonsModal";
import { DecorativeHearts } from "@/components/DecorativeHearts";
import { Heart, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import "@/styles/animations.css";
import { useAuth } from '@/features/auth/useAuth';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useBgMode } from '@/hooks/useBgMode';
import ModeratorApplicationForm from "@/components/forms/ModeratorApplicationForm";
import { getRandomProfileImage } from '@/lib/imageService';
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';
import { isAndroidWebView } from '@/lib/userAgent';

const SAMPLE_PROFILES = [
  {
    id: "1",
    name: "Gabriela",
    age: 29,
    location: "Ciudad de México",
    interests: ["Intercambio de Parejas", "Fiestas Privadas"],
    image: getRandomProfileImage('female', { width: 500, height: 700 }),
    rating: 4.9,
    isOnline: true,
    bio: "Apasionada por la naturaleza y la creatividad.",
    profession: "Arquitecta",
    verified: true
  },
  {
    id: "2",
    name: "Antonio",
    age: 34,
    location: "Guadalajara",
    interests: ["Experiencias Grupales", "Clubs Liberales"],
    image: getRandomProfileImage('male', { width: 500, height: 700 }),
    rating: 4.8,
    isOnline: false,
    bio: "Emprendedor y amante del mar.",
    profession: "Consultor",
    verified: true
  },
  {
    id: "3",
    name: "Isabella",
    age: 27,
    location: "Monterrey",
    interests: ["Tantra", "Juegos de Rol"],
    image: getRandomProfileImage('female', { width: 500, height: 700 }),
    rating: 4.9,
    isOnline: true,
    bio: "Explorando la riqueza cultural de México.",
    profession: "Historiadora",
    verified: true
  },
  {
    id: "4",
    name: "Mateo",
    age: 31,
    location: "Puebla",
    interests: ["Encuentros Casuales", "Vida Nocturna"],
    image: getRandomProfileImage('male', { width: 500, height: 700 }),
    rating: 4.7,
    isOnline: true,
    bio: "Ingeniero de software con alma de chef.",
    profession: "Dev",
    verified: true
  }
];

function Index() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setMode } = useBgMode();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'connections' | 'verification' | 'events' | 'tokens'>('connections');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showActionButtonsModal, setShowActionButtonsModal] = useState(false);
  const [showModeratorForm, setShowModeratorForm] = useState(false);

  const [hasVisited, setHasVisited] = usePersistedState<boolean>('hasVisitedComplicesConecta', false);

  // Force particles mode on homepage
  useEffect(() => {
    setMode('particles');
  }, [setMode]);

  useEffect(() => {
    // Detección rápida de entorno app vs web
    const checkApp = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (isAndroidWebView(userAgent)) {
        // Lógica específica si es necesario
      }
    };
    checkApp();
  }, []);

  useEffect(() => {
    if (hasVisited || isAuthenticated() || authLoading) return;
    const timer = setTimeout(() => setShowWelcome(true), 500);
    return () => clearTimeout(timer);
  }, [hasVisited, isAuthenticated, authLoading]);

  // REDIRECCIÓN INSTANTÁNEA: Si hay sesión, ni siquiera renderices el Home.
  if (!authLoading && isAuthenticated()) {
    return <Navigate to="/profile-single" replace />;
  }

  const handleFeatureClick = (featureType: 'connections' | 'verification' | 'events' | 'tokens') => {
    setSelectedFeature(featureType);
    setShowFeatureModal(true);
  };

  const features = [
    { icon: Heart, title: "Conexiones", description: "Intereses reales en común", type: 'connections' as const, iconBg: "bg-purple-600" },
    { icon: Shield, title: "Verificación", description: "Seguridad y confianza KYC", type: 'verification' as const, iconBg: "bg-blue-600" },
    { icon: Users, title: "Eventos", description: "Fiestas exclusivas", type: 'events' as const, iconBg: "bg-purple-600" },
    { icon: Zap, title: "Tokens", description: "Economía interna CMPX", type: 'tokens' as const, iconBg: "bg-orange-500" }
  ];

  return (
    <ParticlesBackground>
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <DecorativeHearts count={6} />
        
        <HeaderNav />
        
        <div className="relative z-10 pt-16">
          <BetaBanner />
          
          <main className="animate-fade-in">
            <HeroSection />
            
            <section className="py-10 relative">
              <div className="container mx-auto px-4">
                <div className="text-center space-y-6">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                    Bienvenido a la Comunidad
                  </h1>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {SAMPLE_PROFILES.map((profile) => (
                      <ProfileCard 
                        key={profile.id}
                        profile={profile} 
                        onLike={() => setShowActionButtonsModal(true)} 
                        onSuperLike={() => setShowActionButtonsModal(true)}
                        onOpenModal={() => setShowActionButtonsModal(true)} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleFeatureClick(feature.type)}
                    className="bg-black/30 backdrop-blur-sm p-4 rounded-xl text-center cursor-pointer border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className={`${feature.iconBg} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-10 text-center">
             <Button variant="default" size="xl" className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg scale-110" asChild>
                <Link to="/auth">Crear Cuenta Gratis</Link>
             </Button>
          </section>
        </main>

        <Footer />

        {showWelcome && <WelcomeModal isOpen={showWelcome} onClose={() => { setShowWelcome(false); setHasVisited(true); }} />}
        <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
        <FeatureModal isOpen={showFeatureModal} onClose={() => setShowFeatureModal(false)} feature={selectedFeature} />
        <ActionButtonsModal isOpen={showActionButtonsModal} onClose={() => setShowActionButtonsModal(false)} />
        
        {showModeratorForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
             <div className="bg-gray-900 w-full max-w-2xl rounded-xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="p-4 flex justify-end">
                   <Button onClick={() => setShowModeratorForm(false)}>Cerrar</Button>
                </div>
                <ModeratorApplicationForm />
             </div>
          </div>
        )}
      </div>
    </ParticlesBackground>
  );
}

export default Index;

