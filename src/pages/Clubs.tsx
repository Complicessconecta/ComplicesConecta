import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/forms/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  CheckCircle,
  FileText,
  Shield,
  Search,
  Globe,
  Camera,
  Award,
  Verified,
  Navigation,
  Eye,
  Building,
  Target,
  Sparkles,
  User,
  Users,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { isAnonymousDemoProfile } from "@/lib/demo-registration";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase-generated";
import type { Club as ClubEntity } from "@/entities/club";
import { PUBLIC_CLUBS, type PublicClub } from "./ClubsPublic";
import { TermsModalClub } from "@/components/modals/TermsModalClub";
import ClubConsentManager from "@/components/legal/ClubConsentManager";
import {
  ClubProfileAdmin,
  ClubProfileEvents,
  ClubProfileGallery,
  ClubProfileHeader,
  ClubProfileReviews,
  ExpandableClubDescription,
  LiveClubReviewCount,
} from "@/components/clubs";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

interface Club extends Omit<
  ClubRow,
  | "cover_image_url"
  | "is_featured"
  | "rating_average"
  | "rating_count"
  | "description"
  | "logo_url"
  | "review_count"
  | "phone"
  | "check_in_count"
  | "state"
  | "verified_at"
  | "website"
> {
  description: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  verified_at: string | null;
  is_featured: boolean;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  review_count: number;
  check_in_count: number;
  check_in_radius_meters: number | null;
}

/**
 * Fallback cuando Supabase no devuelve clubs (tabla vacía, RLS o error de
 * red): muestra los clubs públicos del catálogo en vez de un toast de error
 * y una página vacía (el video muestra "No se pudieron cargar los clubs").
 * Los campos de BD que el catálogo no tiene se rellenan con valores demo.
 */
function mapPublicClubToClub(c: PublicClub): Club {
  const now = new Date().toISOString();
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    address: c.address,
    city: c.city,
    state: c.state,
    country: "México",
    email: null,
    phone: null,
    website: null,
    logo_url: null,
    cover_image_url: c.coverImage,
    latitude: 19.4326,
    longitude: -99.1332,
    is_active: true,
    is_featured: c.tier === "premium",
    is_verified: true,
    verified_at: now,
    verified_by: null,
    created_at: now,
    updated_at: now,
    created_by: null,
    rating_average: c.rating,
    rating_count: c.reviews,
    review_count: c.reviews,
    total_reviews: c.reviews,
    check_in_count: c.checkIns,
    check_in_radius_meters: 500,
    average_rating: c.rating,
    bayesian_score: c.rating,
    membership_tier: c.tier,
    metadata: null,
    stripe_account_id: null,
    total_revenue_cmpx: null,
    total_revenue_usd: null,
    vibe_status: c.vibe,
    vibe_status_updated_at: now,
  };
}

/**
 * Sin duplicados por nombre normalizado: el catálogo público trae "Club
 * Demo CómplicesConecta" y la tabla clubs de BD puede traer el mismo club
 * como "Club Demo", y la lista mostraba Club Demo dos veces. Dos nombres
 * son el mismo club si uno es prefijo del otro ("club demo" ⊂ "club demo
 * cómplicesconecta"); la primera ocurrencia manda (BD antes que catálogo).
 */
function dedupeClubs(list: Club[]): Club[] {
  const seen: string[] = [];
  return list.filter((club) => {
    const key = club.name.trim().toLowerCase();
    if (
      seen.some((prev) => prev === key || prev.startsWith(key) || key.startsWith(prev))
    )
      return false;
    seen.push(key);
    return true;
  });
}

const toClubEntity = (club: Club): ClubEntity => {
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    description: club.description ?? "",
    address: club.address ?? "",
    city: club.city ?? "",
    state: club.state ?? "",
    latitude: club.latitude ?? 0,
    longitude: club.longitude ?? 0,
    logo_url: club.logo_url ?? "",
    cover_image_url: club.cover_image_url ?? "",
    is_featured: club.is_featured ?? false,
    is_active: club.is_active ?? true,
    rating_average: club.rating_average ?? 0,
    rating_count: club.rating_count ?? 0,
    check_in_count: club.check_in_count ?? 0,
    check_in_radius_meters: club.check_in_radius_meters ?? 0,
    membership_tier:
      (club as any).membership_tier === "free" || (club as any).membership_tier === "premium"
        ? (club as any).membership_tier
        : undefined,
    live_status: (club as any).live_status ?? undefined,
    cmpx_balance:
      typeof (club as any).cmpx_balance === "number" ? (club as any).cmpx_balance : undefined,
    verified_at: club.verified_at ?? "",
    created_at: club.created_at ?? "",
    updated_at: club.updated_at ?? "",
  };
};

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
  { id: "demo-1", url: "/assets/nfts/imagen1.jpg", caption: "Entrada principal", isPrivate: false, uploadedAt: new Date().toISOString() },
  { id: "demo-2", url: "/assets/nfts/imagen2.jpg", caption: "Zona VIP", isPrivate: false, uploadedAt: new Date().toISOString() },
  { id: "demo-3", url: "/assets/nfts/imagen3.jpg", caption: "Pista", isPrivate: true, uploadedAt: new Date().toISOString() },
];

const DEMO_EVENTS = [
  { id: "evt-1", title: "Noche Demo", description: "Evento demo", date: new Date().toISOString(), startTime: "22:00", endTime: "03:00", location: "CDMX", capacity: 300, registeredCount: 120, isVip: true, price: 500, currency: "$" },
];

const DEMO_REVIEWS = [
  { id: "rev-1", userId: "u1", userName: "Usuario Demo", rating: 5, comment: "Excelente ambiente y seguridad.", checkInDate: new Date().toISOString(), helpfulCount: 12, isVerified: true, createdAt: new Date().toISOString() },
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

/**
 * Predicado de búsqueda/filtro de clubs (ronda 14, stream B).
 *
 * La búsqueda compara nombre y ciudad (no descripción ni dirección):
 * buscar "Eden" no debe dejar a "Club Demo" solo porque su descripción
 * o dirección comparta una palabra. Lo usan `filterClubs` (la lista) Y
 * la tarjeta fija Club Demo, que vive fuera de `filteredClubs`: sin
 * este predicado compartido la búsqueda nunca la filtraba (test de la
 * ronda 13: escribir "Eden" dejaba visible Club Demo).
 */
export function clubMatchesSearch(
  name: string,
  city: string | null | undefined,
  query: string,
  cityFilter: string,
): boolean {
  if (cityFilter !== "all" && city !== cityFilter) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    name.toLowerCase().includes(q) ||
    (city ?? "").toLowerCase().includes(q)
  );
}

export const Clubs = () => {
  const { user, profile, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  const isAdminUser = isAuthenticated() && isAdmin();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Términos de uso para clubs: el registro exige aceptar los términos y la
  // política de privacidad para clubs (TermsModalClub).
  const [showClubTermsModal, setShowClubTermsModal] = useState(false);
  const [clubTermsAccepted, setClubTermsAccepted] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubEntity | null>(null);

  // Formulario de registro de club
  const [clubForm, setClubForm] = useState({
    // Propietario
    ownerName: "",
    ownerAge: "",
    ownerGender: "",
    ownerRFC: "",
    // Representante
    repName: "",
    repPosition: "",
    repPhone: "",
    repEmail: "",
    // Club
    clubName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    whatsapp: "",
    website: "",
    useAppAsWebsite: false,
    email: "",
    // Detalles
    description: "",
    clubType: "",
    hours: "",
    capacity: "",
    // Documentos
    documentsUrl: "",
    companyRFC: "",
    license: "",
  });

  // Información del sistema de clubs desde la documentación
  const clubSystemInfo = {
    verificationProcess: [
      {
        step: "1. Club Real",
        description: "Club físico con ubicación verificable",
        icon: <Building className="h-5 w-5" />,
      },
      {
        step: "2. Documentación",
        description: "Documentos legales del club",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        step: "3. Verificación",
        description: "Proceso de verificación por el equipo",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        step: "4. Aprobación",
        description: "Aprobación y asignación de slug único",
        icon: <CheckCircle className="h-5 w-5" />,
      },
    ],
    benefits: [
      {
        title: "Página Pública",
        description: "URL única /clubs/{slug} con información completa",
        icon: <Globe className="h-5 w-5" />,
      },
      {
        title: "Check-ins Verificados (próximamente)",
        description: "Check-in geolocalizado (radio 50 m) con WorldID — próximamente",
        icon: <MapPin className="h-5 w-5" />,
      },
      {
        title: "Reseñas Auténticas",
        description: "En beta, las reseñas están abiertas a todos los usuarios; la verificación con check-in llega próximamente",
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

  useEffect(() => {
    loadClubs();
    requestUserLocation();
  }, []);

  useEffect(() => {
    if (!slug) {
      setSelectedClub(null);
      return;
    }

    if (slug === "demo") {
      // La vista pública del demo es /clubs-public/demo; /clubs/demo
      // abre en vista pública por defecto (ronda 14, stream E) y el
      // admin solo entra por "Panel Admin" con sesión demo del club.
      navigate("/clubs/demo", { replace: true });
      return;
    }

    const found = clubs.find((club) => club.id === slug || club.slug === slug);
    if (found) {
      setSelectedClub(toClubEntity(found));
      return;
    }

    // Ronda 14, stream B: el slug del catálogo se resuelve SÍNCRONO,
    // antes de tocar Supabase. `fetchSingle` (abajo) solo alcanzaba el
    // catálogo tras dos consultas: con el stub del preview (sin
    // variables en Vercel) esas consultas RECHAZAN y el `catch` se
    // saltaba el respaldo, así que el detalle dependía de que
    // `loadClubs` terminara y repusiera el catálogo por su lado. Un
    // slug de catálogo nunca necesita la red: si la BD trae ese slug,
    // el re-render al cargar `clubs` lo sustituye por la fila de BD
    // (`found` manda arriba).
    const catalog = PUBLIC_CLUBS.find((c) => c.slug === slug);
    if (catalog) {
      setSelectedClub(toClubEntity(mapPublicClubToClub(catalog)));
      return;
    }

    const fetchSingle = async () => {
      try {
        if (!supabase) return;
        const { data: byId, error: byIdError } = await supabase
          .from("clubs")
          .select("*")
          .eq("id", slug)
          .single();

        if (!byIdError && byId) {
          setSelectedClub(toClubEntity(byId as Club));
          return;
        }

        const { data: bySlug, error: bySlugError } = await supabase
          .from("clubs")
          .select("*")
          .eq("slug", slug)
          .single();

        if (!bySlugError && bySlug) {
          setSelectedClub(toClubEntity(bySlug as Club));
          return;
        }
      } catch (error) {
        logger.error("Error loading club profile:", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Respaldo del catálogo público (ronda 7, punto 7): "Eden Noir"
      // solo vive en PUBLIC_CLUBS, no en la tabla clubs. FUERA del
      // `try` (ronda 14, stream B): antes vivía dentro y un rechazo
      // del stub lo saltaba entero, así que el detalle era inalcanzable
      // por esta vía. La BD sigue mandando cuando sí tiene el club
      // (el `found` de arriba y las dos consultas de este `try`).
      const fallback = PUBLIC_CLUBS.find((c) => c.slug === slug);
      if (fallback) {
        setSelectedClub(toClubEntity(mapPublicClubToClub(fallback)));
      }
    };

    void fetchSingle();
  }, [slug, clubs]);

  useEffect(() => {
    if (!selectedClub) return;
    if (selectedClub.id === "demo") return;
    if (!supabase) return;

    const clubId = selectedClub.id;

    const channel = supabase
      .channel(`clubs:${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "clubs",
          filter: `id=eq.${clubId}`,
        },
        (payload) => {
          const next = payload.new as any;
          setSelectedClub((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              membership_tier:
                next.membership_tier === "free" || next.membership_tier === "premium"
                  ? next.membership_tier
                  : prev.membership_tier,
              live_status: next.live_status ?? prev.live_status,
              cmpx_balance:
                typeof next.cmpx_balance === "number"
                  ? next.cmpx_balance
                  : prev.cmpx_balance,
              updated_at: next.updated_at ?? prev.updated_at,
            };
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedClub]);

  useEffect(() => {
    filterClubs();
  }, [clubs, searchQuery, selectedCity]);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase!
        .from("clubs")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("rating_average", { ascending: false });

      if (error) throw error;

      // Sin clubs en BD (tabla vacía / RLS): mostrar el catálogo público
      // en vez de una página vacía.
      if (!data || data.length === 0) {
        logger.warn("No clubs in Supabase, using public catalog fallback");
        setClubs(dedupeClubs(PUBLIC_CLUBS.map(mapPublicClubToClub)));
        return;
      }

      // El catálogo público se MEZCLA con las filas de BD (la BD manda):
      // antes, si la tabla traía filas, el catálogo se descartaba entero y
      // "Eden Noir" (que solo vive en el catálogo) no aparecía en /clubs
      // ni en la búsqueda. Sin clubs en BD se usa solo el catálogo (abajo).
      setClubs(
        dedupeClubs([
          ...((data || []) as Club[]),
          ...PUBLIC_CLUBS.map(mapPublicClubToClub),
        ]),
      );
      logger.info("Clubs loaded successfully", { count: data?.length });
    } catch (error) {
      logger.error("Error loading clubs, using public catalog fallback:", {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Fallback al catálogo público: la página sigue mostrando clubs y no
      // se muestra un toast de error destructivo por un fallo de red/RLS.
      setClubs(dedupeClubs(PUBLIC_CLUBS.map(mapPublicClubToClub)));
    } finally {
      setLoading(false);
    }
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          logger.warn("Geolocation error:", {
            error: error.message,
            code: error.code,
          });
        },
      );
    }
  };

  const filterClubs = () => {
    // Ronda 14, stream B: el predicado es compartido con la tarjeta
    // fija Club Demo (abajo): antes solo filtraba `filteredClubs` y la
    // tarjeta quedaba fuera, así que buscar "Eden" la dejaba visible.
    setFilteredClubs(
      clubs.filter((club) =>
        clubMatchesSearch(club.name, club.city, searchQuery, selectedCity),
      ),
    );
  };

  const handleCheckIn = async (clubId: string) => {
    if (!isAuthenticated()) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para hacer check-in",
        variant: "destructive",
      });
      return;
    }

    if (!userLocation) {
      toast({
        title: "Ubicación requerida",
        description: "Necesitamos tu ubicación para verificar el check-in",
        variant: "destructive",
      });
      return;
    }

    try {
      setCheckingIn(clubId);

      // Aquí iría la lógica de check-in con verificación de distancia
      // Por ahora simulamos el proceso

      toast({
        title: "Check-in exitoso",
        description: "¡Has hecho check-in en el club!",
        variant: "default",
      });

      logger.info("Club check-in successful", { clubId, userId: user?.id });
    } catch (error) {
      logger.error("Check-in error:", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error en check-in",
        description: "No se pudo completar el check-in",
        variant: "destructive",
      });
    } finally {
      setCheckingIn(null);
    }
  };

  // El filtro "Ciudad" ofrece ciudades (club.city), no direcciones
  // completas: antes listaba "Av. Insurgentes Sur 123" y similares.
  const cities = [...new Set(clubs.map((club) => club.city).filter((c): c is string => Boolean(c)))];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setClubForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sin aceptar los términos de club no se envía: abrir el modal.
    if (!clubTermsAccepted) {
      setShowClubTermsModal(true);
      return;
    }
    await submitClubApplication();
  };

  const submitClubApplication = async () => {
    setSubmitting(true);

    try {
      // Generar contraseña temporal aleatoria (12 caracteres) con
      // crypto.getRandomValues (CSPRNG). Math.random() NO es seguro para
      // credenciales (auditoría forense). Muestreo por rechazo para evitar
      // sesgo de módulo (2^32 % 70 = 46).
      const generateTempPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const randomValues = new Uint32Array(12);
        crypto.getRandomValues(randomValues);
        const maxValid = Math.floor(0xffffffff / chars.length) * chars.length;
        let password = '';
        for (const value of randomValues) {
          let v = value;
          while (v >= maxValid) {
            const refill = new Uint32Array(1);
            crypto.getRandomValues(refill);
            v = refill[0] as number;
          }
          password += chars.charAt(v % chars.length);
        }
        return password;
      };

      const tempPassword = generateTempPassword();
      const tempPasswordExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

      // Guardar en base de datos usando cast para evitar error de tipos
      const { data, error } = await supabase!
        .from("club_applications")
        .insert([
          {
            owner_name: clubForm.ownerName,
            owner_age: parseInt(clubForm.ownerAge),
            owner_gender: clubForm.ownerGender,
            owner_rfc: clubForm.ownerRFC,
            rep_name: clubForm.repName,
            rep_position: clubForm.repPosition,
            rep_phone: clubForm.repPhone,
            rep_email: clubForm.repEmail,
            club_name: clubForm.clubName,
            address: clubForm.address,
            location: clubForm.city,
            state: clubForm.state,
            zip_code: clubForm.zipCode,
            phone: clubForm.phone,
            whatsapp: clubForm.whatsapp,
            website: clubForm.website,
            use_app_as_website: clubForm.useAppAsWebsite,
            email: clubForm.email,
            description: clubForm.description,
            club_type: clubForm.clubType,
            hours: clubForm.hours,
            capacity: parseInt(clubForm.capacity),
            documents_url: clubForm.documentsUrl,
            company_rfc: clubForm.companyRFC,
            license: clubForm.license,
            status: "pending",
            created_at: new Date().toISOString(),
            temp_password: tempPassword,
            temp_password_expires_at: tempPasswordExpiresAt.toISOString(),
            temp_password_used: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Enviar email usando Supabase Edge Function
      if (supabase) {
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: 'complicesconectasw@outlook.es',
            template: 'club-application',
            data: {
              ...clubForm,
              tempPassword: tempPassword,
              tempPasswordExpiresAt: tempPasswordExpiresAt.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
              createdAt: new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
            },
          },
        });

        if (emailError) {
          logger.warn('Email sending failed (non-critical):', emailError);
        }
      } else {
        logger.warn('Supabase client not available for sending email');
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud ha sido enviada exitosamente. Recibirás un email con tus credenciales de acceso temporal.",
        variant: "default",
      });

      setIsModalOpen(false);
      setClubForm({
        ownerName: "",
        ownerAge: "",
        ownerGender: "",
        ownerRFC: "",
        repName: "",
        repPosition: "",
        repPhone: "",
        repEmail: "",
        clubName: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        whatsapp: "",
        website: "",
        useAppAsWebsite: false,
        email: "",
        description: "",
        clubType: "",
        hours: "",
        capacity: "",
        documentsUrl: "",
        companyRFC: "",
        license: "",
      });

      logger.info("Club application submitted successfully", {
        clubId: (data as { id?: string | number | null } | null)?.id,
      });
    } catch (error) {
      logger.error("Error submitting club application:", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {selectedClub ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/clubs")}
                className="border-slate-300 text-slate-900 hover:bg-slate-100 dark:border-white/30 dark:text-white dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>

            <ClubProfileHeader club={selectedClub} />
            <ClubProfileGallery images={DEMO_GALLERY} />
            <ClubProfileEvents events={DEMO_EVENTS} />
            <ClubProfileReviews
              reviews={DEMO_REVIEWS}
              averageRating={selectedClub.rating_average}
              totalReviews={selectedClub.rating_count}
              clubId={String(selectedClub.id)}
              currentUserName={
                profile?.display_name ?? user?.email ?? "Tú"
              }
              isAnonymous={isAnonymousDemoProfile(profile)}
            />

            {/* Consentimiento del club: el usuario acepta los documentos del
                club (términos, privacidad, descargo) y queda guardado en
                public.user_consents con club_id. */}
            {user?.id && (
              <ClubConsentManager
                clubId={selectedClub.id}
                userId={user.id}
                onConsentComplete={(consents) => {
                  logger.info("Consentimientos del club aceptados", {
                    clubId: selectedClub.id,
                    count: consents.length,
                  });
                  toast({
                    title: "Consentimiento guardado",
                    description: "Tus consentimientos para este club quedaron registrados.",
                    variant: "default",
                  });
                }}
                onConsentError={(error) => {
                  toast({
                    title: "Error",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
            )}
            {selectedClub.id === "demo" && (
              <ClubProfileAdmin analytics={DEMO_ANALYTICS} clubId={selectedClub.id} />
            )}

            {selectedClub.id !== "demo" && isAdminUser && (
              <ClubProfileAdmin
                analytics={{
                  totalVisits: 0,
                  totalCheckIns: selectedClub.check_in_count,
                  averageRating: selectedClub.rating_average,
                  totalReviews: selectedClub.rating_count,
                  weeklyVisits: 0,
                  monthlyVisits: 0,
                  topEvents: [],
                  demographics: [],
                  cmpx_balance: selectedClub.cmpx_balance ?? 0,
                  membership_tier: selectedClub.membership_tier ?? "free",
                  live_status: selectedClub.live_status ?? "❓ Desconocido",
                }}
                clubId={selectedClub.id}
              />
            )}
          </div>
        ) : (
          <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="bg-linear-to-r from-purple-400 to-fuchsia-500 text-white font-bold mb-4">
            🏢 CLUBS VERIFICADOS
          </Badge>
          {/* RONDA 11 (stream B, B3): el hero y la tarjeta de
              verificación eran `text-white` sobre cristal `bg-white/10`:
              en tema claro el fondo es lavanda claro y el texto blanco
              era ilegible. Ahora el fondo de la tarjeta es blanco opaco
              en claro (oscuro translúcido en oscuro) y los textos
              llevan su variante clara. */}
          <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Clubs
            <span className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}
              Verificados
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-white/80 max-w-3xl mx-auto mb-8">
            Descubre clubs auténticos con check-ins geolocalizados, reseñas
            verificadas y sistema de watermark automático
          </p>
        </motion.div>

        {/* Sistema de Verificación Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-linear-to-r from-green-500 to-emerald-600 rounded-lg">
                  <Verified className="h-6 w-6 text-white" />
                </div>
                Sistema de Clubs Verificados
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-white/70 text-lg">
                Proceso riguroso de verificación para garantizar clubs
                auténticos y experiencias seguras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Proceso de Verificación */}
                <div>
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-400" />
                    Proceso de Verificación
                  </h4>
                  <div className="space-y-4">
                    {clubSystemInfo.verificationProcess.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"
                      >
                        <div className="p-2 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg text-white shrink-0">
                          {step.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white">
                            {step.step}
                          </h5>
                          <p className="text-slate-600 dark:text-white/70 text-sm">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Beneficios */}
                <div>
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Beneficios de Verificación
                  </h4>
                  <div className="space-y-3">
                    {clubSystemInfo.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"
                      >
                        <div className="p-2 bg-linear-to-r from-purple-500 to-fuchsia-600 rounded-lg text-white shrink-0">
                          {benefit.icon}
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white">
                            {benefit.title}
                          </h5>
                          <p className="text-slate-600 dark:text-white/70 text-sm">
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

        {/* Filtros y Búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-white/60 h-4 w-4" />
                    <Input
                      placeholder="Buscar clubs por nombre o ciudad..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900/5 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/60"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    aria-label="Filtrar por ciudad"
                    title="Filtrar por ciudad"
                    className="w-full p-2 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 rounded-md text-slate-900 dark:text-white"
                  >
                    <option value="all" className="bg-purple-900">
                      Todas las ciudades
                    </option>
                    {cities.map((city) => (
                      <option key={city} value={city || ""} className="bg-purple-900">
                        {city}
                      </option>
                    ))}
                  </select>
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
          {/* Ronda 15 (stream C): mismo bug que la wallet demo —
              gradiente translúcido (`/40`) con texto blanco: en tema
              claro el fondo claro se transparentaba y el blanco era
              ilegible. Gradiente opaco en ambos temas. */}
          <Card className="bg-linear-to-br from-purple-900 to-blue-900 backdrop-blur-xl border-white/20 shadow-2xl">
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
                    <h3 className="text-lg font-semibold text-white">Check-ins Verificados (próximamente)</h3>
                  </div>
                  <p className="text-white/70 text-sm ml-11">
                    Check-in geolocalizado (radio 50 m) con WorldID — próximamente
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
                    En beta, las reseñas están abiertas a todos los usuarios; la reseña verificada con check-in real llega próximamente
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
                    Aceptación de CMPX/GTK como pago, sistema de recompensas y descuentos exclusivos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sección Próximamente */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="bg-linear-to-r from-amber-900/40 to-orange-900/40 backdrop-blur-xl border-amber-400/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Target className="h-6 w-6" />
                🚀 Próximamente en ComplicesConecta
              </CardTitle>
              <CardDescription className="text-amber-200/80">
                Nuevas funcionalidades exclusivas para clubs verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Clubs en Perfiles</h3>
                      <p className="text-white/70 text-sm">
                        Los clubs verificados tendrán su propio perfil profesional, similar a los perfiles de usuarios (single/couple), con galería de fotos, videos, eventos y sistema de check-ins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Sistema de Descuentos Premium</h3>
                      <p className="text-white/70 text-sm">
                        Descuentos en entrada con CMPX, beneficios exclusivos para holders de GTK y promociones especiales para usuarios premium
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">NFTs de Clubs</h3>
                      <p className="text-white/70 text-sm">
                        Perfiles verificados como NFTs, coleccionables exclusivos de clubs y mercado secundario de NFTs
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Integración con Tokens</h3>
                      <p className="text-white/70 text-sm">
                        Aceptación de CMPX como pago, sistema de recompensas y staking de tokens en clubs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Analytics Avanzados</h3>
                      <p className="text-white/70 text-sm">
                        Visitas a la página, check-ins por día/semana/mes, engagement de usuarios y demografía de visitantes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Panel de Administración</h3>
                      <p className="text-white/70 text-sm">
                        Edición completa del perfil, subida de contenido, creación de eventos, gestión de promociones y respuesta a reseñas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-400/30">
                <p className="text-center text-amber-200">
                  <strong>📅 Lanzamiento estimado:</strong> Q2 2026
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de Clubs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/20 animate-pulse"
                >
                  <CardContent className="p-6">
                    <div className="h-48 bg-slate-900/10 dark:bg-white/10 rounded-lg mb-4"></div>
                    <div className="h-6 bg-slate-900/10 dark:bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-slate-900/10 dark:bg-white/10 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-slate-900/10 dark:bg-white/10 rounded flex-1"></div>
                      <div className="h-8 bg-slate-900/10 dark:bg-white/10 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClubs.length === 0 ? (
            <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/20 text-center p-12">
              <div className="text-slate-500 dark:text-white/60 mb-4">
                <Building className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No se encontraron clubs
                </h3>
                <p>Intenta ajustar tus filtros de búsqueda</p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Ronda 14, stream B: la tarjeta fija Club Demo pasa por
                  el mismo predicado de búsqueda/ciudad que la lista:
                  antes era incondicional (`{!slug && ...}`) y buscar
                  "Eden" la dejaba visible junto a Eden Noir. */}
              {!slug &&
                clubMatchesSearch(
                  DEMO_CLUB.name,
                  DEMO_CLUB.city,
                  searchQuery,
                  selectedCity,
                ) && (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/15 transition-all duration-300 hover:scale-105 h-full">
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-linear-to-br from-purple-600 to-fuchsia-600 rounded-t-lg overflow-hidden">
                        {DEMO_CLUB.cover_image_url ? (
                          <img
                            src={DEMO_CLUB.cover_image_url}
                            alt={DEMO_CLUB.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="h-16 w-16 text-white/60" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-purple-500/90 text-white border border-purple-300/40">
                            Admin
                          </Badge>
                          <Badge className="bg-green-500/90 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                          <Badge className="bg-yellow-500/90 text-black">
                            <Star className="h-3 w-3 mr-1" />
                            Destacado
                          </Badge>
                        </div>

                        <div className="absolute top-3 right-3">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-white font-semibold">
                              {DEMO_CLUB.rating_average.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {DEMO_CLUB.name}
                        </h3>

                        <div className="flex items-center gap-2 text-slate-600 dark:text-white/70 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {DEMO_CLUB.address}
                          </span>
                        </div>

                        {DEMO_CLUB.description && (
                          <ExpandableClubDescription
                            text={DEMO_CLUB.description}
                            className="mb-4"
                            textClassName="text-slate-600 dark:text-white/80 text-sm"
                          />
                        )}

                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {DEMO_CLUB.check_in_count}
                            </div>
                            <div className="text-slate-500 dark:text-white/60 text-xs">
                              Check-ins
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {/* Ronda 16 (stream C): conteo VIVO de
                                  reseñas (semilla + las del usuario,
                                  mismo mecanismo que el encabezado):
                                  antes la tarjeta decía 128 mientras
                                  /clubs/demo ya decía 130. "Ratings"
                                  sigue con el `rating_count` de la
                                  semilla: es otra métrica. */}
                              <LiveClubReviewCount
                                clubId={String(DEMO_CLUB.id)}
                                seedCount={DEMO_CLUB.rating_count}
                              />
                            </div>
                            <div className="text-slate-500 dark:text-white/60 text-xs">Reseñas</div>
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {DEMO_CLUB.rating_count}
                            </div>
                            <div className="text-slate-500 dark:text-white/60 text-xs">Ratings</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            // Origen del flujo (ronda 14, stream E): el
                            // "Volver" de /clubs/demo vuelve aquí, al
                            // directorio, no al listado público.
                            onClick={() =>
                              navigate("/clubs/demo", {
                                state: { from: "/clubs" },
                              })
                            }
                            className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Club
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {filteredClubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white dark:bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-white/15 transition-all duration-300 hover:scale-105 h-full">
                    <CardContent className="p-0">
                      {/* Imagen del Club */}
                      <div className="relative h-48 bg-linear-to-br from-purple-600 to-fuchsia-600 rounded-t-lg overflow-hidden">
                        {club.cover_image_url ? (
                          <img
                            src={club.cover_image_url}
                            alt={club.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="h-16 w-16 text-white/60" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {club.is_verified && (
                            <Badge className="bg-green-500/90 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                          {club.is_featured && (
                            <Badge className="bg-yellow-500/90 text-black">
                              <Star className="h-3 w-3 mr-1" />
                              Destacado
                            </Badge>
                          )}
                        </div>

                        {/* Rating */}
                        <div className="absolute top-3 right-3">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-white font-semibold">
                              {club.rating_average.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Información del Club */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {club.name}
                        </h3>

                        <div className="flex items-center gap-2 text-slate-600 dark:text-white/70 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {club.address || "Ubicación no disponible"}
                          </span>
                        </div>

                        {club.description && (
                          <ExpandableClubDescription
                            text={club.description}
                            className="mb-4"
                            textClassName="text-slate-600 dark:text-white/80 text-sm"
                          />
                        )}

                        {/* Estadísticas */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {club.check_in_count}
                            </div>
                            <div className="text-slate-500 dark:text-white/60 text-xs">
                              Check-ins
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {/* Ronda 16 (stream C): conteo VIVO de
                                  reseñas, igual que la tarjeta fija
                                  del Club Demo: semilla + reseñas del
                                  usuario en este club, sin recargar. */}
                              <LiveClubReviewCount
                                clubId={String(club.id)}
                                seedCount={club.review_count}
                              />
                            </div>
                            <div className="text-slate-500 dark:text-white/60 text-xs">Reseñas</div>
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {club.rating_count}
                            </div>
                            <div className="text-slate-500 dark:text-white/60 text-xs">Ratings</div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/clubs-public/${club.slug || club.id}`)}
                            className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Club
                          </Button>

                          {isAuthenticated() && (
                            <Button
                              onClick={() => handleCheckIn(club.id)}
                              disabled={checkingIn === club.id}
                              className="bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 border-slate-300 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:border-white/30"
                            >
                              {checkingIn === club.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <Navigation className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card className="bg-white dark:bg-linear-to-r dark:from-blue-600/20 dark:via-purple-600/20 dark:to-fuchsia-600/20 backdrop-blur-xl border-slate-200 dark:border-white/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                ¿Tienes un Club?
              </h3>
              <p className="text-slate-600 dark:text-white/80 mb-6 max-w-2xl mx-auto">
                Únete a nuestro programa de clubs verificados y obtén acceso a
                herramientas exclusivas, check-ins geolocalizados y un sistema
                de reseñas auténticas.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3"
              >
                <Building className="h-5 w-5 mr-2" />
                Registrar mi Club
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal de Registro de Club */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Registrar Nuevo Club"
          description="Completa el formulario para solicitar la verificación de tu club. Al aprobar tu solicitud, recibirás credenciales de acceso temporal para administrar tu perfil de club en la plataforma."
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleClubSubmit} className="space-y-6">
            {/* Información del Propietario */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Propietario
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Nombre Completo *</Label>
                  <Input
                    id="ownerName"
                    name="ownerName"
                    value={clubForm.ownerName}
                    onChange={handleInputChange}
                    required
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerAge">Edad *</Label>
                  <Input
                    id="ownerAge"
                    name="ownerAge"
                    type="number"
                    value={clubForm.ownerAge}
                    onChange={handleInputChange}
                    required
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerGender">Género *</Label>
                  <select
                    id="ownerGender"
                    name="ownerGender"
                    value={clubForm.ownerGender}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                    aria-label="Seleccionar género del propietario"
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="ownerRFC">RFC del Propietario *</Label>
                  <Input
                    id="ownerRFC"
                    name="ownerRFC"
                    value={clubForm.ownerRFC}
                    onChange={handleInputChange}
                    required
                    placeholder="XAXX010101000"
                  />
                </div>
              </div>
            </div>

            {/* Información del Representante (opcional) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Información del Representante (si aplica)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repName">Nombre Completo</Label>
                  <Input
                    id="repName"
                    name="repName"
                    value={clubForm.repName}
                    onChange={handleInputChange}
                    placeholder="María García"
                  />
                </div>
                <div>
                  <Label htmlFor="repPosition">Cargo</Label>
                  <Input
                    id="repPosition"
                    name="repPosition"
                    value={clubForm.repPosition}
                    onChange={handleInputChange}
                    placeholder="Gerente"
                  />
                </div>
                <div>
                  <Label htmlFor="repPhone">Teléfono</Label>
                  <Input
                    id="repPhone"
                    name="repPhone"
                    value={clubForm.repPhone}
                    onChange={handleInputChange}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="repEmail">Email</Label>
                  <Input
                    id="repEmail"
                    name="repEmail"
                    type="email"
                    value={clubForm.repEmail}
                    onChange={handleInputChange}
                    placeholder="rep@club.com"
                  />
                </div>
              </div>
            </div>

            {/* Información del Club */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información del Club
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="clubName">Nombre del Club *</Label>
                  <Input
                    id="clubName"
                    name="clubName"
                    value={clubForm.clubName}
                    onChange={handleInputChange}
                    required
                    placeholder="Club Nocturno XYZ"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Dirección Física *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={clubForm.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Av. Principal #123, Col. Centro"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={clubForm.city || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Ciudad de México"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={clubForm.state}
                    onChange={handleInputChange}
                    required
                    placeholder="CDMX"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Código Postal *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={clubForm.zipCode}
                    onChange={handleInputChange}
                    required
                    placeholder="06000"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={clubForm.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={clubForm.whatsapp}
                    onChange={handleInputChange}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email de Contacto *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={clubForm.email}
                    onChange={handleInputChange}
                    required
                    placeholder="contacto@club.com"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Sitio Web (opcional)</Label>
                  <Input
                    id="website"
                    name="website"
                    value={clubForm.website}
                    onChange={handleInputChange}
                    placeholder="https://www.club.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useAppAsWebsite"
                    name="useAppAsWebsite"
                    checked={clubForm.useAppAsWebsite}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    aria-label="Usar aplicación como sitio web"
                  />
                  <Label htmlFor="useAppAsWebsite" className="text-sm text-gray-700">
                    Usar aplicación como sitio web
                  </Label>
                </div>
              </div>
            </div>

            {/* Detalles del Club */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Detalles del Club
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={clubForm.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Describe tu club, ambiente, música, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="clubType">Tipo de Club *</Label>
                  <select
                    id="clubType"
                    name="clubType"
                    value={clubForm.clubType}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                    aria-label="Seleccionar tipo de club"
                  >
                    <option value="">Seleccionar</option>
                    <option value="bar">Bar</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="lounge">Lounge</option>
                    <option value="antro">Antro</option>
                    <option value="club_nocturno">Club Nocturno</option>
                    <option value="pub">Pub</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="hours">Horarios de Operación *</Label>
                  <Input
                    id="hours"
                    name="hours"
                    value={clubForm.hours}
                    onChange={handleInputChange}
                    required
                    placeholder="Jue-Dom 21:00 - 06:00"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacidad Aproximada *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={clubForm.capacity}
                    onChange={handleInputChange}
                    required
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentsUrl">URL de Documentos Legales *</Label>
                  <Input
                    id="documentsUrl"
                    name="documentsUrl"
                    value={clubForm.documentsUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sube tus documentos a Google Drive, Dropbox o similar y pega el enlace
                  </p>
                </div>
                <div>
                  <Label htmlFor="companyRFC">RFC de la Empresa (opcional)</Label>
                  <Input
                    id="companyRFC"
                    name="companyRFC"
                    value={clubForm.companyRFC}
                    onChange={handleInputChange}
                    placeholder="XAXX010101000"
                  />
                </div>
                <div>
                  <Label htmlFor="license">Licencia de Operación (opcional)</Label>
                  <Input
                    id="license"
                    name="license"
                    value={clubForm.license}
                    onChange={handleInputChange}
                    placeholder="Número de licencia"
                  />
                </div>
              </div>
            </div>

            {/* Términos de uso para clubs (obligatorios para registrar) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowClubTermsModal(true)}
                className="text-sm text-purple-700 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200 underline underline-offset-2"
              >
                {clubTermsAccepted
                  ? "✓ Términos de Uso para Clubs aceptados (ver)"
                  : "Leer y aceptar los Términos de Uso para Clubs"}
              </button>
              {!clubTermsAccepted && (
                <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                  Debes aceptar los términos y la política de privacidad para
                  clubs para enviar la solicitud.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de términos de uso para clubs */}
        <TermsModalClub
          isOpen={showClubTermsModal}
          onClose={() => setShowClubTermsModal(false)}
          onAccept={() => {
            setClubTermsAccepted(true);
            setShowClubTermsModal(false);
            // Aceptados: enviar la solicitud de inmediato.
            void submitClubApplication();
          }}
        />
          </>
        )}
      </div>
    </div>
  );
};

// Removed default export to support tree-shaking and named imports consistency

