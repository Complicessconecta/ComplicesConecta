import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, CheckCircle, Share2, Star, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { ClubProfileAdmin, ClubProfileEvents, ClubProfileGallery, ClubProfileHeader, ClubProfileReviews } from "@/components/clubs";
import ClubAdminPanel from '@/components/admin/panels/ClubAdminPanel';
import type { Club as ClubEntity } from "@/entities/club";

const DEMO_CLUB: ClubEntity = {
  id: "demo",
  name: "Aura Club Privado",
  slug: "aura-club-privado",
  description: "Un espacio exclusivo donde las conexiones fluyen naturalmente. Ambiente sofisticado, música cuidadosamente seleccionada y una comunidad que valora la discreción y el respeto mutuo.",
  address: "Av. Insurgentes Sur 123, Col. Condesa",
  city: "Ciudad de México",
  state: "CDMX",
  latitude: 19.4326,
  longitude: -99.1332,
  logo_url: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=400&fit=crop",
  cover_image_url: "https://images.unsplash.com/photo-1516450177776-1a7fe1e85b60?w=1920&q=80",
  is_featured: true,
  is_active: true,
  rating_average: 4.8,
  rating_count: 128,
  check_in_count: 420,
  check_in_radius_meters: 50,
  verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_GALLERY = [
  {
    id: "demo-1",
    url: "https://images.unsplash.com/photo-1516450177776-1a7fe1e85b60?w=1200",
    caption: "Entrada principal",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200",
    caption: "Zona VIP",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
    caption: "Pista principal",
    isPrivate: true,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-4",
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    caption: "Lounge sensorial",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-5",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200",
    caption: "Área de descanso",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-6",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",
    caption: "Bar central",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-7",
    url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200",
    caption: "Terraza privada",
    isPrivate: true,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-8",
    url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200",
    caption: "Cócteles signature",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
];

const DEMO_EVENTS = [
  {
    id: "evt-1",
    title: "Noche de Máscaras",
    description: "Velada de misterio y elegancia. Dress code: formal oscuro con máscara.",
    date: new Date().toISOString(),
    startTime: "22:00",
    endTime: "03:00",
    location: "CDMX",
    capacity: 300,
    registeredCount: 120,
    isVip: true,
    price: 500,
    currency: "$",
  },
  {
    id: "evt-2",
    title: "Velvet Social",
    description: "DJ invitado + dress code noir. Experiencia sensorial con mixología premium.",
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    startTime: "21:30",
    endTime: "02:30",
    location: "CDMX",
    capacity: 180,
    registeredCount: 96,
    isVip: false,
    price: 350,
    currency: "$",
  },
  {
    id: "evt-3",
    title: "Ritual de Luna",
    description: "Experiencia sensorial + mixología molecular bajo la luz de la luna.",
    date: new Date(Date.now() + 86400000 * 10).toISOString(),
    startTime: "23:00",
    endTime: "04:00",
    location: "CDMX",
    capacity: 240,
    registeredCount: 144,
    isVip: true,
    price: 650,
    currency: "$",
  },
  {
    id: "evt-4",
    title: "Encuentro de Cómplices",
    description: "Noche de networking para parejas y solteros con afinidades compartidas.",
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    startTime: "20:00",
    endTime: "02:00",
    location: "CDMX",
    capacity: 200,
    registeredCount: 85,
    isVip: false,
    price: 400,
    currency: "$",
  },
  {
    id: "evt-5",
    title: "Cena Clandestina",
    description: "Cena de 5 tiempos con maridaje en espacio íntimo. Solo 40 cupos.",
    date: new Date(Date.now() + 86400000 * 18).toISOString(),
    startTime: "20:30",
    endTime: "01:00",
    location: "CDMX",
    capacity: 40,
    registeredCount: 38,
    isVip: true,
    price: 1200,
    currency: "$",
  },
  {
    id: "evt-6",
    title: "After Hours",
    description: "Continúa la fiesta después del cierre. Música deep house y ambiente relajado.",
    date: new Date(Date.now() + 86400000 * 21).toISOString(),
    startTime: "01:00",
    endTime: "06:00",
    location: "CDMX",
    capacity: 100,
    registeredCount: 67,
    isVip: true,
    price: 300,
    currency: "$",
  },
];

const DEMO_REVIEWS = [
  {
    id: "rev-1",
    userId: "u1",
    userName: "Sofía & Diego",
    rating: 5,
    comment: "Excelente ambiente y seguridad. El staff es muy atento y el lugar tiene una vibra única. Definitivamente volveremos.",
    checkInDate: new Date().toISOString(),
    helpfulCount: 12,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-2",
    userId: "u2",
    userName: "Luna & Max",
    rating: 4,
    comment: "Gran vibra, el staff nos atendió perfecto. La zona VIP vale totalmente la pena.",
    checkInDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    helpfulCount: 8,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-3",
    userId: "u3",
    userName: "Neón Lovers",
    rating: 5,
    comment: "Eventos top y música impecable. Cada noche es una experiencia diferente.",
    checkInDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    helpfulCount: 18,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-4",
    userId: "u4",
    userName: "Cómplices Nocturnos",
    rating: 5,
    comment: "La discreción y el respeto que se respira aquí no lo hemos encontrado en otro lugar. Altamente recomendado.",
    checkInDate: new Date(Date.now() - 86400000 * 8).toISOString(),
    helpfulCount: 24,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-5",
    userId: "u5",
    userName: "Aventura en Pareja",
    rating: 4,
    comment: "Los cócteles son excelentes y la música siempre está en punto. Nos encantó la terraza.",
    checkInDate: new Date(Date.now() - 86400000 * 12).toISOString(),
    helpfulCount: 9,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-6",
    userId: "u6",
    userName: "Noche Estrellada",
    rating: 5,
    comment: "Un oasis en la ciudad. Perfecto para conocer personas con mente abierta sin presiones.",
    checkInDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    helpfulCount: 15,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-7",
    userId: "u7",
    userName: "Pasión CDMX",
    rating: 5,
    comment: "Llevamos 3 años viniendo y nunca decepciona. La calidad de los eventos es constante.",
    checkInDate: new Date(Date.now() - 86400000 * 20).toISOString(),
    helpfulCount: 31,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev-8",
    userId: "u8",
    userName: "Nuevos Exploradores",
    rating: 4,
    comment: "Primera vez y nos sentimos muy cómodos. El personal explicó todo muy bien.",
    checkInDate: new Date(Date.now() - 86400000 * 25).toISOString(),
    helpfulCount: 7,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
];

const DEMO_IMAGES = [
  {
    id: "img-1",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    alt: "Club interior",
    caption: "Interior del club",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "img-2", 
    url: "https://images.unsplash.com/photo-1516450177776-1a7fe1e85b60?w=800",
    alt: "Club bar",
    caption: "Bar principal",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "img-3",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    alt: "Cócteles",
    caption: "Mixología premium",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "img-4",
    url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",
    alt: "Bebidas",
    caption: "Barra de tragos",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "img-5",
    url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
    alt: "Terraza",
    caption: "Terraza exterior",
    uploadedAt: new Date().toISOString(),
  },
];

const DEMO_ANALYTICS = {
  totalVisits: 12450,
  totalCheckIns: 420,
  averageRating: 4.8,
  totalReviews: 128,
  weeklyVisits: 980,
  monthlyVisits: 4020,
  topEvents: [
    { name: "Noche de Máscaras", attendees: 287 },
    { name: "Velvet Social", attendees: 174 },
    { name: "Ritual de Luna", attendees: 231 },
  ],
  demographics: [
    { age: "25-34", percentage: 44 },
    { age: "35-44", percentage: 32 },
    { age: "45-54", percentage: 18 },
    { age: "18-24", percentage: 6 },
  ],
  peakHours: [
    { hour: "22:00-23:00", occupancy: 85 },
    { hour: "23:00-00:00", occupancy: 95 },
    { hour: "00:00-01:00", occupancy: 100 },
    { hour: "01:00-02:00", occupancy: 78 },
  ],
  cmpx_balance: 25000,
  membership_tier: "premium" as const,
  live_status: "🔥 On Fire",
  followers_count: 1847,
  eventsHosted: 156,
  avgStayDuration: "4.2 horas",
  repeatVisitors: 68,
};

const safeShare = async (title: string) => {
  try {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
  } catch {
    // no-op
  }
};

export const ClubsDemo = () => {
  const navigate = useNavigate();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [interestLevel, setInterestLevel] = useState<"neutral" | "tour" | "vip">("neutral");

  const club = useMemo(() => DEMO_CLUB, []);

  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-transparent p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-black/70 backdrop-blur-xl border-white/15 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminPanel(false)}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Club Demo
                  </Button>
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">Panel Administración</div>
                    <div className="text-white/70 text-xs truncate">
                      Gestión de clubs - Modo Demo
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-purple-500/90 text-white border border-purple-300/40">
                    Admin
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          {showAdminPanel ? (
            <ClubAdminPanel />
          ) : (
            <div className="space-y-6">
              {/* Club Profile Content */}
              <ClubProfileHeader club={DEMO_CLUB} />
              <ClubProfileEvents events={DEMO_EVENTS} />
              <ClubProfileReviews reviews={DEMO_REVIEWS} averageRating={DEMO_ANALYTICS.averageRating} totalReviews={DEMO_REVIEWS.length} />
              <ClubProfileGallery images={DEMO_IMAGES} />
              <ClubProfileAdmin analytics={DEMO_ANALYTICS} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 relative overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-cover bg-center animate-pulse" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1516450177776-1a7fe1e85b60?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }} />
      <div className="absolute inset-0 bg-linear-to-b from-purple-900/80 to-blue-900/80" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <Card className="bg-black/70 backdrop-blur-xl border-white/15">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="outline"
                  onClick={() => navigate("/clubs-public")}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">Club Demo</div>
                  <div className="text-white/70 text-xs truncate">
                    Perfil demo verificado
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge className="bg-purple-500/90 text-white border border-purple-300/40">
                  Admin
                </Badge>
                <Badge className="bg-green-500/90 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void safeShare("Club Demo")}
                  className="bg-white/10 hover:bg-white/20 p-2"
                  title="Compartir"
                >
                  <Share2 className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ClubProfileHeader club={club} />

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-200" />
                  <div className="text-white font-semibold">Demo completo</div>
                </div>
                <div className="text-white/80 text-sm">
                  Este demo muestra cómo se vería un Club real (galería, eventos, reseñas y panel admin de ejemplo).
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/clubs-public")}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Ver listado
                </Button>
                <Button
                  onClick={() => navigate("/clubs-public/demo")}
                  className="bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Ver perfil público
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFollowing((prev) => !prev)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  {isFollowing ? "Siguiendo" : "Seguir"}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={interestLevel === "tour" ? "default" : "outline"}
                onClick={() => setInterestLevel("tour")}
                className={
                  interestLevel === "tour"
                    ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white"
                    : "border-white/30 text-white hover:bg-white/10"
                }
              >
                Quiero tour
              </Button>
              <Button
                type="button"
                variant={interestLevel === "vip" ? "default" : "outline"}
                onClick={() => setInterestLevel("vip")}
                className={
                  interestLevel === "vip"
                    ? "bg-linear-to-r from-fuchsia-600 to-purple-600 text-white"
                    : "border-white/30 text-white hover:bg-white/10"
                }
              >
                Interés VIP
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInterestLevel("neutral")}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Reiniciar
              </Button>
            </div>
          </CardContent>
        </Card>

        <ClubProfileGallery images={DEMO_GALLERY} />
        <ClubProfileEvents events={DEMO_EVENTS} />
        <ClubProfileReviews
          reviews={DEMO_REVIEWS}
          averageRating={club.rating_average}
          totalReviews={club.rating_count}
        />

        <ClubProfileAdmin analytics={DEMO_ANALYTICS} clubId={club.id} />
      </div>
    </div>
  );
};

export default ClubsDemo;
