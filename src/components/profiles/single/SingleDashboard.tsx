import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/useToast";
import { advancedCoupleService } from "@/services/social/couple/AdvancedCoupleService";
import { matchService } from "@/services/social/social/MatchService";
import {
  User,
  Heart,
  Calendar,
  Star,
  TrendingUp,
  MessageCircle,
  Eye,
  Gift,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Tipos espejo de CoupleProfile/CoupleEvent/CoupleMatch de
// AdvancedCoupleService, adaptados a un solo perfil: sin partner1_id /
// partner2_id, sin relationship_type ni relationship_duration (conceptos de
// pareja) y con name en vez de couple_name.
interface SingleProfile {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  interests: string[];
  location: string;
  latitude: number;
  longitude: number;
  age: number;
  age_range_min: number;
  age_range_max: number;
  looking_for: string[];
  experience_level: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  photos: string[];
  videos: string[];
  preferences: SinglePreferences;
  statistics: SingleStatistics;
  compatibility_factors: CompatibilityFactors;
}

interface SinglePreferences {
  gender_preferences: string[];
  age_preferences: { min: number; max: number };
  location_preferences: { max_distance: number; cities: string[] };
  activity_preferences: string[];
  communication_preferences: string[];
  meeting_preferences: string[];
  privacy_level: string;
}

interface SingleStatistics {
  total_views: number;
  total_likes: number;
  total_matches: number;
  total_messages: number;
  response_rate: number;
  profile_completeness: number;
  last_active: string;
  join_date: string;
  verification_level: number;
}

interface CompatibilityFactors {
  shared_interests: string[];
  compatibility_score: number;
  personality_match: number;
  lifestyle_match: number;
  location_compatibility: number;
  experience_compatibility: number;
}

interface SingleMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  match_score: number;
  compatibility_factors: CompatibilityFactors;
  match_reasons: string[];
  created_at: string;
  status: string;
}

interface SingleEvent {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  date: string;
  max_participants: number;
  participants: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const SingleDashboard: React.FC = () => {
  const [singleProfile, setSingleProfile] = useState<SingleProfile | null>(
    null,
  );
  const [nearbySingles, setNearbySingles] = useState<SingleProfile[]>([]);
  const [_compatibleSingles, setCompatibleSingles] = useState<SingleProfile[]>(
    [],
  );
  const [singleEvents, setSingleEvents] = useState<SingleEvent[]>([]);
  const [singleMatches, setSingleMatches] = useState<SingleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadSingleData();

    // Actualizar cada 5 minutos
    const interval = setInterval(loadSingleData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSingleData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simular carga de datos de perfil single (mismo enfoque que
      // CoupleDashboard: datos mock en el componente; el servicio real solo
      // se usa en los handlers de like y de unirse a eventos).
      const mockSingleProfile: SingleProfile = {
        id: "single-1",
        user_id: "user1",
        name: "Sofía",
        bio: "Buscando conexiones auténticas y encuentros discretos. Disfruto de la música, viajes y conocer gente interesante.",
        interests: ["música", "viajes", "gastronomía", "arte", "deportes"],
        location: "Madrid, España",
        latitude: 40.4168,
        longitude: -3.7038,
        age: 28,
        age_range_min: 25,
        age_range_max: 45,
        looking_for: ["parejas", "eventos", "viajes"],
        experience_level: "intermediate",
        is_active: true,
        is_verified: true,
        is_premium: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        photos: ["/placeholder.svg", "/placeholder.svg"],
        videos: [],
        preferences: {
          gender_preferences: ["mixed"],
          age_preferences: { min: 25, max: 45 },
          location_preferences: {
            max_distance: 50,
            cities: ["Madrid", "Barcelona"],
          },
          activity_preferences: ["cena", "eventos", "viajes"],
          communication_preferences: ["chat", "videollamada"],
          meeting_preferences: ["público", "privado"],
          privacy_level: "discrete",
        },
        statistics: {
          total_views: 156,
          total_likes: 23,
          total_matches: 8,
          total_messages: 45,
          response_rate: 85.5,
          profile_completeness: 92,
          last_active: new Date().toISOString(),
          join_date: new Date(
            Date.now() - 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          verification_level: 3,
        },
        compatibility_factors: {
          shared_interests: ["música", "viajes"],
          compatibility_score: 0.85,
          personality_match: 0.9,
          lifestyle_match: 0.8,
          location_compatibility: 0.95,
          experience_compatibility: 0.75,
        },
      };

      setSingleProfile(mockSingleProfile);

      // Simular perfiles cercanos
      const mockNearbySingles: SingleProfile[] = [
        {
          id: "single-2",
          user_id: "user3",
          name: "Ana",
          bio: "Explorando el lifestyle swinger",
          interests: ["música", "deportes", "cine"],
          location: "Madrid, España",
          latitude: 40.4168,
          longitude: -3.7038,
          age: 26,
          age_range_min: 28,
          age_range_max: 35,
          looking_for: ["parejas", "eventos"],
          experience_level: "beginner",
          is_active: true,
          is_verified: false,
          is_premium: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          photos: ["/placeholder.svg"],
          videos: [],
          preferences: {
            gender_preferences: ["mixed"],
            age_preferences: { min: 25, max: 40 },
            location_preferences: { max_distance: 30, cities: ["Madrid"] },
            activity_preferences: ["cena", "eventos"],
            communication_preferences: ["chat"],
            meeting_preferences: ["público"],
            privacy_level: "public",
          },
          statistics: {
            total_views: 45,
            total_likes: 8,
            total_matches: 2,
            total_messages: 12,
            response_rate: 75.0,
            profile_completeness: 78,
            last_active: new Date().toISOString(),
            join_date: new Date(
              Date.now() - 90 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            verification_level: 1,
          },
          compatibility_factors: {
            shared_interests: ["música"],
            compatibility_score: 0.72,
            personality_match: 0.8,
            lifestyle_match: 0.7,
            location_compatibility: 0.9,
            experience_compatibility: 0.6,
          },
        },
      ];

      setNearbySingles(mockNearbySingles);
      setCompatibleSingles(mockNearbySingles);

      // Simular eventos
      const mockEvents: SingleEvent[] = [
        {
          id: "event-1",
          profile_id: "single-1",
          title: "Cena Single en Madrid",
          description: "Cena elegante para singles en restaurante exclusivo",
          event_type: "dinner",
          location: "Madrid, España",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          max_participants: 8,
          participants: ["single-2"],
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setSingleEvents(mockEvents);

      // Simular matches
      const mockMatches: SingleMatch[] = [
        {
          id: "match-1",
          user1_id: "single-1",
          user2_id: "single-2",
          match_score: 0.85,
          compatibility_factors: {
            shared_interests: ["música"],
            compatibility_score: 0.85,
            personality_match: 0.9,
            lifestyle_match: 0.8,
            location_compatibility: 0.95,
            experience_compatibility: 0.75,
          },
          match_reasons: [
            "Intereses compartidos",
            "Ubicación cercana",
            "Experiencia compatible",
          ],
          created_at: new Date().toISOString(),
          status: "accepted",
        },
      ];

      setSingleMatches(mockMatches);
    } catch (err) {
      setError("Error loading single data");
      console.error("Error loading single data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeSingle = async (singleId: string) => {
    try {
      if (!singleProfile) return;

      // Equivalente single de recordCoupleInteraction: MatchService.createLike
      // escribe en profile_likes y detecta match mutuo.
      const result = await matchService.createLike(singleProfile.id, singleId);

      if (!result.success) {
        throw new Error("No se pudo enviar el like");
      }

      toast({
        title: "Like enviado",
        description: "Has enviado un like",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo enviar el like",
        variant: "destructive",
      });
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      if (!singleProfile) return;

      // No existe endpoint de eventos para singles: se reutiliza la misma
      // fuente que CoupleDashboard (tabla couple_events, participantes por
      // id) con el id del single como participante.
      const success = await advancedCoupleService.joinCoupleEvent(
        eventId,
        singleProfile.id,
      );

      if (success) {
        toast({
          title: "Te has unido al evento",
          description: "Has sido añadido a la lista de participantes",
        });

        // Actualizar la lista de eventos
        setSingleEvents((prev) =>
          prev.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  participants: [...event.participants, singleProfile.id],
                }
              : event,
          ),
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo unir al evento",
        variant: "destructive",
      });
    }
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "secondary";
      case "intermediate":
        return "default";
      case "advanced":
        return "default";
      case "expert":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!singleProfile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No se encontró el perfil</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <User className="mr-2 h-6 w-6" />
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            {singleProfile.name} • {singleProfile.location}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSingleData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas del perfil */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vistas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {singleProfile.statistics.total_views}
            </div>
            <p className="text-xs text-muted-foreground">Perfil visto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {singleProfile.statistics.total_likes}
            </div>
            <p className="text-xs text-muted-foreground">Likes recibidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {singleProfile.statistics.total_matches}
            </div>
            <p className="text-xs text-muted-foreground">
              Perfiles compatibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {singleProfile.statistics.total_messages}
            </div>
            <p className="text-xs text-muted-foreground">
              Conversaciones activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="discover">Descubrir</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Información del perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Información del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {singleProfile.name}, {singleProfile.age}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {singleProfile.bio}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={getExperienceLevelColor(
                        singleProfile.experience_level,
                      )}
                    >
                      {singleProfile.experience_level}
                    </Badge>
                    {singleProfile.looking_for.map((lookingFor, index) => (
                      <Badge key={index} variant="outline">
                        {lookingFor}
                      </Badge>
                    ))}
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Intereses:</h5>
                    <div className="flex flex-wrap gap-1">
                      {singleProfile.interests.map((interest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">
                      Completitud del perfil:
                    </h5>
                    <Progress
                      value={singleProfile.statistics.profile_completeness}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {singleProfile.statistics.profile_completeness}% completo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas de compatibilidad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Compatibilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Score General</span>
                      <span className="text-sm text-muted-foreground">
                        {(
                          singleProfile.compatibility_factors
                            .compatibility_score * 100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        singleProfile.compatibility_factors
                          .compatibility_score * 100
                      }
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Personalidad</span>
                      <span className="text-sm text-muted-foreground">
                        {(
                          singleProfile.compatibility_factors
                            .personality_match * 100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        singleProfile.compatibility_factors.personality_match *
                        100
                      }
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Estilo de Vida
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {(
                          singleProfile.compatibility_factors.lifestyle_match *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        singleProfile.compatibility_factors.lifestyle_match *
                        100
                      }
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Ubicación</span>
                      <span className="text-sm text-muted-foreground">
                        {(
                          singleProfile.compatibility_factors
                            .location_compatibility * 100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        singleProfile.compatibility_factors
                          .location_compatibility * 100
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Perfiles Cercanos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nearbySingles.length > 0 ? (
                  nearbySingles.map((single) => (
                    <div key={single.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">
                            {single.name}, {single.age}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {single.location}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={getExperienceLevelColor(
                              single.experience_level,
                            )}
                          >
                            {single.experience_level}
                          </Badge>
                          <Badge variant="outline">
                            {(
                              single.compatibility_factors.compatibility_score *
                              100
                            ).toFixed(0)}
                            % match
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {single.bio}
                      </p>

                      <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-1">
                          {single.interests
                            .slice(0, 3)
                            .map((interest, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {interest}
                              </Badge>
                            ))}
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLikeSingle(single.id)}
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            Like
                          </Button>
                          <Button size="sm">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Mensaje
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No hay perfiles cercanos
                    </h3>
                    <p className="text-muted-foreground">
                      Intenta ampliar tu rango de búsqueda
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {singleMatches.length > 0 ? (
                  singleMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">Match con perfil</h4>
                          <p className="text-sm text-muted-foreground">
                            Score: {(match.match_score * 100).toFixed(1)}%
                          </p>
                        </div>
                        <Badge
                          variant={
                            match.status === "accepted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {match.status}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <h5 className="font-medium mb-2">Razones del match:</h5>
                        <ul className="text-sm space-y-1">
                          {match.match_reasons.map((reason, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Mensaje
                        </Button>
                        <Button size="sm">
                          <Gift className="mr-2 h-4 w-4" />
                          Enviar Regalo
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No hay matches aún</h3>
                    <p className="text-muted-foreground">
                      Explora perfiles cercanos para encontrar matches
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {singleEvents.length > 0 ? (
                  singleEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()} •{" "}
                            {event.location}
                          </p>
                        </div>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {event.description}
                      </p>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {event.participants.length} / {event.max_participants}{" "}
                          participantes
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleJoinEvent(event.id)}
                          disabled={event.participants.includes(
                            singleProfile.id,
                          )}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {event.participants.includes(singleProfile.id)
                            ? "Unido"
                            : "Unirse"}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No hay eventos disponibles
                    </h3>
                    <p className="text-muted-foreground">
                      Crea un evento o espera a que aparezcan nuevos
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
