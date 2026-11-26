import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons/Button";
import { MapPin, CheckCircle, Crown, Heart, MessageCircle, Edit, User } from "lucide-react";

interface SingleProfile {
  id: string;
  first_name: string;
  last_name?: string;
  age: number;
  gender: string;
  bio?: string | null;
  location?: string;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  isOnline?: boolean;
}

interface SingleProfileHeaderProps {
  profile: SingleProfile;
  onEdit?: () => void;
  onMessage?: () => void;
  onLike?: () => void;
}

// Tema por género (misma paleta que CoupleProfileHeader: masculino usa el
// degradado azul de "man-man", femenino el morado de "woman-woman").
const getGenderTheme = (gender: string) => {
  if (gender === "male") {
    return {
      gradient: "from-blue-500 to-indigo-600",
      badge: "bg-blue-500",
      border: "border-blue-300",
      text: "text-blue-600",
      hover: "hover:bg-blue-50",
      accent: "bg-linear-to-r from-blue-400 to-indigo-500",
      avatarBg: "from-blue-400 to-indigo-600",
    };
  }
  return {
    gradient: "from-purple-600 to-blue-600",
    badge: "bg-purple-600",
    border: "border-purple-300",
    text: "text-purple-700",
    hover: "hover:bg-purple-50",
    accent: "bg-linear-to-r from-purple-600 to-blue-600",
    avatarBg: "from-purple-600 to-blue-600",
  };
};

const getGenderDisplayName = (gender: string) => {
  return gender === "male" ? "Perfil Masculino" : "Perfil Femenino";
};

const SingleProfileHeader: React.FC<SingleProfileHeaderProps> = ({
  profile,
  onEdit,
  onMessage,
  onLike,
}) => {
  const theme = getGenderTheme(profile.gender);
  const genderDisplayName = getGenderDisplayName(profile.gender);
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bg-white dark:bg-white/10 backdrop-blur-md border-slate-200 dark:border-white/20 text-slate-900 dark:text-white rounded-lg p-6">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
        {/* Avatar Section */}
        <div className="relative">
          {/* Avatar individual */}
          <div className="flex mb-2">
            <div
              className={`w-24 h-24 rounded-full bg-linear-to-br ${theme.avatarBg} flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20 shadow-lg`}
            >
              {profile.first_name?.[0]?.toUpperCase() || "P"}
            </div>
          </div>

          {/* Status Badges */}
          <div className="absolute -top-2 -right-2 flex flex-col gap-1">
            {profile.is_verified && (
              <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
            {profile.is_premium && (
              <div className="bg-yellow-500 rounded-full p-1 shadow-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex-1 text-center lg:text-left">
          {/* Name & Type */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/80 bg-clip-text text-transparent stable-element">
              {fullName}
            </h1>
            <Badge className={`${theme.badge} text-white mb-2`}>
              <User className="w-3 h-3 mr-1" />
              {genderDisplayName}
            </Badge>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/5 dark:bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <p className="text-slate-600 dark:text-white/80 text-sm">
                {profile.age} años • {profile.gender}
              </p>
            </div>
          </div>

          {/* Location & Status Badges */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
            {profile.location && (
              <Badge
                variant="secondary"
                className="bg-slate-900/10 dark:bg-white/20 text-slate-800 dark:text-white border-slate-300 dark:border-white/30 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                {profile.location}
              </Badge>
            )}
            {profile.isOnline && (
              <Badge className="bg-green-500 text-white">En línea</Badge>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-slate-700 dark:text-white/90">
                Sobre mí
              </h4>
              <p className="text-slate-600 dark:text-white/80 leading-relaxed bg-slate-900/5 dark:bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {onEdit && (
              <Button
                onClick={onEdit}
                className={`${theme.accent} hover:opacity-90 text-white shadow-md transition-all duration-200`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
            {onMessage && (
              <Button
                onClick={onMessage}
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-100 dark:border-white/30 dark:text-white dark:hover:bg-white/10 backdrop-blur-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Mensaje
              </Button>
            )}
            {onLike && (
              <Button
                onClick={onLike}
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-100 dark:border-white/30 dark:text-white dark:hover:bg-white/10 backdrop-blur-sm"
              >
                <Heart className="w-4 h-4 mr-2" />
                Me gusta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProfileHeader;
