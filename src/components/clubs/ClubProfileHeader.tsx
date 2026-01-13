import { Building, MapPin, Phone, Globe, Clock, Star, CheckCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/cards/Card";
import type { Club } from "@/entities/club";

interface ClubProfileHeaderProps {
  club: Club;
  isOwner?: boolean;
  onEdit?: () => void;
}

export const ClubProfileHeader: React.FC<ClubProfileHeaderProps> = ({
  club,
  isOwner = false,
  onEdit,
}) => {
  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-br from-purple-600 to-fuchsia-600">
        {club.cover_image_url ? (
          <img
            src={club.cover_image_url}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="h-24 w-24 text-white/40" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {club.is_active && (
            <Badge className="bg-green-500/90 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          )}
          {club.is_featured && (
            <Badge className="bg-yellow-500/90 text-black">
              <Award className="h-3 w-3 mr-1" />
              Destacado
            </Badge>
          )}
          {club.verified_at && (
            <Badge className="bg-blue-500/90 text-white">
              <Star className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          )}
        </div>

        {/* Edit Button (Owner Only) */}
        {isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Editar Perfil
          </button>
        )}
      </div>

      {/* Club Info */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl">
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="h-16 w-16 text-white/60" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{club.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="text-white font-semibold">
                  {club.rating_average.toFixed(1)}
                </span>
              </div>
              <span className="text-white/60">
                ({club.rating_count} reseñas)
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">
                {club.check_in_count} check-ins
              </span>
            </div>

            {/* Description */}
            {club.description && (
              <p className="text-white/80 mb-4 line-clamp-2">
                {club.description}
              </p>
            )}

            {/* Location & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4 text-purple-400" />
                <span>
                  {club.address}, {club.city}
                  {club.state && `, ${club.state}`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Phone className="h-4 w-4 text-purple-400" />
                <span>Teléfono disponible</span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>Horarios disponibles</span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Globe className="h-4 w-4 text-purple-400" />
                <span>Website disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
