import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/useAuth";
import { logger } from "@/lib/logger";
import { AdminNav } from "@/components/admin/AdminNav";
import { safeGetItem } from "@/lib/safe-storage";
import { Users,Shield, BarChart3, Plus, Trash2, Settings, Crown } from "lucide-react";

// Types 
interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  created_at: string;
  last_seen?: string;
}

interface AppStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalMatches: number;
  apkDownloads: number;
  dailyVisits: number;
  totalTokens: number;
  stakedTokens: number;
  worldIdVerified: number;
  rewardsDistributed: number;
}

interface Invitation {
  id: string;
  from_profile: string;
  to_profile: string;
  type: "profile" | "gallery" | "chat";
  message: string;
  status: "pending" | "accepted" | "rejected" | "revoked";
  created_at: string;
  decided_at?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  created_at: string;
}

export const Admin = () => {
  const { isAdmin, isAuthenticated, user: _user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AppStats>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalMatches: 0,
    apkDownloads: 0,
    dailyVisits: 0,
    totalTokens: 0,
    stakedTokens: 0,
    worldIdVerified: 0,
    rewardsDistributed: 0,
  });
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
    category: "general",
  });

  useEffect(() => {
    // Check for demo authentication first
    const demoAuth = safeGetItem<string>("demo_authenticated", {
      validate: true,
      defaultValue: "false",
    });
    const demoUser = safeGetItem<unknown>("demo_user", {
      validate: false,
      defaultValue: null,
    });

    if (demoAuth === "true" && demoUser) {
      // Parse user safely
      let user: { accountType?: string; role?: string } | null = null;
      try {
        if (typeof demoUser === "string") {
          user = JSON.parse(demoUser);
        } else if (typeof demoUser === "object" && demoUser !== null) {
          user = demoUser as { accountType?: string; role?: string };
        }
      } catch (error) {
        logger.error("Error parsing demo user:", { error: String(error) });
        user = null;
      }

      if (user && (user.accountType === "admin" || user.role === "admin")) {
        // Redirect admin users to production admin panel
        navigate("/admin-production");
        return;
      } else if (user) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        });
        navigate("/discover");
        return;
      }
    }

    // Check for real authentication
    if (!isAuthenticated()) {
      navigate("/auth");
      return;
    }

    // Check admin permissions for real users
    if (!isAdmin()) {
      toast({
        title: "Acceso Denegado",
        description: "No tienes permisos de administrador",
        variant: "destructive",
      });
      navigate("/discover");
      return;
    }

    // Load admin data for authenticated admin users
    loadAdminData();
  }, [navigate, toast, isAuthenticated, isAdmin]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadProfiles(),
        _loadStats(),
        _loadFAQs(),
        _loadInvitations(),
      ]);
    } catch (error: any) {
      logger.error("Error loading admin data:", { error: String(error) });
      setError(error.message || "Error al cargar datos del panel de administracin");
      toast({
        title: "Error",
        description: error.message || "Error al cargar datos del panel de administracin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      // Use mock data for demo mode to avoid infinite loops
      const mockProfiles: Profile[] = [
        {
          id: "demo-1",
          display_name: "Usuario Demo",
          first_name: "Usuario",
          last_name: "Demo",
          email: "single@outlook.es",
          is_verified: true,
          is_premium: false,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          bio: "Perfil de demostracin",
        },
      ];

      setProfiles(mockProfiles);
    } catch (_error) {
      logger.error("Error loading profiles:", { error: String(_error) });
    } finally {
      setLoading(false);
    }
  };

  const _loadStats = async () => {
    try {
      // Mock stats for now - replace with actual queries
      const mockStats: AppStats = {
        totalUsers: 1250,
        activeUsers: 890,
        premiumUsers: 156,
        totalMatches: 3420,
        apkDownloads: 2100,
        dailyVisits: 450,
        totalTokens: 1000000,
        stakedTokens: 250000,
        worldIdVerified: 89,
        rewardsDistributed: 15000,
      };

      setStats(mockStats);
    } catch (_error) {
      logger.error("Error loading stats:", { error: String(_error) });
    } finally {
      setLoading(false);
    }
  };

  const _loadFAQs = async () => {
    try {
      // Mock FAQs for now
      const mockFAQs: FAQItem[] = [
        {
          id: "1",
          question: "Cmo funciona la verificacin?",
          answer:
            "La verificacin se realiza mediante WorldID y documentos oficiales.",
          category: "general",
          priority: 1,
          created_at: new Date().toISOString(),
        },
      ];
      setFaqs(mockFAQs);
    } catch (_error) {
      logger.error("Error loading FAQs:", { error: String(_error) });
    }
  };

  const _loadInvitations = async () => {
    try {
      // Mock invitations for now
      const mockInvitations: Invitation[] = [
        {
          id: "1",
          from_profile: "user1@example.com",
          to_profile: "user2@example.com",
          type: "profile",
          message: "Me gustara conectar contigo",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ];
      setInvitations(mockInvitations);
    } catch (_error) {
      logger.error("Error loading invitations:", { error: String(_error) });
    }
  };

  const handleAddFAQ = async () => {
    if (!newFaq.question || !newFaq.answer) {
      toast({
        title: "Campos Requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const faqItem: FAQItem = {
        id: Date.now().toString(),
        ...newFaq,
        priority: faqs.length + 1,
        created_at: new Date().toISOString(),
      };

      setFaqs([...faqs, faqItem]);
      setNewFaq({ question: "", answer: "", category: "general" });

      toast({
        title: "FAQ Agregado",
        description: "La pregunta frecuente ha sido agregada exitosamente",
      });
    } catch (_error) {
      logger.error("Error adding FAQ:", { error: String(_error) });
      toast({
        title: "Error",
        description: "Error al agregar FAQ",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFAQ = (faqId: string) => {
    const updatedFaqs = faqs.filter((faq: any) => faq.id !== faqId);
    setFaqs(updatedFaqs);
    toast({
      title: "FAQ Eliminado",
      description: "La pregunta frecuente ha sido eliminada",
    });
  };

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="w-16 h-16 mx-auto text-red-500" />
              <h2 className="text-2xl font-bold text-foreground">
                Acceso Denegado
              </h2>
              <p className="text-muted-foreground">
                No tienes permisos para acceder al panel de administracin.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Settings className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                Cargando...
              </h2>
              <p className="text-muted-foreground">
                Por favor, espera un momento mientras se cargan los datos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background/95 to-primary/5">
      <AdminNav userRole="admin" />
      <div className="container mx-auto px-4 py-8 pt-24">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 font-medium">Error: {error}</p>
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Panel de Administracin
          </h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, estadsticas y configuraciones del sistema
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="invitations">Invitaciones</TabsTrigger>
            <TabsTrigger value="stats">Estadsticas</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Usuarios
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuarios Activos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuarios Premium
                  </CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.premiumUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Matches
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.totalMatches}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestin de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profiles.map((profile: any) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {profile.display_name ||
                            profile.first_name ||
                            "Usuario"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {profile.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectProfile(profile)}
                        >
                          Ver Detalles
                        </Button>
                        <Badge
                          variant={
                            profile.is_verified ? "default" : "secondary"
                          }
                        >
                          {profile.is_verified ? "Verificado" : "Sin verificar"}
                        </Badge>
                        {profile.is_premium && (
                          <Badge variant="outline">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Gestin de Invitaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          De: {invitation.from_profile} ? Para:{" "}
                          {invitation.to_profile}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {invitation.message}
                        </p>
                      </div>
                      <Badge
                        variant={
                          invitation.status === "pending"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estadsticas Detalladas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tokens</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total en circulacin:</span>
                        <span className="font-bold">
                          {stats.totalTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total bloqueado:</span>
                        <span className="font-bold">
                          {stats.stakedTokens.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Verificacin</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>WorldID verificados:</span>
                        <span className="font-bold">
                          {stats.worldIdVerified.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recompensas distribuidas:</span>
                        <span className="font-bold">
                          {stats.rewardsDistributed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Gestin de FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Pregunta"
                      value={newFaq.question}
                      onChange={(e) =>
                        setNewFaq({ ...newFaq, question: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Categora"
                      value={newFaq.category}
                      onChange={(e) =>
                        setNewFaq({ ...newFaq, category: e.target.value })
                      }
                    />
                  </div>
                  <Textarea
                    placeholder="Respuesta"
                    value={newFaq.answer}
                    onChange={(e) =>
                      setNewFaq({ ...newFaq, answer: e.target.value })
                    }
                  />
                  <Button onClick={handleAddFAQ}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar FAQ
                  </Button>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq: any) => (
                    <div key={faq.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{faq.question}</h3>
                            <Badge variant="outline">{faq.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {faq.answer}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFAQ(faq.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalles de perfil */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 rounded-2xl shadow-2xl border border-purple-500/40 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Detalles del Perfil</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCloseProfileModal}
                className="text-white hover:text-white/80"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProfile.avatar_url ? (
                  <img
                    src={selectedProfile.avatar_url}
                    alt={selectedProfile.display_name || "Usuario"}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedProfile.display_name || selectedProfile.first_name || "U").charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {selectedProfile.display_name ||
                      `${selectedProfile.first_name} ${selectedProfile.last_name}`}
                  </h4>
                  <p className="text-sm text-white/70">{selectedProfile.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">ID:</span>
                  <span className="text-white font-mono text-sm">{selectedProfile.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Verificado:</span>
                  <span className={selectedProfile.is_verified ? "text-green-400" : "text-red-400"}>
                    {selectedProfile.is_verified ? "Sí" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Premium:</span>
                  <span className={selectedProfile.is_premium ? "text-purple-400" : "text-white/70"}>
                    {selectedProfile.is_premium ? "Sí" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Registrado:</span>
                  <span className="text-white text-sm">
                    {new Date(selectedProfile.created_at).toLocaleDateString()}
                  </span>
                </div>
                {selectedProfile.last_seen && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Última vez:</span>
                    <span className="text-white text-sm">
                      {new Date(selectedProfile.last_seen).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedProfile.bio && (
                  <div>
                    <span className="text-white/70 block mb-1">Bio:</span>
                    <p className="text-white text-sm">{selectedProfile.bio}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleCloseProfileModal}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Removed default export to support tree-shaking and named imports consistency
