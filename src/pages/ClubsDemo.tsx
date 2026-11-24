import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, CheckCircle, Share2, Star, ArrowLeft, Sparkles, TicketPercent, Eye } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/cards/Card";
import { ClubProfileAdmin, ClubProfileEvents, ClubProfileGallery, ClubProfileHeader, ClubProfileReviews } from "@/components/clubs";
import ClubAdminPanel from '@/components/admin/panels/ClubAdminPanel';
import type { Club as ClubEntity } from "@/entities/club";
import {
  DEMO_CLUB_EVENTS,
  loadClubDiscounts,
  loadClubEvents,
  type ClubDiscountItem,
  type ClubEventItem,
} from "@/services/clubs/clubContentService";

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
  cover_image_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80",
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
    url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
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

// Los eventos demo viven en clubContentService (DEMO_CLUB_EVENTS);
// ClubsDemo los carga desde club_events con ese respaldo.


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

// Descuentos del club (club_discounts): se usa en la vista admin y en la
// pública; antes el bloque vivía duplicado solo en la pública.
const ClubDiscountsCard = ({
  discounts,
}: {
  discounts: ClubDiscountItem[];
}) => {
  if (discounts.length === 0) return null;
  return (
    <Card className="bg-black/70 backdrop-blur-xl border-white/15">
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <TicketPercent className="h-5 w-5 text-fuchsia-400" />
          Descuentos del club
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {discounts.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-mono font-bold tracking-wider">
                  {d.code}
                </span>
                <Badge className="bg-fuchsia-600 text-white">
                  {d.discountPercent !== null
                    ? `${d.discountPercent}% OFF`
                    : d.discountAmount !== null
                      ? `$${d.discountAmount} OFF`
                      : "Promo"}
                </Badge>
              </div>
              {d.description && (
                <p className="text-white/70 text-sm mt-2">{d.description}</p>
              )}
              <p className="text-white/50 text-xs mt-2">
                {d.usesCount} usados
                {d.maxUses !== null ? ` de ${d.maxUses}` : ""}
                {d.validUntil
                  ? ` · vence ${new Date(d.validUntil).toLocaleDateString("es-MX")}`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const ClubsDemo = () => {
  const navigate = useNavigate();
  // Demo en modo creador/administrador por defecto: entrar a un club en
  // demo muestra la vista admin (Panel Admin, stats, eventos/descuentos/
  // miembros) y la vista pública queda a un toque en "Ver perfil público".
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [interestLevel, setInterestLevel] = useState<"neutral" | "tour" | "vip">("neutral");
  // Eventos y descuentos del club: se leen de club_events / club_discounts
  // (migración 20261124030000) con respaldo demo si la BD no responde o
  // la migración aún no está aplicada. Antes eran arrays en memoria.
  const [events, setEvents] = useState<ClubEventItem[]>(DEMO_CLUB_EVENTS);
  const [discounts, setDiscounts] = useState<ClubDiscountItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    void loadClubEvents(DEMO_CLUB.id).then(({ items }) => {
      if (!cancelled) setEvents(items);
    });
    void loadClubDiscounts(DEMO_CLUB.id).then(({ items }) => {
      if (!cancelled) setDiscounts(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const club = useMemo(() => DEMO_CLUB, []);

  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-transparent p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="bg-black/70 backdrop-blur-xl border-white/15">
            <CardContent className="p-4">
              {/* Fila con wrap: en móvil (~360 px) los 6 elementos no caben
                  en una sola línea; antes el botón "Volver" salía truncado
                  ("Volve...") y el título quedaba en "C." / "P..". Cada
                  grupo envuelve entero en vez de recortarse. */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminPanel(false)}
                    className="shrink-0 border-white/30 text-white hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4 mr-2 shrink-0" />
                    Ver perfil público
                  </Button>
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">Panel Administración</div>
                    <div className="text-white/70 text-xs truncate">
                      Vista de creador — Modo Demo
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-purple-500/90 text-white border border-purple-300/40">
                    Admin
                  </Badge>
                  <Badge className="bg-green-500/90 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Vista de creador: identidad del club, stats, descuentos y el
              Panel Admin (clubs registrados, eventos y miembros). La vista
              pública completa sigue en "Ver perfil público". */}
          <ClubProfileHeader club={club} />
          <ClubProfileAdmin analytics={DEMO_ANALYTICS} clubId={club.id} />
          <ClubDiscountsCard discounts={discounts} />
            <ClubAdminPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 relative overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-cover bg-center animate-pulse" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }} />
      <div className="absolute inset-0 bg-linear-to-b from-purple-900/80 to-blue-900/80" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <Card className="bg-black/70 backdrop-blur-xl border-white/15">
          <CardContent className="p-4">
            {/* Fila con wrap: en móvil (~360 px) los 6 elementos no caben
                en una sola línea; antes el botón "Volver" salía truncado
                ("Volve...") y el título quedaba en "C." / "P..". Cada
                grupo envuelve entero en vez de recortarse. */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/clubs-public")}
                  className="shrink-0 border-white/30 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                  Volver
                </Button>
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">Club Demo</div>
                  <div className="text-white/70 text-xs truncate">
                    Perfil demo verificado
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-purple-500/90 text-white border border-purple-300/40">
                  Admin
                </Badge>
                <Badge className="bg-green-500/90 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminPanel(true)}
                  className="shrink-0 border-white/30 text-white hover:bg-white/10"
                  title="Panel de administración del club"
                >
                  Panel Admin
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void safeShare("Club Demo")}
                  className="shrink-0 bg-white/10 hover:bg-white/20 p-2"
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

              {/* Con wrap: en móvil los 3 botones no caben en una línea y
                  "Seguir" quedaba cortado en el borde derecho. */}
              <div className="flex flex-wrap items-center gap-2">
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
        <ClubProfileEvents events={events} />
        <ClubDiscountsCard discounts={discounts} />
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
