import type { FC } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

const Events: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-600">
            Próximos Eventos
          </h1>
          <p className="text-gray-400 text-lg">
            Descubre las experiencias exclusivas de la comunidad.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-purple-300">
                <Calendar className="w-5 h-5" />
                Fiesta de Máscaras VIP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Ciudad de México, Polanco</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>50 cupos</span>
                </div>
              </div>
              <p className="text-gray-400">
                Una noche de misterio y elegancia exclusiva para miembros
                verificados. Código de vestimenta: Formal con antifaz.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Ver Detalles <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-fuchsia-300">
                <Calendar className="w-5 h-5" />
                Workshop: Seguridad y Consentimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Online (Zoom)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>Ilimitado</span>
                </div>
              </div>
              <p className="text-gray-400">
                Aprende las mejores prácticas para navegar el estilo de vida de
                manera segura. Impartido por expertos en la comunidad.
              </p>
              <Button
                variant="outline"
                className="w-full border-purple-500/50 hover:bg-purple-900/20"
              >
                Inscribirse Gratis <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Events;
