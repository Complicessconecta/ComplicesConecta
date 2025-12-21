import { ProfileCard } from "@/components/profiles/shared/MainProfileCard";
import { getRandomProfileImage } from '@/lib/imageService';

interface HomeProfilesSectionProps {
  onOpenActionModal: () => void;
}

export const HomeProfilesSection = ({ onOpenActionModal }: HomeProfilesSectionProps) => {
  // Professional sample profiles for presentation using dynamic image service
  const sampleProfiles = [
    {
      id: "1",
      name: "Gabriela",
      age: 29,
      location: "Ciudad de México",
      interests: ["Intercambio de Parejas", "Fiestas Privadas", "Encuentros Íntimos"],
      image: getRandomProfileImage('female', { width: 500, height: 700 }),
      rating: 4.9,
      isOnline: true,
      bio: "Apasionada por la naturaleza y la creatividad. Buscando a alguien con quien compartir aventuras y conversaciones profundas.",
      profession: "Arquitecta",
      verified: true
    },
    {
      id: "2",
      name: "Antonio",
      age: 34,
      location: "Guadalajara",
      interests: ["Experiencias Grupales", "Clubs Liberales", "Aventuras Sensuales"],
      image: getRandomProfileImage('male', { width: 500, height: 700 }),
      rating: 4.8,
      isOnline: false,
      bio: "Emprendedor y amante del mar. Disfruto de un buen vino y una compañía inteligente.",
      profession: "Consultor Financiero",
      verified: true
    },
    {
      id: "3",
      name: "Isabella",
      age: 27,
      location: "Monterrey",
      interests: ["Tantra y Sensualidad", "Juegos de Rol", "Experiencias Nuevas"],
      image: getRandomProfileImage('female', { width: 500, height: 700 }),
      rating: 4.9,
      isOnline: true,
      bio: "Explorando la riqueza cultural de México. Me encanta perderme en libros y descubrir nuevos lugares.",
      profession: "Historiadora del Arte",
      verified: true
    },
    {
      id: "4",
      name: "Mateo",
      age: 31,
      location: "Puebla",
      interests: ["Encuentros Casuales", "Fantasías Compartidas", "Vida Nocturna Liberal"],
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&h=700&fit=crop&crop=faces&auto=format&q=80",
      rating: 4.7,
      isOnline: true,
      bio: "Ingeniero de software con alma de chef. Siempre en busca del equilibrio perfecto entre código y sabor.",
      profession: "Desarrollador de Software",
      verified: true
    }
  ];

  return (
    <section className="py-10 sm:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <h1 data-testid="main-heading" className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white mb-6 leading-tight animate-slide-up">
              Bienvenido a la Plataforma Social
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-4xl mx-auto leading-relaxed animate-slide-up font-medium px-4">
              La plataforma <strong className="text-purple-300">más exclusiva</strong> para la comunidad lifestyle mexicana.
              <br className="hidden md:block" />
              <span className="text-purple-200">
                Conexiones auténticas, experiencias únicas.
              </span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 px-2">
            {sampleProfiles.map((profile, index) => (
              <div key={index} className={`animate-slide-up slide-up-delay-${index}`}>
                <ProfileCard 
                  profile={profile} 
                  onLike={() => {}} 
                  onSuperLike={() => {}}
                  onOpenModal={onOpenActionModal} 
                />
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
};
