import { useEffect, useRef, useState } from "react";
import { Edit, Image as ImageIcon, Calendar, Tag, BarChart3, MessageSquare, Settings, Save, Users, TrendingUp, Eye, Zap, Wallet, Flame, Lock, QrCode } from "lucide-react";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { AdminTabsContent } from "@/components/clubs/AdminTabsContent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

interface ClubAnalytics {
  totalVisits: number;
  totalCheckIns: number;
  averageRating: number;
  totalReviews: number;
  weeklyVisits: number;
  monthlyVisits: number;
  topEvents: { name: string; attendees: number }[];
  demographics: { age: string; percentage: number }[];
  cmpx_balance?: number;
  membership_tier?: "free" | "premium";
  live_status?: string;
}

interface ClubProfileAdminProps {
  analytics: ClubAnalytics;
  onSave?: (data: any) => void;
  clubId?: string;
}

export const ClubProfileAdmin: React.FC<ClubProfileAdminProps> = ({
  analytics,
  onSave,
  clubId,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('edit');
  const [saving, setSaving] = useState(false);

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedRef = useRef<{
    membership_tier: "free" | "premium";
    live_status: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    website: '',
    hours: '',
    membership_tier: (analytics.membership_tier ?? "free") as "free" | "premium",
    live_status: analytics.live_status ?? "❓ Desconocido",
    cmpx_balance: String(analytics.cmpx_balance ?? 0),
  });

  const canPersist = Boolean(clubId && clubId !== "demo");

  const persistClubPartial = async (partial: {
    membership_tier?: "free" | "premium";
    live_status?: string;
  }) => {
    if (!canPersist || !clubId) return;

    const payload: Record<string, unknown> = {};
    if (typeof partial.membership_tier !== "undefined") {
      payload.membership_tier = partial.membership_tier;
    }
    if (typeof partial.live_status !== "undefined") {
      payload.live_status = partial.live_status;
    }
    if (Object.keys(payload).length === 0) return;

    const previous = {
      membership_tier: formData.membership_tier,
      live_status: formData.live_status,
    };

    try {
      const { error } = await supabase
        .from("clubs")
        .update(payload)
        .eq("id", clubId);

      if (error) {
        throw error;
      }

      lastPersistedRef.current = {
        membership_tier:
          typeof partial.membership_tier !== "undefined"
            ? partial.membership_tier
            : previous.membership_tier,
        live_status:
          typeof partial.live_status !== "undefined"
            ? partial.live_status
            : previous.live_status,
      };
    } catch (error) {
      setFormData((prev) => ({
        ...prev,
        membership_tier: previous.membership_tier,
        live_status: previous.live_status,
      }));

      toast({
        title: "No se pudo guardar",
        description:
          error instanceof Error ? error.message : "Error al actualizar el club",
        variant: "destructive",
      });
    }
  };

  const schedulePersist = (partial: {
    membership_tier?: "free" | "premium";
    live_status?: string;
  }) => {
    if (!canPersist) return;
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      void persistClubPartial(partial);
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "live_status") {
      schedulePersist({ live_status: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave({
          ...formData,
          cmpx_balance: Number(formData.cmpx_balance),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const setFormDataWithPersist: React.Dispatch<React.SetStateAction<typeof formData>> = (
    next,
  ) => {
    setFormData((prev) => {
      const resolved = typeof next === "function" ? (next as any)(prev) : next;

      if (resolved.membership_tier !== prev.membership_tier) {
        schedulePersist({ membership_tier: resolved.membership_tier });
      }
      if (resolved.live_status !== prev.live_status) {
        schedulePersist({ live_status: resolved.live_status });
      }

      return resolved;
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-r from-indigo-500 to-violet-500 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Panel de Administración</h3>
              <p className="text-white/60 text-sm">Gestiona tu perfil de club</p>
            </div>
          </div>

          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Solo Dueño
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/10 border border-white/20 w-full justify-start">
            <TabsTrigger value="edit" className="data-[state=active]:bg-white/20">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-white/20">
              <ImageIcon className="h-4 w-4 mr-2" />
              Imágenes
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="promotions" className="data-[state=active]:bg-white/20">
              <Tag className="h-4 w-4 mr-2" />
              Promociones
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white/20">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reseñas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="economy" className="data-[state=active]:bg-white/20">
              <Wallet className="h-4 w-4 mr-2" />
              Economía
            </TabsTrigger>
            <TabsTrigger value="access_qr" className="data-[state=active]:bg-white/20">
              <QrCode className="h-4 w-4 mr-2" />
              Acceso QR
            </TabsTrigger>
            <TabsTrigger value="demo" className="data-[state=active]:bg-white/20">
              <Zap className="h-4 w-4 mr-2" />
              Simulador Demo
            </TabsTrigger>
            <TabsTrigger value="pro" className="data-[state=active]:bg-white/20">
              <Zap className="h-4 w-4 mr-2" />
              Gestión Pro
            </TabsTrigger>
          </TabsList>

          {/* Edit Profile Tab */}
          <TabsContent value="edit" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nombre del Club</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Nombre de tu club"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="+52 123 456 7890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="contacto@club.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white">Sitio Web</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="https://www.club.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-white">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Calle, número, colonia"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Ciudad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-white">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Estado"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="text-white">Horarios</Label>
                <Input
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Lun-Dom: 20:00 - 06:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white min-h-[120px]"
                  placeholder="Describe tu club, ambiente, música, etc."
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="economy" className="mt-6">
            <AdminTabsContent
              tab="economy"
              clubData={formData}
              setClubData={setFormDataWithPersist}
            />
          </TabsContent>

          <TabsContent value="access_qr" className="mt-6">
            <AdminTabsContent
              tab="access_qr"
              clubData={formData}
              setClubData={setFormDataWithPersist}
            />
          </TabsContent>

          <TabsContent value="demo" className="mt-6">
            <AdminTabsContent tab="demo" clubData={formData} setClubData={setFormDataWithPersist} />
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-6">
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Gestiona las imágenes de tu club</p>
              <Button className="bg-linear-to-r from-purple-600 to-fuchsia-600">
                Subir Imagen
              </Button>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Crea y gestiona tus eventos</p>
              <Button className="bg-linear-to-r from-blue-600 to-cyan-600">
                Crear Evento
              </Button>
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="mt-6">
            <div className="text-center py-12">
              <Tag className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Configura promociones y descuentos</p>
              <Button className="bg-linear-to-r from-yellow-600 to-orange-600">
                Crear Promoción
              </Button>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Responde a las reseñas de tus clientes</p>
              <Button className="bg-linear-to-r from-green-600 to-emerald-600">
                Ver Reseñas
              </Button>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-white/60 text-sm">Visitas Totales</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalVisits}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="h-5 w-5 text-green-400" />
                  <span className="text-white/60 text-sm">Check-ins</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.totalCheckIns}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <span className="text-white/60 text-sm">Rating</span>
                </div>
                <p className="text-2xl font-bold text-white">{analytics.averageRating.toFixed(1)}</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4">Visitas Semanales</h4>
                <p className="text-3xl font-bold text-blue-400">{analytics.weeklyVisits}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4">Visitas Mensuales</h4>
                <p className="text-3xl font-bold text-purple-400">{analytics.monthlyVisits}</p>
              </div>
            </div>
          </TabsContent>

          {/* Pro Management Tab */}
          <TabsContent value="pro" className="mt-6">
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  Configuración Técnica
                </h4>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData((prev) => {
                          schedulePersist({ membership_tier: "free" });
                          return { ...prev, membership_tier: "free" };
                        })
                      }
                      className={
                        formData.membership_tier === "free"
                          ? "bg-purple-600/30 border-purple-500/40 text-white"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }
                    >
                      Tier: Free
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData((prev) => {
                          schedulePersist({ membership_tier: "premium" });
                          return { ...prev, membership_tier: "premium" };
                        })
                      }
                      className={
                        formData.membership_tier === "premium"
                          ? "bg-yellow-500/20 border-yellow-500/40 text-white"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }
                    >
                      Tier: Premium
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="live_status_pro" className="text-white">Visibilidad (Vibe)</Label>
                    <Input
                      id="live_status_pro"
                      name="live_status"
                      value={formData.live_status}
                      onChange={handleChange}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Vibe Status Selector */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Estado en Vivo
                </h4>

                <p className="text-white/60 text-sm mb-4">
                  Actualiza el estado actual de tu club para que los usuarios sepan qué esperar.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, live_status: "❓ Desconocido" }))
                    }
                    className="flex flex-col items-center gap-2 h-auto py-4 bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  >
                    <span className="text-2xl">❓</span>
                    <span className="text-xs">Desconocido</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, live_status: "🔥 On Fire" }))
                    }
                    className="flex flex-col items-center gap-2 h-auto py-4 bg-red-600/20 border-red-500/30 hover:bg-red-600/30 text-white"
                  >
                    <span className="text-2xl">🔥</span>
                    <span className="text-xs">Pista Llena</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, live_status: "🍸 Chill" }))
                    }
                    className="flex flex-col items-center gap-2 h-auto py-4 bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30 text-white"
                  >
                    <span className="text-2xl">🍸</span>
                    <span className="text-xs">Chill</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, live_status: "🎉 Packed" }))
                    }
                    className="flex flex-col items-center gap-2 h-auto py-4 bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/30 text-white"
                  >
                    <span className="text-2xl">🎉</span>
                    <span className="text-xs">Packed</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, live_status: "🤫 Tranquilo" }))
                    }
                    className="flex flex-col items-center gap-2 h-auto py-4 bg-green-600/20 border-green-500/30 hover:bg-green-600/30 text-white"
                  >
                    <span className="text-2xl">🤫</span>
                    <span className="text-xs">Tranquilo</span>
                  </Button>
                </div>

                <div className="mt-4 p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <p className="text-orange-300 text-xs">
                    🎨 El color del perfil cambiará según el estado seleccionado (Rojo para 🔥, Azul para 🍸, etc.)
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-white/10 border-white/20 text-white/80">
                    live_status
                  </Badge>
                  <span className="text-white/80 text-sm">{formData.live_status}</span>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-400" />
                  Deslinde Legal
                </h4>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1" defaultChecked />
                    <span className="text-white/80 text-xs">
                      <strong>Cláusula de Responsabilidad Limitada:</strong> CómplicesConecta actúa exclusivamente como Tercero Facilitador. NO es responsable de incidentes, quejas o demandas dentro de las instalaciones del club.
                    </span>
                  </label>

                  <p className="text-red-400 text-xs">
                    ⚠️ Al marcar esta casilla, el Club acepta que la App es solo un canal de gestión y marketing.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
