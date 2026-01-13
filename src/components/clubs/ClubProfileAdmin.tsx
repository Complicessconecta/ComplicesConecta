import { useState } from "react";
import { 
  Edit, 
  Image as ImageIcon, 
  Calendar, 
  Tag, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Save,
  Users,
  TrendingUp,
  Eye
} from "lucide-react";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/forms/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface ClubAnalytics {
  totalVisits: number;
  totalCheckIns: number;
  averageRating: number;
  totalReviews: number;
  weeklyVisits: number;
  monthlyVisits: number;
  topEvents: { name: string; attendees: number }[];
  demographics: { age: string; percentage: number }[];
}

interface ClubProfileAdminProps {
  analytics: ClubAnalytics;
  onSave?: (data: any) => void;
}

export const ClubProfileAdmin: React.FC<ClubProfileAdminProps> = ({
  analytics,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [saving, setSaving] = useState(false);

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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg">
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
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-6">
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Gestiona las imágenes de tu club</p>
              <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                Subir Imagen
              </Button>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Crea y gestiona tus eventos</p>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                Crear Evento
              </Button>
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="mt-6">
            <div className="text-center py-12">
              <Tag className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Configura promociones y descuentos</p>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600">
                Crear Promoción
              </Button>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">Responde a las reseñas de tus clientes</p>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
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
        </Tabs>
      </div>
    </Card>
  );
};
