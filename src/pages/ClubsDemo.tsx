import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, CheckCircle, Share2, Star, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { ClubProfileAdmin, ClubProfileEvents, ClubProfileGallery, ClubProfileHeader, ClubProfileReviews } from "@/components/clubs";
import ClubAdminPanel from "@/components/admin/panels/ClubAdminPanel";
import type { Club as ClubEntity } from "@/entities/club";

const DEMO_CLUB: ClubEntity = {
  id: "demo",
  name: "Club Demo CómplicesConecta",
  slug: "demo",
  description: "Demo de perfil de club verificado.",
  address: "Av. Insurgentes Sur 123",
  city: "CDMX",
  state: "CDMX",
  latitude: 19.4326,
  longitude: -99.1332,
  logo_url: "",
  cover_image_url: "",
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
    url: "/assets/nfts/imagen1.jpg",
    caption: "Entrada principal",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    url: "/assets/nfts/imagen2.jpg",
    caption: "Zona VIP",
    isPrivate: false,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    url: "/assets/nfts/imagen3.jpg",
    caption: "Pista",
    isPrivate: true,
    uploadedAt: new Date().toISOString(),
  },
];

const DEMO_EVENTS = [
  {
    id: "evt-1",
    title: "Noche Demo",
    description: "Evento demo",
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
];

const DEMO_REVIEWS = [
  {
    id: "rev-1",
    userId: "u1",
    userName: "Usuario Demo",
    rating: 5,
    comment: "Excelente ambiente y seguridad.",
    checkInDate: new Date().toISOString(),
    helpfulCount: 12,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
];

const DEMO_ANALYTICS = {
  totalVisits: 12450,
  totalCheckIns: 420,
  averageRating: 4.8,
  totalReviews: 128,
  weeklyVisits: 980,
  monthlyVisits: 4020,
  topEvents: [{ name: "Noche Demo", attendees: 120 }],
  demographics: [{ age: "25-34", percentage: 44 }],
  cmpx_balance: 25000,
  membership_tier: "free" as const,
  live_status: "🔥 On Fire",
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

  const club = useMemo(() => DEMO_CLUB, []);

  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 p-4 sm:p-6">
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
          <ClubAdminPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-black/70 backdrop-blur-xl border-white/15">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="outline"
                  onClick={() => navigate("/clubs")}
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
                  onClick={() => navigate("/clubs")}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Ver listado
                </Button>
                <Button
                  onClick={() => navigate("/clubs")}
                  className="bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Explorar clubs
                </Button>
              </div>
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
