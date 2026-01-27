import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building, CheckCircle, MapPin, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/cards/Card";

interface PublicClub {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviews: number;
  checkIns: number;
  coverImage: string;
  vibe: string;
  tier: "free" | "premium";
}

const PUBLIC_CLUBS: PublicClub[] = [
  {
    id: "demo",
    slug: "demo",
    name: "Club Demo CómplicesConecta",
    description:
      "Demo público para explorar el ecosistema Clubs. Incluye vibe, rating, y elementos visuales tipo lifestyle.",
    address: "Av. Insurgentes Sur 123",
    city: "CDMX",
    state: "CDMX",
    rating: 4.8,
    reviews: 128,
    checkIns: 420,
    coverImage:
      "https://images.unsplash.com/photo-1516450177776-1a7fe1e85b60?w=1200",
    vibe: "🔥 On Fire",
    tier: "free",
  },
  {
    id: "public-1",
    slug: "eden-noir",
    name: "Eden Noir Club",
    description:
      "Experiencia lifestyle premium con noches temáticas, lounges íntimos y pista principal con iluminación neón.",
    address: "Av. Reforma 245",
    city: "CDMX",
    state: "CDMX",
    rating: 4.9,
    reviews: 186,
    checkIns: 980,
    coverImage:
      "https://images.unsplash.com/photo-1516450177776-1a7fe1e85b60?w=1200",
    vibe: "🔥 On Fire",
    tier: "premium",
  },
  {
    id: "public-2",
    slug: "luna-roja",
    name: "Luna Roja",
    description:
      "Club boutique con ambientes privados, coctelería de autor y sesiones sensoriales guiadas.",
    address: "Providencia 78",
    city: "Guadalajara",
    state: "JAL",
    rating: 4.6,
    reviews: 92,
    checkIns: 420,
    coverImage:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200",
    vibe: "✨ Soft Glow",
    tier: "premium",
  },
  {
    id: "public-3",
    slug: "mystic-garden",
    name: "Mystic Garden",
    description:
      "Jardín nocturno con experiencias inmersivas, cabinas VIP y música deep house.",
    address: "Paseo Santa Lucía 12",
    city: "Monterrey",
    state: "NL",
    rating: 4.3,
    reviews: 61,
    checkIns: 260,
    coverImage:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    vibe: "🌙 Midnight",
    tier: "free",
  },
];

export const ClubsPublic = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  const selectedClub = useMemo(() => {
    if (!slug) return null;
    return PUBLIC_CLUBS.find((club) => club.slug === slug) ?? null;
  }, [slug]);

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/clubs-public")}
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Badge className="bg-white/10 text-white border-white/30">
            Clubes Públicos
          </Badge>
        </div>

        {selectedClub ? (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden">
              <div className="relative h-64">
                <img
                  src={selectedClub.coverImage}
                  alt={selectedClub.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-black/60 text-white border-white/30">
                    {selectedClub.vibe}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {selectedClub.name}
                    </h2>
                    <div className="flex items-center gap-2 text-white/70 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {selectedClub.address}, {selectedClub.city}
                      </span>
                    </div>
                    <p className="text-white/80 max-w-2xl">
                      {selectedClub.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className="bg-fuchsia-500/80 text-white">
                      {selectedClub.tier.toUpperCase()}
                    </Badge>
                    <Badge className="bg-green-500/80 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mt-6">
                  <div>
                    <div className="text-white font-semibold">
                      {selectedClub.checkIns}
                    </div>
                    <div className="text-white/60 text-xs">Check-ins</div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {selectedClub.reviews}
                    </div>
                    <div className="text-white/60 text-xs">Reseñas</div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {selectedClub.rating.toFixed(1)}
                    </div>
                    <div className="text-white/60 text-xs">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_CLUBS.map((club) => (
              <Card
                key={club.id}
                className="bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden"
              >
                <div className="relative h-48">
                  <img
                    src={club.coverImage}
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-black/60 text-white border-white/30">
                      {club.vibe}
                    </Badge>
                    <Badge className="bg-white/15 text-white">
                      {club.tier.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{club.name}</h3>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <MapPin className="h-4 w-4" />
                      {club.city}, {club.state}
                    </div>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">
                    {club.description}
                  </p>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-300" />
                      {club.rating.toFixed(1)}
                    </div>
                    <div>{club.reviews} reseñas</div>
                  </div>
                  <Button
                    onClick={() => navigate(`/clubs-public/${club.slug}`)}
                    className="w-full bg-linear-to-r from-purple-600 to-fuchsia-600 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ver perfil público
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!selectedClub && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-4">
                <Building className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                ¿Tienes un club?
              </h3>
              <p className="text-white/70 mb-4">
                Solicita verificación y forma parte del ecosistema lifestyle.
              </p>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-linear-to-r from-green-600 to-emerald-600 text-white"
              >
                Quiero mi club
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubsPublic;
