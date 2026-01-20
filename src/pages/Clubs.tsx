import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/forms/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { MapPin, Star, CheckCircle, FileText, Shield, Search, Globe, Camera, Award, Verified, Navigation, Eye, Building, Target, Sparkles, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase-generated";

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

export const Clubs = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    loadClubs();
    requestUserLocation();
  }, []);

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

      setClubs((data || []) as Club[]);
      logger.info("Clubs loaded successfully", { count: data?.length });
    } catch (error) {
      logger.error("Error loading clubs:", {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast({
        title: "Error",
        description: "No se pudieron cargar los clubs",
        variant: "destructive",
      });
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
          logger.warn("Geolocation error:", error);
        },
      );
    }
  };

  const filterClubs = () => {
    let filtered = clubs;

    if (searchQuery) {
      filtered = filtered.filter(
        (club) =>
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (club.address && club.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (club.description &&
            club.description.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    if (selectedCity !== "all") {
      filtered = filtered.filter((club) => club.address === selectedCity);
    }

    setFilteredClubs(filtered);
  };

  const handleCheckIn = async (clubId: string) => {
    if (!isAuthenticated) {
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

  const cities = [...new Set(clubs.map((club) => club.address).filter((loc): loc is string => Boolean(loc)))];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setClubForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generar contraseña temporal aleatoria (12 caracteres)
      const generateTempPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      const tempPassword = generateTempPassword();
      const tempPasswordExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

      // Guardar en base de datos usando cast para evitar error de tipos
      const { data, error } = await supabase!
        .from("club_applications" as never)
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
          } as never,
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
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="bg-linear-to-r from-purple-400 to-fuchsia-500 text-white font-bold mb-4">
            🏢 CLUBS VERIFICADOS
          </Badge>
          <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold text-white mb-6 leading-tight">
            Clubs
            <span className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}
              Verificados
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
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
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-linear-to-r from-green-500 to-emerald-600 rounded-lg">
                  <Verified className="h-6 w-6 text-white" />
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

        {/* Filtros y Búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                      placeholder="Buscar clubs por nombre o ciudad..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    aria-label="Filtrar por ciudad"
                    title="Filtrar por ciudad"
                    className="w-full p-2 bg-white/10 border border-white/20 rounded-md text-white"
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
                  className="bg-white/10 backdrop-blur-xl border-white/20 animate-pulse"
                >
                  <CardContent className="p-6">
                    <div className="h-48 bg-white/10 rounded-lg mb-4"></div>
                    <div className="h-6 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-white/10 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-white/10 rounded flex-1"></div>
                      <div className="h-8 bg-white/10 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClubs.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-center p-12">
              <div className="text-white/60 mb-4">
                <Building className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No se encontraron clubs
                </h3>
                <p>Intenta ajustar tus filtros de búsqueda</p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 h-full">
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
                        <h3 className="text-xl font-bold text-white mb-2">
                          {club.name}
                        </h3>

                        <div className="flex items-center gap-2 text-white/70 mb-3">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {club.address || "Ubicación no disponible"}
                          </span>
                        </div>

                        {club.description && (
                          <p className="text-white/80 text-sm mb-4 line-clamp-2">
                            {club.description}
                          </p>
                        )}

                        {/* Estadísticas */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                          <div>
                            <div className="text-white font-semibold">
                              {club.check_in_count}
                            </div>
                            <div className="text-white/60 text-xs">
                              Check-ins
                            </div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {club.review_count}
                            </div>
                            <div className="text-white/60 text-xs">Reseñas</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {club.rating_count}
                            </div>
                            <div className="text-white/60 text-xs">Ratings</div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/clubs/${club.id}`)}
                            className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Club
                          </Button>

                          {isAuthenticated() && (
                            <Button
                              onClick={() => handleCheckIn(club.id)}
                              disabled={checkingIn === club.id}
                              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
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
          <Card className="bg-linear-to-r from-blue-600/20 via-purple-600/20 to-fuchsia-600/20 backdrop-blur-xl border-white/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                ¿Tienes un Club?
              </h3>
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">
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
      </div>
    </div>
  );
};

// Removed default export to support tree-shaking and named imports consistency
